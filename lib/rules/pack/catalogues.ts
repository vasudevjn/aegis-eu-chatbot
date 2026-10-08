/**
 * Closed lists taken from the annexes of Regulation (EU) 2024/1689 as amended by
 * Regulation (EU) 2026/1744. Source pages are in the Official Journal PDFs:
 *   - AI Act: OJ L, 12.7.2024. Annex I pp.124-125, Annex III pp.127-129.
 *   - Omnibus: OJ L, 24.7.2026. Annex I changes p.36 (point 1 of Section A deleted,
 *     point 21 added to Section B).
 */

export interface Annex3UseCase {
  id: string;
  /** Annex III point, e.g. "4(a)". */
  point: string;
  area: string;
  /** Plain-language description, including the actor condition the Act attaches to it. */
  description: string;
}

/**
 * Annex III areas 2 to 8 (22 leaf use cases). Area 1 (biometrics) is handled by three
 * dedicated facts, because the Act also uses those concepts in Articles 5 and 50.
 */
export const ANNEX3_USE_CASES = [
  { id: "2_critical_infrastructure", point: "2", area: "Critical infrastructure", description: "Safety component in the management and operation of critical digital infrastructure, road traffic, or the supply of water, gas, heating or electricity." },
  { id: "3a_education_admission", point: "3(a)", area: "Education and vocational training", description: "Determines access or admission, or assigns people to educational or vocational training institutions." },
  { id: "3b_education_evaluation", point: "3(b)", area: "Education and vocational training", description: "Evaluates learning outcomes, including when used to steer the learning process." },
  { id: "3c_education_level", point: "3(c)", area: "Education and vocational training", description: "Assesses the appropriate level of education an individual will receive or can access." },
  { id: "3d_education_proctoring", point: "3(d)", area: "Education and vocational training", description: "Monitors and detects prohibited behaviour of students during tests." },
  { id: "4a_recruitment", point: "4(a)", area: "Employment and workers management", description: "Recruitment or selection: placing targeted job ads, analysing or filtering applications, evaluating candidates." },
  { id: "4b_work_management", point: "4(b)", area: "Employment and workers management", description: "Decisions on terms of work, promotion or termination; allocating tasks based on behaviour or personal traits; monitoring and evaluating the performance or behaviour of workers." },
  { id: "5a_public_benefits", point: "5(a)", area: "Essential services and benefits", description: "Used by or for public authorities to evaluate eligibility for essential public benefits and services (including healthcare) or to grant, reduce, revoke or reclaim them." },
  { id: "5b_credit_scoring", point: "5(b)", area: "Essential services and benefits", description: "Evaluates the creditworthiness of individuals or establishes a credit score (financial-fraud detection is excluded)." },
  { id: "5c_life_health_insurance", point: "5(c)", area: "Essential services and benefits", description: "Risk assessment and pricing for individuals in life and health insurance." },
  { id: "5d_emergency_triage", point: "5(d)", area: "Essential services and benefits", description: "Evaluates and classifies emergency calls, dispatches or prioritises emergency first-response services, or triages emergency healthcare patients." },
  { id: "6a_le_victim_risk", point: "6(a)", area: "Law enforcement", description: "Used by or for law enforcement to assess the risk of a person becoming a victim of a crime." },
  { id: "6b_le_polygraph", point: "6(b)", area: "Law enforcement", description: "Used by or for law enforcement as a polygraph or similar tool." },
  { id: "6c_le_evidence", point: "6(c)", area: "Law enforcement", description: "Used by or for law enforcement to evaluate the reliability of evidence in an investigation or prosecution." },
  { id: "6d_le_offending_risk", point: "6(d)", area: "Law enforcement", description: "Used by or for law enforcement to assess the risk of offending or re-offending (not solely on profiling), or to assess personality traits or past criminal behaviour." },
  { id: "6e_le_profiling", point: "6(e)", area: "Law enforcement", description: "Used by or for law enforcement for profiling during detection, investigation or prosecution of criminal offences." },
  { id: "7a_migration_polygraph", point: "7(a)", area: "Migration, asylum and border control", description: "Used by or for public authorities as a polygraph or similar tool in migration, asylum or border control." },
  { id: "7b_migration_risk", point: "7(b)", area: "Migration, asylum and border control", description: "Used by or for public authorities to assess a security, irregular-migration or health risk posed by a person entering or in the territory." },
  { id: "7c_migration_applications", point: "7(c)", area: "Migration, asylum and border control", description: "Used by or for public authorities to examine asylum, visa or residence-permit applications, including the reliability of evidence." },
  { id: "7d_migration_identification", point: "7(d)", area: "Migration, asylum and border control", description: "Used by or for public authorities to detect, recognise or identify people in migration, asylum or border control (except travel-document verification)." },
  { id: "8a_justice", point: "8(a)", area: "Justice and democratic processes", description: "Used by or for a judicial authority (or in alternative dispute resolution) to research and interpret facts and law and apply the law to facts." },
  { id: "8b_elections", point: "8(b)", area: "Justice and democratic processes", description: "Used to influence the outcome of an election or referendum or voting behaviour (tools that only organise campaigns administratively, with no direct exposure of people to the output, are excluded)." },
] as const satisfies readonly Annex3UseCase[];

