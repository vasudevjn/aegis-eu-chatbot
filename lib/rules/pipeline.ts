import {
  boolFromTri, evaluate, or, reads, triFromBool, unknownReads,
  type Context, type Tri, type Cond,
} from "@/lib/rules/logic";
import type { Profile } from "@/lib/rules/facts";
import type { Finding, Role, Rule, TierKey } from "@/lib/rules/types";
import type { ObligationResult, RoleResult, TierResult } from "@/lib/rules/assessment";
import {
  SCOPE_RULES, ROLE_RULES, PROHIBITED_RULES, HIGH_RISK_RULES, ROLE_SHIFT_RULES,
  TRANSPARENCY_RULES, GPAI_RULES, ALL_CLASSIFICATION_RULES,
} from "@/lib/rules/pack/rules";
import { DERIVED, type Derived } from "@/lib/rules/pack/derived";
import { OBLIGATIONS } from "@/lib/rules/pack/obligations";
import { resolveTiming } from "@/lib/rules/pack/timeline";

/**
 * The classification pipeline, run in the order the Act itself works:
 *   scope -> roles -> prohibited -> high-risk -> role shifts -> transparency -> GPAI -> obligations
 * It is a pure function of the (default-completed) profile and today's date.
 */

export interface PipelineResult {
  ctx: Context;
  /** Rules that fired ("yes") or might fire ("unknown", unless quiet). */
  findings: Finding[];
  /** Every rule's status, including those that did not fire. */
  ruleStatus: Record<string, Tri>;
  scopeStatus: "in_scope" | "out_of_scope" | "unclear";
  openSourceExempt: boolean;
  tiers: TierResult[];
  roles: RoleResult[];
  authorisedRepresentativeNeeded: Tri;
  obligations: ObligationResult[];
  /** Facts behind each derived flag, so an unknown flag can be traced to what is missing. */
  flagUnknowns: Record<string, string[]>;
}

const ROLE_LABELS: Record<Role, string> = {
  provider: "Provider",
  deployer: "Deployer",
  importer: "Importer",
  distributor: "Distributor",
  product_manufacturer: "Product manufacturer",
  gpai_provider: "General-purpose AI model provider",
};

const ROLE_FLAGS: Array<[Role, string]> = [
  ["provider", "d.provider"],
  ["deployer", "d.deployer"],
  ["importer", "d.importer"],
  ["distributor", "d.distributor"],
  ["product_manufacturer", "d.productManufacturer"],
  ["gpai_provider", "d.gpaiProviderRole"],
];

function flagsOf(rule: Rule): string[] {
  if (!rule.flag) return [];
  return typeof rule.flag === "string" ? [rule.flag] : [...rule.flag];
}

/** Every derived flag any rule feeds or the derived table defines. They start as false. */
const FLAG_KEYS: string[] = [
  ...new Set([...ALL_CLASSIFICATION_RULES.flatMap(flagsOf), ...DERIVED.map((d) => d.key)]),
];

/** Replaces derived keys in an "unknown" list by the real facts behind them. */
function expandUnknowns(cond: Cond, ctx: Context, flagUnknowns: Record<string, string[]>): string[] {
  const out = new Set<string>();
  for (const k of unknownReads(cond, ctx)) {
    if (k.startsWith("d.")) (flagUnknowns[k] ?? []).forEach((x) => out.add(x));
    else out.add(k);
  }
  return [...out];
}

/** Facts any rule, derived value or obligation reads: the only ones worth asking about. */
let RELEVANT: string[] | undefined;
export function relevantFacts(): string[] {
  if (RELEVANT) return RELEVANT;
  const keys = new Set<string>();
  for (const r of ALL_CLASSIFICATION_RULES) reads(r.when).forEach((k) => keys.add(k));
  for (const d of DERIVED) reads(d.when).forEach((k) => keys.add(k));
  for (const o of OBLIGATIONS) reads(o.when).forEach((k) => keys.add(k));
  // facts the timeline resolver reads
  ["placedOnMarketDate", "significantDesignChangeSinceLaunch", "usedByPublicAuthorities", "modelPlacedOnMarketDate"].forEach((k) => keys.add(k));
  RELEVANT = [...keys].filter((k) => !k.startsWith("d."));
  return RELEVANT;
}

