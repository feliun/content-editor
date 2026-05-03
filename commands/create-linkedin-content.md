---
name: content-editor:create-linkedin-content
description: "Generate a full week of LinkedIn posts (Mon-Fri), analytics-informed, sourced from your wiki."
---

# LinkedIn Weekly Content

Build a full week of LinkedIn content (Monday through Friday) following the resolved `linkedin-strategy` reference and the user's voice in `writing-style`.

---

## Process

0. **Resolve config.** Invoke `manifest-resolver` for domain `content-editor`. The command needs:
   - `writing-style` (required) — voice DNA
   - `business-writing-guidelines` (required) — craft principles
   - `linkedin-strategy` (required) — audience, pillars, weekly schedule, quality filters
   - `author-profile`, `author-values`, `author-thinking-style` (optional, but use them when resolved)
   - `wiki` (optional) — fallback source notes pool
   - `linkedin-source-pool` (optional) — directory of wiki notes scanned in step 4 for publishing candidates
   - `tweets-archive` (optional) — directory of tweet captures scanned in step 4 for publishing candidates
   - `outputs-dir` (required) — where to save the file
   - `content-settings` (optional) — for `language`, `linkedin.weekly_schedule`, `linkedin.source_status`, `linkedin.tweets_lookback_days`
   - `locales` (required) — day-name translations
   - `analytics-output` (optional) — last analytics run

   Stop if any required config is MISSING.

1. **Refresh analytics (best-effort).** Invoke the `analytics` skill. If it returns "no analytics provider configured" or fails for any reason, warn with `⚠️` and continue without analytics. Do NOT block content generation.

2. **Read the analytics file.** If `analytics-output` resolved, parse it and extract:
   - The day with highest engagement.
   - The top patterns from `summary.top_patterns`.
   - Highest-engagement posts as style/structure references.
   - Average impressions and engagement rate as the baseline.

   Use these insights when generating content (steps 6-8). For example:
   - If a day consistently underperforms, try a different angle.
   - If a topic theme outperforms, lean into it.
   - Use the best posts as structural references, not as templates to copy.

3. **Read the strategy and voice references.** Read the resolved `linkedin-strategy` in full. Read the resolved `writing-style` in full. Optional: read `author-profile`, `author-values`, and `author-thinking-style` if resolved.

4. **Propose publishing candidates and wait for user confirmation.** Before generating any content, gather source candidates from the two configured directories and present them to the user for explicit approval:

   - **Recent tweets** from the resolved `tweets-archive` directory. Include only files whose mtime (or `created` frontmatter field, if present) falls within the last `linkedin.tweets_lookback_days` days (default `7`) relative to today. Skip silently if `tweets-archive` did not resolve.
   - **Ready-status wiki notes** from the resolved `linkedin-source-pool` directory. Read frontmatter from each note and include only those whose `status` field equals `linkedin.source_status` from `content-settings.yaml` (default `ready`). Skip silently if `linkedin-source-pool` did not resolve.

   Present the candidates as a numbered list, grouped by source, with a one-line summary per item (title or first non-empty line). Then **stop and ask the user** which candidates to use. Acceptable user responses:
   - A subset of numbers / titles to publish from.
   - "All" to use everything proposed.
   - A request to add original ideas to fill gaps.
   - A request to abort and wait for more material.

   Do **not** proceed to step 5 until the user has explicitly confirmed the publishing candidates. If the combined candidate set is empty (both directories unresolved or empty after filtering), surface that fact and ask whether to generate from original ideas only or abort.

5. **Optional: check the newsletter archive.** If `newsletter.external_archive_url` is set in `content-settings.yaml`, fetch the URL to ground Friday's BOFU promo. If unreachable, fall back to the most recent file in `outputs-dir` matching `Newsletter-*.md`. If neither is available, write Friday's BOFU based on known newsletter themes and flag with `⚠️`.

6. **Generate 5 posts** following the weekly schedule from `content-settings.yaml`. Default schedule (English short codes regardless of output language):

   | Code | Stage | Default angle                                          |
   |------|-------|--------------------------------------------------------|
   | Mon  | TOFU  | Top-of-funnel: wide curiosity, surface a question      |
   | Tue  | MOFU  | Depth on a real problem                                |
   | Wed  | MOFU  | Depth on a different angle                             |
   | Thu  | MOFU  | Specific tactical value                                |
   | Fri  | BOFU  | Drive to newsletter or owned channel                   |

   Day labels in the output file are translated to the configured `language` via `locales.yaml`.

7. **For each post, produce:**
   - Day label (in the configured language) and stage (TOFU / MOFU / BOFU).
   - Post title or theme (internal reference, not for publication).
   - Main ideas to include.
   - **Main content** — the publishable post body.
   - Source reference (wikilink, external URL, or "Original").

8. **Apply quality filters** from `linkedin-strategy.md` to every post:
   - Audience filter (real challenge, actionable, audience-relevant)
   - Narrative filter (pillar-aligned, opinion-aligned, differentiated)
   - Quality filter (hook, concrete anchor, voice match, 12-word core)
   - Exclusion check (no motivational tone, no engagement bait, no banned phrases)

   If a post fails any filter, rework it before including in the output.

9. **Output rules.**
   - All texts in the configured `language` (default English).
   - **No formatting in post body.** The Main content section is plain text only — no `**bold**`, no `*italics*`, no markdown of any kind. LinkedIn does not render markdown.
   - **Newsletter or external links go inline,** not in comments. Never write "link in comments".
   - Save to `<outputs-dir>/Linkedin-DD-MM-YYYY.md`, where the date is the Monday of the proposed week.

10. **Update source-note status.** After saving, for every wiki note used as a source, update its frontmatter `status` to `published` via the `obsidian:obsidian-cli` skill if available. Skip unresolved wikilinks. Skip silently if the obsidian CLI is missing.

11. **Spawn the content reviewer.** For each generated post, dispatch the `content-reviewer` agent. Replace any post scoring below `review.min_score` (default 7) with the agent's rewrite, then re-review.

---

## Resilience

- **No publishing candidates available** → step 4 surfaces an empty candidate list to the user. Only proceed (with original ideas or abort) per explicit user instruction.
- **Newsletter archive unreachable** → write Friday's BOFU from known themes, flag `⚠️`.
- **Idea already published** → check existing `<outputs-dir>/Linkedin-*.md` for duplicates. Never reuse a published idea.
- **Post fails quality filters** → rework before including.
- **Analytics unavailable** (no provider, script failed, JSON missing, or older than 7 days) → generate from strategy alone, flag `⚠️ Analytics unavailable: <reason>`.

---

## Report

After generating, present:

```
LINKEDIN CONTENT — DD-MM-YYYY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Posts generated:  5
Sources used:     [list with type — Wiki / External / Original]
Analytics:        [Available — N posts, best day: X / ⚠️ Unavailable — reason]
Language:         [en | es | pt | other]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mon (TOFU):    [theme]
Tue (MOFU):    [theme]
Wed (MOFU):    [theme]
Thu (MOFU):    [theme]
Fri (BOFU):    [theme]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Output:        <outputs-dir>/Linkedin-DD-MM-YYYY.md
Reviewer:      [N/5 ≥ 7 / N rewritten / final pass]
Warnings:      [any ⚠️ notes, or "None"]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
