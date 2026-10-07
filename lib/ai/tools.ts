import { type ToolSet } from "ai";
import { createWebSearch } from "@/app/api/chat/tools/web-search";
import { createVectorDatabaseSearch } from "@/app/api/chat/tools/search-vector-database";
import { createAiActReference } from "@/app/api/chat/tools/ai-act-reference";
import {
  ENABLE_WEB_SEARCH,
  ENABLE_VECTOR_SEARCH,
  MAX_KB_SEARCHES,
  MAX_WEB_SEARCHES,
  OFFICIAL_SOURCE_DOMAINS,
} from "@/config";
import type { UISource } from "@/types/data";

/** Collector callback: the source plus its retrieved text (for claim verification). */
export type CollectSource = (s: UISource, content?: string) => void;

/**
 * Assembles the enabled tool set. `collect` is called by each tool for every
 * source it uses, feeding the code-rendered Sources box; the optional content
 * is the text the model saw, used to verify citation claims. Pass a no-op to
 * ignore sources.
 *
 * The Pinecone document library is the primary source and joins when its
 * switch and key are set. aiActReference is always available (no external
 * service): it carries the up-to-date summary and is the fallback when the
 * library has nothing or is down. Web search is opt-in (ENABLE_WEB_SEARCH=true).
 */
export function buildToolSet(collect: CollectSource = () => {}): ToolSet {
  return {
    aiActReference: createAiActReference(collect),
    ...(ENABLE_VECTOR_SEARCH ? { vectorDatabaseSearch: createVectorDatabaseSearch(collect) } : {}),
    ...(ENABLE_WEB_SEARCH ? { webSearch: createWebSearch(collect) } : {}),
  };
}

export function buildToolGuidance(): string {
  const sections: string[] = [];

  sections.push("TOOL BUDGET (limits per response):");

  if (ENABLE_VECTOR_SEARCH) {
    sections.push(
      `- vectorDatabaseSearch: MAX ${MAX_KB_SEARCHES} calls. This is your PRIMARY source: call it FIRST for every substantive question. Use a second call only for a different provision or topic. If it reports no matching passages or that the library is unavailable, fall back to aiActReference and say so in one short line.`
    );
    sections.push(
      `- aiActReference: usually 1 call, requesting ALL sections you need at once (max 2 calls). Call it after the library for every system assessment and for any statement of dates, applicability or amendments, and as the fallback when the library has nothing relevant.`
    );
  } else {
    sections.push(
      `- aiActReference: usually 1 call, requesting ALL sections you need at once (max 2 calls). The document library (vectorDatabaseSearch) is not connected, so this built-in summary is your only legal source. Ignore any instruction to search the library, and say once in your answer that it is based on Aegis's built-in summary of the Act.`
    );
  }

  if (ENABLE_WEB_SEARCH) {
    sections.push(
      `- webSearch: MAX ${MAX_WEB_SEARCHES} calls. Use it ONLY for currency checks: the final text of the Digital Omnibus (Regulation (EU) 2026/1744) where the reference flags a point as unverified, any later amendment, newly published Commission guidelines, codes of practice, harmonised standards, templates, or national enforcement news, or when the user asks "what's new" / "latest". Prefer one call with 2-3 additionalQueries. For legal status, restrict to official domains with includeDomains (e.g. ${OFFICIAL_SOURCE_DOMAINS.join(", ")}).`
    );
  } else {
    sections.push(
      `NOTE: Live web search is not available. When currency matters (deadlines, pending amendments, new guidance), state the date the built-in reference was last reviewed and tell the user to confirm the current status with an official source such as EUR-Lex.`
    );
  }

  sections.push(
    `- After receiving tool results, compose your answer. Do NOT search again for the same information.

CITATIONS:
- Cite inline as [[N]](url) using ONLY the exact URLs from tool results. NEVER fabricate or guess URLs.
- Cite each legal statement to the source it came from. Every sentence must read completely with citations removed.
- Do NOT write a References or Sources section — the app renders a Sources box automatically from your inline citations.

IMPORTANT:
- Model and vendor selection are controlled by the administrator backend.`
  );

  return sections.join("\n\n").trim();
}
