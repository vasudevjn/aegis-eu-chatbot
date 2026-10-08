// config.ts
// Central app config (NO static MODEL export) --> myAI6

function getDateAndTime(): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  return `The day today is ${dateStr} and the time right now is ${timeStr}.`;
}

export const DATE_AND_TIME = getDateAndTime();

// --- Assistant identity (all user-facing naming derives from these) ---
export const AI_NAME = "Aegis";
export const AI_TAGLINE = "EU AI Act Compliance Copilot";
export const OWNER_NAME = "Team Aegis"; // ← the team that builds and maintains the copilot
export const AI_DESCRIPTION = `
${AI_NAME} is an ${AI_TAGLINE}: describe an AI system in plain language and it classifies its likely risk tier under the EU AI Act, maps the obligations that apply to your role, checks for compliance gaps, and drafts a prioritised action plan and evidence artefacts. A first-line governance copilot, not legal advice.
`.trim();

// Browser tab / metadata title. Change freely — one line, no other edits needed.
export const BROWSER_TAB_TITLE = `${AI_NAME} · ${AI_TAGLINE}`;

export const WELCOME_MESSAGE = `Hi, I'm **${AI_NAME}**, your EU AI Act compliance copilot.

Describe an AI system you build or use, in plain language. I'll walk you through:

1. **Classify**: is it prohibited, high-risk, subject to transparency duties, a general-purpose AI model, or minimal risk?
2. **Map obligations**: what applies to you as a provider, deployer, importer or distributor.
3. **Check compliance**: a few targeted questions to find gaps.
4. **Act**: a prioritised action plan, plus draft evidence such as checklists and governance registers.

*Example: "We use an AI model to screen job applications and rank candidates based on their CV and interview responses."*

I'm a first-line governance tool, not a lawyer. Use my output to prepare for formal legal review.`;

// One-click prompts shown under the welcome message on a fresh chat.
export const STARTER_PROMPTS = [
  {
    label: "Hiring tool",
    prompt: "We use an AI model to screen job applications and rank candidates.",
  },
  {
    label: "Customer-service chatbot",
    prompt: "Our app has a customer-service chatbot built on a third-party LLM.",
  },
  {
    label: "AI marketing images",
    prompt: "We generate marketing images with AI for EU campaigns.",
  },
  {
    label: "Credit scoring",
    prompt: "Our credit-scoring model decides loan eligibility.",
  },
] as const;
export const CLEAR_CHAT_TEXT = "New";

// --- Terms of Use (app/terms/page.tsx) ---
// Operator-specific details the Terms cannot invent. Fill these in before
// public launch; empty values simply omit the matching clause.
export const TERMS_LAST_UPDATED = "7 October 2026"; // bump whenever the Terms change
export const TERMS_CONTACT_EMAIL = ""; // where users reach the operator (privacy requests, questions)
export const TERMS_GOVERNING_LAW = ""; // e.g. "the laws of India"; empty = no governing-law / forum clause

// --- Defaults (PROF REQUIREMENT: Anthropic by default) ---
export const DEFAULT_VENDOR = "anthropic" as const;

// Claude Sonnet 5.5: stronger legal reasoning than Haiku for classification and obligation
// mapping. Uses adaptive thinking (see anthropicThinkingOptions), so the thinking budgets
// below do not apply to it. Background tasks stay on the cheaper UTILITY_MODEL_ID.
export const DEFAULT_MODEL_ID = "claude-sonnet-5-5" as const;

export const DEFAULT_MODE = "chat" as const; // "chat" | "reasoning"

// Default thinking level (used when reasoning is triggered)
export const DEFAULT_THINKING_LEVEL = "medium" as const; // "off" | "low" | "medium" | "high"

// --- Utility Model (background tasks) ---
// Small, fast model used for background work: the moderation classifier and
// conversation compaction summaries. Independent of the chat model above, so you
// can run chat and utilities on different vendors — or switch everything to one
// vendor. The API key for the chosen vendor must be set.
export type UtilityVendor = "anthropic" | "openai" | "fireworks";
export const UTILITY_VENDOR: UtilityVendor = "anthropic";
export const UTILITY_MODEL_ID = "claude-haiku-4-5"; // e.g. "gpt-5.4-mini" for openai, "accounts/fireworks/models/deepseek-v3" for fireworks

