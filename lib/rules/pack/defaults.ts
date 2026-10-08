import { FACT_META, type FactKey, type Profile } from "@/lib/rules/facts";

/**
 * Screening facts the engine assumes to be "no" when nothing was said about them.
 *
 * Without this, every assessment would read "possibly prohibited, possibly high-risk" because dozens of
 * screening facts start unknown. The assumption is never silent: every defaulted fact is reported to
 * the user ("Assumed, tell me if any is wrong") and shown in the exported assessment.
 *
 * Deliberately NOT defaulted, because they decide the outcome and must come from the user: whether it
 * is an AI system, the EU connection, the role, the Annex III use case, whether it interacts with
 * people or generates content, the GPAI model's compute, dates and organisation size.
 */
type Defaulted = Exclude<FactKey, "summary">;

const FALSE_BY_DEFAULT: readonly Defaulted[] = [
  // exclusions the Act lists in Article 2 (assumed not to apply)
  "militaryOnly", "researchOnly", "preMarketDevelopmentOnly", "personalNonProfessionalUse",
  // roles that are only relevant when stated
  "importsSystem", "distributesSystem", "productManufacturerOwnName",
  "rebrandsHighRiskSystem", "substantiallyModifiesHighRiskSystem", "changesPurposeToHighRisk",
  // biometrics (Annex III point 1, Articles 5 and 50)
  "remoteBiometricIdentification", "biometricCategorisationSensitive", "biometricCategorisationAny", "emotionRecognitionBiometric",
  // product route (Article 6(1))
  "safetyComponentOrProduct", "thirdPartyConformityAssessmentRequired", "onlyNonSafetyFunctions",
  // prohibited practices (Article 5)
  "manipulativeTechniques", "exploitsVulnerabilities", "socialScoring", "crimeRiskProfilingOnly",
  "untargetedFacialScraping", "infersEmotionsAtWorkOrSchool", "emotionMedicalOrSafetyPurpose",
  "realTimeRemoteBiometricIdLawEnforcement", "rbiStrictExceptionMet",
  // transparency details that only qualify a trigger
  "aiNatureObvious", "onlyAssistiveEditing", "generatesDeepFakes", "publishesTextOnPublicInterest", "humanEditorialControl",
  // general-purpose AI
  "providesGpaiModel",
  // organisation details that only matter when stated
  "isPublicBody", "privateEntityProvidingPublicServices", "isFinancialInstitution", "isEmployerUsingAtWorkplace",
  "usedByPublicAuthorities", "significantDesignChangeSinceLaunch", "buildsOnThirdPartyModel",
];

export interface Assumption {
  fact: string;
  value: boolean | string;
  /** The question that would confirm or correct it. */
  ask: string;
}

/**
 * Returns the profile the rules actually run on, plus the assumptions that were made to get there.
 * `designatedSystemicRiskByCommission` is only defaulted when a GPAI model is in play.
 */
export function applyDefaults(profile: Profile): { effective: Profile; assumptions: Assumption[] } {
  const effective: Record<string, unknown> = { ...profile };
  const assumptions: Assumption[] = [];

  const set = (key: Defaulted, value: boolean | string) => {
    if (effective[key] !== undefined) return;
    effective[key] = value;
    assumptions.push({ fact: key, value, ask: FACT_META[key].ask });
  };

  for (const key of FALSE_BY_DEFAULT) set(key, false);

  set("intimateImageryRisk", "none");
  set("csamRisk", "none");
  if (effective.safetyComponentOrProduct === false) set("annex1Legislation", "none");
  if (effective.providesGpaiModel === true) set("designatedSystemicRiskByCommission", false);

  return { effective: effective as Profile, assumptions };
}
