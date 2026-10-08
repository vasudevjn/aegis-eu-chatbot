import { tool } from "ai";
import { z } from "zod";
import { ProfileSchema } from "@/lib/rules/facts";
import { assess } from "@/lib/rules/engine";
import { assessmentForModel } from "@/lib/rules/model-view";
import { CONTROLS } from "@/lib/rules/pack/controls";
import type { Assessment } from "@/lib/rules/assessment";
import type { UISource } from "@/types/data";

/**
 * The rule engine as a chat tool. The model only EXTRACTS facts from what the user said; the engine
 * (lib/rules) decides tier, roles, duties, dates and fines deterministically and cites the Act. The
 * full Assessment goes to the UI (AssessmentView); the model reads a short digest (toModelOutput).
 */
export function createAssessSystem(collect: (s: UISource, content?: string) => void) {
  return tool({
    description:
      "Aegis's rules engine for the EU AI Act (as amended by the Digital Omnibus). Call it whenever the user describes an AI system, " +
      "changes a fact about it, answers an open question, answers the gap check, or asks a what-if. It decides the risk tier, the user's roles, " +
      "the duties with their dates, fine exposure, confidence and the next questions, citing the Act. You do NOT classify or date anything yourself: " +
      "report what it returns. Pass the FULL set of facts known so far (merge earlier facts with new ones, not only the new ones). " +
      "Set a fact only when the user stated it or it clearly follows from what they said; leave it out when unsure (never guess). " +
      "For a what-if, pass the changed profile as `profile` and the earlier one as `compareWith`.",
    inputSchema: z.object({
      profile: ProfileSchema.describe("Every fact known about the system so far."),
      controls: z
        .record(z.string(), z.enum(["in_place", "partial", "missing"]))
        .optional()
        .describe(
          "Gap-check answers by control id, only when the user has answered them. Valid ids: " +
            CONTROLS.map((c) => c.id).join(", ")
        ),
      compareWith: ProfileSchema.optional().describe("The earlier profile, for a what-if comparison."),
    }),
    execute: async ({ profile, controls, compareWith }): Promise<Assessment> => {
      const validIds = new Set(CONTROLS.map((c) => c.id));
      const cleanControls = controls
        ? Object.fromEntries(Object.entries(controls).filter(([id]) => validIds.has(id)))
        : undefined;
      const result = assess(profile, { controls: cleanControls, compareWith });

      // The provisions the engine relied on become citable sources (the Sources box lists only those the answer cites).
      const seen = new Set<string>();
      for (const f of result.findings.filter((x) => x.status === "yes")) {
        for (const c of f.cites) {
          if (seen.has(c.url)) continue;
          seen.add(c.url);
          collect(
            {
              kind: "kb",
              title: c.src === "omnibus" ? `Digital Omnibus, ${c.ref}` : `EU AI Act, ${c.ref}`,
              url: c.url,
              site: "Aegis rules engine (links to EUR-Lex)",
            },
            `${f.title}\n${f.explain}`
          );
        }
      }
      return result;
    },
    toModelOutput: ({ output }) => ({ type: "text", value: assessmentForModel(output as Assessment) }),
  });
}
