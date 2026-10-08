"use client";

import { useContext, useState, type ReactNode } from "react";
import { ArrowRight, ChevronDown, ExternalLink } from "lucide-react";
import type { Assessment, ControlStatus, ObligationResult } from "@/lib/rules/assessment";
import type { Cite } from "@/lib/rules/types";
import { TIERS, type ConfidenceLevel, type TierKey } from "@/lib/aegis-blocks";
import {
  STATUS_LABEL, appliesSummary, assumptionRows, gapAnswersMessage, groupObligations, profileRows,
  timingLabel, timingTone,
} from "@/lib/rules/present";
import { formatDate } from "@/lib/rules/dates";
import { ChatActionsContext } from "./aegis-blocks";
import { cn } from "@/lib/utils";

/**
 * The rules engine's answer as a card. Everything here comes from the engine's output (lib/rules),
 * never from the model's prose, so the tier, dates and duties on screen are the deterministic ones.
 */

const TIER_STYLE: Record<TierKey, { pill: string; dot: string }> = {
  prohibited: { pill: "border-red-200 bg-red-50 text-red-800", dot: "bg-red-500" },
  "high-risk": { pill: "border-orange-200 bg-orange-50 text-orange-800", dot: "bg-orange-500" },
  transparency: { pill: "border-amber-200 bg-amber-50 text-amber-900", dot: "bg-amber-500" },
  gpai: { pill: "border-sky-200 bg-sky-50 text-sky-800", dot: "bg-sky-500" },
  minimal: { pill: "border-emerald-200 bg-emerald-50 text-emerald-800", dot: "bg-emerald-500" },
};

const TONE: Record<string, string> = {
  now: "border-emerald-200 bg-emerald-50 text-emerald-800",
  later: "border-amber-200 bg-amber-50 text-amber-900",
  mixed: "border-indigo-200 bg-indigo-50 text-indigo-800",
  relief: "border-sky-200 bg-sky-50 text-sky-800",
  neutral: "border-border bg-muted text-muted-foreground",
};

const PRIORITY_STYLE: Record<string, string> = {
  P0: "border-red-200 bg-red-50 text-red-800",
  P1: "border-amber-200 bg-amber-50 text-amber-900",
  P2: "border-border bg-muted text-muted-foreground",
};

const BARS: Record<ConfidenceLevel, number> = { High: 3, Medium: 2, Low: 1 };

function Label({ children }: { children: ReactNode }) {
  return <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{children}</dt>;
}

function Cell({ children }: { children: ReactNode }) {
  return <div className="flex min-w-0 flex-col gap-1.5 bg-card px-4 py-3">{children}</div>;
}

function Chip({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap", TONE[tone] ?? tone)}>
      {children}
    </span>
  );
}

