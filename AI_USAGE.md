# AI usage

The assignment asked how I used a model and what I refused. This is that list. I did use an assistant (chat + code help) while building Spoke. The calls below are the ones that actually changed the design.

## 1. What the learner submits

Early suggestions kept looking like a code editor plus hidden tests, because that is what machine-coding sites are.

I did not make that the main artifact. You have to hand in a design someone can talk about: locked clarifying questions, types with responsibilities, relationships, a three-beat walkthrough, assumptions, one rejected alternative. Code is optional.

Reason: this brief is LLD, not “make Parking Lot compile”. A walkthrough is the smallest version of the interview conversation. Tests will pass a god class.

## 2. Scoring when two designs are both ok

The easy answers were a golden class list (`ParkingLot`, `ParkingSpot`, `Ticket`) or “ask an LLM for a score out of 10”.

I rejected both. Each problem lists capabilities. Some of those only turn on if you locked a clarification (multi-floor, lift bank, recurring meetings). A checker looks at coverage, graph smells, walkthrough, scope. The model may add qualitative comments. Coverage dimensions stay marked deterministic.

Reason: “you didn’t name it ParkingSpot” just trains people to copy blogs. Evidence is on the review so I can disagree with the checker.

## 3. Model slow or missing

Suggestions here were retries, circuit breakers, queues, outbox. That is a different assignment.

I did none of that. HTTP timeout around 10 seconds. Missing key, abort, or junk JSON still completes the attempt with the checker (`degraded=true`). `evaluation_failed` only if `evaluate()` throws. Retry is one method on the same Attempt.

Reason: the brief asked for a practical failure path, not a distributed system.

## 4. How many services

Splitting “problem service”, “attempt service”, “evaluation service” would have been fake HLD for five problems.

One Next.js app. Folders for domain / evaluation / application / infrastructure / API. JSON behind `AttemptRepository`. The seams I actually care about are `Evaluator` and `AttemptRepository`.

## 5. Studio UI

First UI sketch I got was the usual dashboard: sidebar, purple, “insights”, jump straight to class boxes.

I changed it to four steps: Clarify → Structure → Walkthrough → Defend. The graph is just a view of the types, not a drawing tool.

If the screen looks like a chatbot wrapper, people will assume the product is a prompt. Clarifications and the walkthrough have to be real steps or the research note is fake.

## What I still consider my calls

- Attempt is the aggregate. Evaluations don’t get edited in place.
- Revise clones. History stays.
- Follow-up is a real next attempt, not a tooltip.
- Signal matching is leaky. I wrote that down instead of hiding an answer key.
- No k8s, no contest clock, no fake login.

## What the assistant actually touched

I used it for first drafts of the five problem briefs, a lot of the React studio (forms, autosave, the sticky bar), and the Vitest files.

I rewrote the domain layer, `validateForSubmit`, walkthrough/scope checks, and `HybridEvaluator` when the first versions were either too cute or too close to “did you name ParkingSpot”. Catalog examples (Parking Lot uses `Stall` on purpose) I edited by hand so the coverage test means something.

If a design choice is in DESIGN.md, I can defend it without the chat log.
