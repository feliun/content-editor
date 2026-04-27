# Author Thinking Style

> Example reference shipped with the plugin. The thinking style described
> below belongs to a fictional persona. Replace this file with your own
> reasoning style, or override via the `author-thinking-style` manifest key.

This file describes **how the author reasons**. The voice guide handles how the author writes; the values guide handles what they believe. This file is about the cognitive shape of the prose: how a problem is decomposed, what evidence the author trusts, which biases they are aware of, and which decision frameworks recur in their work.

The content reviewer uses this file to keep the reasoning shape consistent across generated drafts. A piece in the author's voice but with someone else's reasoning style fails the voice match check.

## 1. Default reasoning shape

For any non-trivial problem, the author moves through roughly the same five steps:

1. **State the surface problem in one sentence.**
2. **Ask what the underlying system is.** Not what the symptom is.
3. **Identify the feedback loops.** Where does the system learn? Where does it not?
4. **Surface the counterargument.** What is the strongest reason this analysis is wrong?
5. **State the smallest useful action.** What changes if the analysis is right?

This shape is visible in essays and posts. A draft that skips step 2 (jumps from symptom to action) is flagged by the content reviewer as shallow.

## 2. Evidence the author trusts

In rough order of weight:

- **First-hand experience.** Things the author actually did, including the failures.
- **Quantitative artifacts.** Numbers from real systems, even small ones.
- **Specific case studies.** Public postmortems, retrospectives, named cases.
- **Frameworks tested in practice.** Theories the author has used, not theories they have read.
- **Paper claims.** Useful, but treated as starting points, not conclusions.
- **Vendor claims.** Treated with default scepticism unless independently verified.

Evidence the author distrusts: anonymous anecdotes, "I've seen many companies" without specifics, surveys, "research shows" without a citation.

## 3. Biases the author tries to correct for

- **Survivorship bias.** Successful companies make terrible teachers. The author tries to cite failure cases at least as often as success cases.
- **Recency bias.** A trend that is two months old is not a trend.
- **Personal generalisation.** What worked at one company is a hypothesis, not a law.
- **Status-quo bias against new tools.** AI tooling especially: the author tries to actually use a tool before commenting on it.
- **Status-seeking contrarianism.** Reversing the default just to be different is a tell. The author tries to argue for the position they actually hold, even when it is the boring one.

## 4. Decision frameworks that recur

A handful of frameworks show up across the author's work. Generated content can lean on these without overusing them.

### 4.1 Cost types: operational vs cognitive vs structural

For any architectural decision, three cost types apply:

- **Operational cost.** Money, infra, ops time. Easy to measure, often the lagging signal.
- **Cognitive cost.** How much the team has to hold in their head to operate the system safely. Hard to measure, often dominant.
- **Structural cost.** Whether the system makes the right next change easy or hard. Slowest to surface; biggest in the long run.

Most engineering decisions optimise for operational cost because it is the only one that fits in a spreadsheet. The author argues from the cognitive and structural costs.

### 4.2 The on-call test

For any process or system: if I were paged at 3 a.m. with this in production, would I curse my past self for the design? If yes, the design is wrong.

Used to evaluate observability, deployment, configuration, and architectural choices.

### 4.3 The 12-word test

Any thesis that cannot be stated in 12 words has not been thought through enough. The author uses this on their own drafts before publishing. The content reviewer applies it as a quality filter.

### 4.4 The "what would change" test

For any prediction or framework: what concrete observation would change my mind? If nothing would, the position is faith, not analysis. The author flags this in their own writing and rejects pieces where the answer is "nothing."

### 4.5 Local vs second-order effects

For any process change: what happens in week one (local effect) and what happens in month six (second-order effect)? Most process advice optimises week one. The author tends to argue from month six.

## 5. Tone of reasoning

- **Calm.** No urgency, no doom, no euphoria.
- **Concrete.** Specific examples over abstract claims.
- **Tentative where the evidence is weak.** "I think," "the working hypothesis," "we tested this in one team," when honest.
- **Confident where the evidence is strong.** "This is wrong," "the data is clear," when honest.
- **Curious, not adversarial.** The author argues with positions, not with the people holding them.

## 6. Anti-patterns in reasoning

The content reviewer flags these even in pieces that pass the voice check.

- **Jumping from symptom to action.** Skipping the system layer.
- **Universal claims from one data point.** "We tried it once and it failed, therefore X is bad."
- **Hand-waved counterargument.** "Some might say X, but obviously Y." The reviewer flags any "obviously" used to skip work.
- **Hype-cycle reasoning.** "Everyone is doing X" or "no one is doing Y" as evidence.
- **Strawman counterarguments.** Naming a weak version of the opposing view to defeat it.
- **Authority appeals without evidence.** "The CTO of X said Y." The author cites the reasoning, not the source's title.

## 7. Replacement note

This file is example content. When adopting the plugin, rewrite it to reflect the actual author's reasoning style. A practical exercise: pick the last three pieces you wrote, find the reasoning shape that recurs, and write it down. Then list the biases you know you have and the frameworks you actually use. That is enough to anchor the content reviewer.
