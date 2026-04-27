---
name: business-writing-feedback
description: "Score any text on 8 dimensions against the resolved voice and craft references, propose cuts and rewrites."
type: reference
status: active
---

# Skill: Business Writing Feedback

Purpose:
Review any text against the user's voice (`writing-style`) and craft (`business-writing-guidelines`) references and produce a structured score, fatal-violation list, specific edits, a 20-30 percent cut, and a rewrite when the score is low. Acts as the evaluation engine for the `/critique` command and the `content-reviewer` agent.

When to use:
- When the user pastes a text and asks for feedback, review, or a check.
- When the `content-reviewer` agent evaluates drafts before publishing.
- When the user says "what do you think of this", "review this", "check this text", "score this".

---

## Dependencies

- **`manifest-resolver` skill** — resolves `writing-style` and `business-writing-guidelines` before evaluation.
- **`obsidian:obsidian-markdown` skill (optional)** — invoke when the text is or will become an Obsidian note (vault drafts, content notes, newsletter editions). Use it as the authoritative reference for frontmatter, wikilinks, callouts, and embeds in any rewrite.

---

## Process

1. **Resolve references.** Invoke `manifest-resolver` for domain `content-editor`. The skill needs both:
   - `writing-style` (required) — voice DNA, banned phrases, formatting rules.
   - `business-writing-guidelines` (required) — craft principles, stickiness, structure, editing rubric.

   If either fails to resolve, stop and report MISSING with the recommended path. Do not score on partial references.

2. **Read both files in full.** Do not skim. The fatal-violation checks (banned phrases, format rules) require the full text of `writing-style.md`.

3. **Identify the format.** LinkedIn post, newsletter, essay, memo, email, other. Format affects which rules weigh more:
   - LinkedIn: hook strength, brevity, banned phrases dominate.
   - Newsletter: structure, depth, counterargument matter most.
   - General business writing: clarity, stickiness, remarkability.

4. **Score on 8 dimensions** (each 1-10):

   | Dimension       | What to evaluate                                                  |
   |-----------------|-------------------------------------------------------------------|
   | Opening         | Does the first sentence earn the second? Curiosity gap or specific scene? Throat-clearing cut? |
   | Structure       | Escalation? Each section earns the next? No symmetric recap?       |
   | Clarity         | One idea per sentence? Active voice? Front-loaded weight?          |
   | Stickiness      | SUCCESs filter: Simple, Unexpected, Concrete, Credible, Emotional, Story? |
   | Sentence craft  | Rhythm variation? Sound when read aloud? No nested clauses?         |
   | Word precision  | Concrete > abstract? Strong verbs? Adverbs killed? Numbers, scenes? |
   | Voice match     | Sounds like the author per the resolved `writing-style`? No drift to a different persona? |
   | Remarkability   | Purple Cow test: would a senior reader stop scrolling? Real edge?  |

   **Overall:** mean of the 8, rounded to nearest 0.5.

5. **Flag fatal violations.** Reject on sight if any apply:
   - A phrase from the Banned Phrases section of the resolved `writing-style.md`.
   - Em dashes (any occurrence).
   - Markdown formatting characters in a LinkedIn post body.
   - Emojis or hashtags (unless explicitly requested).
   - Motivational or guru-style closing.
   - The 10 fatal sins from `business-writing-guidelines.md`.

6. **Propose specific edits.** For each issue:
   - Quote the original line.
   - Explain in one sentence what is wrong.
   - Provide a rewritten version.

7. **Apply the 20-30 percent cut test.** List specific sentences or phrases to remove, with one-line reasons each.

8. **Run the 12-word test.** State the text's core message in 12 words or fewer. If you cannot, flag that the piece lacks a clear core.

9. **Provide a rewrite if overall < 7.** Full rewrite that passes all checks above. Match the voice of the resolved `writing-style`. If the text is or will become an Obsidian note, the rewrite uses Obsidian-flavored markdown (wikilinks, callouts, typed frontmatter, embeds).

---

## Output format

```
FORMAT: <LinkedIn post | Newsletter | Essay | Email | Other>
CORE MESSAGE (12 words): <the core idea, or "MISSING" if the piece lacks one>

SCORES:
  Opening:         X/10
  Structure:       X/10
  Clarity:         X/10
  Stickiness:      X/10
  Sentence craft:  X/10
  Word precision:  X/10
  Voice match:     X/10
  Remarkability:   X/10
  OVERALL:         X/10

VERDICT: <"Publish as-is" | "Minor edits needed" | "Major revision needed" | "Rewrite">

FATAL VIOLATIONS: <list, or "None">

EDITS:
  1. Original: "..."
     Issue:    ...
     Rewrite:  "..."
  2. ...

CUT LIST:
  - "sentence to remove" (reason)
  - ...

REWRITE: (only if overall < 7)
  <full rewritten text>
```

---

## Strict rules

- Do NOT soften criticism. Lead with the score. The author wants to know what is wrong, not that they are doing great.
- Do NOT skip the cut test. Every text gets the 20-30 percent cut analysis, no exceptions.
- Do NOT praise before critiquing. The score speaks first.
- Do NOT ignore banned phrases. A single banned phrase fails the output regardless of other scores.
- Do NOT score without reading both reference files in full. Feedback without the full rubric is incomplete.
- Do NOT use vague feedback ("this could be stronger"). Always say exactly what is wrong and provide a specific rewrite.
- Do NOT add emojis, hashtags, or engagement bait in rewrites.
- Do NOT write rewrites that drift to a different voice. Match the resolved `writing-style` exactly.
- Match the input language. Spanish in, Spanish out. Portuguese in, Portuguese out. English by default.
