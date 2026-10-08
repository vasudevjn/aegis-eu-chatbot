import { FACT_META, GROUP_ORDER, completeness, type FactKey, type Profile } from "@/lib/rules/facts";
import { runPipeline, relevantFacts, type PipelineResult } from "@/lib/rules/pipeline";
import { CONTROLS } from "@/lib/rules/pack/controls";
import { ANNEX1_SECTION_A_IDS, ANNEX1_SECTION_B_IDS } from "@/lib/rules/pack/catalogues";
import { formatDate } from "@/lib/rules/pack/timeline";
import type {
  ActionItem, Assessment, AssessmentDiff, ConfidenceLevel, ControlStatus, GapItem, GapQuestion,
  ObligationResult, Priority, QuestionItem,
} from "@/lib/rules/assessment";
import type { Finding } from "@/lib/rules/types";

/**
 * Everything that reasons ABOUT a result rather than producing it:
 *  - which unknown facts matter, and how sure the classification is (by re-running the pipeline with the
 *    unknown facts filled in every plausible way);
 *  - what-if comparison between two assessments;
 *  - the gap check and the prioritised action plan.
 */

type Fact = Exclude<FactKey, "summary">;

// ------------------------------------------------------------------ probing unknown facts

/** Representative values to try for an unknown fact. Facts with no entry are not probed. */
function domainOf(key: Fact): unknown[] | undefined {
  switch (key) {
    case "annex3UseCases": return [[], ["4a_recruitment"]];
    case "annex1Legislation": return ["none", ANNEX1_SECTION_A_IDS[0], ANNEX1_SECTION_B_IDS[0]];
    case "intimateImageryRisk":
    case "csamRisk": return ["none", "foreseeable_without_safeguards"];
    case "trainingComputeFlop": return [1e24, 1e26];
    case "placedOnMarketDate": return ["2024-01-01", "2029-01-01"];
    case "modelPlacedOnMarketDate": return ["2024-01-01", "2026-01-01"];
    case "organisationSize": return undefined; // lighter duties and fine caps only; never changes the classification
    default: return FACT_META[key]?.ask && typeof key === "string" ? [true, false] : undefined;
  }
}

const classSig = (r: PipelineResult) =>
  `${r.scopeStatus}|${r.tiers.filter((t) => t.status === "applies").map((t) => t.tier).sort().join(",")}`;
const dutySig = (r: PipelineResult) =>
  r.obligations.filter((o) => o.status === "applies").map((o) => o.id).sort().join(",");
const dateSig = (r: PipelineResult) =>
  r.obligations.filter((o) => o.status === "applies").map((o) => `${o.id}:${o.timing.status}:${o.timing.from ?? ""}`).sort().join(",");

interface FactImpact { fact: Fact; classification: number; duties: number; dates: number }

function probeFacts(effective: Profile, today: string): FactImpact[] {
  const out: FactImpact[] = [];
  for (const raw of relevantFacts()) {
    const fact = raw as Fact;
    if (!(fact in FACT_META)) continue;
    if ((effective as Record<string, unknown>)[fact] !== undefined) continue;
    const domain = domainOf(fact);
    if (!domain) continue;
    const classes = new Set<string>(), duties = new Set<string>(), dates = new Set<string>();
    for (const value of domain) {
      const r = runPipeline({ ...effective, [fact]: value } as Profile, today);
      classes.add(classSig(r)); duties.add(dutySig(r)); dates.add(dateSig(r));
    }
    const impact = { fact, classification: classes.size - 1, duties: duties.size - 1, dates: dates.size - 1 };
    if (impact.classification || impact.duties || impact.dates) out.push(impact);
  }
  return out;
}

const GROUP_RANK = new Map(GROUP_ORDER.map((g, i) => [g, i]));

/** Without these two nothing else matters, so they are asked first whenever they are unknown. */
const GATES = new Set<string>(["isAiSystem", "euNexus"]);

