"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type HistoryItem, type ProblemListItem } from "@/lib/api";
import { bandLabel, formatTime } from "@/lib/format";

const LOOP = [
  { id: "choose", title: "Choose", body: "Pick a brief and lock the scope an interviewer would ask first.", href: "#problems" },
  { id: "design", title: "Design", body: "Name types, walk a use case, and defend what you rejected.", href: "#problems" },
  { id: "submit", title: "Submit", body: "Get coverage and seams — not a golden class list.", href: "/attempts" },
  { id: "revise", title: "Revise", body: "Open history, compare attempts, and take the follow-up.", href: "/attempts" },
];

export function CatalogView({ initialProblems }: { initialProblems: ProblemListItem[] }) {
  const [problems] = useState<ProblemListItem[]>(initialProblems);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [loopHint, setLoopHint] = useState(LOOP[0].id);

  useEffect(() => {
    api
      .attempts()
      .then((attemptBody) => setHistory(attemptBody.attempts))
      .catch((err: Error) => setError(err.message));
  }, []);

  const visible = problems.filter((item) => filter === "all" || item.difficulty === filter);
  const lastByProblem = new Map<string, HistoryItem>();
  for (const item of history) {
    if (!lastByProblem.has(item.problemId)) lastByProblem.set(item.problemId, item);
  }
  const latest = history[0];

  return (
    <div className="space-y-6">
      <section className="panel overflow-hidden p-6 sm:p-8">
        <p className="chip chip-active mb-4 w-fit">Practice the conversation</p>
        <h1 className="display max-w-3xl text-4xl leading-[1.05] sm:text-6xl">
          Rehearse LLD like an interview, not a blog recap.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted sm:text-lg">
          Lock scope, name types, walk one use case out loud, and defend the path you dropped.
          Feedback scores behaviours and seams — not whether you named it ParkingSpot.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#problems" className="btn btn-primary">
            Browse problems
          </a>
          <Link href={latest ? (latest.status === "draft" ? `/studio/${latest.id}` : `/review/${latest.id}`) : "/attempts"} className="btn btn-ghost">
            {latest ? "Continue last attempt" : "Open attempts"}
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {LOOP.map((item, index) => (
          <a
            key={item.id}
            href={item.href}
            onClick={() => setLoopHint(item.id)}
            className={`panel block p-4 transition hover:-translate-y-0.5 ${loopHint === item.id ? "ring-1 ring-mint" : ""}`}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-mint">0{index + 1}</p>
            <h2 className="display mt-1 text-xl">{item.title}</h2>
            <p className="mt-2 text-sm text-muted">{item.body}</p>
          </a>
        ))}
      </section>

      <section id="problems" className="grid gap-6 lg:grid-cols-[1.35fr_0.75fr]">
        <div className="panel p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="display text-2xl">Problem set</h2>
            <div className="flex flex-wrap gap-2">
              {["all", "easy", "medium", "hard"].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`chip ${filter === item ? "chip-active" : ""}`}
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          {error ? <p className="mt-4 text-sm text-bad">{error}</p> : null}
          <div className="mt-5 grid gap-3">
            {visible.length === 0 ? (
              <p className="text-muted">No problems in that filter. Try All.</p>
            ) : (
              visible.map((problem) => {
                const last = lastByProblem.get(problem.id);
                return (
                  <article key={problem.id} className="rounded-2xl border border-line bg-raised/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="display text-xl">{problem.title}</h3>
                        <p className="mt-1 text-sm text-muted">{problem.summary}</p>
                      </div>
                      <span className={`chip diff-${problem.difficulty}`}>{problem.difficulty}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
                      <span>{problem.minutes} min</span>
                      <span>{problem.capabilityCount} capabilities</span>
                      {last?.band ? (
                        <span className={`rounded-full px-2 py-0.5 band-${last.band}`}>
                          last: {bandLabel(last.band)}
                        </span>
                      ) : (
                        <span>not attempted</span>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link href={`/problems/${problem.id}`} className="btn btn-primary">
                        Open brief
                      </Link>
                      {last ? (
                        <Link
                          href={last.status === "draft" ? `/studio/${last.id}` : `/review/${last.id}`}
                          className="btn btn-ghost"
                        >
                          {last.status === "draft" ? "Resume draft" : "See last review"}
                        </Link>
                      ) : null}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="panel p-5">
            <p className="chip">What we refuse to score</p>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              <li>A golden class list from a blog.</li>
              <li>Whether hidden tests pass a god class.</li>
              <li>A paragraph with no types a reviewer can point at.</li>
            </ul>
          </div>
          {latest ? (
            <Link
              href={latest.status === "draft" ? `/studio/${latest.id}` : `/review/${latest.id}`}
              className="panel block p-5 hover:ring-1 hover:ring-mint"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-mint">Continue</p>
              <p className="display mt-1 text-lg">{latest.problemTitle}</p>
              <p className="text-sm text-muted">{formatTime(latest.updatedAt)}</p>
              <span className="btn btn-ghost mt-4">Open it</span>
            </Link>
          ) : (
            <div className="panel p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-mint">Tip</p>
              <p className="mt-2 text-sm text-muted">
                New here? Open Parking Lot, then load the discussable example to see a full loop in under two minutes.
              </p>
              <Link href="/problems/parking-lot" className="btn btn-primary mt-4">
                Try Parking Lot
              </Link>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
