import { describe, it, expect } from "vitest";
import { and, or, not, evaluate, reads, unknownReads, type Cond } from "@/lib/rules/logic";

describe("three-valued connectives (Kleene)", () => {
  it("and: no beats unknown, unknown beats yes", () => {
    expect(and("yes", "yes")).toBe("yes");
    expect(and("yes", "unknown")).toBe("unknown");
    expect(and("unknown", "no")).toBe("no");
    expect(and()).toBe("yes");
  });

  it("or: yes beats unknown, unknown beats no", () => {
    expect(or("no", "no")).toBe("no");
    expect(or("no", "unknown")).toBe("unknown");
    expect(or("unknown", "yes")).toBe("yes");
    expect(or()).toBe("no");
  });

  it("not: swaps yes and no, keeps unknown", () => {
    expect(not("yes")).toBe("no");
    expect(not("no")).toBe("yes");
    expect(not("unknown")).toBe("unknown");
  });
});

describe("evaluate", () => {
  it("treats a missing fact as unknown, never as false", () => {
    expect(evaluate({ k: "a", is: true }, {})).toBe("unknown");
    expect(evaluate({ k: "a", is: true }, { a: undefined })).toBe("unknown");
  });

  it("matches booleans, strings and lists of allowed values", () => {
    expect(evaluate({ k: "a", is: true }, { a: true })).toBe("yes");
    expect(evaluate({ k: "a", is: true }, { a: false })).toBe("no");
    expect(evaluate({ k: "size", is: ["micro", "small"] }, { size: "small" })).toBe("yes");
    expect(evaluate({ k: "size", is: ["micro", "small"] }, { size: "large" })).toBe("no");
  });

  it("compares numbers", () => {
    const c: Cond = { k: "flop", gt: 1e25 };
    expect(evaluate(c, { flop: 2e25 })).toBe("yes");
    expect(evaluate(c, { flop: 1e25 })).toBe("no"); // the Act says "greater than", so equal is not enough
    expect(evaluate(c, {})).toBe("unknown");
  });

  it("checks list facts", () => {
    const c: Cond = { k: "uses", includesAny: ["4a", "4b"] };
    expect(evaluate(c, { uses: ["4b", "x"] })).toBe("yes");
    expect(evaluate(c, { uses: [] })).toBe("no");
    expect(evaluate(c, {})).toBe("unknown");
  });

  it("combines with all / any / not and propagates unknown", () => {
    const c: Cond = { all: [{ k: "a", is: true }, { not: { k: "b", is: true } }] };
    expect(evaluate(c, { a: true, b: false })).toBe("yes");
    expect(evaluate(c, { a: true, b: true })).toBe("no");
    expect(evaluate(c, { a: true })).toBe("unknown");
    expect(evaluate(c, { a: false })).toBe("no"); // a known "no" decides it even though b is unknown
  });
});

describe("reads / unknownReads", () => {
  const c: Cond = { all: [{ k: "a", is: true }, { any: [{ k: "b", is: true }, { not: { k: "a", is: false } }] }] };

  it("lists each key once, in order", () => {
    expect(reads(c)).toEqual(["a", "b"]);
  });

  it("lists only the unknown ones", () => {
    expect(unknownReads(c, { a: true })).toEqual(["b"]);
    expect(unknownReads(c, { a: true, b: false })).toEqual([]);
  });
});
