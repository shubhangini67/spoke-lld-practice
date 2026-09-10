import { NextResponse } from "next/server";
import { SAMPLES } from "@/catalog/samples";
import { handleError } from "../../../_lib";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const sample = SAMPLES[id];
    if (!sample) {
      return NextResponse.json({ error: "No sample for this problem" }, { status: 404 });
    }
    return NextResponse.json({ design: sample });
  } catch (error) {
    return handleError(error);
  }
}
