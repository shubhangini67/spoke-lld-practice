import { ClassifierKind, RelationKind } from "./enums";
import { InvalidSubmission } from "./errors";

export interface DesignType {
  name: string;
  kind: ClassifierKind;
  responsibility: string;
  fields: string[];
  methods: string[];
}

export interface Relationship {
  source: string;
  target: string;
  kind: RelationKind;
  note: string;
}

/** One beat of the interview walkthrough: who does what with whom. */
export interface WalkthroughStep {
  actor: string;
  action: string;
  collaborator: string;
  outcome: string;
}

export interface RejectedAlternative {
  approach: string;
  whyNot: string;
}

export interface Design {
  clarifications: Record<string, string>;
  types: DesignType[];
  relationships: Relationship[];
  walkthrough: WalkthroughStep[];
  assumptions: string[];
  rejected: RejectedAlternative;
  notes: string;
  code: string;
}

export function emptyDesign(): Design {
  return {
    clarifications: {},
    types: [
      { name: "", kind: ClassifierKind.Class, responsibility: "", fields: [], methods: [] },
      { name: "", kind: ClassifierKind.Class, responsibility: "", fields: [], methods: [] },
    ],
    relationships: [],
    walkthrough: [
      { actor: "", action: "", collaborator: "", outcome: "" },
      { actor: "", action: "", collaborator: "", outcome: "" },
      { actor: "", action: "", collaborator: "", outcome: "" },
    ],
    assumptions: [""],
    rejected: { approach: "", whyNot: "" },
    notes: "",
    code: "",
  };
}

export function normalizeName(name: string): string {
  return name.trim();
}

export function namedTypes(design: Design): DesignType[] {
  return design.types.filter((item) => normalizeName(item.name));
}

export function typeIndex(design: Design): Map<string, DesignType> {
  const index = new Map<string, DesignType>();
  for (const item of namedTypes(design)) {
    index.set(normalizeName(item.name).toLowerCase(), item);
  }
  return index;
}

export function designCorpus(design: Design): string {
  const parts: string[] = [
    design.notes,
    design.code,
    design.rejected.approach,
    design.rejected.whyNot,
    ...design.assumptions,
  ];
  for (const item of design.types) {
    parts.push(item.name, item.kind, item.responsibility, ...item.fields, ...item.methods);
  }
  for (const rel of design.relationships) {
    parts.push(rel.source, rel.target, rel.kind, rel.note);
  }
  for (const step of design.walkthrough) {
    parts.push(step.actor, step.action, step.collaborator, step.outcome);
  }
  return parts.filter(Boolean).join(" ");
}

export function filledWalkthrough(design: Design): WalkthroughStep[] {
  return design.walkthrough.filter(
    (step) => step.actor.trim() && step.action.trim() && step.collaborator.trim(),
  );
}

export function validateForSubmit(design: Design, expectedQuestionIds: string[]): void {
  const named = namedTypes(design);
  if (named.length < 2) {
    throw new InvalidSubmission("Name at least two types so a reviewer can discuss the design.");
  }

  const missingResponsibility = named.filter((item) => !item.responsibility.trim());
  if (missingResponsibility.length) {
    throw new InvalidSubmission(
      `Every type needs a one-sentence responsibility. Missing: ${missingResponsibility.map((item) => item.name).join(", ")}.`,
    );
  }

  const unanswered = expectedQuestionIds.filter((id) => !design.clarifications[id]);
  if (unanswered.length) {
    throw new InvalidSubmission("Lock every clarifying question before you submit. That is the interview opening.");
  }

  const steps = filledWalkthrough(design);
  if (steps.length < 3) {
    throw new InvalidSubmission("Walk through at least three beats of a core use case. Interviews are conversations, not class lists.");
  }

  const known = new Set(named.map((item) => normalizeName(item.name).toLowerCase()));
  for (const step of steps) {
    const actor = step.actor.trim().toLowerCase();
    const collaborator = step.collaborator.trim().toLowerCase();
    if (!known.has(actor) || !known.has(collaborator)) {
      throw new InvalidSubmission(
        `Walkthrough step "${step.actor} → ${step.action} → ${step.collaborator}" names a type that does not exist.`,
      );
    }
  }

  const filledAssumptions = design.assumptions.map((item) => item.trim()).filter(Boolean);
  if (filledAssumptions.length < 1) {
    throw new InvalidSubmission("Write at least one assumption. Reviewers cannot judge a design without the world it lives in.");
  }

  if (!design.rejected.approach.trim() || !design.rejected.whyNot.trim()) {
    throw new InvalidSubmission("Name one approach you rejected and why. That is half of what an interviewer scores.");
  }

  if (design.relationships.length < 1) {
    throw new InvalidSubmission("Add at least one relationship. A bag of classes is a vocabulary list, not a design.");
  }

  for (const rel of design.relationships) {
    const source = rel.source.trim().toLowerCase();
    const target = rel.target.trim().toLowerCase();
    if (!known.has(source) || !known.has(target)) {
      throw new InvalidSubmission(
        `Relationship "${rel.source} ${rel.kind} ${rel.target}" points at an unknown type.`,
      );
    }
  }
}

export interface SubmitReadiness {
  ready: boolean;
  checks: { id: string; label: string; ok: boolean }[];
}

export function submitReadiness(design: Design, expectedQuestionIds: string[]): SubmitReadiness {
  const checks: SubmitReadiness["checks"] = [];
  const run = (id: string, label: string, fn: () => void) => {
    try {
      fn();
      checks.push({ id, label, ok: true });
    } catch {
      checks.push({ id, label, ok: false });
    }
  };

  run("types", "Two named types with responsibilities", () => {
    const named = namedTypes(design);
    if (named.length < 2) throw new Error("types");
    if (named.some((item) => !item.responsibility.trim())) throw new Error("resp");
  });
  run("clarify", "Every clarifying question locked", () => {
    if (expectedQuestionIds.some((id) => !design.clarifications[id])) throw new Error("clarify");
  });
  run("walk", "Three walkthrough beats using real types", () => {
    const named = new Set(namedTypes(design).map((item) => item.name.trim().toLowerCase()));
    const steps = filledWalkthrough(design);
    if (steps.length < 3) throw new Error("walk");
    for (const step of steps) {
      if (!named.has(step.actor.trim().toLowerCase())) throw new Error("actor");
      if (!named.has(step.collaborator.trim().toLowerCase())) throw new Error("collab");
    }
  });
  run("rels", "Relationships only between known types", () => {
    if (design.relationships.length < 1) throw new Error("rels");
    const named = new Set(namedTypes(design).map((item) => item.name.trim().toLowerCase()));
    for (const rel of design.relationships) {
      if (!named.has(rel.source.trim().toLowerCase()) || !named.has(rel.target.trim().toLowerCase())) {
        throw new Error("dangling");
      }
    }
  });
  run("defend", "Assumption plus a rejected alternative", () => {
    if (!design.assumptions.some((item) => item.trim())) throw new Error("assume");
    if (!design.rejected.approach.trim() || !design.rejected.whyNot.trim()) throw new Error("reject");
  });

  return { ready: checks.every((item) => item.ok), checks };
}
