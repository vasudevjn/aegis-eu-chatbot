/**
 * Structured blocks inside Aegis answers.
 *
 * The model writes two small fenced blocks that the chat UI renders as rich
 * components instead of plain text (see components/messages/aegis-blocks.tsx):
 *
 *   ```aegis-summary           -> the assessment card (tier badges, role, confidence, dates)
 *   tiers: transparency, high-risk
 *   role: Provider
 *   confidence: Medium | the one fact that would change it
 *   applies: Already applies | Article 50 since 2 August 2026
 *   ```
 *
 *   ```aegis-next              -> clickable next-step buttons, one label per line
 *   Run the gap check
 *   Build the action plan
 *   ```
 *
 * Blocks are plain "key: value" lines so they stay readable if a client cannot
 * render them, and parsing is deliberately tolerant: the model may add emoji,
 * change case or reorder keys. This module is UI-free so the chat UI and the
 * Markdown export share one parser.
 */

export type TierKey = "prohibited" | "high-risk" | "transparency" | "gpai" | "minimal";

export const TIERS: Record<TierKey, { label: string; emoji: string }> = {
  prohibited: { label: "Prohibited", emoji: "🚫" },
  "high-risk": { label: "High-risk", emoji: "🔴" },
  transparency: { label: "Transparency obligations", emoji: "🟡" },
  gpai: { label: "General-purpose AI model", emoji: "🔵" },
  minimal: { label: "Minimal risk", emoji: "🟢" },
};

export type ConfidenceLevel = "High" | "Medium" | "Low";
export type AppliesTone = "now" | "later" | "mixed" | "neutral";

export interface SummaryData {
  tiers: TierKey[];
  role?: string;
  confidence?: { level: ConfidenceLevel | null; note?: string };
  applies?: { status: string; detail?: string; tone: AppliesTone };
}

/** "key: value" lines -> map with lower-cased keys. Lines without a colon are ignored. */
export function parseKeyValueBlock(code: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of code.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z][A-Za-z _-]{0,30}?)\s*:\s*(.+?)\s*$/);
    if (m) out[m[1].toLowerCase().replace(/[\s_-]+/g, "")] = m[2];
  }
  return out;
}

function toTier(token: string): TierKey | null {
  const t = token.toLowerCase();
  if (/prohibit/.test(t)) return "prohibited";
  if (/high/.test(t)) return "high-risk";
  if (/transparen/.test(t)) return "transparency";
  if (/gpai|general[\s-]*purpose/.test(t)) return "gpai";
  if (/minimal|low[\s-]*risk|no\s+risk/.test(t)) return "minimal";
  return null;
}

export function parseTiers(value: string | undefined): TierKey[] {
  if (!value) return [];
  const found: TierKey[] = [];
  for (const part of value.split(/[,;+/]|\band\b/i)) {
    const tier = toTier(part);
    if (tier && !found.includes(tier)) found.push(tier);
  }
  return found;
}

function splitPipe(value: string): [string, string | undefined] {
  const i = value.indexOf("|");
  if (i === -1) return [value.trim(), undefined];
  return [value.slice(0, i).trim(), value.slice(i + 1).trim() || undefined];
}

function toneOf(status: string): AppliesTone {
  const s = status.toLowerCase();
  if (/mixed|partly|partially|some\b/.test(s)) return "mixed";
  if (/already|applies now|in force|currently|since/.test(s)) return "now";
  if (/from|not yet|upcoming|later|will\b|20(2[6-9]|3\d)/.test(s)) return "later";
  return "neutral";
}

export function parseSummary(code: string): SummaryData {
  const kv = parseKeyValueBlock(code);
  const data: SummaryData = { tiers: parseTiers(kv.tiers ?? kv.tier ?? kv.classification) };
  if (kv.role) data.role = kv.role;
  if (kv.confidence) {
    const [head, note] = splitPipe(kv.confidence);
    const level = head.match(/\b(high|medium|low)\b/i)?.[1];
    data.confidence = {
      level: level ? ((level[0].toUpperCase() + level.slice(1).toLowerCase()) as ConfidenceLevel) : null,
      note: note ?? (level ? undefined : head),
    };
  }
  if (kv.applies) {
    const [status, detail] = splitPipe(kv.applies);
    data.applies = { status, detail, tone: toneOf(status) };
  }
  return data;
}

/** One label per non-empty line; bullets and quotes the model may add are stripped. */
export function parseNext(code: string): string[] {
  return code
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").replace(/^["“]|["”]$/g, "").trim())
    .filter(Boolean)
    .slice(0, 4);
}

/** Marker the card components look for; written into a block that is still streaming. */
export const STREAMING_MARK = "__streaming__";

/**
 * While a reply streams, a structured block with no closing fence yet would render half-parsed
 * (a lone badge, or "Would change if: Med"). Replace it with a marker so the components show a
 * loading state instead; once the closing fence arrives the real card replaces it.
 */
export function markUnfinishedBlocks(text: string): string {
  return text.replace(
    /```aegis-(summary|next)[^\n]*\n(?![\s\S]*?```)[\s\S]*$/,
    "```aegis-$1\n" + STREAMING_MARK + "\n```"
  );
}

const BLOCK_RE =/```aegis-(summary|next)[^\n]*\n([\s\S]*?)(?:```|$)/g;

/**
 * Replaces the structured blocks with plain Markdown, for places that cannot
 * render the cards (the Markdown export). The summary becomes two readable
 * lines; the next-step buttons are dropped (they are UI affordances).
 */
export function blocksToMarkdown(text: string): string {
  return text
    .replace(BLOCK_RE, (_m, kind: string, body: string) => {
      if (kind === "next") return "";
      const d = parseSummary(body);
      const lines: string[] = [];
      if (d.tiers.length)
        lines.push(
          `**Likely classification:** ${d.tiers.map((t) => `${TIERS[t].emoji} ${TIERS[t].label}`).join(" · ")}`
        );
      const meta: string[] = [];
      if (d.role) meta.push(`**Your likely role:** ${d.role}`);
      if (d.confidence)
        meta.push(
          `**Confidence:** ${[d.confidence.level, d.confidence.note && `(${d.confidence.note})`]
            .filter(Boolean)
            .join(" ")}`
        );
      if (d.applies)
        meta.push(
          `**Applies:** ${d.applies.status}${d.applies.detail ? ` (${d.applies.detail})` : ""}`
        );
      if (meta.length) lines.push(meta.join(" · "));
      return lines.join("\n\n");
    })
    .replace(/\n{3,}/g, "\n\n");
}
