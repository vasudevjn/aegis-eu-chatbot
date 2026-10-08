import type { Cond } from "@/lib/rules/logic";
import type { Rule } from "@/lib/rules/types";
import { act, actAnnex, omni } from "@/lib/rules/pack/cite";
import {
  ANNEX3_USE_CASES,
  ANNEX1_SECTION_A_IDS,
  ANNEX1_SECTION_B_IDS,
} from "@/lib/rules/pack/catalogues";

/**
 * Classification rules, in the order the Act itself works:
 *   scope -> roles -> prohibited practices -> high-risk -> role shifts -> transparency -> general-purpose AI
 *
 * Every rule is data: a condition over the profile (or over flags set by earlier rules), the tier it
 * contributes to, a plain-language reason, and the provisions it comes from. Flags ("d.…") are
 * OR-ed across all rules that feed them. A rule may only read a flag fed by an earlier rule or by
 * pack/derived.ts; pack.test.ts checks this.
 */

const t = (k: string): Cond => ({ k, is: true });
const f = (k: string): Cond => ({ k, is: false });
const notT = (k: string): Cond => ({ not: t(k) });

// ---------------------------------------------------------------- scope (Articles 2-3)
// Exclusion rules only matter when they fire, so they are quiet while the facts are unknown.
export const SCOPE_RULES: Rule[] = [
  {
    id: "SCOPE_NOT_AI", stage: "scope", title: "Not an AI system", flag: "d.excluded", quiet: true,
    when: f("isAiSystem"),
    explain: "It does not infer outputs from its inputs with some autonomy, so it is not an 'AI system' as defined in Article 3(1) and the Act does not apply.",
    cites: [act("Art. 3(1)", 3, 46)],
    judgement: "Whether a system 'infers' rather than just applies fixed rules is a judgement call; the Commission has published guidelines on the definition.",
  },
  {
    id: "SCOPE_NO_EU", stage: "scope", title: "No EU connection", flag: "d.excluded", quiet: true,
    when: f("euNexus"),
    explain: "It is not placed on the EU market, used by an EU-based deployer, or producing output used in the EU, so the Act does not reach it (Article 2(1)).",
    cites: [act("Art. 2(1)", 2, 45)],
  },
  {
    id: "SCOPE_MILITARY", stage: "scope", title: "Military, defence or national security only", flag: "d.excluded", quiet: true,
    when: t("militaryOnly"),
    explain: "Systems used exclusively for military, defence or national security purposes are outside the Act (Article 2(3)).",
    cites: [act("Art. 2(3)", 2, 45)],
  },
  {
    id: "SCOPE_RESEARCH", stage: "scope", title: "Scientific research only", flag: "d.excluded", quiet: true,
    when: t("researchOnly"),
    explain: "Systems developed and put into service solely for scientific research and development are outside the Act (Article 2(6)).",
    cites: [act("Art. 2(6)", 2, 46)],
  },
  {
    id: "SCOPE_PREMARKET", stage: "scope", title: "Pre-market development only", flag: "d.excluded", quiet: true,
    when: t("preMarketDevelopmentOnly"),
    explain: "Research, testing and development before a system is placed on the market or put into service is outside the Act. Testing in real-world conditions is not covered by this exclusion (Article 2(8)).",
    cites: [act("Art. 2(8)", 2, 46)],
  },
  {
    id: "SCOPE_PERSONAL", stage: "scope", title: "Personal, non-professional use", flag: "d.excluded", quiet: true,
    when: t("personalNonProfessionalUse"),
    explain: "Obligations of deployers who are individuals using the system in a purely personal, non-professional activity do not apply (Article 2(10)).",
    cites: [act("Art. 2(10)", 2, 46)],
  },
];

