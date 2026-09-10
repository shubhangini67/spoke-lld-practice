"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Diagram } from "@/components/diagram";
import { ClassifierKind, RelationKind } from "@/domain/enums";
import type { Design, DesignType, Relationship, WalkthroughStep } from "@/domain/design";
import { emptyDesign, submitReadiness } from "@/domain/design";
import { api, type AttemptPayload } from "@/lib/api";
import { KINDS, RELS, toMermaid } from "@/lib/design-helpers";

const STEPS = [
  { id: "clarify", label: "Clarify", hint: "Lock the interview scope" },
  { id: "structure", label: "Structure", hint: "Types and who talks to whom" },
  { id: "walk", label: "Walkthrough", hint: "Narrate one use case" },
  { id: "defend", label: "Defend", hint: "Assumptions and rejected path" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const CHECK_STEP: Record<string, StepId> = {
  types: "structure",
  clarify: "clarify",
  walk: "walk",
  rels: "structure",
  defend: "defend",
};

export default function StudioPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [attempt, setAttempt] = useState<AttemptPayload | null>(null);
  const [design, setDesign] = useState<Design>(emptyDesign());
  const [step, setStep] = useState<StepId>("clarify");
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState("idle");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sampleNote, setSampleNote] = useState("");

  useEffect(() => {
    api
      .attempt(params.id)
      .then((body) => {
        if (body.attempt.status !== "draft") {
          router.replace(`/review/${body.attempt.id}`);
          return;
        }
        setAttempt(body.attempt);
        setDesign(body.attempt.design);
      })
      .catch((err: Error) => setError(err.message));
  }, [params.id, router]);

  useEffect(() => {
    if (!attempt || attempt.status !== "draft") return undefined;
    setSaveState("saving");
    const timer = setTimeout(() => {
      api
        .saveDraft(attempt.id, design)
        .then((body) => {
          setAttempt(body.attempt);
          setSaveState("saved");
        })
        .catch((err: Error) => {
          setSaveState("error");
          setError(err.message);
        });
    }, 550);
    return () => clearTimeout(timer);
  }, [attempt?.id, attempt?.status, design]);

  const names = useMemo(
    () => design.types.map((item) => item.name.trim()).filter(Boolean),
    [design.types],
  );

  const stepIndex = STEPS.findIndex((item) => item.id === step);

  async function submit() {
    if (!attempt || busy) return;
    setBusy(true);
    setError("");
    try {
      await api.saveDraft(attempt.id, design);
      const body = await api.submit(attempt.id);
      router.push(`/review/${body.attempt.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
      setBusy(false);
    }
  }

  async function loadSample() {
    if (!attempt) return;
    try {
      const body = await api.sample(attempt.problemId);
      setDesign(body.design);
      setSampleNote("Loaded a discussable example. You can still edit everything.");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No sample for this problem yet.");
    }
  }

  async function copyMermaid() {
    try {
      await navigator.clipboard.writeText(toMermaid(design));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Clipboard is blocked in this browser. Select the graph and copy manually.");
    }
  }

  if (!attempt && !error) return <p className="text-muted">Opening studio…</p>;
  if (!attempt) return <p className="text-bad">{error}</p>;

  const readiness = submitReadiness(
    design,
    attempt.problem.questions.map((item) => item.id),
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div className="panel p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link href={`/problems/${attempt.problemId}`} className="text-sm text-mint hover:underline">
              {attempt.problem.title}
            </Link>
            <h1 className="display text-3xl">Design studio</h1>
          </div>
          <p className="chip">{saveState === "saved" ? "Saved" : saveState === "saving" ? "Saving…" : saveState}</p>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-4">
          {STEPS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={`rounded-2xl border p-3 text-left ${step === item.id ? "option-card-on" : "option-card"}`}
              onClick={() => setStep(item.id)}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-mint">0{index + 1}</p>
              <p className="display text-lg">{item.label}</p>
              <p className="mt-1 text-xs text-muted">{item.hint}</p>
            </button>
          ))}
        </div>

        {step === "clarify" ? <ClarifyStep attempt={attempt} design={design} onChange={setDesign} /> : null}
        {step === "structure" ? <StructureStep design={design} names={names} onChange={setDesign} /> : null}
        {step === "walk" ? <WalkStep design={design} names={names} onChange={setDesign} /> : null}
        {step === "defend" ? <DefendStep design={design} onChange={setDesign} /> : null}

        {error ? <p className="mt-4 rounded-xl bg-bad/15 p-3 text-sm text-bad">{error}</p> : null}
        {sampleNote ? <p className="mt-4 rounded-xl bg-mint/10 p-3 text-sm text-mint">{sampleNote}</p> : null}

        <div className="sticky-actions mt-6">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setStep(STEPS[Math.max(0, stepIndex - 1)].id)}
          >
            Back
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setStep(STEPS[Math.min(STEPS.length - 1, stepIndex + 1)].id)}
          >
            Next step
          </button>
          <button type="button" className="btn btn-ghost" onClick={loadSample}>
            Load example
          </button>
          <button type="button" className="btn btn-ghost" onClick={copyMermaid}>
            {copied ? "Copied" : "Copy Mermaid"}
          </button>
          <button type="button" className="btn btn-primary ml-auto" onClick={submit}>
            {busy ? "Evaluating…" : readiness.ready ? "Submit design" : "Submit anyway"}
          </button>
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <div className="panel p-4">
          <p className="chip">Ready to submit?</p>
          <p className="mt-2 text-xs text-muted">Click a row to jump to that step. Submit is always available.</p>
          <ul className="mt-3 space-y-1">
            {readiness.checks.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`check-btn ${item.ok ? "text-mint" : "text-muted"}`}
                  onClick={() => setStep(CHECK_STEP[item.id] ?? "clarify")}
                >
                  {item.ok ? "●" : "○"} {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel p-4">
          <p className="chip mb-3">Live graph</p>
          <Diagram design={design} />
        </div>
        <div className="panel p-4">
          <p className="chip">Active capabilities</p>
          <ul className="mt-3 space-y-2 text-sm">
            {attempt.activeCapabilities.map((item) => (
              <li key={item.id}>
                <span className="font-medium">{item.title}</span>
                <span className="block text-muted">{item.description}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function ClarifyStep({
  attempt,
  design,
  onChange,
}: {
  attempt: AttemptPayload;
  design: Design;
  onChange: (design: Design) => void;
}) {
  return (
    <div className="mt-6 space-y-5">
      <p className="text-sm text-muted">
        Interviews start here. Each choice is a button — tap one to lock it. That can turn extra
        capabilities on.
      </p>
      {attempt.problem.questions.map((question) => (
        <fieldset key={question.id} className="rounded-2xl border border-line p-4">
          <legend className="display px-1 text-lg">{question.prompt}</legend>
          <p className="mb-3 text-sm text-muted">{question.whyItMatters}</p>
          <div className="grid gap-2">
            {question.options.map((option) => {
              const selected = design.clarifications[question.id] === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`option-card ${selected ? "option-card-on" : ""}`}
                  onClick={() =>
                    onChange({
                      ...design,
                      clarifications: { ...design.clarifications, [question.id]: option.id },
                    })
                  }
                >
                  <p className="font-semibold">{option.label}</p>
                  <p className="text-sm text-muted">{option.implication}</p>
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

function StructureStep({
  design,
  names,
  onChange,
}: {
  design: Design;
  names: string[];
  onChange: (design: Design) => void;
}) {
  function updateType(index: number, patch: Partial<DesignType>) {
    const types = design.types.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange({ ...design, types });
  }

  function updateRel(index: number, patch: Partial<Relationship>) {
    const relationships = design.relationships.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange({ ...design, relationships });
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="display text-xl">Types</h2>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() =>
            onChange({
              ...design,
              types: [
                ...design.types,
                { name: "", kind: ClassifierKind.Class, responsibility: "", fields: [], methods: [] },
              ],
            })
          }
        >
          Add type
        </button>
      </div>
      <div className="space-y-4">
        {design.types.map((item, index) => (
          <div key={index} className="rounded-2xl border border-line bg-raised/40 p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
              <div>
                <label>Name</label>
                <input value={item.name} onChange={(event) => updateType(index, { name: event.target.value })} />
              </div>
              <div>
                <label>Kind</label>
                <select
                  value={item.kind}
                  onChange={(event) => updateType(index, { kind: event.target.value as ClassifierKind })}
                >
                  {KINDS.map((kind) => (
                    <option key={kind.value} value={kind.value}>
                      {kind.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label>Responsibility (one sentence)</label>
              <textarea
                rows={2}
                value={item.responsibility}
                onChange={(event) => updateType(index, { responsibility: event.target.value })}
              />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label>Fields, one per line</label>
                <textarea
                  rows={3}
                  value={item.fields.join("\n")}
                  onChange={(event) =>
                    updateType(index, {
                      fields: event.target.value.split("\n").map((line) => line.trim()).filter(Boolean),
                    })
                  }
                />
              </div>
              <div>
                <label>Methods, one per line</label>
                <textarea
                  rows={3}
                  value={item.methods.join("\n")}
                  onChange={(event) =>
                    updateType(index, {
                      methods: event.target.value.split("\n").map((line) => line.trim()).filter(Boolean),
                    })
                  }
                />
              </div>
            </div>
            <button
              type="button"
              className="btn btn-danger mt-3"
              onClick={() => onChange({ ...design, types: design.types.filter((_, i) => i !== index) })}
            >
              Remove type
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <h2 className="display text-xl">Relationships</h2>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() =>
            onChange({
              ...design,
              relationships: [
                ...design.relationships,
                { source: names[0] ?? "", target: names[1] ?? names[0] ?? "", kind: RelationKind.Uses, note: "" },
              ],
            })
          }
        >
          Add relationship
        </button>
      </div>
      <div className="space-y-3">
        {design.relationships.map((rel, index) => (
          <div key={index} className="grid gap-2 rounded-2xl border border-line p-3 sm:grid-cols-4">
            <select value={rel.source} onChange={(event) => updateRel(index, { source: event.target.value })}>
              <option value="">source</option>
              {names.map((name) => (
                <option key={`s-${name}`}>{name}</option>
              ))}
            </select>
            <select
              value={rel.kind}
              onChange={(event) => updateRel(index, { kind: event.target.value as RelationKind })}
            >
              {RELS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <select value={rel.target} onChange={(event) => updateRel(index, { target: event.target.value })}>
              <option value="">target</option>
              {names.map((name) => (
                <option key={`t-${name}`}>{name}</option>
              ))}
            </select>
            <input
              placeholder="note"
              value={rel.note}
              onChange={(event) => updateRel(index, { note: event.target.value })}
            />
            <button
              type="button"
              className="btn btn-danger sm:col-span-4"
              onClick={() =>
                onChange({ ...design, relationships: design.relationships.filter((_, i) => i !== index) })
              }
            >
              Remove relationship
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function WalkStep({
  design,
  names,
  onChange,
}: {
  design: Design;
  names: string[];
  onChange: (design: Design) => void;
}) {
  function update(index: number, patch: Partial<WalkthroughStep>) {
    const walkthrough = design.walkthrough.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange({ ...design, walkthrough });
  }

  return (
    <div className="mt-6 space-y-4">
      <p className="text-sm text-muted">
        Narrate the risky happy path: actor, action, collaborator, outcome. Every control below is
        live.
      </p>
      {design.walkthrough.map((step, index) => (
        <div key={index} className="grid gap-2 rounded-2xl border border-line bg-raised/40 p-3 sm:grid-cols-2">
          <select value={step.actor} onChange={(event) => update(index, { actor: event.target.value })}>
            <option value="">actor</option>
            {names.map((name) => (
              <option key={`a-${index}-${name}`}>{name}</option>
            ))}
          </select>
          <input
            placeholder="action (assign, vend, evict…)"
            value={step.action}
            onChange={(event) => update(index, { action: event.target.value })}
          />
          <select
            value={step.collaborator}
            onChange={(event) => update(index, { collaborator: event.target.value })}
          >
            <option value="">collaborator</option>
            {names.map((name) => (
              <option key={`c-${index}-${name}`}>{name}</option>
            ))}
          </select>
          <input
            placeholder="outcome"
            value={step.outcome}
            onChange={(event) => update(index, { outcome: event.target.value })}
          />
          <button
            type="button"
            className="btn btn-danger sm:col-span-2"
            onClick={() =>
              onChange({ ...design, walkthrough: design.walkthrough.filter((_, i) => i !== index) })
            }
          >
            Remove beat
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() =>
          onChange({
            ...design,
            walkthrough: [...design.walkthrough, { actor: "", action: "", collaborator: "", outcome: "" }],
          })
        }
      >
        Add beat
      </button>
    </div>
  );
}

function DefendStep({
  design,
  onChange,
}: {
  design: Design;
  onChange: (design: Design) => void;
}) {
  return (
    <div className="mt-6 space-y-4">
      <div>
        <label>Assumptions, one per line</label>
        <textarea
          rows={4}
          value={design.assumptions.join("\n")}
          onChange={(event) => onChange({ ...design, assumptions: event.target.value.split("\n") })}
        />
      </div>
      <div>
        <label>Approach you rejected</label>
        <input
          value={design.rejected.approach}
          onChange={(event) =>
            onChange({ ...design, rejected: { ...design.rejected, approach: event.target.value } })
          }
        />
      </div>
      <div>
        <label>Why not</label>
        <textarea
          rows={3}
          value={design.rejected.whyNot}
          onChange={(event) =>
            onChange({ ...design, rejected: { ...design.rejected, whyNot: event.target.value } })
          }
        />
      </div>
      <div>
        <label>Notes (optional)</label>
        <textarea
          rows={3}
          value={design.notes}
          onChange={(event) => onChange({ ...design, notes: event.target.value })}
        />
      </div>
      <div>
        <label>Code sketch (optional)</label>
        <textarea
          rows={8}
          className="font-mono text-sm"
          value={design.code}
          onChange={(event) => onChange({ ...design, code: event.target.value })}
        />
      </div>
    </div>
  );
}
