import { tool } from "ai";
import { z } from "zod";
import {
  AI_ACT_SECTIONS,
  REFERENCE_SECTION_IDS,
  getSections,
  formatSections,
} from "@/lib/ai-act/reference";
import type { UISource } from "@/types/data";

const SECTION_MENU = AI_ACT_SECTIONS.map(
  (s) => `- ${s.id}: ${s.title} (${s.provisions})`
).join("\n");

/**
 * Builds the EU AI Act reference tool: returns curated, article-level
 * summaries of Regulation (EU) 2024/1689 with EUR-Lex citation links. Works
 * without any external service, so classification and obligation mapping are
 * always grounded in the legal text.
 */
export function createAiActReference(
  collect: (s: UISource, content?: string) => void
) {
  return tool({
    description:
      "Look up the text-level reference for the EU AI Act (Regulation (EU) 2024/1689). " +
      "Call it before classifying a system, mapping obligations, stating dates or penalties. " +
      "Request every section you need in ONE call. Available sections:\n" +
      SECTION_MENU,
    inputSchema: z.object({
      sections: z
        .array(z.enum(REFERENCE_SECTION_IDS))
        .min(1)
        .max(8)
        .describe("Section ids to retrieve, e.g. ['annex-iii-use-cases', 'article-6-3-exception']"),
      query: z
        .string()
        .optional()
        .describe("Short description of what you are checking, shown to the user while the lookup runs."),
    }),
    execute: async ({ sections }) => {
      const found = getSections(sections);
      for (const s of found) {
        collect(
          {
            kind: "kb",
            title: `EU AI Act, ${s.provisions}: ${s.title}`,
            url: s.url,
            site: "EUR-Lex: Regulation (EU) 2024/1689",
          },
          `${s.title}\n${s.content}`
        );
      }
      return formatSections(found);
    },
  });
}
