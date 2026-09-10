import { NextResponse } from "next/server";
import { llmConfigured } from "@/infrastructure/compose";
import { PROBLEMS } from "@/catalog/problems";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    product: "spoke",
    problems: PROBLEMS.length,
    llm: llmConfigured(),
  });
}
