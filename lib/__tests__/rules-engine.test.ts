import { describe, it, expect } from "vitest";
import { assess } from "@/lib/rules/engine";
import type { Assessment } from "@/lib/rules/assessment";

/**
 * Golden cases for the rule engine. Each case is a described system and the outcome the Act (as
 * amended by Regulation (EU) 2026/1744) dictates. "Today" is pinned so dates are stable.
 */
const TODAY = "2026-10-08";
const BASE = { isAiSystem: true, euNexus: true };

const A = (profile: object, opts: Parameters<typeof assess>[1] = {}) =>
  assess({ ...BASE, ...profile }, { today: TODAY, ...opts });
const tiers = (a: Assessment) => Object.fromEntries(a.tiers.map((t) => [t.tier, t.status]));
const duties = (a: Assessment) => a.obligations.filter((o) => o.status === "applies").map((o) => o.id);
const duty = (a: Assessment, id: string) => a.obligations.find((o) => o.id === id);

// ---------------------------------------------------------------- the customer-service chatbot
const CHATBOT = {
  summary: "Customer-service chatbot on a third-party LLM",
  developsOrCommissionsSystem: true, usesSystemProfessionally: true, buildsOnThirdPartyModel: true,
  annex3UseCases: [], interactsDirectlyWithPeople: true, generatesSyntheticContent: true,
  placedOnMarketDate: "2026-09-01", organisationSize: "small",
};

describe("customer-service chatbot built on a third-party LLM", () => {
  const a = A(CHATBOT);

  it("is a transparency case only, not high-risk, with High confidence", () => {
    expect(tiers(a)).toEqual({ transparency: "applies" });
    expect(a.confidence.level).toBe("High");
    expect(a.roles.filter((r) => r.status === "yes").map((r) => r.role)).toEqual(["provider", "deployer"]);
  });

  it("applies Article 50(1) disclosure, Article 50(2) marking and AI literacy, all already in force", () => {
    expect(duties(a)).toEqual(expect.arrayContaining(["O_AI_LITERACY", "O_T50_1_DISCLOSE_AI", "O_T50_2_MARK_CONTENT"]));
    expect(duty(a, "O_T50_1_DISCLOSE_AI")?.timing).toMatchObject({ status: "in_force", from: "2026-08-02" });
    expect(duty(a, "O_AI_LITERACY")?.timing).toMatchObject({ status: "in_force", from: "2025-02-02" });
    expect(duties(a).some((id) => id.startsWith("O_HR_") || id.startsWith("O_DEP_"))).toBe(false);
  });

  it("is a provider of the system, not of the underlying model", () => {
    expect(a.roles.find((r) => r.role === "gpai_provider")?.status).toBe("no");
    expect(a.tiers.some((t) => t.tier === "gpai")).toBe(false);
  });

  it("gives the Article 50(2) grace period to a system launched before 2 August 2026", () => {
    const early = A({ ...CHATBOT, placedOnMarketDate: "2026-03-01" });
    expect(duty(early, "O_T50_2_MARK_CONTENT")?.timing).toMatchObject({ status: "upcoming", from: "2026-12-02" });
    expect(duty(early, "O_T50_1_DISCLOSE_AI")?.timing.status).toBe("in_force"); // the grace period covers Article 50(2) only
  });

  it("shows Article 50 as upcoming when asked before it applies", () => {
    const before = A(CHATBOT, { today: "2026-05-01" });
    expect(duty(before, "O_T50_1_DISCLOSE_AI")?.timing).toMatchObject({ status: "upcoming", from: "2026-08-02" });
  });

  it("caps fines at the lower amount for an SME, and says so", () => {
    expect(a.exposure.highest?.tier).toBe("art99_4");
    expect(a.exposure.smeNote).toMatch(/lower/);
    expect(A({ ...CHATBOT, organisationSize: "large" }).exposure.smeNote).toBeUndefined();
  });

  it("what-if: adding biometric emotion recognition of customers makes it high-risk as well", () => {
    const w = A({ ...CHATBOT, emotionRecognitionBiometric: true }, { compareWith: { ...BASE, ...CHATBOT } });
    expect(tiers(w)).toMatchObject({ "high-risk": "applies", transparency: "applies" });
    expect(w.diff?.tiersAdded).toContain("high-risk");
    expect(w.diff?.obligationsAdded.length).toBeGreaterThan(5);
    expect(w.diff?.headline).toMatch(/adds high-risk/);
  });

  it("what-if: reading the sentiment of text is not biometric emotion recognition", () => {
    const w = A({ ...CHATBOT, emotionRecognitionBiometric: false }, { compareWith: { ...BASE, ...CHATBOT } });
    expect(w.diff?.headline).toMatch(/does not alter/);
  });
});