// ---------------------------------------------------------------- roles (Articles 3, 22-25)
export const ROLE_RULES: Rule[] = [
  { id: "ROLE_PROVIDER", stage: "roles", title: "Provider", flag: "d.provider", quiet: true, when: t("developsOrCommissionsSystem"), explain: "You develop the system (or have it developed) and offer it under your own name, so you are its 'provider', the role that carries most obligations.", cites: [act("Art. 3(3)", 3, 46)] },
  { id: "ROLE_DEPLOYER", stage: "roles", title: "Deployer", flag: "d.deployer", quiet: true, when: t("usesSystemProfessionally"), explain: "You use the system under your own authority in a professional context, so you are a 'deployer'.", cites: [act("Art. 3(4)", 3, 46)] },
  { id: "ROLE_IMPORTER", stage: "roles", title: "Importer", flag: "d.importer", quiet: true, when: t("importsSystem"), explain: "You place on the EU market a system that carries a non-EU company's name or trademark, so you are an 'importer'.", cites: [act("Art. 3(6)", 3, 46)] },
  { id: "ROLE_DISTRIBUTOR", stage: "roles", title: "Distributor", flag: "d.distributor", quiet: true, when: t("distributesSystem"), explain: "You make the system available on the EU market without being its provider or importer, so you are a 'distributor'.", cites: [act("Art. 3(7)", 3, 46)] },
  { id: "ROLE_MANUFACTURER", stage: "roles", title: "Product manufacturer", flag: "d.productManufacturer", quiet: true, when: t("productManufacturerOwnName"), explain: "You place an AI system on the market together with your own product under your own name.", cites: [act("Art. 2(1)(e)", 2, 45)] },
  { id: "ROLE_GPAI_PROVIDER", stage: "roles", title: "General-purpose AI model provider", flag: "d.gpaiProviderRole", quiet: true, when: t("providesGpaiModel"), explain: "You develop a general-purpose AI model and place it on the market.", cites: [act("Art. 3(63)", 3, 50)] },
];

// ---------------------------------------------------------------- prohibited practices (Article 5)
const P5 = (id: string, point: string, title: string, when: Cond, explain: string, extra: Partial<Rule> = {}): Rule => ({
  id, stage: "prohibited", title, when, tier: "prohibited", flag: ["d.prohibited", "d.prohibitedBase"], date: "ch1_2", explain,
  cites: [act(`Art. 5(1)(${point})`, 5, point === "g" || point === "h" ? 52 : 51)], ...extra,
});

