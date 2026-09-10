import { CoverageStatus } from "@/domain/enums";
import type { CoverageItem } from "@/domain/evaluation";
import type { Design } from "@/domain/design";
import { designCorpus, namedTypes } from "@/domain/design";
import { ClassifierKind } from "@/domain/enums";
import type { Capability, Problem } from "@/domain/problem";
import { activeCapabilities } from "@/domain/problem";
import { matchingSignals, tokenize } from "./tokens";

export function coverageFor(
  problem: Problem,
  design: Design,
): CoverageItem[] {
  const tokens = tokenize(designCorpus(design));
  const hasSeam = namedTypes(design).some(
    (item) => item.kind === ClassifierKind.Interface || item.kind === ClassifierKind.Abstract,
  );
  const active = activeCapabilities(problem, design.clarifications);

  return active.map((capability) => {
    const hits = matchingSignals(tokens, capability.signals);
    const seamHits = hasSeam ? matchingSignals(tokens, capability.seamSignals ?? []) : [];
    const allHits = [...new Set([...hits, ...seamHits])];
    const { status, evidence } = classify(capability, allHits, hasSeam);
    return {
      capabilityId: capability.id,
      title: capability.title,
      status,
      evidence,
      weight: capability.weight,
    };
  });
}

function classify(
  capability: Capability,
  hits: string[],
  hasSeam: boolean,
): { status: CoverageStatus; evidence: string } {
  const seamNeeded = (capability.seamSignals?.length ?? 0) > 0;
  if (hits.length >= 2) {
    const extra =
      seamNeeded && hasSeam ? " Interface/abstract type is present, which helps the seam." : "";
    return {
      status: CoverageStatus.Covered,
      evidence: `Signals in the design: ${hits.slice(0, 6).join(", ")}.${extra}`,
    };
  }
  if (hits.length === 1) {
    return {
      status: CoverageStatus.Partial,
      evidence: `Only a weak signal: ${hits[0]}. A second word in a responsibility, method, or walkthrough beat would make this visible.`,
    };
  }
  return {
    status: CoverageStatus.Missing,
    evidence:
      "Nothing in the types, walkthrough, or defense mentions this behaviour. Naming a golden class from a blog is not required — mentioning the behaviour is.",
  };
}

export function coverageScore(items: CoverageItem[]): number {
  if (items.length === 0) return 0;
  let weights = 0;
  let earned = 0;
  for (const item of items) {
    weights += item.weight;
    if (item.status === CoverageStatus.Covered) earned += item.weight;
    else if (item.status === CoverageStatus.Partial) earned += 0.45 * item.weight;
  }
  return Math.round((100 * earned) / weights);
}

export function coverageDelta(current: CoverageItem[], previous: CoverageItem[] | null): number | null {
  if (!previous) return null;
  const earned = (items: CoverageItem[]) =>
    items.reduce((sum, item) => {
      if (item.status === CoverageStatus.Covered) return sum + item.weight;
      if (item.status === CoverageStatus.Partial) return sum + 0.45 * item.weight;
      return sum;
    }, 0);
  const denom = Math.max(1, current.reduce((sum, item) => sum + item.weight, 0));
  return Math.round((100 * (earned(current) - earned(previous))) / denom);
}
