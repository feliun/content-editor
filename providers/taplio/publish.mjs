#!/usr/bin/env node
/**
 * Taplio publish provider.
 *
 * Usage: node providers/taplio/publish.mjs <content-file> <config.json>
 *
 * Reads a LinkedIn content file (e.g. outputs/content/Linkedin-DD-MM-YYYY.md),
 * parses the per-day posts (clean or rich format), and schedules each one in
 * Taplio at the configured time.
 *
 * stdout: JSON Lines (one event per scheduled post + final summary).
 * stderr: human-readable progress logs.
 */

import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'fs';
import { resolve, isAbsolute, dirname, join } from 'path';

// ---------------------------------------------------------------------------
// Args + config
// ---------------------------------------------------------------------------

const [, , contentFileArg, configPathArg] = process.argv;
if (!contentFileArg || !configPathArg) {
  process.stderr.write('Usage: publish.mjs <content-file> <config.json>\n');
  process.exit(2);
}

const config = JSON.parse(readFileSync(configPathArg, 'utf-8'));
const workspace = config.workspace || process.cwd();
const language = config.language || 'en';
const localeDays = (config.locales && config.locales.days) || [];
const localeShort = (config.locales && config.locales.short) || [];
const scheduleCfg = config.schedule || {};
const defaultTime = scheduleCfg.default_time || '09:15';
const taplioCfg = config.taplio || {};

const sessionFile = absolutise(
  taplioCfg.session_file || '.content-editor/taplio-session.json',
  workspace
);
const screenshotsDir = absolutise(
  taplioCfg.screenshots_dir || '.content-editor/taplio-screenshots',
  workspace
);
mkdirSync(screenshotsDir, { recursive: true });

const contentFile = absolutise(contentFileArg, process.cwd());

function absolutise(p, base) {
  return isAbsolute(p) ? p : resolve(base, p);
}

// ---------------------------------------------------------------------------
// Day-name parsing (en/es/pt + any custom locale via config.locales)
// ---------------------------------------------------------------------------