export const PROHIBITED_RULES: Rule[] = [
  P5("P5_A_MANIPULATION", "a", "Subliminal or manipulative techniques", t("manipulativeTechniques"), "Subliminal, purposefully manipulative or deceptive techniques that materially distort behaviour and are likely to cause significant harm are prohibited.", { judgement: "'Material distortion' and 'significant harm' are judgement calls." }),
  P5("P5_B_VULNERABILITIES", "b", "Exploiting vulnerabilities", t("exploitsVulnerabilities"), "Exploiting vulnerabilities due to age, disability or a specific social or economic situation, in a way likely to cause significant harm, is prohibited.", { judgement: "'Significant harm' is a judgement call." }),
  P5("P5_C_SOCIAL_SCORING", "c", "Social scoring", t("socialScoring"), "Scoring people over time on their social behaviour or personal characteristics, where it leads to detrimental treatment in unrelated contexts or treatment that is unjustified or disproportionate, is prohibited."),
  P5("P5_D_CRIME_PROFILING", "d", "Predicting crime from profiling alone", t("crimeRiskProfilingOnly"), "Assessing the risk that a person will commit a crime based solely on profiling or personality traits is prohibited. Systems that support a human assessment based on objective, verifiable facts directly linked to criminal activity are not covered."),
  P5("P5_E_FACE_SCRAPING", "e", "Untargeted facial-image scraping", t("untargetedFacialScraping"), "Creating or expanding facial recognition databases by untargeted scraping of facial images from the internet or CCTV is prohibited."),
  P5("P5_F_EMOTIONS_WORK_SCHOOL", "f", "Emotion inference at work or in education", { all: [t("infersEmotionsAtWorkOrSchool"), notT("emotionMedicalOrSafetyPurpose")] }, "Inferring the emotions of people in the workplace or in education institutions is prohibited, except for medical or safety reasons."),
  P5("P5_G_BIOMETRIC_CATEGORISATION", "g", "Biometric categorisation of sensitive attributes", t("biometricCategorisationSensitive"), "Categorising individuals from their biometric data to infer race, political opinions, trade union membership, religious or philosophical beliefs, sex life or sexual orientation is prohibited. Labelling or filtering lawfully acquired biometric datasets, and categorisation in law enforcement, are not covered."),
  P5("P5_H_REALTIME_RBI", "h", "Real-time remote biometric identification for law enforcement", { all: [t("realTimeRemoteBiometricIdLawEnforcement"), notT("rbiStrictExceptionMet")] }, "Real-time remote biometric identification in publicly accessible spaces for law enforcement is prohibited unless strictly necessary for a narrow listed objective and authorised in advance by a judicial or independent authority."),
  {
    id: "P5_BA_INTIMATE_IMAGERY", stage: "prohibited", title: "Non-consensual intimate imagery", tier: "prohibited", flag: ["d.prohibited", "d.prohibitedNew"], date: "art5_new",
    when: { k: "intimateImageryRisk", is: ["intended_purpose", "foreseeable_without_safeguards"] },
    explain: "Systems that generate or manipulate realistic intimate or sexually explicit imagery of identifiable people without their explicit consent are prohibited when that is the intended purpose, or a reasonably foreseeable and reproducible output without adequate safeguards. Applies from 2 December 2026.",
    cites: [omni("Art. 5(1)(ba), (1a), (1b)", 18)],
    judgement: "Whether safeguards are 'reasonable and adequate' to reliably prevent the output is a judgement call.",
  },
  {
    id: "P5_BB_CSAM", stage: "prohibited", title: "Child sexual abuse material", tier: "prohibited", flag: ["d.prohibited", "d.prohibitedNew"], date: "art5_new",
    when: { k: "csamRisk", is: ["intended_purpose", "foreseeable_without_safeguards"] },
    explain: "Systems that generate or manipulate child sexual abuse material are prohibited when that is the intended purpose, or a reasonably foreseeable and reproducible output without adequate safeguards. Applies from 2 December 2026.",
    cites: [omni("Art. 5(1)(bb), (1a)", 18)],
    judgement: "Whether safeguards are 'reasonable and adequate' to reliably prevent the output is a judgement call.",
  },
];

// ---------------------------------------------------------------- high-risk (Article 6, Annexes I and III)
const annex3PerUseCase: Rule[] = ANNEX3_USE_CASES.map((u) => ({
  id: `HR_A3_${u.id.toUpperCase()}`, stage: "high_risk" as const,
  title: `Annex III ${u.point}: ${u.area}`, flag: "d.annex3Candidate", quiet: true,
  when: { k: "annex3UseCases", includesAny: [u.id] },
  explain: u.description,
  cites: [actAnnex(`Annex III ${u.point}`, "III", point3Page(u.point))],
}));

/** Page of the OJ L 12.7.2024 PDF on which an Annex III point is printed. */
function point3Page(point: string): number {
  if (point === "8(b)") return 129;
  if (/^(5\(d\)|6|7|8\(a\))/.test(point)) return 128;
  return 127;
}

const biometricAnnex3: Rule[] = [
  { id: "HR_A3_1A_RBI", stage: "high_risk", title: "Annex III 1(a): remote biometric identification", flag: "d.annex3Candidate", quiet: true, when: t("remoteBiometricIdentification"), explain: "Remote biometric identification systems are high-risk. One-to-one verification that only confirms a claimed identity is excluded.", cites: [actAnnex("Annex III 1(a)", "III", 127)] },
  { id: "HR_A3_1B_BIOMETRIC_CATEGORISATION", stage: "high_risk", title: "Annex III 1(b): biometric categorisation", flag: "d.annex3Candidate", quiet: true, when: t("biometricCategorisationSensitive"), explain: "Biometric categorisation according to sensitive or protected attributes is high-risk (and inferring the most sensitive ones is prohibited outright).", cites: [actAnnex("Annex III 1(b)", "III", 127)] },
  { id: "HR_A3_1C_EMOTION_RECOGNITION", stage: "high_risk", title: "Annex III 1(c): emotion recognition", flag: "d.annex3Candidate", quiet: true, when: t("emotionRecognitionBiometric"), explain: "AI systems intended to be used for emotion recognition (inferring emotions from biometric data) are high-risk.", cites: [actAnnex("Annex III 1(c)", "III", 127)] },
];

