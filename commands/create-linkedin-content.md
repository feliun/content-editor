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
   - `wiki` (optional) — source notes
   - `outputs-dir` (required) — where to save the file
   - `content-settings` (optional) — for `language` and `linkedin.weekly_schedule`
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

4. **Scan the wiki.** If the `wiki` config resolved, scan it for source notes. Filter by frontmatter:
   - **status:** `draft` only. Never use `status: published` or `status: ready`.
   - Optionally narrow by `tag: linkedin` if the user's wiki uses tags.

   If fewer than `linkedin.min_source_notes` (default 5) draft notes are found, **stop** and report the count. Ask the user whether to:
   - Proceed with what's available, filling gaps with original ideas, or
   - Wait until more drafts are added.

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
   - 3 hook alternatives.
   - 3 close alternatives.
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

- **Insufficient draft content** → stop and prompt the user (step 4). Only proceed with gaps if the user explicitly approves.
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
