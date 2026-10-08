import type { Cond, Context, Tri } from "@/lib/rules/logic";
import type { TierKey } from "@/lib/aegis-blocks";

export type { TierKey, Tri };

/** A pointer into the law: shown to the user as a link and kept for the maintainers as a page reference. */
export interface Cite {
  /** Human label, e.g. "Art. 6(3)". */
  ref: string;
  url: string;
  /** Which text it comes from: the AI Act as adopted, or the Digital Omnibus amending it. */
  src: "act" | "omnibus";
  /** Page of the Official Journal PDF the provision was read from, e.g. "OJ 2024/1689 p.54". */
  page?: string;
}

export type Role =
  | "provider"
  | "deployer"
  | "importer"
  | "distributor"
  | "product_manufacturer"
  | "gpai_provider";

export type Stage = "scope" | "roles" | "prohibited" | "high_risk" | "transparency" | "gpai";

/**
 * Keys into the timeline table (pack/timeline.ts). Each names one application date, so
 * the engine never hard-codes a date next to a rule.
 */
export type DateKey =
  | "ch1_2" // Chapters I and II: Articles 1-5 (AI literacy, prohibited practices)
  | "art5_new" // Article 5(1)(ba),(bb), (1a), (1b): added by the Omnibus
  | "gpai" // Chapter V: general-purpose AI models (Articles 51-56)
  | "penalties" // Chapter XII penalties (except Article 101)
  | "art50" // Chapter IV: transparency obligations
  | "art50_2_legacy" // Article 111(4): Article 50(2) for generative systems already on the market
  | "gpai_fines" // Article 101: Commission fines on GPAI providers
  | "hr_annex3" // Chapter III Sections 1-3 for Article 6(2) / Annex III systems
  | "hr_annex1"; // Chapter III Sections 1-3 for Article 6(1) / Annex I systems

/** A classification rule. Conditions are data so the engine can explain and probe them. */
export interface Rule {
  id: string;
  stage: Stage;
  title: string;
  when: Cond;
  /** Tier this rule contributes to when it fires. */
  tier?: TierKey;
  /** Derived key(s) this rule feeds ("d.…"); all rules with the same flag are OR-ed together. */
  flag?: string | readonly string[];
  /**
   * The rule's flag only counts as true when the rule is established (yes). While its facts are
   * unknown the flag is false, but the unknown facts are still reported as open questions. Used
   * for exceptions, which must be affirmatively established (e.g. Article 6(3)).
   */
  unknownAsNo?: boolean;
  /** Do not report this rule when it is merely "possible" (unknown). Used for screening rules that would otherwise add noise. */
  quiet?: boolean;
  /** Plain-language reason shown when the rule fires. */
  explain: string;
  /** Wording when the rule *might* fire because a fact is unknown. */
  explainPossible?: string;
  cites: Cite[];
  /** Set when the legal test calls for human judgement; such rules cap confidence at Medium. */
  judgement?: string;
  /** When the rule bites, for the timeline. */
  date?: DateKey;
}

/** The result of one rule being evaluated. */
export interface Finding {
  ruleId: string;
  stage: Stage;
  title: string;
  status: Tri;
  tier?: TierKey;
  explain: string;
  cites: Cite[];
  judgement?: string;
  /** Unknown facts this finding depends on. */
  unknownFacts: string[];
  date?: DateKey;
}

export type FineTier = "art5" | "art99_4" | "art99_5" | "gpai" | "member_state";

export type TimingStatus =
  | "in_force" // applies today
  | "upcoming" // applies from a future date
  | "grandfathered" // Article 111(2): only after significant design changes (or by 2 Aug 2030 for public authorities)
  | "not_applicable"
  | "unknown";

export interface Timing {
  status: TimingStatus;
  /** ISO date the obligation starts to apply, when known. */
  from?: string;
  /** Short plain-language note, including any transitional rule or amendment applied. */
  note: string;
}

export interface Obligation {
  id: string;
  title: string;
  /** What to do, in practical terms. */
  what: string;
  owner: "Product" | "Engineering" | "Data" | "Legal / Compliance" | "Security" | "HR" | "Leadership";
  /** The artefact that proves it. */
  evidence: string;
  cites: Cite[];
  /** Who it falls on. */
  roles: Role[];
  when: Cond;
  /** The timeline entry that governs it; a function when it depends on the route (Annex III or Annex I). */
  date: DateKey | ((ctx: Context) => DateKey);
  fine: FineTier;
  /** Group for display. */
  group: "Basics" | "Prohibited practices" | "High-risk: provider" | "High-risk: deployer" | "High-risk: importers and distributors" | "Transparency" | "General-purpose AI models" | "Value chain";
}

export interface Control {
  id: string;
  question: string;
  /** What good looks like, one line. */
  good: string;
  /** Action to take when the control is missing or partial. */
  action: string;
  /** Obligations this control evidences. */
  obligations: string[];
  owner: Obligation["owner"];
}