const ANNEX3_EXCEPTION_CONDITIONS: Cond = {
  any: [t("narrowProceduralTask"), t("improvesCompletedHumanWork"), t("detectsDecisionPatternsOnly"), t("preparatoryTaskOnly")],
};

export const HIGH_RISK_RULES: Rule[] = [
  ...annex3PerUseCase,
  ...biometricAnnex3,
  {
    id: "HR_EXCEPTION_6_3", stage: "high_risk", title: "Article 6(3) exception may apply", flag: "d.exceptionHolds", quiet: true, unknownAsNo: true,
    when: { all: [t("d.annex3Candidate"), notT("profilesPeople"), ANNEX3_EXCEPTION_CONDITIONS, notT("materiallyInfluencesDecisions")] },
    explain: "Although the use is listed in Annex III, the system only performs a limited task (narrow procedural, improving finished human work, detecting patterns without replacing human review, or a preparatory task), does not profile people and does not materially influence the outcome. It may therefore fall outside high-risk, but the provider must document that assessment before launch and still register the system.",
    cites: [act("Art. 6(3)-(4)", 6, 54)],
    judgement: "Relying on the Article 6(3) exception is a documented judgement, and a wrong call exposes the provider to penalties.",
  },
  {
    id: "HR_PROFILING_OVERRIDE", stage: "high_risk", title: "Profiling keeps it high-risk", flag: "d.profilingOverride", quiet: true,
    when: { all: [t("d.annex3Candidate"), t("profilesPeople")] },
    explain: "An Annex III system that profiles natural persons is always high-risk, even if one of the Article 6(3) conditions would otherwise fit.",
    cites: [act("Art. 6(3), last subparagraph", 6, 54)],
  },
  {
    id: "HR_ANNEX3", stage: "high_risk", title: "High-risk through an Annex III use case", tier: "high-risk", flag: "d.hrAnnex3", date: "hr_annex3",
    when: { all: [t("d.annex3Candidate"), notT("d.exceptionHolds")] },
    explain: "It is used for a purpose listed in Annex III and no Article 6(3) exception applies, so it is high-risk under Article 6(2).",
    explainPossible: "It may be high-risk if its use matches an Annex III purpose; that is not settled yet.",
    cites: [act("Art. 6(2)", 6, 53), actAnnex("Annex III", "III", 127)],
  },
  {
    id: "HR_ANNEX1_SECTION_A", stage: "high_risk", title: "High-risk through a regulated product (Annex I, Section A)", tier: "high-risk", flag: ["d.hrAnnex1A"], date: "hr_annex1",
    when: { all: [t("safetyComponentOrProduct"), { k: "annex1Legislation", is: ANNEX1_SECTION_A_IDS }, t("thirdPartyConformityAssessmentRequired"), notT("onlyNonSafetyFunctions")] },
    explain: "It is a safety component of (or is itself) a product covered by Annex I, Section A legislation that needs a third-party conformity assessment, so it is high-risk under Article 6(1). Chapter III of the AI Act applies directly.",
    explainPossible: "It may be high-risk through the product route if it is a safety component of a product covered by Annex I Section A legislation that needs a third-party conformity assessment.",
    cites: [act("Art. 6(1)", 6, 53), omni("Art. 6(1a)-(1c)", 18), actAnnex("Annex I, Section A", "I", 124)],
    judgement: "Whether a function is a 'safety function' (Article 3(14), Article 6(1a)-(1b)) can call for judgement.",
  },
  {
    id: "HR_ANNEX1_SECTION_B", stage: "high_risk", title: "High-risk through a regulated product (Annex I, Section B)", tier: "high-risk", flag: ["d.hrAnnex1B"], date: "hr_annex1",
    when: { all: [t("safetyComponentOrProduct"), { k: "annex1Legislation", is: ANNEX1_SECTION_B_IDS }, t("thirdPartyConformityAssessmentRequired"), notT("onlyNonSafetyFunctions")] },
    explain: "It is a safety component of (or is itself) a product covered by Annex I, Section B legislation, which includes machinery after the Omnibus amendment. It counts as high-risk under Article 6(1), but only Article 6(1) and a few other provisions of the AI Act apply directly; the detailed requirements come through the sectoral legislation.",
    explainPossible: "It may be high-risk through the product route if it is a safety component of a product covered by Annex I Section B legislation that needs a third-party conformity assessment.",
    cites: [act("Art. 6(1)", 6, 53), omni("Art. 2(2)", 15), omni("Annex I, Section B point 21", 36)],
  },
];

