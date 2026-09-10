import { Attempt } from "@/domain/attempt";
import type { Design } from "@/domain/design";
import { validateForSubmit } from "@/domain/design";
import { InvalidStateTransition, NotFoundError } from "@/domain/errors";
import type { AttemptRepository, Clock, Evaluator, IdGenerator, ProblemRepository } from "@/domain/ports";
import type { Problem } from "@/domain/problem";

export class PracticeService {
  constructor(
    private readonly problems: ProblemRepository,
    private readonly attempts: AttemptRepository,
    private readonly evaluator: Evaluator,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  listProblems(): Problem[] {
    return this.problems.list();
  }

  getProblem(id: string): Problem {
    const problem = this.problems.get(id);
    if (!problem) throw new NotFoundError("Problem", id);
    return problem;
  }

  async startAttempt(input: {
    problemId: string;
    parentAttemptId?: string | null;
    applyFollowUp?: boolean;
  }): Promise<Attempt> {
    const problem = this.getProblem(input.problemId);
    let design = undefined;
    let parentAttemptId: string | null = null;
    let followUpApplied = false;

    if (input.parentAttemptId) {
      const parent = await this.requireAttempt(input.parentAttemptId);
      if (parent.problemId !== problem.id) {
        throw new InvalidStateTransition(parent.problemId, problem.id);
      }
      parentAttemptId = parent.id;
      design = parent.design;
      followUpApplied = Boolean(input.applyFollowUp) || parent.followUpApplied;
      if (input.applyFollowUp) {
        design = {
          ...structuredClone(parent.design),
          notes: [parent.design.notes, `Follow-up: ${problem.followUp.prompt}`].filter(Boolean).join("\n\n"),
        };
      }
    }

    const attempt = Attempt.start({
      id: this.ids.next(),
      problemId: problem.id,
      now: this.clock.now(),
      parentAttemptId,
      followUpApplied,
      design,
    });
    await this.attempts.save(attempt);
    return attempt;
  }

  async saveDraft(id: string, design: Design): Promise<Attempt> {
    const attempt = await this.requireAttempt(id);
    attempt.saveDraft(design, this.clock.now());
    await this.attempts.save(attempt);
    return attempt;
  }

  async submit(id: string): Promise<Attempt> {
    const attempt = await this.requireAttempt(id);
    const problem = this.getProblem(attempt.problemId);
    validateForSubmit(attempt.design, problem.questions.map((item) => item.id));
    attempt.submit(this.clock.now());
    attempt.beginEvaluation(this.clock.now());
    await this.attempts.save(attempt);

    try {
      const previous = attempt.parentAttemptId
        ? (await this.attempts.get(attempt.parentAttemptId))?.evaluation ?? null
        : null;
      const evaluation = await this.evaluator.evaluate({
        problem,
        design: attempt.design,
        previous,
      });
      attempt.complete(evaluation, this.clock.now());
    } catch (error) {
      attempt.fail(error instanceof Error ? error.message : "Evaluation crashed", this.clock.now());
    }

    await this.attempts.save(attempt);
    return attempt;
  }

  async retryEvaluation(id: string): Promise<Attempt> {
    const attempt = await this.requireAttempt(id);
    const problem = this.getProblem(attempt.problemId);
    attempt.retryEvaluation(this.clock.now());
    await this.attempts.save(attempt);
    try {
      const previous = attempt.parentAttemptId
        ? (await this.attempts.get(attempt.parentAttemptId))?.evaluation ?? null
        : null;
      const evaluation = await this.evaluator.evaluate({
        problem,
        design: attempt.design,
        previous,
      });
      attempt.complete(evaluation, this.clock.now());
    } catch (error) {
      attempt.fail(error instanceof Error ? error.message : "Evaluation crashed", this.clock.now());
    }
    await this.attempts.save(attempt);
    return attempt;
  }

  async getAttempt(id: string): Promise<Attempt> {
    return this.requireAttempt(id);
  }

  async listAttempts(): Promise<Attempt[]> {
    const items = await this.attempts.list();
    return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async abandon(id: string): Promise<void> {
    const attempt = await this.requireAttempt(id);
    attempt.abandon(this.clock.now());
    await this.attempts.delete(id);
  }

  private async requireAttempt(id: string): Promise<Attempt> {
    const attempt = await this.attempts.get(id);
    if (!attempt) throw new NotFoundError("Attempt", id);
    return attempt;
  }
}
