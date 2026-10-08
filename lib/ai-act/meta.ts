/**
 * Small, dependency-free facts about the legal sources, kept apart from
 * reference.ts so client code (chat export, rule-engine views) can use them
 * without bundling the whole legal text.
 */

/** Review date of the built-in EU AI Act reference and rule pack. Bump it whenever either is reviewed against the law. */
export const REFERENCE_REVIEWED_ON = "2026-10-08"; // verified against the Official Journal texts of Regulation (EU) 2024/1689 and the Digital Omnibus, Regulation (EU) 2026/1744

const EURLEX = "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689";

/** Link to an article of Regulation (EU) 2024/1689 on EUR-Lex. */
export const art = (n: number | string) => `${EURLEX}#art_${n}`;

/** Link to an annex of Regulation (EU) 2024/1689 on EUR-Lex. */
export const annex = (roman: string) => `${EURLEX}#anx_${roman}`;

/** Regulation (EU) 2026/1744 (Digital Omnibus on AI), published in the OJ on 24 July 2026, in force since 27 July 2026. */
export const OMNIBUS_URL = "https://eur-lex.europa.eu/eli/reg/2026/1744/oj";
