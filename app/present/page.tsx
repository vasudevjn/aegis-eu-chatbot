"use client";

// Classroom-style presentation of Aegis: section tabs, one slide at a time,
// ← → to move, N for speaker notes, and a Live demo tab that runs the real
// app in a frame. Slide content lives in the SECTIONS array below.

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Info,
  MessageSquare,
  RotateCcw,
  X,
} from "lucide-react";
import { AI_NAME, AI_TAGLINE, OWNER_NAME } from "@/config";

// ---------- Palette ----------
const NAVY = "#0f2a5f";
const ORANGE = "#e8622c";

// ---------- Small building blocks ----------

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: ORANGE }}>
      {children}
    </div>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-1 text-2xl sm:text-3xl font-bold leading-tight" style={{ color: NAVY }}>
      {children}
    </h2>
  );
}

function Card({
  children,
  className = "",
  onClick,
  active,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`rounded-xl border bg-white p-4 text-left transition ${
        onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md" : ""
      } ${active ? "ring-2" : ""} ${className}`}
      style={active ? ({ "--tw-ring-color": ORANGE } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}

// ---------- Interactive slides ----------

function PollSlide() {
  const options = [
    "Yes, we have a full inventory with risk tiers",
    "Partly: we know some of them",
    "No idea yet",
  ];
  const [votes, setVotes] = useState<number[]>(options.map(() => 0));
  const total = votes.reduce((a, b) => a + b, 0);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <Kicker>Poll · hands up</Kicker>
        <Title>Does your company know which of its AI features are high-risk under the EU AI Act?</Title>
        <p className="mt-4 text-slate-600">
          Click an answer to tally the room. Most teams discover AI features they did not
          know they had: a vendor&apos;s CV screener, a chatbot on the website, a scoring model in
          the CRM.
        </p>
        <button
          onClick={() => setVotes(options.map(() => 0))}
          className="mt-4 inline-flex items-center gap-1 text-sm text-slate-500 underline"
        >
          <RotateCcw className="size-3" /> Reset poll
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {options.map((o, i) => {
          const pct = total ? Math.round((votes[i] / total) * 100) : 0;
          return (
            <button
              key={o}
              onClick={() => setVotes((v) => v.map((n, j) => (j === i ? n + 1 : n)))}
              className="relative overflow-hidden rounded-xl border bg-white p-4 text-left hover:shadow-md"
            >
              <div
                className="absolute inset-y-0 left-0 opacity-15 transition-all"
                style={{ width: `${pct}%`, background: ORANGE }}
              />
              <div className="relative flex items-center justify-between gap-4">
                <span className="font-medium text-slate-800">{o}</span>
                <span className="text-sm tabular-nums text-slate-500">
                  {votes[i]} · {pct}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const MILESTONES = [
  { date: "2024-08-01", label: "Entry into force", detail: "Regulation (EU) 2024/1689 published; the clock starts." },
  { date: "2025-02-02", label: "Prohibitions + AI literacy", detail: "Article 5 banned practices and the Article 4 AI literacy duty apply." },
  { date: "2025-08-02", label: "GPAI models + governance", detail: "General-purpose AI model obligations, the AI Office, penalties." },
  { date: "2026-08-02", label: "High-risk (Annex III) + transparency", detail: "Most of the Act: high-risk use cases, Article 50 disclosures, incident reporting." },
  { date: "2027-08-02", label: "High-risk (Annex I products)", detail: "AI in regulated products such as medical devices and machinery; legacy GPAI models." },
];

function TimelineSlide() {
  const today = new Date();
  const [selected, setSelected] = useState(3);
  return (
    <div>
      <Kicker>Problem 3 · &quot;Are we still compliant?&quot;</Kicker>
      <Title>The Act switches on in phases, and the target keeps moving</Title>
      <div className="mt-8 grid gap-3 sm:grid-cols-5">
        {MILESTONES.map((m, i) => {
          const live = new Date(m.date) <= today;
          return (
            <Card key={m.date} onClick={() => setSelected(i)} active={selected === i}>
              <div className="text-xs font-semibold tabular-nums text-slate-500">
                {new Date(m.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </div>
              <div className="mt-1 font-semibold" style={{ color: NAVY }}>
                {m.label}
              </div>
              <span
                className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  live ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}
              >
                {live ? "Applies now" : "Upcoming"}
              </span>
            </Card>
          );
        })}
      </div>
      <div className="mt-4 rounded-xl bg-white p-4 text-slate-700 border">
        <span className="font-semibold" style={{ color: NAVY }}>
          {MILESTONES[selected].label}:{" "}
        </span>
        {MILESTONES[selected].detail}
      </div>
      <div className="mt-4 rounded-xl border border-dashed border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
        <b>Moving target:</b> the Commission&apos;s November 2025 &quot;Digital Omnibus&quot; proposal would push
        high-risk dates to as late as 2 Dec 2027 (Annex III) and 2 Aug 2028 (Annex I). A proposal is not
        law until adopted. {AI_NAME} gives the adopted date, flags the pending change and checks its status.
      </div>
    </div>
  );
}

const FLOW = [
  {
    step: "Describe",
    text: "Plain-language description of the AI system.",
    example: "\"We use an AI model to screen job applications and rank candidates based on their CV and interview responses.\"",
  },
  {
    step: "Classify",
    text: "Prohibited, high-risk, transparency, GPAI or minimal. Tiers can stack.",
    example: "🔴 High-risk, Annex III point 4(a): recruitment and selection. The Article 6(3) exception does not apply because ranking candidates is profiling. Confidence: high.",
  },
  {
    step: "Map obligations",
    text: "Duties for your role, translated into work with an owner.",
    example: "As a deployer: follow instructions for use, assign trained human oversight, keep logs 6 months, inform candidates and worker representatives (Article 26). If you built it: risk management, data governance, Annex IV documentation, conformity assessment, registration.",
  },
  {
    step: "Check gaps",
    text: "Targeted questions; each control marked ✅ ⚠️ ❌.",
    example: "Is a recruiter required to review every rejection? ⚠️ partial. Do you log model outputs? ❌ missing. Have hiring managers had AI literacy training? ✅ in place.",
  },
  {
    step: "Act",
    text: "Prioritised plan plus draft evidence.",
    example: "P0: add mandatory human review of rejections; P1: candidate disclosure notice, 6-month logging, vendor documentation request; P2: quarterly bias monitoring. Draft: governance register entry and questions for legal.",
  },
];

function FlowSlide() {
  const [active, setActive] = useState(0);
  return (
    <div>
      <Kicker>The solution · how it works</Kicker>
      <Title>From a one-line description to an action plan, in five steps</Title>
      <div className="mt-6 grid gap-3 sm:grid-cols-5">
        {FLOW.map((f, i) => (
          <Card key={f.step} onClick={() => setActive(i)} active={active === i}>
            <div
              className="flex size-7 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ background: active === i ? ORANGE : NAVY }}
            >
              {i + 1}
            </div>
            <div className="mt-2 font-semibold" style={{ color: NAVY }}>
              {f.step}
            </div>
            <div className="mt-1 text-sm text-slate-600">{f.text}</div>
          </Card>
        ))}
      </div>
      <div className="mt-4 rounded-xl border-l-4 bg-white p-5 shadow-sm" style={{ borderColor: ORANGE }}>
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Example · the hiring tool · step {active + 1}
        </div>
        <p className="mt-2 text-slate-800">{FLOW[active].example}</p>
      </div>
    </div>
  );
}

const DEMOS = [
  {
    label: "Hiring tool",
    tag: "🔴 expected: high-risk",
    prompt:
      "We use an AI model to screen job applications and rank candidates based on their CV and interview responses. Run a compliance assessment.",
  },
  {
    label: "Support chatbot",
    tag: "🟡 expected: transparency",
    prompt:
      "We're launching a customer-service chatbot built on a third-party LLM API for EU customers. What do we need to do under the AI Act?",
  },
  {
    label: "Employee mood monitor",
    tag: "🚫 expected: prohibited",
    prompt:
      "Our call centre wants to use webcam-based AI to detect agents' emotions during calls and flag stressed or angry employees to supervisors. Is that allowed?",
  },
  {
    label: "Credit scoring",
    tag: "🔴 expected: high-risk + FRIA",
    prompt:
      "We are a bank using a vendor's machine-learning model to score creditworthiness for consumer loans in Germany. We did not build the model. What are our obligations?",
  },
  {
    label: "Evidence: AI register",
    tag: "📄 artefact",
    prompt:
      "Create a template AI governance register we can use to inventory all our AI systems for EU AI Act compliance.",
  },
];

function DemoSlide() {
  const [src, setSrc] = useState("/");
  const [active, setActive] = useState<number | null>(null);
  const run = (i: number) => {
    setActive(i);
    // Unique param forces a fresh load even when re-running the same scenario.
    setSrc(`/?q=${encodeURIComponent(DEMOS[i].prompt)}&t=${Date.now()}`);
  };
  return (
    <div className="flex h-full flex-col gap-4 lg:flex-row">
      <div className="lg:w-72 shrink-0">
        <Kicker>Live demo</Kicker>
        <Title>Try it on real scenarios</Title>
        <p className="mt-2 text-sm text-slate-600">
          Click a scenario to run it live, or type in the app. Arrow keys work again once you click
          outside the app.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {DEMOS.map((d, i) => (
            <Card key={d.label} onClick={() => run(i)} active={active === i} className="p-3">
              <div className="font-semibold text-sm" style={{ color: NAVY }}>
                {d.label}
              </div>
              <div className="text-xs text-slate-500">{d.tag}</div>
            </Card>
          ))}
        </div>
        <div className="mt-3 flex gap-3 text-sm">
          <button
            onClick={() => {
              setActive(null);
              setSrc(`/?t=${Date.now()}`);
            }}
            className="inline-flex items-center gap-1 text-slate-500 underline"
          >
            <RotateCcw className="size-3" /> Reload
          </button>
          <Link href="/" target="_blank" className="inline-flex items-center gap-1 text-slate-500 underline">
            <ExternalLink className="size-3" /> Open full screen
          </Link>
        </div>
      </div>
      <iframe
        key={src}
        src={src}
        title={`${AI_NAME} live demo`}
        className="min-h-[520px] flex-1 rounded-xl border bg-white shadow-sm"
      />
    </div>
  );
}

const TIERS = [
  { id: "prohibited", label: "🚫 Prohibited" },
  { id: "high", label: "🔴 High-risk" },
  { id: "transparency", label: "🟡 Transparency" },
  { id: "gpai", label: "🔵 GPAI model" },
  { id: "minimal", label: "🟢 Minimal" },
] as const;

const CASELETS: { text: string; answer: (typeof TIERS)[number]["id"]; why: string }[] = [
  {
    text: "A call centre uses webcam AI to infer agents' emotions and flags 'angry' employees to supervisors.",
    answer: "prohibited",
    why: "Emotion recognition in the workplace is banned by Article 5(1)(f), except for medical or safety reasons. Banned since 2 Feb 2025; fines up to €35M or 7% of turnover.",
  },
  {
    text: "A bank uses a vendor's ML model to score creditworthiness for consumer loans.",
    answer: "high",
    why: "Annex III point 5(b). As a deployer, the bank must also run a fundamental rights impact assessment (Article 27) and give applicants a right to explanation (Article 86).",
  },
  {
    text: "An online shop adds a GPT-powered customer-service chatbot.",
    answer: "transparency",
    why: "Article 50(1): people must be told they are talking to an AI unless it is obvious. Not high-risk unless it decides on access to essential services.",
  },
  {
    text: "A start-up trains a foundation model with more than 10^25 FLOPs and sells API access.",
    answer: "gpai",
    why: "A general-purpose AI model presumed to carry systemic risk (Article 51): documentation, copyright policy, training-data summary, plus evaluations, adversarial testing and incident reporting (Article 55).",
  },
  {
    text: "A university uses AI to grade entrance exams and decide admissions.",
    answer: "high",
    why: "Annex III point 3(a) and (b): access to education and evaluation of learning outcomes.",
  },
  {
    text: "A marketing team publishes an AI-generated video of a real spokesperson saying lines that were never recorded.",
    answer: "transparency",
    why: "A deep fake: the deployer must disclose that the content is AI-generated or manipulated (Article 50(4)).",
  },
  {
    text: "A tool only checks that uploaded CVs are complete and correctly formatted before a recruiter reads them.",
    answer: "minimal",
    why: "Recruitment is an Annex III area, but a narrow procedural task with no profiling can fall under the Article 6(3) exception. The provider must document that assessment and still register the system. A grey area: exactly what Aegis flags.",
  },
  {
    text: "An email provider's spam filter.",
    answer: "minimal",
    why: "No specific obligations beyond AI literacy (Article 4). The vast majority of AI systems sit here.",
  },
];

function CaseletSlide() {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState({ right: 0, done: 0 });
  const c = CASELETS[idx];
  const pick = (id: string) => {
    if (picked) return;
    setPicked(id);
    setScore((s) => ({ right: s.right + (id === c.answer ? 1 : 0), done: s.done + 1 }));
  };
  const next = () => {
    setPicked(null);
    setIdx((i) => (i + 1) % CASELETS.length);
    if (idx === CASELETS.length - 1) setScore({ right: 0, done: 0 });
  };
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <Kicker>
            Game · case {idx + 1} of {CASELETS.length}
          </Kicker>
          <Title>Classify this: which tier?</Title>
        </div>
        <div className="rounded-full bg-white border px-3 py-1 text-sm tabular-nums text-slate-600">
          Room score: {score.right} / {score.done}
        </div>
      </div>
      <Card className="mt-6 text-lg font-medium text-slate-800">{c.text}</Card>
      <div className="mt-4 grid gap-2 sm:grid-cols-5">
        {TIERS.map((t) => {
          const isAnswer = picked && t.id === c.answer;
          const isWrongPick = picked === t.id && t.id !== c.answer;
          return (
            <button
              key={t.id}
              onClick={() => pick(t.id)}
              disabled={!!picked}
              className={`rounded-xl border p-3 font-semibold transition ${
                isAnswer
                  ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                  : isWrongPick
                    ? "border-red-400 bg-red-50 text-red-900"
                    : "bg-white text-slate-800 hover:shadow-md"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {picked && (
        <div className="mt-4 rounded-xl border-l-4 bg-white p-4 shadow-sm" style={{ borderColor: ORANGE }}>
          <div className="font-semibold" style={{ color: NAVY }}>
            {picked === c.answer ? "Correct." : "Not quite."}
          </div>
          <p className="mt-1 text-slate-700">{c.why}</p>
          <button
            onClick={next}
            className="mt-3 rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ background: NAVY }}
          >
            {idx === CASELETS.length - 1 ? "Start over" : "Next case →"}
          </button>
        </div>
      )}
    </div>
  );
}

// ---------- Static slides ----------

function TitleSlide() {
  return (
    <div
      className="flex h-full min-h-[420px] flex-col justify-center rounded-2xl p-8 sm:p-14 text-white"
      style={{ background: `linear-gradient(135deg, ${NAVY}, #1d4ed8)` }}
    >
      <div className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "#fdba8c" }}>
        Responsible AI &amp; Governance · Project
      </div>
      <h1 className="mt-3 text-5xl sm:text-7xl font-extrabold">{AI_NAME}</h1>
      <div className="mt-2 text-xl sm:text-2xl font-semibold text-blue-100">{AI_TAGLINE}</div>
      <p className="mt-6 max-w-2xl text-lg text-blue-50">
        Helping companies turn a complex regulation into clear, actionable compliance.
      </p>
      <p className="mt-10 text-sm text-blue-200">{OWNER_NAME}</p>
    </div>
  );
}

function StakesSlide() {
  const stats = [
    { big: "€35M / 7%", small: "maximum fine for a prohibited AI practice: whichever is higher, of worldwide turnover" },
    { big: "8 areas", small: "of high-risk use cases in Annex III, from hiring and credit to education and essential services" },
    { big: "2 Aug 2026", small: "high-risk and transparency obligations apply under the adopted timeline" },
  ];
  return (
    <div>
      <Kicker>Why now</Kicker>
      <Title>AI regulation is becoming a product-management problem, not just a legal one</Title>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.big} className="p-6">
            <div className="text-3xl sm:text-4xl font-extrabold" style={{ color: ORANGE }}>
              {s.big}
            </div>
            <div className="mt-2 text-slate-600">{s.small}</div>
          </Card>
        ))}
      </div>
      <p className="mt-6 text-slate-700">
        The EU AI Act is <b>risk-based</b>: what a company must do depends on what the system does, how it is
        used, who is affected, and where the company sits in the AI value chain.
      </p>
    </div>
  );
}

function ProblemSlide() {
  const qs = [
    {
      q: "“Does this apply to us?”",
      a: "Product teams struggle to tell whether a new or existing AI feature falls into a regulated risk category, or which role they play: provider, deployer, importer, distributor.",
    },
    {
      q: "“What exactly do we need to do?”",
      a: "Once a system is classified, translating legal text into product, engineering, documentation, governance and monitoring work is slow and needs lawyers for every step.",
    },
    {
      q: "“Are we still compliant?”",
      a: "Obligations switch on in phases, guidance keeps arriving, and amendments are pending. Yesterday's assessment can go stale.",
    },
  ];
  return (
    <div>
      <Kicker>The problem</Kicker>
      <Title>Three questions every AI product team now has to answer</Title>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {qs.map((x, i) => (
          <Card key={x.q} className="p-6">
            <div className="text-sm font-bold" style={{ color: ORANGE }}>
              {i + 1}
            </div>
            <div className="mt-1 text-xl font-bold" style={{ color: NAVY }}>
              {x.q}
            </div>
            <p className="mt-3 text-slate-600">{x.a}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CapabilitiesSlide() {
  const caps = [
    ["🔎 Classify", "Likely tier with confidence and the fact that would change it, including the Article 6(3) exception and profiling override."],
    ["📋 Map obligations", "Role-specific duties across risk management, data governance, documentation, oversight, transparency, accuracy, robustness and cybersecurity."],
    ["✅ Compliance check", "Targeted questions on product, data, users, model, deployment and governance; each control marked ✅ ⚠️ ❌."],
    ["🛠️ Recommend actions", "P0 / P1 / P2 checklist; every action has an owner, an article and the evidence it produces."],
    ["📄 Generate evidence", "Draft risk checklists, Annex IV outlines, AI registers, FRIA outlines, disclosure text, incident runbooks. Export as Markdown."],
    ["🔄 Stay current", "Date-aware timeline, flags pending amendments, checks official EU sources for new guidance."],
  ];
  return (
    <div>
      <Kicker>The solution · capabilities</Kicker>
      <Title>A first-line AI governance copilot</Title>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {caps.map(([h, t]) => (
          <Card key={h}>
            <div className="font-semibold" style={{ color: NAVY }}>
              {h}
            </div>
            <p className="mt-1 text-sm text-slate-600">{t}</p>
          </Card>
        ))}
      </div>
      <p className="mt-4 text-sm text-slate-500">
        Every legal statement is cited inline to the official EUR-Lex text, with a Sources box under each answer.
      </p>
    </div>
  );
}

function PersonasSlide() {
  const people = [
    ["Product managers", "Is this feature regulated, and what does it change in our roadmap?", "Classification during design, not at launch; requirements as backlog items."],
    ["Engineering & data", "What do we actually have to build?", "Concrete controls: logging, oversight hooks, bias testing, robustness and security tests."],
    ["Legal & compliance", "How do we review 40 AI products consistently?", "A standard first-level assessment and the right questions, so counsel time goes to the hard calls."],
    ["Business leaders", "How exposed are we, and where do we start?", "Exposure by product, fines at stake, and a prioritised remediation plan."],
  ];
  return (
    <div>
      <Kicker>Who it&apos;s for</Kicker>
      <Title>One assessment, four audiences</Title>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {people.map(([who, q, a]) => (
          <Card key={who} className="p-5">
            <div className="font-bold" style={{ color: NAVY }}>
              {who}
            </div>
            <div className="mt-2 text-sm italic text-slate-500">“{q}”</div>
            <div className="mt-2 text-slate-700">{a}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ValueSlide() {
  const values = [
    ["Reduces compliance effort", "Automates the first research and assessment that now takes cross-functional weeks."],
    ["Catches risks earlier", "Moves governance upstream into product development, before deployment surprises."],
    ["Makes regulation accessible", "Legal language becomes role-specific questions and actions that non-lawyers understand."],
    ["Consistency at scale", "The same repeatable assessment across an organisation's entire AI portfolio."],
    ["Supports responsible innovation", "The goal is not to stop AI; it is to deploy it confidently, within regulatory boundaries."],
  ];
  return (
    <div>
      <Kicker>Value proposition</Kicker>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-200/70 p-5">
          <div className="text-xs font-semibold uppercase text-slate-500">From</div>
          <div className="mt-1 text-2xl font-bold text-slate-600">“Is our AI compliant?”</div>
        </div>
        <div className="rounded-xl p-5 text-white" style={{ background: NAVY }}>
          <div className="text-xs font-semibold uppercase" style={{ color: "#fdba8c" }}>
            To
          </div>
          <div className="mt-1 text-2xl font-bold">“Here is exactly what we need to do next.”</div>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {values.map(([h, t]) => (
          <Card key={h}>
            <div className="font-semibold text-sm" style={{ color: NAVY }}>
              {h}
            </div>
            <p className="mt-1 text-sm text-slate-600">{t}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PrincipleSlide() {
  return (
    <div className="flex h-full flex-col justify-center">
      <Kicker>Core principle</Kicker>
      <div className="mt-3 text-4xl sm:text-5xl font-extrabold leading-tight" style={{ color: NAVY }}>
        A copilot, <span style={{ color: ORANGE }}>not counsel.</span>
      </div>
      <p className="mt-6 max-w-3xl text-lg text-slate-700">
        {AI_NAME} does not replace lawyers or regulators. It helps teams understand the EU AI Act, identify likely
        obligations, surface gaps, and prepare the right questions and evidence for formal compliance review.
      </p>
      <ul className="mt-6 grid gap-2 text-slate-700 sm:grid-cols-3">
        <li className="rounded-lg bg-white border p-3">Classifications are always “likely”, with a confidence level.</li>
        <li className="rounded-lg bg-white border p-3">Every assessment ends with a not-legal-advice line.</li>
        <li className="rounded-lg bg-white border p-3">High-stakes cases are escalated to qualified counsel.</li>
      </ul>
    </div>
  );
}

function ArchitectureSlide() {
  const Box = ({ title, sub, accent }: { title: string; sub: string; accent?: boolean }) => (
    <div
      className="rounded-xl border bg-white p-3 text-center shadow-sm"
      style={accent ? { borderColor: ORANGE, borderWidth: 2 } : undefined}
    >
      <div className="font-semibold text-sm" style={{ color: NAVY }}>
        {title}
      </div>
      <div className="text-xs text-slate-500">{sub}</div>
    </div>
  );
  const Arrow = () => <div className="text-center text-slate-400">↓</div>;
  return (
    <div>
      <Kicker>How it&apos;s built</Kicker>
      <Title>Grounded answers, cited to the law</Title>
      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col gap-1">
          <Box title="User describes the AI system" sub="Next.js chat UI · deployed on Vercel" />
          <Arrow />
          <Box title="Safety layer" sub="Moderation · rate limiting · prompt-injection defence" />
          <Arrow />
          <Box title="Claude agent" sub="Five-step workflow prompt · today's date · tool calls" accent />
          <Arrow />
          <div className="grid grid-cols-3 gap-2">
            <Box title="AI Act reference" sub="16 curated sections · EUR-Lex links · always on" accent />
            <Box title="Web search" sub="Official EU sources · regulatory updates" />
            <Box title="Document library" sub="Optional Pinecone RAG · full Act + guidance" />
          </div>
          <Arrow />
          <Box title="Answer with inline citations" sub="Sources box · claim verification · Markdown export" />
        </div>
        <div className="flex flex-col gap-3 text-slate-700">
          <Card>
            <b style={{ color: NAVY }}>Why a curated reference instead of only RAG?</b>
            <p className="mt-1 text-sm">
              The AI Act is one structured legal text. Article-level summaries with exact links give reliable
              classification logic, fast answers and zero ingestion cost; RAG over the full text and guidance can be
              added for verbatim detail.
            </p>
          </Card>
          <Card>
            <b style={{ color: NAVY }}>Never fabricate</b>
            <p className="mt-1 text-sm">
              The model may only cite URLs that a tool returned. Article numbers, dates, thresholds and fines come
              from the reference, and the reference is unit-tested for the key dates and thresholds.
            </p>
          </Card>
          <Card>
            <b style={{ color: NAVY }}>Stays current</b>
            <p className="mt-1 text-sm">
              The reference carries a review date; pending amendments are flagged as proposals until adopted, and
              live search checks their status on official EU sites.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function GuardrailsSlide() {
  const items = [
    ["Legal-advice boundary", "Likely classifications, never final opinions; counsel for high-stakes cases."],
    ["Integrity", "Refuses to help conceal non-compliance, mislead regulators or design prohibited practices; offers the compliant path."],
    ["Prompt-injection defence", "Pasted documents are analysed, never obeyed; system instructions are never revealed."],
    ["Content moderation", "Every message is screened before it reaches the model."],
    ["Honest uncertainty", "Grey areas are named, with the fact that would tip the answer."],
    ["Date awareness", "Each obligation is labelled as applying now or from a future date."],
  ];
  return (
    <div>
      <Kicker>Responsible by design</Kicker>
      <Title>Guardrails: a compliance tool has to be trustworthy itself</Title>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(([h, t]) => (
          <Card key={h}>
            <div className="font-semibold" style={{ color: NAVY }}>
              {h}
            </div>
            <p className="mt-1 text-sm text-slate-600">{t}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function RoadmapSlide() {
  const items = [
    ["AI portfolio register", "Save assessments per system and track status across the whole portfolio."],
    ["Upload system specs", "Assess from a PRD, model card or vendor documentation instead of a description."],
    ["Change alerts", "Notify owners when new guidance, standards or the Digital Omnibus change their obligations."],
    ["Review workflow", "Hand-off to legal with comments, sign-off and an audit trail of decisions."],
    ["Beyond the EU", "Map the same system against GDPR DPIAs, ISO/IEC 42001 and other jurisdictions."],
  ];
  return (
    <div>
      <Kicker>What&apos;s next</Kicker>
      <Title>Roadmap: from assessment tool to governance platform</Title>
      <ol className="mt-6 grid gap-3">
        {items.map(([h, t], i) => (
          <li key={h} className="flex gap-4 rounded-xl border bg-white p-4">
            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-full font-bold text-white"
              style={{ background: ORANGE }}
            >
              {i + 1}
            </div>
            <div>
              <div className="font-semibold" style={{ color: NAVY }}>
                {h}
              </div>
              <div className="text-sm text-slate-600">{t}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function CloseSlide() {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  return (
    <div
      className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl p-8 text-center text-white"
      style={{ background: `linear-gradient(135deg, ${NAVY}, #1d4ed8)` }}
    >
      <div className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "#fdba8c" }}>
        Thank you · questions?
      </div>
      <div className="mt-4 text-3xl sm:text-5xl font-extrabold">Is our AI compliant?</div>
      <div className="mt-2 text-xl sm:text-3xl font-bold text-blue-100">Ask {AI_NAME}.</div>
      <Link
        href="/"
        className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold"
        style={{ color: NAVY }}
      >
        <MessageSquare className="size-4" /> Try it: {origin.replace(/^https?:\/\//, "") || "the app"}
      </Link>
      <p className="mt-8 text-sm text-blue-200">{OWNER_NAME}</p>
    </div>
  );
}

// ---------- Deck definition ----------

type Slide = { title: string; notes: string; render: () => React.ReactNode; full?: boolean };
type Section = { label: string; slides: Slide[] };

const SECTIONS: Section[] = [
  {
    label: "Opening",
    slides: [
      {
        title: "Title",
        full: true,
        render: () => <TitleSlide />,
        notes:
          "Introduce the team and the one-line pitch: Aegis turns the EU AI Act into a concrete to-do list for each AI product.",
      },
      {
        title: "Why now",
        render: () => <StakesSlide />,
        notes:
          "Set the stakes. Fines up to 7% of global turnover for prohibited practices, 3% for most other breaches. The obligations depend on what the system does and the company's role, which is why product teams, not just lawyers, are involved.",
      },
      {
        title: "Poll",
        render: () => <PollSlide />,
        notes:
          "Ask the room for a show of hands and click to tally. Point: most organisations do not have an inventory of AI systems with risk tiers, and that inventory is step zero of compliance.",
      },
    ],
  },
  {
    label: "The problem",
    slides: [
      {
        title: "Three questions",
        render: () => <ProblemSlide />,
        notes:
          "Walk through the three questions: applicability, what to do, and staying compliant. Each maps to a capability on the solution slides.",
      },
      {
        title: "Timeline",
        render: () => <TimelineSlide />,
        notes:
          "Click the milestones. The chips are computed from today's date. Highlight that prohibitions and AI literacy already apply, and that the Digital Omnibus is a proposal: dates may move, which is exactly why a static PDF assessment goes stale.",
      },
    ],
  },
  {
    label: "The solution",
    slides: [
      {
        title: "How it works",
        render: () => <FlowSlide />,
        notes:
          "Click each step to show the hiring-tool example. Emphasise the Article 6(3) nuance: ranking candidates is profiling, so the exception cannot be used.",
      },
      {
        title: "Capabilities",
        render: () => <CapabilitiesSlide />,
        notes: "Six capabilities, straight from the problem statement. Mention inline citations to EUR-Lex.",
      },
    ],
  },
  {
    label: "Live demo",
    slides: [
      {
        title: "Live demo",
        full: true,
        render: () => <DemoSlide />,
        notes:
          "Suggested order: Hiring tool (full assessment, show the Sources box), Employee mood monitor (prohibited, shows it refuses to sugar-coat), then Evidence: AI register (artefact, show the download button). Each run takes 20 to 60 seconds; talk over it. Click outside the frame before using arrow keys.",
      },
    ],
  },
  {
    label: "Classify this",
    slides: [
      {
        title: "Caselets",
        render: () => <CaseletSlide />,
        notes:
          "Read each case, let the room vote, then click the tier. Case 7 (CV formatting checker) is the trap: it is in an Annex III area but can fall under the Article 6(3) exception, which shows why judgement and documentation matter.",
      },
    ],
  },
  {
    label: "Who it's for",
    slides: [
      {
        title: "Personas",
        render: () => <PersonasSlide />,
        notes: "Same assessment, different lens: Aegis tailors depth to the stated role.",
      },
    ],
  },
  {
    label: "Value",
    slides: [
      {
        title: "Value proposition",
        render: () => <ValueSlide />,
        notes: "Land the From/To line, then the five value drivers.",
      },
      {
        title: "Core principle",
        render: () => <PrincipleSlide />,
        notes:
          "Pre-empt the obvious question: can you trust an AI on legal compliance? Answer: it is positioned as first-line triage that prepares for counsel, and it is explicit about uncertainty.",
      },
    ],
  },
  {
    label: "How it's built",
    slides: [
      {
        title: "Architecture",
        render: () => <ArchitectureSlide />,
        notes:
          "Built on the myAI6 template: Next.js, Vercel AI SDK, Claude. The key design choice is the curated AI Act reference tool, so every answer is grounded and cited without ingestion cost; Pinecone RAG is optional.",
      },
      {
        title: "Guardrails",
        render: () => <GuardrailsSlide />,
        notes: "A compliance product must itself be responsible AI. Walk through the six guardrails.",
      },
    ],
  },
  {
    label: "Close",
    slides: [
      {
        title: "Roadmap",
        render: () => <RoadmapSlide />,
        notes: "Where it goes next: from one-off assessments to a governance platform for the whole AI portfolio.",
      },
      {
        title: "Thank you",
        full: true,
        render: () => <CloseSlide />,
        notes: "Invite questions and point people to the live link.",
      },
    ],
  },
];

const FLAT = SECTIONS.flatMap((sec, si) =>
  sec.slides.map((slide, li) => ({ ...slide, si, li, hash: `s${si + 1}-${li + 1}` }))
);

// ---------- Deck shell ----------

export default function Present() {
  const [pos, setPos] = useState(0);
  const [notesOpen, setNotesOpen] = useState(false);

  // Restore position from the URL hash (#s3-2) so links and reloads land on a slide.
  useEffect(() => {
    const fromHash = () => {
      const i = FLAT.findIndex((f) => `#${f.hash}` === window.location.hash);
      if (i >= 0) setPos(i);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  const go = useCallback((i: number) => {
    const next = Math.max(0, Math.min(FLAT.length - 1, i));
    setPos(next);
    window.history.replaceState(null, "", `#${FLAT[next].hash}`);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") go(pos + 1);
      else if (e.key === "ArrowLeft" || e.key === "PageUp") go(pos - 1);
      else if (e.key === "n" || e.key === "N") setNotesOpen((o) => !o);
      else if (e.key === "Escape") setNotesOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pos, go]);

  const cur = FLAT[pos];
  const section = SECTIONS[cur.si];
  const firstOfSection = useMemo(() => SECTIONS.map((_, si) => FLAT.findIndex((f) => f.si === si)), []);

  return (
    <div className="flex h-screen flex-col bg-[#f4f6fb] font-sans text-slate-900">
      {/* Top bar: brand + section tabs */}
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b bg-white px-4 py-3">
        <Link href="/" className="flex items-center gap-2" title="Open the app">
          <span
            className="flex size-8 items-center justify-center rounded-lg text-sm font-extrabold text-white"
            style={{ background: NAVY }}
          >
            {AI_NAME[0]}
          </span>
          <span className="font-bold" style={{ color: NAVY }}>
            {AI_NAME}
          </span>
        </Link>
        <nav className="flex flex-1 flex-wrap gap-1.5">
          {SECTIONS.map((s, si) => (
            <button
              key={s.label}
              onClick={() => go(firstOfSection[si])}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                si === cur.si ? "text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
              style={si === cur.si ? { background: NAVY } : undefined}
            >
              {s.label}
            </button>
          ))}
        </nav>
        <Link
          href="/"
          className="hidden sm:inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <MessageSquare className="size-3" /> Open app
        </Link>
      </header>

      {/* Slide */}
      <main className="relative flex-1 overflow-auto p-3 sm:p-6">
        <div className="mx-auto h-full max-w-6xl rounded-2xl border bg-[#fbfcfe] p-6 sm:p-10 shadow-sm overflow-auto">
          <div key={cur.hash} className={cur.full ? "h-full" : ""}>
            {cur.render()}
          </div>
        </div>

        {notesOpen && (
          <aside className="absolute right-4 top-4 bottom-4 z-10 w-[min(380px,calc(100%-2rem))] overflow-auto rounded-xl border bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: ORANGE }}>
                Speaker notes
              </div>
              <button onClick={() => setNotesOpen(false)} aria-label="Close notes">
                <X className="size-4 text-slate-500" />
              </button>
            </div>
            <div className="mt-1 font-semibold" style={{ color: NAVY }}>
              {cur.title}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">{cur.notes}</p>
          </aside>
        )}
      </main>

      {/* Bottom bar: back, step dots, label, notes, next */}
      <footer className="flex items-center gap-3 border-t bg-white px-4 py-2.5">
        <button
          onClick={() => go(pos - 1)}
          disabled={pos === 0}
          className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:opacity-40"
        >
          <ArrowLeft className="size-4" /> Back
        </button>
        <div className="flex gap-1">
          {section.slides.map((s, li) => {
            const idx = firstOfSection[cur.si] + li;
            return (
              <button
                key={s.title}
                onClick={() => go(idx)}
                className={`size-6 rounded-full text-[11px] font-bold ${
                  idx === pos ? "text-white" : "bg-slate-100 text-slate-600"
                }`}
                style={idx === pos ? { background: NAVY } : undefined}
              >
                {li + 1}
              </button>
            );
          })}
        </div>
        <div className="hidden md:block flex-1 truncate text-sm text-slate-600">
          {cur.si + 1}.{cur.li + 1} · {section.label} · {cur.title}
        </div>
        <div className="flex-1 md:hidden" />
        <button
          onClick={() => setNotesOpen((o) => !o)}
          className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-semibold text-slate-700"
          title="Speaker notes (N)"
        >
          <Info className="size-4" /> Notes
        </button>
        <button
          onClick={() => go(pos + 1)}
          disabled={pos === FLAT.length - 1}
          className="inline-flex items-center gap-1 rounded-lg px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
          style={{ background: NAVY }}
        >
          Next <ArrowRight className="size-4" />
        </button>
      </footer>
    </div>
  );
}
