import { describe, it, expect } from "vitest";
import {
  parseKeyValueBlock,
  parseTiers,
  parseSummary,
  parseNext,
  blocksToMarkdown,
  markUnfinishedBlocks,
  STREAMING_MARK,
} from "@/lib/aegis-blocks";

describe("parseTiers", () => {
  it("maps tier names to keys, most important first, without duplicates", () => {
    expect(parseTiers("transparency, high-risk")).toEqual(["transparency", "high-risk"]);
    expect(parseTiers("high-risk, High risk")).toEqual(["high-risk"]);
  });

  it("tolerates the emoji labels, casing and separators the model may use", () => {
    expect(parseTiers("🔴 High-risk + 🟡 Transparency obligations")).toEqual(["high-risk", "transparency"]);
    expect(parseTiers("PROHIBITED")).toEqual(["prohibited"]);
    expect(parseTiers("General-purpose AI model; minimal risk")).toEqual(["gpai", "minimal"]);
  });

  it("ignores unknown words and empty input", () => {
    expect(parseTiers("something else")).toEqual([]);
    expect(parseTiers(undefined)).toEqual([]);
  });
});

describe("parseSummary", () => {
  const block = [
    "tiers: transparency",
    "role: Provider",
    "confidence: Medium | whether the bot makes decisions about people",
    "applies: Already applies | Article 50 since 2 August 2026",
  ].join("\n");

  it("parses every field", () => {
    expect(parseSummary(block)).toEqual({
      tiers: ["transparency"],
      role: "Provider",
      confidence: { level: "Medium", note: "whether the bot makes decisions about people" },
      applies: { status: "Already applies", detail: "Article 50 since 2 August 2026", tone: "now" },
    });
  });

  it("classifies when obligations apply: now, later, mixed", () => {
    expect(parseSummary("applies: Applies from 2 December 2027").applies?.tone).toBe("later");
    expect(parseSummary("applies: Mixed | some now, some later").applies?.tone).toBe("mixed");
    expect(parseSummary("applies: Unclear").applies?.tone).toBe("neutral");
  });

  it("is tolerant of key casing, spacing and a confidence without a note", () => {
    const d = parseSummary("Tiers : high-risk\nCONFIDENCE: low");
    expect(d.tiers).toEqual(["high-risk"]);
    expect(d.confidence).toEqual({ level: "Low", note: undefined });
  });

  it("returns an empty card instead of throwing on garbage", () => {
    expect(parseSummary("nothing useful here")).toEqual({ tiers: [] });
  });
});

describe("parseKeyValueBlock", () => {
  it("keeps colons inside values and ignores lines without a key", () => {
    expect(parseKeyValueBlock("applies: From: 2 Dec 2027\njust text")).toEqual({ applies: "From: 2 Dec 2027" });
  });
});

describe("parseNext", () => {
  it("returns one label per line, strips bullets and quotes, caps at 4", () => {
    expect(parseNext('- Run the gap check\n2. "Build the action plan"\n\n* Draft the disclosure text\nOne\nTwo')).toEqual([
      "Run the gap check",
      "Build the action plan",
      "Draft the disclosure text",
      "One",
    ]);
  });
});

describe("markUnfinishedBlocks (streaming)", () => {
  it("replaces a block that has no closing fence yet with the streaming marker", () => {
    const out = markUnfinishedBlocks("Intro\n\n```aegis-summary\ntiers: high-ri");
    expect(out).toBe("Intro\n\n```aegis-summary\n" + STREAMING_MARK + "\n```");
  });

  it("works for the next-step block too", () => {
    expect(markUnfinishedBlocks("```aegis-next\nRun the ga")).toContain(STREAMING_MARK);
  });

  it("leaves finished blocks alone, including one followed by more text", () => {
    const done = "```aegis-summary\ntiers: high-risk\n```\n\n### Why\n- text";
    expect(markUnfinishedBlocks(done)).toBe(done);
  });

  it("only marks the unfinished block when an earlier one is complete", () => {
    const text = "```aegis-summary\ntiers: high-risk\n```\n\ntext\n\n```aegis-next\nRun";
    const out = markUnfinishedBlocks(text);
    expect(out).toContain("tiers: high-risk");
    expect(out).toContain("```aegis-next\n" + STREAMING_MARK);
  });

  it("does not touch ordinary code blocks or plain text", () => {
    const plain = "Text\n\n```js\nconst a = 1;";
    expect(markUnfinishedBlocks(plain)).toBe(plain);
  });
});

describe("blocksToMarkdown (used by the Markdown export)", () => {
  const text = [
    "```aegis-summary",
    "tiers: transparency, high-risk",
    "role: Provider",
    "confidence: Medium | a fact",
    "applies: Already applies | Article 50",
    "```",
    "",
    "### Why",
    "- Because [[1]](https://example.com).",
    "",
    "```aegis-next",
    "Run the gap check",
    "```",
  ].join("\n");

  it("turns the summary into readable lines and drops the next-step buttons", () => {
    const md = blocksToMarkdown(text);
    expect(md).toContain("**Likely classification:** 🟡 Transparency obligations · 🔴 High-risk");
    expect(md).toContain("**Your likely role:** Provider");
    expect(md).toContain("**Confidence:** Medium (a fact)");
    expect(md).toContain("**Applies:** Already applies (Article 50)");
    expect(md).not.toContain("aegis-");
    expect(md).not.toContain("Run the gap check");
  });

  it("leaves ordinary text and other code blocks untouched", () => {
    const plain = "Hello\n\n```js\nconst a = 1;\n```\n";
    expect(blocksToMarkdown(plain)).toBe(plain);
  });

  it("removes an unfinished block at the end instead of leaking its fence", () => {
    expect(blocksToMarkdown("Intro\n\n```aegis-summary\ntiers: high-ri")).not.toContain("```");
  });
});
