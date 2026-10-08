import { describe, it, expect } from "vitest";
import { reads } from "@/lib/rules/logic";
import { ProfileSchema, FACT_META } from "@/lib/rules/facts";
import {
  SCOPE_RULES, ROLE_RULES, PROHIBITED_RULES, HIGH_RISK_RULES, ROLE_SHIFT_RULES,
  TRANSPARENCY_RULES, GPAI_RULES, ALL_CLASSIFICATION_RULES,
} from "@/lib/rules/pack/rules";
import { DERIVED } from "@/lib/rules/pack/derived";
import { OBLIGATIONS } from "@/lib/rules/pack/obligations";
import { CONTROLS } from "@/lib/rules/pack/controls";
import { DATES } from "@/lib/rules/pack/timeline";
import { ANNEX3_USE_CASES, ANNEX1_LAWS } from "@/lib/rules/pack/catalogues";
import { FINES } from "@/lib/rules/pack/penalties";
import type { Rule } from "@/lib/rules/types";

/**
 * Lint for the rule pack. These checks are what keep the rules trustworthy as they grow: every
 * rule must cite the law, read only facts that exist, and never read a derived flag before the
 * stage that sets it. They run in CI like any other test.
 */

const profileKeys = new Set(Object.keys(ProfileSchema.shape));
const flagsOf = (r: Rule): string[] => (!r.flag ? [] : typeof r.flag === "string" ? [r.flag] : [...r.flag]);

