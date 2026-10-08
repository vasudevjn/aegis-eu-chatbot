import { describe, it, expect } from "vitest";
import { asSchema, convertToModelMessages, type UIMessage } from "ai";
import { assess } from "@/lib/rules/engine";
import { assessmentForModel } from "@/lib/rules/model-view";
import { assessmentToMarkdown } from "@/lib/rules/markdown";
import { appliesSummary, gapAnswersMessage, groupObligations, profileRows, timingLabel } from "@/lib/rules/present";
import { buildExportMarkdown } from "@/lib/export";
import { createAssessSystem } from "@/app/api/chat/tools/assess-system";
import { CONTROLS } from "@/lib/rules/pack/controls";

const TODAY = "2026-10-08";
const CHATBOT = {
  isAiSystem: true, euNexus: true, summary: "Customer-service chatbot", developsOrCommissionsSystem: true,
  usesSystemProfessionally: true, annex3UseCases: [], interactsDirectlyWithPeople: true,
  generatesSyntheticContent: true, placedOnMarketDate: "2026-09-01", organisationSize: "small",
};
const a = assess(CHATBOT, { today: TODAY });

describe("model view", () => {
  const text = assessmentForModel(a);

  it("is short enough to keep old assessments cheap", () => {
    expect(JSON.stringify(a).length).toBeGreaterThan(text.length * 3);
    expect(text.length).toBeLessThan(5000);
  });

  it("states the verdict, dates and the instruction not to repeat the card", () => {
    expect(text).toMatch(/Transparency duties/);
    expect(text).toMatch(/in force since 2 August 2026/);
    expect(text).toMatch(/Do not repeat/);
    expect(text).toMatch(/rule pack 2026\.10\.08/);
  });

  it("carries citation links so the model can cite what the engine relied on", () => {
    expect(text).toMatch(/https:\/\/eur-lex\.europa\.eu\//);
  });
});

describe("presentation helpers", () => {
  it("summarises what applies now and later", () => {
    expect(appliesSummary(a)).toMatchObject({ status: "Already applies", tone: "now" });
    const hiring = assess({ isAiSystem: true, euNexus: true, developsOrCommissionsSystem: true, annex3UseCases: ["4a_recruitment"], profilesPeople: true, placedOnMarketDate: "2028-01-01" }, { today: TODAY });
    expect(appliesSummary(hiring).tone).toMatch(/mixed|later/);
  });

  it("labels timing in plain words", () => {
    const o = a.obligations.find((x) => x.id === "O_T50_1_DISCLOSE_AI")!;
    expect(timingLabel(o)).toBe("In force since 2 August 2026");
  });

  it("groups duties in a stable reading order", () => {
    const groups = groupObligations(a.obligations.filter((o) => o.status === "applies")).map((g) => g.group);
    expect(groups.indexOf("Basics")).toBeLessThan(groups.indexOf("Transparency"));
  });

  it("lists the facts used without the summary and in words", () => {
    const rows = profileRows(a);
    expect(rows.find((r) => r.label === "Is an AI system")?.value).toBe("Yes");
    expect(rows.some((r) => r.label === "Summary")).toBe(false);
  });

  it("formats gap answers so the model can pass them as controls", () => {
    expect(gapAnswersMessage({ C_AI_LITERACY: "partial", C_AI_DISCLOSURE: "missing" })).toBe("Gap check answers: C_AI_LITERACY=partial; C_AI_DISCLOSURE=missing");
  });
});

describe("assessment markdown and export", () => {
  const md = assessmentToMarkdown(assess(CHATBOT, { today: TODAY, controls: { C_AI_DISCLOSURE: "missing" } }));

  it("contains the classification, duties table, action plan and assumptions", () => {
    expect(md).toMatch(/## Assessment: Customer-service chatbot/);
    expect(md).toMatch(/\*\*Classification:\*\*.*Transparency/);
    expect(md).toMatch(/\| Duty \| When \| Owner \| Evidence \| Law \|/);
    expect(md).toMatch(/### Action plan[\s\S]*\| P0 \|/);
    expect(md).toMatch(/### Assumed unless corrected/);
    expect(md).toMatch(/\]\(https:\/\/eur-lex\.europa\.eu\//);
  });

  it("is used by the conversation export, even when the turn has no text", () => {
    const messages = [
      { id: "u1", role: "user", parts: [{ type: "text", text: "We have a chatbot" }] },
      { id: "a1", role: "assistant", parts: [{ type: "tool-assessSystem", toolCallId: "t", state: "output-available", input: {}, output: a }] },
    ] as unknown as UIMessage[];
    const out = buildExportMarkdown(messages, { aiName: "Aegis", referenceReviewedOn: "2026-10-08", roleLabels: true, date: new Date("2026-10-08") });
    expect(out).toMatch(/## Assessment: Customer-service chatbot/);
  });
});

describe("assessSystem tool", () => {
  const collected: string[] = [];
  const tool = createAssessSystem((s) => collected.push(s.url ?? ""));
  const run = (input: object) => (tool.execute as (i: object, o: object) => Promise<ReturnType<typeof assess>>)(input, { toolCallId: "t", messages: [] });

  it("returns the engine's assessment and offers the relied-on provisions as sources", async () => {
    const out = await run({ profile: CHATBOT });
    expect(out.tiers.map((t) => t.tier)).toEqual(["transparency"]);
    expect(collected.length).toBeGreaterThan(0);
    expect(collected.every((u) => u.startsWith("https://eur-lex.europa.eu/"))).toBe(true);
  });

  it("ignores control ids it does not know", async () => {
    const out = await run({ profile: CHATBOT, controls: { C_AI_DISCLOSURE: "missing", C_MADE_UP: "missing" } });
    expect(out.gaps?.map((g) => g.controlId)).toEqual(["C_AI_DISCLOSURE"]);
    expect(CONTROLS.some((c) => c.id === "C_MADE_UP")).toBe(false);
  });

  it("compares with an earlier profile for what-ifs", async () => {
    const out = await run({ profile: { ...CHATBOT, emotionRecognitionBiometric: true }, compareWith: CHATBOT });
    expect(out.diff?.tiersAdded).toContain("high-risk");
  });

  it("gives the model the compact view, not the full JSON", async () => {
    const out = await run({ profile: CHATBOT });
    const view = await tool.toModelOutput!({ toolCallId: "t", input: {}, output: out } as never);
    expect(view).toMatchObject({ type: "text" });
    expect((view as { value: string }).value.length).toBeLessThan(JSON.stringify(out).length / 3);
  });

  it("exposes a JSON schema the model can fill in", async () => {
    const schema = (await asSchema(tool.inputSchema).jsonSchema) as { properties: { profile: { properties: Record<string, unknown> } } };
    const props = schema.properties.profile.properties;
    expect(Object.keys(props).length).toBeGreaterThan(50);
    expect(props.annex3UseCases).toMatchObject({ type: "array" });
    expect(props.trainingComputeFlop).toMatchObject({ type: "number" });
  });

  it("is replayed to the model as the compact view in later turns", async () => {
    const out = await run({ profile: CHATBOT });
    const messages = [
      { id: "u1", role: "user", parts: [{ type: "text", text: "We have a chatbot" }] },
      { id: "a1", role: "assistant", parts: [{ type: "tool-assessSystem", toolCallId: "t1", state: "output-available", input: { profile: CHATBOT }, output: out }, { type: "text", text: "Done." }] },
      { id: "u2", role: "user", parts: [{ type: "text", text: "What next?" }] },
    ] as unknown as UIMessage[];
    const model = await convertToModelMessages(messages, { tools: { assessSystem: tool } });
    const result = JSON.stringify(model.find((m) => m.role === "tool"));
    expect(result).toMatch(/ENGINE RESULT/);
    expect(result.length).toBeLessThan(JSON.stringify(out).length / 2);
  });
});
