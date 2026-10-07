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
 * aiActReference is always available (no external service). The Pinecone
 * knowledge base and web search join when their switches and keys are set.
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

  sections.push(
    `TOOL BUDGET (limits per response):
- aiActReference: usually 1 call, requesting ALL sections you need at once (max 2 calls). Use it for every answer that classifies a system, maps obligations, or states dates, thresholds or fines.`
  );

  if (ENABLE_VECTOR_SEARCH) {
    sections.push(
      `- vectorDatabaseSearch: MAX ${MAX_KB_SEARCHES} calls. Use it after aiActReference when you need the verbatim legal text, recitals, or Commission guidance documents held in the document library.`
    );
  } else {
    sections.push(
      `NOTE: The document library (vectorDatabaseSearch) is not connected. Ignore any instruction to search it; aiActReference is the primary legal source.`
    );
  }

  if (ENABLE_WEB_SEARCH) {
    sections.push(
      `- webSearch: MAX ${MAX_WEB_SEARCHES} calls. Use it ONLY for currency checks: the status of the Digital Omnibus or any amendment, newly published Commission guidelines, codes of practice, harmonised standards, templates, or national enforcement news, or when the user asks "what's new" / "latest". Prefer one call with 2-3 additionalQueries. For legal status, restrict to official domains with includeDomains (e.g. ${OFFICIAL_SOURCE_DOMAINS.join(", ")}).`
    );
  } else {
    sections.push(
      `NOTE: Live web search is not connected. When currency matters (deadlines, pending amendments, new guidance), state the date the reference was last reviewed and tell the user to confirm the current status with an official source.`
    );
  }

  sections.push(
    `- After receiving tool results, compose your answer. Do NOT search again for the same information.

CITATIONS:
- Cite inline as [[N]](url) using ONLY the exact URLs from tool results. NEVER fabricate or guess URLs.
- Cite each legal statement to the article section it came from. Every sentence must read completely with citations removed.
- Do NOT write a References or Sources section — the app renders a Sources box automatically from your inline citations.

IMPORTANT:
- Model and vendor selection are controlled by the administrator backend.`
  );

  return sections.join("\n\n").trim();
}
