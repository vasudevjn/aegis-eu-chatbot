import type { Profile } from "@/lib/rules/facts";
import type { Assumption } from "@/lib/rules/pack/defaults";
import type { Cite, FineTier, Finding, Obligation, Role, TierKey, Timing, Tri } from "@/lib/rules/types";
import type { FineInfo } from "@/lib/rules/pack/penalties";

/**
 * The engine's output. Plain JSON, so it travels from the server tool to the chat UI and into the
 * Markdown export unchanged. Imports are type-only so client code can use it without the rule pack.
 */

export const RULE_PACK_VERSION = "2026.10.08";
export const RULE_PACK_NAME = "EU AI Act (Regulation (EU) 2024/1689) as amended by the Digital Omnibus (Regulation (EU) 2026/1744)";

export type ControlStatus = "in_place" | "partial" | "missing";
export type Priority = "P0" | "P1" | "P2";
export type ConfidenceLevel = "High" | "Medium" | "Low";

export interface TierResult {
  tier: TierKey;
  /** "applies": established by the facts. "possible": depends on facts not yet known. */
  status: "applies" | "possible";
  ruleIds: string[];
}

export interface RoleResult {
  role: Role;
  label: string;
  status: Tri;
}

export interface ObligationResult {
  id: string;
  title: string;
  what: string;
  owner: Obligation["owner"];
  evidence: string;
  group: Obligation["group"];
  roles: Role[];
  cites: Cite[];
  status: "applies" | "possible";
  timing: Timing;
  fine: FineTier;
  /** Facts that would settle a "possible" duty. */
  unknownFacts: string[];
}

export interface QuestionItem {
  fact: string;
  ask: string;
  why: string;
  /** What the answer could change. */
  impact: "classification" | "duties" | "dates";
  /** Allowed answers when the fact is not a plain yes/no. */
  options?: string[];
}

export interface GapQuestion {
  controlId: string;
  question: string;
  good: string;
  obligations: string[];
}

export interface GapItem {
  controlId: string;
  question: string;
  status: ControlStatus;
  obligations: string[];
}

export interface ActionItem {
  priority: Priority;
  controlId: string;
  action: string;
  owner: Obligation["owner"];
  /** Articles the action satisfies. */
  articles: string[];
  evidence: string;
  status: ControlStatus;
  /** When the linked obligation(s) start to apply, if known. */
  from?: string;
  timingStatus: Timing["status"];
  why: string;
}

export interface AssessmentDiff {
  tiersAdded: TierKey[];
  tiersRemoved: TierKey[];
  obligationsAdded: Array<{ id: string; title: string }>;
  obligationsRemoved: Array<{ id: string; title: string }>;
  timingChanged: Array<{ id: string; title: string; before: string; after: string }>;
  rolesChanged: Array<{ role: Role; before: Tri; after: Tri }>;
  /** One line a person can read. */
  headline: string;
}

export interface Assessment {
  engine: { version: string; rulePack: string; reviewedOn: string; today: string };
  summary?: string;
  scope: { status: "in_scope" | "out_of_scope" | "unclear"; reasons: Finding[] };
  profile: Profile;
  assumptions: Assumption[];
  completeness: { known: number; total: number };
  roles: RoleResult[];
  authorisedRepresentativeNeeded: Tri;
  tiers: TierResult[];
  highRisk: { route?: "annex_iii" | "annex_i_section_a" | "annex_i_section_b"; exceptionRelied: boolean; profilingOverride: boolean };
  findings: Finding[];
  obligations: ObligationResult[];
  exposure: { highest?: FineInfo; smeNote?: string };
  confidence: { level: ConfidenceLevel; reasons: string[]; flipFacts: string[] };
  questions: QuestionItem[];
  caveats: string[];
  timeline: Array<{ key: string; label: string; from: string; original: string | null; status: "in_force" | "upcoming"; note?: string }>;
  gapCheck: { questions: GapQuestion[] };
  gaps?: GapItem[];
  actionPlan?: ActionItem[];
  diff?: AssessmentDiff;
  suggestedNext: string[];
}
