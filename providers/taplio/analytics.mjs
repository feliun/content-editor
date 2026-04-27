#!/usr/bin/env node
/**
 * Taplio analytics provider.
 *
 * Usage: node providers/taplio/analytics.mjs <config.json> [--days 7|30|90|all]
 *
 * Scrapes Taplio's analytics dashboard, writes structured metrics to the
 * configured `analytics_output` path, and emits a final JSON-Lines summary.
 *
 * stdout: JSON Lines (single final summary line).
 * stderr: human-readable progress logs.
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { resolve, isAbsolute, dirname, join } from 'path';

// ---------------------------------------------------------------------------
// Args + config
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const configPath = args.find((a) => a.endsWith('.json'));
if (!configPath) {
  process.stderr.write('Usage: analytics.mjs <config.json> [--days 7|30|90|all]\n');
  process.exit(2);
}
const config = JSON.parse(readFileSync(configPath, 'utf-8'));
const workspace = config.workspace || process.cwd();
const language = config.language || 'en';
const localeDays = (config.locales && config.locales.days) || [];
const taplioCfg = config.taplio || {};

const daysIdx = args.indexOf('--days');
let periodDays = 30;
if (daysIdx !== -1 && args[daysIdx + 1]) {
  const v = args[daysIdx + 1].toLowerCase();
  periodDays = v === 'all' ? 'all' : parseInt(v, 10);
}

const sessionFile = absolutise(
  taplioCfg.session_file || '.content-editor/taplio-session.json',
  workspace
);
const screenshotsDir = absolutise(
  taplioCfg.screenshots_dir || '.content-editor/taplio-screenshots',
  workspace
);
mkdirSync(screenshotsDir, { recursive: true });

const outputPath = absolutise(
  config.analytics_output || join(workspace, 'outputs/content/analytics.json'),
  workspace
);

function absolutise(p, base) {
  return isAbsolute(p) ? p : resolve(base, p);
}

// ---------------------------------------------------------------------------
// Day-name helpers
// ---------------------------------------------------------------------------

const BUILT_IN = {
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  es: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
  pt: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'],
};

// JS getDay(): 0=Sun..6=Sat. We want Monday..Sunday in the output.
function dayLabel(jsDay) {
  // First try the locale list from config (Mon..Fri only typically).
  const monIdx = (jsDay + 6) % 7; // 0=Mon..6=Sun
  if (localeDays[monIdx]) return localeDays[monIdx];
  const weekArr = BUILT_IN[language] || BUILT_IN.en;
  return weekArr[monIdx];
}

function emit(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}
function log(msg) {
  process.stderr.write(msg + '\n');
}

// ---------------------------------------------------------------------------
// Numeric helpers
// ---------------------------------------------------------------------------

function parseNumber(text) {
  if (!text) return 0;
  return parseInt(text.replace(/,/g, '').trim(), 10) || 0;
}
function parsePercentage(text) {
  if (!text) return 0;
  return parseFloat(text.replace('%', '').replace(/,/g, '').trim()) || 0;
}
function parseDate(cellText) {
  if (!cellText) return null;
  const m = cellText.match(/(\d{4}\/\d{2}\/\d{2})/);
  return m ? m[1].replace(/\//g, '-') : null;
}
function periodButtonLabel(d) {
  if (d === 7) return '7d';
  if (d === 30) return '30d';
  if (d === 90) return '90d';
  return 'All';
}
function periodDisplayLabel(d) {
  return d === 'all' ? 'All time' : `Last ${d} days`;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

log(`📊 Fetching Taplio analytics (${periodDisplayLabel(periodDays)})…`);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: sessionFile });
const page = await context.newPage();

try {
  await page.goto('https://app.taplio.com/analytics?tab=posts', {
    waitUntil: 'domcontentloaded', timeout: 15000,
  });
  await page.waitForTimeout(3000);

  if (page.url().includes('login')) {
    throw new Error('session expired');
  }

  const label = periodButtonLabel(periodDays);
  if (label !== '30d') {
    const periodBtn = page.locator(`button:text-is("${label}")`);
    if (await periodBtn.count() > 0) {
      await periodBtn.first().click();
      await page.waitForTimeout(2000);
    }
  }

  await page.waitForSelector('table', { timeout: 10000 });
  await page.waitForTimeout(1000);

  const headerMap = await page.evaluate(() => {
    const ths = document.querySelectorAll('table th');
    const map = {};
    Array.from(ths).forEach((th, i) => {
      const text = th.innerText.trim().toLowerCase();
      if (text) map[text] = i;
    });
    return map;
  });

  const ix = {
    date: headerMap['date'] ?? 1,
    content: headerMap['content'] ?? 3,
    impressions: headerMap['impr.'] ?? 4,
    reactions: headerMap['react.'] ?? 5,
    comments: headerMap['comm.'] ?? 6,
    reposts: headerMap['repo.'] ?? 7,
    engagement: headerMap['engag.'] ?? 8,
    engagementPct: headerMap['engag.%'] ?? 9,
  };

  const allPosts = [];
  let currentPage = 1;

  while (true) {
    const rows = await page.evaluate(() => {
      const trs = Array.from(document.querySelectorAll('table tr'));
      return trs.slice(1).map((tr) =>
        Array.from(tr.querySelectorAll('td')).map((td) => td.innerText.trim())
      );
    });

    for (const cells of rows) {
      if (cells.length < 10) continue;
      const date = parseDate(cells[ix.date]);
      if (!date) continue;
      const dateObj = new Date(date + 'T12:00:00');
      allPosts.push({
        date,
        day_of_week: dayLabel(dateObj.getDay()),
        content_preview: cells[ix.content] || '',
        impressions: parseNumber(cells[ix.impressions]),
        likes: parseNumber(cells[ix.reactions]),
        comments: parseNumber(cells[ix.comments]),
        reposts: parseNumber(cells[ix.reposts]),
        engagement: parseNumber(cells[ix.engagement]),
        engagement_rate: parsePercentage(cells[ix.engagementPct]),
      });
    }

    const nextNum = currentPage + 1;
    const nextBtn = page.locator(`button:text-is("${nextNum}")`);
    if (await nextBtn.count() > 0) {
      await nextBtn.first().click();
      await page.waitForTimeout(2000);
      currentPage = nextNum;
    } else {
      break;
    }
  }

  log(`📋 Found ${allPosts.length} posts across ${currentPage} page${currentPage > 1 ? 's' : ''}.`);

  // Summary
  const totalPosts = allPosts.length;
  let avgImpressions = 0;
  let avgEngagementRate = 0;
  let bestDay = 'N/A';
  let worstDay = 'N/A';
  let bestPost = { date: 'N/A', engagement_rate: 0 };
  const topPatterns = [];

  if (totalPosts > 0) {
    avgImpressions = Math.round(
      allPosts.reduce((s, p) => s + p.impressions, 0) / totalPosts
    );
    avgEngagementRate = parseFloat(
      (allPosts.reduce((s, p) => s + p.engagement_rate, 0) / totalPosts).toFixed(2)
    );

    const sortedByER = [...allPosts].sort(
      (a, b) => b.engagement_rate - a.engagement_rate
    );
    bestPost = {
      date: sortedByER[0].date,
      engagement_rate: sortedByER[0].engagement_rate,
    };

    const dayStats = {};
    const dayImpr = {};
    for (const p of allPosts) {
      (dayStats[p.day_of_week] ||= { total: 0, count: 0 });
      (dayImpr[p.day_of_week]  ||= { total: 0, count: 0 });
      dayStats[p.day_of_week].total += p.engagement_rate;
      dayStats[p.day_of_week].count += 1;
      dayImpr[p.day_of_week].total  += p.impressions;
      dayImpr[p.day_of_week].count  += 1;
    }

    const dayAvgs = Object.entries(dayStats)
      .map(([day, s]) => ({ day, avg: s.total / s.count }))
      .sort((a, b) => b.avg - a.avg);

    if (dayAvgs.length > 0) {
      bestDay = dayAvgs[0].day;
      worstDay = dayAvgs[dayAvgs.length - 1].day;
      const worst = dayAvgs[dayAvgs.length - 1].avg;
      if (dayAvgs.length > 1 && worst > 0) {
        const mult = (dayAvgs[0].avg / worst).toFixed(1);
        topPatterns.push(
          `${bestDay} averages ${mult}x the engagement of ${worstDay}.`
        );
      }
    }

    const shortPosts = allPosts.filter((p) => p.content_preview.length < 80);
    const longPosts = allPosts.filter((p) => p.content_preview.length >= 80);
    if (shortPosts.length > 0 && longPosts.length > 0) {
      const shortAvg = (
        shortPosts.reduce((s, p) => s + p.engagement_rate, 0) / shortPosts.length
      ).toFixed(1);
      const longAvg = (
        longPosts.reduce((s, p) => s + p.engagement_rate, 0) / longPosts.length
      ).toFixed(1);
      if (parseFloat(longAvg) > parseFloat(shortAvg)) {
        topPatterns.push(
          `Longer posts average ${longAvg}% engagement vs ${shortAvg}% for shorter ones.`
        );
      } else {
        topPatterns.push(
          `Shorter posts average ${shortAvg}% engagement vs ${longAvg}% for longer ones.`
        );
      }
    }

    const dayImpAvgs = Object.entries(dayImpr)
      .map(([day, s]) => ({ day, avg: Math.round(s.total / s.count) }))
      .sort((a, b) => b.avg - a.avg);
    if (dayImpAvgs.length > 0) {
      topPatterns.push(
        `${dayImpAvgs[0].day} has the highest average impressions (${dayImpAvgs[0].avg}).`
      );
    }
  }

  const output = {
    last_updated: new Date().toISOString(),
    period_days: periodDays === 'all' ? 0 : periodDays,
    posts: allPosts,
    summary: {
      total_posts: totalPosts,
      avg_impressions: avgImpressions,
      avg_engagement_rate: avgEngagementRate,
      best_day: bestDay,
      worst_day: worstDay,
      best_post: bestPost,
      top_patterns: topPatterns,
    },
  };

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

  log(`✅ Analytics saved to ${outputPath}`);

  emit({
    summary: {
      total_posts: totalPosts,
      avg_impressions: avgImpressions,
      avg_engagement_rate: avgEngagementRate,
      best_day: bestDay,
    },
  });

  process.exit(0);
} catch (err) {
  const msg = (err && err.message) || String(err);
  log(`❌ Error: ${msg}`);
  try {
    await page.screenshot({
      path: join(screenshotsDir, 'error-analytics.png'),
      fullPage: true,
    });
  } catch {}
  emit({ summary: { error: msg } });
  process.exit(1);
} finally {
  await browser.close();
}