// --- Moderation denial messages ---
export const MODERATION_DENIAL_MESSAGE_SEXUAL =
  "I can't discuss explicit sexual content. Please ask something else.";
export const MODERATION_DENIAL_MESSAGE_SEXUAL_MINORS =
  "I can't discuss content involving minors in a sexual context. Please ask something else.";
export const MODERATION_DENIAL_MESSAGE_HARASSMENT =
  "I can't engage with harassing content. Please be respectful.";
export const MODERATION_DENIAL_MESSAGE_HARASSMENT_THREATENING =
  "I can't engage with threatening or harassing content. Please be respectful.";
export const MODERATION_DENIAL_MESSAGE_HATE =
  "I can't engage with hateful content. Please be respectful.";
export const MODERATION_DENIAL_MESSAGE_HATE_THREATENING =
  "I can't engage with threatening hate speech. Please be respectful.";
export const MODERATION_DENIAL_MESSAGE_ILLICIT =
  "I can't discuss illegal activities. Please ask something else.";
export const MODERATION_DENIAL_MESSAGE_ILLICIT_VIOLENT =
  "I can't discuss violent illegal activities. Please ask something else.";
export const MODERATION_DENIAL_MESSAGE_SELF_HARM =
  "I can't discuss self-harm. If you're struggling, please reach out to a mental health professional or crisis helpline.";
export const MODERATION_DENIAL_MESSAGE_SELF_HARM_INTENT =
  "I can't discuss self-harm intentions. If you're struggling, please reach out to a mental health professional or crisis helpline.";
export const MODERATION_DENIAL_MESSAGE_SELF_HARM_INSTRUCTIONS =
  "I can't provide instructions related to self-harm. If you're struggling, please reach out to a mental health professional or crisis helpline.";
export const MODERATION_DENIAL_MESSAGE_VIOLENCE =
  "I can't discuss violent content. Please ask something else.";
export const MODERATION_DENIAL_MESSAGE_VIOLENCE_GRAPHIC =
  "I can't discuss graphic violent content. Please ask something else.";
export const MODERATION_DENIAL_MESSAGE_DEFAULT =
  "Your message violates our guidelines. I can't answer that.";

// --- Pinecone ---
export const PINECONE_TOP_K = 20; // sized for a multi-document KB; raise if the index grows substantially
export const PINECONE_MIN_SCORE = 0.1; // filter out low-relevance matches (lowered to catch acronym/abbreviation queries)
// Set the PINECONE_INDEX_NAME env var (Vercel or .env.local) to use your own index; the default applies when unset.
// Pinecone index names must be lowercase (letters, numbers, hyphens).
export const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME?.trim() || "aegis";

// Parent-child retrieval (3-namespace architecture)
export const PINECONE_USE_PARENT_CHILD = true; // false = legacy "default" namespace
export const PINECONE_NS_CHILDREN = "children";
export const PINECONE_NS_PARENTS = "parents";
export const PINECONE_NS_PROPOSITIONS = "propositions";
export const PINECONE_PROP_BOOST = 0.5; // proposition score weight
export const PINECONE_PROP_K = 15; // propositions retrieved per search to boost children
export const PINECONE_VISUAL_TOP_K = 20; // topK for the visual-enrichment query (figures/tables/slides of a retrieved source)
export const PINECONE_VISUALS_PER_SOURCE = 20; // max figure/table chunks merged into context per retrieved source (keep >= PINECONE_VISUAL_TOP_K so late-document figures are not cut)

// --- Knowledge Base Scope (tells the model what topics are indexed) ---
// Describes the Pinecone document library, Aegis's PRIMARY source. It is inserted
// into the model's instructions, so it must match what is actually ingested: update
// this list whenever you ingest or remove content (see README, "Knowledge base").
export const KB_SCOPE = `
The document library holds the text of Regulation (EU) 2024/1689 (the AI Act): recitals, articles and annexes.
It is the text as originally adopted and does NOT reflect later amendments such as the Digital Omnibus on AI (Regulation (EU) 2026/1744). For dates, applicability and amendments, the built-in reference governs where the two differ.

Any question about the EU AI Act is within scope.
`.trim();