// ---------------------------------------------------------------- high-risk through Annex III
describe("high-risk: Annex III use cases", () => {
  const HIRING = {
    summary: "CV screening and candidate ranking", developsOrCommissionsSystem: true,
    annex3UseCases: ["4a_recruitment"], profilesPeople: true, placedOnMarketDate: "2028-01-01",
  };

  it("classifies a CV-ranking tool as high-risk and dates its provider duties from 2 December 2027", () => {
    const a = A(HIRING);
    expect(tiers(a)["high-risk"]).toBe("applies");
    expect(a.highRisk.route).toBe("annex_iii");
    expect(duty(a, "O_HR_RISK_MANAGEMENT")?.timing).toMatchObject({ status: "upcoming", from: "2027-12-02" });
    expect(duties(a)).toEqual(expect.arrayContaining(["O_HR_TECHNICAL_DOCUMENTATION", "O_HR_CONFORMITY_ASSESSMENT", "O_HR_REGISTRATION", "O_HR_POST_MARKET_MONITORING"]));
    expect(duties(a)).not.toContain("O_EXC_DOCUMENT");
    expect(a.exposure.highest?.tier).toBe("art99_4");
  });

  it("gives a deployer employer its own duties: workers, affected persons, explanation, but no FRIA", () => {
    const a = A({ usesSystemProfessionally: true, developsOrCommissionsSystem: false, annex3UseCases: ["4a_recruitment"], profilesPeople: true, isEmployerUsingAtWorkplace: true });
    expect(duties(a)).toEqual(expect.arrayContaining(["O_DEP_INFORM_WORKERS", "O_DEP_INFORM_AFFECTED_PERSONS", "O_DEP_EXPLANATION", "O_DEP_HUMAN_OVERSIGHT"]));
    expect(duties(a)).not.toContain("O_DEP_FRIA");
    expect(duties(a).some((id) => id.startsWith("O_HR_"))).toBe(false); // not the provider
  });

  it("requires a fundamental rights impact assessment for credit scoring deployers (Annex III 5(b))", () => {
    const a = A({ usesSystemProfessionally: true, developsOrCommissionsSystem: false, annex3UseCases: ["5b_credit_scoring"], profilesPeople: true });
    expect(duties(a)).toContain("O_DEP_FRIA");
  });

  it("requires a FRIA and EU-database registration of use for public bodies", () => {
    const a = A({ usesSystemProfessionally: true, developsOrCommissionsSystem: false, annex3UseCases: ["5a_public_benefits"], isPublicBody: true });
    expect(duties(a)).toEqual(expect.arrayContaining(["O_DEP_FRIA", "O_DEP_PUBLIC_REGISTRATION"]));
  });

  it("carves critical infrastructure (Annex III point 2) out of the FRIA and individual-explanation duties", () => {
    const a = A({ usesSystemProfessionally: true, developsOrCommissionsSystem: false, annex3UseCases: ["2_critical_infrastructure"], isPublicBody: true });
    expect(tiers(a)["high-risk"]).toBe("applies");
    expect(duties(a)).not.toContain("O_DEP_FRIA");
    expect(duties(a)).not.toContain("O_DEP_EXPLANATION");
  });

  it("treats a provider outside the EU as needing an authorised representative", () => {
    const a = A({ ...HIRING, providerEstablishedInEu: false });
    expect(duties(a)).toContain("O_HR_AUTHORISED_REPRESENTATIVE");
    expect(a.authorisedRepresentativeNeeded).toBe("yes");
  });

  it("makes a rebrander the provider (Article 25(1)(a))", () => {
    const a = A({ developsOrCommissionsSystem: false, rebrandsHighRiskSystem: true, annex3UseCases: ["4a_recruitment"], profilesPeople: true });
    expect(a.roles.find((r) => r.role === "provider")?.status).toBe("yes");
    expect(duties(a)).toEqual(expect.arrayContaining(["O_ART25_PROVIDER_DUTIES", "O_HR_RISK_MANAGEMENT"]));
  });
});

