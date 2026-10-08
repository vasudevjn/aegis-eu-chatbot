# Aegis rules engine

A deterministic, explainable implementation of the EU AI Act, Regulation (EU) 2024/1689, **as amended by the Digital Omnibus on AI, Regulation (EU) 2026/1744**. It decides; the language model only extracts facts and explains.

Given the same facts and the same date it always returns the same assessment. Every conclusion carries the article that supports it and the page of the Official Journal it was read from.

## Where it sits

```
user describes a system
   -> chat model extracts facts (zod schema = ProfileSchema)         app/api/chat/tools/assess-system.ts
   -> assess(profile, { today, controls, compareWith })               lib/rules/engine.ts
   -> Assessment (JSON)
        -> assessment card in the chat                                components/messages/assessment-view.tsx
        -> compact digest for the model (toModelOutput)               lib/rules/model-view.ts
        -> Markdown in the chat export                                lib/rules/markdown.ts
```

## Pipeline

`runPipeline` (pipeline.ts) works in the order the Act does:

1. **Scope**: AI system (Art. 3(1)), EU connection (Art. 2(1)), exclusions (Art. 2(3), (6), (8), (10)).
2. **Roles**: provider, deployer, importer, distributor, product manufacturer, GPAI model provider (Art. 3 and Chapter III, Section 3).
3. **Prohibited practices**: Art. 5(1)(a) to (h), plus the two bans added by the Omnibus, (ba) and (bb).
4. **High-risk**: Annex III (22 use cases plus three biometric points), Annex I Sections A and B, the Art. 6(3) exception and the profiling override.
5. **Role shifts**: Art. 25 (rebranding, substantial modification, change of purpose make you the provider).
6. **Transparency**: Art. 50(1) to (4).
7. **General-purpose AI models**: Art. 51 to 55, including the 10^25 FLOP threshold and the open-source exemption.
8. **Obligations**: each duty has a condition, an owner, the evidence that proves it, citations and a timeline key.
9. **Timing**: `resolveTiming` applies the original and amended application dates and the transitional rules in Art. 111(2) to (4).

Around the pipeline, `analysis.ts` adds:

- **Confidence** (High / Medium / Low): the engine re-runs the pipeline with each unknown fact filled in every plausible way. If the classification never changes, confidence is High; judgement calls cap it at Medium.
- **Open questions**: the unknown facts that would change the classification, duties or dates, most useful first. Whether it is an AI system and whether it has an EU connection always come first.
- **What-if**: `compareWith` runs a second profile and reports tiers and duties added or removed and dates moved.
- **Gap check and action plan**: controls evidence duties; missing and partial controls become P0, P1 and P2 actions.

## Facts, unknowns and assumptions

- Conditions are data (`logic.ts`), evaluated with three-valued (Kleene) logic: yes, no, unknown. The engine can therefore say which facts a result depends on instead of guessing.
- Screening facts that nearly always are "no" (prohibited practices, biometrics, product route, GPAI provider, and so on) are defaulted to "no" when not mentioned. Every default is listed to the user as an assumption (`pack/defaults.ts`). Facts that decide the outcome are never defaulted: AI system, EU connection, role, Annex III use case, interaction, generation, dates, compute, size.
- An exception such as Art. 6(3) must be established, never assumed: its rule uses `unknownAsNo`, so unknown facts leave the system high-risk and show up as questions.

## Inventory (generated from the pack; `npm test` checks the invariants)

| What | Count |
|---|---|
| Facts in the profile | 64 |
| Classification rules (6 scope, 6 roles, 10 prohibited, 30 high-risk, 4 role shifts, 5 transparency, 3 GPAI) | 64 |
| Derived flags | 12 |
| Obligations | 50 |
| Controls (gap-check questions) | 33 |
| Timeline entries | 9 |

## Files

| File | Purpose |
|---|---|
| `logic.ts` | Condition AST, three-valued evaluation, which facts a condition reads |
| `facts.ts` | `ProfileSchema` (the extraction schema; its descriptions are the model's instructions), question metadata |
| `types.ts`, `assessment.ts` | Rule, obligation, control and assessment types; `RULE_PACK_VERSION` |
| `pipeline.ts` | Stage order and flag aggregation |
| `analysis.ts` | Confidence, questions, what-if, gap analysis |
| `engine.ts` | `assess()`: the single entry point |
| `pack/rules.ts` | The classification rules |
| `pack/obligations.ts` | The duties, with owner, evidence, citations, dates |
| `pack/timeline.ts` | Application dates (original and current) and transitional logic |
| `pack/penalties.ts` | Fine tiers and the SME cap |
| `pack/controls.ts` | The gap-check controls and the actions for them |
| `pack/catalogues.ts` | Annex III use cases and Annex I laws |
| `pack/defaults.ts`, `pack/derived.ts`, `pack/cite.ts` | Assumptions, derived flags, citation helpers |
| `present.ts`, `markdown.ts`, `model-view.ts` | Wording shared by the card, the export and the model |

## Updating the rules when the law changes

1. Read the amending text. Change the rule in `pack/rules.ts`, the duty in `pack/obligations.ts`, the date in `pack/timeline.ts` (keep `original` and `current`), or the control in `pack/controls.ts`.
2. Give every new rule or duty a citation with `act(...)` or `omni(...)` and the OJ page, and a plain-language `explain` text. The pack tests refuse rules without them.
3. If a new fact is needed, add it to `ProfileSchema` with a description that states the legal test, and to `FACT_META` with a question and why it matters.
4. Add or adjust a golden case in `lib/__tests__/rules-engine.test.ts`.
5. Bump `RULE_PACK_VERSION` (`assessment.ts`) and `REFERENCE_REVIEWED_ON` (`lib/ai-act/meta.ts`), and update the matching prose in `lib/ai-act/reference.ts`.
6. Run `npm test`.

## What it does not do

- It does not replace legal review. The rules were written from the Official Journal texts by the project team and have not been reviewed by counsel.
- It does not assess other law (GDPR, product safety, sector rules), the Commission's Art. 6(5) guidelines, codes of practice or harmonised standards, and says so in each assessment's limits.
- Judgement-dependent tests (is a function a safety function, are safeguards adequate, is a task narrow and procedural) are flagged as judgement calls and cap confidence.
