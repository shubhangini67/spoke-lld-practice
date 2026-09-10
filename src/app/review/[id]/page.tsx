"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Diagram } from "@/components/diagram";
import { api, type AttemptPayload } from "@/lib/api";
import { bandLabel, formatTime } from "@/lib/format";

export default function ReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [attempt, setAttempt] = useState<AttemptPayload | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .attempt(params.id)
      .then((body) => {
        if (body.attempt.status === "draft") {
          router.replace(`/studio/${body.attempt.id}`);
          return;
        }
        setAttempt(body.attempt);
      })
      .catch((err: Error) => setError(err.message));
  }, [params.id, router]);

  async function revise(applyFollowUp = false) {
    if (!attempt || busy) return;
    setBusy(true);
    setError("");
    try {
      const body = await api.start({
        problemId: attempt.problemId,
        parentAttemptId: attempt.id,
        applyFollowUp,
      });
      router.push(`/studio/${body.attempt.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not revise");
      setBusy(false);
    }
  }

  async function retry() {
    if (!attempt || busy) return;
    setBusy(true);
    setError("");
    try {
      const body = await api.retry(attempt.id);
      setAttempt(body.attempt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setBusy(false);
    }
  }

  if (!attempt && !error) return <p className="text-muted">Loading review…</p>;
  if (!attempt) return <p className="text-bad">{error}</p>;

  const evaluation = attempt.evaluation;

  if (attempt.status === "evaluation_failed") {
    return (
      <div className="panel max-w-2xl p-8">
        <h1 className="display text-3xl">Evaluation failed</h1>
        <p className="mt-3 text-muted">
          Your submission is intact. Retry on the same attempt — do not resubmit.
        </p>
        <p className="mt-2 text-sm text-bad">{attempt.failureReason}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="btn btn-primary" onClick={retry}>
            {busy ? "Retrying…" : "Retry evaluation"}
          </button>
          <Link href="/attempts" className="btn btn-ghost">
            Back to attempts
          </Link>
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="panel p-8">
        <p className="text-muted">Still evaluating…</p>
        <button type="button" className="btn btn-ghost mt-4" onClick={() => window.location.reload()}>
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="panel p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href={`/problems/${attempt.problemId}`} className="text-sm text-mint hover:underline">
              {attempt.problem.title}
            </Link>
            <h1 className="display text-4xl">Design review</h1>
          </div>
          <div className={`rounded-full px-3 py-1 text-sm font-semibold band-${evaluation.band}`}>
            {bandLabel(evaluation.band)} · {evaluation.overall}
          </div>
        </div>
        {evaluation.degraded ? (
          <p className="mt-3 rounded-xl bg-amber/15 p-3 text-sm">
            Qualitative LLM review was skipped. The deterministic coverage below is complete.
          </p>
        ) : null}
        {evaluation.coverageDelta !== null ? (
          <p className="mt-3 text-sm">
            Coverage vs previous attempt:{" "}
            <strong>
              {evaluation.coverageDelta > 0 ? "+" : ""}
              {evaluation.coverageDelta}
            </strong>
          </p>
        ) : null}

        <div className="sticky-actions mt-6">
          <button type="button" className="btn btn-primary" onClick={() => revise(false)}>
            {busy ? "Opening…" : "Revise this design"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => revise(true)}>
            Revise for the follow-up
          </button>
          <Link
            className="btn btn-ghost"
            href={
              attempt.parentAttemptId
                ? `/compare?a=${attempt.parentAttemptId}&b=${attempt.id}`
                : "/attempts"
            }
          >
            {attempt.parentAttemptId ? "Compare with previous" : "Open attempts"}
          </Link>
        </div>
        {error ? <p className="mt-3 text-sm text-bad">{error}</p> : null}

        <h2 className="display mt-8 text-xl">Next attempt</h2>
        <p className="mt-2 rounded-2xl border border-line bg-raised/50 p-4">{evaluation.nextAttemptFocus}</p>

        <h2 className="display mt-8 text-xl">Dimensions</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {evaluation.dimensions.map((item) => (
            <div key={item.id} className="rounded-2xl border border-line p-3">
              <div className="flex justify-between text-sm">
                <span className="font-semibold">{item.title}</span>
                <span>{item.score}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                <div className="h-full bg-mint" style={{ width: `${item.score}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted">{item.rationale}</p>
            </div>
          ))}
        </div>

        <h2 className="display mt-8 text-xl">Capability coverage</h2>
        <ul className="mt-3 space-y-2">
          {evaluation.coverage.map((item) => (
            <li key={item.capabilityId} className="rounded-xl border border-line p-3">
              <p className="font-semibold">
                {item.title}{" "}
                <span className={`chip cover-${item.status}`}>{item.status}</span>
              </p>
              <p className="text-sm text-muted">{item.evidence}</p>
            </li>
          ))}
        </ul>

        <h2 className="display mt-8 text-xl">Concerns</h2>
        <div className="mt-3 space-y-3">
          {evaluation.concerns.map((item) => (
            <article key={item.title} className="rounded-2xl border border-line p-4">
              <p className="text-xs uppercase tracking-wide text-amber">{item.severity}</p>
              <h3 className="display text-lg">{item.title}</h3>
              <p className="mt-1 text-sm">{item.whyItMatters}</p>
              <p className="mt-2 text-sm text-mint">Ask yourself: {item.question}</p>
            </article>
          ))}
        </div>

        <h2 className="display mt-8 text-xl">Strengths</h2>
        <ul className="mt-3 space-y-2">
          {evaluation.strengths.map((item) => (
            <li key={item.title}>
              <strong>{item.title}.</strong> {item.detail}
            </li>
          ))}
        </ul>

        <h2 className="display mt-8 text-xl">Other valid shapes</h2>
        <p className="text-sm text-muted">Not the answer. When this shape fits, and what you pay.</p>
        <ul className="mt-3 space-y-3">
          {evaluation.alternatives.map((item) => (
            <li key={item.name} className="rounded-xl border border-line p-3">
              <p className="font-semibold">{item.name}</p>
              <p className="text-sm">Fits when: {item.whenItFits}</p>
              <p className="text-sm text-muted">Trade-off: {item.tradeoff}</p>
            </li>
          ))}
        </ul>

        <h2 className="display mt-8 text-xl">Interviewer questions</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
          {evaluation.interviewerQuestions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <aside className="space-y-4">
        <button
          type="button"
          className="panel w-full p-4 text-left hover:ring-1 hover:ring-mint"
          onClick={() => revise(true)}
        >
          <p className="chip chip-active">Follow-up waiting</p>
          <h2 className="display mt-2 text-lg">{attempt.problem.followUp.title}</h2>
          <p className="mt-2 text-sm">{attempt.problem.followUp.prompt}</p>
          <span className="btn btn-primary mt-4">Start this follow-up</span>
        </button>
        <div className="panel p-4">
          <p className="chip">Scope you locked</p>
          <ul className="mt-3 list-disc space-y-2 pl-4 text-sm">
            {attempt.lockedScope.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="panel p-4">
          <p className="chip mb-3">Submitted graph</p>
          <Diagram design={attempt.design} />
          <p className="mt-2 text-xs text-muted">{formatTime(attempt.submittedAt || attempt.updatedAt)}</p>
        </div>
        <div className="panel p-4">
          <p className="chip">Rejected path</p>
          <p className="mt-2 text-sm font-medium">{attempt.design.rejected.approach}</p>
          <p className="mt-1 text-sm text-muted">{attempt.design.rejected.whyNot}</p>
        </div>
      </aside>
    </div>
  );
}
