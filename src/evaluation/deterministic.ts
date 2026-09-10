import { Band, Severity, bandFromScore } from "@/domain/enums";
import type {
  Alternative,
  Concern,
  DimensionScore,
  Evaluation,
  Strength,
} from "@/domain/evaluation";
import type { Design } from "@/domain/design";
import { namedTypes } from "@/domain/design";
import type { Problem } from "@/domain/problem";
import { coverageDelta, coverageFor, coverageScore } from "./coverage";
import { analyzeScope } from "./scope";
import { analyzeStructure } from "./structure";
import { analyzeWalkthrough } from "./walkthrough";

export class DeterministicEvaluator {
  run(problem: Problem, design: Design, previous: Evaluation | null = null): Evaluation {
    const coverage = coverageFor(problem, design);
    const structure = analyzeStructure(design);
    const walk = analyzeWalkthrough(design);
    const scope = analyzeScope(problem, design);

    const cohesion = clamp(
      82 - (structure.godClasses.length ? 28 : 0) - 8 * Math.min(3, structure.vagueTypes.length),
    );
    let collaboration = 62;
    if (walk.stepCount >= 3) collaboration += 10;
    if (walk.uniqueActors >= 3) collaboration += 8;
    if (walk.coversPrimaryVerbs) collaboration += 8;
    if (structure.relationshipCount === 0) collaboration -= 24;
    if (structure.isolatedTypes.length) collaboration -= 8;
    if (walk.selfTalk >= 2) collaboration -= 10;
    collaboration = clamp(collaboration);

    let extensibility = 58;
    if (structure.interfaceCount) extensibility += 16;
    if (structure.missingSeamForCluster) extensibility -= 14;
    if (structure.inheritanceHeavy) extensibility -= 12;
    if (structure.typeCount < 3) extensibility -= 8;
    extensibility = clamp(extensibility);

    const defense = defenseScore(design);
    const cover = coverageScore(coverage);

    const dimensions: DimensionScore[] = [
      dim("scope", "Scope fidelity", scope.score, "Did you design the system you locked in clarifying questions — not a generic blog solution?"),
      dim("coverage", "Capability coverage", cover, "Behaviours visible in types, methods, and the walkthrough. Not a golden class list."),
      dim("collaboration", "Walkthrough & coupling", collaboration, "Can a reviewer follow one use case across objects, and is the graph connected?"),
      dim("cohesion", "Responsibility cohesion", cohesion, "One reason to change per type. Vague 'manages the system' lines fail this."),
      dim("extensibility", "Seams for the follow-up", extensibility, "Interfaces, policies, and composition so Monday's requirement does not rewrite Friday's design."),
      dim("defense", "Assumptions & rejected path", defense, "Whether you can defend the design in the last ten minutes of an interview."),
    ];

    const overall = overallFrom(dimensions);
    return {
      overall,
      band: bandFromScore(overall),
      degraded: false,
      dimensions,
      coverage,
      strengths: strengths(structure, walk, design, coverage),
      concerns: concerns(structure, walk, scope, coverage, design),
      alternatives: alternatives(problem),
      interviewerQuestions: questions(problem, structure, walk),
      nextAttemptFocus: nextFocus(coverage, structure, walk),
      coverageDelta: coverageDelta(coverage, previous?.coverage ?? null),
    };
  }
}

function dim(id: string, title: string, score: number, rationale: string): DimensionScore {
  return { id, title, score, rationale, source: "deterministic" };
}

function overallFrom(dimensions: DimensionScore[]): number {
  const weights: Record<string, number> = {
    scope: 0.12,
    coverage: 0.25,
    collaboration: 0.2,
    cohesion: 0.18,
    extensibility: 0.15,
    defense: 0.1,
  };
  return Math.round(dimensions.reduce((sum, item) => sum + item.score * (weights[item.id] ?? 0.15), 0));
}

function defenseScore(design: Design): number {
  const assumptions = design.assumptions.filter((item) => item.trim()).length;
  const rejected = design.rejected.approach.trim().length + design.rejected.whyNot.trim().length;
  let score = 30;
  if (assumptions >= 1) score += 20;
  if (assumptions >= 2) score += 10;
  if (rejected > 40) score += 25;
  if (rejected > 120) score += 10;
  if (design.rejected.whyNot.toLowerCase().includes("because") || design.rejected.whyNot.length > 60) {
    score += 5;
  }
  return clamp(score);
}

