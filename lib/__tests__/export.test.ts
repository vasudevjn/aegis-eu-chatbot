import { describe, it, expect } from "vitest";
import type { UIMessage } from "ai";
import { buildExportMarkdown } from "@/lib/export";

// Tool and data-* parts are awkward to type exactly in fixtures.
const part = (p: unknown) => p as UIMessage["parts"][number];

const opts = {
  aiName: "Aegis",
  referenceReviewedOn: "2026-10-07",
  roleLabels: true,
  date: new Date("2026-10-08T10:00:00Z"),
};

const user = (text: string): UIMessage => ({
  id: "u1",
  role: "user",
  parts: [{ type: "text", text }],
});

const welcome: UIMessage = {
  id: "welcome-1",
  role: "assistant",
  parts: [{ type: "text", text: "Hi, I'm Aegis." }],
};

const URL_A = "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689#art_5";
const URL_B = "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689#art_50";

const answer: UIMessage = {
  id: "a1",
  role: "assistant",
  parts: [
    part({ type: "tool-aiActReference", toolCallId: "t1", state: "output-available", input: {}, output: "x" }),
    // The model's own numbers (7 and 3) must be ignored, as on screen.
    { type: "text", text: `Social scoring is banned [[7]](${URL_A}). Chatbots must disclose [[3]](${URL_B}).` },
    part({
      type: "data-sources",
      data: [
        { kind: "kb", title: "EU AI Act, Article 5", url: URL_A, site: "EUR-Lex", number: 1 },
        { kind: "kb", title: "EU AI Act, Article 50", url: URL_B, site: "EUR-Lex", number: 2 },
      ],
    }),
  ],
};

describe("buildExportMarkdown", () => {
  it("returns null when only the welcome message exists", () => {
    expect(buildExportMarkdown([welcome], opts)).toBeNull();
  });

  it("skips the welcome message and keeps the real turns", () => {
    const md = buildExportMarkdown([welcome, user("Assess our hiring tool"), answer], opts)!;
    expect(md).not.toContain("Hi, I'm Aegis");
    expect(md).toContain("**You**");
    expect(md).toContain("Assess our hiring tool");
    expect(md).toContain("**Aegis**");
  });

  it("renumbers citations the way the chat UI does", () => {
    const md = buildExportMarkdown([answer], opts)!;
    expect(md).toContain(`[[1]](${URL_A})`);
    expect(md).toContain(`[[2]](${URL_B})`);
    expect(md).not.toContain("[[7]]");
    expect(md).not.toContain("[[3]]");
  });

  it("appends the Sources list with links", () => {
    const md = buildExportMarkdown([answer], opts)!;
    expect(md).toContain("**Sources**");
    expect(md).toContain(`1. [EU AI Act, Article 5](${URL_A}) — EUR-Lex`);
    expect(md).toContain(`2. [EU AI Act, Article 50](${URL_B}) — EUR-Lex`);
  });

  it("omits assistant turns that contain no text", () => {
    const toolOnly: UIMessage = { id: "a2", role: "assistant", parts: [answer.parts[0]] };
    expect(buildExportMarkdown([toolOnly], opts)).toBeNull();
  });

  it("states that it is AI-generated, not legal advice, with the reference date", () => {
    const md = buildExportMarkdown([answer], opts)!;
    expect(md).toContain("not legal advice");
    expect(md).toContain("2026-10-07");
    expect(md).toContain("Exported 2026-10-08");
  });

  it("exports the summary card as readable Markdown and drops the next-step buttons", () => {
    const withCard: UIMessage = {
      id: "a3",
      role: "assistant",
      parts: [
        {
          type: "text",
          text: [
            "```aegis-summary",
            "tiers: transparency",
            "role: Provider",
            "confidence: Medium | whether it decides things about people",
            "applies: Already applies | Article 50 since 2 August 2026",
            "```",
            "",
            "### Why",
            `- Chatbots must disclose [[4]](${URL_B}).`,
            "",
            "```aegis-next",
            "Run the gap check",
            "```",
          ].join("\n"),
        },
      ],
    };
    const md = buildExportMarkdown([withCard], { ...opts, roleLabels: false })!;
    expect(md).toContain("**Likely classification:** 🟡 Transparency obligations");
    expect(md).toContain("**Your likely role:** Provider");
    expect(md).toContain("**Applies:** Already applies (Article 50 since 2 August 2026)");
    expect(md).toContain(`[[1]](${URL_B})`); // citations are still renumbered
    expect(md).not.toContain("```");
    expect(md).not.toContain("Run the gap check");
  });

  it("omits role labels for a single-answer export", () => {
    const md = buildExportMarkdown([answer], { ...opts, roleLabels: false })!;
    expect(md).not.toContain("**Aegis**");
    expect(md).not.toContain("**You**");
  });
});
