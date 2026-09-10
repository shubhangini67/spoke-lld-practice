import { describe, expect, it } from "vitest";
import { PracticeService } from "@/application/practice-service";
import { AttemptStatus } from "@/domain/enums";
import { CatalogProblemRepository } from "@/infrastructure/problem-repo";
import { MemoryAttemptStore } from "@/infrastructure/attempt-store";
import { FrozenClock, SequenceIds } from "@/infrastructure/clock";
import { DeterministicEvaluator } from "@/evaluation/deterministic";
import { HybridEvaluator } from "@/evaluation/hybrid";
import { stallDesign } from "./fixtures";

function service(evaluator?: HybridEvaluator) {
  return new PracticeService(
    new CatalogProblemRepository(),
    new MemoryAttemptStore(),
    evaluator ?? new HybridEvaluator(new DeterministicEvaluator(), null),
    new FrozenClock("2026-09-11T00:00:00.000Z"),
    new SequenceIds(),
  );
}

describe("PracticeService loop", () => {
  it("start → draft → submit → evaluated, then revise without mutating parent", async () => {
    const svc = service();
    const draft = await svc.startAttempt({ problemId: "parking-lot" });
    expect(draft.status).toBe(AttemptStatus.Draft);

    await svc.saveDraft(draft.id, stallDesign());
    const evaluated = await svc.submit(draft.id);
    expect(evaluated.status).toBe(AttemptStatus.Evaluated);
    expect(evaluated.evaluation?.overall).toBeGreaterThan(50);
    const parentScore = evaluated.evaluation?.overall;

    const revision = await svc.startAttempt({
      problemId: "parking-lot",
      parentAttemptId: evaluated.id,
    });
    expect(revision.parentAttemptId).toBe(evaluated.id);
    expect(revision.status).toBe(AttemptStatus.Draft);
    expect(revision.design.types[0].name).toBe("Garage");

    const parent = await svc.getAttempt(evaluated.id);
    expect(parent.status).toBe(AttemptStatus.Evaluated);
    expect(parent.evaluation?.overall).toBe(parentScore);
  });

  it("empty submit stays a draft via domain validation", async () => {
    const svc = service();
    const draft = await svc.startAttempt({ problemId: "vending-machine" });
    await expect(svc.submit(draft.id)).rejects.toThrow(/two types|clarifying|walk through/i);
    const again = await svc.getAttempt(draft.id);
    expect(again.status).toBe(AttemptStatus.Draft);
  });

  it("evaluator crash marks evaluation_failed and retry recovers", async () => {
    const crashing: HybridEvaluator = {
      evaluate: async () => {
        throw new Error("boom");
      },
    } as never;
    const store = new MemoryAttemptStore();
    const clock = new FrozenClock("t0");
    const ids = new SequenceIds();
    const bad = new PracticeService(
      new CatalogProblemRepository(),
      store,
      crashing,
      clock,
      ids,
    );
    const draft = await bad.startAttempt({ problemId: "parking-lot" });
    await bad.saveDraft(draft.id, stallDesign());
    const failed = await bad.submit(draft.id);
    expect(failed.status).toBe(AttemptStatus.EvaluationFailed);

    const good = new PracticeService(
      new CatalogProblemRepository(),
      store,
      new HybridEvaluator(new DeterministicEvaluator(), null),
      clock,
      ids,
    );
    const recovered = await good.retryEvaluation(draft.id);
    expect(recovered.status).toBe(AttemptStatus.Evaluated);
    expect(recovered.design.types[0].name).toBe("Garage");
  });

  it("follow-up revise seeds the interviewer prompt into notes", async () => {
    const svc = service();
    const draft = await svc.startAttempt({ problemId: "parking-lot" });
    await svc.saveDraft(draft.id, stallDesign());
    const evaluated = await svc.submit(draft.id);
    const follow = await svc.startAttempt({
      problemId: "parking-lot",
      parentAttemptId: evaluated.id,
      applyFollowUp: true,
    });
    expect(follow.followUpApplied).toBe(true);
    expect(follow.design.notes).toMatch(/Follow-up:.*kWh/i);
  });
});
