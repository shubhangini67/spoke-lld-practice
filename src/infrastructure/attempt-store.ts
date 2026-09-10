import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { Attempt, type AttemptSnapshot } from "@/domain/attempt";
import type { AttemptRepository } from "@/domain/ports";

export class JsonAttemptStore implements AttemptRepository {
  private cache: Map<string, AttemptSnapshot> | null = null;

  constructor(private readonly filePath: string) {}

  async save(attempt: Attempt): Promise<void> {
    const cache = await this.load();
    cache.set(attempt.id, attempt.toSnapshot());
    await this.flush(cache);
  }

  async get(id: string): Promise<Attempt | undefined> {
    const snapshot = (await this.load()).get(id);
    return snapshot ? new Attempt(structuredClone(snapshot)) : undefined;
  }

  async list(): Promise<Attempt[]> {
    return [...(await this.load()).values()].map((item) => new Attempt(structuredClone(item)));
  }

  async delete(id: string): Promise<void> {
    const cache = await this.load();
    cache.delete(id);
    await this.flush(cache);
  }

  private async load(): Promise<Map<string, AttemptSnapshot>> {
    if (this.cache) return this.cache;
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as AttemptSnapshot[];
      this.cache = new Map(parsed.map((item) => [item.id, item]));
    } catch {
      this.cache = new Map();
    }
    return this.cache;
  }

  private async flush(cache: Map<string, AttemptSnapshot>): Promise<void> {
    this.cache = cache;
    try {
      await mkdir(path.dirname(this.filePath), { recursive: true });
      await writeFile(this.filePath, JSON.stringify([...cache.values()], null, 2));
    } catch {
      // Vercel / read-only FS: keep memory. Local `data/` is the durable path.
    }
  }
}

export class MemoryAttemptStore implements AttemptRepository {
  private readonly cache = new Map<string, AttemptSnapshot>();

  async save(attempt: Attempt): Promise<void> {
    this.cache.set(attempt.id, attempt.toSnapshot());
  }

  async get(id: string): Promise<Attempt | undefined> {
    const snapshot = this.cache.get(id);
    return snapshot ? new Attempt(structuredClone(snapshot)) : undefined;
  }

  async list(): Promise<Attempt[]> {
    return [...this.cache.values()].map((item) => new Attempt(structuredClone(item)));
  }

  async delete(id: string): Promise<void> {
    this.cache.delete(id);
  }
}
