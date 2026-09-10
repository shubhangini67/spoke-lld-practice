import { NextResponse } from "next/server";
import { getPracticeService } from "@/infrastructure/compose";
import { handleError, problemListItem } from "../_lib";

export async function GET() {
  try {
    const problems = getPracticeService().listProblems().map(problemListItem);
    return NextResponse.json({ problems });
  } catch (error) {
    return handleError(error);
  }
}
