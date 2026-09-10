"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api, type AttemptPayload } from "@/lib/api";
import { namedTypes } from "@/domain/design";
import { bandLabel } from "@/lib/format";

function CompareInner() {
  const search = useSearchParams();
  const aId = search.get("a");
  const bId = search.get("b");
  const [left, setLeft] = useState<AttemptPayload | null>(null);
  const [right, setRight] = useState<AttemptPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!aId || !bId) {
      setError("Pick two attempts to compare.");
      return;
    }
    Promise.all([api.attempt(aId), api.attempt(bId)])
      .then(([a, b]) => {
        setLeft(a.attempt);
        setRight(b.attempt);
      })
      .catch((err: Error) => setError(err.message));
  }, [aId, bId]);

  if (error) {
    return (
      <div className="panel p-8">
        <p className="text-bad">{error}</p>
        <Link href="/attempts" className="btn btn-primary mt-4">
          Back to attempts
        </Link>
      </div>
    );
  }
  if (!left || !right) return <p className="text-muted">Loading comparison…</p>;

  return (
    <div className="space-y-5">
      <div>
        <Link href="/attempts" className="text-sm text-mint hover:underline">
          ← Attempts
        </Link>
        <h1 className="display text-4xl">What moved</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`/review/${left.id}`} className="btn btn-ghost">
            Open earlier review
          </Link>
          <Link href={`/review/${right.id}`} className="btn btn-ghost">
            Open later review
          </Link>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Column attempt={left} label="Earlier" />
        <Column attempt={right} label="Later" />
      </div>
      <CoverageDiff left={left} right={right} />
    </div>
  );
}

function Column({ attempt, label }: { attempt: AttemptPayload; label: string }) {
  const evaluation = attempt.evaluation;
  return (
    <section className="panel p-5">
      <p className="chip">{label}</p>
      <h2 className="display mt-2 text-2xl">{attempt.problem.title}</h2>
      {evaluation ? (
        <p className={`mt-2 inline-block rounded-full px-3 py-1 text-sm band-${evaluation.band}`}>
          {bandLabel(evaluation.band)} · {evaluation.overall}
        </p>
      ) : (
        <p className="mt-2 text-sm">{attempt.status}</p>
      )}
      <h3 className="mt-4 text-sm uppercase tracking-wide text-muted">Types</h3>
      <ul className="mt-2 space-y-1 text-sm">
        {namedTypes(attempt.design).map((item) => (
          <li key={item.name}>
            <strong>{item.name}</strong> — {item.responsibility}
          </li>
        ))}
      </ul>
      <h3 className="mt-4 text-sm uppercase tracking-wide text-muted">Rejected</h3>
      <p className="text-sm">{attempt.design.rejected.approach}</p>
      <Link href={`/review/${attempt.id}`} className="btn btn-ghost mt-4">
        Open review
      </Link>
    </section>
  );
}

function CoverageDiff({ left, right }: { left: AttemptPayload; right: AttemptPayload }) {
  const a = new Map(left.evaluation?.coverage.map((item) => [item.capabilityId, item]) ?? []);
  const b = new Map(right.evaluation?.coverage.map((item) => [item.capabilityId, item]) ?? []);
  const ids = [...new Set([...a.keys(), ...b.keys()])];
  if (!ids.length) return null;
  return (
    <section className="panel p-5">
      <h2 className="display text-xl">Coverage delta</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {ids.map((id) => {
          const from = a.get(id);
          const to = b.get(id);
          const changed = from?.status !== to?.status;
          return (
            <li key={id} className={changed ? "font-semibold" : ""}>
              {to?.title || from?.title}: {from?.status ?? "—"} → {to?.status ?? "—"}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading comparison…</p>}>
      <CompareInner />
    </Suspense>
  );
}
