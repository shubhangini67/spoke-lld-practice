import type { Band, CoverageStatus, Severity } from "./enums";

export interface CoverageItem {
  capabilityId: string;
  title: string;
  status: CoverageStatus;
  evidence: string;
  weight: number;
}

export interface DimensionScore {
  id: string;
  title: string;
  score: number;
  rationale: string;
  source: "deterministic" | "llm";
}

export interface Strength {
  title: string;
  detail: string;
  relatedTypes: string[];
}

export interface Concern {
  severity: Severity;
  title: string;
  whyItMatters: string;
  question: string;
  relatedTypes: string[];
}

export interface Alternative {
  name: string;
  whenItFits: string;
  tradeoff: string;
}

export interface Evaluation {
  overall: number;
  band: Band;
  degraded: boolean;
  dimensions: DimensionScore[];
  coverage: CoverageItem[];
  strengths: Strength[];
  concerns: Concern[];
  alternatives: Alternative[];
  interviewerQuestions: string[];
  nextAttemptFocus: string;
  coverageDelta: number | null;
}
