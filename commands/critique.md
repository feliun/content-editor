---
name: content-editor:critique
description: "Review any text or file against the configured craft and voice references. Score on 8 dimensions, flag fatal violations, propose cuts and rewrites."
---

# Critique

Score a piece of writing on 8 craft dimensions, flag fatal violations, propose cuts and rewrites. Uses the `business-writing-feedback` skill as the evaluation engine.

---

## Input

The user provides one of:

1. **Inline text** — pasted directly after `/critique`.
2. **File path** — absolute, relative, or `[[wikilink]]`.
3. **No input** — prompt the user: *"Paste the text you want reviewed, or give me a file path."*

If a file path is given, read the full file contents before proceeding. If a wikilink is given, resolve it via the `obsidian:obsidian-cli` skill if available.

---

## Process

1. **Resolve config.** Invoke `manifest-resolver` for domain `content-editor`. The critique requires:
   - `writing-style` (required) — voice DNA, banned phrases, formatting rules.
   - `business-writing-guidelines` (required) — craft principles, stickiness, editing rubric.

   Stop if either is MISSING.

2. **Read both reference files in full.** Do not skim. The fatal-violation checks require the full text.

3. **Execute the `business-writing-feedback` skill.** Follow its process exactly:
   - Identify the format (LinkedIn, newsletter, essay, email, other).
   - Score on 8 dimensions (Opening, Structure, Clarity, Stickiness, Sentence craft, Word precision, Voice match, Remarkability).
   - Flag fatal violations (banned phrases, em dashes, format issues, motivational tone).
   - Propose specific edits (original / issue / rewrite for each).
   - Apply the 20-30 percent cut test.
   - Run the 12-word test.
   - Provide a full rewrite if overall < 7.

4. **Output** in the format defined by the `business-writing-feedback` skill.

---

## Strict rules

- Do NOT skip manifest resolution. Both reference files must be loaded before evaluation.
- Do NOT soften the score. Lead with numbers, not encouragement.
- Do NOT evaluate without reading the full text first. Partial reads produce shallow feedback.
- Match the input language: feedback and rewrites in the same language as the source text. English by default if ambiguous.
