import { ClassifierKind, RelationKind } from "@/domain/enums";
import type { Design } from "@/domain/design";
import { namedTypes } from "@/domain/design";

export const KINDS: { value: ClassifierKind; label: string }[] = [
  { value: ClassifierKind.Class, label: "class" },
  { value: ClassifierKind.Interface, label: "interface" },
  { value: ClassifierKind.Abstract, label: "abstract" },
];

export const RELS: { value: RelationKind; label: string }[] = [
  { value: RelationKind.Uses, label: "uses" },
  { value: RelationKind.Composes, label: "composes" },
  { value: RelationKind.Aggregates, label: "aggregates" },
  { value: RelationKind.Inherits, label: "inherits" },
  { value: RelationKind.Implements, label: "implements" },
];

export function toMermaid(design: Design): string {
  const lines = ["classDiagram"];
  for (const item of namedTypes(design)) {
    lines.push(`  class ${sanitize(item.name)} {`);
    lines.push(`    <<${item.kind}>>`);
    for (const field of item.fields) lines.push(`    ${field}`);
    for (const method of item.methods) lines.push(`    ${method}()`);
    lines.push("  }");
  }
  for (const rel of design.relationships) {
    const arrow =
      rel.kind === "inherits"
        ? "<|--"
        : rel.kind === "implements"
          ? "<|.."
          : rel.kind === "composes"
            ? "*--"
            : rel.kind === "aggregates"
              ? "o--"
              : "-->";
    lines.push(`  ${sanitize(rel.source)} ${arrow} ${sanitize(rel.target)}`);
  }
  return lines.join("\n");
}

function sanitize(name: string): string {
  return name.replace(/[^A-Za-z0-9_]/g, "_");
}

export function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}
