import { describe, expect, it } from "vitest";
import { Attempt } from "@/domain/attempt";
import { AttemptStatus } from "@/domain/enums";
import { InvalidStateTransition, InvalidSubmission } from "@/domain/errors";
import { validateForSubmit } from "@/domain/design";
import { godClassDesign, stallDesign, thinDesign } from "./fixtures";

describe("Attempt state machine", () => {
  it("starts as a draft and freezes after evaluation", () => {
    const attempt = Attempt.start({
      id: "a1",
      problemId: "parking-lot",
      now: "2026-09-11T00:00:00.000Z",
    });
    expect(attempt.status).toBe(AttemptStatus.Draft);
    attempt.submit("2026-09-11T00:01:00.000Z");
    attempt.beginEvaluation("2026-09-11T00:01:01.000Z");
    attempt.complete(
      {
        overall: 70,
        band: "solid",
        degraded: false,
        dimensions: [],
        coverage: [],
        strengths: [],
        concerns: [],
        alternatives: [],
        interviewerQuestions: [],
        nextAttemptFocus: "split pricing",
        coverageDelta: null,
      },
      "2026-09-11T00:01:02.000Z",
    );
    expect(attempt.status).toBe(AttemptStatus.Evaluated);
    expect(() => attempt.saveDraft(stallDesign(), "now")).toThrow(InvalidStateTransition);
  });

  it("failed evaluation can retry without mutating the submission", () => {
    const attempt = Attempt.start({
      id: "a1",
      problemId: "parking-lot",
      now: "t0",
      design: stallDesign(),
    });
    attempt.submit("t1");
    attempt.beginEvaluation("t2");
    const before = structuredClone(attempt.design);
    attempt.fail("boom", "t3");
    expect(attempt.status).toBe(AttemptStatus.EvaluationFailed);
    expect(attempt.design).toEqual(before);
    attempt.retryEvaluation("t4");
    expect(attempt.status).toBe(AttemptStatus.Evaluating);
  });
});

describe("submit validation", () => {
  it("rejects a class dump with no walkthrough or defense", () => {
    expect(() => validateForSubmit(thinDesign(), ["floors", "pricing-now"])).toThrow(InvalidSubmission);
  });

  it("accepts a discussable Stall-based parking design", () => {
    expect(() => validateForSubmit(stallDesign(), ["floors", "pricing-now"])).not.toThrow();
  });

  it("rejects a walkthrough that names a missing type", () => {
    const design = stallDesign();
    design.walkthrough[0].actor = "Ghost";
    expect(() => validateForSubmit(design, ["floors", "pricing-now"])).toThrow(/Ghost/);
  });
});
