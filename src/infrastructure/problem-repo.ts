import { PROBLEMS } from "@/catalog/problems";
import type { Problem } from "@/domain/problem";
import type { ProblemRepository } from "@/domain/ports";

export class CatalogProblemRepository implements ProblemRepository {
  list(): Problem[] {
    return PROBLEMS;
  }

  get(id: string): Problem | undefined {
    return PROBLEMS.find((item) => item.id === id);
  }
}