// ---------------------------------------------------------------- the Article 6(3) exception
describe("Article 6(3) exception", () => {
  const NARROW = {
    developsOrCommissionsSystem: true, annex3UseCases: ["4a_recruitment"], narrowProceduralTask: true,
    profilesPeople: false, materiallyInfluencesDecisions: false,
  };

  it("takes a narrow procedural system out of high-risk but keeps documentation and registration duties", () => {
    const a = A(NARROW);
    expect(tiers(a)["high-risk"]).toBeUndefined();
    expect(a.highRisk.exceptionRelied).toBe(true);
    expect(duties(a)).toEqual(expect.arrayContaining(["O_EXC_DOCUMENT", "O_EXC_REGISTER"]));
    expect(a.confidence.level).not.toBe("High"); // relying on the exception is a judgement call
  });

  it("never lets profiling use the exception", () => {
    const a = A({ ...NARROW, profilesPeople: true });
    expect(tiers(a)["high-risk"]).toBe("applies");
    expect(a.highRisk.profilingOverride).toBe(true);
    expect(duties(a)).not.toContain("O_EXC_DOCUMENT");
  });

  it("does not assume the exception: with its facts unknown the system stays high-risk", () => {
    const a = A({ developsOrCommissionsSystem: true, annex3UseCases: ["4a_recruitment"] });
    expect(tiers(a)["high-risk"]).toBe("applies");
    expect(duties(a)).not.toContain("O_EXC_DOCUMENT");
    expect(a.confidence.level).not.toBe("High");
  });
});

// ---------------------------------------------------------------- prohibited practices
describe("prohibited practices (Article 5)", () => {
  it("flags social scoring, dates it from 2 February 2025, and exposes the highest fine tier", () => {
    const a = A({ developsOrCommissionsSystem: true, socialScoring: true });
    expect(tiers(a).prohibited).toBe("applies");
    expect(duty(a, "O_STOP_PROHIBITED")?.timing).toMatchObject({ status: "in_force", from: "2025-02-02" });
    expect(a.exposure.highest?.tier).toBe("art5");
    expect(a.exposure.highest?.max).toMatch(/35 million.*7%/);
  });

  it("prohibits inferring employees' emotions, and still shows the high-risk tier it would otherwise be", () => {
    const a = A({ usesSystemProfessionally: true, infersEmotionsAtWorkOrSchool: true, emotionRecognitionBiometric: true });
    expect(tiers(a)).toMatchObject({ prohibited: "applies", "high-risk": "applies" });
  });

  it("allows emotion inference for medical or safety reasons", () => {
    const a = A({ usesSystemProfessionally: true, infersEmotionsAtWorkOrSchool: true, emotionMedicalOrSafetyPurpose: true });
    expect(tiers(a).prohibited).toBeUndefined();
  });

  it("treats emotion recognition of customers as high-risk plus transparency, not prohibited", () => {
    const a = A({ usesSystemProfessionally: true, emotionRecognitionBiometric: true });
    expect(tiers(a)).toMatchObject({ "high-risk": "applies", transparency: "applies" });
    expect(tiers(a).prohibited).toBeUndefined();
  });

  it("prohibits real-time remote biometric identification by police unless the narrow exception is met", () => {
    const base = { usesSystemProfessionally: true, realTimeRemoteBiometricIdLawEnforcement: true, remoteBiometricIdentification: true };
    expect(tiers(A(base)).prohibited).toBe("applies");
    const allowed = A({ ...base, rbiStrictExceptionMet: true });
    expect(allowed.tiers.some((t) => t.tier === "prohibited")).toBe(false);
    expect(tiers(allowed)["high-risk"]).toBe("applies");
  });

  it("prohibits sensitive biometric categorisation and also flags it as high-risk", () => {
    const a = A({ usesSystemProfessionally: true, biometricCategorisationSensitive: true });
    expect(tiers(a)).toMatchObject({ prohibited: "applies", "high-risk": "applies" });
  });

  it("applies the Omnibus ban on non-consensual intimate imagery from 2 December 2026, not before", () => {
    const risky = { developsOrCommissionsSystem: true, generatesSyntheticContent: true, intimateImageryRisk: "foreseeable_without_safeguards" };
    const now = A(risky);
    expect(tiers(now).prohibited).toBe("applies");
    expect(duty(now, "O_STOP_PROHIBITED_NEW")?.timing).toMatchObject({ status: "upcoming", from: "2026-12-02" });
    expect(duty(now, "O_STOP_PROHIBITED")).toBeUndefined(); // not one of the original eight
    expect(duty(A(risky, { today: "2027-01-15" }), "O_STOP_PROHIBITED_NEW")?.timing.status).toBe("in_force");
  });

  it("does not prohibit an image generator whose safeguards reliably prevent such output", () => {
    const a = A({ developsOrCommissionsSystem: true, generatesSyntheticContent: true, intimateImageryRisk: "foreseeable_but_safeguarded" });
    expect(a.tiers.some((t) => t.tier === "prohibited")).toBe(false);
  });

  it("prohibits systems for child sexual abuse material as an intended purpose", () => {
    const a = A({ developsOrCommissionsSystem: true, csamRisk: "intended_purpose" });
    expect(tiers(a).prohibited).toBe("applies");
    expect(duty(a, "O_STOP_PROHIBITED_NEW")).toBeDefined();
  });
});

