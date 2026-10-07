import { describe, it, expect } from "vitest";
import {
  AI_ACT_SECTIONS,
  REFERENCE_SECTION_IDS,
  getSections,
  formatSections,
} from "@/lib/ai-act/reference";

describe("EU AI Act reference", () => {
  it("has unique ids and distinct EUR-Lex URLs per section", () => {
    expect(new Set(REFERENCE_SECTION_IDS).size).toBe(AI_ACT_SECTIONS.length);
    for (const s of AI_ACT_SECTIONS) {
      expect(s.url).toMatch(/^https:\/\/eur-lex\.europa\.eu\/.+CELEX:32024R1689#(art|anx)_/);
      expect(s.content.length).toBeGreaterThan(200);
    }
  });

  it("returns only the requested sections, in reference order", () => {
    const found = getSections(["timeline", "prohibited-practices", "not-a-section"]);
    expect(found.map((s) => s.id)).toEqual(["prohibited-practices", "timeline"]);
  });

  it("formats sections with a citable Source Citation link", () => {
    const [s] = getSections(["transparency-obligations"]);
    const text = formatSections([s]);
    expect(text).toContain("## Source Citation");
    expect(text).toContain(`](${s.url})`);
    expect(text.startsWith("<results>")).toBe(true);
  });

  it("states the key dates and thresholds", () => {
    const all = AI_ACT_SECTIONS.map((s) => s.content).join("\n");
    for (const fact of ["2 February 2025", "2 August 2025", "2 August 2026", "2 August 2027", "10^25", "EUR 35 million"]) {
      expect(all).toContain(fact);
    }
  });

  it("reflects the Digital Omnibus on AI as adopted law, not a pending proposal", () => {
    const [timeline] = getSections(["timeline"]);
    for (const fact of ["2026/1744", "2 December 2027", "2 August 2028", "2 December 2026"]) {
      expect(timeline.content).toContain(fact);
    }
    expect(timeline.content).not.toContain("PENDING CHANGE");
    // The superseded high-risk dates must not be presented as current.
    const [classification] = getSections(["high-risk-classification"]);
    expect(classification.content).not.toContain("Applies from 2 August 2026");
    expect(classification.content).not.toContain("applies from 2 August 2027.");
  });
});
