import { ClassifierKind, RelationKind } from "@/domain/enums";
import type { Design, DesignType } from "@/domain/design";
import { namedTypes, normalizeName } from "@/domain/design";

export interface StructureReport {
  godClasses: string[];
  vagueTypes: string[];
  isolatedTypes: string[];
  inheritanceHeavy: boolean;
  missingSeamForCluster: boolean;
  relationshipCount: number;
  interfaceCount: number;
  typeCount: number;
}

const VAGUE =
  /\b(handles everything|does everything|manages the system|all logic|god|utility for all|main class|handles it)\b/i;

export function analyzeStructure(design: Design): StructureReport {
  const types = namedTypes(design);
  const methodTotal = types.reduce((sum, item) => sum + item.methods.length, 0);

  const godClasses: string[] = [];
  if (types.length) {
    const busiest = types.reduce((best, item) =>
      load(item) > load(best) ? item : best,
    );
    const share = methodTotal ? busiest.methods.length / methodTotal : 0;
    const bloated = busiest.methods.length >= 8 || wordCount(busiest) >= 40;
    if ((share >= 0.5 && types.length >= 3) || bloated) {
      godClasses.push(normalizeName(busiest.name));
    }
  }

  const vagueTypes = types
    .filter((item) => VAGUE.test(item.responsibility) || wordCount(item) < 4)
    .map((item) => normalizeName(item.name));

  const interfaceCount = types.filter(
    (item) => item.kind === ClassifierKind.Interface || item.kind === ClassifierKind.Abstract,
  ).length;

  const connected = new Set<string>();
  let inheritance = 0;
  let composition = 0;
  for (const rel of design.relationships) {
    connected.add(rel.source.trim().toLowerCase());
    connected.add(rel.target.trim().toLowerCase());
    if (rel.kind === RelationKind.Inherits || rel.kind === RelationKind.Implements) inheritance += 1;
    if (rel.kind === RelationKind.Composes || rel.kind === RelationKind.Aggregates) composition += 1;
  }

  const isolatedTypes =
    types.length > 2
      ? types
          .filter((item) => !connected.has(normalizeName(item.name).toLowerCase()))
          .map((item) => normalizeName(item.name))
      : [];

  return {
    godClasses,
    vagueTypes,
    isolatedTypes,
    inheritanceHeavy: inheritance >= 3 && composition === 0,
    missingSeamForCluster: similarConcreteCluster(types) && interfaceCount === 0,
    relationshipCount: design.relationships.length,
    interfaceCount,
    typeCount: types.length,
  };
}

function load(item: DesignType): number {
  return item.methods.length + item.fields.length + wordCount(item);
}

function wordCount(item: DesignType): number {
  return item.responsibility.trim().split(/\s+/).filter(Boolean).length;
}

function similarConcreteCluster(types: DesignType[]): boolean {
  const concretes = types.filter((item) => item.kind === ClassifierKind.Class).map((item) => item.name);
  if (concretes.length < 3) return false;
  const suffixes = new Map<string, number>();
  for (const name of concretes) {
    const pieces = name.match(/[A-Z][a-z]+|[a-z]+/g);
    if (!pieces?.length) continue;
    const suffix = pieces[pieces.length - 1].toLowerCase();
    suffixes.set(suffix, (suffixes.get(suffix) ?? 0) + 1);
  }
  return [...suffixes.values()].some((count) => count >= 3);
}
