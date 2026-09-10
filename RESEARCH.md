# Research note

CipherSchools — LLD practice platform

## How LLD practice actually fails

When I sit down to practice a Parking Lot or an Elevator I can usually get boxes on a page. I cannot usually answer the only question that matters: is this any good?

What I do next is one of three things.

I open a GitHub repo and start renaming my classes to match theirs. I dump the sketch into ChatGPT and get a lecture about Strategy. Or I stop.

The learner problem is not “I don’t know what a class diagram is.” It is that there is no honest way to **submit a design, get feedback that still allows other valid designs, remember the last attempt, and face the follow-up an interviewer will actually ask**.

## What I looked at

I spent a small amount of time on tools people actually use, not LMS catalogs.

**Hello Interview’s LLD guide** is the clearest about what the round scores: problem analysis, class design, extensibility, communication. They emphasise clarifying questions first and a follow-up requirement at the end. Most practice tools skip both.

**Grokking / Educative** teach a method and then a model solution. Useful for first exposure. Weak as a loop: feedback is “here is ours.”

**LLD Mastery / AlgoMaster playgrounds** are closer to an interview: clarify, diagram, code, AI feedback. They are large products. They still tend to steer you toward a canonical shape, and they do not freeze *your* attempt as history you can diff.

**Codezym and machine-coding IDEs** are LeetCode for LLD. Hidden tests, real code, company tags. Strong for implementation under time. Weak for design quality: a god class that parks cars still parks cars, and a valid design with different method names fails.

**GitHub LLD dumps** (BookMyShow, Logger, Parking Lot) are useful *after* you know what you are aiming for. Harmful as the first move, because one naming becomes canon.

**Unstructured ChatGPT** is fast and inconsistent. No problem-specific checklist, no history, and a habit of saying “add a Strategy” without asking whether the current type is the wrong home for that behaviour.

**Human mocks** are still the best for “can you defend this.” I cannot do that at 11pm. I want a rehearsal for that conversation, not a replacement.

## What a meaningful attempt has to contain

Interviewers do not score a screenshot. They score a conversation:

1. **Scope you locked.** Single floor or multi? Coins only or cards soon? If this is missing, you designed a different system than the one in the room.
2. **Named types with responsibilities.** The smallest thing a reviewer can point at and ask “why does this know that?”
3. **Who talks to whom.** A bag of nouns is a vocabulary list.
4. **A walked-through use case.** “User parks a truck” across objects, in order. This is the part candidates skip and interviewers ask for.
5. **A rejected alternative.** Senior signal. Junior candidates only show the shape they kept.

Code can illustrate a seam. It should not be the unit of practice for this MVP. Tests will happily pass a mess.

## What makes feedback useful when many designs are valid

Judge **capabilities** (behaviours the design must support) and **change-seams** (where Monday’s requirement lands). Show **evidence** so the learner can argue with the checker. Offer alternatives as “this shape fits when…”, never as *the* answer. Prefer questions the learner should be able to answer in the room. After the first review, the **follow-up** is the second half of the interview — practice that, or you practiced half a round.

Do not freeze a class list. `Stall` that assigns vehicles still covers spot assignment. I wrote a test for that on purpose.

## Deterministic vs LLM

Coverage, graph smells, walkthrough coherence, scope fidelity, submit validation, and the attempt state machine are deterministic. They have to work offline and they have to be arguable.

Qualitative defense, other valid shapes, and interviewer-style questions benefit from an LLM — on top of the checker, never instead of it. The model does not own the score. If it names a type I did not write, that gets stripped.

## Gaps I chose to close in two days

Most tools skip clarifying questions, skip the narrated use case, skip the follow-up, and skip revision history. Spoke is small on purpose and opinionated there.

Out of scope: accounts, contest timers, a drawing canvas, hidden JUnit, a distributed evaluation bus.
