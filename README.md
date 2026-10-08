# Aegis: EU AI Act Compliance Copilot

**Helping companies turn a complex regulation into clear, actionable compliance.**

Aegis is a conversational AI governance assistant. A product manager describes an AI system in plain language, for example:

> "We use an AI model to screen job applications and rank candidates based on their CV and interview responses."

Aegis then runs a structured assessment:

**Describe → Classify → Map obligations → Check gaps → Act**

| Capability | What it does |
|---|---|
| Classify | Likely tier: prohibited (Art. 5), high-risk (Art. 6, Annex I and III, including the Art. 6(3) exception and the profiling override), transparency (Art. 50), general-purpose AI model (Arts. 51–55), minimal risk. Tiers can stack. |
| Map obligations | Duties for the user's role (provider, deployer, importer, distributor; Art. 25 role shifts), translated into product, engineering, data, legal and governance work with owners, evidence and start dates. |
| Check compliance | Targeted questions on existing controls, marked in place, partial or missing. |
| Recommend actions | Prioritised P0 / P1 / P2 action plan, each step tied to an article and the evidence it produces. |
| Generate evidence | Draft artefacts: risk checklists, Annex IV documentation outlines, AI governance registers, FRIA outlines, disclosure text, incident runbooks, questions for legal and security. Exportable as Markdown. |
| Stay current | Date-aware phased timeline (Art. 113) that applies the original and the amended dates side by side, reflecting the Digital Omnibus on AI (Regulation (EU) 2026/1744, in force 27 July 2026). |

**Who it's for:** product managers, engineering and data teams, legal and compliance teams, and business leaders.

**Core principle:** Aegis does not replace lawyers or regulators. It is a *first-line* copilot that prepares teams for formal compliance review. Every assessment says so.

## How it works

```
User message
   |
   v
[Moderation] -- blocked --> denial message
   |
   v
[Language model + tools]
   |-- assessSystem ---------> rules engine: tier, roles, duties, dates, fines
   |-- vectorDatabaseSearch --> Pinecone document library (primary legal source)
   |-- aiActReference -------> built-in article-level summary of the Act
   |-- webSearch ------------> Exa, official EU sources (off by default)
   v
[Assessment card + streamed answer with inline citations and a Sources box]
```

The language model never decides a classification. For a described system it extracts facts and calls the rules engine; for questions about the law it searches the document library first and falls back to the built-in reference, saying so when it does.

## The rules engine

A deterministic rules engine ([`lib/rules/`](lib/rules/README.md)) decides the risk tier, your role, the duties with their dates, fine exposure and confidence, and cites the article behind each step. The model only reads what you wrote and extracts facts.

- **Rules as data:** 64 classification rules, 50 obligations and 33 gap-check controls, each with a plain-language reason, the article and the Official Journal page.
- **Unknown is not "no":** conditions use three-valued logic. Missing facts become questions ranked by how much they would change the answer, and confidence (High, Medium, Low) is computed from them.
- **Both sets of dates:** every date the Omnibus moved is kept with its original and current value, and the Article 111 transitional rules are applied.
- **In the chat:** an assessment card with the reasons, duties by owner, open questions, a gap-check form, an action plan and a what-if comparison. The Markdown export includes it.
- **Reproducible:** the same facts and date always give the same result. About 100 rule and golden-case tests run with `npm test`.

See [`lib/rules/README.md`](lib/rules/README.md) for the design and how to update the rules when the law changes.

## How it's grounded

- **Document library (primary source):** the Act's text ingested into Pinecone (see below). Aegis searches it first on every substantive question. It switches on once `PINECONE_API_KEY` is set.
- **Built-in legal reference** ([`lib/ai-act/reference.ts`](lib/ai-act/reference.ts)): 16 curated, article-level sections of Regulation (EU) 2024/1689 as amended (scope, roles, AI literacy, prohibited practices, high-risk classification, Annex III, the Art. 6(3) exception, Arts. 8–15 requirements, provider and deployer duties, FRIA, Art. 50 transparency, GPAI, incident reporting, timeline, penalties, sandboxes), each linking to the official EUR-Lex text. It needs no external service and is the fallback when the library has nothing relevant or is unavailable.
- **Web search (off by default):** Exa, steered to official EU domains. Opt in with `ENABLE_WEB_SEARCH=true` plus `EXA_API_KEY`.
- **Citations:** answers cite sources inline; numbering is canonicalized in code and the cited sources appear in a single Sources box ([`lib/citations.ts`](lib/citations.ts), unit-tested). Citations are checked against the retrieved text where possible.

## Knowledge base

The document library uses a parent-child layout across three Pinecone namespaces:

| Namespace | Content | Purpose |
|---|---|---|
| `children` | Small chunks (about 500 characters) with keywords and summaries | Searched for relevance |
| `propositions` | Atomic factual statements | Boost matching children |
| `parents` | Context chunks (about 3000 characters) | Fetched by `parent_id` for richer context |