export function runPipeline(effective: Profile, today: string): PipelineResult {
  const ctx: Context = { ...effective };
  for (const key of FLAG_KEYS) ctx[key] = false;

  const triByFlag: Record<string, Tri> = {};
  const flagUnknowns: Record<string, string[]> = {};
  const findings: Finding[] = [];
  const ruleStatus: Record<string, Tri> = {};

  const setFlag = (flag: string, contribution: Tri, unknown: string[]) => {
    triByFlag[flag] = or(triByFlag[flag] ?? "no", contribution);
    ctx[flag] = boolFromTri(triByFlag[flag]);
    if (unknown.length) flagUnknowns[flag] = [...new Set([...(flagUnknowns[flag] ?? []), ...unknown])];
  };

  const runRules = (rules: Rule[]) => {
    for (const rule of rules) {
      const status = evaluate(rule.when, ctx);
      const unknownFacts = status === "unknown" ? expandUnknowns(rule.when, ctx, flagUnknowns) : [];
      ruleStatus[rule.id] = status;

      if (status === "yes" || (status === "unknown" && !rule.quiet)) {
        findings.push({
          ruleId: rule.id, stage: rule.stage, title: rule.title, status, tier: rule.tier,
          explain: status === "yes" ? rule.explain : rule.explainPossible ?? rule.explain,
          cites: rule.cites, judgement: rule.judgement, unknownFacts, date: rule.date,
        });
      }
      for (const flag of flagsOf(rule)) {
        const contribution: Tri = rule.unknownAsNo && status === "unknown" ? "no" : status;
        setFlag(flag, contribution, unknownFacts);
      }
    }
  };

  const runDerived = (after: Derived["after"]) => {
    for (const d of DERIVED.filter((x) => x.after === after)) {
      const status = evaluate(d.when, ctx);
      triByFlag[d.key] = status;
      ctx[d.key] = boolFromTri(status);
      if (status === "unknown") flagUnknowns[d.key] = expandUnknowns(d.when, ctx, flagUnknowns);
    }
  };

  // 1. scope
  runRules(SCOPE_RULES);
  runDerived("scope");
  if (ctx["d.excluded"] === true) {
    return {
      ctx, findings, ruleStatus, scopeStatus: "out_of_scope", openSourceExempt: false,
      tiers: [], roles: [], authorisedRepresentativeNeeded: "no", obligations: [], flagUnknowns,
    };
  }

  // 2. roles, 3. prohibited practices, 4. high-risk, 5. role shifts (Article 25), 6. transparency, 7. GPAI
  runRules(ROLE_RULES);
  runDerived("roles");
  runRules(PROHIBITED_RULES);
  runRules(HIGH_RISK_RULES);
  runDerived("high_risk");
  runRules(ROLE_SHIFT_RULES);
  runDerived("role_shifts");
  runRules(TRANSPARENCY_RULES);
  runRules(GPAI_RULES);
  runDerived("gpai");

  // Article 2(12): free and open-source systems are outside the Act unless they are prohibited,
  // high-risk or subject to Article 50. Only applied when all three are known to be false.
  let openSourceExempt = false;
  if (
    effective.freeOpenSourceLicence === true &&
    ctx["d.prohibited"] === false && ctx["d.highRisk"] === false && ctx["d.transparency"] === false
  ) {
    openSourceExempt = true;
    findings.push({
      ruleId: "SCOPE_OPEN_SOURCE", stage: "scope", title: "Free and open-source licence", status: "yes",
      explain: "The system is released under a free and open-source licence and is not prohibited, high-risk or subject to Article 50, so the Act does not apply to it (Article 2(12)).",
      cites: [{ ref: "Art. 2(12)", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689#art_2", src: "act", page: "OJ 2024/1689 p.46" }],
      unknownFacts: [],
    });
    ruleStatus.SCOPE_OPEN_SOURCE = "yes";
  }

  // Scope result
  const inScope = ctx["d.inScope"];
  const scopeStatus: PipelineResult["scopeStatus"] = openSourceExempt
    ? "out_of_scope"
    : inScope === true ? "in_scope" : inScope === false ? "out_of_scope" : "unclear";

  // Tiers
  const tiers: TierResult[] = [];
  if (!openSourceExempt) {
    const order: TierKey[] = ["prohibited", "high-risk", "transparency", "gpai"];
    for (const tier of order) {
      const rules = ALL_CLASSIFICATION_RULES.filter((r) => r.tier === tier);
      const yes = rules.filter((r) => ruleStatus[r.id] === "yes");
      const unknown = rules.filter((r) => ruleStatus[r.id] === "unknown" && !r.quiet);
      if (yes.length) tiers.push({ tier, status: "applies", ruleIds: yes.map((r) => r.id) });
      else if (unknown.length) tiers.push({ tier, status: "possible", ruleIds: unknown.map((r) => r.id) });
    }
    if (tiers.length === 0 && scopeStatus === "in_scope") tiers.push({ tier: "minimal", status: "applies", ruleIds: [] });
  }

  // Roles
  const roles: RoleResult[] = ROLE_FLAGS.map(([role, flag]) => ({
    role, label: ROLE_LABELS[role], status: triFromBool(ctx[flag] as boolean | undefined),
  }));
  const authorisedRepresentativeNeeded = or(
    triFromBool(ctx["d.authRepSystem"] as boolean | undefined),
    triFromBool(ctx["d.authRepGpai"] as boolean | undefined)
  );

  // Obligations
  const obligations: ObligationResult[] = [];
  if (!openSourceExempt && scopeStatus !== "out_of_scope") {
    for (const o of OBLIGATIONS) {
      const status = evaluate(o.when, ctx);
      if (status === "no") continue;
      const dateKey = typeof o.date === "function" ? o.date(ctx) : o.date;
      obligations.push({
        id: o.id, title: o.title, what: o.what, owner: o.owner, evidence: o.evidence, group: o.group,
        roles: o.roles, cites: o.cites, status: status === "yes" ? "applies" : "possible",
        timing: resolveTiming(dateKey, ctx, today), fine: o.fine,
        unknownFacts: status === "unknown" ? expandUnknowns(o.when, ctx, flagUnknowns) : [],
      });
    }
  }

  return { ctx, findings, ruleStatus, scopeStatus, openSourceExempt, tiers, roles, authorisedRepresentativeNeeded, obligations, flagUnknowns };
}
