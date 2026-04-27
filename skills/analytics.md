---
name: analytics
description: "Fetch post-level engagement metrics from whatever analytics provider the user has configured."
type: reference
status: active
---

# Skill: Analytics

Purpose:
Fetch LinkedIn (or equivalent) post engagement metrics from the user's configured publishing provider. Used by `/create-linkedin-content` to inform topic and angle selection, and standalone whenever the user asks for engagement data.

When to use:
- Before generating LinkedIn content (`/create-linkedin-content` runs this in step 0).
- When the user asks for engagement data, post performance, or analytics.
- When running content strategy reviews.

---

## Prerequisites

- A `publishing.yaml` with a `provider:` field, resolved via `manifest-resolver`.
- The provider directory at `providers/<provider>/` must exist and have an `analytics.mjs`.
- The provider's npm dependencies must be installed.

If the user has no analytics provider, exit gracefully with `"no analytics provider configured"`. Never hard-fail the calling command — analytics is informational, not gating.

---

## Process

1. **Resolve config.** Invoke `manifest-resolver` for domain `content-editor`. Needs:
   - `publishing` (provider name + provider-specific block).
   - `content-settings` (for `language`).
   - `locales` (day-name translations).
   - `analytics-output` (where the provider writes the JSON file).

2. **Pick the provider.**
   - Read `provider:` from the resolved `publishing.yaml`.
   - If `publishing.yaml` did not resolve, or `provider:` is empty / `none`, or the provider directory is missing, report it and exit gracefully.

3. **Build the config blob.** Same shape as `publish.md`, plus the analytics output path:

   ```json
   {
     "language": "<from content-settings, default 'en'>",
     "schedule": { "...": "from publishing.schedule" },
     "locales": { "days": [...], "short": [...] },
     "workspace": "<absolute $WORKSPACE>",
     "outputs_dir": "<absolute outputs-dir>",
     "analytics_output": "<absolute analytics-output path>",
     "provider": "<provider name>",
     "<provider>": { "...": "from publishing.<provider>" }
   }
   ```

   Write to `<workspace>/.content-editor/.analytics-config.json` for the provider to read.

4. **Dispatch.** Shell out:

   ```bash
   node providers/<provider>/analytics.mjs "<config.json>"
   ```

   Optional flags (`--days 7|30|90|all`) are passed through verbatim to the provider script.

5. **Parse output.** The provider writes structured metrics to `analytics-output` and emits a final JSON-lines summary on stdout:

   ```json
   {"summary": {"total_posts": 28, "avg_engagement_rate": 3.1, "best_day": "Tuesday"}}
   ```

   Tolerate non-JSON lines on stdout by ignoring them.

6. **Report.** Render a provider-agnostic summary block:

   ```
   ANALYTICS — <provider> (last 30 days)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Posts analysed:    28
   Avg impressions:   1,540
   Avg engagement:    3.1%
   Best day:          Tuesday
   Worst day:         Friday
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Output:            <analytics-output path>
   ```

   Day labels translated to the configured language.

---

## Failure modes

| Symptom                            | Action                                                                                       |
|------------------------------------|----------------------------------------------------------------------------------------------|
| `publishing.yaml` did not resolve  | Report `"no analytics provider configured"`, return empty result, do not block caller.        |
| Provider dir missing               | Report which path was checked. Suggest installing the provider.                               |
| Session expired (per provider doc) | Surface the reason verbatim. Tell the user to re-auth. Return empty result.                  |
| No posts found                     | Report it. Calling command should treat as `analytics unavailable`, generate from strategy.   |
| Provider exits non-zero            | Still parse partial output. Report what worked and what did not.                              |

---

## Output file (consumed by other commands)

The provider writes a JSON file at the resolved `analytics-output` path. The shape is provider-defined, but the calling command (`create-linkedin-content`) expects at minimum:

```json
{
  "last_updated": "<ISO timestamp>",
  "period_days": 30,
  "posts": [
    {
      "date": "2026-04-14",
      "day_of_week": "Tuesday",
      "content_preview": "...",
      "impressions": 1234,
      "likes": 45,
      "comments": 6,
      "engagement_rate": 4.1
    }
  ],
  "summary": {
    "total_posts": 28,
    "avg_impressions": 1540,
    "avg_engagement_rate": 3.1,
    "best_day": "Tuesday",
    "worst_day": "Friday",
    "top_patterns": ["..."]
  }
}
```

`top_patterns` is a list of human-readable strings the LLM can quote when generating new content (e.g. *"Tuesday gets 1.6x the engagement of Friday."*).

---

## Anti-patterns

- Do NOT block content generation on analytics failure. Analytics are informational.
- Do NOT bypass the manifest and hardcode the analytics output path.
- Do NOT call provider-specific code directly. The provider contract is the only seam.
- Do NOT mutate the analytics file from this skill. The provider owns it.

---

## Related

- `providers/README.md` — provider contract.
- `skills/publish.md` — sibling skill, same dispatch pattern.
- `commands/create-linkedin-content.md` — primary consumer of the analytics output.
