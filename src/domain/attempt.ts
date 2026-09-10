import { AttemptStatus } from "./enums";
import type { Design } from "./design";
import { emptyDesign } from "./design";
import type { Evaluation } from "./evaluation";
import { InvalidStateTransition } from "./errors";

export interface AttemptSnapshot {
  id: string;
  problemId: string;
  parentAttemptId: string | null;
  followUpApplied: boolean;
  status: AttemptStatus;
  design: Design;
  evaluation: Evaluation | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
}

export class Attempt {
  readonly id: string;
  readonly problemId: string;
  readonly parentAttemptId: string | null;
  readonly followUpApplied: boolean;
  readonly createdAt: string;
  status: AttemptStatus;
  design: Design;
  evaluation: Evaluation | null;
  failureReason: string | null;
  updatedAt: string;
  submittedAt: string | null;

  constructor(input: AttemptSnapshot) {
    this.id = input.id;
    this.problemId = input.problemId;
    this.parentAttemptId = input.parentAttemptId;
    this.followUpApplied = input.followUpApplied;
    this.status = input.status;
    this.design = input.design;
    this.evaluation = input.evaluation;
    this.failureReason = input.failureReason;
    this.createdAt = input.createdAt;
    this.updatedAt = input.updatedAt;
    this.submittedAt = input.submittedAt;
  }

  static start(args: {
    id: string;
    problemId: string;
    now: string;
    parentAttemptId?: string | null;
    followUpApplied?: boolean;
    design?: Design;
  }): Attempt {
    return new Attempt({
      id: args.id,
      problemId: args.problemId,
      parentAttemptId: args.parentAttemptId ?? null,
      followUpApplied: args.followUpApplied ?? false,
      status: AttemptStatus.Draft,
      design: args.design ? structuredClone(args.design) : emptyDesign(),
      evaluation: null,
      failureReason: null,
      createdAt: args.now,
      updatedAt: args.now,
      submittedAt: null,
    });
  }

  saveDraft(design: Design, now: string): void {
    this.assertStatus(AttemptStatus.Draft);
    this.design = structuredClone(design);
    this.updatedAt = now;
  }

  submit(now: string): void {
    this.assertStatus(AttemptStatus.Draft);
    this.status = AttemptStatus.Submitted;
    this.submittedAt = now;
    this.updatedAt = now;
    this.failureReason = null;
  }

  beginEvaluation(now: string): void {
    if (this.status !== AttemptStatus.Submitted && this.status !== AttemptStatus.EvaluationFailed) {
      throw new InvalidStateTransition(this.status, AttemptStatus.Evaluating);
    }
    this.status = AttemptStatus.Evaluating;
    this.updatedAt = now;
  }

  complete(evaluation: Evaluation, now: string): void {
    this.assertStatus(AttemptStatus.Evaluating);
    this.evaluation = evaluation;
    this.status = AttemptStatus.Evaluated;
    this.failureReason = null;
    this.updatedAt = now;
  }

  fail(reason: string, now: string): void {
    this.assertStatus(AttemptStatus.Evaluating);
    this.status = AttemptStatus.EvaluationFailed;
    this.failureReason = reason;
    this.updatedAt = now;
  }

  retryEvaluation(now: string): void {
    this.assertStatus(AttemptStatus.EvaluationFailed);
    this.beginEvaluation(now);
  }

  abandon(now: string): void {
    this.assertStatus(AttemptStatus.Draft);
    this.status = AttemptStatus.Abandoned;
    this.updatedAt = now;
  }

  toSnapshot(): AttemptSnapshot {
    return {
      id: this.id,
      problemId: this.problemId,
      parentAttemptId: this.parentAttemptId,
      followUpApplied: this.followUpApplied,
      status: this.status,
      design: structuredClone(this.design),
      evaluation: this.evaluation ? structuredClone(this.evaluation) : null,
      failureReason: this.failureReason,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      submittedAt: this.submittedAt,
    };
  }

  private assertStatus(expected: AttemptStatus): void {
    if (this.status !== expected) {
      throw new InvalidStateTransition(this.status, expected);
    }
  }
}
