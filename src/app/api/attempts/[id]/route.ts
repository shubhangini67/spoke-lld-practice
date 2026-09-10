import { NextResponse } from "next/server";
import { getPracticeService } from "@/infrastructure/compose";
import { attemptPayload, handleError } from "../../_lib";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const service = getPracticeService();
    const attempt = await service.getAttempt(id);
    const problem = service.getProblem(attempt.problemId);
    return NextResponse.json({ attempt: attemptPayload(attempt, problem) });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await getPracticeService().abandon(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