export type Annex3UseCaseId = (typeof ANNEX3_USE_CASES)[number]["id"];
export const ANNEX3_IDS = ANNEX3_USE_CASES.map((u) => u.id) as [Annex3UseCaseId, ...Annex3UseCaseId[]];

export interface Annex1Law {
  id: string;
  section: "A" | "B";
  /** Annex I point number after the Omnibus amendments. */
  point: number;
  title: string;
}

/**
 * Annex I after Regulation (EU) 2026/1744: the old Section A point 1 (Machinery Directive
 * 2006/42/EC) is deleted and replaced by Section B point 21 (Machinery Regulation 2023/1230).
 * Section A is the New Legislative Framework list; for Section B only Article 6(1), Article 60a
 * and Articles 102-112 apply (Article 2(2) as amended).
 */
export const ANNEX1_LAWS = [
  { id: "toys", section: "A", point: 2, title: "Toys (Directive 2009/48/EC)" },
  { id: "recreational_craft", section: "A", point: 3, title: "Recreational craft (Directive 2013/53/EU)" },
  { id: "lifts", section: "A", point: 4, title: "Lifts (Directive 2014/33/EU)" },
  { id: "explosive_atmospheres", section: "A", point: 5, title: "Equipment for explosive atmospheres (Directive 2014/34/EU)" },
  { id: "radio_equipment", section: "A", point: 6, title: "Radio equipment (Directive 2014/53/EU)" },
  { id: "pressure_equipment", section: "A", point: 7, title: "Pressure equipment (Directive 2014/68/EU)" },
  { id: "cableways", section: "A", point: 8, title: "Cableway installations (Regulation (EU) 2016/424)" },
  { id: "ppe", section: "A", point: 9, title: "Personal protective equipment (Regulation (EU) 2016/425)" },
  { id: "gas_appliances", section: "A", point: 10, title: "Appliances burning gaseous fuels (Regulation (EU) 2016/426)" },
  { id: "medical_devices", section: "A", point: 11, title: "Medical devices (Regulation (EU) 2017/745)" },
  { id: "in_vitro_diagnostics", section: "A", point: 12, title: "In vitro diagnostic medical devices (Regulation (EU) 2017/746)" },
  { id: "civil_aviation_security", section: "B", point: 13, title: "Civil aviation security (Regulation (EC) No 300/2008)" },
  { id: "two_three_wheelers", section: "B", point: 14, title: "Two- or three-wheel vehicles and quadricycles (Regulation (EU) No 168/2013)" },
  { id: "agri_forestry_vehicles", section: "B", point: 15, title: "Agricultural and forestry vehicles (Regulation (EU) No 167/2013)" },
  { id: "marine_equipment", section: "B", point: 16, title: "Marine equipment (Directive 2014/90/EU)" },
  { id: "rail_interoperability", section: "B", point: 17, title: "Rail system interoperability (Directive (EU) 2016/797)" },
  { id: "motor_vehicles", section: "B", point: 18, title: "Motor vehicles and trailers (Regulation (EU) 2018/858)" },
  { id: "vehicle_safety", section: "B", point: 19, title: "Vehicle type-approval, general safety (Regulation (EU) 2019/2144)" },
  { id: "civil_aviation_easa", section: "B", point: 20, title: "Civil aviation, unmanned aircraft (Regulation (EU) 2018/1139)" },
  { id: "machinery", section: "B", point: 21, title: "Machinery (Regulation (EU) 2023/1230); moved here from Section A by the Omnibus" },
] as const satisfies readonly Annex1Law[];

export type Annex1LawId = (typeof ANNEX1_LAWS)[number]["id"];
export const ANNEX1_IDS = ["none", ...ANNEX1_LAWS.map((l) => l.id)] as [
  "none",
  ...Annex1LawId[],
];

export const ANNEX1_SECTION_A_IDS: readonly string[] = ANNEX1_LAWS.filter((l) => l.section === "A").map((l) => l.id);
export const ANNEX1_SECTION_B_IDS: readonly string[] = ANNEX1_LAWS.filter((l) => l.section === "B").map((l) => l.id);
