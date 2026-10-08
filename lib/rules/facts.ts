import { z } from "zod";
import { ANNEX3_IDS, ANNEX1_IDS } from "@/lib/rules/pack/catalogues";

/**
 * The system profile: every fact the rules turn on.
 *
 * Every field is optional and UNKNOWN when absent. The chat model fills in only what the user
 * actually said (it must never guess); the engine reports what is still missing as questions.
 * The `.describe()` text doubles as the extraction instruction for the model, so it states the
 * legal test in plain words.
 */
const tri = (description: string) => z.boolean().optional().describe(description);

export const ProfileSchema = z.object({
  summary: z.string().max(300).optional().describe("One-line description of the system in the user's own terms, for display."),

  // ---- Scope: Articles 2 and 3 ----
  isAiSystem: tri("True if the system infers from its inputs how to generate outputs (predictions, content, recommendations, decisions) with some autonomy (Article 3(1)). False for plain rule-based software or simple statistics that only apply rules people wrote."),
  euNexus: tri("True if the system is or will be placed on the EU market or put into service in the EU, or the deployer is in the EU, or the system's output is used in the EU (Article 2(1))."),
  militaryOnly: tri("True if used exclusively for military, defence or national security purposes (Article 2(3))."),
  researchOnly: tri("True if developed and put into service solely for scientific research and development (Article 2(6))."),
  preMarketDevelopmentOnly: tri("True if this is only research, testing or development before the system is placed on the market or put into service. Real-world testing does not count as this (Article 2(8))."),
  personalNonProfessionalUse: tri("True if the user is a natural person using the system purely personally and non-professionally (Article 2(10))."),
  freeOpenSourceLicence: tri("True if the system is released under a free and open-source licence (Article 2(12))."),

  // ---- Roles: Articles 3 and 25 ----
  developsOrCommissionsSystem: tri("True if the organisation develops the AI system, or has it developed, and places it on the market or puts it into service under its own name or trademark (the 'provider'). Building a product on top of a third-party model still counts."),
  usesSystemProfessionally: tri("True if the organisation uses an AI system under its own authority in a professional context (the 'deployer'), whether it built it or bought it."),
  importsSystem: tri("True if an EU-established organisation places on the EU market an AI system that carries the name or trademark of a non-EU company (the 'importer')."),
  distributesSystem: tri("True if the organisation makes an AI system available on the EU market without being its provider or importer (the 'distributor')."),
  productManufacturerOwnName: tri("True if the organisation places an AI system on the market together with its own product, under its own name or trademark."),
  providerEstablishedInEu: tri("True if the provider is established in the EU. False if the provider is in a third country."),
  rebrandsHighRiskSystem: tri("True if the organisation puts its own name or trademark on a high-risk AI system that is already on the market (Article 25(1)(a))."),
  substantiallyModifiesHighRiskSystem: tri("True if the organisation makes a substantial modification to a high-risk AI system already on the market and it stays high-risk (Article 25(1)(b))."),
  changesPurposeToHighRisk: tri("True if the organisation changes the intended purpose of an AI system (including a general-purpose one) that was not high-risk, so that it becomes high-risk (Article 25(1)(c))."),
  buildsOnThirdPartyModel: tri("True if the system is built on a third-party general-purpose AI model or API (for example a hosted LLM). Informational: it makes the organisation a downstream provider of the system."),

  // ---- Annex III (areas 2-8) and the Article 6(3) exception ----
  annex3UseCases: z.array(z.enum(ANNEX3_IDS)).optional().describe("The Annex III use cases (areas 2 to 8) the system is intended for. Use an EMPTY array only when the user's description clearly matches none; omit the field if you cannot tell yet. Biometric uses (Annex III point 1) are covered by separate facts below."),
  profilesPeople: tri("True if the system performs profiling of natural persons: automated processing of personal data to evaluate personal aspects such as performance at work, economic situation, reliability, behaviour or location (GDPR Article 4(4)). Ranking or scoring candidates, borrowers or students usually is."),
  materiallyInfluencesDecisions: tri("True if the system's output decides, ranks, scores or materially influences a decision about people with no meaningful human review."),
  narrowProceduralTask: tri("True if the system only performs a narrow procedural task (Article 6(3)(a))."),
  improvesCompletedHumanWork: tri("True if the system only improves the result of a human activity that was already completed (Article 6(3)(b))."),
  detectsDecisionPatternsOnly: tri("True if the system only detects decision patterns or deviations from earlier decisions and is not meant to replace or influence the human assessment without proper human review (Article 6(3)(c))."),
  preparatoryTaskOnly: tri("True if the system only performs a preparatory task to an assessment relevant to the Annex III use cases (Article 6(3)(d))."),

  // ---- Biometrics: Annex III point 1, Articles 3, 5 and 50 ----
  remoteBiometricIdentification: tri("True if the system identifies people at a distance, without their active involvement, by comparing biometric data with a reference database (Annex III 1(a)). One-to-one verification of a claimed identity does not count."),
  biometricCategorisationSensitive: tri("True if the system assigns people to categories based on biometric data to infer race, political opinions, trade union membership, religious or philosophical beliefs, sex life or sexual orientation (Annex III 1(b), Article 5(1)(g))."),
  biometricCategorisationAny: tri("True if the system assigns people to any categories based on their biometric data (Article 3(40)). Purely ancillary categorisation that is strictly necessary for a commercial service does not count."),
  emotionRecognitionBiometric: tri("True if the system identifies or infers emotions or intentions of people from their BIOMETRIC data such as face, voice or gait (Article 3(39)). Analysing the sentiment of written text is not biometric emotion recognition."),

  // ---- Annex I product route: Article 6(1) ----
  safetyComponentOrProduct: tri("True if the system is a safety component of a product, or is itself a product, covered by the EU harmonisation legislation in Annex I (for example medical devices, machinery, toys, vehicles, lifts)."),
  annex1Legislation: z.enum(ANNEX1_IDS).optional().describe("Which Annex I legislation covers the product, or 'none'. Omit if unknown."),
  thirdPartyConformityAssessmentRequired: tri("True if that product must undergo a third-party conformity assessment under that legislation. A requirement arising solely from non-safety risks such as radio spectrum does not count (Article 6(1c))."),
  onlyNonSafetyFunctions: tri("True if the AI system is used solely for non-safety aspects such as user assistance, performance optimisation, service efficiency, automation, convenience or quality control (Article 6(1a)). It does not count if its failure would endanger health or safety (Article 6(1b))."),

  // ---- Prohibited practices: Article 5 ----
  manipulativeTechniques: tri("True if the system uses subliminal, purposefully manipulative or deceptive techniques that materially distort people's behaviour and are likely to cause significant harm (Article 5(1)(a))."),
  exploitsVulnerabilities: tri("True if the system exploits vulnerabilities due to age, disability or a specific social or economic situation in a way likely to cause significant harm (Article 5(1)(b))."),
  socialScoring: tri("True if the system evaluates or classifies people over time based on social behaviour or personal characteristics, leading to detrimental treatment in unrelated contexts or unjustified or disproportionate treatment (Article 5(1)(c))."),
  crimeRiskProfilingOnly: tri("True if the system predicts the risk that a person will commit a crime based solely on profiling or personality traits (Article 5(1)(d))."),
  untargetedFacialScraping: tri("True if the system builds or expands facial recognition databases through untargeted scraping of facial images from the internet or CCTV (Article 5(1)(e))."),
  infersEmotionsAtWorkOrSchool: tri("True if the system infers the emotions of people in a workplace or an education institution (Article 5(1)(f))."),
  emotionMedicalOrSafetyPurpose: tri("True if that emotion inference is intended for medical or safety reasons (the exception in Article 5(1)(f))."),
  realTimeRemoteBiometricIdLawEnforcement: tri("True if the system is a real-time remote biometric identification system used in publicly accessible spaces for law enforcement (Article 5(1)(h))."),
  rbiStrictExceptionMet: tri("True only if that use falls within one of the narrow permitted objectives of Article 5(1)(h) and has the required prior authorisation (Article 5(2)-(3))."),
  intimateImageryRisk: z.enum(["none", "intended_purpose", "foreseeable_without_safeguards", "foreseeable_but_safeguarded"]).optional().describe("Can the system generate or manipulate realistic intimate or sexually explicit imagery of identifiable real people without their consent? 'intended_purpose'; 'foreseeable_without_safeguards' (a reasonably foreseeable, reproducible output with no adequate safeguards); 'foreseeable_but_safeguarded' (adequate safeguards reliably prevent it); or 'none' (Article 5(1)(ba), added by the Omnibus)."),
  csamRisk: z.enum(["none", "intended_purpose", "foreseeable_without_safeguards", "foreseeable_but_safeguarded"]).optional().describe("Same scale for generating or manipulating child sexual abuse material (Article 5(1)(bb), added by the Omnibus)."),

  // ---- Transparency: Article 50 ----
  interactsDirectlyWithPeople: tri("True if the system is intended to interact directly with people (a chatbot, voice assistant, and so on) (Article 50(1))."),
  aiNatureObvious: tri("True if it is obvious to a reasonably well-informed, observant person from the context that they are dealing with an AI."),
  generatesSyntheticContent: tri("True if the system generates synthetic audio, image, video or text content (Article 50(2)). This includes general-purpose AI systems and LLM-based assistants."),
  onlyAssistiveEditing: tri("True if the system only performs an assistive function for standard editing or does not substantially alter the input data or its meaning (the exception in Article 50(2))."),
  generatesDeepFakes: tri("True if the system generates or manipulates image, audio or video that resembles real people, objects, places or events and would falsely appear authentic (a deep fake, Article 50(4))."),
  publishesTextOnPublicInterest: tri("True if AI-generated or manipulated text is published to inform the public on matters of public interest (Article 50(4))."),
  humanEditorialControl: tri("True if such published text has undergone human review or editorial control and a person holds editorial responsibility."),

  // ---- General-purpose AI models: Articles 51-55 ----
  providesGpaiModel: tri("True if the organisation develops a general-purpose AI model (significant generality, can competently perform a wide range of tasks, integrable into many systems) and places it on the market. Merely building on a third-party model does NOT count."),
  trainingComputeFlop: z.number().positive().optional().describe("Cumulative compute used to train that model, in floating-point operations. The systemic-risk presumption applies above 1e25 (Article 51(2))."),
  designatedSystemicRiskByCommission: tri("True if the Commission has designated the model as having systemic risk (Article 51(1)(b))."),
  modelOpenSourcePublicWeights: tri("True if the model is released under a free and open-source licence with publicly available weights, architecture and usage information (Article 53(2))."),
  modelPlacedOnMarketDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("ISO date (YYYY-MM-DD) the GPAI model was or will be placed on the market."),

  // ---- Timing ----
  placedOnMarketDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("ISO date (YYYY-MM-DD) the AI system was, or is planned to be, first placed on the market or put into service."),
  significantDesignChangeSinceLaunch: tri("True if the system has undergone, or will undergo, significant changes in its design after it was first placed on the market (Article 111(2))."),
  usedByPublicAuthorities: tri("True if the high-risk system is intended to be used by public authorities (Article 111(2) gives them until 2 August 2030)."),

  // ---- Organisation ----
  organisationSize: z.enum(["micro", "small", "medium", "small_midcap", "large"]).optional().describe("Size of the organisation: micro, small or medium enterprise (SME), small mid-cap (SMC), or large."),
  isPublicBody: tri("True if the deployer is a body governed by public law (Article 27(1))."),
  privateEntityProvidingPublicServices: tri("True if the deployer is a private entity providing public services (Article 27(1))."),
  isFinancialInstitution: tri("True if the deployer is a financial institution subject to EU financial-services governance rules (Article 26(5)-(6))."),
  isEmployerUsingAtWorkplace: tri("True if the deployer is an employer using the system at the workplace on its workers (Article 26(7))."),
});

