import { NextResponse } from "next/server";
import { Attempt } from "@/domain/attempt";
import { DomainError } from "@/domain/errors";
import type { Problem } from "@/domain/problem";
import { activeCapabilities, lockedScopeLines } from "@/domain/problem";
import { submitReadiness } from "@/domain/design";

export function problemListItem(problem: Problem) {
  return {
    id: problem.id,
    title: problem.title,
    difficulty: problem.difficulty,
    minutes: problem.minutes,
    summary: problem.summary,
    tags: problem.tags,
    capabilityCount: problem.capabilities.filter((item) => !item.activatedBy).length,
  };
}

export function problemDetail(problem: Problem) {
  return {
    ...problemListItem(problem),
    scenario: problem.scenario,
    requirements: problem.requirements,
    constraints: problem.constraints,
    questions: problem.questions,
    followUp: problem.followUp,
    capabilities: problem.capabilities.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      optional: Boolean(item.activatedBy),
    })),
  };
}

export function attemptPayload(attempt: Attempt, problem: Problem) {
  const readiness = submitReadiness(
    attempt.design,
    problem.questions.map((item) => item.id),
  );
  return {
    ...attempt.toSnapshot(),
    problem: problemDetail(problem),
    activeCapabilities: activeCapabilities(problem, attempt.design.clarifications).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
    })),
    lockedScope: lockedScopeLines(problem, attempt.design.clarifications),
    readiness,
  };
}

export function handleError(error: unknown): NextResponse {
  if (error instanceof DomainError) {
    const status =
      error.code === "not_found" ? 404 : error.code === "invalid_state" ? 409 : 400;
    return NextResponse.json({ error: error.message, code: error.code }, { status });
  }
  console.error(error);
  return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
}
