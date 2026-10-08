import type { Context } from "@/lib/rules/logic";
import type { Cite, DateKey, Timing } from "@/lib/rules/types";
import { act, omni } from "@/lib/rules/pack/cite";
import { formatDate } from "@/lib/rules/dates";

/**
 * When each part of the Act applies.
 *
 * `original` is the date in Article 113 of Regulation (EU) 2024/1689 as adopted (OJ L, 12.7.2024,
 * p.123); `current` is the date now in force after Regulation (EU) 2026/1744 (the Digital Omnibus
 * on AI, OJ L, 24.7.2026, p.35, in force since 27 July 2026). Keeping both lets the engine say
 * "moved from X to Y" instead of silently using one of them.
 *
 * Article 113 as amended: the Regulation applies from 2 August 2026 in general, except:
 *   (a) Chapters I and II (Articles 1-5) from 2 February 2025, with Article 5(1)(ba), (bb), (1a),
 *       (1b) from 2 December 2026;
 *   (b) Chapter III Section 4, Chapter V, Chapter VII, Chapter XII and Article 78 from 2 August
 *       2025 (Article 101 excepted);
 *   (c) Chapter III Sections 1, 2 and 3 (except Article 6(5)) from 2 December 2027 for Article 6(2) /
 *       Annex III systems and 2 August 2028 for Article 6(1) / Annex I systems.
 */
export interface DateEntry {
  key: DateKey;
  label: string;
  original: string | null;
  current: string;
  note?: string;
  cites: Cite[];
}

export const DATES: Record<DateKey, DateEntry> = {
  ch1_2: {
    key: "ch1_2", label: "Chapters I and II: AI literacy and prohibited practices",
    original: "2025-02-02", current: "2025-02-02",
    cites: [act("Art. 113(a)", 113, 123)],
  },
  art5_new: {
    key: "art5_new", label: "New prohibitions: non-consensual intimate imagery and child sexual abuse material",
    original: null, current: "2026-12-02",
    note: "Added by the Digital Omnibus; they did not exist under the Act as adopted.",
    cites: [omni("Art. 113(a)", 35)],
  },
  gpai: {
    key: "gpai", label: "General-purpose AI model obligations (Chapter V)",
    original: "2025-08-02", current: "2025-08-02",
    cites: [act("Art. 113(b)", 113, 123)],
  },
  penalties: {
    key: "penalties", label: "Penalties (Chapter XII, except Article 101)",
    original: "2025-08-02", current: "2025-08-02",
    cites: [act("Art. 113(b)", 113, 123)],
  },
  art50: {
    key: "art50", label: "Transparency obligations (Article 50)",
    original: "2026-08-02", current: "2026-08-02",
    cites: [act("Art. 113", 113, 123)],
  },
  art50_2_legacy: {
    key: "art50_2_legacy", label: "Marking of AI-generated content (Article 50(2))",
    original: "2026-08-02", current: "2026-08-02",
    note: "Generative systems already on the market before 2 August 2026 have until 2 December 2026.",
    cites: [act("Art. 113", 113, 123), omni("Art. 111(4)", 35)],
  },
  gpai_fines: {
    key: "gpai_fines", label: "Commission fines on general-purpose AI model providers (Article 101)",
    original: "2026-08-02", current: "2026-08-02",
    cites: [act("Art. 113", 113, 123), act("Art. 101", 101, 117)],
  },
  hr_annex3: {
    key: "hr_annex3", label: "High-risk obligations for Annex III systems (Chapter III, Sections 1-3)",
    original: "2026-08-02", current: "2027-12-02",
    note: "Moved by the Digital Omnibus.",
    cites: [omni("Art. 113(c)(i)", 35), act("Art. 113", 113, 123)],
  },
  hr_annex1: {
    key: "hr_annex1", label: "High-risk obligations for Annex I products (Chapter III, Sections 1-3)",
    original: "2027-08-02", current: "2028-08-02",
    note: "Moved by the Digital Omnibus.",
    cites: [omni("Art. 113(c)(ii)", 35), act("Art. 113(c)", 113, 123)],
  },
};

export const AI_ACT_GENERAL_DATE = "2026-08-02";
/** Article 111(2): systems intended for public authorities must comply by this date regardless. */
export const PUBLIC_AUTHORITY_DEADLINE = "2030-08-02";
/** Article 111(3): general-purpose AI models placed on the market before 2 August 2025. */
export const GPAI_LEGACY_CUTOFF = "2025-08-02";
export const GPAI_LEGACY_DEADLINE = "2027-08-02";