function rankImpacts(impacts: FactImpact[]): FactImpact[] {
  return [...impacts].sort((a, b) => {
    const gate = Number(GATES.has(b.fact)) - Number(GATES.has(a.fact));
    if (gate) return gate;
    if (b.classification !== a.classification) return b.classification - a.classification;
    if (b.duties !== a.duties) return b.duties - a.duties;
    if (b.dates !== a.dates) return b.dates - a.dates;
    const ga = GROUP_RANK.get(FACT_META[a.fact].group) ?? 99, gb = GROUP_RANK.get(FACT_META[b.fact].group) ?? 99;
    if (ga !== gb) return ga - gb;
    return Number(!!FACT_META[b.fact].core) - Number(!!FACT_META[a.fact].core);
  });
}

const LABELS: Partial<Record<Fact, string>> = {
  annex3UseCases: "what the system is used for (Annex III)",
  profilesPeople: "whether it profiles people",
  safetyComponentOrProduct: "whether it is a safety component of a regulated product",
  interactsDirectlyWithPeople: "whether it interacts directly with people",
  generatesSyntheticContent: "whether it generates content",
  developsOrCommissionsSystem: "whether you built it",
  usesSystemProfessionally: "whether you use it professionally",
  isAiSystem: "whether it is an AI system",
  euNexus: "whether it has an EU connection",
  trainingComputeFlop: "the model's training compute",
  placedOnMarketDate: "the launch date",
  providesGpaiModel: "whether you provide a general-purpose AI model",
};

function humanize(key: string): string {
  return LABELS[key as Fact] ?? key.replace(/([A-Z])/g, " $1").toLowerCase().trim();
}

function toQuestion(i: FactImpact): QuestionItem {
  const m = FACT_META[i.fact];
  const impact: QuestionItem["impact"] = i.classification ? "classification" : i.duties ? "duties" : "dates";
  const options =
    i.fact === "organisationSize" ? ["micro", "small", "medium", "small_midcap", "large"] : undefined;
  return { fact: i.fact, ask: m.ask, why: m.why, impact, options };
}

export function openQuestions(effective: Profile, today: string, limit = 5): QuestionItem[] {
  return rankImpacts(probeFacts(effective, today)).slice(0, limit).map(toQuestion);
}

// ------------------------------------------------------------------ confidence

function* combinations(domains: unknown[][]): Generator<unknown[]> {
  const idx = domains.map(() => 0);
  while (true) {
    yield idx.map((v, i) => domains[i][v]);
    let p = domains.length - 1;
    while (p >= 0) {
      idx[p]++;
      if (idx[p] < domains[p].length) break;
      idx[p] = 0;
      p--;
    }
    if (p < 0) return;
  }
}

export function confidenceOf(
  profile: Profile, effective: Profile, base: PipelineResult, today: string,
  impacts: FactImpact[]
): Assessment["confidence"] {
  const reasons: string[] = [];
  const classFacts = rankImpacts(impacts.filter((i) => i.classification > 0)).slice(0, 6);
  const flipFacts = classFacts.slice(0, 3).map((i) => humanize(i.fact));

  let level: ConfidenceLevel = "High";

  if (classFacts.length) {
    const domains = classFacts.map((i) => domainOf(i.fact) as unknown[]);
    const sigs = new Set<string>();
    for (const combo of combinations(domains)) {
      const overrides: Record<string, unknown> = {};
      classFacts.forEach((i, n) => (overrides[i.fact] = combo[n]));
      sigs.add(classSig(runPipeline({ ...effective, ...overrides } as Profile, today)));
    }
    level = sigs.size <= 1 ? "High" : sigs.size === 2 ? "Medium" : "Low";
    if (sigs.size > 1) reasons.push(`The classification depends on facts not yet known: ${flipFacts.join("; ")}.`);
  }

  // Judgement calls cap confidence at Medium.
  const judgement = base.findings.filter((f: Finding) => f.status === "yes" && f.judgement);
  if (judgement.length && level === "High") {
    level = "Medium";
    reasons.push(`A judgement call is involved: ${judgement[0].judgement}`);
  }
  if (base.ruleStatus.HR_EXCEPTION_6_3 === "yes" && level === "High") level = "Medium";

  // Very little to go on.
  const { known } = completeness(profile);
  if (known < 3 && base.scopeStatus !== "out_of_scope") {
    level = "Low";
    reasons.push("Very few facts about the system are known yet.");
  }

  if (!reasons.length) reasons.push("The facts known so far settle the classification.");
  return { level, reasons, flipFacts };
}

