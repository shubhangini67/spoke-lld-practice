import type { Attempt, AttemptSnapshot } from "./attempt";
import type { Design } from "./design";
import type { Evaluation } from "./evaluation";
import type { Problem } from "./problem";

export interface ProblemRepository {
  list(): Problem[];
  get(id: string): Problem | undefined;
}

export interface AttemptRepository {
  save(attempt: Attempt): Promise<void>;
  get(id: string): Promise<Attempt | undefined>;
  list(): Promise<Attempt[]>;
  delete(id: string): Promise<void>;
}

export interface Clock {
  now(): string;
}

export interface IdGenerator {
  next(): string;
}

export interface Evaluator {
  evaluate(input: {
    problem: Problem;
    design: Design;
    previous?: Evaluation | null;
  }): Promise<Evaluation>;
}

export interface LlmClient {
  configured(): boolean;
  complete(prompt: string): Promise<string>;
}

export type { AttemptSnapshot };
