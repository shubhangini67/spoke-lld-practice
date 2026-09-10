import type { Design } from "@/domain/design";
import { designCorpus } from "@/domain/design";
import type { Problem } from "@/domain/problem";
import { matchingSignals, tokenize } from "./tokens";

export interface ScopeReport {
  answered: number;
  expected: number;
  honored: { questionId: string; ok: boolean; evidence: string }[];
  score: number;
}

const OPTION_SIGNALS: Record<string, string[]> = {
  "floors:multi": ["floor", "level", "storey", "deck"],
  "floors:single": [],
  "pricing-now:hourly": ["hour", "duration", "time", "clock", "rate"],
  "tender:multi": ["card", "wallet", "tender", "method", "processor"],
  "recurrence:yes": ["recurring", "series", "weekly", "occurrence"],
  "cars:bank": ["bank", "dispatch", "controller", "fleet"],
  "policy:lru": ["lru", "recent", "list"],
  "policy:lfu": ["lfu", "frequency", "count"],
  "store:writethrough": ["store", "persist", "write"],
  "timezone:multi": ["timezone", "instant", "utc", "offset"],
};

export function analyzeScope(problem: Problem, design: Design): ScopeReport {
  const tokens = tokenize(designCorpus(design));
  const honored = problem.questions.map((question) => {
    const optionId = design.clarifications[question.id];
    if (!optionId) {
      return {
        questionId: question.id,
        ok: false,
        evidence: "This question was not locked.",
      };
    }
    const key = `${question.id}:${optionId}`;
    const signals = OPTION_SIGNALS[key] ?? [];
    if (signals.length === 0) {
      return {
        questionId: question.id,
        ok: true,
        evidence: "Scope choice does not demand extra vocabulary.",
      };
    }
    const hits = matchingSignals(tokens, signals);
    if (hits.length === 0) {
      return {
        questionId: question.id,
        ok: false,
        evidence: `You locked a scope that should show up in the design (${signals.slice(0, 3).join(", ")}), but it does not.`,
      };
    }
    return {
      questionId: question.id,
      ok: true,
      evidence: `Locked scope is visible: ${hits.join(", ")}.`,
    };
  });

  const answered = problem.questions.filter((question) => design.clarifications[question.id]).length;
  const scored = honored.filter((item) => {
    const question = problem.questions.find((q) => q.id === item.questionId);
    const optionId = question ? design.clarifications[question.id] : undefined;
    const key = question && optionId ? `${question.id}:${optionId}` : "";
    return (OPTION_SIGNALS[key] ?? []).length > 0;
  });
  const okCount = scored.filter((item) => item.ok).length;
  const score =
    scored.length === 0
      ? answered === problem.questions.length
        ? 88
        : 40
      : Math.round(40 + (60 * okCount) / scored.length);

  return {
    answered,
    expected: problem.questions.length,
    honored,
    score,
  };
}
