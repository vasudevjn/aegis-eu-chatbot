/**
 * Three-valued logic and the condition language the rules are written in.
 *
 * A fact is true, false or UNKNOWN (undefined). Rules never guess: a condition
 * over an unknown fact is itself unknown, and the engine reports it as a
 * "possible" finding plus the question that would settle it. Combination
 * follows Kleene's strong three-valued logic:
 *   all: any "no" -> no; otherwise any "unknown" -> unknown; otherwise yes
 *   any: any "yes" -> yes; otherwise any "unknown" -> unknown; otherwise no
 *   not: yes <-> no, unknown stays unknown
 *
 * Conditions are plain data (not functions) so the engine can list which facts a
 * rule reads, explain a result, and test how an unknown fact would change it.
 */

export type Tri = "yes" | "no" | "unknown";

export type Value = boolean | string | number;

/** Everything a condition can read: profile facts plus values derived by earlier stages. */
export type Context = Record<string, unknown>;

export type Cond =
  /** key equals the value (or any of several values) */
  | { k: string; is: Value | readonly Value[] }
  /** numeric comparison */
  | { k: string; gt?: number; gte?: number; lt?: number; lte?: number }
  /** an array-valued fact contains at least one of the given entries */
  | { k: string; includesAny: readonly string[] }
  | { all: readonly Cond[] }
  | { any: readonly Cond[] }
  | { not: Cond };

export const TRUE: Cond = { all: [] };

export function triFromBool(b: boolean | undefined): Tri {
  return b === undefined ? "unknown" : b ? "yes" : "no";
}

export function boolFromTri(t: Tri): boolean | undefined {
  return t === "unknown" ? undefined : t === "yes";
}

export function and(...ts: Tri[]): Tri {
  if (ts.includes("no")) return "no";
  if (ts.includes("unknown")) return "unknown";
  return "yes";
}

export function or(...ts: Tri[]): Tri {
  if (ts.includes("yes")) return "yes";
  if (ts.includes("unknown")) return "unknown";
  return "no";
}

export function not(t: Tri): Tri {
  return t === "yes" ? "no" : t === "no" ? "yes" : "unknown";
}

function asList(v: Value | readonly Value[]): readonly Value[] {
  return Array.isArray(v) ? (v as readonly Value[]) : [v as Value];
}

export function evaluate(cond: Cond, ctx: Context): Tri {
  if ("all" in cond) return and(...cond.all.map((c) => evaluate(c, ctx)));
  if ("any" in cond) return or(...cond.any.map((c) => evaluate(c, ctx)));
  if ("not" in cond) return not(evaluate(cond.not, ctx));

  const v = ctx[cond.k];
  if (v === undefined || v === null) return "unknown";

  if ("is" in cond) return asList(cond.is).includes(v as Value) ? "yes" : "no";

  if ("includesAny" in cond) {
    if (!Array.isArray(v)) return "unknown";
    return cond.includesAny.some((x) => (v as unknown[]).includes(x)) ? "yes" : "no";
  }

  // numeric comparison
  if (typeof v !== "number") return "unknown";
  const checks: boolean[] = [];
  if (cond.gt !== undefined) checks.push(v > cond.gt);
  if (cond.gte !== undefined) checks.push(v >= cond.gte);
  if (cond.lt !== undefined) checks.push(v < cond.lt);
  if (cond.lte !== undefined) checks.push(v <= cond.lte);
  return checks.every(Boolean) ? "yes" : "no";
}

/** Every context key a condition reads (in order, without duplicates). */
export function reads(cond: Cond): string[] {
  const out: string[] = [];
  const walk = (c: Cond) => {
    if ("all" in c) c.all.forEach(walk);
    else if ("any" in c) c.any.forEach(walk);
    else if ("not" in c) walk(c.not);
    else if (!out.includes(c.k)) out.push(c.k);
  };
  walk(cond);
  return out;
}

/** The subset of a condition's keys that are currently unknown in the context. */
export function unknownReads(cond: Cond, ctx: Context): string[] {
  return reads(cond).filter((k) => ctx[k] === undefined || ctx[k] === null);
}
