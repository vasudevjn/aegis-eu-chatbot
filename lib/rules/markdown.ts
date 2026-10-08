import type { Assessment } from "@/lib/rules/assessment";
import { TIERS } from "@/lib/aegis-blocks";
import {
  STATUS_LABEL, appliesSummary, assumptionRows, groupObligations, profileRows, timingLabel,
} from "@/lib/rules/present";
import type { Cite } from "@/lib/rules/types";

/**
 * The assessment as a document someone can file or send: classification, duties with dates and owners,
 * the reasoning with article links, the action plan, and what was assumed. Same wording as the chat
 * card (both read lib/rules/present.ts).
 */

const cites = (list: Cite[]) =>
  list.map((c) => `[${c.src === "omnibus" ? "Omnibus " : ""}${c.ref}](${c.url})`).join(", ");
const cell = (s: string) => s.replace(/\|/g, "/").replace(/\r?\n/g, " ");

export function assessmentToMarkdown(a: Assessment): string {
  const out: string[] = [];
  out.push(`## Assessment${a.summary ? `: ${a.summary}` : ""}`);
  out.push(`*Rules engine ${a.engine.version} (${a.engine.rulePack}). Assessed as of ${a.engine.today}; legal reference reviewed ${a.engine.reviewedOn}.*`);

  if (a.scope.status === "out_of_scope") {
    out.push("**Outside the Act.** " + a.scope.reasons.map((r) => `${r.explain} (${cites(r.cites)})`).join(" "));
  } else {
    const tiers = a.tiers.map((t) => `${TIERS[t.tier].emoji} ${TIERS[t.tier].label}${t.status === "possible" ? " (possible)" : ""}`).join(", ") || "Not enough information to classify yet";
    const roles = a.roles.filter((r) => r.status !== "no").map((r) => (r.status === "unknown" ? `${r.label}?` : r.label)).join(", ") || "Not determined yet";
    const applies = appliesSummary(a);
    out.push([
      `- **Classification:** ${tiers}`,
      `- **Roles:** ${roles}${a.authorisedRepresentativeNeeded === "yes" ? " (an authorised representative in the EU is needed)" : ""}`,
      `- **Confidence:** ${a.confidence.level}${a.confidence.flipFacts.length ? `. Would change with: ${a.confidence.flipFacts.join("; ")}` : ""}`,
      `- **Applies:** ${applies.status}${applies.detail ? ` (${applies.detail})` : ""}`,
      ...(a.exposure.highest ? [`- **Highest fine exposure:** ${a.exposure.highest.max} (${cites(a.exposure.highest.cites)})${a.exposure.smeNote ? `. ${a.exposure.smeNote}` : ""}`] : []),
    ].join("\n"));
  }

  if (a.diff) out.push(`**What changed:** ${a.diff.headline}`);

  const why = a.findings.filter((f) => f.status === "yes" && f.stage !== "roles");
  if (why.length) {
    out.push("### Why\n\n" + why.map((f) => `- **${f.title}.** ${f.explain} (${cites(f.cites)})${f.judgement ? ` *Judgement call: ${f.judgement}*` : ""}`).join("\n"));
  }

  const applying = a.obligations.filter((o) => o.status === "applies");
  if (applying.length) {
    const blocks = groupObligations(applying).map(({ group, items }) =>
      `**${group}**\n\n| Duty | When | Owner | Evidence | Law |\n|---|---|---|---|---|\n` +
      items.map((o) => `| ${cell(o.title)}: ${cell(o.what)} | ${timingLabel(o)} | ${o.owner} | ${cell(o.evidence)} | ${cites(o.cites)} |`).join("\n")
    );
    out.push("### Duties\n\n" + blocks.join("\n\n"));
  }
  const possible = a.obligations.filter((o) => o.status === "possible");
  if (possible.length) out.push("### Might apply\n\n" + possible.map((o) => `- ${o.title} (${timingLabel(o)})`).join("\n"));

  if (a.actionPlan) {
    out.push("### Action plan\n\n" + (a.actionPlan.length
      ? "| Priority | Action | Owner | Law | Why |\n|---|---|---|---|---|\n" + a.actionPlan.map((x) => `| ${x.priority} | ${cell(x.action)} | ${x.owner} | ${cell(x.articles.join(", "))} | ${cell(x.why)} |`).join("\n")
      : "No gaps found among the controls answered."));
  } else if (a.gaps?.length) {
    out.push("### Gap check\n\n" + a.gaps.map((g) => `- ${g.question}: ${STATUS_LABEL[g.status]}`).join("\n"));
  }

  if (a.questions.length) out.push("### Open questions\n\n" + a.questions.map((q) => `- ${q.ask} *(${q.why})*`).join("\n"));

  const assumed = assumptionRows(a);
  if (assumed.length) out.push("### Assumed unless corrected\n\n" + assumed.map((r) => `- ${r.label}: ${r.value}`).join("\n"));
  const known = profileRows(a);
  if (known.length) out.push("### Facts used\n\n" + known.map((r) => `- ${r.label}: ${r.value}`).join("\n"));
  if (a.caveats.length) out.push("### Limits\n\n" + a.caveats.map((c) => `- ${c}`).join("\n"));
  return out.join("\n\n");
}
