# Newsletter Content Strategy

> Example reference shipped with the plugin. The newsletter described below
> ("Signal") is fictional. Replace audience, pillars, and structure with
> your own newsletter, or override this file via the `newsletter-strategy`
> manifest key.

The newsletter is the long form. Where LinkedIn is a public scratchpad of short, opinionated posts, the newsletter earns the reader's twenty minutes by going deeper than the platform allows. This file defines how.

## 1. The newsletter: "Signal"

`Signal` is a monthly newsletter for senior engineers, technical founders, and CTOs at small-to-mid software companies. The promise: one essay a month that sharpens the reader's model of how good software organisations actually work, with concrete evidence.

The aspirational reader description: "I subscribe to one engineering newsletter, and this is it."

## 2. Audience

Same as the LinkedIn audience, with one shift: newsletter readers are deeper-funnel. They self-selected by clicking subscribe, opted into long-form, and expect more rigour.

What they want from a newsletter that they don't want from a LinkedIn post:

- The **case study** behind the claim.
- The **counterargument** addressed honestly.
- The **frameworks** the author actually uses.
- The **reading list** for going further.
- The **author's reasoning**, not just the conclusion.

If a newsletter edition could fit in a LinkedIn post, it shouldn't be a newsletter edition.

## 3. Five content pillars

Five pillars, three of them shared with LinkedIn (intentional), two of them newsletter-specific.

| Pillar | Core question | Example angles |
|--------|---------------|----------------|
| **Engineering leadership** | How do good technical leaders make decisions? | Hiring, technical roadmaps, on-call, team rituals |
| **Systems thinking** | What is the model behind the surface problem? | Failure modes, second-order effects, feedback loops |
| **AI tooling** | What actually works for senior developers? | Coding agents, evals, AI in code review, prompt engineering for senior teams |
| **Building in public** | What is the author actually doing right now? | Project retrospectives, honest postmortems, decisions in progress |
| **Industry observations** | What is the industry getting wrong this quarter? | Hype cycles, contrarian reads on trends, decoded vendor claims |

The two newsletter-only pillars (Building in public, Industry observations) are deliberately cadence-dependent: they become stale fast on LinkedIn but age well as a monthly snapshot.

## 4. Edition structure

Default shape, ~1000-2000 words, 5-10 minute read.

```
TITLE                            (concrete, specific, no hype)
SUBTITLE / DECK                  (one sentence, sharpens the title)

THE HOOK                         (~150 words)
  Earns the next paragraph. See hook templates below.

THE SETUP                        (~200 words)
  Why this matters now. The stakes for the reader.

THE CORE                         (~600-1000 words)
  Two to four moves. Each move has a concrete example, number, or scene.

THE TENSION                      (~200 words)
  The strongest counterargument, addressed honestly.

THE TAKEAWAY                     (~150 words)
  Reframes the lead. Two or three concrete actions, optional.

FURTHER READING                  (optional, 3-5 links max)
  Books, papers, or essays the author actually used.
```

Sections may be reordered, merged, or skipped, but the shape ensures the reader gets a thesis, evidence, a counter, and a takeaway.

## 5. Hook templates

A hook earns the next paragraph. Six patterns work for newsletter long form:

1. **Story.** A specific scene with a real moment of decision.
   *"Last month, two of our staff engineers disagreed about whether to delete a service. Both were right."*

2. **Contrarian.** Reverse a default the audience holds.
   *"The cost of microservices is not operational. It is cognitive, and we measure the wrong cost."*

3. **Observation.** A pattern across many cases.
   *"In the last year, every engineering org I've talked to has tried and abandoned the same AI experiment."*

4. **Confession.** A position the author held and updated.
   *"I spent two years arguing against monorepos. I was wrong, and the reasoning matters."*

5. **Question.** A real question the audience holds, named precisely.
   *"Why do good engineering managers stop writing code? And should they?"*

6. **Framework intro.** A model the author has been using.
   *"There are three jobs an on-call rotation can do. Most teams pick the wrong one."*

Hooks that fail: rhetorical questions nobody asked, "are you tired of…," generic openings, "in today's fast-paced world."

## 6. Quality filters

Every edition passes all five before publishing.

**Audience filter**

- Useful to the senior-engineer / CTO reader, specifically.
- Addresses a real, current challenge.
- Actionable or argumentatively useful within a week.

**Narrative filter**

- Reinforces one of the five pillars.
- Aligns with the strong opinions in `author-values.md`.
- Differentiates from generic engineering-leadership newsletters.

**Quality filter**

- Hook earns the next paragraph.
- At least one concrete example, number, or scene per major move.
- Counterargument is named, not hand-waved.
- Sounds like the author per `writing-style.md`.

**SEO filter**

- Title contains a search-friendly noun phrase.
- Subtitle stands alone as a hook for the email preview.
- The first 150 characters work as a standalone teaser.

**Exclusion check**

- No motivational close.
- No self-promo that doesn't serve the reader.
- No textbook tone.
- No banned phrases.

## 7. Source material

In priority order:

1. **Wiki notes** with `type: content` and `tag: newsletter`, where `status` is not `published`. These are ideas the author has flagged for the long form.
2. **Recent LinkedIn posts** that resonated and deserve depth.
3. **Books and essays** the author has been engaging with (cite them).
4. **Real incidents** from the author's work, anonymised.
5. **Original arguments** the author has been working through. Fallback, not default.

Source priority is configured at the directory level via the `wiki` manifest key.

## 8. Title and subject-line patterns

The title does double duty: it ranks in search and earns the open in inbox.

Patterns that work:

- **Concrete claim.** "Why we deleted 40 percent of our integration tests."
- **Question.** "Should engineering managers still write code?"
- **Framework.** "Three jobs of an on-call rotation."
- **Counter.** "The cost of microservices we keep mismeasuring."

Patterns to avoid:

- "10 lessons from…" (low-trust, formulaic).
- "How to" without a concrete subject.
- Vague abstractions.
- Hype words from the banned list.

## 9. Output format

Generated editions save to `outputs/content/Newsletter-DD-MM-YYYY.md`. The file ships ready for the user's publishing platform (Substack, beehiiv, Ghost, or owned). The plugin does not auto-publish newsletters; the author copies the file into the platform manually.

If `newsletter.external_archive_url` is set in `content-settings.yaml`, the LinkedIn Friday BOFU post links to it. Otherwise, the most recent newsletter file under `outputs/content/` is referenced.

## 10. Strategy notes

- **Replace every detail in this file** when adopting the plugin. The pillars, audience, and structure above are illustrative, not prescriptive. The plugin works best when this file reflects the actual newsletter positioning.
- **One pillar per edition.** Cross-pillar editions read as unfocused.
- **The counter is not optional.** A piece without a tension section is a marketing newsletter.
- **Cadence matters less than consistency.** Monthly with conviction outperforms weekly with filler.
