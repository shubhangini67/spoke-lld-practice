import path from "path";
import { PracticeService } from "@/application/practice-service";
import { DeterministicEvaluator } from "@/evaluation/deterministic";
import { HybridEvaluator } from "@/evaluation/hybrid";
import { LlmReviewer } from "@/evaluation/llm";
import { JsonAttemptStore } from "@/infrastructure/attempt-store";
import { SystemClock, UuidGenerator } from "@/infrastructure/clock";
import { HttpLlmClient } from "@/infrastructure/llm-client";
import { CatalogProblemRepository } from "@/infrastructure/problem-repo";

const globalForSpoke = globalThis as unknown as { spokeService?: PracticeService };

export function getPracticeService(): PracticeService {
  if (globalForSpoke.spokeService) return globalForSpoke.spokeService;

  const llmClient = new HttpLlmClient(process.env.OPENAI_API_KEY);
  const evaluator = new HybridEvaluator(
    new DeterministicEvaluator(),
    new LlmReviewer(llmClient),
  );
  const dataDir =
    process.env.SPOKE_DATA_DIR ??
    (process.env.VERCEL ? "/tmp/spoke" : path.join(process.cwd(), "data"));
  const service = new PracticeService(
    new CatalogProblemRepository(),
    new JsonAttemptStore(path.join(dataDir, "attempts.json")),
    evaluator,
    new SystemClock(),
    new UuidGenerator(),
  );
  globalForSpoke.spokeService = service;
  return service;
}

export function llmConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}
