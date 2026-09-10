"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, type HistoryItem } from "@/lib/api";
import { bandLabel, formatTime } from "@/lib/format";

export default function AttemptsPage() {
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [error, setError] = useState("");
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api
      .attempts()
      .then((body) => setItems(body.attempts))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoaded(true));
  }, []);

  const finished = items.filter((item) => item.status === "evaluated");

  function openCompare() {
    if (!left || !right || left === right) {
      setError("Pick two different evaluated attempts, then compare.");
      return;
    }
    router.push(`/compare?a=${left}&b=${right}`);
  }

  return (
    <div className="panel p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="display text-4xl">Attempts</h1>
          <p className="mt-2 max-w-2xl text-muted">
            Finished attempts are frozen. Revise clones the design into a new draft so history is
            about what moved.
          </p>
        </div>
        <Link href="/" className="btn btn-primary">
          Practice a problem
        </Link>
      </div>
      {error ? <p className="mt-3 text-bad">{error}</p> : null}

      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-line p-4">
        <div className="min-w-48 flex-1">
          <label>Compare</label>
          <select value={left} onChange={(event) => setLeft(event.target.value)}>
            <option value="">earlier attempt</option>
            {finished.map((item) => (
              <option key={item.id} value={item.id}>
                {item.problemTitle} · {bandLabel(item.band)} · {formatTime(item.updatedAt)}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-48 flex-1">
          <label>with</label>
          <select value={right} onChange={(event) => setRight(event.target.value)}>
            <option value="">later attempt</option>
            {finished.map((item) => (
              <option key={item.id} value={item.id}>
                {item.problemTitle} · {bandLabel(item.band)} · {formatTime(item.updatedAt)}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCompare}>
          Open comparison
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {!loaded ? (
          <p className="mt-6 text-muted">Loading attempts…</p>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-line p-6">
            <p className="text-muted">No attempts yet.</p>
            <Link href="/" className="btn btn-ghost mt-4">
              Pick a problem
            </Link>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-line p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="display text-xl">{item.problemTitle}</p>
                  <p className="text-sm text-muted">
                    {item.status}
                    {item.followUpApplied ? " · follow-up" : ""}
                    {item.parentAttemptId ? " · revision" : ""}
                    {" · "}
                    {formatTime(item.updatedAt)}
                  </p>
                </div>
                {item.band ? (
                  <span className={`rounded-full px-3 py-1 text-sm band-${item.band}`}>
                    {bandLabel(item.band)} · {item.overall}
                  </span>
                ) : (
                  <span className="chip">{item.status}</span>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={item.status === "draft" ? `/studio/${item.id}` : `/review/${item.id}`}
                  className="btn btn-primary"
                >
                  {item.status === "draft" ? "Resume studio" : "Open review"}
                </Link>
                <Link href={`/problems/${item.problemId}`} className="btn btn-ghost">
                  Problem brief
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
