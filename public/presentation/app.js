// ---------------------------------------------------------------------------
// Aegis presentation site: tab routing and keyboard navigation.
// ---------------------------------------------------------------------------

// The "Talk to Aegis" tab shows the chatbot itself, embedded in this page. It lives in the same
// deployment at /chat; "?embed=1" tells it to drop its own logo and name (this page already has them).
const CHAT_URL = "/chat?embed=1";

const SLIDES = ["problem", "choice", "value", "risks", "chat"];

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const tabs = $$(".tabs [role=tab]");
const slides = SLIDES.map((id) => document.getElementById(id));
const counter = $("#counter");
const chatFrame = $("#chatFrame");

let current = 0;

function indexFromHash() {
  const id = location.hash.replace("#", "");
  const i = SLIDES.indexOf(id);
  return i === -1 ? 0 : i;
}

function show(i, { updateHash = true } = {}) {
  current = Math.max(0, Math.min(SLIDES.length - 1, i));
  slides.forEach((el, k) => {
    const active = k === current;
    el.hidden = !active;
    el.classList.toggle("enter", active);
    if (active) el.scrollTop = 0;
  });
  tabs.forEach((t, k) => {
    t.setAttribute("aria-selected", String(k === current));
    t.tabIndex = k === current ? 0 : -1;
  });
  const id = SLIDES[current];
  counter.textContent = `${current + 1} / ${SLIDES.length}`;
  document.title =
    current === 0
      ? "Aegis · EU AI Act Compliance Copilot"
      : `${slides[current].dataset.title} · Aegis`;
  if (updateHash && location.hash !== `#${id}`) history.replaceState(null, "", `#${id}`);
  if (id === "chat") openChat();
}

// The chat loads on first visit and then stays alive, so the conversation survives switching tabs.
function openChat() {
  if (!chatFrame.getAttribute("src")) {
    chatFrame.addEventListener("load", focusChatInput, { once: true });
    chatFrame.src = CHAT_URL;
  } else {
    focusChatInput();
  }
}
function focusChatInput() {
  try {
    chatFrame.contentDocument?.querySelector("textarea")?.focus();
  } catch {
    // cross-origin chat (if CHAT_URL ever points elsewhere): nothing to focus
  }
}

tabs.forEach((t) => t.addEventListener("click", () => show(SLIDES.indexOf(t.dataset.slide))));
window.addEventListener("hashchange", () => show(indexFromHash(), { updateHash: false }));

// Brand link goes to slide 1 without a full reload.
$(".brand").addEventListener("click", (e) => {
  e.preventDefault();
  show(0);
});

// ---- Keyboard: arrows / PageUp-Down / Home-End, F fullscreen ----
document.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const tag = (e.target.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "iframe") return;
  // Let arrow keys move within the risk list instead of changing slide.
  if (e.target.closest && e.target.closest(".risk-list")) return;

  switch (e.key) {
    case "ArrowRight":
    case "PageDown":
      e.preventDefault();
      show(current + 1);
      break;
    case "ArrowLeft":
    case "PageUp":
      e.preventDefault();
      show(current - 1);
      break;
    case "Home":
      e.preventDefault();
      show(0);
      break;
    case "End":
      e.preventDefault();
      show(SLIDES.length - 1);
      break;
    case "f":
    case "F":
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen?.();
      break;
  }
});

// ---- Risk master/detail (slide 4) ----
const riskTabs = $$(".risk-tab");
function selectRisk(i, focus = false) {
  riskTabs.forEach((t, k) => {
    const on = k === i;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    if (on && focus) t.focus();
  });
}
riskTabs.forEach((t, i) => {
  t.addEventListener("click", () => selectRisk(i));
  t.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); selectRisk((i + 1) % riskTabs.length, true); }
    if (e.key === "ArrowUp") { e.preventDefault(); selectRisk((i - 1 + riskTabs.length) % riskTabs.length, true); }
  });
});

show(indexFromHash(), { updateHash: false });
