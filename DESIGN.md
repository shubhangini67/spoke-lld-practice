# Design note

CipherSchools LLD practice MVP. This is how I modelled Spoke, not a second README.

## What I actually shipped

A local (and now hosted) app. Pick one of five problems, answer the clarifying questions, fill types + relationships, walk a use case, submit, read a review, then either revise or take the follow-up. The follow-up is a new attempt linked to the old one. I do not edit history.

Problems: Vending Machine, Parking Lot, Meeting Room Scheduler, In-memory Cache, Elevator. Each has a scenario, requirements, constraints, a couple of clarifying questions that can turn extra capabilities on, and a follow-up.

One Next.js process. One learner. No login. I tried to model the platform the same way I would model Parking Lot on a whiteboard: a few types, clear ownership, seams where I might swap something later.

## Flow

Catalog → brief → start (draft) → studio with autosave → submit → evaluating → evaluated (or evaluation_failed) → review → revise / follow-up → history / compare.

The studio lets you click Submit even if the form is empty. Validation is `validateForSubmit` on the design: two named types with responsibilities, every question locked, three walkthrough beats that only mention real types, at least one relationship, assumptions, rejected alternative. If that fails you get a 400 and stay in draft.

I almost disabled the button. Then the rule would only exist in React. That felt wrong for an LLD assignment.

## LLD of the platform

`src/domain` does not import Next or `fs`.

**Problem** has **Capability** objects. A capability is something the design should be able to do, not a required class name. “Compatible spot assignment” is a capability. `ParkingSpot` is not. Some capabilities only count if you picked a certain clarification (multi-floor, cards, a lift bank, recurring meetings).

**Attempt** is the aggregate. It owns a **Design**, and after scoring an **Evaluation**. Status changes are methods on Attempt (`submit`, `beginEvaluation`, `complete`, `fail`, `retryEvaluation`). Illegal jumps throw `InvalidStateTransition`.

**Design** is what you submit: clarifications, types, relationships, walkthrough, assumptions, rejected path, optional notes/code.

**Evaluation** is a value object. Dimensions, coverage with evidence, strengths, concerns, alternatives, interviewer questions, next-attempt focus, optional delta vs parent. Once written, we don’t patch it. Revise instead.

**PracticeService** is the only use-case class. API routes map errors to 400/404/409. They don’t score anything.

Ports: `ProblemRepository`, `AttemptRepository`, `Evaluator`, `LlmClient`, `Clock`, `IdGenerator`.

If I add a code-based evaluator later, it still does submit → evaluate on the same Attempt. If I parse a diagram later, it should produce a Design. The aggregate stays.

## Evaluation

**Always runs (deterministic):**

- Coverage: look for signals in names, responsibilities, methods, walkthrough, defense. Two hits = covered. I wrote a test that `Stall` still covers assignment.
- Structure: god class, vague responsibility, isolated types, inheritance-only, a cluster of concrete types with no interface.
- Walkthrough: enough beats, more than one actor, a real verb, not just A talking to A.
- Scope: if you said several floors, floors have to show up somewhere.
- Defense: assumption + rejected path with a reason.

Dimensions: scope, coverage, collaboration, cohesion, extensibility, defense. Weights are in one function. The UI shows a band more than the integer because I don’t want people grinding 73 vs 74.

**LLM, if a key is present:** prose only. Extra strengths/concerns, alternatives with “fits when”, questions, next focus. Prompt says do not invent a class list. Unknown names stripped. ~10s timeout.

**If something breaks:**

| What | Status | UI |
| --- | --- | --- |
| No key / timeout / garbage JSON | evaluated, degraded=true | still a full checker review |
| evaluate() throws | evaluation_failed | Retry on the same attempt |
| Invalid design | draft | domain message |

No queue, no worker. The states are already there if I ever move evaluation off the request.

## Trade-offs I would defend in a viva

Structured studio vs a canvas vs a Java IDE: I wanted feedback I can compare across attempts. You cannot draw freely and you cannot compile. A parser can sit behind the same Evaluator later.

Capabilities vs a hidden answer key: that was the whole assignment. Signal matching is leaky. I show evidence instead of hiding `ParkingSpot` behind the heuristic.

Making clarify + walkthrough required: annoying. Without them this is a class dump with a score, which is how people already fail the round.

Scoring on the request: no scale. Timeout + fallback is enough for five problems. Statuses exist if it moves later.

JSON file vs sqlite: the port is `AttemptRepository`. A file is honest for one user. I did not add Postgres to look “production”.

No auth: this is a design demo.

## Mapping back to the brief

**What does the learner provide?** Enough that a reviewer can point at a type and ask why it knows that, plus the scope they locked and one narrated use case. Missing those, feedback is guessing.

**Useful feedback when two designs are both fine?** Capabilities, seams, evidence, alternatives as “this shape fits when”, questions, follow-up. Never a required name.

**Deterministic vs LLM?** Checker owns scores. Model owns the writeup when it is available.

**New evaluator / format later?** `Evaluator` and `AttemptRepository`. Design is the evidence object.

**Slow / failed evaluation?** Spinner on the same request. Degrade if the model is down. Fail evaluation, not the submission, on a crash. Retry is one method on Attempt.
