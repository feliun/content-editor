# LinkedIn Content Strategy

> Example reference shipped with the plugin. The persona below ("Signal") is
> fictional. Replace the audience, pillars, and schedule with your own
> strategy, or override this file via the `linkedin-strategy` manifest key.

LinkedIn is the public scratchpad: short, frequent, opinionated. The newsletter is the long form. Together they reinforce a single voice. This file defines the LinkedIn half.

## 1. Audience

The reader is a senior engineer, engineering manager, technical founder, or CTO at a 10-500 person company. They have shipped real systems, run real teams, and seen enough buzzwords to spot one in a sentence.

What they care about, in order:

1. Technical decisions that compound (architecture, testing, AI tooling).
2. Engineering leadership without management theatre.
3. Tradeoffs other writers gloss over.
4. Concrete examples from people who have actually built the thing.

What they do not care about: motivation, "leadership lessons" with no engineering context, AI hype, productivity hacks.

## 2. Three content pillars

Every post lives in one of three pillars. If a draft fits none of them, kill it; the audience signed up for these.

| Pillar | Core question | Sample angles |
|--------|---------------|---------------|
| **Engineering leadership** | How do good technical leaders make decisions? | Hiring senior engineers, deciding what not to build, on-call culture, technical debt as a budget |
| **Systems thinking** | What is the model behind the surface problem? | Cost of context switching, failure modes that look like success, second-order effects of process changes |
| **AI tooling** | What actually works for senior developers? | Where coding agents help vs. hurt, prompt patterns, evals, tooling for code review, AI in production systems |

Pillars are not categories to fill. They are the lens through which any topic is examined. A post about hiring is an engineering-leadership post if the angle is decision-making, a systems-thinking post if the angle is feedback loops, an AI-tooling post if the angle is how the team uses AI in interviews.

## 3. Weekly schedule (TOFU/MOFU/BOFU)

Five posts per week, Monday through Friday. The schedule is funnel-shaped: top-of-funnel (curiosity), middle (depth), bottom (specific value).

| Day | Stage | Goal | Default pillar |
|-----|-------|------|----------------|
| Mon | TOFU | Wide reach, surface a question | Engineering leadership or Systems thinking |
| Tue | MOFU | Depth on a real problem | Engineering leadership |
| Wed | MOFU | Depth on a different angle | Systems thinking |
| Thu | MOFU | Specific tactical value | AI tooling |
| Fri | BOFU | Drive to newsletter or owned channel | Any pillar |

Use the day codes (`Mon`, `Tue`, ...) as keys. The plugin translates them per language at render time using `config/locales.yaml`.

The schedule is a starting shape, not a script. Skip a day before forcing a weak post.

## 4. Post structure

LinkedIn rewards short, scannable posts that earn the click on "see more."

```
HOOK (1-2 lines, max ~140 chars before the fold)
[blank line]
SETUP (2-4 lines: context, stakes)
[blank line]
PIVOT or SURPRISE (1-2 lines)
[blank line]
PAYOFF (3-6 lines: the actual insight)
[blank line]
CLOSE (1 line, optional CTA)
```

Total length: 600-1500 characters by default. Long posts (1500-3000) only when the depth genuinely warrants the scroll.

## 5. Hook patterns that work

- **Concrete claim.** "We removed 40 percent of our integration tests last quarter. Coverage went up."
- **Reframed default.** "Standups don't fail because they're too long. They fail because nobody decides anything."
- **Confession.** "I was wrong about microservices in 2021. I'm now sceptical of how I was right in 2024."
- **Specific scene.** "Tuesday, 9:14 a.m. The deploy is rolling. The on-call's coffee is still cold."
- **Counterintuitive number.** "Of the last 12 incidents, 10 had passing tests."

Patterns to avoid:

- Rhetorical questions that nobody asked.
- "Raise your hand if…"
- "Hot take:" / "Unpopular opinion:".
- Cliffhangers without payoff in the post.
- Generic surprise ("you won't believe what happened next").

## 6. Quality filters

Every post passes all four before scheduling.

**Audience filter**

- Useful to the senior-engineer / CTO reader, specifically.
- Addresses a real challenge, not an abstract concept.
- Actionable or argumentatively useful within a week.

**Narrative filter**

- Reinforces one of the three pillars.
- Aligns with the author's strong opinions in `author-values.md`.
- Differentiates from generic engineering-leadership content.

**Quality filter**

- Hook earns the second line.
- Has a concrete example, number, or scene.
- Sounds like the author per `writing-style.md`.
- Passes the 12-word core-message test.

**Exclusion check**

- No motivational tone.
- No self-promotion that doesn't serve the reader.
- No textbook tone.
- No banned phrases (see `writing-style.md`).

## 7. Source material

In priority order:

1. **Wiki notes** with `status: draft` (and optionally `tag: linkedin` if used). These are ideas the author has manually flagged as ready.
2. **Recent newsletter material.** Repurpose a section into a standalone post with a fresh hook.
3. **Real incidents from the author's work.** Anonymise as needed.
4. **Industry observations** with a fresh lens.
5. **Original ideas.** Fallback, not default.

Source priority is configured at the directory level via the `wiki` manifest key.

## 8. Friday BOFU

Friday's post drives to the newsletter or another owned channel. Patterns:

- Open with a question the newsletter answers.
- Quote one paragraph and link to the full edition.
- Reference a recent newsletter explicitly: "I wrote about this in {Edition Title}."

If `newsletter.external_archive_url` is set in `content-settings.yaml`, link directly to it. Otherwise, link to the most recent newsletter file under `outputs/content/`.

Never use "link in comments." Drop the URL inline in the post body.

## 9. Output format

Generated posts save to `outputs/content/Linkedin-DD-MM-YYYY.md` (where the date is the Monday of the target week). Two file shapes are supported by the publish skill:

- **Clean format.** H1 day headers (`# Mon`, `# Tue`, ...) with the post directly below. Ready to publish as-is.
- **Rich format.** H2 day headers with hooks, ideas, sources. The actual post lives under `### ✏️ Main content`. The publish skill extracts only that section.

Day labels in the file follow the configured `language` (English by default; Spanish or Portuguese as configured).

## 10. Strategy notes

- **Replace every detail in this file** when adopting the plugin. The audience, pillars, and schedule above are an example, not a recommendation. The plugin works best when this file reflects the writer's actual positioning, not a fictional persona's.
- **One pillar at a time.** A week that reinforces a single thread outperforms five disconnected posts.
- **Less is more.** Two posts a week with conviction beats five with hedge.
- **Engagement is a lagging signal.** A post that makes 100 senior engineers think differently outperforms 10,000 vanity impressions.
