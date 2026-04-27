---
name: content-editor:create-newsletter
description: "Generate a single newsletter edition, 1000-2000 words, pillar-aligned."
---

# Newsletter Edition

Build a single newsletter edition following the resolved `newsletter-strategy` reference and the user's voice in `writing-style`.

---

## Process

0. **Resolve config.** Invoke `manifest-resolver` for domain `content-editor`. The command needs:
   - `writing-style` (required)
   - `business-writing-guidelines` (required)
   - `newsletter-strategy` (required) — pillars, structure, hook templates, SEO
   - `author-profile`, `author-values`, `author-thinking-style` (optional, but use them when resolved)
   - `wiki` (optional) — source notes
   - `outputs-dir` (required)
   - `content-settings` (optional) — for `language` and `newsletter.target_word_count`
   - `locales` (required)

   Stop if any required config is MISSING.

1. **Read the strategy and voice references.** Read the resolved `newsletter-strategy` and `writing-style` in full. Read the optional author files if resolved.

2. **Scan the wiki.** If the `wiki` config resolved, scan it for newsletter source notes. Filter by frontmatter:
   - `type: content`
   - `tag: newsletter`
   - `status` is anything **except** `published`.

   If no eligible notes are found, fall back to:
   - The most recent unused LinkedIn posts from `<outputs-dir>/Linkedin-*.md` (good candidates for long-form expansion).
   - The "Building in public" pillar from `newsletter-strategy.md`, drawing on recent personal experience the user provides.

3. **Avoid topic repeats.** Scan existing `<outputs-dir>/Newsletter-*.md` files. Never reuse a topic already covered.

4. **Select a single topic** and identify which pillar from `newsletter-strategy.md` it reinforces.

5. **Generate the edition** following the structure from `newsletter-strategy.md`:
   - **Title** — concrete, specific, no hype words.
   - **Subtitle / deck** — one sentence that sharpens the title.
   - **Pillar alignment** — internal note: which pillar this reinforces.
   - **The Hook** — 2-3 alternative hooks using the templates (Story / Contrarian / Observation / Confession / Question / Framework).
   - **The Setup** — brief setup paragraph: why this topic matters now.
   - **The Core** — structured outline with subheadings, key points, at least one concrete example, number, or scene per move.
   - **The Tension** — strongest counterargument, addressed honestly.
   - **The Takeaway** — closing lines + 2-3 alternative reply-driving questions.
   - **Source references** — wikilink, book citation, external URL, or "Original".
   - **SEO suggestions** — 2-3 keyword-optimised title alternatives for discoverability.
   - **Notes** — brief context, optional.

6. **Apply quality filters** from `newsletter-strategy.md` to every section:
   - **Audience filter** — useful to senior reader, addresses a real challenge, actionable.
   - **Narrative filter** — reinforces a pillar, aligns with the author's strong opinions, differentiates from generic newsletters.
   - **Quality filter** — compelling hook, concrete examples, voice match, right length (5-10 minute read).
   - **SEO filter** — searchable noun phrase in the title, subtitle works as a standalone hook for the email preview.
   - **Exclusion check** — no motivation, no self-promo, no textbook tone, no banned phrases.

7. **Output rules.**
   - All text in the configured `language` (default English).
   - Target length: `newsletter.target_word_count` (default 1000-2000 words, 5-10 minute read).
   - Save to `<outputs-dir>/Newsletter-DD-MM-YYYY.md` (using the date of the proposed edition).

8. **Update source-note status.** After saving, for every wiki note used as a source, update its frontmatter `status` to `published` via the `obsidian:obsidian-cli` skill if available. Skip unresolved wikilinks. Skip silently if the obsidian CLI is missing.

9. **Spawn the content reviewer.** Dispatch the `content-reviewer` agent on the full draft. If overall < `review.min_score` (default 7), apply the agent's rewrite and re-review.

---

## Resilience

- **Insufficient wiki content** → use secondary sources (books, recent LinkedIn posts, "Building in public" pillar with user-supplied recent experience). Cite the source.
- **Reference newsletter or blog unreachable** → proceed with available sources, flag `⚠️`.
- **Topic already covered** → skip; pick another topic.
- **Section fails quality filter** → rework before including.
- **No clear topic emerges** → default to the "Building in public" pillar and ask the user for a recent experience to anchor the edition.

---

## Report

After generating, present:

```
NEWSLETTER EDITION — DD-MM-YYYY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Topic:            [edition title]
Pillar:           [pillar name from newsletter-strategy.md]
Word count:       ~[X] words
Est. read time:   ~[X] min
Language:         [en | es | pt | other]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hook style:       [Story / Contrarian / Observation / Confession / Question / Framework]
Sources used:     [list with type — Wiki / Book / External / Original]
SEO titles:       [2-3 alternatives]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Quality filters:  [✅ All passed / ⚠️ notes]
Reviewer score:   [overall X/10]
Output:           <outputs-dir>/Newsletter-DD-MM-YYYY.md
Warnings:         [any ⚠️ notes, or "None"]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
