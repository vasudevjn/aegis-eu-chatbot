import type { Cond } from "@/lib/rules/logic";

/**
 * Values computed from rule results and profile facts. The engine evaluates them in order, at the
 * point named by `after`, so a rule or obligation can read them as ordinary context keys.
 */
export interface Derived {
  key: string;
  after: "scope" | "roles" | "high_risk" | "role_shifts" | "gpai";
  when: Cond;
}

const t = (k: string): Cond => ({ k, is: true });
const notT = (k: string): Cond => ({ not: t(k) });

export const DERIVED: Derived[] = [
  // The system is in scope when it is an AI system with an EU connection and no Article 2 exclusion applies.
  { key: "d.inScope", after: "scope", when: { all: [t("isAiSystem"), t("euNexus"), notT("d.excluded")] } },

  // Organisation size (Article 3(14a), 3(14b)).
  { key: "d.sme", after: "scope", when: { k: "organisationSize", is: ["micro", "small", "medium"] } },
  { key: "d.smc", after: "scope", when: { k: "organisationSize", is: "small_midcap" } },
  { key: "d.smeOrSmc", after: "scope", when: { k: "organisationSize", is: ["micro", "small", "medium", "small_midcap"] } },

  // High-risk results.
  { key: "d.highRisk", after: "high_risk", when: { any: [t("d.hrAnnex3"), t("d.hrAnnex1A"), t("d.hrAnnex1B")] } },
  // Chapter III applies directly to Annex III systems and Annex I Section A systems; for Section B only Article 6(1) etc. apply (Article 2(2)).
  { key: "d.chapter3", after: "high_risk", when: { any: [t("d.hrAnnex3"), t("d.hrAnnex1A")] } },
  // Annex III point 2 (critical infrastructure) is carved out of several obligations (registration, Articles 26(11), 27, 86).
  { key: "d.annex3Point2", after: "high_risk", when: { k: "annex3UseCases", includesAny: ["2_critical_infrastructure"] } },
  { key: "d.annex3NotPoint2", after: "high_risk", when: { all: [t("d.hrAnnex3"), { not: t("d.annex3Point2") }] } },
  // Article 27: fundamental rights impact assessment.
  {
    key: "d.fria", after: "high_risk",
    when: {
      all: [
        t("d.annex3NotPoint2"),
        { any: [t("isPublicBody"), t("privateEntityProvidingPublicServices"), { k: "annex3UseCases", includesAny: ["5b_credit_scoring", "5c_life_health_insurance"] }] },
      ],
    },
  },
  // Annex III systems that make or assist decisions about natural persons: Article 26(11) and Article 86.
  { key: "d.decisionsAboutPeople", after: "high_risk", when: { all: [t("d.annex3NotPoint2"), { any: [t("materiallyInfluencesDecisions"), t("profilesPeople"), { k: "annex3UseCases", includesAny: ["3a_education_admission", "3b_education_evaluation", "3c_education_level", "4a_recruitment", "4b_work_management", "5a_public_benefits", "5b_credit_scoring", "5c_life_health_insurance", "5d_emergency_triage", "7b_migration_risk", "7c_migration_applications"] }] }] },
  },

  // Authorised representatives for non-EU providers (Articles 22 and 54).
  { key: "d.authRepSystem", after: "role_shifts", when: { all: [t("d.provider"), { k: "providerEstablishedInEu", is: false }, t("d.chapter3")] } },
  { key: "d.authRepGpai", after: "gpai", when: { all: [t("d.gpai"), { k: "providerEstablishedInEu", is: false }, notT("d.gpaiOpenSourceExempt")] } },

];
