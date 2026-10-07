// ---------------------------------------------------------------------------
// Aegis presentation site: tab routing and keyboard navigation.
// ---------------------------------------------------------------------------

// The chatbot lives in the same deployment at /chat. Change this only if you host it elsewhere
// (e.g. "https://your-chatbot.vercel.app"). Empty disables the "Launch the Copilot" button.
const CHATBOT_URL = "/chat";

const SLIDES = ["problem", "choice", "value", "risks", "chat"];

const $ =(sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const tabs = $$(".tabs [role=tab]");
const slides = SLIDES.map((id) => document.getElementById(id));
const counter = $("#counter");

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

// ---- Chatbot tab ----
const launchBtn = $("#launchBtn");
const launchHint = $("#launchHint");
const embedBtn = $("#embedBtn");
const embedWrap = $("#embedWrap");
const embedFrame = $("#embedFrame");

if (CHATBOT_URL) {
  launchBtn.href = CHATBOT_URL;
  embedBtn.hidden = false;
  embedBtn.addEventListener("click", () => {
    const open = embedWrap.hidden;
    if (open && !embedFrame.src) embedFrame.src = CHATBOT_URL;
    embedWrap.hidden = !open;
    embedBtn.setAttribute("aria-expanded", String(open));
    embedBtn.textContent = open ? "Hide it" : "Show it here";
  });
} else {
  launchBtn.setAttribute("aria-disabled", "true");
  launchBtn.removeAttribute("target");
  launchBtn.addEventListener("click", (e) => e.preventDefault());
  launchHint.hidden = false;
}

// ---- Example prompts: copy to clipboard (the chatbot has no deep-link for prompts) ----
const toast = $("#toast");
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.hidden = true), 2200);
}
$$(".prompt-chip").forEach((chip) => {
  chip.addEventListener("click", async () => {
    const text = chip.textContent.trim();
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied. Paste it into Aegis.");
    } catch {
      showToast("Select the text and copy it manually.");
    }
  });
});

show(indexFromHash(), { updateHash: false });
