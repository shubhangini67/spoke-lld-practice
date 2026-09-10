"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, type ProblemDetail } from "@/lib/api";

export default function ProblemPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .problem(params.id)
      .then((body) => setProblem(body.problem))
      .catch((err: Error) => setError(err.message));
  }, [params.id]);

  async function start() {
    if (!problem || busy) return;
    setBusy(true);
    setError("");
    try {
      const body = await api.start({ problemId: problem.id });
      router.push(`/studio/${body.attempt.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start");
      setBusy(false);
    }
  }

  if (!problem && !error) return <p className="text-muted">Loading brief…</p>;
  if (!problem) return <p className="text-bad">{error}</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <article className="panel p-6 sm:p-8">
        <Link href="/" className="text-sm text-mint hover:underline">
          ← Problems
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={`chip diff-${problem.difficulty}`}>{problem.difficulty}</span>
          <span className="chip">{problem.minutes} min</span>
        </div>
        <h1 className="display mt-3 text-4xl sm:text-5xl">{problem.title}</h1>
        <p className="mt-3 text-muted">{problem.scenario}</p>
        <h2 className="display mt-8 text-xl">Requirements</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {problem.requirements.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <h2 className="display mt-6 text-xl">Constraints</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {problem.constraints.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" className="btn btn-primary" onClick={start}>
            {busy ? "Opening studio…" : "Start an attempt"}
          </button>
          <Link href="/attempts" className="btn btn-ghost">
            View attempts
          </Link>
        </div>
        {error ? <p className="mt-3 text-sm text-bad">{error}</p> : null}
      </article>
      <aside className="space-y-4">
        <div className="panel p-5">
          <p className="chip chip-active">Capabilities, not class names</p>
          <p className="mt-3 text-sm text-muted">
            Two valid designs can cover the same behaviour with different names. Optional
            capabilities turn on only if you lock that clarifying question.
          </p>
          <ul className="mt-4 space-y-3">
            {problem.capabilities.map((item) => (
              <li key={item.id} className="rounded-xl border border-line p-3">
                <p className="font-semibold">
                  {item.title}{" "}
                  {item.optional ? <span className="chip">if scoped</span> : null}
                </p>
                <p className="text-sm text-muted">{item.description}</p>
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          className="panel w-full p-5 text-left hover:ring-1 hover:ring-mint"
          onClick={start}
        >
          <p className="chip">Interviewer follow-up</p>
          <h2 className="display mt-2 text-lg">{problem.followUp.title}</h2>
          <p className="mt-2 text-sm">{problem.followUp.prompt}</p>
          <p className="mt-2 text-xs uppercase tracking-wide text-muted">
            Tests: {problem.followUp.whatItTests}
          </p>
          <span className="btn btn-ghost mt-4">Start and keep this in mind</span>
        </button>
      </aside>
    </div>
  );
}
