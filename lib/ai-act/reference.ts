/**
 * Curated reference on the EU AI Act — Regulation (EU) 2024/1689.
 *
 * Each section is a faithful plain-language summary of specific articles or
 * annexes, written for product teams and linked to the official EUR-Lex text.
 * It backs the `aiActReference` tool, so the copilot can ground and cite its
 * answers without a vector database. Keep summaries close to the legal text;
 * when the law or its implementation dates change, update the section (and
 * REFERENCE_REVIEWED_ON) rather than relying on the model's memory.
 */

// The review date lives in ./meta so client code can import it without this file's content.
export { REFERENCE_REVIEWED_ON } from "./meta";

const EURLEX =
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689";

export const art = (n: number) => `${EURLEX}#art_${n}`;
export const annex = (roman: string) => `${EURLEX}#anx_${roman}`;

export type ReferenceSection = {
  id: string;
  title: string;
  /** Articles / annexes the section summarises, e.g. "Article 5". */
  provisions: string;
  url: string;
  content: string;
};

export const AI_ACT_SECTIONS = [
  {
    id: "scope-and-definitions",
    title: "Scope, territorial reach and the definition of an AI system",
    provisions: "Articles 2 and 3",
    url: art(3),
    content: `
Definition of an AI system (Article 3(1)): "a machine-based system that is designed to operate with varying levels of autonomy and that may exhibit adaptiveness after deployment, and that, for explicit or implicit objectives, infers, from the input it receives, how to generate outputs such as predictions, content, recommendations, or decisions that can influence physical or virtual environments". The key element is inference: simple rule-based software that only executes rules defined by humans is generally outside the definition. The Commission published guidelines on the AI system definition in February 2025.

Territorial scope (Article 2): the Act applies to
- providers placing AI systems or general-purpose AI models on the EU market or putting them into service in the EU, wherever the provider is established;
- deployers of AI systems that are established or located in the EU;
- providers and deployers established outside the EU where the output produced by the AI system is used in the EU;
- importers, distributors, product manufacturers placing an AI system on the market together with their product under their own name, and authorised representatives of non-EU providers.

Main exclusions (Article 2): AI systems used exclusively for military, defence or national security purposes; AI systems or models developed and put into service solely for scientific research and development; research, testing and development activity before placing on the market (real-world testing excepted); purely personal, non-professional use by natural persons; and AI systems released under free and open-source licences, unless they are placed on the market as high-risk systems, fall under Article 5 (prohibited practices) or Article 50 (transparency).
`.trim(),
  },
  {
    id: "roles-value-chain",
    title: "Roles in the AI value chain: provider, deployer, importer, distributor",
    provisions: "Articles 3, 22–25",
    url: art(25),
    content: `
Obligations depend on the operator's role, so identifying it is the first step of any assessment (definitions in Article 3):
- Provider: develops an AI system or GPAI model, or has one developed, and places it on the market or puts it into service under its own name or trademark, whether for payment or free of charge. Carries most high-risk obligations.
- Deployer: uses an AI system under its authority in a professional context (personal non-professional use is excluded). Example: a company using a third-party CV-screening tool is a deployer of that tool.
- Importer: an EU-established person placing on the EU market an AI system bearing the name or trademark of a non-EU person (Article 23 — must verify conformity assessment, documentation, CE marking and authorised representative).
- Distributor: makes an AI system available in the supply chain without being the provider or importer (Article 24 — must verify CE marking, declaration of conformity and instructions).
- Authorised representative: a non-EU provider of a high-risk system or GPAI model must appoint one in the EU by written mandate (Articles 22 and 54).

Becoming a provider (Article 25): a distributor, importer, deployer or other third party is considered the provider of a high-risk AI system, with all provider obligations, if it
(a) puts its name or trademark on a high-risk AI system already on the market;
(b) makes a substantial modification to a high-risk AI system so that it remains high-risk; or
(c) modifies the intended purpose of an AI system (including a general-purpose AI system) that was not high-risk so that it becomes high-risk.
The original provider must then cooperate and provide the necessary information and technical access. A company that fine-tunes or wraps a third-party model and sells the result under its own brand is typically a provider of the resulting AI system.
`.trim(),
  },
  {
    id: "ai-literacy",
    title: "AI literacy obligation",
    provisions: "Article 4",
    url: art(4),
    content: `
Article 4 requires providers and deployers of ANY AI system — whatever its risk level — to take measures to ensure, to their best extent, a sufficient level of AI literacy of their staff and other persons dealing with the operation and use of AI systems on their behalf, taking into account their technical knowledge, experience, education and training, the context of use, and the persons on whom the systems are used. It has applied since 2 February 2025.

Practical evidence: an AI literacy policy, role-based training (product, engineering, customer support, HR users), records of training completion, and usage guidance for each AI tool. The Commission has published AI literacy Q&A material and a repository of practices.

UNVERIFIED POINT: the Commission's Digital Omnibus on AI proposal would have replaced the company-level duty with a duty on the Commission and Member States to promote and encourage AI literacy. The Omnibus is now in force (Regulation (EU) 2026/1744), but the sources reviewed did not confirm what the final text does with Article 4. Check the current wording of Article 4 on EUR-Lex before telling a user the duty has been removed or softened; until then recommend keeping the training and records, which are good practice either way.
`.trim(),
  },
  {
    id: "prohibited-practices",
    title: "Prohibited AI practices",
    provisions: "Article 5",
    url: art(5),
    content: `
The following practices have been prohibited since 2 February 2025 (Article 5(1)). Fines reach EUR 35 million or 7% of worldwide annual turnover, whichever is higher.
(a) Subliminal, purposefully manipulative or deceptive techniques that materially distort a person's behaviour by impairing informed decision-making, causing or reasonably likely to cause significant harm.
(b) Exploiting vulnerabilities of a person or group due to age, disability or a specific social or economic situation, materially distorting behaviour in a way that causes or is reasonably likely to cause significant harm.
(c) Social scoring: evaluating or classifying people over time based on social behaviour or personal characteristics, where the score leads to detrimental treatment in unrelated social contexts, or treatment that is unjustified or disproportionate to the behaviour.
(d) Assessing or predicting the risk that a person will commit a criminal offence based solely on profiling or on personality traits and characteristics (systems supporting a human assessment based on objective, verifiable facts directly linked to criminal activity are not covered).
(e) Creating or expanding facial recognition databases through untargeted scraping of facial images from the internet or CCTV footage.
(f) Inferring emotions of a natural person in the workplace or in education institutions, except for medical or safety reasons.
(g) Biometric categorisation systems that categorise individuals based on biometric data to deduce or infer race, political opinions, trade union membership, religious or philosophical beliefs, sex life or sexual orientation (lawful labelling or filtering of lawfully acquired biometric datasets, e.g. in law enforcement, is excepted).
(h) Real-time remote biometric identification in publicly accessible spaces for law enforcement, except where strictly necessary for narrowly defined objectives (targeted search for victims of abduction, trafficking or sexual exploitation and missing persons; preventing a specific, substantial and imminent threat to life or a genuine terrorist threat; locating suspects of serious crimes listed in Annex II), subject to prior authorisation and safeguards (Article 5(2)–(7)).

Added by the Digital Omnibus on AI (applies from 2 December 2026): a prohibition on AI systems that generate or manipulate non-consensual intimate imagery or child sexual abuse material (including "nudifier" applications), reaching providers whose systems produce such content as a reasonably foreseeable outcome. A system is not caught where effective technical safeguards reliably prevent such outputs. The exact article wording and the applicable fine tier were not confirmed against the consolidated text; verify before quoting them.

The Commission published guidelines on prohibited AI practices on 4 February 2025, with examples of what is and is not covered. Note: emotion recognition OUTSIDE the workplace and education is not prohibited but is high-risk (Annex III point 1(c)) and triggers Article 50(3) transparency.
`.trim(),
  },
  {
    id: "high-risk-classification",
    title: "When is an AI system high-risk?",
    provisions: "Article 6, Annex I",
    url: art(6),
    content: `
There are two routes to high-risk status (Article 6):

Route 1 — product safety (Article 6(1), Annex I). An AI system is high-risk where BOTH conditions are met: (a) it is intended to be used as a safety component of a product, or is itself a product, covered by the EU harmonisation legislation listed in Annex I; and (b) that product must undergo a third-party conformity assessment under that legislation. Annex I Section A covers, among others, machinery, toys, recreational craft, lifts, equipment for explosive atmospheres, radio equipment, pressure equipment, cableway installations, personal protective equipment, gas appliances, medical devices and in vitro diagnostic medical devices. Annex I Section B covers civil aviation, motor vehicles and their trailers, two- and three-wheel vehicles, agricultural and forestry vehicles, marine equipment and rail interoperability (for Section B, the requirements are integrated through the sectoral legislation). This route applies from 2 August 2028 (moved from 2 August 2027 by the Digital Omnibus on AI, Regulation (EU) 2026/1744, in force since 27 July 2026).

Route 2 — use cases (Article 6(2), Annex III). AI systems used in the areas listed in Annex III are high-risk (see the Annex III section), subject to the narrow exception in Article 6(3). Applies from 2 December 2027 (moved from 2 August 2026 by the Digital Omnibus on AI). The high-risk classification rules themselves are unchanged.

The Commission must provide guidelines with a comprehensive list of practical examples of high-risk and non-high-risk use cases (Article 6(5)); check for the latest version. The Commission may amend Annex III by delegated act (Article 7).
`.trim(),
  },
  {
    id: "annex-iii-use-cases",
    title: "Annex III high-risk use cases",
    provisions: "Annex III",
    url: annex("III"),
    content: `
Annex III lists eight areas. AI systems intended to be used for the following purposes are high-risk:

1. Biometrics (where permitted by EU or national law): (a) remote biometric identification systems (biometric verification whose sole purpose is to confirm a person is who they claim to be is excluded); (b) biometric categorisation according to sensitive or protected attributes; (c) emotion recognition.
2. Critical infrastructure: safety components in the management and operation of critical digital infrastructure, road traffic, or the supply of water, gas, heating or electricity.
3. Education and vocational training: (a) determining access or admission, or assigning persons to institutions; (b) evaluating learning outcomes, including when used to steer the learning process; (c) assessing the appropriate level of education a person will receive or can access; (d) monitoring and detecting prohibited behaviour of students during tests.
4. Employment, workers management and access to self-employment: (a) recruitment or selection — in particular placing targeted job advertisements, analysing and filtering job applications, and evaluating candidates; (b) decisions affecting terms of work relationships, promotion or termination, allocating tasks based on individual behaviour or personal traits, or monitoring and evaluating performance and behaviour.
5. Access to essential private and public services and benefits: (a) evaluating eligibility for essential public assistance benefits and services, including healthcare, or granting, reducing, revoking or reclaiming them; (b) evaluating creditworthiness or establishing a credit score (systems used to detect financial fraud are excluded); (c) risk assessment and pricing in life and health insurance; (d) evaluating and classifying emergency calls, dispatching or prioritising emergency first response services, and emergency healthcare patient triage.
6. Law enforcement (where permitted): assessing the risk of a person becoming a victim of crime; polygraphs and similar tools; evaluating the reliability of evidence; assessing the risk of offending or re-offending not solely based on profiling, or assessing personality traits or past criminal behaviour; profiling in the detection, investigation or prosecution of criminal offences.
7. Migration, asylum and border control management (where permitted): polygraphs and similar tools; assessing security, irregular-migration or health risks of persons entering; assisting examination of applications for asylum, visas and residence permits, including reliability of evidence; detecting, recognising or identifying persons (except travel document verification).
8. Administration of justice and democratic processes: (a) assisting a judicial authority (or alternative dispute resolution) in researching and interpreting facts and the law and applying the law to facts; (b) influencing the outcome of an election or referendum or the voting behaviour of persons (tools used only to organise, optimise or structure political campaigns from an administrative or logistical point of view are excluded).

Typical examples: a CV-ranking or candidate-scoring tool (point 4(a)); an employee productivity-scoring tool (4(b)); a consumer credit-scoring model (5(b)); an exam-proctoring system (3(d)); an AI triage tool for emergency calls (5(d)).
`.trim(),
  },
  {
    id: "article-6-3-exception",
    title: "The Article 6(3) exception for Annex III systems",
    provisions: "Article 6(3)–(4), Article 49(2)",
    url: art(6),
    content: `
An Annex III system is NOT high-risk if it does not pose a significant risk of harm to the health, safety or fundamental rights of natural persons, including by not materially influencing the outcome of decision-making. This is the case where one or more of the following applies (Article 6(3)):
(a) the AI system is intended to perform a narrow procedural task;
(b) it is intended to improve the result of a previously completed human activity;
(c) it is intended to detect decision-making patterns or deviations from prior decision-making patterns and is not meant to replace or influence the previously completed human assessment without proper human review; or
(d) it is intended to perform a preparatory task to an assessment relevant for the Annex III use cases.

Override: an Annex III AI system is ALWAYS high-risk where it performs profiling of natural persons (profiling as defined in GDPR Article 4(4)). Ranking or scoring candidates, borrowers or students is generally profiling.

Conditions for relying on the exception: the provider must document its assessment before placing the system on the market (Article 6(4)), provide that documentation to national authorities on request, and still register the system in the EU database (Article 49(2)). The Digital Omnibus on AI kept this registration duty (the Commission had proposed removing it) but simplified the information to be submitted. Relying on the exception wrongly exposes the provider to penalties, so it should be a documented, reviewed decision — not a default.
`.trim(),
  },
  {
    id: "high-risk-requirements",
    title: "Requirements for high-risk AI systems",
    provisions: "Articles 8–15, Annex IV",
    url: art(9),
    content: `
High-risk AI systems must comply with the following requirements, taking into account their intended purpose and the state of the art (Article 8):
- Risk management system (Article 9): a continuous, iterative process across the entire lifecycle — identify and analyse known and reasonably foreseeable risks to health, safety and fundamental rights, estimate risks under intended use and reasonably foreseeable misuse, adopt targeted mitigation measures, and test the system (including, where appropriate, in real-world conditions). Pay specific attention to impacts on persons under 18 and other vulnerable groups.
- Data and data governance (Article 10): training, validation and testing data must be subject to governance practices covering design choices, collection processes and data origin, preparation (annotation, labelling, cleaning), assumptions, availability and suitability, examination for possible biases likely to affect health, safety or fundamental rights or lead to discrimination, and measures to detect, prevent and mitigate them, and identification of data gaps. Data sets must be relevant, sufficiently representative and, to the best extent possible, free of errors and complete. Special categories of personal data may be processed exceptionally and with safeguards, strictly for bias detection and correction (Article 10(5)); the Digital Omnibus on AI widened this legal basis beyond high-risk systems to providers and deployers of other AI systems and models, while keeping the "strict necessity" test.
- Technical documentation (Article 11, Annex IV): drawn up before placing on the market and kept up to date; it must cover the general description, design and development process, data, monitoring and control, performance metrics, risk management, changes over the lifecycle, standards applied, the EU declaration of conformity and the post-market monitoring plan. SMEs and start-ups may use a simplified form to be provided by the Commission.
- Record-keeping (Article 12): the system must technically allow automatic recording of events (logs) over its lifetime, to enable traceability, identification of risk situations and substantial modifications, and post-market monitoring.
- Transparency and information to deployers (Article 13): designed so deployers can interpret output and use it appropriately; accompanied by instructions for use including the provider's identity, characteristics, capabilities and limitations, intended purpose, level of accuracy, robustness and cybersecurity, known risks, human oversight measures, computational and hardware resources, expected lifetime and log-collection mechanisms.
- Human oversight (Article 14): designed so natural persons can effectively oversee the system during use — understand its capacities and limitations, remain aware of automation bias, correctly interpret output, decide not to use or to disregard, override or reverse the output, and intervene or interrupt it through a "stop" button or similar procedure. For remote biometric identification, no action may be taken on an identification unless separately verified by at least two competent persons.
- Accuracy, robustness and cybersecurity (Article 15): appropriate levels declared in the instructions for use; resilient to errors, faults and inconsistencies; measures against feedback loops for systems that keep learning; resilience against attempts to alter use or performance by exploiting vulnerabilities (data poisoning, model poisoning, adversarial examples, confidentiality attacks, model flaws).

Harmonised standards being developed by CEN-CENELEC JTC 21 will give a presumption of conformity once published in the Official Journal (Article 40).
`.trim(),
  },
  {
    id: "provider-obligations",
    title: "Obligations of providers of high-risk AI systems",
    provisions: "Articles 16–21, 43, 47–49, 71",
    url: art(16),
    content: `
Providers of high-risk AI systems must (Article 16):
- ensure the system complies with the requirements of Articles 8–15;
- indicate their name, registered trade name or trademark and contact address on the system, its packaging or documentation;
- have a quality management system (Article 17): documented policies covering regulatory compliance strategy, design and development, testing and validation, data management, risk management, post-market monitoring, incident reporting, communication with authorities, record-keeping, resource management and an accountability framework — proportionate to the size of the organisation;
- keep documentation for 10 years after the system is placed on the market: technical documentation, QMS documentation, approved changes, notified body decisions and the EU declaration of conformity (Article 18);
- keep the automatically generated logs under their control for at least six months (Article 19);
- undergo the relevant conformity assessment before placing on the market (Article 43). For most Annex III systems (points 2–8) this is internal control under Annex VI. For biometric systems (point 1) a notified body is involved unless harmonised standards or common specifications are fully applied. Annex I products follow their sectoral procedure. A new conformity assessment is needed after a substantial modification;
- draw up an EU declaration of conformity (Article 47, Annex V) and affix the CE marking (Article 48);
- register themselves and the system in the EU database before placing on the market (Article 49, Article 71; Annex VIII lists the information). Annex III point 2 systems are registered at national level;
- take corrective actions — bring into conformity, withdraw, disable or recall — and inform distributors, deployers and authorities when the system is not in conformity (Article 20);
- cooperate with competent authorities and provide information and logs on request (Article 21);
- ensure compliance with accessibility requirements (Directives (EU) 2016/2102 and 2019/882).

Non-EU providers must appoint an EU authorised representative (Article 22).
`.trim(),
  },
  {
    id: "deployer-obligations",
    title: "Obligations of deployers of high-risk AI systems",
    provisions: "Articles 26, 27 and 86",
    url: art(26),
    content: `
Deployers of high-risk AI systems must (Article 26):
- take appropriate technical and organisational measures to use the system in accordance with the provider's instructions for use;
- assign human oversight to natural persons who have the necessary competence, training and authority, and give them the support they need;
- to the extent they control input data, ensure it is relevant and sufficiently representative for the intended purpose;
- monitor operation based on the instructions for use; where they have reason to consider the use may present a risk, inform the provider or distributor and the market surveillance authority and suspend use; report serious incidents to the provider first and then the importer/distributor and authorities;
- keep the logs automatically generated by the system, to the extent under their control, for at least six months unless other law provides otherwise;
- where the deployer is an employer, inform workers' representatives and the affected workers before putting a high-risk system into service or using it at the workplace;
- where the deployer is a public authority, register its use in the EU database (Article 49(3)) and not use a system that has not been registered;
- use the information provided under Article 13 to carry out a data protection impact assessment under GDPR Article 35 where applicable;
- for Annex III systems that make or assist decisions related to natural persons, inform those persons that they are subject to the use of the high-risk AI system (Article 26(11));
- cooperate with competent authorities.

Fundamental rights impact assessment (Article 27): before first use, deployers that are bodies governed by public law, private entities providing public services, and deployers of Annex III point 5(b) (creditworthiness / credit scoring) and 5(c) (life and health insurance risk assessment and pricing) systems must assess the impact on fundamental rights: the deployer's processes in which the system is used, period and frequency of use, categories of affected persons and groups, specific risks of harm, human oversight measures, and measures if risks materialise including governance and complaint mechanisms. The results are notified to the market surveillance authority using a template from the AI Office. Annex III point 2 (critical infrastructure) systems are excluded. A DPIA can be complemented rather than duplicated.

Right to explanation (Article 86): a person subject to a decision taken by a deployer on the basis of output from an Annex III high-risk system (except point 2), which produces legal effects or similarly significantly affects them in a way they consider adverse to their health, safety or fundamental rights, has the right to obtain a clear and meaningful explanation of the role of the AI system in the decision and the main elements of the decision.
`.trim(),
  },
  {
    id: "transparency-obligations",
    title: "Transparency obligations for certain AI systems (chatbots, generative AI, deepfakes, emotion recognition)",
    provisions: "Article 50",
    url: art(50),
    content: `
Article 50 applies regardless of whether the system is high-risk, and has applied since 2 August 2026. The Digital Omnibus on AI did not amend the Article 50 duties; its only relief is a grace period for the machine-readable marking in paragraph (2): generative systems already placed on the market before 2 August 2026 have until 2 December 2026, while systems placed on the market from 2 August 2026 had to comply from the start.
(1) Providers must ensure AI systems intended to interact directly with natural persons (e.g. chatbots, voice assistants) are designed so that the persons are informed they are interacting with an AI system, unless obvious to a reasonably well-informed, observant and circumspect person from the circumstances and context.
(2) Providers of AI systems, including general-purpose AI systems, that generate synthetic audio, image, video or text content must ensure outputs are marked in a machine-readable format and detectable as artificially generated or manipulated. Solutions must be effective, interoperable, robust and reliable as far as technically feasible (e.g. watermarks, metadata, cryptographic provenance, fingerprints). Systems performing an assistive function for standard editing, or not substantially altering the input data, are excepted.
(3) Deployers of emotion recognition or biometric categorisation systems must inform the natural persons exposed to them about the operation of the system and process personal data in line with GDPR.
(4) Deployers of AI systems generating or manipulating image, audio or video content constituting a deep fake must disclose that the content has been artificially generated or manipulated (for evidently artistic, creative, satirical or fictional works, disclosure is limited to a manner that does not hamper display or enjoyment). Deployers of AI systems that generate or manipulate text published to inform the public on matters of public interest must disclose that the text was artificially generated or manipulated, unless it has undergone human review or editorial control and a natural or legal person holds editorial responsibility.
(5) The information must be provided in a clear and distinguishable manner at the latest at the time of the first interaction or exposure, and conform to accessibility requirements.

The AI Office is facilitating a code of practice on the marking and labelling of AI-generated content, and the Commission is to issue guidelines on Article 50; check for the final versions.
`.trim(),
  },
  {
    id: "gpai-models",
    title: "General-purpose AI (GPAI) models and systemic risk",
    provisions: "Articles 51–56, Annexes XI–XIII",
    url: art(53),
    content: `
A general-purpose AI model is an AI model, including one trained with a large amount of data using self-supervision at scale, that displays significant generality and can competently perform a wide range of distinct tasks, and that can be integrated into a variety of downstream systems (Article 3(63)). Obligations for GPAI model providers have applied since 2 August 2025. Companies that only BUILD PRODUCTS ON TOP of a third-party model (e.g. via an API) are usually not GPAI model providers; they are providers or deployers of an AI system, though significant fine-tuning or modification can make them a provider of a modified model (see the Commission's GPAI guidelines).

All GPAI model providers must (Article 53):
(a) draw up and keep up to date technical documentation of the model, including training and testing process and evaluation results (Annex XI), for the AI Office and national authorities on request;
(b) provide information and documentation to downstream providers integrating the model into their AI systems (Annex XII);
(c) put in place a policy to comply with EU copyright law, in particular to identify and respect text-and-data-mining opt-outs (Directive (EU) 2019/790, Article 4(3));
(d) draw up and publish a sufficiently detailed summary of the content used for training, using the template published by the AI Office (July 2025).
Providers of models released under a free and open-source licence with public weights are exempt from (a) and (b) unless the model has systemic risk. Non-EU providers must appoint an authorised representative (Article 54).

Systemic risk (Article 51): a GPAI model has systemic risk if it has high-impact capabilities, presumed when the cumulative compute used for training exceeds 10^25 floating-point operations, or if designated by the Commission. The provider must notify the Commission within two weeks of meeting the threshold (Article 52). Additional obligations (Article 55): perform model evaluations including adversarial testing; assess and mitigate possible systemic risks at Union level; track, document and report serious incidents and corrective measures to the AI Office without undue delay; ensure adequate cybersecurity protection for the model and its physical infrastructure.

Codes of practice (Article 56): the General-Purpose AI Code of Practice (transparency, copyright, and safety & security chapters) was published on 10 July 2025; signing it is a voluntary way to demonstrate compliance. The Commission also published GPAI guidelines in July 2025.

Transition: GPAI models placed on the market before 2 August 2025 must comply by 2 August 2027 (Article 111(3)). The Commission's enforcement powers, including fines on GPAI providers (Article 101), apply from 2 August 2026.

Supervision (Digital Omnibus on AI): the AI Office has exclusive supervisory authority over AI systems built on a GPAI model where the model and the system come from the same provider, and over AI systems integrated into very large online platforms and search engines under the Digital Services Act. Its powers include investigations, requests for information, inspections, binding commitments and periodic penalty payments of up to 5% of average daily turnover.
`.trim(),
  },
  {
    id: "post-market-and-incidents",
    title: "Post-market monitoring and serious incident reporting",
    provisions: "Articles 72 and 73",
    url: art(73),
    content: `
Post-market monitoring (Article 72): providers of high-risk systems must establish and document a post-market monitoring system proportionate to the nature of the technology and risks, actively and systematically collecting, documenting and analysing data on performance throughout the lifetime (including, where relevant, interaction with other AI systems), based on a post-market monitoring plan that forms part of the technical documentation. The Commission adopts a template for the plan.

Serious incident reporting (Article 73): providers must report any serious incident to the market surveillance authorities of the Member State where it occurred. A serious incident is an incident or malfunctioning that directly or indirectly leads to death or serious harm to health; serious and irreversible disruption of critical infrastructure; infringement of obligations under EU law intended to protect fundamental rights; or serious harm to property or the environment (Article 3(49)). Deadlines:
- immediately after establishing a causal link (or its reasonable likelihood), and in any event not later than 15 days after becoming aware of the incident;
- not later than 2 days in the event of a widespread infringement or a serious incident involving critical infrastructure;
- not later than 10 days in the event of the death of a person.
An initial incomplete report may be followed by a complete one. The provider must investigate without delay, including a risk assessment and corrective action, and must not alter the system in a way that affects later evaluation of causes before informing the authorities.
`.trim(),
  },
  {
    id: "timeline",
    title: "Implementation timeline: when obligations apply",
    provisions: "Articles 111 and 113",
    url: art(113),
    content: `
The Regulation entered into force on 1 August 2024 and applies in phases (Article 113). The phases were amended by the Digital Omnibus on AI — Regulation (EU) 2026/1744 — adopted by the Parliament (16 June 2026) and the Council (29 June 2026), signed on 8 July 2026, published in the Official Journal on 24 July 2026 and in force since 27 July 2026. It is law, not a proposal. The dates that now apply:
- 2 February 2025: general provisions including AI literacy (Article 4, see the AI literacy section for an unverified point) and prohibited practices (Article 5).
- 2 August 2025: notifying authorities and notified bodies, GPAI model obligations (Chapter V), governance (AI Office, AI Board), confidentiality, and penalties (except Article 101 GPAI fines). Member States had to designate national competent authorities.
- 2 August 2026: transparency obligations (Article 50) apply, unchanged except for the marking grace period below; Commission enforcement against GPAI providers, including fines (Article 101), applies.
- 2 December 2026: the new Article 5 prohibition on generating non-consensual intimate imagery and child sexual abuse material applies; the grace period for the Article 50(2) machine-readable marking of generative systems already on the market before 2 August 2026 ends.
- 2 August 2027: each Member State must have at least one AI regulatory sandbox (moved from 2 August 2026); deadline for GPAI models placed on the market before 2 August 2025.
- 2 December 2027: stand-alone high-risk systems under Annex III (Articles 6(2), 8–27, 43, 47–49 and the connected provider duties). Moved from 2 August 2026. The sources reviewed say the Annex III date is a fixed date, not tied to the availability of harmonised standards.
- 2 August 2028: high-risk AI systems that are safety components or products under Annex I (Article 6(1)). Moved from 2 August 2027.

Practical reading: as of the date of this review, Article 50 transparency duties, the GPAI rules, the Article 5 prohibitions and the AI literacy provision are the obligations that already apply; high-risk (Annex III) obligations are NOT yet applicable and start on 2 December 2027, but providers should still plan now because conformity assessment, documentation and quality management take a long lead time.

Legacy systems (Article 111(2)): as originally adopted, high-risk AI systems placed on the market or put into service before 2 August 2026 are only subject to the Act if they undergo significant changes in design after that date; providers and deployers of high-risk systems intended to be used by public authorities must comply by 2 August 2030; components of the large-scale EU IT systems in Annex X by 31 December 2030. UNVERIFIED: the sources reviewed did not state whether the Omnibus changed the cut-off date in Article 111(2) to follow the new application dates. Check the consolidated text before telling a user that a system placed on the market in the gap between 2 August 2026 and 2 December 2027 is or is not grandfathered.

Other Omnibus changes are noted in the relevant sections: prohibited practices (new ban), Article 50 (marking grace period), Article 6(3) (registration kept but simplified), Article 10 (special-category data for bias), GPAI models (AI Office supervision), innovation support (sandboxes, small mid-caps). Penalty tiers (Article 99) were not changed.

Further amendments and Commission guidance can still follow (for example the high-risk guidelines under Article 6(5), harmonised standards and implementing templates). Check the current status of those before relying on them.
`.trim(),
  },
  {
    id: "penalties",
    title: "Penalties and enforcement",
    provisions: "Articles 99–101",
    url: art(99),
    content: `
Member States lay down penalties, which must be effective, proportionate and dissuasive (Article 99). Maximum administrative fines:
- Non-compliance with the prohibited practices (Article 5): up to EUR 35 million or 7% of total worldwide annual turnover for the preceding financial year, whichever is higher.
- Non-compliance with most other operator obligations — providers (Article 16), authorised representatives (Article 22), importers (Article 23), distributors (Article 24), deployers (Article 26), notified bodies, and transparency obligations (Article 50): up to EUR 15 million or 3%, whichever is higher.
- Supplying incorrect, incomplete or misleading information to notified bodies or national competent authorities: up to EUR 7.5 million or 1%, whichever is higher.
- For SMEs, including start-ups, each fine is capped at whichever of the two amounts is LOWER (Article 99(6)).
- Union institutions, bodies and agencies: up to EUR 1.5 million (prohibited practices) or EUR 750,000 (other obligations) (Article 100).
- Providers of GPAI models: up to EUR 15 million or 3% of worldwide turnover, whichever is higher, imposed by the Commission (Article 101), applying from 2 August 2026.

When deciding fines, authorities consider the nature, gravity and duration of the infringement, the number of affected persons, prior fines, the size and market share of the operator, cooperation, the degree of responsibility, how the authority learned of the infringement, whether it was intentional or negligent, and actions taken to mitigate harm.

Enforcement is mainly by national market surveillance authorities; the AI Office within the Commission supervises GPAI models. Anyone may lodge a complaint with a market surveillance authority (Article 85).
`.trim(),
  },
  {
    id: "innovation-support",
    title: "Support for innovation: sandboxes, real-world testing, SMEs",
    provisions: "Articles 57–63",
    url: art(57),
    content: `
- AI regulatory sandboxes (Articles 57–59): each Member State must have at least one operational AI regulatory sandbox by 2 August 2027 (moved from 2 August 2026 by the Digital Omnibus on AI) — a controlled environment to develop, train, test and validate innovative AI systems under regulatory supervision for a limited time. Participants remain liable for harm caused, but no administrative fines are imposed where they follow the sandbox plan and guidance in good faith. Exit reports can be used to demonstrate compliance.
- Testing in real-world conditions (Articles 60–61): providers of Annex III high-risk systems may test outside sandboxes under a registered real-world testing plan, with informed consent of participants (with exceptions for law enforcement), a maximum duration of six months (extendable by six months), and oversight safeguards.
- SMEs and start-ups (Article 62): priority, free-of-charge access to sandboxes, tailored awareness and training activities, dedicated communication channels, and fees for conformity assessment reduced in proportion to their size. Microenterprises may comply with certain quality management system elements in a simplified manner (Article 63). The Digital Omnibus on AI extends the SME simplifications and support measures, including priority sandbox access, to small mid-caps; check the final text for the exact list of measures and the size definition before telling a user they qualify.
`.trim(),
  },
] as const satisfies readonly ReferenceSection[];

export type ReferenceSectionId = (typeof AI_ACT_SECTIONS)[number]["id"];

export const REFERENCE_SECTION_IDS = AI_ACT_SECTIONS.map((s) => s.id) as [
  ReferenceSectionId,
  ...ReferenceSectionId[],
];

export function getSections(ids: readonly string[]): ReferenceSection[] {
  const wanted = new Set(ids);
  return AI_ACT_SECTIONS.filter((s) => wanted.has(s.id));
}

/** Formats sections with the same citation scaffolding as the other tools. */
export function formatSections(sections: ReferenceSection[]): string {
  if (sections.length === 0) {
    return "<results>\nNo matching section.\n</results>";
  }
  const blocks = sections.map((s, i) =>
    [
      `# Source ${i + 1}`,
      `## Title`,
      `EU AI Act — ${s.title} (${s.provisions})`,
      `## Source Citation (cite using this exact URL)`,
      `[Regulation (EU) 2024/1689, ${s.provisions}](${s.url})`,
      `## Content`,
      s.content,
    ].join("\n")
  );
  return `<results>\n${blocks.join("\n\n")}\n</results>`;
}