// ---------------------------------------------------------------- transparency
describe("transparency (Article 50)", () => {
  it("marks generated content for an image generator that does not talk to users", () => {
    const a = A({ developsOrCommissionsSystem: true, annex3UseCases: [], generatesSyntheticContent: true, interactsDirectlyWithPeople: false, placedOnMarketDate: "2026-11-01" });
    expect(tiers(a)).toEqual({ transparency: "applies" });
    expect(duties(a)).toContain("O_T50_2_MARK_CONTENT");
    expect(duties(a)).not.toContain("O_T50_1_DISCLOSE_AI");
  });

  it("skips the disclosure duty when it is obvious the user is dealing with an AI", () => {
    const a = A({ developsOrCommissionsSystem: true, interactsDirectlyWithPeople: true, aiNatureObvious: true, generatesSyntheticContent: false });
    expect(duties(a)).not.toContain("O_T50_1_DISCLOSE_AI");
  });

  it("requires deployers to disclose deep fakes", () => {
    const a = A({ usesSystemProfessionally: true, generatesDeepFakes: true, generatesSyntheticContent: true });
    expect(duties(a)).toContain("O_T50_4A_DISCLOSE_DEEPFAKE");
  });

  it("does not require disclosure of public-interest text that has human editorial responsibility", () => {
    const base = { usesSystemProfessionally: true, publishesTextOnPublicInterest: true };
    expect(duties(A(base))).toContain("O_T50_4B_DISCLOSE_TEXT");
    expect(duties(A({ ...base, humanEditorialControl: true }))).not.toContain("O_T50_4B_DISCLOSE_TEXT");
  });
});

