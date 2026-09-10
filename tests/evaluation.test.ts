import { describe, expect, it } from "vitest";
import { CoverageStatus } from "@/domain/enums";
import { DeterministicEvaluator } from "@/evaluation/deterministic";
import { HybridEvaluator } from "@/evaluation/hybrid";
import { coverageFor } from "@/evaluation/coverage";
import { godClassDesign, parkingProblem, stallDesign } from "./fixtures";

describe("capability coverage without golden names", () => {
  it("treats Stall as a valid way to cover spot assignment", () => {
    const items = coverageFor(parkingProblem(), stallDesign());
    const assignment = items.find((item) => item.capabilityId === "assignment");
    expect(assignment?.status).toBe(CoverageStatus.Covered);
    expect(assignment?.evidence.toLowerCase()).toMatch(/stall|spot|assign|fit/);
  });

  it("turns on multi-floor only when that clarification is locked", () => {
    const design = stallDesign();
    const withFloors = coverageFor(parkingProblem(), design);
    expect(withFloors.some((item) => item.capabilityId === "floors")).toBe(true);

    design.clarifications.floors = "single";
    const without = coverageFor(parkingProblem(), design);
    expect(without.some((item) => item.capabilityId === "floors")).toBe(false);
  });
});

describe("deterministic evaluator", () => {
  const evaluator = new DeterministicEvaluator();

  it("penalises a god class that parks and prices", () => {
    const weak = evaluator.run(parkingProblem(), godClassDesign());
    const strong = evaluator.run(parkingProblem(), stallDesign());
    expect(weak.overall).toBeLessThan(strong.overall);
    expect(weak.concerns.some((item) => /carrying too much/i.test(item.title))).toBe(true);
  });

  it("never leads with a required class named ParkingSpot", () => {
    const review = evaluator.run(parkingProblem(), stallDesign());
    const blob = JSON.stringify(review);
    expect(blob).not.toMatch(/you must name .*ParkingSpot/i);
    expect(review.band).toBeTruthy();
    expect(review.dimensions.every((item) => item.source === "deterministic")).toBe(true);
  });
});

describe("hybrid evaluator fallback", () => {
  it("still evaluates when the LLM throws", async () => {
    const hybrid = new HybridEvaluator(new DeterministicEvaluator(), {
      enabled: () => true,
      review: async () => {
        throw new Error("timeout");
      },
    } as never);
    const result = await hybrid.evaluate({
      problem: parkingProblem(),
      design: stallDesign(),
    });
    expect(result.degraded).toBe(true);
    expect(result.coverage.length).toBeGreaterThan(0);
    expect(result.overall).toBeGreaterThan(40);
  });
});