describe("rule pack: structure", () => {
  it("has unique ids across rules, obligations and controls", () => {
    for (const ids of [
      ALL_CLASSIFICATION_RULES.map((r) => r.id),
      OBLIGATIONS.map((o) => o.id),
      CONTROLS.map((c) => c.id),
    ]) expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every rule and obligation a citation, a plain-language reason and a link to the law", () => {
    for (const r of ALL_CLASSIFICATION_RULES) {
      expect(r.cites.length, r.id).toBeGreaterThan(0);
      expect(r.explain.length, r.id).toBeGreaterThan(30);
    }
    for (const o of OBLIGATIONS) {
      expect(o.cites.length, o.id).toBeGreaterThan(0);
      expect(o.what.length, o.id).toBeGreaterThan(30);
      expect(o.evidence.length, o.id).toBeGreaterThan(3);
    }
    for (const c of [...ALL_CLASSIFICATION_RULES.flatMap((r) => r.cites), ...OBLIGATIONS.flatMap((o) => o.cites)]) {
      expect(c.url).toMatch(/^https:\/\/eur-lex\.europa\.eu\//);
      expect(c.page, c.ref).toBeTruthy(); // every citation records the page it was read from
    }
  });

  it("only uses date keys that exist in the timeline", () => {
    const keys = new Set(Object.keys(DATES));
    for (const r of ALL_CLASSIFICATION_RULES) if (r.date) expect(keys.has(r.date), r.id).toBe(true);
    for (const o of OBLIGATIONS) {
      const sample = { "d.hrAnnex3": true } as Record<string, unknown>;
      const k = typeof o.date === "function" ? o.date(sample) : o.date;
      expect(keys.has(k), o.id).toBe(true);
      if (typeof o.date === "function") expect(keys.has(o.date({})), o.id).toBe(true);
    }
  });

  it("uses only fine tiers that are defined", () => {
    for (const o of OBLIGATIONS) expect(FINES[o.fine], o.id).toBeDefined();
  });
});

describe("rule pack: facts and ordering", () => {
  it("reads only facts that exist in the profile, or derived flags", () => {
    const all = [
      ...ALL_CLASSIFICATION_RULES.map((r) => ({ id: r.id, keys: reads(r.when) })),
      ...DERIVED.map((d) => ({ id: d.key, keys: reads(d.when) })),
      ...OBLIGATIONS.map((o) => ({ id: o.id, keys: reads(o.when) })),
    ];
    for (const { id, keys } of all) {
      for (const k of keys) {
        if (!k.startsWith("d.")) expect(profileKeys.has(k), `${id} reads unknown fact ${k}`).toBe(true);
      }
    }
  });

  it("never reads a derived flag before the stage that sets it (same order as the engine)", () => {
    const defined = new Set<string>();
    const checkRules = (rules: Rule[]) => {
      for (const r of rules) {
        for (const k of reads(r.when).filter((x) => x.startsWith("d."))) {
          expect(defined.has(k), `${r.id} reads ${k} before it is set`).toBe(true);
        }
        flagsOf(r).forEach((f) => defined.add(f));
      }
    };
    const checkDerived = (after: string) => {
      for (const d of DERIVED.filter((x) => x.after === after)) {
        for (const k of reads(d.when).filter((x) => x.startsWith("d."))) {
          expect(defined.has(k), `${d.key} reads ${k} before it is set`).toBe(true);
        }
        defined.add(d.key);
      }
    };
    checkRules(SCOPE_RULES); checkDerived("scope");
    checkRules(ROLE_RULES); checkDerived("roles");
    checkRules(PROHIBITED_RULES);
    checkRules(HIGH_RISK_RULES); checkDerived("high_risk");
    checkRules(ROLE_SHIFT_RULES); checkDerived("role_shifts");
    checkRules(TRANSPARENCY_RULES);
    checkRules(GPAI_RULES); checkDerived("gpai");
    for (const o of OBLIGATIONS) {
      for (const k of reads(o.when).filter((x) => x.startsWith("d."))) {
        expect(defined.has(k), `${o.id} reads undefined flag ${k}`).toBe(true);
      }
    }
  });

  it("has a question for every askable fact", () => {
    for (const key of Object.keys(FACT_META)) {
      const m = FACT_META[key as keyof typeof FACT_META];
      expect(m.ask.length, key).toBeGreaterThan(10);
      expect(m.why.length, key).toBeGreaterThan(10);
    }
    // every profile fact except the free-text summary has metadata
    for (const k of profileKeys) if (k !== "summary") expect(FACT_META[k as keyof typeof FACT_META], k).toBeDefined();
  });
});

describe("rule pack: coverage of the Act", () => {
  it("has a rule for every Annex III use case (areas 2-8) and for the three biometric points", () => {
    expect(ANNEX3_USE_CASES).toHaveLength(22);
    for (const u of ANNEX3_USE_CASES) {
      expect(ALL_CLASSIFICATION_RULES.some((r) => r.id === `HR_A3_${u.id.toUpperCase()}`), u.id).toBe(true);
    }
    for (const id of ["HR_A3_1A_RBI", "HR_A3_1B_BIOMETRIC_CATEGORISATION", "HR_A3_1C_EMOTION_RECOGNITION"]) {
      expect(ALL_CLASSIFICATION_RULES.some((r) => r.id === id), id).toBe(true);
    }
  });

  it("has a rule for each of the ten prohibited practices (eight original, two added by the Omnibus)", () => {
    expect(PROHIBITED_RULES).toHaveLength(10);
    expect(PROHIBITED_RULES.filter((r) => r.date === "art5_new")).toHaveLength(2);
  });

  it("lists Annex I as amended: machinery moved from Section A to Section B", () => {
    const machinery = ANNEX1_LAWS.find((l) => l.id === "machinery");
    expect(machinery?.section).toBe("B");
    expect(ANNEX1_LAWS.filter((l) => l.section === "A")).toHaveLength(11);
    expect(ANNEX1_LAWS.filter((l) => l.section === "B")).toHaveLength(9);
  });

  it("records both the original and the current date for every date the Omnibus moved", () => {
    expect(DATES.hr_annex3).toMatchObject({ original: "2026-08-02", current: "2027-12-02" });
    expect(DATES.hr_annex1).toMatchObject({ original: "2027-08-02", current: "2028-08-02" });
    expect(DATES.art5_new).toMatchObject({ original: null, current: "2026-12-02" });
    expect(DATES.ch1_2.current).toBe("2025-02-02");
    expect(DATES.gpai.current).toBe("2025-08-02");
    expect(DATES.art50.current).toBe("2026-08-02");
  });

  it("covers every obligation with at least one control, and every control points at real obligations", () => {
    const ids = new Set(OBLIGATIONS.map((o) => o.id));
    const covered = new Set(CONTROLS.flatMap((c) => c.obligations));
    for (const o of OBLIGATIONS) expect(covered.has(o.id), `no control covers ${o.id}`).toBe(true);
    for (const c of CONTROLS) for (const id of c.obligations) expect(ids.has(id), `${c.id} -> ${id}`).toBe(true);
  });
});