function strengths(
  structure: ReturnType<typeof analyzeStructure>,
  walk: ReturnType<typeof analyzeWalkthrough>,
  design: Design,
  coverage: Evaluation["coverage"],
): Strength[] {
  const out: Strength[] = [];
  const covered = coverage.filter((item) => item.status === "covered").map((item) => item.title);
  if (covered.length >= Math.max(2, Math.floor(coverage.length / 2))) {
    out.push({
      title: "The design talks to the actual problem",
      detail: `Visible behaviours: ${covered.slice(0, 4).join(", ")}.`,
      relatedTypes: [],
    });
  }
  if (walk.stepCount >= 3 && walk.uniqueActors >= 3) {
    out.push({
      title: "You rehearsed the conversation",
      detail: `${walk.stepCount} walkthrough beats across ${walk.uniqueActors} types. That is what an interviewer asks you to narrate.`,
      relatedTypes: [],
    });
  }
  if (structure.interfaceCount) {
    const seams = namedTypes(design)
      .filter((item) => item.kind !== "class")
      .map((item) => item.name);
    out.push({
      title: "There is a seam for Monday",
      detail: "An interface or abstract type gives the follow-up a place to land.",
      relatedTypes: seams.slice(0, 4),
    });
  }
  if (design.rejected.approach.trim() && design.rejected.whyNot.trim().split(/\s+/).length >= 8) {
    out.push({
      title: "You defended a rejected path",
      detail: "Naming what you did not build is how senior candidates spend the last minutes.",
      relatedTypes: [],
    });
  }
  return out;
}

function concerns(
  structure: ReturnType<typeof analyzeStructure>,
  walk: ReturnType<typeof analyzeWalkthrough>,
  scope: ReturnType<typeof analyzeScope>,
  coverage: Evaluation["coverage"],
  design: Design,
): Concern[] {
  const out: Concern[] = [];
  if (structure.godClasses.length) {
    out.push({
      severity: Severity.High,
      title: `${structure.godClasses[0]} is carrying too much`,
      whyItMatters:
        "When one type parks, prices, and persists, every new requirement edits the same file. Interviewers call this out immediately.",
      question: "If the follow-up lands tomorrow, which methods on this type would have to change?",
      relatedTypes: structure.godClasses,
    });
  }
  if (structure.vagueTypes.length) {
    out.push({
      severity: Severity.Medium,
      title: "Some responsibilities are too vague to review",
      whyItMatters: "A reviewer cannot judge cohesion if a type 'manages the system'.",
      question: "Finish the sentence: this type is the only one allowed to …",
      relatedTypes: structure.vagueTypes.slice(0, 4),
    });
  }
  if (structure.relationshipCount === 0) {
    out.push({
      severity: Severity.High,
      title: "Relationships are missing",
      whyItMatters: "LLD is mostly about who is allowed to know whom.",
      question: "Which type constructs or calls which other type?",
      relatedTypes: [],
    });
  } else if (structure.isolatedTypes.length) {
    out.push({
      severity: Severity.Low,
      title: "Some types are disconnected",
      whyItMatters: "Orphans are leftover ideas or a missing collaborator.",
      question: "If a type has no edge, should it exist?",
      relatedTypes: structure.isolatedTypes.slice(0, 4),
    });
  }
  if (!walk.coversPrimaryVerbs) {
    out.push({
      severity: Severity.Medium,
      title: "The walkthrough does not show a core use case",
      whyItMatters: "Interviewers ask you to narrate 'user parks a truck' or 'get after TTL expires', not 'class A uses class B'.",
      question: "Pick the riskiest happy path and name the objects that speak, in order.",
      relatedTypes: [],
    });
  }
  if (walk.selfTalk >= 2) {
    out.push({
      severity: Severity.Low,
      title: "Walkthrough beats talk to themselves",
      whyItMatters: "A step where a type only calls itself usually means a missing collaborator.",
      question: "Who else has to know for this beat to happen?",
      relatedTypes: [],
    });
  }
  const brokenScope = scope.honored.filter((item) => !item.ok);
  if (brokenScope.length) {
    out.push({
      severity: Severity.High,
      title: "The design does not honour the scope you locked",
      whyItMatters:
        "Clarifying questions are not flavour text. If you picked multi-floor, floors have to exist in the model.",
      question: brokenScope[0].evidence,
      relatedTypes: [],
    });
  }
  if (structure.missingSeamForCluster) {
    out.push({
      severity: Severity.Medium,
      title: "Variation looks copy-pasted onto concrete classes",
      whyItMatters: "Three similarly named classes with no interface usually hide a missing policy.",
      question: "What varies at runtime, and which interface would that hang off?",
      relatedTypes: [],
    });
  }
  if (structure.inheritanceHeavy) {
    out.push({
      severity: Severity.Medium,
      title: "The graph is inheritance-heavy",
      whyItMatters: "IS-A couples hierarchies. HAS-A is usually the more extensible default.",
      question: "Which subclass is only sharing code, not a true durable IS-A?",
      relatedTypes: [],
    });
  }
  const missing = coverage.filter((item) => item.status === "missing");
  if (missing.length) {
    out.push({
      severity: Severity.High,
      title: "Required behaviour is not visible",
      whyItMatters: "A pretty diagram that cannot support a stated capability is incomplete, not 'another valid approach'.",
      question: `Which type would you point at for: ${missing[0].title}?`,
      relatedTypes: namedTypes(design).slice(0, 2).map((item) => item.name),
    });
  }
  return out;
}

