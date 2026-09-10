import type { LlmClient } from "@/domain/ports";

export class HttpLlmClient implements LlmClient {
  constructor(
    private readonly apiKey: string | undefined,
    private readonly timeoutMs = 10_000,
    private readonly model = process.env.SPOKE_LLM_MODEL ?? "gpt-4o-mini",
    private readonly baseUrl = process.env.SPOKE_LLM_BASE_URL ?? "https://api.openai.com/v1",
  ) {}

  configured(): boolean {
    return Boolean(this.apiKey);
  }

  async complete(prompt: string): Promise<string> {
    if (!this.apiKey) throw new Error("LLM is not configured");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "Return only valid JSON. Never invent a golden class list." },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (!response.ok) {
        throw new Error(`LLM HTTP ${response.status}`);
      }
      const body = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = body.choices?.[0]?.message?.content;
      if (!content) throw new Error("LLM returned an empty message");
      return content;
    } finally {
      clearTimeout(timer);
    }
  }
}
