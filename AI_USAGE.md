# AI usage

These are the design calls I actually made, including the ones I said no to.

## 1. What the learner has to submit

A first draft kept steering toward a code editor plus hidden tests, because that is what machine-coding sites do.

I rejected that as the primary artifact. The required thing is a **discussable design**: locked clarifying questions, types with responsibilities, relationships, a three-beat walkthrough, assumptions, and one rejected alternative. Code is optional.

Why: this assignment is LLD, not “make Parking Lot compile.” A walkthrough is the smallest rehearsal of the interview conversation. Tests will pass a god class.

## 2. How to score when two designs are both valid

The easy suggestions were either a golden class list (`ParkingLot`, `ParkingSpot`, `Ticket`) or “ask an LLM for a 1–10.”

I rejected both. Problems publish **capabilities**. Some of those capabilities only turn on if the learner locked a clarification (multi-floor, a lift bank, recurring meetings). A deterministic checker looks at coverage, graph smells, walkthrough coherence, and scope fidelity. The LLM may only add qualitative review. Coverage dimensions stay `source=deterministic`.

Why: “you didn’t name it ParkingSpot” is how courses teach imitation. Evidence is shown so I can argue with the checker.

## 3. What happens if the model is slow or down

The usual suggestion was retries, circuit breakers, queues, outbox.

I did not build any of that. About 10 seconds of HTTP timeout. Missing key, abort, or junk JSON still completes the attempt with deterministic feedback (`degraded=true`). `evaluation_failed` is only if the evaluator itself throws. Retry is one use case on the same Attempt.

Why: the brief asked for a practical path, not a distributed-systems project.

## 4. Platform shape

Splitting a problem service, an attempt service, and an evaluation service would be fake HLD for five problems.

One Next.js process, domain / evaluation / application / infrastructure / API folders, JSON store behind `AttemptRepository`. The seams that matter are `Evaluator` and `AttemptRepository`.

## 5. Studio

The first UI pass looked like every AI dashboard: sidebar, purple, “insights,” jump straight to class boxes.

I pushed it toward a four-step rehearsal: Clarify → Structure → Walkthrough → Defend. The live graph is a by-product of the types, not a drawing tool.

Why: if the interface looks like a chatbot wrapper, people will assume the whole product is a prompt. Clarifications and the walkthrough have to feel first-class or the research note is a lie.

## What stayed my decision

- Attempt is the aggregate root. Evaluations are immutable.
- Revisions clone. They do not edit history.
- Follow-up is a first-class next attempt, not a footnote.
- Signal matching is leaky. I documented that. I did not hide a golden class list.
- Scope: no Kubernetes, no contest timer, no fake auth.

I used an assistant for problem briefs, a lot of the React studio, and tests. I still rewrote the domain, the walkthrough/scope checkers, and HybridEvaluator when early versions were either too clever or too close to a golden-answer checker. These notes were rewritten so they read like a design review, not a product launch.