function alternatives(problem: Problem): Alternative[] {
  const common: Alternative[] = [
    {
      name: "Policy object instead of a switch",
      whenItFits: "A rule will change independently of the thing that uses it (pricing, eviction, dispatch).",
      tradeoff: "More types now; fewer edits when the follow-up arrives.",
    },
    {
      name: "Enum plus guarded transitions",
      whenItFits: "State exists but you do not want a class-per-state yet (vending, elevator doors).",
      tradeoff: "Simpler today; can grow into State if transitions multiply.",
    },
  ];
  if (problem.id === "parking-lot") {
    common.unshift({
      name: "Spot finder as a strategy",
      whenItFits: "Assignment might become nearest, nearest-on-floor, or EV-aware later.",
      tradeoff: "An extra interface. The lot stops knowing search.",
    });
  }
  if (problem.id === "elevator") {
    common.unshift({
      name: "SCAN controller + dumb car",
      whenItFits: "The car should not pick the next floor; it should execute a plan.",
      tradeoff: "Two objects to talk through. Much easier to swap peak-hour policy.",
    });
  }
  return common.slice(0, 3);
}

function questions(
  problem: Problem,
  structure: ReturnType<typeof analyzeStructure>,
  walk: ReturnType<typeof analyzeWalkthrough>,
): string[] {
  return [
    `Walk me through ${problem.title.toLowerCase()}'s riskiest happy path using only the types you named.`,
    structure.godClasses.length
      ? `If I add the follow-up "${problem.followUp.title}", what happens to ${structure.godClasses[0]}?`
      : `Where does "${problem.followUp.title}" land without editing your core types?`,
    walk.stepCount < 3
      ? "You did not narrate a use case. Start at the actor who receives the first event. Who do they call?"
      : "What shared mutable state exists, and who is allowed to write it?",
  ];
}

function nextFocus(
  coverage: Evaluation["coverage"],
  structure: ReturnType<typeof analyzeStructure>,
  walk: ReturnType<typeof analyzeWalkthrough>,
): string {
  const missing = coverage.find((item) => item.status === "missing");
  if (missing) return `Make "${missing.title}" visible: name a type or walkthrough beat that owns it.`;
  if (structure.godClasses.length) {
    return `Split ${structure.godClasses[0]}. Move one reason-to-change into a collaborator.`;
  }
  if (walk.stepCount < 3 || !walk.coversPrimaryVerbs) {
    return "Rewrite the walkthrough as the interview narration: actor, action, collaborator, outcome.";
  }
  if (!structure.interfaceCount) {
    return "Introduce one interface where something will vary (policy, payment, dispatch).";
  }
  return "Take the interviewer follow-up and revise. That is the senior half of the loop.";
}

function clamp(value: number): number {
  return Math.max(12, Math.min(100, Math.round(value)));
}
