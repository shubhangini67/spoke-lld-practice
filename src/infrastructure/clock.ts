import { randomUUID } from "crypto";
import type { Clock, IdGenerator } from "@/domain/ports";

export class SystemClock implements Clock {
  now(): string {
    return new Date().toISOString();
  }
}

export class UuidGenerator implements IdGenerator {
  next(): string {
    return randomUUID();
  }
}

export class FrozenClock implements Clock {
  constructor(private value: string) {}
  now(): string {
    return this.value;
  }
  set(value: string): void {
    this.value = value;
  }
}

export class SequenceIds implements IdGenerator {
  private n = 0;
  next(): string {
    this.n += 1;
    return `att-${this.n}`;
  }
}