// ---------------------------------------------------------------- general-purpose AI models
describe("general-purpose AI models (Articles 51-55)", () => {
  const MODEL = { providesGpaiModel: true, providerEstablishedInEu: true, modelPlacedOnMarketDate: "2025-12-01" };

  it("applies the full Article 53 set to a closed model below the compute threshold", () => {
    const a = A({ ...MODEL, trainingComputeFlop: 5e24, modelOpenSourcePublicWeights: false });
    expect(tiers(a).gpai).toBe("applies");
    expect(duties(a)).toEqual(expect.arrayContaining(["O_GPAI_TECH_DOC", "O_GPAI_DOWNSTREAM_INFO", "O_GPAI_COPYRIGHT_POLICY", "O_GPAI_TRAINING_SUMMARY"]));
    expect(duties(a)).not.toContain("O_GPAI_SYSTEMIC_NOTIFY");
  });

  it("adds the systemic-risk duties above 10^25 FLOP, and treats exactly 10^25 as below the line", () => {
    expect(duties(A({ ...MODEL, trainingComputeFlop: 3e25 }))).toEqual(expect.arrayContaining(["O_GPAI_SYSTEMIC_NOTIFY", "O_GPAI_SYSTEMIC_EVALUATE", "O_GPAI_SYSTEMIC_INCIDENTS_SECURITY"]));
    expect(duties(A({ ...MODEL, trainingComputeFlop: 1e25 }))).not.toContain("O_GPAI_SYSTEMIC_NOTIFY");
  });

  it("exempts an open-source model without systemic risk from documentation duties but not from copyright and training summary", () => {
    const a = A({ ...MODEL, trainingComputeFlop: 1e24, modelOpenSourcePublicWeights: true });
    expect(duties(a)).not.toContain("O_GPAI_TECH_DOC");
    expect(duties(a)).toEqual(expect.arrayContaining(["O_GPAI_COPYRIGHT_POLICY", "O_GPAI_TRAINING_SUMMARY"]));
  });

  it("removes that exemption when the open-source model has systemic risk", () => {
    const a = A({ ...MODEL, trainingComputeFlop: 1e26, modelOpenSourcePublicWeights: true });
    expect(duties(a)).toContain("O_GPAI_TECH_DOC");
  });

  it("gives a model placed on the market before 2 August 2025 until 2 August 2027 (Article 111(3))", () => {
    const a = A({ ...MODEL, trainingComputeFlop: 1e24, modelPlacedOnMarketDate: "2024-06-01" });
    expect(duty(a, "O_GPAI_COPYRIGHT_POLICY")?.timing).toMatchObject({ status: "upcoming", from: "2027-08-02" });
  });

  it("requires an authorised representative from a non-EU provider unless the model is open-source without systemic risk", () => {
    const closed = A({ ...MODEL, providerEstablishedInEu: false, trainingComputeFlop: 1e24, modelOpenSourcePublicWeights: false });
    expect(duties(closed)).toContain("O_GPAI_AUTHORISED_REPRESENTATIVE");
    const open = A({ ...MODEL, providerEstablishedInEu: false, trainingComputeFlop: 1e24, modelOpenSourcePublicWeights: true });
    expect(duties(open)).not.toContain("O_GPAI_AUTHORISED_REPRESENTATIVE");
  });
});

// ---------------------------------------------------------------- Annex I products
describe("high-risk through regulated products (Article 6(1), Annex I)", () => {
  const PRODUCT = { developsOrCommissionsSystem: true, annex3UseCases: [], safetyComponentOrProduct: true, thirdPartyConformityAssessmentRequired: true, placedOnMarketDate: "2029-01-01" };

  it("treats a medical-device safety component as high-risk with duties from 2 August 2028", () => {
    const a = A({ ...PRODUCT, annex1Legislation: "medical_devices" });
    expect(tiers(a)["high-risk"]).toBe("applies");
    expect(a.highRisk.route).toBe("annex_i_section_a");
    expect(duty(a, "O_HR_RISK_MANAGEMENT")?.timing).toMatchObject({ status: "upcoming", from: "2028-08-02" });
  });

  it("treats machinery as Section B after the Omnibus: high-risk, but Chapter III does not apply directly", () => {
    const a = A({ ...PRODUCT, annex1Legislation: "machinery" });
    expect(tiers(a)["high-risk"]).toBe("applies");
    expect(a.highRisk.route).toBe("annex_i_section_b");
    expect(duties(a).some((id) => id.startsWith("O_HR_"))).toBe(false);
  });

  it("does not treat a product that only needs third-party assessment for non-safety reasons as high-risk", () => {
    const a = A({ ...PRODUCT, annex1Legislation: "medical_devices", thirdPartyConformityAssessmentRequired: false });
    expect(tiers(a)["high-risk"]).toBeUndefined();
  });

  it("excludes systems used solely for non-safety functions such as convenience or quality control", () => {
    const a = A({ ...PRODUCT, annex1Legislation: "lifts", onlyNonSafetyFunctions: true });
    expect(tiers(a)["high-risk"]).toBeUndefined();
  });
});

// ---------------------------------------------------------------- transitional rule, Article 111(2)
describe("systems already on the market (Article 111(2) as amended)", () => {
  const LEGACY = { developsOrCommissionsSystem: true, annex3UseCases: ["4a_recruitment"], profilesPeople: true, placedOnMarketDate: "2026-01-01" };

  it("grandfathers a high-risk system placed on the market before 2 December 2027", () => {
    const a = A(LEGACY);
    expect(duty(a, "O_HR_RISK_MANAGEMENT")?.timing.status).toBe("grandfathered");
  });

  it("ends the relief after a significant design change", () => {
    const a = A({ ...LEGACY, significantDesignChangeSinceLaunch: true });
    expect(duty(a, "O_HR_RISK_MANAGEMENT")?.timing).toMatchObject({ status: "upcoming", from: "2027-12-02" });
  });

  it("gives systems for public authorities until 2 August 2030", () => {
    const a = A({ ...LEGACY, usedByPublicAuthorities: true });
    expect(duty(a, "O_HR_RISK_MANAGEMENT")?.timing).toMatchObject({ status: "upcoming", from: "2030-08-02" });
  });

  it("never grandfathers prohibited practices or transparency duties", () => {
    const a = A({ ...LEGACY, socialScoring: true });
    expect(duty(a, "O_STOP_PROHIBITED")?.timing.status).toBe("in_force");
  });
});

