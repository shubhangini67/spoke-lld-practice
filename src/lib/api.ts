export type ProblemListItem = {
  id: string;
  title: string;
  difficulty: string;
  minutes: number;
  summary: string;
  tags: string[];
  capabilityCount: number;
};

export type ProblemDetail = ProblemListItem & {
  scenario: string;
  requirements: string[];
  constraints: string[];
  questions: {
    id: string;
    prompt: string;
    whyItMatters: string;
    options: { id: string; label: string; implication: string }[];
  }[];
  followUp: { title: string; prompt: string; whatItTests: string };
  capabilities: { id: string; title: string; description: string; optional: boolean }[];
};

export type AttemptPayload = {
  id: string;
  problemId: string;
  parentAttemptId: string | null;
  followUpApplied: boolean;
  status: string;
  design: import("@/domain/design").Design;
  evaluation: import("@/domain/evaluation").Evaluation | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  problem: ProblemDetail;
  activeCapabilities: { id: string; title: string; description: string }[];
  lockedScope: string[];
  readiness: { ready: boolean; checks: { id: string; label: string; ok: boolean }[] };
};

export type HistoryItem = {
  id: string;
  problemId: string;
  problemTitle: string;
  status: string;
  parentAttemptId: string | null;
  followUpApplied: boolean;
  band: string | null;
  overall: number | null;
  updatedAt: string;
  createdAt: string;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || `Request failed (${response.status})`);
  }
  return body as T;
}

export const api = {
  health: () => request<{ ok: boolean; llm: boolean }>("/api/health"),
  problems: () => request<{ problems: ProblemListItem[] }>("/api/problems"),
  problem: (id: string) => request<{ problem: ProblemDetail }>(`/api/problems/${id}`),
  sample: (id: string) => request<{ design: AttemptPayload["design"] }>(`/api/problems/${id}/sample`),
  attempts: () => request<{ attempts: HistoryItem[] }>("/api/attempts"),
  attempt: (id: string) => request<{ attempt: AttemptPayload }>(`/api/attempts/${id}`),
  start: (body: { problemId: string; parentAttemptId?: string | null; applyFollowUp?: boolean }) =>
    request<{ attempt: AttemptPayload }>("/api/attempts", { method: "POST", body: JSON.stringify(body) }),
  saveDraft: (id: string, design: AttemptPayload["design"]) =>
    request<{ attempt: AttemptPayload }>(`/api/attempts/${id}/draft`, {
      method: "PUT",
      body: JSON.stringify({ design }),
    }),
  submit: (id: string) =>
    request<{ attempt: AttemptPayload }>(`/api/attempts/${id}/submit`, { method: "POST" }),
  retry: (id: string) =>
    request<{ attempt: AttemptPayload }>(`/api/attempts/${id}/retry`, { method: "POST" }),
  abandon: (id: string) => request<{ ok: boolean }>(`/api/attempts/${id}`, { method: "DELETE" }),
};
