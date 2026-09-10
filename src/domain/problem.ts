import type { Difficulty } from "./enums";

/** A behaviour the design must be able to support — never a required class name. */
export interface Capability {
  id: string;
  title: string;
  description: string;
  /** Tokens and phrases that *signal* the behaviour. Names like Stall still match "spot". */
  signals: string[];
  /** Extra signals that count if an interface/abstract type exists. */
  seamSignals?: string[];
  weight: number;
  /** If set, this capability is only scored when the learner locked that clarification option. */
  activatedBy?: { questionId: string; optionId: string };
}

export interface ClarifyingOption {
  id: string;
  label: string;
  implication: string;
}

export interface ClarifyingQuestion {
  id: string;
  prompt: string;
  whyItMatters: string;
  options: ClarifyingOption[];
}

export interface Problem {
  id: string;
  title: string;
  difficulty: Difficulty;
  minutes: number;
  summary: string;
  scenario: string;
  requirements: string[];
  constraints: string[];
  capabilities: Capability[];
  questions: ClarifyingQuestion[];
  /** The classic interviewer move after a first design. */
  followUp: {
    title: string;
    prompt: string;
    whatItTests: string;
  };
  evaluatorNotes: string[];
  tags: string[];
}

export function activeCapabilities(
  problem: Problem,
  answers: Record<string, string>,
): Capability[] {
  return problem.capabilities.filter((capability) => {
    if (!capability.activatedBy) return true;
    return answers[capability.activatedBy.questionId] === capability.activatedBy.optionId;
  });
}

export function lockedScopeLines(
  problem: Problem,
  answers: Record<string, string>,
): string[] {
  return problem.questions.map((question) => {
    const option = question.options.find((item) => item.id === answers[question.id]);
    if (!option) return `${question.prompt} — unanswered`;
    return `${question.prompt} → ${option.label}. ${option.implication}`;
  });
}