export function analyse(profile: Profile, effective: Profile, base: PipelineResult, today: string) {
  const impacts = base.scopeStatus === "out_of_scope" ? [] : probeFacts(effective, today);
  const confidence = base.scopeStatus === "out_of_scope"
    ? { level: "High" as ConfidenceLevel, reasons: ["The system falls outside the Act."], flipFacts: [] }
    : confidenceOf(profile, effective, base, today, impacts);
  const questions = rankImpacts(impacts).slice(0, 5).map(toQuestion);
  return { confidence, questions };
}

// ------------------------------------------------------------------ what-if

const TIMING_TEXT = (o: ObligationResult) =>
  o.timing.status === "grandfathered" ? "transitional relief" : o.timing.from ? `${o.timing.status === "in_force" ? "since" : "from"} ${formatDate(o.timing.from)}` : o.timing.status;

export function diffAssessments(before: Assessment, after: Assessment): AssessmentDiff {
  const tierSet = (a: Assessment) => new Set(a.tiers.filter((t) => t.status === "applies").map((t) => t.tier));
  const bt = tierSet(before), at = tierSet(after);
  const tiersAdded = [...at].filter((t) => !bt.has(t));
  const tiersRemoved = [...bt].filter((t) => !at.has(t));

  const ob = new Map(before.obligations.filter((o) => o.status === "applies").map((o) => [o.id, o]));
  const oa = new Map(after.obligations.filter((o) => o.status === "applies").map((o) => [o.id, o]));
  const obligationsAdded = [...oa.values()].filter((o) => !ob.has(o.id)).map((o) => ({ id: o.id, title: o.title }));
  const obligationsRemoved = [...ob.values()].filter((o) => !oa.has(o.id)).map((o) => ({ id: o.id, title: o.title }));
  const timingChanged = [...oa.values()]
    .filter((o) => ob.has(o.id) && TIMING_TEXT(ob.get(o.id)!) !== TIMING_TEXT(o))
    .map((o) => ({ id: o.id, title: o.title, before: TIMING_TEXT(ob.get(o.id)!), after: TIMING_TEXT(o) }));
  const rolesChanged = after.roles
    .map((r) => ({ role: r.role, before: before.roles.find((x) => x.role === r.role)?.status ?? "unknown", after: r.status }))
    .filter((r) => r.before !== r.after) as AssessmentDiff["rolesChanged"];

  const parts: string[] = [];
  if (tiersAdded.length) parts.push(`adds ${tiersAdded.join(" and ")}`);
  if (tiersRemoved.length) parts.push(`removes ${tiersRemoved.join(" and ")}`);
  if (obligationsAdded.length) parts.push(`${obligationsAdded.length} more duties`);
  if (obligationsRemoved.length) parts.push(`${obligationsRemoved.length} fewer duties`);
  if (timingChanged.length) parts.push(`${timingChanged.length} changed dates`);
  const headline = parts.length ? `This change ${parts.join(", ")}.` : "This change does not alter the classification, the duties or their dates.";

  return { tiersAdded, tiersRemoved, obligationsAdded, obligationsRemoved, timingChanged, rolesChanged, headline };
}

// ------------------------------------------------------------------ gap check and action plan

