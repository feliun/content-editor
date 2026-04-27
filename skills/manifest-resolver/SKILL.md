---
name: manifest-resolver
description: "Resolve content-editor config paths from commands/manifest.yaml using a five-layer search (workspace overrides, vault, plugin defaults, user home)."
type: reference
status: active
---

# Skill: Manifest Resolver

Purpose:
Locate every config file the content-editor commands need before any of them runs. The resolver reads `commands/manifest.yaml`, walks the per-key `paths` list in priority order, and returns the first match. Calling commands receive a clean status block.

When to use:
- Before any `content-editor:*` command (`create-linkedin-content`, `create-newsletter`, `critique`, `publish`, `analytics`).
- Standalone for debugging: `Invoke manifest-resolver for domain: content-editor`.

---

## Path tokens

The manifest uses three tokens. The resolver expands them at runtime:

| Token        | Expansion                                                                  |
|--------------|----------------------------------------------------------------------------|
| `$WORKSPACE` | Absolute path to the user's working directory (the dir Claude Code launched in). |
| `~`          | Absolute path to the user's home directory.                                 |
| (bare path)  | Relative to the **plugin root** (the content-editor repo itself).            |

A plugin path like `references/writing-style.md` resolves to
`<plugin-root>/references/writing-style.md`, never to the workspace.

---

## Five-layer resolution (typical reference)

For a reference file with manifest key `<key>`:

1. `$WORKSPACE/.content-editor/<key>.md` — explicit per-workspace override (gitignored).
2. `$WORKSPACE/system/memory/principles/<original-cased>.md` — vault canonical (Obsidian "principles" convention; original-cased filename so existing vaults resolve without renames).
3. `$WORKSPACE/references/<key>.md` — generic workspace references.
4. `references/<key>.md` — plugin defaults (ships with the repo).
5. `~/.claude/content-editor/<key>.md` — user-wide fallback.

The "original-cased" filename for layer 2 is fixed in the manifest itself. Mapping:

| Manifest key | Layer 2 filename                          |
|--------------|-------------------------------------------|
| `writing-style`               | `Writing style.md`               |
| `business-writing-guidelines` | `Business Writing guidelines.md` |
| `linkedin-strategy`           | `LinkedIn Content Strategy Guide.md` |
| `newsletter-strategy`         | `Newsletter Content Strategy Guide.md` |
| `author-profile`              | `Who am I.md`                    |
| `author-values`               | `My values.md`                   |
| `author-thinking-style`       | `How to think with me.md`        |

Non-reference keys (`wiki`, `outputs-dir`, `content-settings`, `publishing`, `analytics-output`, `locales`) declare their own ordered `paths` list and are resolved with the same algorithm.

---

## Algorithm

1. **Read** the plugin's `commands/manifest.yaml`.
2. **Select the domain** from the calling command's namespace
   (`content-editor:create-linkedin-content` → `content-editor`).
3. **Resolve `$WORKSPACE`** to the absolute path of the user's working directory (the dir Claude Code is invoked in). If unknown, fall back to the directory containing the active git repo or the current working directory.
4. **For each config key** in that domain:
   1. Iterate `paths` in order.
   2. Expand `$WORKSPACE`, `~`, and bare paths per the table above.
   3. Check existence:
      - `format: markdown` / `yaml` / `json` → file exists and is readable.
      - `format: directory` → directory exists **and** contains at least one entry.
   4. Return the first match as the resolved path.
   5. If no path matches:
      - `required: true` → flag MISSING with the expected first path as the recommended location.
      - `required: false` → flag optional, skipped.
5. **Emit** the status block (see Output below).

---

## Output

Compact status block the calling command can quote back to the user:

```
Config resolution (content-editor):
  writing-style                 -> $WORKSPACE/system/memory/principles/Writing style.md
  business-writing-guidelines   -> references/business-writing-guidelines.md (plugin default)
  linkedin-strategy             -> $WORKSPACE/.content-editor/linkedin-strategy.md
  newsletter-strategy           -> references/newsletter-strategy.md (plugin default)
  author-profile                -> (optional, not found)
  author-values                 -> (optional, not found)
  author-thinking-style         -> (optional, not found)
  wiki                          -> $WORKSPACE/wiki (12 files)
  outputs-dir                   -> $WORKSPACE/outputs/content (3 files)
  content-settings              -> config/content-settings.yaml (plugin default)
  publishing                    -> $WORKSPACE/.content-editor/publishing.yaml
  locales                       -> config/locales.yaml (plugin default)
```

If every required key resolves and no optionals are missing, collapse to:

```
Config: all resolved (N/N)
```

When a path lands on a plugin default, append `(plugin default)` so the user knows to drop a workspace override if they want personalisation.

---

## Error handling

- `manifest.yaml` missing → report the error and list the expected reference files. Do not proceed.
- A required config resolves nowhere → flag MISSING and show the first path in the list as the recommended location to create the file.
- A required config exists but is empty → treat as MISSING with reason "file is empty".
- An optional config missing → silent skip, never block the command.
- Never abort the command for an optional-config miss. Always continue with whatever resolved.

---

## Standalone usage

To inspect resolution without running a command:

```
Invoke manifest-resolver for domain: content-editor
```

The resolver prints the full status block, including paths that did not resolve, so the user can debug priority order.

---

## Anti-patterns

- Do NOT bypass the manifest by hardcoding paths in commands or skills. Every path goes through the resolver.
- Do NOT hard-fail the entire command for a missing optional config — continue with whatever resolved.
- Do NOT skip the directory-contents check for `format: directory`. An empty directory is different from a missing one and the calling command needs to know.
- Do NOT mutate the manifest at runtime. The manifest is read-only; user overrides go in the per-workspace `$WORKSPACE/.content-editor/` layer or the user-home `~/.claude/content-editor/` layer.
