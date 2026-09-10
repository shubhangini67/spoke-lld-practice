import { NextResponse } from "next/server";
import type { Design } from "@/domain/design";
import { getPracticeService } from "@/infrastructure/compose";
import { attemptPayload, handleError } from "../../../_lib";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { design?: Design };
    if (!body.design) {
      return NextResponse.json({ error: "design is required" }, { status: 400 });
    }
    const service = getPracticeService();
    const attempt = await service.saveDraft(id, body.design);
    const problem = service.getProblem(attempt.problemId);
    return NextResponse.json({ attempt: attemptPayload(attempt, problem) });
  } catch (error) {
    return handleError(error);
  }
}
