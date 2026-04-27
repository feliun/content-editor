#!/usr/bin/env node
/**
 * Taplio verify helper. Smoke-tests the configured session by loading the
 * post-schedule view and saving screenshots.
 *
 * Usage: node providers/taplio/verify.mjs <config.json>
 */

import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'fs';
import { resolve, isAbsolute, join } from 'path';

const [, , configPath] = process.argv;
if (!configPath) {
  process.stderr.write('Usage: verify.mjs <config.json>\n');
  process.exit(2);
}

const config = JSON.parse(readFileSync(configPath, 'utf-8'));
const workspace = config.workspace || process.cwd();
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

function absolutise(p, base) {
  return isAbsolute(p) ? p : resolve(base, p);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: sessionFile });
const page = await context.newPage();

await page.goto('https://app.taplio.com/post-schedule?view=day&type=schedule', {
  waitUntil: 'domcontentloaded', timeout: 15000,
});
await page.waitForTimeout(4000);
await page.screenshot({ path: join(screenshotsDir, '30-verify-schedule.png'), fullPage: true });

await page.goto('https://app.taplio.com/post-schedule?view=week&type=schedule', {
  waitUntil: 'domcontentloaded', timeout: 15000,
});
await page.waitForTimeout(4000);
await page.screenshot({ path: join(screenshotsDir, '31-verify-week.png'), fullPage: true });

await browser.close();
process.stderr.write(`✅ Screenshots saved to ${screenshotsDir}\n`);
