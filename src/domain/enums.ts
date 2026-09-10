export const ClassifierKind = {
  Class: "class",
  Interface: "interface",
  Abstract: "abstract",
} as const;
export type ClassifierKind = (typeof ClassifierKind)[keyof typeof ClassifierKind];

export const RelationKind = {
  Uses: "uses",
  Composes: "composes",
  Aggregates: "aggregates",
  Inherits: "inherits",
  Implements: "implements",
} as const;
export type RelationKind = (typeof RelationKind)[keyof typeof RelationKind];

export const AttemptStatus = {
  Draft: "draft",
  Submitted: "submitted",
  Evaluating: "evaluating",
  Evaluated: "evaluated",
  EvaluationFailed: "evaluation_failed",
  Abandoned: "abandoned",
} as const;
export type AttemptStatus = (typeof AttemptStatus)[keyof typeof AttemptStatus];

export const Difficulty = {
  Easy: "easy",
  Medium: "medium",
  Hard: "hard",
} as const;
export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];

export const CoverageStatus = {
  Covered: "covered",
  Partial: "partial",
  Missing: "missing",
} as const;
export type CoverageStatus = (typeof CoverageStatus)[keyof typeof CoverageStatus];

export const Band = {
  Fragile: "fragile",
  Developing: "developing",
  Solid: "solid",
  InterviewReady: "interview-ready",
} as const;
export type Band = (typeof Band)[keyof typeof Band];

export const Severity = {
  Low: "low",
  Medium: "medium",
  High: "high",
} as const;
export type Severity = (typeof Severity)[keyof typeof Severity];

export function bandFromScore(score: number): Band {
  if (score >= 85) return Band.InterviewReady;
  if (score >= 70) return Band.Solid;
  if (score >= 50) return Band.Developing;
  return Band.Fragile;
}