function monthsUntil(from: string, today: string): number {
  const [y1, m1, d1] = today.split("-").map(Number);
  const [y2, m2, d2] = from.split("-").map(Number);
  return (y2 - y1) * 12 + (m2 - m1) + (d2 - d1) / 30;
}

function priorityFor(status: ControlStatus, linked: ObligationResult[], today: string): { priority: Priority; why: string; from?: string; timingStatus: ObligationResult["timing"]["status"] } {
  const inForce = linked.filter((o) => o.timing.status === "in_force");
  const upcoming = linked.filter((o) => o.timing.status === "upcoming" && o.timing.from).sort((a, b) => a.timing.from!.localeCompare(b.timing.from!));
  const art5 = linked.some((o) => o.fine === "art5");
  const gap = status === "missing" ? "is missing" : "is only partly in place";

  if (inForce.length) {
    const from = inForce.map((o) => o.timing.from!).filter(Boolean).sort()[0];
    return {
      priority: status === "missing" ? "P0" : "P1",
      why: `The duty already applies${from ? ` (since ${formatDate(from)})` : ""} and the control ${gap}.`,
      from, timingStatus: "in_force",
    };
  }
  if (upcoming.length) {
    const from = upcoming[0].timing.from!;
    const months = monthsUntil(from, today);
    const priority: Priority =
      art5 && status === "missing" && months <= 3 ? "P0"
      : status === "missing" && (months <= 18 || art5) ? "P1"
      : "P2";
    return { priority, why: `The duty applies from ${formatDate(from)} (in about ${Math.max(1, Math.round(months))} months) and the control ${gap}.`, from, timingStatus: "upcoming" };
  }
  return { priority: "P2", why: `Transitional relief applies for now, but the control ${gap}; plan for it.`, timingStatus: linked[0]?.timing.status ?? "unknown" };
}

const PRIORITY_ORDER: Record<Priority, number> = { P0: 0, P1: 1, P2: 2 };

export function gapAnalysis(
  obligations: ObligationResult[],
  controls: Record<string, ControlStatus> | undefined,
  today: string
): { gapCheck: GapQuestion[]; gaps?: GapItem[]; actionPlan?: ActionItem[] } {
  const applicable = new Map(obligations.filter((o) => o.status === "applies").map((o) => [o.id, o]));
  const relevant = CONTROLS
    .map((c) => ({ control: c, linked: c.obligations.filter((id) => applicable.has(id)) }))
    .filter((x) => x.linked.length > 0);

  const answeredIds = new Set(Object.keys(controls ?? {}));
  const gapCheck: GapQuestion[] = relevant
    .filter((x) => !answeredIds.has(x.control.id))
    .map((x) => ({ controlId: x.control.id, question: x.control.question, good: x.control.good, obligations: x.linked }));

  if (!controls || answeredIds.size === 0) return { gapCheck };

  const gaps: GapItem[] = [];
  const actionPlan: ActionItem[] = [];
  for (const { control, linked } of relevant) {
    const status = controls[control.id];
    if (!status) continue;
    gaps.push({ controlId: control.id, question: control.question, status, obligations: linked });
    if (status === "in_place") continue;
    const linkedObligations = linked.map((id) => applicable.get(id)!);
    const p = priorityFor(status, linkedObligations, today);
    actionPlan.push({
      priority: p.priority, controlId: control.id, action: control.action, owner: control.owner,
      articles: [...new Set(linkedObligations.map((o) => o.cites[0]?.ref).filter(Boolean))] as string[],
      evidence: [...new Set(linkedObligations.map((o) => o.evidence))].slice(0, 2).join("; "),
      status, from: p.from, timingStatus: p.timingStatus, why: p.why,
    });
  }
  actionPlan.sort((a, b) =>
    PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || (a.from ?? "9999").localeCompare(b.from ?? "9999")
  );
  return { gapCheck, gaps, actionPlan };
}