// ---------------------------------------------------------------- scope
describe("scope (Articles 2 and 3)", () => {
  it("puts a non-AI system outside the Act", () => {
    const a = A({ isAiSystem: false, developsOrCommissionsSystem: true });
    expect(a.scope.status).toBe("out_of_scope");
    expect(a.tiers).toEqual([]);
    expect(a.obligations).toEqual([]);
  });

  it("puts a system with no EU connection outside the Act", () => {
    expect(A({ euNexus: false }).scope.status).toBe("out_of_scope");
  });

  it("excludes military-only systems and research-only systems", () => {
    expect(A({ militaryOnly: true }).scope.status).toBe("out_of_scope");
    expect(A({ researchOnly: true }).scope.status).toBe("out_of_scope");
  });

  it("keeps an open-source chatbot in scope because Article 50 still applies", () => {
    const a = A({ freeOpenSourceLicence: true, developsOrCommissionsSystem: true, interactsDirectlyWithPeople: true, generatesSyntheticContent: false });
    expect(a.scope.status).toBe("in_scope");
    expect(tiers(a).transparency).toBe("applies");
  });

  it("exempts an open-source system that is not prohibited, high-risk or subject to Article 50", () => {
    const a = A({ freeOpenSourceLicence: true, developsOrCommissionsSystem: true, annex3UseCases: [], interactsDirectlyWithPeople: false, generatesSyntheticContent: false });
    expect(a.scope.status).toBe("out_of_scope");
    expect(a.obligations).toEqual([]);
  });

  it("calls an ordinary AI system with no special features minimal risk", () => {
    const a = A({ developsOrCommissionsSystem: true, annex3UseCases: [], interactsDirectlyWithPeople: false, generatesSyntheticContent: false });
    expect(tiers(a)).toEqual({ minimal: "applies" });
    expect(duties(a)).toEqual(["O_AI_LITERACY"]);
  });
});

// ---------------------------------------------------------------- unknown facts, questions, confidence
describe("unknown facts, open questions and confidence", () => {
  it("never throws on an empty or garbage profile, and reports Low confidence", () => {
    for (const input of [{}, { summary: "x" }, null, undefined, "nonsense", { isAiSystem: "yes", bogus: 1 }]) {
      const a = assess(input, { today: TODAY });
      expect(a.confidence.level).toBe("Low");
    }
  });

  it("asks the facts that matter most first", () => {
    const a = assess({ summary: "something" }, { today: TODAY });
    expect(a.questions.length).toBeGreaterThan(0);
    expect(["isAiSystem", "euNexus", "developsOrCommissionsSystem", "usesSystemProfessionally"]).toContain(a.questions[0].fact);
  });

  it("does not ask about facts it already knows or has assumed", () => {
    const a = A(CHATBOT);
    const asked = new Set(a.questions.map((q) => q.fact));
    expect(asked.has("isAiSystem")).toBe(false);
    expect(asked.has("socialScoring")).toBe(false); // assumed false, listed as an assumption instead
    expect(a.assumptions.some((x) => x.fact === "socialScoring")).toBe(true);
  });

  it("keeps a classification that depends on an unknown fact 'possible' rather than guessing", () => {
    const a = A({ developsOrCommissionsSystem: true }); // use case, interaction and generation all unknown
    expect(a.tiers.some((t) => t.status === "possible")).toBe(true);
    expect(a.confidence.level).not.toBe("High");
    expect(a.confidence.flipFacts.length).toBeGreaterThan(0);
  });

  it("sanitises a profile: bad values are dropped and good ones kept", () => {
    const a = assess({ isAiSystem: "yes", euNexus: true, bogus: 1, annex3UseCases: ["nope"] }, { today: TODAY });
    expect(a.profile.euNexus).toBe(true);
    expect(a.profile.isAiSystem).toBeUndefined();
    expect(a.profile.annex3UseCases).toBeUndefined();
  });
});

