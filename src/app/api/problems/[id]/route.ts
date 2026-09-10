import { NextResponse } from "next/server";
import { getPracticeService } from "@/infrastructure/compose";
import { handleError, problemDetail } from "../../_lib";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const problem = getPracticeService().getProblem(id);
    return NextResponse.json({ problem: problemDetail(problem) });
  } catch (error) {
    return handleError(error);
  }
}
