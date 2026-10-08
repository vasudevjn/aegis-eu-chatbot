import type { Assessment, ObligationResult } from "@/lib/rules/assessment";
import { formatDate } from "@/lib/rules/dates";
import type { AppliesTone } from "@/lib/aegis-blocks";

/**
 * UI-free wording for an Assessment. The chat card (components/messages/assessment-view.tsx) and the
 * Markdown export (lib/rules/markdown.ts) both read from here, so they can never disagree.
 */

export function timingLabel(o: Pick<ObligationResult, "timing">): string {
  const t = o.timing;
  switch (t.status) {
    case "in_force": return t.from ? `In force since ${formatDate(t.from)}` : "In force";
    case "upcoming": return t.from ? `From ${formatDate(t.from)}` : "Upcoming";
    case "grandfathered": return "Transitional relief";
    case "not_applicable": return "Not applicable";
    default: return "Date unknown";
  }
}

export type TimingTone = "now" | "later" | "relief" | "neutral";
export function timingTone(o: Pick<ObligationResult, "timing">): TimingTone {
  return o.timing.status === "in_force" ? "now" : o.timing.status === "upcoming" ? "later" : o.timing.status === "grandfathered" ? "relief" : "neutral";
}

/** The "Applies" cell of the summary: what already binds, what is coming. */
export function appliesSummary(a: Assessment): { status: string; detail?: string; tone: AppliesTone } {
  const applying = a.obligations.filter((o) => o.status === "applies");
  const now = applying.filter((o) => o.timing.status === "in_force");
  const later = applying.filter((o) => o.timing.status === "upcoming" && o.timing.from).sort((x, y) => x.timing.from!.localeCompare(y.timing.from!));
  const relief = applying.filter((o) => o.timing.status === "grandfathered");
  if (!applying.length) return { status: "No duties yet", tone: "neutral" };
  const nextDate = later[0]?.timing.from;
  if (now.length && later.length) {
    return { status: "Partly now", detail: `${now.length} in force, ${later.length} from ${formatDate(nextDate!)}${relief.length ? `, ${relief.length} deferred (Art. 111)` : ""}`, tone: "mixed" };
  }
  const deferred = relief.length ? `, ${relief.length} deferred (Art. 111)` : "";
  if (now.length) return { status: "Already applies", detail: `${now.length} in force${deferred}`, tone: "now" };
  if (later.length) return { status: "Not yet", detail: `First duties from ${formatDate(nextDate!)}`, tone: "later" };
  return { status: "Transitional relief", detail: relief.length ? `${relief.length} duties deferred (Art. 111)` : undefined, tone: "neutral" };
}

export const GROUP_SEQUENCE: ObligationResult["group"][] = [
  "Prohibited practices", "Basics", "High-risk: provider", "High-risk: deployer",
  "High-risk: importers and distributors", "Transparency", "General-purpose AI models", "Value chain",
];

export function groupObligations(obligations: ObligationResult[]): Array<{ group: ObligationResult["group"]; items: ObligationResult[] }> {
  const by = new Map<string, ObligationResult[]>();
  for (const o of obligations) by.set(o.group, [...(by.get(o.group) ?? []), o]);
  return GROUP_SEQUENCE.filter((g) => by.has(g)).map((g) => ({ group: g, items: by.get(g)! }));
}

const FACT_LABELS: Record<string, string> = {
  isAiSystem: "Is an AI system",
  euNexus: "Has an EU connection",
  annex3UseCases: "Annex III use cases",
  annex1Legislation: "Regulated product (Annex I)",
  organisationSize: "Organisation size",
  placedOnMarketDate: "Placed on the market",
  modelPlacedOnMarketDate: "Model placed on the market",
  trainingComputeFlop: "Training compute (FLOP)",
  freeOpenSourceLicence: "Free and open-source licence",
};

function humanizeKey(key: string): string {
  if (FACT_LABELS[key]) return FACT_LABELS[key];
  const words = key.replace(/([A-Z])/g, " $1").toLowerCase().trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function humanizeValue(value: unknown): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  if (Array.isArray(value)) return value.length ? value.map((v) => String(v).replace(/^[0-9]+[a-z]?_/, "").replace(/_/g, " ")).join(", ") : "None";
  if (typeof value === "number") return value >= 1e6 ? value.toExponential(1).replace("e+", " x 10^") : String(value);
  return String(value).replace(/_/g, " ");
}

/** The facts the engine used, as label/value rows ("How I understood your system"). */
export function profileRows(a: Assessment): Array<{ label: string; value: string }> {
  return Object.entries(a.profile)
    .filter(([k, v]) => k !== "summary" && v !== undefined)
    .map(([k, v]) => ({ label: humanizeKey(k), value: humanizeValue(v) }));
}

export function assumptionRows(a: Assessment): Array<{ label: string; value: string; ask: string }> {
  return a.assumptions.map((x) => ({ label: humanizeKey(x.fact), value: humanizeValue(x.value), ask: x.ask }));
}

export const STATUS_LABEL = { in_place: "In place", partial: "Partly in place", missing: "Missing" } as const;

/** What a gap-check form sends back as the user's message; the model passes these as `controls`. */
export function gapAnswersMessage(answers: Record<string, "in_place" | "partial" | "missing">): string {
  const parts = Object.entries(answers).map(([id, s]) => `${id}=${s}`);
  return `Gap check answers: ${parts.join("; ")}`;
}
