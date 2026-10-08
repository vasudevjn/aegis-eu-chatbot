import { art, annex, OMNIBUS_URL } from "@/lib/ai-act/meta";
import type { Cite } from "@/lib/rules/types";

/** Citation to an article of the AI Act as adopted. `page` is the page of the OJ L 12.7.2024 PDF. */
export function act(ref: string, article: number | string, page?: number | string): Cite {
  return { ref, url: art(article), src: "act", page: page === undefined ? undefined : `OJ 2024/1689 p.${page}` };
}

/** Citation to an annex of the AI Act as adopted. */
export function actAnnex(ref: string, roman: string, page?: number | string): Cite {
  return { ref, url: annex(roman), src: "act", page: page === undefined ? undefined : `OJ 2024/1689 p.${page}` };
}

/** Citation to a provision introduced or changed by Regulation (EU) 2026/1744. `page` is the page of the OJ L 24.7.2026 PDF. */
export function omni(ref: string, page?: number | string): Cite {
  return { ref: `${ref} (Reg. 2026/1744)`, url: OMNIBUS_URL, src: "omnibus", page: page === undefined ? undefined : `OJ 2026/1744 p.${page}` };
}
