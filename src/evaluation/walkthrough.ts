import type { Design } from "@/domain/design";
import { filledWalkthrough, namedTypes, normalizeName } from "@/domain/design";
import { matchingSignals, tokenize } from "./tokens";

export interface WalkthroughReport {
  stepCount: number;
  uniqueActors: number;
  coversPrimaryVerbs: boolean;
  verbHits: string[];
  selfTalk: number;
}

const PRIMARY_VERBS = [
  "assign",
  "park",
  "pay",
  "dispense",
  "book",
  "cancel",
  "evict",
  "get",
  "put",
  "call",
  "move",
  "select",
  "refund",
  "search",
  "overlap",
  "find",
  "occupy",
  "enter",
  "leave",
  "fee",
  "release",
  "vend",
  "credit",
];

export function analyzeWalkthrough(design: Design): WalkthroughReport {
  const steps = filledWalkthrough(design);
  const actors = new Set(steps.map((step) => step.actor.trim().toLowerCase()));
  const tokens = tokenize(steps.map((step) => `${step.action} ${step.outcome}`).join(" "));
  const verbHits = matchingSignals(tokens, PRIMARY_VERBS);
  const selfTalk = steps.filter(
    (step) => step.actor.trim().toLowerCase() === step.collaborator.trim().toLowerCase(),
  ).length;

  return {
    stepCount: steps.length,
    uniqueActors: actors.size,
    coversPrimaryVerbs: verbHits.length >= 2,
    verbHits,
    selfTalk,
  };
}

export function walkthroughUsesExistingTypes(design: Design): boolean {
  const known = new Set(namedTypes(design).map((item) => normalizeName(item.name).toLowerCase()));
  return filledWalkthrough(design).every(
    (step) =>
      known.has(step.actor.trim().toLowerCase()) &&
      known.has(step.collaborator.trim().toLowerCase()),
  );
}
