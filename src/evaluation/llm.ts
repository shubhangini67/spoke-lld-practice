import type { Alternative, Concern, Strength } from "@/domain/evaluation";
import type { Design } from "@/domain/design";
import { namedTypes } from "@/domain/design";
import type { LlmClient } from "@/domain/ports";
import type { Problem } from "@/domain/problem";
import { Severity } from "@/domain/enums";

export interface LlmReview {
  strengths: Strength[];
  concerns: Concern[];
  alternatives: Alternative[];
  interviewerQuestions: string[];
  nextAttemptFocus: string;
}

export class LlmReviewer {
  constructor(private readonly client: LlmClient) {}

  enabled(): boolean {
    return this.client.configured();
  }

  async review(problem: Problem, design: Design, deterministicNotes: string): Promise<LlmReview | null> {
    if (!this.enabled()) return null;
    const prompt = buildPrompt(problem, design, deterministicNotes);
    const raw = await this.client.complete(prompt);
    return sanitize(parseReview(raw), design);
  }
}

function buildPrompt(problem: Problem, design: Design, deterministicNotes: string): string {
  const types = namedTypes(design)
    .map(
      (item) =>
        `- ${item.kind} ${item.name}: ${item.responsibility} | fields: ${item.fields.join(", ") || "—"} | methods: ${item.methods.join(", ") || "—"}`,
    )
    .join("\n");
  const walk = design.walkthrough
    .filter((step) => step.actor.trim())
    .map((step) => `${step.actor} --${step.action}--> ${step.collaborator} (${step.outcome})`)
    .join("\n");

  return `You are a staff engineer giving LLD interview feedback.
There is more than one valid design. Never invent a required class list. Never mention types the candidate did not write.
Do not overwrite coverage scores. Talk about the candidate's actual types.

Problem: ${problem.title}
Scenario: ${problem.scenario}
Follow-up the interviewer will ask: ${problem.followUp.prompt}

Candidate types:
${types}

Walkthrough:
${walk}

Rejected: ${design.rejected.approach} because ${design.rejected.whyNot}

Assumptions:
${design.assumptions.filter(Boolean).join("\n")}

Deterministic checker notes (do not contradict coverage; you may explain it):
${deterministicNotes}

Return ONLY JSON:
{
  "strengths": [{"title": "", "detail": "", "relatedTypes": []}],
  "concerns": [{"severity": "low|medium|high", "title": "", "whyItMatters": "", "question": "", "relatedTypes": []}],
  "alternatives": [{"name": "", "whenItFits": "", "tradeoff": ""}],
  "interviewerQuestions": ["", "", ""],
  "nextAttemptFocus": ""
}`;
}

function parseReview(raw: string): LlmReview {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("LLM did not return JSON");
  const parsed = JSON.parse(match[0]) as Partial<LlmReview>;
  return {
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
    alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives : [],
    interviewerQuestions: Array.isArray(parsed.interviewerQuestions) ? parsed.interviewerQuestions : [],
    nextAttemptFocus: typeof parsed.nextAttemptFocus === "string" ? parsed.nextAttemptFocus : "",
  };
}

function sanitize(review: LlmReview, design: Design): LlmReview {
  const known = new Set(namedTypes(design).map((item) => item.name.trim().toLowerCase()));
  const keepTypes = (names: string[] | undefined) =>
    (names ?? []).filter((name) => known.has(String(name).trim().toLowerCase()));

  const severities = new Set(["low", "medium", "high"]);
  return {
    strengths: review.strengths
      .filter((item) => item?.title && item?.detail)
      .map((item) => ({ ...item, relatedTypes: keepTypes(item.relatedTypes) })),
    concerns: review.concerns
      .filter((item) => item?.title && item?.whyItMatters)
      .map((item) => ({
        severity: severities.has(item.severity) ? item.severity : Severity.Medium,
        title: item.title,
        whyItMatters: item.whyItMatters,
        question: item.question || "What would you change on the next attempt?",
        relatedTypes: keepTypes(item.relatedTypes),
      })),
    alternatives: review.alternatives.filter((item) => item?.name && item?.whenItFits),
    interviewerQuestions: review.interviewerQuestions.filter((item) => typeof item === "string" && item.trim()),
    nextAttemptFocus: review.nextAttemptFocus.trim(),
  };
}