// --- Exa Web Search ---
export const EXA_NUM_RESULTS = 10;
export const EXA_SEARCH_TYPE = "deep" as const; // "auto" | "neural" | "deep" | "deep-reasoning"
export const EXA_MAX_CHARACTERS = 3000; // max chars of page text per result
// "preferred" makes Exa fetch live page content when possible, reducing the odds
// that stale or deleted pages (e.g. dead university URLs) surface in results.
export const EXA_LIVECRAWL = "preferred" as const; // "never" | "fallback" | "preferred" | "always"
export const EXA_SYSTEM_PROMPT = `Prefer official and primary sources on the EU AI Act: EUR-Lex, the European Commission (digital-strategy.ec.europa.eu, ec.europa.eu, the AI Act Service Desk), the European Parliament, the Council of the EU, the European Data Protection Board, and national market surveillance authorities. Then reputable law firms and established policy trackers. Prefer the most recent publication; avoid duplicates, marketing pages and outdated material.`;

// Official domains the model restricts webSearch to when checking legal status
// (amendments, guidelines, codes of practice).
export const OFFICIAL_SOURCE_DOMAINS = [
  "eur-lex.europa.eu",
  "digital-strategy.ec.europa.eu",
  "ec.europa.eu",
  "europarl.europa.eu",
  "consilium.europa.eu",
];

// --- Chat Route Limits ---
// Hard cap on tool-use steps per request. Must be large enough to cover the
// per-response soft budgets below plus up to two aiActReference calls and the
// final compose step, i.e. >= MAX_KB_SEARCHES + MAX_WEB_SEARCHES + 3.
export const MAX_STEPS = 8; // max tool-use steps per request
// Per-response soft budgets (enforced via prompt guidance in lib/ai/tools.ts).
export const MAX_KB_SEARCHES = 2; // max vectorDatabaseSearch calls per response
export const MAX_WEB_SEARCHES = 2; // max webSearch calls per response
export const MAX_MESSAGES = 100; // max messages in conversation history
export const MAX_MESSAGE_TEXT_LENGTH = 10000; // max chars per user message
export const VERCEL_MAX_DURATION = 120; // Vercel Pro plan function timeout in seconds

// --- Conversation Compaction ---
// Summarizes older messages when token count exceeds threshold to reduce input costs.
export const COMPACTION_ENABLED = true; // set false to disable compaction
export const COMPACTION_TOKEN_THRESHOLD = 40000; // compact when summary + unsummarized messages exceed this (tokens)
export const COMPACTION_KEEP_RECENT = 4; // keep last N messages intact when compacting (2 user + 2 assistant turns)
export const COMPACTION_CHARS_PER_TOKEN = 4; // heuristic: chars/token ratio for estimation (lower = more conservative)
export const COMPACTION_MAX_SUMMARY_WORDS = 1500; // max word limit for LLM summary (LLM should be concise but not artificially short)
export const COMPACTION_MAX_SUMMARY_CHARS = 8000; // hard safety cap on summary length (truncates if LLM exceeds — should rarely trigger)
export const COMPACTION_SHOW_CONTEXT_MEMORY = true; // show "Context Memory" button in header to view summary

// --- Thinking Budget (tokens) ---
export const THINKING_BUDGET_LOW = 2000;
export const THINKING_BUDGET_MEDIUM = 8000;
export const THINKING_BUDGET_HIGH = 15000;
// Thinking level used in plain "chat" mode (reasoning mode uses the routed level).
export const CHAT_THINKING_LEVEL = "low" as const; // "low" | "medium" | "high"

// --- Output Tokens ---
// Hard cap on response tokens per request. undefined = the provider's default.
// If set while Anthropic thinking is enabled, it must EXCEED the thinking
// budget in use (the API rejects max_tokens <= thinking budget).
export const MAX_OUTPUT_TOKENS: number | undefined = undefined;

// --- Reasoning Escalation ---
export const STRONG_REASONING_LENGTH_THRESHOLD = 1800; // long messages with code keywords → high reasoning

