---
name: publish
description: "Schedule a generated content file to whatever publishing provider the user has configured."
type: reference
status: active
---

# Skill: Publish

Purpose:
Take a generated content file (typically `outputs/content/Linkedin-DD-MM-YYYY.md`) and schedule each post on the user's configured publishing provider. Provider-agnostic. The user's `publishing.yaml` chooses the back-end; this skill handles the rest.

When to use:
- After `/create-linkedin-content` has produced a weekly content file.
- When the user says "publish", "schedule the posts", "send these to LinkedIn".
- When a content file under `outputs/content/Linkedin-*.md` is ready to schedule.

---

## Prerequisites

- A content file under `outputs/content/Linkedin-*.md` (clean or rich format — see [Content file format](#content-file-format)).
- A `publishing.yaml` with a `provider:` field, resolved via the `manifest-resolver` skill.
- The provider's directory at `providers/<provider>/` must exist and have a `publish.mjs`.
- The provider's npm dependencies must be installed (`cd providers/<provider> && npm install`).

If any of those is missing, report the gap clearly and exit gracefully — never fail loudly.

---

## Process

1. **Resolve config.** Invoke the `manifest-resolver` skill for domain `content-editor`. This skill needs:
   - `publishing` (required for this skill, optional in the manifest) — provider name + schedule + provider-specific block.
   - `content-settings` (optional) — for `language`.
   - `locales` (required) — day-name translations.
   - `outputs-dir` (required) — to default the content file lookup.

2. **Identify the content file.** Use the file the user named, or default to the most recent `Linkedin-*.md` under the resolved `outputs-dir`.

3. **Pick the provider.**
   - Read `provider:` from the resolved `publishing.yaml`.
   - If `publishing.yaml` did not resolve at all, or `provider:` is empty, or `provider:` is set to `none`, report `"no publishing provider configured"` and exit gracefully. No further action.
   - If the provider directory `providers/<provider>/` does not exist, report `"provider '<name>' is not installed"` with the path that was checked, and exit.

4. **Build the config blob.** Compose a JSON object the provider script will consume:

   ```json
   {
     "language": "<from content-settings, default 'en'>",
     "schedule": { "...": "from publishing.schedule" },
     "locales": { "days": [...], "short": [...] },
     "workspace": "<absolute $WORKSPACE>",
     "outputs_dir": "<absolute outputs-dir>",
     "provider": "<provider name>",
     "<provider>": { "...": "from publishing.<provider>" }
   }
   ```

   `locales` is the entry from `locales.yaml` keyed by `language`. If the language is not in the locale map, pass through the `language` value and the empty `days`/`short` arrays — the provider may still handle it.

   Write this to a temp file (e.g. `<workspace>/.content-editor/.publish-config.json`) so the provider can read it without piping.

5. **Dispatch.** Shell out:

   ```bash
   node providers/<provider>/publish.mjs "<content-file>" "<config.json>"
   ```

   The provider's stdout is JSON-lines (see the [provider contract](../providers/README.md)). Stream-parse it.

6. **Parse output.** Each per-post line looks like:

   ```json
   {"day": "Mon", "scheduled_at": "2026-04-14T09:15:00-05:00", "status": "ok"}
   ```

   or, on failure:

   ```json
   {"day": "Tue", "status": "failed", "reason": "session expired"}
   ```

   Final summary line:

   ```json
   {"summary": {"scheduled": 4, "failed": 1}}
   ```

   Tolerate non-JSON lines on stdout by ignoring them (they should never happen, but the skill must not crash on a stray log line).

7. **Update source notes and batch file.** If the content file references wiki notes via `[[wikilinks]]` and the `obsidian:obsidian-cli` skill is available, mark each successfully scheduled source note's frontmatter `status: published`. Skip wikilinks that don't resolve to a real note. Skip silently if the obsidian CLI is missing.

   Also flip the **content file's own** frontmatter `status` to `published` when all posts scheduled successfully (zero failures). On partial success, leave it as `draft` so the user can re-dispatch the failed days without losing track of which batches are fully shipped. Edit the file in place — keep all other frontmatter fields untouched.

8. **Report.** Render a provider-agnostic summary block:

   ```
   PUBLISH — <content-file>
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Provider:   <name>
   Scheduled:  4/5
   Failed:     1
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Mon → 2026-04-14 09:15 ✅
   Tue → 2026-04-15 09:15 ✅
   Wed → 2026-04-16 09:15 ✅
   Thu → 2026-04-17 09:15 ✅
   Fri → failed: session expired ❌
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

   Day labels in the summary are translated to the configured language via the `locales` entry.

---

## Content file format

The skill supports two file shapes; both are handled by the provider script.

**Clean format.** H1 day headers, one post per section.

```
# Mon
(post content)

# Tue
(post content)
```

**Rich format.** H2 day headers with metadata, the publishable post under `### ✏️ Main content`. Only the `Main content` section is published; everything else is ignored.

```
## Mon — TOFU: Theme title
(ideas, hooks, alternatives)

### ✏️ Main content
(this is what gets published)

---

## Tue — MOFU: Theme title
...
```

Day labels can be in the configured `language` (English, Spanish, Portuguese, or any custom locale defined in `locales.yaml`).

---

## Failure modes

| Symptom                            | Action                                                                                       |
|------------------------------------|----------------------------------------------------------------------------------------------|
| `publishing.yaml` did not resolve  | Report `"no publishing provider configured"`, exit gracefully.                                |
| Provider dir missing               | Report which path was checked. Suggest installing the provider.                               |
| Provider exits non-zero            | Still parse partial JSON-lines output. Report scheduled vs failed counts honestly.            |
| Session expired (per provider doc) | Surface the provider's reason verbatim. Do not retry. Tell the user to re-auth.              |
| No JSON-lines on stdout            | Treat as a hard provider error. Echo whatever the provider printed and exit non-zero.        |

---

## Anti-patterns

- Do NOT publish without explicit user confirmation. The skill schedules; it does not auto-publish on detection.
- Do NOT publish content that has not passed the `content-reviewer` agent (overall score ≥ 7).
- Do NOT bypass the manifest and hardcode paths.
- Do NOT call provider-specific code from this skill. The provider contract is the only seam; everything provider-specific lives under `providers/<name>/`.
- Do NOT swallow provider error output. If the provider fails, surface the failure reason verbatim.

---

## Related

- `providers/README.md` — provider contract: stdout schema, config shape, entry points.
- `providers/<provider>/README.md` — provider-specific setup (auth, dependencies, limits).
- `commands/create-linkedin-content.md` — generates the content file consumed here.
- `skills/analytics.md` — sibling skill for the analytics dispatch pattern.