function Section({ title, count, children, open }: { title: string; count?: number; children: ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-t border-border">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent/40 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          {title}
          {count !== undefined && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">{count}</span>}
        </span>
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="px-4 pb-4 pt-1">{children}</div>
    </details>
  );
}

function Cites({ cites }: { cites: Cite[] }) {
  if (!cites.length) return null;
  return (
    <span className="inline-flex flex-wrap gap-x-3 gap-y-1">
      {cites.map((c) => (
        <a key={c.url + c.ref} href={c.url} target="_blank" rel="noreferrer" title={c.page}
          className="inline-flex items-center gap-1 text-xs font-medium text-ring underline-offset-2 hover:underline">
          {c.src === "omnibus" ? `Omnibus ${c.ref}` : c.ref}
          <ExternalLink className="size-3" aria-hidden="true" />
        </a>
      ))}
    </span>
  );
}

function ObligationRow({ o }: { o: ObligationResult }) {
  return (
    <li className="rounded-xl border border-border bg-background px-3 py-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">
          {o.title}
          {o.status === "possible" && <span className="ml-2 text-xs font-medium text-muted-foreground">(might apply)</span>}
        </p>
        <Chip tone={timingTone(o)}>{timingLabel(o)}</Chip>
      </div>
      <p className="mt-1 text-sm leading-snug text-muted-foreground">{o.what}</p>
      <dl className="mt-2 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
        <div><dt className="inline font-semibold text-foreground">Owner: </dt><dd className="inline text-muted-foreground">{o.owner}</dd></div>
        <div><dt className="inline font-semibold text-foreground">Evidence: </dt><dd className="inline text-muted-foreground">{o.evidence}</dd></div>
      </dl>
      {o.timing.note && <p className="mt-1.5 text-xs text-muted-foreground">{o.timing.note}</p>}
      <div className="mt-2"><Cites cites={o.cites} /></div>
    </li>
  );
}

function GapForm({ a }: { a: Assessment }) {
  const { send, busy } = useContext(ChatActionsContext);
  const [answers, setAnswers] = useState<Record<string, ControlStatus>>({});
  const questions = a.gapCheck.questions;
  const done = Object.keys(answers).length;
  if (!questions.length) return null;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Answer for what you have today. Skip any you are unsure of.</p>
      <ol className="space-y-3">
        {questions.map((q) => (
          <li key={q.controlId} className="rounded-xl border border-border bg-background px-3 py-2.5">
            <p className="text-sm font-medium text-foreground">{q.question}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Good looks like: {q.good}</p>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={q.question}>
              {(Object.keys(STATUS_LABEL) as ControlStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={answers[q.controlId] === s}
                  onClick={() => setAnswers((prev) => (prev[q.controlId] === s ? Object.fromEntries(Object.entries(prev).filter(([k]) => k !== q.controlId)) : { ...prev, [q.controlId]: s }))}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                    answers[q.controlId] === s ? "border-ring bg-accent text-foreground" : "border-border bg-card text-muted-foreground hover:border-ring"
                  )}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        disabled={busy || !send || done === 0}
        onClick={() => send?.(gapAnswersMessage(answers))}
        className="inline-flex items-center gap-1.5 rounded-full border border-ring bg-accent px-4 py-1.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-accent/70 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Build my action plan ({done} of {questions.length} answered)
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

export function AssessmentView({ assessment: a }: { assessment: Assessment }) {
  const { send, busy } = useContext(ChatActionsContext);
  const applying = a.obligations.filter((o) => o.status === "applies");
  const possible = a.obligations.filter((o) => o.status === "possible");
  const applies = appliesSummary(a);
  const why = a.findings.filter((f) => f.status === "yes" && f.stage !== "roles");
  const maybe = a.findings.filter((f) => f.status === "unknown");
  const roles = a.roles.filter((r) => r.status !== "no");
  const assumed = assumptionRows(a);
  const known = profileRows(a);

  return (
    <section aria-label="Assessment from the Aegis rules engine" className="my-1 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-secondary/60 px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {a.scope.status === "out_of_scope" ? "Outside the Act" : "Classification"}
          </p>
          <p className="text-[11px] text-muted-foreground" title={a.engine.rulePack}>
            Rules engine {a.engine.version} · as of {a.engine.today}
          </p>
        </div>
        {a.summary && <p className="mt-1 text-sm text-foreground">{a.summary}</p>}

        {a.scope.status === "out_of_scope" ? (
          <div className="mt-2 space-y-1.5">
            {a.scope.reasons.map((r) => (
              <p key={r.ruleId} className="text-sm text-foreground">
                {r.explain} <Cites cites={r.cites} />
              </p>
            ))}
          </div>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {a.tiers.length === 0 && <li className="text-sm text-muted-foreground">Not enough information to classify yet.</li>}
            {a.tiers.map((t) => (
              <li
                key={t.tier}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold",
                  TIER_STYLE[t.tier].pill,
                  t.status === "possible" && "border-dashed"
                )}
              >
                <span className={cn("size-2 rounded-full", TIER_STYLE[t.tier].dot)} aria-hidden="true" />
                {TIERS[t.tier].label}
                {t.status === "possible" && <span className="text-xs font-medium opacity-80">possible</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {a.scope.status !== "out_of_scope" && (
        <dl className="grid gap-px bg-border sm:grid-cols-3">
          <Cell>
            <Label>{roles.length > 1 ? "Your roles" : "Your role"}</Label>
            <dd className="text-sm font-semibold text-foreground">
              {roles.length ? roles.map((r) => (r.status === "unknown" ? `${r.label}?` : r.label)).join(", ") : "Not determined yet"}
              {a.authorisedRepresentativeNeeded === "yes" && (
                <span className="mt-1 block text-xs font-normal text-muted-foreground">An authorised representative in the EU is needed.</span>
              )}
            </dd>
          </Cell>
          <Cell>
            <Label>Confidence</Label>
            <dd className="flex flex-col gap-1.5">
              <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className="flex gap-1" aria-hidden="true">
                  {[1, 2, 3].map((n) => (
                    <span key={n} className={cn("h-1.5 w-5 rounded-full", n <= BARS[a.confidence.level] ? "bg-ring" : "bg-border")} />
                  ))}
                </span>
                {a.confidence.level}
              </span>
              {a.confidence.flipFacts.length > 0 && (
                <span className="text-xs leading-snug text-muted-foreground">Would change with: {a.confidence.flipFacts.join("; ")}</span>
              )}
            </dd>
          </Cell>
          <Cell>
            <Label>Applies</Label>
            <dd className="flex flex-col items-start gap-1.5">
              <Chip tone={applies.tone}>{applies.status}</Chip>
              {applies.detail && <span className="text-xs leading-snug text-muted-foreground">{applies.detail}</span>}
            </dd>
          </Cell>
        </dl>
      )}

      {a.diff && (
        <div className="border-t border-border bg-indigo-50/60 px-4 py-3 text-sm text-indigo-950">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-800">What changed</p>
          <p className="mt-1 font-medium">{a.diff.headline}</p>
          {(a.diff.obligationsAdded.length > 0 || a.diff.obligationsRemoved.length > 0 || a.diff.timingChanged.length > 0) && (
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-xs leading-snug">
              {a.diff.obligationsAdded.slice(0, 5).map((o) => <li key={"a" + o.id}>New: {o.title}</li>)}
              {a.diff.obligationsAdded.length > 5 && <li>and {a.diff.obligationsAdded.length - 5} more new duties (see Your duties)</li>}
              {a.diff.obligationsRemoved.map((o) => <li key={"r" + o.id}>No longer: {o.title}</li>)}
              {a.diff.timingChanged.map((o) => <li key={"t" + o.id}>{o.title}: {o.before} to {o.after}</li>)}
            </ul>
          )}
        </div>
      )}

      {a.exposure.highest && applying.length > 0 && (
        <div className="border-t border-border px-4 py-3 text-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Highest fine exposure</p>
          <p className="mt-1 text-foreground">
            {a.exposure.highest.max} <Cites cites={a.exposure.highest.cites} />
          </p>
          {a.exposure.smeNote && <p className="mt-1 text-xs text-muted-foreground">{a.exposure.smeNote}</p>}
        </div>
      )}

      {a.actionPlan && (
        <Section title="Action plan" count={a.actionPlan.length} open>
          {a.actionPlan.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing to fix among the controls you answered.</p>
          ) : (
            <ol className="space-y-2">
              {a.actionPlan.map((x) => (
                <li key={x.controlId} className="rounded-xl border border-border bg-background px-3 py-2.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      <span className={cn("mr-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold", PRIORITY_STYLE[x.priority])}>{x.priority}</span>
                      {x.action}
                    </p>
                    <Chip tone={x.timingStatus === "in_force" ? "now" : "later"}>
                      {x.from ? `${x.timingStatus === "in_force" ? "Since" : "From"} ${formatDate(x.from)}` : STATUS_LABEL[x.status]}
                    </Chip>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{x.why}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{x.owner}</span> · {x.articles.join(", ")} · Evidence: {x.evidence}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </Section>
      )}

      {why.length > 0 && (
        <Section title="Why this classification" count={why.length} open={a.tiers.length > 0 && applying.length === 0}>
          <ul className="space-y-2.5">
            {why.map((f) => (
              <li key={f.ruleId} className="text-sm">
                <p className="font-semibold text-foreground">{f.title}</p>
                <p className="leading-snug text-muted-foreground">{f.explain}</p>
                {f.judgement && <p className="mt-0.5 text-xs text-amber-800">Judgement call: {f.judgement}</p>}
                <div className="mt-1"><Cites cites={f.cites} /></div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {applying.length > 0 && (
        <Section title="Your duties" count={applying.length} open={applying.length <= 6}>
          <div className="space-y-4">
            {groupObligations(applying).map(({ group, items }) => (
              <div key={group}>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{group}</p>
                <ul className="space-y-2">{items.map((o) => <ObligationRow key={o.id} o={o} />)}</ul>
              </div>
            ))}
          </div>
        </Section>
      )}

      {(possible.length > 0 || maybe.length > 0) && (
        <Section title="Might apply, depending on open questions" count={possible.length + maybe.length}>
          <ul className="space-y-2">
            {possible.map((o) => <ObligationRow key={o.id} o={o} />)}
            {maybe.filter((f) => !a.tiers.some((t) => t.ruleIds.includes(f.ruleId) && t.status === "applies")).map((f) => (
              <li key={f.ruleId} className="text-sm">
                <p className="font-semibold text-foreground">{f.title}</p>
                <p className="leading-snug text-muted-foreground">{f.explain}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {a.questions.length > 0 && (
        <Section title="What would sharpen this" count={a.questions.length} open={a.confidence.level !== "High"}>
          <ol className="space-y-2">
            {a.questions.map((q) => (
              <li key={q.fact} className="text-sm">
                <p className="font-medium text-foreground">{q.ask}</p>
                <p className="text-xs text-muted-foreground">{q.why}</p>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {!a.gaps && a.gapCheck.questions.length > 0 && a.scope.status !== "out_of_scope" && (
        <Section title="Gap check" count={a.gapCheck.questions.length}>
          <GapForm a={a} />
        </Section>
      )}

      {assumed.length > 0 && (
        <Section title="What I assumed" count={assumed.length}>
          <p className="mb-2 text-xs text-muted-foreground">Taken as &ldquo;no&rdquo; unless you say otherwise. Tell me if any is wrong and I will re-run the assessment.</p>
          <ul className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            {assumed.map((r) => (
              <li key={r.label} className="flex justify-between gap-3 border-b border-border/60 py-1">
                <span className="text-muted-foreground">{r.label}</span><span className="font-medium text-foreground">{r.value}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {known.length > 0 && (
        <Section title="How I understood your system" count={known.length}>
          <ul className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            {known.map((r) => (
              <li key={r.label} className="flex justify-between gap-3 border-b border-border/60 py-1">
                <span className="text-muted-foreground">{r.label}</span><span className="text-right font-medium text-foreground">{r.value}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {a.caveats.length > 0 && (
        <Section title="Limits of this assessment" count={a.caveats.length}>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {a.caveats.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </Section>
      )}

      {a.suggestedNext.length > 0 && (
        <div className="border-t border-border px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">What next?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {a.suggestedNext.map((label) => (
              <button
                key={label}
                type="button"
                disabled={busy || !send}
                onClick={() => send?.(label)}
                className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-ring hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                {label}
                <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
        Decided by rules written from the Act, not by the language model. Not legal advice. Reviewed {a.engine.reviewedOn}.
      </p>
    </section>
  );
}

export function AssessmentSkeleton() {
  return (
    <div className="my-1 animate-pulse overflow-hidden rounded-2xl border border-border bg-card" role="status" aria-label="Running the rules engine">
      <div className="space-y-2 bg-secondary/60 px-4 py-3">
        <div className="h-2.5 w-32 rounded bg-border" />
        <div className="h-6 w-48 rounded-full bg-border" />
      </div>
      <div className="grid gap-px bg-border sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2 bg-card px-4 py-3">
            <div className="h-2.5 w-16 rounded bg-border" />
            <div className="h-4 w-24 rounded bg-border" />
          </div>
        ))}
      </div>
    </div>
  );
}
