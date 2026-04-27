# Content Editor

An opinionated writing partner for [Claude Code](https://claude.com/claude-code). Generates and reviews LinkedIn and newsletter content against your own voice and craft references, then schedules approved posts through a pluggable publishing provider. Voice guardian, not cheerleader: leads with the score, cuts 20-30 percent by default, picks insight over virality.

## Features

- **`/create-linkedin-content`** — generate a full week of LinkedIn posts (Mon-Fri), analytics-informed, sourced from your wiki / notes folder.
- **`/create-newsletter`** — generate a single newsletter edition, 1000-2000 words, pillar-aligned.
- **`/critique`** — score any text on 8 craft dimensions, flag fatal violations, propose cuts and a rewrite.
- **Pluggable publishing.** A small provider contract under `providers/` lets you wire any back-end (Taplio ships as the reference; Buffer, Hootsuite, the LinkedIn API, etc., are easy to add).
- **Multi-layer config.** Drop overrides in `$WORKSPACE/.content-editor/`, in your Obsidian-style vault, in the workspace's `references/` folder, or rely on plugin defaults. Resolved per-key via `commands/manifest.yaml`.
- **Multilingual.** English by default; Spanish and Portuguese ship out of the box; arbitrary languages pass through with a one-line addition to `config/locales.yaml`.

## Quick start

```bash
git clone <this-repo>
cd content-editor
```

The plugin works as-is with the example references shipped in `references/` (a fictional persona named "Signal"). To make it sound like *you*, override the reference files via one of the resolution layers (see [Configuration](#configuration)).

Optional setup steps:

```bash
# Install a publishing provider (Taplio shown as example)
cd providers/taplio && npm install && npx playwright install chromium

# Authenticate the provider
node providers/taplio/auth.mjs path/to/config.json
```

You can ignore everything under `providers/` until you actually want automated publishing; the content-generation commands work without any provider configured.

## Configuration

Every config key is resolved through an ordered list of paths (`commands/manifest.yaml`). The first match wins. Tokens used in paths:

- `$WORKSPACE` — the directory Claude Code launched in (your repo or vault).
- `~` — your home directory.
- bare paths — relative to the plugin root.

| Key                            | Resolution layers (in priority order)                                                                                                                                                                                                                                                  | Required |
|--------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|
| `writing-style`                | `$WORKSPACE/.content-editor/writing-style.md` → `$WORKSPACE/system/memory/principles/Writing style.md` → `$WORKSPACE/references/writing-style.md` → `references/writing-style.md` (plugin default) → `~/.claude/content-editor/writing-style.md`                                          | Yes      |
| `business-writing-guidelines`  | Same five layers, with `Business Writing guidelines.md` at the vault layer.                                                                                                                                                                                                            | Yes      |
| `linkedin-strategy`            | Same five layers, with `LinkedIn Content Strategy Guide.md` at the vault layer.                                                                                                                                                                                                         | Yes      |
| `newsletter-strategy`          | Same five layers, with `Newsletter Content Strategy Guide.md` at the vault layer.                                                                                                                                                                                                       | Yes      |
| `author-profile`, `author-values`, `author-thinking-style` | Same five layers (vault-layer filenames `Who am I.md` / `My values.md` / `How to think with me.md`).                                                                                                                                                       | No       |
| `wiki`                         | `$WORKSPACE/wiki` → `$WORKSPACE/notes` → `~/.claude/content-editor/wiki`                                                                                                                                                                                                                | No       |
| `outputs-dir`                  | `$WORKSPACE/outputs/content` → `outputs/content` (plugin)                                                                                                                                                                                                                              | Yes      |
| `content-settings`             | `$WORKSPACE/.content-editor/content-settings.yaml` → `config/content-settings.yaml` (plugin) → `~/.claude/content-editor/content-settings.yaml`                                                                                                                                          | No       |
| `publishing`                   | `$WORKSPACE/.content-editor/publishing.yaml` → `config/publishing.yaml` (plugin) → `~/.claude/content-editor/publishing.yaml`                                                                                                                                                            | No       |
| `analytics-output`             | `$WORKSPACE/.content-editor/analytics.json` → `$WORKSPACE/outputs/content/analytics.json` → `outputs/content/analytics.json` (plugin)                                                                                                                                                   | No       |
| `locales`                      | `$WORKSPACE/.content-editor/locales.yaml` → `config/locales.yaml`                                                                                                                                                                                                                       | Yes      |

The `system/memory/principles/` layer follows an Obsidian "principles" vault convention, with original-cased filenames so existing vaults resolve without renames.

Inspect what's resolved at any time:

```
Invoke manifest-resolver for domain: content-editor
```

## Dependencies

| Dependency             | When needed                                                                  | Install                                                                  |
|------------------------|------------------------------------------------------------------------------|--------------------------------------------------------------------------|
| Node.js 18+            | Always (providers, scripts)                                                   | Platform-specific (`brew install node`, `nvm install 18`, etc.)          |
| Claude Code CLI        | Always (the plugin runs inside Claude Code)                                   | See <https://claude.com/claude-code>                                      |
| Playwright             | Using a browser-automation provider (e.g. Taplio)                             | `cd providers/taplio && npm install && npx playwright install chromium`  |
| `obsidian-cli`         | You want post-publish `status: published` updates on Obsidian vault notes     | `brew install obsidian-cli` or equivalent. Auto-detected; skipped with `⚠️` if missing. |
| A publishing provider  | Automated scheduling (optional)                                               | Follow `providers/<name>/README.md`                                       |

## Publishing providers

Providers are pluggable. The plugin shells out to a small contract:

```bash
node providers/<name>/publish.mjs   <content-file> <config.json>
node providers/<name>/analytics.mjs                <config.json>
```

Each script emits one JSON object per line on stdout. See [`providers/README.md`](providers/README.md) for the full contract: stdout schema, config shape, entry points, exit codes.

The repo ships with one reference provider — [`providers/taplio/`](providers/taplio/README.md) — that drives Taplio's web app via Playwright. Drop a new directory under `providers/` to add Buffer / Hootsuite / direct LinkedIn API support; no plugin code changes are required.

## Conventions

**Wiki frontmatter.** Source notes are picked up by the commands based on a small frontmatter convention:

| Tag                                       | Used by                       |
|-------------------------------------------|-------------------------------|
| `status: draft`                           | `/create-linkedin-content` (LinkedIn drafts) |
| `type: content`, `tag: newsletter`, `status` ≠ `published` | `/create-newsletter` (newsletter sources) |

After publishing, the `status` field is updated to `published` via the `obsidian:obsidian-cli` skill if available.

**Output language.** Set `language:` in `content-settings.yaml`. Built-in locales: `en`, `es`, `pt`. Add other locales by extending `config/locales.yaml`.

**Day labels.** Internal scheduling always uses English short codes (`Mon` … `Fri`); commands and provider scripts translate them at render time using the configured `locales` map.

## Repo layout

```
content-editor/
├── .claude-plugin/      Plugin metadata for Claude Code
├── agents/              content-reviewer agent
├── commands/            /create-linkedin-content, /create-newsletter, /critique
├── config/              content-settings.yaml.example, publishing.yaml.example, locales.yaml
├── providers/           Pluggable publishing back-ends (Taplio reference)
├── references/          Voice and craft references (Signal example, replace with your own)
├── skills/              business-writing-feedback, publish, analytics, manifest-resolver
├── CLAUDE.md            Plugin-level directives (loaded into every session)
└── README.md            This file
```

## License

[MIT](LICENSE).
