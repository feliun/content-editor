# Taplio Provider

Reference implementation of the [provider contract](../README.md) for [Taplio](https://taplio.com/). Drives Taplio's web app via Playwright to schedule LinkedIn posts and scrape post-level analytics.

> Taplio is a third-party LinkedIn scheduler. It has no public API, so this provider relies on browser automation. Expect it to break when Taplio ships UI changes; selectors live in `publish.mjs` and `analytics.mjs` and are easy to update.

## Install

```bash
cd providers/taplio
npm install
npx playwright install chromium
```

Playwright lives only inside this provider directory. The plugin root has zero dependencies.

## Authenticate

Taplio doesn't expose API keys, so each user runs an interactive login once. Session state is persisted as a Playwright `storageState` blob.

```bash
node providers/taplio/auth.mjs path/to/config.json
```

A Chromium window opens at `https://app.taplio.com`. Log in. The script detects the dashboard and writes the session to:

```
$WORKSPACE/.content-editor/taplio-session.json
```

`$WORKSPACE/.content-editor/` is gitignored at the repo root.

Re-run `auth.mjs` whenever Taplio expires the session (typically every few weeks).

## Config

Set `provider: taplio` in `$WORKSPACE/.content-editor/publishing.yaml`:

```yaml
provider: taplio
schedule:
  default_time: "09:15"
  timezone: "UTC"
  working_days: [Mon, Tue, Wed, Thu, Fri]

taplio:
  session_file: ".content-editor/taplio-session.json"
  screenshots_dir: ".content-editor/taplio-screenshots"
```

Paths are resolved relative to `$WORKSPACE`. The generic `skills/publish.md` skill builds the `config.json` blob handed to each script.

## Scripts

| Script | Purpose |
|--------|---------|
| `publish.mjs <content-file> <config.json>` | Parse the LinkedIn content file, schedule each day's post in Taplio at the configured time. |
| `analytics.mjs <config.json>` | Scrape the analytics dashboard, write structured JSON to the configured `analytics-output` path (default `outputs/content/analytics.json`), print a summary line on stdout. |
| `auth.mjs <config.json>` | Interactive login, persists the Playwright session. |
| `verify.mjs <config.json>` | Smoke test: opens the schedule view and saves screenshots. |

## Day-name parsing

`publish.mjs` recognises any of these day labels in the markdown content file:

- English (`Mon`/`Monday` … `Fri`/`Friday`)
- Spanish (`Lun`/`Lunes` … `Vie`/`Viernes`)
- Portuguese (`Seg`/`Segunda` … `Sex`/`Sexta`)

The `language` field in `config.json` selects the primary mapping; other languages still parse so a mixed file is tolerated. Day labels come from `config/locales.yaml` at the plugin root.

## Failure modes

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `session expired` in JSON-lines output | Taplio logged the session out | Re-run `auth.mjs` |
| Specific day reports `failed` with selector error | Taplio UI changed | Inspect the screenshot under `screenshots_dir`, update selectors |
| `analytics.mjs` finds zero posts | Session valid but no posts in the period | Confirm posts exist; widen `--days` argument |
| Playwright complains about missing browsers | Browsers not installed | Run `npx playwright install chromium` |

## stdout JSON-lines

Per-post lines:

```json
{"day": "Mon", "scheduled_at": "2026-04-14T09:15:00-05:00", "status": "ok"}
{"day": "Tue", "status": "failed", "reason": "session expired"}
```

Final summary line (always emitted):

```json
{"summary": {"scheduled": 4, "failed": 1}}
```

All progress logs go to `stderr` so the calling skill can stream-parse `stdout`.

## Limits

- Taplio rate-limits rapid scheduling. The provider sleeps between posts; expect ~10–15s per post.
- Sessions are device-bound. Logging in on another browser will invalidate the saved session.
- Headless mode is used everywhere except `auth.mjs`.