export { formatDate };

function movedNote(e: DateEntry): string {
  return e.original && e.original !== e.current ? ` (moved from ${formatDate(e.original)} by the Digital Omnibus)` : "";
}

function statusFor(from: string, today: string): "in_force" | "upcoming" {
  return today >= from ? "in_force" : "upcoming";
}

function describe(e: DateEntry, from: string, today: string): string {
  return statusFor(from, today) === "in_force"
    ? `Applies since ${formatDate(from)}${movedNote(e)}.`
    : `Applies from ${formatDate(from)}${movedNote(e)}.`;
}

/**
 * Works out when an obligation bites for this system, applying the transitional rules:
 *  - Article 111(2) as amended: a high-risk system placed on the market before the date its Chapter III
 *    duties start is only caught if it later undergoes significant design changes (public-authority
 *    systems: 2 August 2030 regardless);
 *  - Article 111(3): general-purpose AI models placed on the market before 2 August 2025 have until
 *    2 August 2027;
 *  - Article 111(4): Article 50(2) for generative systems placed on the market before 2 August 2026
 *    by 2 December 2026.
 */
export function resolveTiming(key: DateKey, ctx: Context, today: string): Timing {
  const e = DATES[key];
  const launch = typeof ctx.placedOnMarketDate === "string" ? ctx.placedOnMarketDate : undefined;

  if (key === "hr_annex3" || key === "hr_annex1") {
    const from = e.current;
    if (launch && launch < from) {
      if (ctx.significantDesignChangeSinceLaunch === true) {
        return { status: statusFor(from, today), from, note: `${describe(e, from, today)} Because the design changed significantly after launch, the transitional relief of Article 111(2) does not apply.` };
      }
      if (ctx.usedByPublicAuthorities === true) {
        return { status: statusFor(PUBLIC_AUTHORITY_DEADLINE, today), from: PUBLIC_AUTHORITY_DEADLINE, note: `Article 111(2): a system already on the market and intended for public authorities must comply by ${formatDate(PUBLIC_AUTHORITY_DEADLINE)}.` };
      }
      return { status: "grandfathered", note: `Article 111(2): the system was placed on the market before ${formatDate(from)}, so the Act only applies to it if it undergoes significant design changes after that date.` };
    }
    return { status: statusFor(from, today), from, note: describe(e, from, today) };
  }

  if (key === "art50_2_legacy") {
    if (launch && launch < AI_ACT_GENERAL_DATE) {
      const from = "2026-12-02";
      return { status: statusFor(from, today), from, note: `Article 111(4): this generative system was placed on the market before ${formatDate(AI_ACT_GENERAL_DATE)}, so marking is required from ${formatDate(from)}.` };
    }
    return { status: statusFor(e.current, today), from: e.current, note: describe(e, e.current, today) };
  }

  if (key === "gpai") {
    const modelDate = typeof ctx.modelPlacedOnMarketDate === "string" ? ctx.modelPlacedOnMarketDate : undefined;
    if (modelDate && modelDate < GPAI_LEGACY_CUTOFF) {
      return { status: statusFor(GPAI_LEGACY_DEADLINE, today), from: GPAI_LEGACY_DEADLINE, note: `Article 111(3): a model placed on the market before ${formatDate(GPAI_LEGACY_CUTOFF)} must comply by ${formatDate(GPAI_LEGACY_DEADLINE)}.` };
    }
    return { status: statusFor(e.current, today), from: e.current, note: describe(e, e.current, today) };
  }

  return { status: statusFor(e.current, today), from: e.current, note: describe(e, e.current, today) };
}

/** The dates a reader usually asks about, in order, with their status relative to `today`. */
export function timelineOverview(today: string): Array<{ key: DateKey; label: string; from: string; original: string | null; status: "in_force" | "upcoming"; note?: string }> {
  return (Object.values(DATES) as DateEntry[])
    .filter((e) => e.key !== "art50_2_legacy" && e.key !== "penalties")
    .map((e) => ({ key: e.key, label: e.label, from: e.current, original: e.original, status: statusFor(e.current, today), note: e.note }))
    .sort((a, b) => a.from.localeCompare(b.from));
}