Retrieval searches children, boosts them with matching propositions, keeps one child per parent, then fetches the parents. Thresholds, namespaces and the index name are in [`config.ts`](config.ts) (`PINECONE_*`).

Content is ingested with the notebook `RAGloader/RAG_loader_pipeline.ipynb`, which imports its logic from `RAGloader/myAI6_RAG.py` (structural parsing, parent-child splitting, enrichment, propositions, figure and table handling). Source documents go in `RAGloader/content/`, which is gitignored. Notebooks must never be committed with API keys filled in.

## One deployment: presentation at `/`, chatbot at `/chat`

| URL | What it is |
|---|---|
| `/` | The presentation site (4 slides plus a "Talk to Aegis" tab), served from [`public/presentation/`](public/presentation) through a rewrite in [`next.config.ts`](next.config.ts) |
| `/chat` | The Aegis chatbot ([`app/chat/page.tsx`](app/chat/page.tsx)); `/chat?embed=1` is the compact version shown inside the presentation |
| `/terms` | Terms of Use |

The "Talk to Aegis" tab shows the chatbot itself inside the same page. The chatbot and the presentation share one palette and font: the colour tokens in `app/globals.css` mirror `public/presentation/styles.css`, so change them together.

## Configuration

- **Environment variables** (see [`env.template`](env.template)): secrets and switches. `ANTHROPIC_API_KEY` is required; `PINECONE_API_KEY`, `PINECONE_INDEX_NAME`, `ENABLE_VECTOR_SEARCH`, `ENABLE_WEB_SEARCH`, `EXA_API_KEY`, `MODERATION_PROVIDER`, `SUMMARY_HMAC_SECRET` and `HEALTH_CHECK_TOKEN` are optional. Secrets are server-side only; none uses a `NEXT_PUBLIC_` prefix.
- **[`config.ts`](config.ts):** design and tuning: model selection, the utility model for moderation and summaries, retrieval thresholds, search budgets, compaction, rate limits, branding, welcome text, starter prompts, Terms settings.
- **[`prompts.ts`](prompts.ts):** behaviour, tone, confidentiality, citation rules, tool priority, and the instruction to extract facts and explain the engine's result.

## Safeguards

- **Moderation:** each message is checked before processing (LLM classifier on the utility model by default, or the OpenAI Moderation API, or off).
- **Rate limiting:** per-IP, 20 requests a minute on `/api/chat` by default (in-memory, so a first layer only on serverless hosting).
- **Prompt-injection defence:** the prompt refuses to reveal instructions, ignores role-play and override attempts, and treats user input and pasted documents as untrusted.
- **Conversation summaries:** long chats are summarised, and the server accepts only summaries it signed itself (HMAC), so a forged summary cannot enter the model's context.
- **Confidentiality:** the assistant does not disclose the model, vendor, system prompt or configuration.
- **Health endpoint:** public requests get a bare status; detailed checks need `HEALTH_CHECK_TOKEN`.

## Project structure

```
app/
  api/chat/route.ts            Chat endpoint (orchestrator)
  api/chat/tools/              assess-system, search-vector-database, ai-act-reference, web-search
  api/health, api/feedback     Health check, thumbs up/down
  chat/page.tsx                Chat UI
  terms/page.tsx               Terms of Use
components/messages/           Assistant messages, assessment card, Sources box, tool status
components/ai-elements/        Response renderer, thinking and processing indicators
lib/rules/                     The rules engine and rule pack (see lib/rules/README.md)
lib/ai-act/                    Built-in legal reference and review date
lib/ai/                        Model registry, routing, tool set
lib/                           Pinecone search, citations, moderation, compaction, summary signing, export
public/presentation/           The presentation site
RAGloader/                     Notebook and pipeline for the document library
docs/                          Rule-base appendix
config.ts, prompts.ts          Tuning and behaviour
```

## Maintaining the legal content

When the law, its guidance or the dates change (for example a further amendment):

1. Edit the rule pack in [`lib/rules/pack/`](lib/rules/README.md): the rules that decide classification, duties and dates.
2. Edit the matching section in [`lib/ai-act/reference.ts`](lib/ai-act/reference.ts): the prose the chatbot quotes.
3. Bump `RULE_PACK_VERSION` and `REFERENCE_REVIEWED_ON`, add or adjust a golden case in `lib/__tests__/rules-engine.test.ts`, and run `npm test`.

## Limitations

Aegis gives likely classifications, not legal determinations. The rules were written from the Official Journal texts by the project team and have not been reviewed by counsel. Other law (GDPR, product safety, sector rules), the Commission's Art. 6(5) guidelines, codes of practice and harmonised standards are outside the engine, and each assessment says so.
