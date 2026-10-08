import { completeness, sanitizeProfile } from "@/lib/rules/facts";
import { applyDefaults } from "@/lib/rules/pack/defaults";
import { runPipeline } from "@/lib/rules/pipeline";
import { analyse, diffAssessments, gapAnalysis } from "@/lib/rules/analysis";
import { FINES, SME_FINE_NOTE } from "@/lib/rules/pack/penalties";
import { timelineOverview } from "@/lib/rules/pack/timeline";
import { REFERENCE_REVIEWED_ON } from "@/lib/ai-act/meta";
import {
  RULE_PACK_NAME, RULE_PACK_VERSION,
  type Assessment, type ControlStatus,
} from "@/lib/rules/assessment";

export interface AssessOptions {
  /** ISO date (YYYY-MM-DD). Defaults to today; tests pin it. */
  today?: string;
  /** Answers to the gap check, by control id. */
  controls?: Record<string, ControlStatus>;
  /** An earlier profile to compare against (a "what-if"). */
  compareWith?: unknown;
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * The rule engine's single entry point.
 *
 * Takes whatever profile the chat model extracted, completes it with the recorded defaults, runs the
 * pipeline, then adds confidence, open questions, fine exposure, caveats and (when asked) the gap
 * check, the action plan and a what-if comparison. Deterministic: the same profile and date always
 * give the same assessment.
 */
export function assess(input: unknown, opts: AssessOptions = {}): Assessment {
  const today = opts.today ?? isoToday();
  const profile = sanitizeProfile(input);
  const { effective, assumptions } = applyDefaults(profile);
  const base = runPipeline(effective, today);
  const { confidence, questions } = analyse(profile, effective, base, today);
  const { gapCheck, gaps, actionPlan } = gapAnalysis(base.obligations, opts.controls, today);

  // Highest fine that actually applies (not merely possible).
  const applying = base.obligations.filter((o) => o.status === "applies");
  const highest = applying.map((o) => FINES[o.fine]).sort((a, b) => b.rank - a.rank)[0];
  const smeNote = base.ctx["d.smeOrSmc"] === true ? SME_FINE_NOTE : undefined;

  const hasTier = (t: string) => base.tiers.some((x) => x.tier === t);
  const caveats: string[] = [];
  const judgement = new Set(base.findings.filter((f) => f.status === "yes" && f.judgement).map((f) => f.judgement!));
  judgement.forEach((j) => caveats.push(`Judgement call: ${j}`));
  if (assumptions.length > 0) {
    caveats.push(
      "Assumed unless you say otherwise: no Article 2 exclusion applies, no biometric processing, no prohibited practice, not a safety component of a regulated product, and not a general-purpose AI model provider."
    );
  }
  if (hasTier("high-risk")) {
    caveats.push("The Commission's guidelines with practical examples of high-risk and non-high-risk uses (Article 6(5)) are not part of this rule pack; check them for borderline cases.");
  }
  if (base.findings.some((f) => f.ruleId === "T50_2_MARKING")) {
    caveats.push("Codes of practice and any implementing rules on marking and labelling AI-generated content (Article 50(7)) may add detail to how Article 50(2) is met.");
  }
  if (base.scopeStatus !== "out_of_scope") {
    caveats.push("Data protection, product safety, consumer and sector law are separate from the AI Act and are not assessed here (Article 2(7), (9)).");
  }

  const hr = base.ctx;
  const highRisk = {
    route: hr["d.hrAnnex3"] === true ? ("annex_iii" as const)
      : hr["d.hrAnnex1A"] === true ? ("annex_i_section_a" as const)
      : hr["d.hrAnnex1B"] === true ? ("annex_i_section_b" as const)
      : undefined,
    exceptionRelied: hr["d.exceptionHolds"] === true,
    profilingOverride: hr["d.profilingOverride"] === true,
  };

  const controlsAnswered = !!opts.controls && Object.keys(opts.controls).length > 0;
  const suggestedNext: string[] = [];
  if (base.scopeStatus !== "out_of_scope") {
    if (questions.length) suggestedNext.push("Help me answer the open questions");
    if (!controlsAnswered && gapCheck.length) suggestedNext.push("Run the gap check");
    if (controlsAnswered) suggestedNext.push("Draft the evidence documents");
    suggestedNext.push("Try a what-if change");
  }

  const assessment: Assessment = {
    engine: { version: RULE_PACK_VERSION, rulePack: RULE_PACK_NAME, reviewedOn: REFERENCE_REVIEWED_ON, today },
    summary: profile.summary,
    scope: {
      status: base.scopeStatus,
      reasons: base.findings.filter((f) => f.stage === "scope"),
    },
    profile,
    assumptions,
    completeness: completeness(profile),
    roles: base.roles,
    authorisedRepresentativeNeeded: base.authorisedRepresentativeNeeded,
    tiers: base.tiers,
    highRisk,
    findings: base.findings,
    obligations: base.obligations,
    exposure: { highest: highest, smeNote },
    confidence,
    questions,
    caveats: caveats.slice(0, 8),
    timeline: timelineOverview(today),
    gapCheck: { questions: gapCheck },
    gaps,
    actionPlan,
    suggestedNext: suggestedNext.slice(0, 3),
  };

  if (opts.compareWith !== undefined) {
    const before = assess(opts.compareWith, { today });
    assessment.diff = diffAssessments(before, assessment);
  }
  return assessment;
}