// ---------------------------------------------------------------- gap check and action plan
describe("gap check and action plan", () => {
  it("asks only the controls that evidence duties which apply", () => {
    const a = A(CHATBOT);
    const ids = a.gapCheck.questions.map((q) => q.controlId);
    expect(ids).toEqual(expect.arrayContaining(["C_AI_LITERACY", "C_AI_DISCLOSURE", "C_CONTENT_MARKING"]));
    expect(ids).not.toContain("C_RISK_MANAGEMENT");
  });

  it("turns missing and partial controls into prioritised actions: P0 first for duties already in force", () => {
    const a = A(CHATBOT, { controls: { C_AI_DISCLOSURE: "missing", C_AI_LITERACY: "partial", C_CONTENT_MARKING: "in_place" } });
    expect(a.actionPlan?.map((x) => [x.controlId, x.priority])).toEqual([
      ["C_AI_DISCLOSURE", "P0"],
      ["C_AI_LITERACY", "P1"],
    ]);
    expect(a.gaps).toHaveLength(3);
    expect(a.gapCheck.questions.some((q) => q.controlId === "C_AI_DISCLOSURE")).toBe(false); // answered
    const item = a.actionPlan![0];
    expect(item.articles.join(" ")).toMatch(/Art\. 50/);
    expect(item.owner).toBe("Product");
    expect(item.why).toMatch(/already applies/);
  });

  it("ranks an upcoming duty by how close it is", () => {
    const hiring = { developsOrCommissionsSystem: true, annex3UseCases: ["4a_recruitment"], profilesPeople: true, placedOnMarketDate: "2028-06-01" };
    const soon = A(hiring, { controls: { C_RISK_MANAGEMENT: "missing" }, today: "2026-10-08" }); // about 14 months away
    const later = A(hiring, { controls: { C_RISK_MANAGEMENT: "missing" }, today: "2026-01-01" }); // about 23 months away
    expect(soon.actionPlan?.[0].priority).toBe("P1");
    expect(later.actionPlan?.[0].priority).toBe("P2");
  });

  it("makes a missing fix for a prohibited practice that applies today a P0", () => {
    const a = A({ developsOrCommissionsSystem: true, socialScoring: true }, { controls: { C_PROHIBITED_REMEDIATION: "missing" } });
    expect(a.actionPlan?.[0]).toMatchObject({ controlId: "C_PROHIBITED_REMEDIATION", priority: "P0" });
  });

  it("produces no actions when every control is in place", () => {
    const a = A(CHATBOT, { controls: { C_AI_DISCLOSURE: "in_place", C_AI_LITERACY: "in_place", C_CONTENT_MARKING: "in_place" } });
    expect(a.actionPlan).toEqual([]);
  });
});

// ---------------------------------------------------------------- guarantees
describe("determinism and traceability", () => {
  it("gives the same assessment for the same profile and date", () => {
    const x = JSON.stringify(A(CHATBOT)), y = JSON.stringify(A(CHATBOT));
    expect(x).toBe(y);
  });

  it("changes only with the date, never with anything hidden", () => {
    expect(JSON.stringify(A(CHATBOT, { today: "2026-05-01" }))).not.toBe(JSON.stringify(A(CHATBOT, { today: "2026-10-08" })));
  });

  it("explains every tier with at least one finding that cites the law", () => {
    for (const profile of [CHATBOT, { developsOrCommissionsSystem: true, annex3UseCases: ["4a_recruitment"], profilesPeople: true }, { socialScoring: true }]) {
      const a = A(profile);
      for (const t of a.tiers.filter((x) => x.tier !== "minimal")) {
        const ruleFindings = a.findings.filter((f) => t.ruleIds.includes(f.ruleId));
        expect(ruleFindings.length, t.tier).toBeGreaterThan(0);
        expect(ruleFindings.every((f) => f.cites.length > 0)).toBe(true);
      }
    }
  });

  it("records which rule pack and law version produced the result", () => {
    const a = A(CHATBOT);
    expect(a.engine.rulePack).toMatch(/2026\/1744/);
    expect(a.engine.today).toBe(TODAY);
    expect(a.timeline.find((t) => t.key === "hr_annex3")).toMatchObject({ from: "2027-12-02", original: "2026-08-02" });
  });
});
