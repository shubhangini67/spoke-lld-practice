import type { Design } from "@/domain/design";
import type { Evaluation } from "@/domain/evaluation";
import type { Evaluator } from "@/domain/ports";
import type { Problem } from "@/domain/problem";
import { DeterministicEvaluator } from "./deterministic";
import { LlmReviewer } from "./llm";

export class HybridEvaluator implements Evaluator {
  constructor(
    private readonly deterministic: DeterministicEvaluator,
    private readonly llm: LlmReviewer | null,
  ) {}

  async evaluate(input: {
    problem: Problem;
    design: Design;
    previous?: Evaluation | null;
  }): Promise<Evaluation> {
    const base = this.deterministic.run(input.problem, input.design, input.previous ?? null);
    if (!this.llm?.enabled()) return base;

    try {
      const notes = [
        ...base.coverage.map((item) => `${item.title}: ${item.status} (${item.evidence})`),
        ...base.concerns.map((item) => item.title),
      ].join("\n");
      const review = await this.llm.review(input.problem, input.design, notes);
      if (!review) return { ...base, degraded: true };

      return {
        ...base,
        degraded: false,
        strengths: mergeByTitle(base.strengths, review.strengths),
        concerns: mergeByTitle(base.concerns, review.concerns),
        alternatives: review.alternatives.length ? review.alternatives : base.alternatives,
        interviewerQuestions: review.interviewerQuestions.length
          ? review.interviewerQuestions.slice(0, 4)
          : base.interviewerQuestions,
        nextAttemptFocus: review.nextAttemptFocus || base.nextAttemptFocus,
      };
    } catch {
      return { ...base, degraded: true };
    }
  }
}

function mergeByTitle<T extends { title: string }>(base: T[], extra: T[]): T[] {
  const seen = new Set(base.map((item) => item.title.toLowerCase()));
  const out = [...base];
  for (const item of extra) {
    if (!seen.has(item.title.toLowerCase())) {
      out.push(item);
      seen.add(item.title.toLowerCase());
    }
  }
  return out.slice(0, 8);
}
