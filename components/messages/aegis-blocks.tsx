"use client";

import { createContext, useContext, type ComponentProps, type ReactNode } from "react";
import type { CustomRenderer, CustomRendererProps } from "streamdown";
import { ArrowRight } from "lucide-react";
import {
  STREAMING_MARK,
  TIERS,
  parseSummary,
  parseNext,
  type AppliesTone,
  type ConfidenceLevel,
  type TierKey,
} from "@/lib/aegis-blocks";
import { cn } from "@/lib/utils";

/** Lets rich blocks (the next-step buttons) send a chat message. Provided by the chat page. */
export const ChatActionsContext = createContext<{ send?: (text: string) => void; busy: boolean }>({
  busy: false,
});

const TIER_STYLE: Record<TierKey, { pill: string; dot: string }> = {
  prohibited: { pill: "border-red-200 bg-red-50 text-red-800", dot: "bg-red-500" },
  "high-risk": { pill: "border-orange-200 bg-orange-50 text-orange-800", dot: "bg-orange-500" },
  transparency: { pill: "border-amber-200 bg-amber-50 text-amber-900", dot: "bg-amber-500" },
  gpai: { pill: "border-sky-200 bg-sky-50 text-sky-800", dot: "bg-sky-500" },
  minimal: { pill: "border-emerald-200 bg-emerald-50 text-emerald-800", dot: "bg-emerald-500" },
};

const APPLIES_STYLE: Record<AppliesTone, string> = {
  now: "border-emerald-200 bg-emerald-50 text-emerald-800",
  later: "border-amber-200 bg-amber-50 text-amber-900",
  mixed: "border-indigo-200 bg-indigo-50 text-indigo-800",
  neutral: "border-border bg-muted text-muted-foreground",
};

const CONFIDENCE_BARS: Record<ConfidenceLevel, number> = { High: 3, Medium: 2, Low: 1 };

function Label({ children }: { children: ReactNode }) {
  return (
    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </dt>
  );
}

function Cell({ children }: { children: ReactNode }) {
  return <div className="flex min-w-0 flex-col gap-1.5 bg-card px-4 py-3">{children}</div>;
}

function SummarySkeleton() {
  return (
    <div
      className="my-3 animate-pulse overflow-hidden rounded-2xl border border-border bg-card"
      role="status"
      aria-label="Preparing the assessment summary"
    >
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

/** The assessment card: tier badges on top, then role / confidence / when it applies. */
export function SummaryCard({ code, isIncomplete }: CustomRendererProps) {
  if (isIncomplete || code.includes(STREAMING_MARK)) return <SummarySkeleton />;
  const d = parseSummary(code);
  const hasAnything = d.tiers.length > 0 || d.role || d.confidence || d.applies;

  // Unreadable block: show it as quiet text rather than hiding what the model said.
  if (!hasAnything) {
    return <p className="my-3 whitespace-pre-wrap text-sm text-muted-foreground">{code}</p>;
  }

  return (
    <section
      aria-label="Assessment summary"
      className="my-3 overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      {d.tiers.length > 0 && (
        <div className="border-b border-border bg-secondary/60 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Likely classification
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {d.tiers.map((t) => (
              <li
                key={t}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold",
                  TIER_STYLE[t].pill
                )}
              >
                <span className={cn("size-2 rounded-full", TIER_STYLE[t].dot)} aria-hidden="true" />
                {TIERS[t].label}
              </li>
            ))}
          </ul>
        </div>
      )}

      <dl className="grid gap-px bg-border sm:grid-cols-3">
        {d.role && (
          <Cell>
            <Label>Your likely role</Label>
            <dd className="text-sm font-semibold text-foreground">{d.role}</dd>
          </Cell>
        )}

        {d.confidence && (
          <Cell>
            <Label>Confidence</Label>
            <dd className="flex flex-col gap-1.5">
              {d.confidence.level && (
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className="flex gap-1" aria-hidden="true">
                    {[1, 2, 3].map((n) => (
                      <span
                        key={n}
                        className={cn(
                          "h-1.5 w-5 rounded-full",
                          n <= CONFIDENCE_BARS[d.confidence!.level!] ? "bg-ring" : "bg-border"
                        )}
                      />
                    ))}
                  </span>
                  {d.confidence.level}
                </span>
              )}
              {d.confidence.note && (
                <span className="text-xs leading-snug text-muted-foreground">
                  Would change if: {d.confidence.note}
                </span>
              )}
            </dd>
          </Cell>
        )}

        {d.applies && (
          <Cell>
            <Label>Applies</Label>
            <dd className="flex flex-col items-start gap-1.5">
              <span
                className={cn(
                  "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                  APPLIES_STYLE[d.applies.tone]
                )}
              >
                {d.applies.status}
              </span>
              {d.applies.detail && (
                <span className="text-xs leading-snug text-muted-foreground">{d.applies.detail}</span>
              )}
            </dd>
          </Cell>
        )}
      </dl>
    </section>
  );
}

/** Clickable next steps. Each label is sent as the user's next message. */
export function NextSteps({ code, isIncomplete }: CustomRendererProps) {
  const { send, busy } = useContext(ChatActionsContext);
  if (isIncomplete || code.includes(STREAMING_MARK)) return null;
  const labels = parseNext(code);
  if (labels.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        What next?
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {labels.map((label) => (
          <button
            key={label}
            type="button"
            disabled={busy || !send}
            onClick={() => send?.(label)}
            className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-ring hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {label}
            <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>
    </div>
  );
}

export const aegisRenderers: CustomRenderer[] = [
  { language: "aegis-summary", component: SummaryCard },
  { language: "aegis-next", component: NextSteps },
];

const PRIORITY_STYLE: Record<string, string> = {
  "0": "border-red-200 bg-red-50 text-red-800",
  "1": "border-amber-200 bg-amber-50 text-amber-900",
  "2": "border-sky-200 bg-sky-50 text-sky-800",
};

function textOf(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  return "";
}

/**
 * Table cell that turns a priority such as "P0", "P1" or "P2 - ongoing" into a coloured badge
 * (used by the action plan). Any other cell renders exactly like Streamdown's default.
 */
export function TableCell({ children, className, node: _node, ...rest }: ComponentProps<"td"> & { node?: unknown }) {
  void _node;
  const text = textOf(children).trim();
  const m = text.match(/^P([0-2])\b\s*[-–—:]?\s*(.*)$/);
  return (
    <td className={cn("px-4 py-2 text-sm", className)} data-streamdown="table-cell" {...rest}>
      {m ? (
        <span className="inline-flex items-center gap-2">
          <span
            className={cn(
              "inline-flex rounded-full border px-2 py-0.5 text-xs font-bold",
              PRIORITY_STYLE[m[1]]
            )}
          >
            P{m[1]}
          </span>
          {m[2] && <span>{m[2]}</span>}
        </span>
      ) : (
        children
      )}
    </td>
  );
}