// --- Citation Verification (green check in the Sources box) ---
// The sentence preceding each citation (its claim) is checked against the
// cited source's retrieved text by significant-word containment; legacy
// in-citation quotes, when present, are checked by substring/containment.
export const CITATION_CLAIM_MIN_CHARS = 20; // shorter preceding fragments are not treated as claims
export const CITATION_CLAIM_MAX_CHARS = 300; // claims are trimmed to their last N chars
export const CITATION_CLAIM_MIN_WORD_LENGTH = 4; // "significant" words for claim matching
export const CITATION_CLAIM_MIN_WORDS = 3; // claims with fewer significant words are unverifiable
export const CITATION_CLAIM_MATCH_RATIO = 0.6; // share of significant words that must appear in the source
export const CITATION_QUOTE_MIN_WORD_LENGTH = 3; // "significant" words for quote matching
export const CITATION_QUOTE_MATCH_RATIO = 0.8; // share of quote words that must appear in the source

// --- Rate Limiting ---
export const RATE_LIMIT_ENABLED = true; // set false to disable rate limiting
export const RATE_LIMIT_WINDOW_MS = 60_000; // sliding window size (1 minute)
export const RATE_LIMIT_MAX_REQUESTS = 20; // max requests per window per IP

// --- Pinecone Cache ---
export const PINECONE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// --- Moderation ---
// Provider that checks user messages for harmful content BEFORE they reach the chat model.
// Set via the env var MODERATION_PROVIDER (in Vercel or .env.local); defaults to "llm":
// "llm"    = LLM classifier running on the utility model above (any vendor)
//            ("anthropic" is accepted as a legacy alias for this value)
// "openai" = OpenAI's dedicated moderation API (requires OPENAI_API_KEY with access to omni-moderation-latest)
// "off"    = no moderation call at all; relies solely on the system prompt guardrails
export type ModerationProvider = "llm" | "openai" | "off";
const _moderationEnv = process.env.MODERATION_PROVIDER?.toLowerCase();
export const MODERATION_PROVIDER: ModerationProvider =
  _moderationEnv === "openai" || _moderationEnv === "off"
    ? _moderationEnv
    : "llm";

// "open" = allow requests when the moderation service is unavailable
// "closed" = block requests when the moderation service is unavailable
// (irrelevant when MODERATION_PROVIDER = "off")
export const MODERATION_FAIL_POLICY = "closed" as const;

// --- Reasoning Display ---
// Controls how the thinking/reasoning block is shown in the chat UI.
// "full"       = show collapsible reasoning with full text (debugging only — exposes prompts!)
// "truncated"  = show first N words of reasoning, then "..." (safe, gives a glimpse)
// "hidden"     = show only the past-tense label (e.g., "Reasoned for 2 seconds"), no expandable content
export type ReasoningDisplayMode = "full" | "truncated" | "hidden";
export const REASONING_DISPLAY_MODE: ReasoningDisplayMode = "truncated";
export const REASONING_TRUNCATE_WORDS = 15; // words to show in "truncated" mode

// --- Backend toggles ---
// The Pinecone document library switches on automatically when its API key is set
// (force off with its env var). Web search is opt-in only (see below). The built-in
// EU AI Act reference (aiActReference tool) needs no key and is always on.

// Web search (Exa): OFF by default. Aegis answers from the Pinecone document library
// and the built-in reference only. To opt in, set ENABLE_WEB_SEARCH=true AND EXA_API_KEY;
// a key on its own does not switch it on.
export const ENABLE_WEB_SEARCH =
  process.env.ENABLE_WEB_SEARCH?.toLowerCase() === "true" &&
  !!process.env.EXA_API_KEY;

// Pinecone document library: on when PINECONE_API_KEY is set. Force off with
// ENABLE_VECTOR_SEARCH=false. When off, the KB tool is removed from the model
// and no Pinecone connection is made.
export const ENABLE_VECTOR_SEARCH =
  process.env.ENABLE_VECTOR_SEARCH?.toLowerCase() !== "false" &&
  !!process.env.PINECONE_API_KEY;
