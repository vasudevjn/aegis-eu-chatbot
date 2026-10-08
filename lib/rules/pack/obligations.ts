import type { Cond, Context } from "@/lib/rules/logic";
import type { DateKey, Obligation } from "@/lib/rules/types";
import { act, omni } from "@/lib/rules/pack/cite";

/**
 * The obligation catalogue: what each classification means in practice, for whom, by whom and with
 * what evidence. Each entry names the timeline entry that governs it (never a hard-coded date).
 * "when" reads the flags set by the classification rules and pack/derived.ts.
 *
 * Source pages are in the Official Journal PDFs (OJ 2024/1689 and OJ 2026/1744).
 */

const t = (k: string): Cond => ({ k, is: true });
const all = (...c: Cond[]): Cond => ({ all: c });

/** High-risk duties start on the Annex III date, or the Annex I date when only that route applies. */
const hrDate = (ctx: Context): DateKey =>
  ctx["d.hrAnnex3"] === true ? "hr_annex3" : ctx["d.hrAnnex1A"] === true ? "hr_annex1" : "hr_annex3";

const PROVIDER_HR = all(t("d.chapter3"), t("d.provider"));
const DEPLOYER_HR = all(t("d.chapter3"), t("d.deployer"));

export const OBLIGATIONS: Obligation[] = [
  // ------------------------------------------------------------------ basics
  {
    id: "O_AI_LITERACY", group: "Basics", title: "AI literacy",
    what: "Take measures to support the AI literacy of staff and other people who operate or use AI systems on your behalf, suited to their knowledge, the context of use and the people affected. This does not require guaranteeing a specific level of literacy for any individual.",
    owner: "HR", evidence: "AI literacy policy, role-based training plan, training records",
    cites: [omni("Art. 4", 16), act("Art. 4", 4, 51)], roles: ["provider", "deployer"],
    when: all(t("d.inScope"), { any: [t("d.provider"), t("d.deployer")] }), date: "ch1_2", fine: "member_state",
  },

  // ------------------------------------------------------------------ prohibited practices
  {
    id: "O_STOP_PROHIBITED", group: "Prohibited practices", title: "Stop or redesign: prohibited practice",
    what: "Do not place the system on the market, put it into service or use it in this form. Redesign it so it no longer performs the prohibited practice, and involve qualified counsel promptly.",
    owner: "Leadership", evidence: "Redesign decision record, legal advice",
    cites: [act("Art. 5", 5, 51)], roles: ["provider", "deployer"],
    when: t("d.prohibitedBase"), date: "ch1_2", fine: "art5",
  },
  {
    id: "O_STOP_PROHIBITED_NEW", group: "Prohibited practices", title: "Stop or redesign: newly prohibited practice (from 2 December 2026)",
    what: "From 2 December 2026 you may not place on the market, put into service or use a system that generates non-consensual intimate imagery or child sexual abuse material (including as a reasonably foreseeable output without adequate safeguards). Redesign or add reliable safeguards before then, and involve counsel.",
    owner: "Leadership", evidence: "Redesign decision record, safeguard testing evidence, legal advice",
    cites: [omni("Art. 5(1)(ba), (bb), (1a), (1b)", 18), omni("Art. 113(a)", 35)], roles: ["provider", "deployer"],
    when: t("d.prohibitedNew"), date: "art5_new", fine: "art5",
  },

  // ------------------------------------------------------------------ high-risk: provider
  {
    id: "O_HR_RISK_MANAGEMENT", group: "High-risk: provider", title: "Risk management system",
    what: "Run a continuous, documented risk management process across the whole lifecycle: identify and analyse known and foreseeable risks to health, safety and fundamental rights, evaluate them (including under reasonably foreseeable misuse), adopt targeted measures, and test against defined metrics before launch. Consider adverse impact on people under 18 and other vulnerable groups.",
    owner: "Legal / Compliance", evidence: "Risk management file, test plans and reports",
    cites: [act("Art. 9", 9, 56)], roles: ["provider"], when: PROVIDER_HR, date: hrDate, fine: "art99_4",
  },
  {
    id: "O_HR_DATA_GOVERNANCE", group: "High-risk: provider", title: "Data and data governance",
    what: "Govern training, validation and testing data: document design choices, data origin and preparation, check for biases likely to harm health, safety or fundamental rights or lead to discrimination, and make the data relevant, representative and as error-free as possible. Special-category data may be used for bias detection only under the strict conditions of Article 4a.",
    owner: "Data", evidence: "Data sheets, bias assessment, data quality report",
    cites: [act("Art. 10", 10, 57), omni("Art. 4a and deletion of Art. 10(5)", 17)], roles: ["provider"], when: PROVIDER_HR, date: hrDate, fine: "art99_4",
  },
  {
    id: "O_HR_TECHNICAL_DOCUMENTATION", group: "High-risk: provider", title: "Technical documentation",
    what: "Draw up technical documentation before launch and keep it up to date, covering at least the elements of Annex IV. SMEs and small mid-caps may use the Commission's simplified form.",
    owner: "Engineering", evidence: "Annex IV technical file",
    cites: [act("Art. 11", 11, 58), act("Annex IV", "IV", 130), omni("Art. 11(1)", 19)], roles: ["provider"], when: PROVIDER_HR, date: hrDate, fine: "art99_4",
  },
  {
    id: "O_HR_LOGGING", group: "High-risk: provider", title: "Record-keeping (logging)",
    what: "Design the system so it automatically records events over its lifetime, enough to identify risk situations and substantial modifications, support post-market monitoring and let deployers monitor operation.",
    owner: "Engineering", evidence: "Logging design, sample logs",
    cites: [act("Art. 12", 12, 59)], roles: ["provider"], when: PROVIDER_HR, date: hrDate, fine: "art99_4",
  },
  {
    id: "O_HR_INSTRUCTIONS", group: "High-risk: provider", title: "Transparency and instructions for use",
    what: "Make the system transparent enough for deployers to interpret and use its output, and supply instructions for use covering your identity, intended purpose, accuracy, known risks, human oversight measures, resources and how to collect and read the logs.",
    owner: "Product", evidence: "Instructions for use for deployers",
    cites: [act("Art. 13", 13, 59)], roles: ["provider"], when: PROVIDER_HR, date: hrDate, fine: "art99_4",
  },
  {
    id: "O_HR_HUMAN_OVERSIGHT", group: "High-risk: provider", title: "Human oversight by design",
    what: "Design the system so people can effectively oversee it: understand its limits, notice anomalies, guard against over-reliance (automation bias), interpret output, decide not to use it or override it, and stop it safely.",
    owner: "Product", evidence: "Human oversight design, user-interface specification",
    cites: [act("Art. 14", 14, 60)], roles: ["provider"], when: PROVIDER_HR, date: hrDate, fine: "art99_4",
  },
  {
    id: "O_HR_ACCURACY_ROBUSTNESS_SECURITY", group: "High-risk: provider", title: "Accuracy, robustness and cybersecurity",
    what: "Achieve and declare an appropriate level of accuracy, make the system resilient to errors and faults (including feedback loops for systems that keep learning) and resilient against attacks such as data poisoning, model poisoning and adversarial examples.",
    owner: "Security", evidence: "Test results, declared accuracy metrics, security assessment",
    cites: [act("Art. 15", 15, 61)], roles: ["provider"], when: PROVIDER_HR, date: hrDate, fine: "art99_4",
  },
  {
    id: "O_HR_QMS", group: "High-risk: provider", title: "Quality management system",
    what: "Operate a documented quality management system covering regulatory compliance strategy, design and development, testing, data management, risk management, post-market monitoring, incident reporting and accountability. It may be proportionate to your size.",
    owner: "Legal / Compliance", evidence: "Quality management system documentation",
    cites: [act("Art. 17", 17, 62), omni("Art. 17(2)", 19)], roles: ["provider"], when: PROVIDER_HR, date: hrDate, fine: "art99_4",
  },
  {
    id: "O_HR_RECORDS_LOGS", group: "High-risk: provider", title: "Keep documentation and logs",
    what: "Keep the technical documentation, quality management documentation and declaration of conformity for 10 years after the system is placed on the market, and keep automatically generated logs under your control for at least six months.",
    owner: "Legal / Compliance", evidence: "Document retention policy, log retention settings",
    cites: [act("Art. 18-19", 18, 63), act("Art. 16(d)-(e)", 16, 62)], roles: ["provider"], when: PROVIDER_HR, date: hrDate, fine: "art99_4",
  },
  {
    id: "O_HR_CONFORMITY_ASSESSMENT", group: "High-risk: provider", title: "Conformity assessment before launch",
    what: "Complete the conformity assessment before placing the system on the market or putting it into service. For Annex III points 2 to 8 this is the internal-control procedure (Annex VI), with no notified body. Biometric systems (point 1) may need a notified body unless harmonised standards are fully applied. Annex I products follow their sectoral procedure. Repeat it after a substantial modification.",
    owner: "Legal / Compliance", evidence: "Conformity assessment record",
    cites: [act("Art. 43", 43, 78), omni("Art. 43(3)", 22)], roles: ["provider"], when: PROVIDER_HR, date: hrDate, fine: "art99_4",
  },
  {
    id: "O_HR_DECLARATION_CE", group: "High-risk: provider", title: "EU declaration of conformity and CE marking",
    what: "Draw up the EU declaration of conformity (Annex V) and affix the CE marking, a digital one for software, visibly and legibly.",
    owner: "Legal / Compliance", evidence: "Signed EU declaration of conformity, CE marking",
    cites: [act("Art. 47-48", 47, 80)], roles: ["provider"], when: PROVIDER_HR, date: hrDate, fine: "art99_4",
  },
  {
    id: "O_HR_REGISTRATION", group: "High-risk: provider", title: "Register in the EU database",
    what: "Register yourself and the system in the EU database before placing it on the market (for Annex III point 2 systems, registration is at national level).",
    owner: "Legal / Compliance", evidence: "EU database registration entry",
    cites: [act("Art. 49(1), (5)", 49, 81)], roles: ["provider"], when: all(PROVIDER_HR, t("d.hrAnnex3")), date: hrDate, fine: "art99_4",
  },
  {
    id: "O_HR_PROVIDER_IDENTIFICATION", group: "High-risk: provider", title: "Name, contact and accessibility",
    what: "Show your name or trademark and contact address on the system, its packaging or documentation, and make sure it meets accessibility requirements.",
    owner: "Product", evidence: "Labelling, accessibility statement",
    cites: [act("Art. 16(b), (l)", 16, 62)], roles: ["provider"], when: PROVIDER_HR, date: hrDate, fine: "art99_4",
  },
  {
    id: "O_HR_POST_MARKET_MONITORING", group: "High-risk: provider", title: "Post-market monitoring",
    what: "Establish and document a post-market monitoring system, based on a monitoring plan that is part of the technical documentation, that actively collects and analyses performance data over the system's lifetime.",
    owner: "Engineering", evidence: "Post-market monitoring plan, monitoring reports",
    cites: [act("Art. 72", 72, 101), omni("Art. 72(3)", 26)], roles: ["provider"], when: PROVIDER_HR, date: hrDate, fine: "art99_4",
  },
  {
    id: "O_HR_INCIDENT_REPORTING", group: "High-risk: provider", title: "Serious incident reporting",
    what: "Report any serious incident to the market surveillance authority of the Member State where it occurred: immediately after establishing a causal link and no later than 15 days after becoming aware; within 2 days for widespread infringements or critical-infrastructure incidents; within 10 days if a person died.",
    owner: "Legal / Compliance", evidence: "Incident response runbook, incident log",
    cites: [act("Art. 73", 73, 101)], roles: ["provider"], when: PROVIDER_HR, date: hrDate, fine: "art99_4",
  },
  {
    id: "O_HR_CORRECTIVE_ACTIONS", group: "High-risk: provider", title: "Corrective actions and cooperation with authorities",
    what: "If the system is not in conformity, bring it into conformity, withdraw, disable or recall it and inform distributors, deployers and authorities. Provide information, documentation and logs to authorities on a reasoned request.",
    owner: "Legal / Compliance", evidence: "Corrective action procedure",
    cites: [act("Art. 20-21", 20, 64)], roles: ["provider"], when: PROVIDER_HR, date: hrDate, fine: "art99_4",
  },
  {
    id: "O_HR_AUTHORISED_REPRESENTATIVE", group: "High-risk: provider", title: "Appoint an EU authorised representative",
    what: "A provider established outside the EU must appoint, by written mandate, an authorised representative established in the EU before making the system available.",
    owner: "Legal / Compliance", evidence: "Signed mandate",
    cites: [act("Art. 22", 22, 65)], roles: ["provider"], when: t("d.authRepSystem"), date: hrDate, fine: "art99_4",
  },

  // ------------------------------------------------------------------ the Article 6(3) exception
  {
    id: "O_EXC_DOCUMENT", group: "High-risk: provider", title: "Document the 'not high-risk' assessment",
    what: "If you conclude an Annex III system is not high-risk under Article 6(3), document that assessment before placing it on the market and give it to authorities on request.",
    owner: "Legal / Compliance", evidence: "Written Article 6(3) assessment",
    cites: [act("Art. 6(4)", 6, 54)], roles: ["provider"], when: all(t("d.exceptionHolds"), t("d.provider")), date: "hr_annex3", fine: "member_state",
  },
  {
    id: "O_EXC_REGISTER", group: "High-risk: provider", title: "Register the system even though it is not high-risk",
    what: "A provider relying on the Article 6(3) exception must still register itself and the system in the EU database before placing it on the market.",
    owner: "Legal / Compliance", evidence: "EU database registration entry",
    cites: [act("Art. 49(2)", 49, 81)], roles: ["provider"], when: all(t("d.exceptionHolds"), t("d.provider")), date: "hr_annex3", fine: "member_state",
  },

  // ------------------------------------------------------------------ high-risk: deployer
  {
    id: "O_DEP_USE_ACCORDING_TO_INSTRUCTIONS", group: "High-risk: deployer", title: "Use as instructed",
    what: "Take appropriate technical and organisational measures to use the system in line with the provider's instructions for use.",
    owner: "Product", evidence: "Operating procedures aligned with the instructions for use",
    cites: [act("Art. 26(1)", 26, 67)], roles: ["deployer"], when: DEPLOYER_HR, date: hrDate, fine: "art99_4",
  },
  {
    id: "O_DEP_HUMAN_OVERSIGHT", group: "High-risk: deployer", title: "Assign competent human oversight",
    what: "Assign human oversight to people with the necessary competence, training, authority and support.",
    owner: "Leadership", evidence: "Oversight roles, training records",
    cites: [act("Art. 26(2)", 26, 68)], roles: ["deployer"], when: DEPLOYER_HR, date: hrDate, fine: "art99_4",
  },
  {
    id: "O_DEP_INPUT_DATA", group: "High-risk: deployer", title: "Relevant and representative input data",
    what: "To the extent you control the input data, make sure it is relevant and sufficiently representative for the intended purpose.",
    owner: "Data", evidence: "Input data quality checks",
    cites: [act("Art. 26(4)", 26, 68)], roles: ["deployer"], when: DEPLOYER_HR, date: hrDate, fine: "art99_4",
  },
  {
    id: "O_DEP_MONITOR_REPORT", group: "High-risk: deployer", title: "Monitor operation and report risks and incidents",
    what: "Monitor the system's operation. If you have reason to think it presents a risk, inform the provider or distributor and the market surveillance authority and suspend use. Report serious incidents to the provider first, then the importer or distributor and the authorities.",
    owner: "Legal / Compliance", evidence: "Monitoring procedure, incident reports",
    cites: [act("Art. 26(5)", 26, 68)], roles: ["deployer"], when: DEPLOYER_HR, date: hrDate, fine: "art99_4",
  },
  {
    id: "O_DEP_LOGS", group: "High-risk: deployer", title: "Keep the logs",
    what: "Keep the logs the system generates automatically, to the extent under your control, for a period suited to the purpose and at least six months, unless other law says otherwise.",
    owner: "Engineering", evidence: "Log retention settings",
    cites: [act("Art. 26(6)", 26, 68)], roles: ["deployer"], when: DEPLOYER_HR, date: hrDate, fine: "art99_4",
  },
  {
    id: "O_DEP_INFORM_WORKERS", group: "High-risk: deployer", title: "Inform workers before workplace use",
    what: "Before using a high-risk system at the workplace, employers must inform workers' representatives and the affected workers that they will be subject to it.",
    owner: "HR", evidence: "Worker notification, consultation record",
    cites: [act("Art. 26(7)", 26, 68)], roles: ["deployer"], when: all(DEPLOYER_HR, t("isEmployerUsingAtWorkplace")), date: hrDate, fine: "art99_4",
  },
  {
    id: "O_DEP_PUBLIC_REGISTRATION", group: "High-risk: deployer", title: "Register use in the EU database (public authorities)",
    what: "Public authorities and EU bodies must register themselves and their use of the system in the EU database, and must not use a system that has not been registered.",
    owner: "Legal / Compliance", evidence: "EU database registration of use",
    cites: [act("Art. 26(8), Art. 49(3)", 26, 68)], roles: ["deployer"], when: all(DEPLOYER_HR, t("d.annex3NotPoint2"), t("isPublicBody")), date: hrDate, fine: "art99_4",
  },
  {
    id: "O_DEP_DPIA", group: "High-risk: deployer", title: "Data protection impact assessment",
    what: "Where it applies, use the information the provider gives you to carry out your GDPR data protection impact assessment.",
    owner: "Legal / Compliance", evidence: "Data protection impact assessment",
    cites: [act("Art. 26(9)", 26, 68)], roles: ["deployer"], when: DEPLOYER_HR, date: hrDate, fine: "art99_4",
  },
  {
    id: "O_DEP_INFORM_AFFECTED_PERSONS", group: "High-risk: deployer", title: "Tell people they are subject to the system",
    what: "Where an Annex III system makes or assists decisions about natural persons, inform those people that they are subject to its use.",
    owner: "Product", evidence: "Notice text and where it is shown",
    cites: [act("Art. 26(11)", 26, 69)], roles: ["deployer"], when: all(t("d.deployer"), t("d.decisionsAboutPeople")), date: hrDate, fine: "art99_4",
  },
  {
    id: "O_DEP_FRIA", group: "High-risk: deployer", title: "Fundamental rights impact assessment",
    what: "Before first use, assess the impact on fundamental rights: the processes it is used in, how long and how often, who is likely to be affected, specific risks of harm, human oversight measures, and what happens if risks materialise (governance and complaints). You may cross-refer to your data protection impact assessment.",
    owner: "Legal / Compliance", evidence: "Fundamental rights impact assessment, notification to the market surveillance authority",
    cites: [act("Art. 27", 27, 69), omni("Art. 27(4)-(5)", 20)], roles: ["deployer"], when: all(t("d.deployer"), t("d.fria")), date: hrDate, fine: "art99_4",
  },
  {
    id: "O_DEP_EXPLANATION", group: "High-risk: deployer", title: "Right to an explanation",
    what: "A person affected by a decision you take on the basis of the system's output, with legal or similarly significant effects, has the right to a clear and meaningful explanation of the system's role and the main elements of the decision. Be ready to give it.",
    owner: "Product", evidence: "Explanation procedure and templates",
    cites: [act("Art. 86", 86, 110)], roles: ["deployer"], when: all(t("d.deployer"), t("d.decisionsAboutPeople")), date: hrDate, fine: "member_state",
  },

  // ------------------------------------------------------------------ importers and distributors
  {
    id: "O_IMP_VERIFY", group: "High-risk: importers and distributors", title: "Importer checks before placing on the market",
    what: "Verify that the provider carried out the conformity assessment, drew up the technical documentation, applied the CE marking, supplied the declaration and instructions, and appointed an authorised representative. Keep the key documents for 10 years and show your name and contact address.",
    owner: "Legal / Compliance", evidence: "Importer verification checklist",
    cites: [act("Art. 23", 23, 65)], roles: ["importer"], when: all(t("d.chapter3"), t("d.importer")), date: hrDate, fine: "art99_4",
  },
  {
    id: "O_DIST_VERIFY", group: "High-risk: importers and distributors", title: "Distributor checks before making available",
    what: "Verify the CE marking, the declaration of conformity and instructions for use, and that the provider and importer met their obligations. Do not make a non-conforming system available, and take corrective action if you find one.",
    owner: "Legal / Compliance", evidence: "Distributor verification checklist",
    cites: [act("Art. 24", 24, 66)], roles: ["distributor"], when: all(t("d.chapter3"), t("d.distributor")), date: hrDate, fine: "art99_4",
  },

  // ------------------------------------------------------------------ value chain
  {
    id: "O_ART25_PROVIDER_DUTIES", group: "Value chain", title: "You have become the provider",
    what: "Because you rebrand, substantially modify or repurpose a high-risk system, you are treated as its provider and carry all provider obligations. The original provider must cooperate and hand over documentation and technical access.",
    owner: "Leadership", evidence: "Allocation of provider responsibilities, handover documentation",
    cites: [act("Art. 25(1)-(2)", 25, 67), omni("Art. 25(2)", 19)], roles: ["provider"], when: t("d.art25Shift"), date: hrDate, fine: "art99_4",
  },
  {
    id: "O_ART25_SUPPLIER_AGREEMENTS", group: "Value chain", title: "Written agreements with suppliers",
    what: "Agree in writing with third parties that supply AI systems, models, tools, components or processes you integrate into a high-risk system, so you get the information, capabilities and technical access you need to comply.",
    owner: "Legal / Compliance", evidence: "Supplier contracts with compliance annexes",
    cites: [act("Art. 25(4)", 25, 67), omni("Art. 25(4)", 20)], roles: ["provider"], when: all(PROVIDER_HR, t("buildsOnThirdPartyModel")), date: hrDate, fine: "art99_4",
  },

  // ------------------------------------------------------------------ transparency
  {
    id: "O_T50_1_DISCLOSE_AI", group: "Transparency", title: "Tell users they are interacting with an AI",
    what: "Design and develop the system so people are informed they are interacting with an AI system, in a clear and distinguishable way at the latest at the first interaction, meeting accessibility requirements, unless it is obvious from the context.",
    owner: "Product", evidence: "Screenshot or UX specification of the disclosure, accessibility check",
    cites: [act("Art. 50(1), (5)", 50, 82)], roles: ["provider"], when: t("d.t50_1"), date: "art50", fine: "art99_4",
  },
  {
    id: "O_T50_2_MARK_CONTENT", group: "Transparency", title: "Mark generated content as AI-generated",
    what: "Mark synthetic audio, image, video and text outputs in a machine-readable format so they are detectable as artificially generated or manipulated, using solutions that are effective, interoperable, robust and reliable as far as technically feasible (for example watermarks, metadata, provenance).",
    owner: "Engineering", evidence: "Marking design, test results, decision record if an exception is relied on",
    cites: [act("Art. 50(2)", 50, 82), omni("Art. 111(4)", 35)], roles: ["provider"], when: t("d.t50_2"), date: "art50_2_legacy", fine: "art99_4",
  },
  {
    id: "O_T50_3_INFORM_EXPOSED", group: "Transparency", title: "Inform people exposed to emotion recognition or biometric categorisation",
    what: "Inform the people exposed to the system about how it operates, and process their personal data in line with data protection law.",
    owner: "Product", evidence: "Notice text, data protection review",
    cites: [act("Art. 50(3)", 50, 82)], roles: ["deployer"], when: all(t("d.t50_3"), t("d.deployer")), date: "art50", fine: "art99_4",
  },
  {
    id: "O_T50_4A_DISCLOSE_DEEPFAKE", group: "Transparency", title: "Disclose deep fakes",
    what: "Disclose that image, audio or video content was artificially generated or manipulated. For evidently artistic, creative, satirical or fictional works, disclose in a way that does not hamper enjoyment of the work.",
    owner: "Product", evidence: "Labelling approach and examples",
    cites: [act("Art. 50(4)", 50, 82)], roles: ["deployer"], when: all(t("d.t50_4a"), t("d.deployer")), date: "art50", fine: "art99_4",
  },
  {
    id: "O_T50_4B_DISCLOSE_TEXT", group: "Transparency", title: "Disclose AI-generated public-interest text",
    what: "Disclose that text published to inform the public on matters of public interest was artificially generated or manipulated, unless it was human-reviewed under editorial responsibility.",
    owner: "Product", evidence: "Publication policy, editorial responsibility record",
    cites: [act("Art. 50(4)", 50, 82)], roles: ["deployer"], when: all(t("d.t50_4b"), t("d.deployer")), date: "art50", fine: "art99_4",
  },

  // ------------------------------------------------------------------ general-purpose AI models
  {
    id: "O_GPAI_TECH_DOC", group: "General-purpose AI models", title: "Model technical documentation",
    what: "Draw up and keep up to date technical documentation of the model, including its training and testing process and evaluation results (Annex XI), for the AI Office and national authorities on request.",
    owner: "Engineering", evidence: "Annex XI model documentation",
    cites: [act("Art. 53(1)(a)", 53, 84)], roles: ["gpai_provider"], when: all(t("d.gpai"), { not: t("d.gpaiOpenSourceExempt") }), date: "gpai", fine: "gpai",
  },
  {
    id: "O_GPAI_DOWNSTREAM_INFO", group: "General-purpose AI models", title: "Information for downstream providers",
    what: "Give providers who integrate your model the information they need to understand its capabilities and limitations and meet their own obligations (Annex XII).",
    owner: "Product", evidence: "Annex XII downstream documentation",
    cites: [act("Art. 53(1)(b)", 53, 84)], roles: ["gpai_provider"], when: all(t("d.gpai"), { not: t("d.gpaiOpenSourceExempt") }), date: "gpai", fine: "gpai",
  },
  {
    id: "O_GPAI_COPYRIGHT_POLICY", group: "General-purpose AI models", title: "Copyright policy",
    what: "Put in place a policy to comply with EU copyright law, in particular to identify and respect text-and-data-mining opt-outs.",
    owner: "Legal / Compliance", evidence: "Copyright compliance policy",
    cites: [act("Art. 53(1)(c)", 53, 84)], roles: ["gpai_provider"], when: t("d.gpai"), date: "gpai", fine: "gpai",
  },
  {
    id: "O_GPAI_TRAINING_SUMMARY", group: "General-purpose AI models", title: "Public summary of training content",
    what: "Publish a sufficiently detailed summary of the content used to train the model, using the AI Office template.",
    owner: "Product", evidence: "Published training content summary",
    cites: [act("Art. 53(1)(d)", 53, 84)], roles: ["gpai_provider"], when: t("d.gpai"), date: "gpai", fine: "gpai",
  },
  {
    id: "O_GPAI_AUTHORISED_REPRESENTATIVE", group: "General-purpose AI models", title: "Appoint an EU authorised representative",
    what: "A model provider established outside the EU must appoint an authorised representative in the EU before placing the model on the market (open-source models without systemic risk are exempt).",
    owner: "Legal / Compliance", evidence: "Signed mandate",
    cites: [act("Art. 54", 54, 85)], roles: ["gpai_provider"], when: t("d.authRepGpai"), date: "gpai", fine: "gpai",
  },
  {
    id: "O_GPAI_SYSTEMIC_NOTIFY", group: "General-purpose AI models", title: "Notify the Commission (systemic risk)",
    what: "Notify the Commission without delay, and within two weeks, after the model meets the systemic-risk threshold or it becomes known that it will.",
    owner: "Legal / Compliance", evidence: "Notification to the Commission",
    cites: [act("Art. 52(1)", 52, 83), act("Art. 51(2)", 51, 83)], roles: ["gpai_provider"], when: t("d.gpaiSystemic"), date: "gpai", fine: "gpai",
  },
  {
    id: "O_GPAI_SYSTEMIC_EVALUATE", group: "General-purpose AI models", title: "Model evaluation and systemic-risk mitigation",
    what: "Evaluate the model with standardised protocols including documented adversarial testing, and assess and mitigate possible systemic risks at EU level.",
    owner: "Engineering", evidence: "Evaluation and adversarial testing reports, systemic risk assessment",
    cites: [act("Art. 55(1)(a)-(b)", 55, 86)], roles: ["gpai_provider"], when: t("d.gpaiSystemic"), date: "gpai", fine: "gpai",
  },
  {
    id: "O_GPAI_SYSTEMIC_INCIDENTS_SECURITY", group: "General-purpose AI models", title: "Incident reporting and cybersecurity for the model",
    what: "Track, document and report serious incidents and corrective measures to the AI Office without undue delay, and ensure adequate cybersecurity for the model and its physical infrastructure.",
    owner: "Security", evidence: "Incident log, cybersecurity assessment",
    cites: [act("Art. 55(1)(c)-(d)", 55, 86)], roles: ["gpai_provider"], when: t("d.gpaiSystemic"), date: "gpai", fine: "gpai",
  },
];