// Art. 25 role shifts need the high-risk result, so they run after it.
export const ROLE_SHIFT_RULES: Rule[] = [
  { id: "ROLE_ART25_REBRAND", stage: "roles", title: "Rebranding makes you the provider", flag: ["d.provider", "d.art25Shift"], quiet: true, when: { all: [t("rebrandsHighRiskSystem"), t("d.highRisk")] }, explain: "Putting your name or trademark on a high-risk AI system already on the market makes you its provider, with all provider obligations (Article 25(1)(a)).", cites: [act("Art. 25(1)(a)", 25, 67)] },
  { id: "ROLE_ART25_MODIFY", stage: "roles", title: "Substantial modification makes you the provider", flag: ["d.provider", "d.art25Shift"], quiet: true, when: { all: [t("substantiallyModifiesHighRiskSystem"), t("d.highRisk")] }, explain: "A substantial modification of a high-risk system that remains high-risk makes you its provider (Article 25(1)(b)).", cites: [act("Art. 25(1)(b)", 25, 67)] },
  { id: "ROLE_ART25_PURPOSE", stage: "roles", title: "Changing the purpose makes you the provider", flag: ["d.provider", "d.art25Shift"], quiet: true, when: t("changesPurposeToHighRisk"), explain: "Changing the intended purpose of a system that was not high-risk so that it becomes high-risk makes you its provider (Article 25(1)(c)).", cites: [act("Art. 25(1)(c)", 25, 67)] },
  { id: "ROLE_ART25_MANUFACTURER", stage: "roles", title: "Product manufacturer is the provider", flag: "d.provider", quiet: true, when: { all: [t("productManufacturerOwnName"), t("d.hrAnnex1A")] }, explain: "For a high-risk AI system that is a safety component of an Annex I Section A product, the product manufacturer is the provider when it is placed on the market under the manufacturer's name (Article 25(3)).", cites: [act("Art. 25(3)", 25, 67)] },
];