// Built-in day arrays: index 0 = Monday … index 4 = Friday. The provider
// tolerates English / Spanish / Portuguese day labels in any input file
// regardless of the configured language; custom locales contribute via
// config.locales.days / config.locales.short.
const BUILT_IN = {
  en: { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        short: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
  es: { days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
        short: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'] },
  pt: { days: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
        short: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'] },
};

// Build a map of label (lowercased, accent-stripped) -> index 0..4 (Mon..Fri).
const DAY_INDEX = {};
function addLabel(label, idx) {
  if (!label) return;
  DAY_INDEX[normalise(label)] = idx;
}
for (const { days, short } of Object.values(BUILT_IN)) {
  days.forEach((d, i) => addLabel(d, i));
  short.forEach((d, i) => addLabel(d, i));
}
localeDays.forEach((d, i) => addLabel(d, i));
localeShort.forEach((d, i) => addLabel(d, i));

function normalise(s) {
  return s
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

// Pick the canonical short label for the configured language so the JSON-lines
// output is consistent regardless of which locale the source file used.
function canonicalShort(idx) {
  const fromConfig = localeShort[idx];
  if (fromConfig) return fromConfig;
  const builtin = BUILT_IN[language];
  if (builtin) return builtin.short[idx];
  return BUILT_IN.en.short[idx];
}

// ---------------------------------------------------------------------------
// Scheduling helpers
// ---------------------------------------------------------------------------

// Map our 0..4 (Mon..Fri) onto JS getDay() (0=Sun..6=Sat).
const JS_WEEKDAY = [1, 2, 3, 4, 5];

function nextOccurrenceFromTomorrow(targetIdx) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDay = today.getDay();
  const target = JS_WEEKDAY[targetIdx];
  let daysAhead = target - todayDay;
  if (daysAhead <= 0) daysAhead += 7;
  const result = new Date(today);
  result.setDate(result.getDate() + daysAhead);
  return result;
}

function combineDateAndTime(date, hhmm) {
  const [hh, mm] = hhmm.split(':').map(Number);
  const out = new Date(date);
  out.setHours(hh, mm, 0, 0);
  return out;
}

function taplioDateInput(date, hhmm) {
  // Taplio's input expects MM/DD/YYYY h:mm A.
  const [hh, mm] = hhmm.split(':').map(Number);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const y = date.getFullYear();
  const ampm = hh < 12 ? 'AM' : 'PM';
  const h12 = ((hh + 11) % 12) + 1;
  return `${m}/${d}/${y} ${h12}:${String(mm).padStart(2, '0')} ${ampm}`;
}

function scheduledIso(date, hhmm) {
  return combineDateAndTime(date, hhmm).toISOString();
}

// ---------------------------------------------------------------------------
// Content parsing (clean + rich formats)
// ---------------------------------------------------------------------------

function parsePosts(md) {
  const posts = [];
  // Sections start at H1 or H2.
  const sections = md.split(/^#{1,2} /m).filter(Boolean);
  for (const section of sections) {
    const firstLine = section.split('\n')[0].trim();
    // First word/phrase before the first non-letter character (e.g. "Lunes", "Mon", "Wed —")
    const head = firstLine.split(/[^\p{L}]+/u, 1)[0];
    const idx = DAY_INDEX[normalise(head)];
    if (idx === undefined) continue;
    const dateObj = nextOccurrenceFromTomorrow(idx);

    // Rich format: only the "### ✏️ Main content" subsection is publishable.
    const mainHeadingRe = /^###\s+✏️\s*Main content/m;
    let body;
    const mainPos = section.search(mainHeadingRe);
    if (mainPos !== -1) {
      const after = section.substring(mainPos).split('\n').slice(1).join('\n');
      body = after.replace(/\n---[\s\S]*$/, '').trim();
    } else {
      body = section.split('\n').slice(1).join('\n').trim();
    }
    body = body.replace(/\n*^[-─━]{3,}\s*$/m, '').trim();

    posts.push({
      idx,
      shortLabel: canonicalShort(idx),
      date: dateObj,
      content: body,
    });
  }
  return posts;
}

// ---------------------------------------------------------------------------
// Modal dismissal — Taplio occasionally shows promo/upsell overlays that
// intercept clicks. Best-effort dismissal: Escape, then close-button clicks.
// ---------------------------------------------------------------------------

// Taplio renders a Pro-plan upsell modal ~5-8 seconds after dashboard load.
// The close button is `button[aria-label="Close"]` inside `.chakra-modal__content`.
// We wait up to 12s for it to appear; if it does, click it. If it never shows
// (some sessions skip the upsell), proceed without action.
async function dismissBlockingModals(page) {
  try {
    const closeBtn = page.locator('.chakra-modal__close-btn, button[aria-label="Close"]').first();
    await closeBtn.waitFor({ state: 'visible', timeout: 12000 });
    await closeBtn.click({ timeout: 3000, force: true });
    await page.waitForTimeout(800);
  } catch {
    // Modal never appeared, or already dismissed — fine.
  }
}

// ---------------------------------------------------------------------------
// stdout helpers
// ---------------------------------------------------------------------------

function emit(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}
function log(msg) {
  process.stderr.write(msg + '\n');
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const md = readFileSync(contentFile, 'utf-8');
const posts = parsePosts(md).sort((a, b) => a.date - b.date);

if (posts.length === 0) {
  log('No future posts to schedule.');
  emit({ summary: { scheduled: 0, failed: 0 } });
  process.exit(0);
}

log(`📅 ${posts.length} posts to schedule (provider: taplio):`);
for (const p of posts) {
  const ds = p.date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  log(`   ${p.shortLabel} → ${ds} at ${defaultTime}`);
}

let scheduled = 0;
let failed = 0;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: sessionFile });

for (const post of posts) {
  const page = await context.newPage();
  const dateStr = taplioDateInput(post.date, defaultTime);
  const isoAt = scheduledIso(post.date, defaultTime);

  log(`🔄 ${post.shortLabel} — scheduling…`);

  try {
    await page.goto('https://app.taplio.com/dashboard', {
      waitUntil: 'domcontentloaded', timeout: 15000,
    });
    if (page.url().includes('/login')) {
      throw new Error('session expired');
    }
    await page.waitForTimeout(3000);
    await dismissBlockingModals(page);
    await page.locator('button:has-text("Write a Post")').first().click();
    await page.waitForTimeout(3000);

    const textarea = page.locator(
      'textarea[placeholder="Write your LinkedIn post here..."]'
    );
    await textarea.fill(post.content);
    await page.waitForTimeout(1000);

    await page.locator('button[aria-label="More scheduling options"]').click();
    await page.waitForTimeout(1500);
    await page
      .locator('.chakra-portal button:text-is("Schedule")')
      .first()
      .click({ force: true });
    await page.waitForTimeout(2000);

    const dateInput = page.locator('input[type="text"]').first();
    await dateInput.click();
    await page.waitForTimeout(1000);

    const dayCell = page
      .locator(`td.rdtDay:text-is("${post.date.getDate()}")`)
      .first();
    if (await dayCell.count() > 0) {
      await dayCell.click();
      await page.waitForTimeout(500);
    }

    await page.evaluate((target) => {
      const input = document.querySelector('input[type="text"]');
      if (!input) return;
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      ).set;
      setter.call(input, target);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, dateStr);
    await page.waitForTimeout(500);

    await page
      .locator('.chakra-portal button:text-is("Schedule")')
      .first()
      .click({ force: true });
    await page.waitForTimeout(3000);

    const editorOpen = await page
      .locator('textarea[placeholder="Write your LinkedIn post here..."]')
      .count();

    if (editorOpen === 0) {
      emit({ day: post.shortLabel, scheduled_at: isoAt, status: 'ok' });
      scheduled++;
      log(`   ✅ Scheduled ${post.shortLabel} at ${isoAt}`);
    } else {
      const reason = 'editor did not close after schedule click';
      emit({ day: post.shortLabel, status: 'failed', reason });
      failed++;
      log(`   ⚠️  ${post.shortLabel} failed: ${reason}`);
      try {
        await page.screenshot({
          path: join(screenshotsDir, `warn-${post.shortLabel}.png`),
          fullPage: true,
        });
      } catch {}
    }
  } catch (err) {
    const reason = (err && err.message ? err.message : String(err)).split('\n')[0];
    emit({ day: post.shortLabel, status: 'failed', reason });
    failed++;
    log(`   ❌ ${post.shortLabel} failed: ${reason}`);
    try {
      await page.screenshot({
        path: join(screenshotsDir, `error-${post.shortLabel}.png`),
        fullPage: true,
      });
    } catch {}
  } finally {
    await page.close();
  }
}

await browser.close();

emit({ summary: { scheduled, failed } });
process.exit(failed > 0 ? 1 : 0);
