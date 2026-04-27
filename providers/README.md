# Publishing Providers

Pluggable publishing back-ends for the `content-editor` plugin. Each provider wires the generic `skills/publish.md` and `skills/analytics.md` skills to a concrete platform (Taplio, Buffer, Hootsuite, the LinkedIn API, etc).

The generic skills shell out to a provider's scripts, so the plugin itself never imports a provider's SDK. Add a new provider by dropping a directory under `providers/` and matching the contract below.

## Layout

```
providers/
└── <provider-name>/
    ├── README.md         # setup, auth flow, config shape
    ├── package.json      # provider-scoped npm dependencies
    ├── publish.mjs       # required: schedule a content file
    ├── analytics.mjs     # required: fetch metrics
    ├── auth.mjs          # optional: session/credential bootstrap
    └── verify.mjs        # optional: health/verification helper
```

## Entry-point contract

Every provider implements at minimum `publish.mjs` and `analytics.mjs`. Both are invoked as:

```bash
node providers/<name>/publish.mjs   <content-file> <config.json>
node providers/<name>/analytics.mjs                <config.json>
```

`<config.json>` is a path to a JSON file the calling skill writes before dispatching. It always contains:

```json
{
  "language": "en",
  "schedule": {
    "default_time": "09:15",
    "timezone": "America/Bogota",
    "working_days": ["Mon", "Tue", "Wed", "Thu", "Fri"]
  },
  "locales": {
    "days":  ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "short": ["Mon", "Tue", "Wed", "Thu", "Fri"]
  },
  "workspace": "/abs/path/to/workspace",
  "outputs_dir": "/abs/path/to/outputs/content",
  "provider": "<name>",
  "<name>": { "...": "provider-specific block from publishing.yaml" }
}
```

Providers may add fields, but must accept the keys above without modification.

## stdout contract: JSON Lines

Both scripts must emit one JSON object per line on `stdout`. Logs and progress messages go to `stderr` so the calling skill can parse `stdout` deterministically.

### `publish.mjs` per-post events

```json
{"day": "Mon", "scheduled_at": "2026-04-14T09:15:00-05:00", "status": "ok"}
```

```json
{"day": "Tue", "status": "failed", "reason": "session expired"}
```

### `publish.mjs` final summary (last line)

```json
{"summary": {"scheduled": 4, "failed": 1}}
```

### `analytics.mjs` output

`analytics.mjs` writes the structured metrics file to the path supplied in the config (default: `<workspace>/outputs/analytics.json`) and emits a final summary line:

```json
{"summary": {"total_posts": 28, "avg_engagement_rate": 3.1, "best_day": "Tuesday"}}
```

## Exit codes

- `0` — all operations succeeded.
- `1` — at least one operation failed; the calling skill still parses partial JSON-lines output.
- Any other code is treated as a hard provider error.

## Optional helpers

- `auth.mjs <config.json>` — interactive credential / session bootstrap. Document the call signature in the provider README.
- `verify.mjs <config.json>` — health check, screenshots, or anything else useful for debugging.

## Adding a provider

1. Copy an existing provider directory as a template.
2. Replace `publish.mjs` and `analytics.mjs` with calls to the new platform.
3. Update `package.json` with platform-specific dependencies.
4. Document the auth flow, config shape, and rate limits in `README.md`.
5. Set `provider: <name>` in the user's `publishing.yaml`.

The generic skills auto-discover providers from the `provider:` field, so no plugin code changes are needed.