// ---------------------------------------------------------------- transparency (Article 50)
export const TRANSPARENCY_RULES: Rule[] = [
  {
    id: "T50_1_INTERACTION", stage: "transparency", title: "Tell people they are dealing with an AI", tier: "transparency", flag: ["d.t50_1", "d.transparency"], date: "art50",
    when: { all: [t("interactsDirectlyWithPeople"), notT("aiNatureObvious")] },
    explain: "The system interacts directly with people, so the provider must design it so people are told they are interacting with an AI, unless that is obvious to a reasonably well-informed person from the context.",
    explainPossible: "If the system interacts directly with people, they must be told it is an AI.",
    cites: [act("Art. 50(1)", 50, 82)],
  },
  {
    id: "T50_2_MARKING", stage: "transparency", title: "Mark generated content as AI-generated", tier: "transparency", flag: ["d.t50_2", "d.transparency"], date: "art50_2_legacy",
    when: { all: [t("generatesSyntheticContent"), notT("onlyAssistiveEditing")] },
    explain: "The system generates synthetic audio, image, video or text, so its outputs must be marked in a machine-readable format and be detectable as artificially generated, as far as technically feasible.",
    explainPossible: "If the system generates audio, images, video or text, its outputs must be marked as AI-generated in a machine-readable format.",
    cites: [act("Art. 50(2)", 50, 82), omni("Art. 111(4)", 35)],
  },
  {
    id: "T50_3_EMOTION_BIOMETRIC", stage: "transparency", title: "Inform people exposed to emotion recognition or biometric categorisation", tier: "transparency", flag: ["d.t50_3", "d.transparency"], date: "art50",
    when: { any: [t("emotionRecognitionBiometric"), t("biometricCategorisationAny")] },
    explain: "Deployers of an emotion recognition or biometric categorisation system must inform the people exposed to it about its operation and process their personal data in line with data protection law.",
    cites: [act("Art. 50(3)", 50, 82)],
  },
  {
    id: "T50_4A_DEEPFAKE", stage: "transparency", title: "Disclose deep fakes", tier: "transparency", flag: ["d.t50_4a", "d.transparency"], date: "art50",
    when: t("generatesDeepFakes"),
    explain: "Deployers of a system that generates or manipulates realistic image, audio or video of real people, objects, places or events must disclose that the content is artificially generated or manipulated. For evidently artistic, creative, satirical or fictional works the disclosure is limited to what does not hamper enjoyment of the work.",
    cites: [act("Art. 50(4)", 50, 82)],
  },
  {
    id: "T50_4B_PUBLIC_INTEREST_TEXT", stage: "transparency", title: "Disclose AI-generated public-interest text", tier: "transparency", flag: ["d.t50_4b", "d.transparency"], date: "art50",
    when: { all: [t("publishesTextOnPublicInterest"), notT("humanEditorialControl")] },
    explain: "AI-generated or manipulated text published to inform the public on matters of public interest must be disclosed, unless it has undergone human review or editorial control and someone holds editorial responsibility.",
    cites: [act("Art. 50(4)", 50, 82)],
  },
];

// ---------------------------------------------------------------- general-purpose AI models (Articles 51-55)
export const GPAI_RULES: Rule[] = [
  {
    id: "GPAI_PROVIDER", stage: "gpai", title: "General-purpose AI model provider", tier: "gpai", flag: "d.gpai", date: "gpai",
    when: t("providesGpaiModel"),
    explain: "You develop a general-purpose AI model and place it on the market, so the obligations of Article 53 apply to you.",
    cites: [act("Art. 3(63)", 3, 50), act("Art. 53", 53, 84)],
    judgement: "Whether a model has 'significant generality' and can competently perform a wide range of tasks (Article 3(63)) is a judgement call.",
  },
  {
    id: "GPAI_SYSTEMIC_RISK", stage: "gpai", title: "General-purpose AI model with systemic risk", flag: "d.gpaiSystemic", quiet: true, date: "gpai",
    when: { all: [t("providesGpaiModel"), { any: [{ k: "trainingComputeFlop", gt: 1e25 }, t("designatedSystemicRiskByCommission")] }] },
    explain: "The model is presumed to have high-impact capabilities because its training compute exceeds 10^25 floating-point operations (or the Commission designated it), so the additional obligations of Articles 52 and 55 apply.",
    cites: [act("Art. 51", 51, 83), act("Art. 52", 52, 83), act("Art. 55", 55, 86)],
  },
  {
    id: "GPAI_OPEN_SOURCE_EXEMPT", stage: "gpai", title: "Open-source exemption for part of Article 53", flag: "d.gpaiOpenSourceExempt", quiet: true, date: "gpai",
    when: { all: [t("providesGpaiModel"), t("modelOpenSourcePublicWeights"), notT("d.gpaiSystemic")] },
    explain: "Providers of models released under a free and open-source licence with public weights are exempt from the technical-documentation and downstream-information duties (Article 53(1)(a)-(b)) and from appointing an authorised representative, unless the model has systemic risk. The copyright policy and training-content summary still apply.",
    cites: [act("Art. 53(2)", 53, 85), act("Art. 54(6)", 54, 86)],
  },
];

export const ALL_CLASSIFICATION_RULES: Rule[] = [
  ...SCOPE_RULES, ...ROLE_RULES, ...PROHIBITED_RULES, ...HIGH_RISK_RULES,
  ...ROLE_SHIFT_RULES, ...TRANSPARENCY_RULES, ...GPAI_RULES,
];
