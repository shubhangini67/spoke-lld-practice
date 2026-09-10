import { NextResponse } from "next/server";
import { getPracticeService } from "@/infrastructure/compose";
import { attemptPayload, handleError } from "../../../_lib";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const service = getPracticeService();
    const attempt = await service.retryEvaluation(id);
    const problem = service.getProblem(attempt.problemId);
    return NextResponse.json({ attempt: attemptPayload(attempt, problem) });
  } catch (error) {
    return handleError(error);
  }
}
