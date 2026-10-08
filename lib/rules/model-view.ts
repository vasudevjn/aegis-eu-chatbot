import type { Assessment, ObligationResult } from "@/lib/rules/assessment";
import { formatDate } from "@/lib/rules/dates";

/**
 * What the chat model reads after an assessment. The UI receives the full Assessment and renders the
 * cards itself, so the model only needs the verdict, the reasons and what to ask next. Keeping it short
 * also keeps old assessments cheap in a long conversation (AI SDK `toModelOutput`).
 */

const TIER_LABEL: Record<string, string> = {
  prohibited: "Prohibited practice",
  "high-risk": "High-risk",
  transparency: "Transparency duties (Art. 50)",
  gpai: "General-purpose AI model duties",
  minimal: "Minimal risk",
};

function timingText(o: ObligationResult): string {
  const t = o.timing;
  if (t.status === "in_force") return t.from ? `in force since ${formatDate(t.from)}` : "in force";
  if (t.status === "upcoming") return t.from ? `from ${formatDate(t.from)}` : "upcoming";
  if (t.status === "grandfathered") return "transitional relief (Art. 111)";
  return t.status.replace("_", " ");
}

export function assessmentForModel(a: Assessment): string {
  const L: string[] = [];
  L.push(`ENGINE RESULT (rule pack ${a.engine.version}, as of ${a.engine.today}). The user already sees the full assessment card. Do not repeat the lists below; add a short explanation and the next step.`);
  L.push(`Scope: ${a.scope.status}${a.scope.reasons.length ? ` (${a.scope.reasons.map((r) => r.title).join("; ")})` : ""}`);
  L.push(`Confidence: ${a.confidence.level}. ${a.confidence.reasons.join(" ")}`);
  L.push(`Facts known: ${a.completeness.known} of ${a.completeness.total}`);

  if (a.tiers.length) {
    L.push("Tiers: " + a.tiers.map((t) => `${TIER_LABEL[t.tier] ?? t.tier} (${t.status === "applies" ? "applies" : "possible, depends on unknown facts"})`).join("; "));
  }
  const roles = a.roles.filter((r) => r.status !== "no");
  if (roles.length) L.push("Roles: " + roles.map((r) => `${r.label} (${r.status})`).join("; "));
  if (a.authorisedRepresentativeNeeded !== "no") L.push(`Authorised representative in the EU needed: ${a.authorisedRepresentativeNeeded}`);
  if (a.highRisk.route) L.push(`High-risk route: ${a.highRisk.route}${a.highRisk.exceptionRelied ? " (Art. 6(3) exception relied on)" : ""}${a.highRisk.profilingOverride ? " (profiling: exception unavailable)" : ""}`);

  const why = a.findings.filter((f) => f.status === "yes" && f.stage !== "roles");
  if (why.length) {
    L.push("Why:");
    for (const f of why.slice(0, 8)) L.push(`- ${f.title}: ${f.explain} [${f.cites.map((c) => `${c.ref} ${c.url}`).join(", ")}]`);
  }

  const applying = a.obligations.filter((o) => o.status === "applies");
  const possible = a.obligations.filter((o) => o.status === "possible");
  if (applying.length) {
    L.push(`Duties that apply (${applying.length}): ` + applying.map((o) => `${o.title} [${timingText(o)}]`).join("; "));
  }
  if (possible.length) L.push(`Duties that might apply (${possible.length}): ` + possible.map((o) => o.title).join("; "));
  if (a.exposure.highest) L.push(`Highest fine exposure: ${a.exposure.highest.max} (${a.exposure.highest.cites.map((c) => c.ref).join(", ")}).${a.exposure.smeNote ? ` ${a.exposure.smeNote}` : ""}`);

  if (a.assumptions.length) L.push(`Assumed unless told otherwise (${a.assumptions.length}): ` + a.assumptions.map((x) => x.fact).join(", "));
  if (a.questions.length) {
    L.push("Open questions, most useful first:");
    for (const q of a.questions) L.push(`- ${q.fact}: ${q.ask} (changes ${q.impact})`);
  }
  if (a.diff) L.push(`What-if: ${a.diff.headline}`);
  if (a.actionPlan) {
    L.push(a.actionPlan.length
      ? "Action plan: " + a.actionPlan.map((x) => `${x.priority} ${x.action} (${x.owner})`).join("; ")
      : "Action plan: no gaps found in the controls the user answered.");
  } else if (a.gapCheck.questions.length) {
    L.push(`Gap check available: ${a.gapCheck.questions.length} control questions are ready; the user can run it from the card.`);
  }
  if (a.caveats.length) L.push("Caveats: " + a.caveats.join(" "));
  L.push("Suggested next steps: " + (a.suggestedNext.join("; ") || "none"));
  return L.join("\n");
}