export type Profile = z.infer<typeof ProfileSchema>;
export type FactKey = keyof Profile;

export type FactGroup =
  | "scope"
  | "role"
  | "purpose"
  | "biometrics"
  | "product"
  | "prohibited"
  | "transparency"
  | "gpai"
  | "timing"
  | "organisation";

export interface FactMeta {
  group: FactGroup;
  /** Counts toward "how complete is the profile". */
  core?: boolean;
  /** The question to put to the user, in plain language. */
  ask: string;
  /** Why it matters, in one short clause. */
  why: string;
}

export const GROUP_ORDER: FactGroup[] = [
  "scope", "role", "purpose", "biometrics", "product", "prohibited", "transparency", "gpai", "timing", "organisation",
];

export const FACT_META: Record<Exclude<FactKey, "summary">, FactMeta> = {
  isAiSystem: { group: "scope", core: true, ask: "Does the system learn from data or infer its outputs (not just follow fixed rules that people wrote)?", why: "Only AI systems as defined in Article 3(1) are covered." },
  euNexus: { group: "scope", core: true, ask: "Will the system be offered in the EU, used by an EU-based organisation, or will its output be used in the EU?", why: "The Act applies to systems with an EU connection (Article 2(1))." },
  militaryOnly: { group: "scope", ask: "Is it used exclusively for military, defence or national security?", why: "Those uses are excluded (Article 2(3))." },
  researchOnly: { group: "scope", ask: "Is it built solely for scientific research?", why: "Research-only systems are excluded (Article 2(6))." },
  preMarketDevelopmentOnly: { group: "scope", ask: "Is it still only in development or testing, not yet offered to anyone?", why: "Pre-market development is outside the Act, but real-world testing is not (Article 2(8))." },
  personalNonProfessionalUse: { group: "scope", ask: "Is it used only by individuals for purely personal purposes?", why: "Personal non-professional use is excluded (Article 2(10))." },
  freeOpenSourceLicence: { group: "scope", ask: "Is the system released under a free and open-source licence?", why: "Open-source systems are largely exempt unless they are high-risk, prohibited or subject to Article 50 (Article 2(12))." },

  developsOrCommissionsSystem: { group: "role", core: true, ask: "Did your organisation build the system (or have it built) and offer it under your own name?", why: "That makes you the 'provider', which carries most of the obligations." },
  usesSystemProfessionally: { group: "role", core: true, ask: "Does your organisation use the system in its own professional activities?", why: "That makes you a 'deployer', with its own obligations." },
  importsSystem: { group: "role", ask: "Do you bring a non-EU company's AI system onto the EU market under its name?", why: "Importers have their own duties (Article 23)." },
  distributesSystem: { group: "role", ask: "Do you resell or distribute an AI system built by someone else?", why: "Distributors have their own duties (Article 24)." },
  productManufacturerOwnName: { group: "role", ask: "Do you sell a product with an AI system built in, under your own brand?", why: "Product manufacturers can be treated as the provider (Article 25(3))." },
  providerEstablishedInEu: { group: "role", ask: "Is the provider (the company that builds it) established in the EU?", why: "Non-EU providers must appoint an EU authorised representative (Articles 22 and 54)." },
  rebrandsHighRiskSystem: { group: "role", ask: "Do you put your own name on a high-risk AI system someone else built?", why: "Doing so makes you the provider (Article 25(1)(a))." },
  substantiallyModifiesHighRiskSystem: { group: "role", ask: "Do you substantially modify a high-risk system that is already on the market?", why: "That makes you the provider (Article 25(1)(b))." },
  changesPurposeToHighRisk: { group: "role", ask: "Do you use a system for a new purpose that makes it high-risk?", why: "That makes you the provider (Article 25(1)(c))." },
  buildsOnThirdPartyModel: { group: "role", ask: "Is the system built on someone else's AI model or API?", why: "It makes you a downstream provider and brings supply-chain duties." },

  annex3UseCases: { group: "purpose", core: true, ask: "What is the system used for? For example hiring, credit decisions, education, essential services, law enforcement, migration, justice.", why: "A use case listed in Annex III makes a system high-risk." },
  profilesPeople: { group: "purpose", core: true, ask: "Does it evaluate or predict personal aspects of individuals, such as performance, reliability, behaviour or creditworthiness?", why: "Profiling always keeps an Annex III system high-risk (Article 6(3))." },
  materiallyInfluencesDecisions: { group: "purpose", ask: "Does its output decide, rank or materially influence decisions about people, without meaningful human review?", why: "It decides whether the Article 6(3) exception can apply." },
  narrowProceduralTask: { group: "purpose", ask: "Does it only do a narrow procedural task, such as converting a document format?", why: "One of the four Article 6(3) exception conditions." },
  improvesCompletedHumanWork: { group: "purpose", ask: "Does it only improve the result of work a person already finished?", why: "One of the four Article 6(3) exception conditions." },
  detectsDecisionPatternsOnly: { group: "purpose", ask: "Does it only spot patterns or deviations in past human decisions, without replacing the human review?", why: "One of the four Article 6(3) exception conditions." },
  preparatoryTaskOnly: { group: "purpose", ask: "Does it only prepare material for a human assessment?", why: "One of the four Article 6(3) exception conditions." },

  remoteBiometricIdentification: { group: "biometrics", ask: "Does it identify people at a distance by matching their face, voice or other biometrics against a database?", why: "Remote biometric identification is high-risk (Annex III 1(a))." },
  biometricCategorisationSensitive: { group: "biometrics", ask: "Does it use biometrics to infer race, political opinions, religion, union membership, sex life or sexual orientation?", why: "That is prohibited (Article 5(1)(g))." },
  biometricCategorisationAny: { group: "biometrics", ask: "Does it sort people into categories using their biometric data?", why: "Triggers a duty to inform people exposed to it (Article 50(3))." },
  emotionRecognitionBiometric: { group: "biometrics", ask: "Does it infer emotions from faces, voices or other biometric data? (Reading the sentiment of written text does not count.)", why: "Emotion recognition is high-risk and needs disclosure; at work or school it is prohibited." },

  safetyComponentOrProduct: { group: "product", core: true, ask: "Is the system a safety component of a regulated product (medical device, machinery, vehicle, toy, lift...), or itself such a product?", why: "That can make it high-risk through the product route (Article 6(1))." },
  annex1Legislation: { group: "product", ask: "Which EU product law covers that product?", why: "It decides the timeline and whether Chapter III applies directly." },
  thirdPartyConformityAssessmentRequired: { group: "product", ask: "Does that product need a third-party conformity assessment (a notified body)?", why: "Both conditions of Article 6(1) must hold." },
  onlyNonSafetyFunctions: { group: "product", ask: "Does the AI only do non-safety things such as convenience, optimisation or quality control?", why: "Such systems do not count as safety components (Article 6(1a))." },

  manipulativeTechniques: { group: "prohibited", core: true, ask: "Does it use subliminal or manipulative techniques that distort people's behaviour and could cause significant harm?", why: "Prohibited (Article 5(1)(a))." },
  exploitsVulnerabilities: { group: "prohibited", core: true, ask: "Does it exploit people's age, disability or social or economic situation?", why: "Prohibited (Article 5(1)(b))." },
  socialScoring: { group: "prohibited", core: true, ask: "Does it score people over time on their behaviour or traits, with consequences in unrelated contexts?", why: "Prohibited (Article 5(1)(c))." },
  crimeRiskProfilingOnly: { group: "prohibited", ask: "Does it predict whether someone will commit a crime based only on profiling or personality?", why: "Prohibited (Article 5(1)(d))." },
  untargetedFacialScraping: { group: "prohibited", ask: "Does it scrape faces from the internet or CCTV to build recognition databases?", why: "Prohibited (Article 5(1)(e))." },
  infersEmotionsAtWorkOrSchool: { group: "prohibited", core: true, ask: "Does it infer the emotions of employees or students?", why: "Prohibited at work and in education (Article 5(1)(f))." },
  emotionMedicalOrSafetyPurpose: { group: "prohibited", ask: "Is that emotion inference only for medical or safety reasons?", why: "The only exception to Article 5(1)(f)." },
  realTimeRemoteBiometricIdLawEnforcement: { group: "prohibited", ask: "Is it a live, real-time biometric identification system used by police in public spaces?", why: "Prohibited except for narrow, authorised cases (Article 5(1)(h))." },
  rbiStrictExceptionMet: { group: "prohibited", ask: "Does that use fall within one of the narrow permitted objectives, with prior judicial or independent authorisation?", why: "The only way real-time remote biometric identification is allowed (Article 5(2)-(3))." },
  intimateImageryRisk: { group: "prohibited", core: true, ask: "Can it generate sexually explicit or intimate imagery of real, identifiable people? If so, are there safeguards that reliably prevent it?", why: "Prohibited from 2 December 2026 (Article 5(1)(ba))." },
  csamRisk: { group: "prohibited", core: true, ask: "Can it generate child sexual abuse material? If so, are there safeguards that reliably prevent it?", why: "Prohibited from 2 December 2026 (Article 5(1)(bb))." },

  interactsDirectlyWithPeople: { group: "transparency", core: true, ask: "Does it talk or interact directly with people, such as a chatbot or voice assistant?", why: "People must be told they are dealing with an AI (Article 50(1))." },
  aiNatureObvious: { group: "transparency", ask: "Would it be obvious to a typical user that they are dealing with an AI?", why: "Obvious cases are exempt from the disclosure duty." },
  generatesSyntheticContent: { group: "transparency", core: true, ask: "Does it generate text, images, audio or video?", why: "Outputs must be marked as AI-generated in a machine-readable way (Article 50(2))." },
  onlyAssistiveEditing: { group: "transparency", ask: "Does it only assist with standard editing, without substantially changing the content?", why: "Exempt from the marking duty (Article 50(2))." },
  generatesDeepFakes: { group: "transparency", ask: "Can it create realistic fake images, audio or video of real people, places or events?", why: "Deep fakes must be disclosed (Article 50(4))." },
  publishesTextOnPublicInterest: { group: "transparency", ask: "Is AI-written text published to inform the public on matters of public interest?", why: "It must be disclosed as AI-generated (Article 50(4))." },
  humanEditorialControl: { group: "transparency", ask: "Does a person review and take editorial responsibility for that text?", why: "That removes the disclosure duty (Article 50(4))." },

  providesGpaiModel: { group: "gpai", core: true, ask: "Do you train your own general-purpose AI model and release it to others?", why: "General-purpose model providers have their own obligations (Articles 53-55)." },
  trainingComputeFlop: { group: "gpai", ask: "Roughly how much compute (FLOPs) was used to train the model?", why: "Above 10^25 the model is presumed to have systemic risk (Article 51(2))." },
  designatedSystemicRiskByCommission: { group: "gpai", ask: "Has the Commission designated the model as having systemic risk?", why: "Designation brings the extra obligations of Article 55." },
  modelOpenSourcePublicWeights: { group: "gpai", ask: "Are the model's weights and architecture published under an open-source licence?", why: "Open-source models are exempt from some duties unless they have systemic risk (Article 53(2))." },
  modelPlacedOnMarketDate: { group: "gpai", ask: "When was the model first released?", why: "Models released before 2 August 2025 have until 2 August 2027 (Article 111(3))." },

  placedOnMarketDate: { group: "timing", core: true, ask: "When was, or will, the system first be launched in the EU?", why: "Systems on the market before the high-risk start date are only covered after significant design changes (Article 111(2))." },
  significantDesignChangeSinceLaunch: { group: "timing", ask: "Has the system changed significantly in design since launch, or will it?", why: "It ends the transitional relief for systems already on the market." },
  usedByPublicAuthorities: { group: "timing", ask: "Is the system meant to be used by public authorities?", why: "Such systems have a final compliance deadline of 2 August 2030 (Article 111(2))." },

  organisationSize: { group: "organisation", core: true, ask: "How large is your organisation: micro, small, medium, small mid-cap or large?", why: "SMEs and small mid-caps get lighter documentation and capped fines." },
  isPublicBody: { group: "organisation", ask: "Is the deploying organisation a public body?", why: "Public bodies must carry out a fundamental rights impact assessment (Article 27)." },
  privateEntityProvidingPublicServices: { group: "organisation", ask: "Is the deploying organisation a private company providing public services?", why: "It must carry out a fundamental rights impact assessment (Article 27)." },
  isFinancialInstitution: { group: "organisation", ask: "Is the deployer a financial institution?", why: "Some monitoring and logging duties are met through financial-services rules (Article 26)." },
  isEmployerUsingAtWorkplace: { group: "organisation", ask: "Is the system used by an employer on its own workers?", why: "Employers must inform workers before use (Article 26(7))." },
};

export const CORE_FACTS = (Object.keys(FACT_META) as Array<keyof typeof FACT_META>).filter((k) => FACT_META[k].core);

/**
 * Accepts whatever the model sent and keeps every field that validates, dropping the rest, so one
 * malformed value never discards the whole profile. Unknown stays unknown.
 */
export function sanitizeProfile(input: unknown): Profile {
  const whole = ProfileSchema.safeParse(input);
  if (whole.success) return whole.data;
  const out: Record<string, unknown> = {};
  if (input && typeof input === "object") {
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      const field = (ProfileSchema.shape as Record<string, z.ZodType>)[key];
      if (!field) continue;
      const parsed = field.safeParse(value);
      if (parsed.success && parsed.data !== undefined) out[key] = parsed.data;
    }
  }
  return out as Profile;
}

/** How many of the core facts are known, for a "profile completeness" meter. */
export function completeness(profile: Profile): { known: number; total: number } {
  const known = CORE_FACTS.filter((k) => profile[k] !== undefined).length;
  return { known, total: CORE_FACTS.length };
}
