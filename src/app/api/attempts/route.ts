import { NextResponse } from "next/server";
import { getPracticeService } from "@/infrastructure/compose";
import { attemptPayload, handleError } from "../_lib";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const service = getPracticeService();
    const attempts = await service.listAttempts();
    const payload = attempts.map((attempt) => {
      const problem = service.getProblem(attempt.problemId);
      return {
        id: attempt.id,
        problemId: attempt.problemId,
        problemTitle: problem.title,
        status: attempt.status,
        parentAttemptId: attempt.parentAttemptId,
        followUpApplied: attempt.followUpApplied,
        band: attempt.evaluation?.band ?? null,
        overall: attempt.evaluation?.overall ?? null,
        updatedAt: attempt.updatedAt,
        createdAt: attempt.createdAt,
      };
    });
    return NextResponse.json({ attempts: payload });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      problemId?: string;
      parentAttemptId?: string | null;
      applyFollowUp?: boolean;
    };
    if (!body.problemId) {
      return NextResponse.json({ error: "problemId is required" }, { status: 400 });
    }
    const service = getPracticeService();
    const attempt = await service.startAttempt({
      problemId: body.problemId,
      parentAttemptId: body.parentAttemptId,
      applyFollowUp: body.applyFollowUp,
    });
    const problem = service.getProblem(attempt.problemId);
    return NextResponse.json({ attempt: attemptPayload(attempt, problem) }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
