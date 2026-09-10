# Design note

CipherSchools — LLD practice MVP

## What I shipped

A local app where I pick one of five LLD problems, lock clarifying questions, work a design in a studio, walk a use case, submit, read a review, and start a revision that is linked to the last attempt — including the interviewer follow-up.

Problems: Vending Machine, Parking Lot, Meeting Room Scheduler, In-memory Cache, Elevator. Each one has a scenario, requirements, constraints, clarifying questions that change the scored capability set, and a follow-up.

One Next.js process. One learner. No login. The platform is modelled the way I would model a problem on the bench.

## User flow

Catalog → brief → start attempt (draft) → studio (autosave) → submit → evaluating → evaluated (or evaluation failed) → review → revise / revise for follow-up → history / compare.

The studio will not let me submit garbage. I need two named types with responsibilities, every clarifying question locked, three walkthrough beats that only name real types, at least one relationship, assumptions, and a rejected alternative. That rule lives on `validateForSubmit`.

## LLD of the platform

Domain types do not import Next.js or `fs`.

**Problem** has many **Capability** objects. A capability is an outcome, not a required class name. “Compatible spot assignment” is a capability. `ParkingSpot` is not. Some capabilities only activate when a clarification option is locked (multi-floor, card payments, a lift bank, recurring meetings).

**Attempt** is the aggregate root. It owns a **Design** and, after evaluation, an **Evaluation**. Status changes live on the aggregate (`submit`, `beginEvaluation`, `complete`, `fail`, `retryEvaluation`). Illegal transitions raise `InvalidStateTransition`.

**Design** is the submission format: clarifications, types, relationships, walkthrough, assumptions, rejected alternative, optional notes/code.

**Evaluation** is an immutable value object: dimensions, coverage with evidence, strengths, concerns, alternatives, interviewer questions, next-attempt focus, optional coverage delta vs parent.

**PracticeService** is the only use-case layer. HTTP adapters map errors to 400/404/409. They do not park cars, and they do not evaluate.

Ports: `ProblemRepository`, `AttemptRepository`, `Evaluator`, `LlmClient`, `Clock`, `IdGenerator`.

If I add a machine-coding evaluator later, it still runs `submit → evaluate` on the same Attempt. If I add a diagram parser later, it produces a `Design` (or a `DesignEvidence` view of one). The aggregate does not change.

## Evaluation split

**Deterministic (always).**

- Capability coverage via signals in names, responsibilities, methods, walkthrough, and defense. Two hits = covered. `Stall` still covers assignment.
- Structural smells: god class, vague responsibility, disconnected types, inheritance-only graphs, copy-pasted concrete clusters with no interface.
- Walkthrough: enough beats, more than one actor, core verbs, not only self-talk.
- Scope fidelity: if you locked “several floors,” the design has to mention floors.
- Defense thickness: assumptions + a rejected path with a reason.

Dimensions: scope, coverage, collaboration, cohesion, extensibility, defense. The UI leads with a **band** (fragile / developing / solid / interview-ready), not the integer. Weights live in one function.

**LLM (optional).** Prose only. Strengths, extra concerns, alternatives with “when it fits,” interviewer questions, next-attempt focus. Prompt is forbidden from inventing a class list. Names not in the submission are stripped. Timeout ~10s.

**Failure path (practical, not a queue).**

| What fails | Attempt status | Learner sees |
| --- | --- | --- |
| Missing key / timeout / junk JSON | `evaluated` (`degraded`) | Full deterministic review |
| `Evaluator.evaluate` throws | `evaluation_failed` | Retry. Submission untouched |
| Invalid draft | stays `draft` | Domain message, HTTP 400 |

No broker. The domain already has the states a worker would need.

## Trade-offs I will defend

**Structured studio vs UML canvas vs Java IDE.** I wanted comparable feedback and an LLD argument. Cost: you cannot draw freely; you cannot compile. A parser or a code adapter can sit behind the same `Evaluator` later.

**Capabilities vs a golden solution.** The whole point. Cost: signal matching is leaky. I show evidence. I did not hide a class list behind the heuristic.

**Clarify-and-walkthrough as required.** Extra friction. Without them the product is a class dump with a score, which is how people already fail interviews.

**Sync evaluation.** No horizontal scale. Timeout + fallback is enough. Statuses are already there if evaluation moves off-request later.

**JSON file vs SQLite.** The port is `AttemptRepository`. A file is honest for one learner. I did not pretend I needed Postgres.

**No auth.** The demo is design, not sessions.

## What the assignment asked

**What does a learner need to provide?** Enough that a reviewer can point at a type and ask “why does this know that?”, plus the scope they locked and one narrated use case. If those are missing, feedback is guessing.

**Useful feedback with many valid designs?** Capabilities, seams, evidence, alternatives as conditional shapes, questions, and a follow-up. Never a required name.

**Deterministic vs LLM?** Checker owns scores and structure. Model owns qualitative argument, when it is available.

**Another evaluator or format later?** `Evaluator` and `AttemptRepository` ports. `Design` is the evidence object; a future code submission can extract the same shape.

**If evaluation takes time or fails?** Wait on the request with a spinner. Degrade if the model is down. Fail the *evaluation*, not the submission, on a crash. Retry is one use case.
