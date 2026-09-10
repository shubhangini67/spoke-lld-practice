export class DomainError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "DomainError";
  }
}

export class InvalidSubmission extends DomainError {
  constructor(message: string) {
    super("invalid_submission", message);
    this.name = "InvalidSubmission";
  }
}

export class InvalidStateTransition extends DomainError {
  constructor(from: string, to: string) {
    super(
      "invalid_state",
      `Attempt cannot move from ${from} to ${to}.`,
    );
    this.name = "InvalidStateTransition";
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super("not_found", `${entity} '${id}' was not found.`);
    this.name = "NotFoundError";
  }
}
