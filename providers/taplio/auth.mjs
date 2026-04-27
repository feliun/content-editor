#!/usr/bin/env node
/**
 * Taplio auth helper.
 *
 * Usage: node providers/taplio/auth.mjs <config.json>
 *
 * Opens a Chromium window so the user can log into Taplio interactively.
 * Persists the Playwright session to the configured `taplio.session_file`
 * (default: <workspace>/.content-editor/taplio-session.json).
 */

import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'fs';
import { resolve, isAbsolute, dirname } from 'path';

const [, , configPath] = process.argv;
if (!configPath) {
  process.stderr.write('Usage: auth.mjs <config.json>\n');
  process.exit(2);
}

const config = JSON.parse(readFileSync(configPath, 'utf-8'));
const workspace = config.workspace || process.cwd();
const taplioCfg = config.taplio || {};
const sessionFile = absolutise(
  taplioCfg.session_file || '.content-editor/taplio-session.json',
  workspace
);
mkdirSync(dirname(sessionFile), { recursive: true });

function absolutise(p, base) {
  return isAbsolute(p) ? p : resolve(base, p);
}

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

await page.goto('https://app.taplio.com');
process.stderr.write('🔐 Log into Taplio in the browser window. Session saves automatically once you reach the dashboard.\n');

const maxWait = 120_000;
const start = Date.now();
let detectedDashboard = false;
while (Date.now() - start < maxWait) {
  const url = page.url();
  if (url.includes('/dashboard') || url.includes('/schedule') || url.includes('/posts')) {
    detectedDashboard = true;
    break;
  }
  await page.waitForTimeout(1000);
}

if (detectedDashboard) {
  await context.storageState({ path: sessionFile });
  process.stderr.write(`✅ Session saved to ${sessionFile}\n`);
  process.exit(0);
} else {
  process.stderr.write(`❌ Timed out. Final URL: ${page.url()}\nCould not detect a logged-in state. Try again.\n`);
  process.exit(1);
}
