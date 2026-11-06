const loader = document.querySelector("#loader");
const loaderStarted = performance.now();

function dismissLoader() {
  if (!loader || loader.classList.contains("is-done")) return;
  loader.classList.add("is-done");
  document.documentElement.classList.remove("is-loading");
  window.setTimeout(() => loader.remove(), 600);
}

function scheduleLoader() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hold = reduce ? 250 : 1700;
  const wait = Math.max(0, hold - (performance.now() - loaderStarted));
  window.setTimeout(dismissLoader, wait);
}

if (document.readyState === "complete") scheduleLoader();
else window.addEventListener("load", scheduleLoader);
window.setTimeout(dismissLoader, 3800);

const header = document.querySelector(".site-header");
const toggle = document.querySelector(".nav-toggle");
const panel = document.querySelector("#nav-panel");
const toggleLabel = document.querySelector(".nav-toggle-label");

function setMenu(open) {
  if (!toggle || !panel) return;
  toggle.setAttribute("aria-expanded", String(open));
  panel.classList.toggle("is-open", open);
  panel.setAttribute("aria-hidden", String(!open));
  document.body.classList.toggle("menu-open", open);
  header.classList.toggle("is-open", open);
  if (toggleLabel) toggleLabel.textContent = open ? "Close" : "Menu";
  if (open) {
    const first = panel.querySelector("a");
    if (first) first.focus();
  }
}

if (toggle && panel) {
  toggle.addEventListener("click", () => {
    setMenu(!panel.classList.contains("is-open"));
  });

  panel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && panel.classList.contains("is-open")) {
      setMenu(false);
      toggle.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1040 && panel.classList.contains("is-open")) {
      setMenu(false);
    }
  });
}

function onScroll() {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 8);
}

onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

const reveals = document.querySelectorAll(".reveal");
if (reveals.length && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
  );
  reveals.forEach((el) => observer.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("is-in"));
}

window.setTimeout(() => {
  reveals.forEach((el) => el.classList.add("is-in"));
}, 2400);

const stage = document.querySelector("#cloth-stage");
const swatches = [...document.querySelectorAll(".swatch")];

function showCloth(button) {
  if (!stage || !button) return;
  swatches.forEach((item) => {
    item.setAttribute("aria-pressed", String(item === button));
  });
  stage.classList.add("is-fading");
  window.setTimeout(() => {
    stage.dataset.cloth = button.dataset.cloth;
    const meta = document.querySelector("#hang-meta");
    const name = document.querySelector("#hang-name");
    const feel = document.querySelector("#cloth-feel");
    const use = document.querySelector("#cloth-use");
    if (meta) meta.textContent = button.dataset.meta || "";
    if (name) name.textContent = button.dataset.name || "";
    if (feel) feel.textContent = button.dataset.feel || "";
    if (use) use.textContent = button.dataset.use || "";
    stage.classList.remove("is-fading");
  }, 140);
}

swatches.forEach((button, index) => {
  button.addEventListener("click", () => showCloth(button));
  button.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowDown" && event.key !== "ArrowLeft" && event.key !== "ArrowUp") {
      return;
    }
    event.preventDefault();
    const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
    const next = swatches[(index + (forward ? 1 : -1) + swatches.length) % swatches.length];
    next.focus();
    showCloth(next);
  });
});

const form = document.querySelector("#fitting-form");
const formPanel = document.querySelector("#form-panel");
const successPanel = document.querySelector("#success-panel");
const noteSlip = document.querySelector("#note-slip");
const copyButton = document.querySelector("#copy-note");
const anotherButton = document.querySelector("#another");
const copyStatus = document.querySelector("#copy-status");
const successTitle = document.querySelector("#success-title");
const STORAGE_KEY = "mars-tailors-fitting";
const WHATSAPP = "918328582281";
let latestNote = "";
const sendWhatsapp = document.querySelector("#send-whatsapp");

function fieldError(id, message) {
  const field = document.querySelector(`#${id}`);
  const error = document.querySelector(`#${id}-error`);
  if (!field || !error) return;
  if (message) {
    field.setAttribute("aria-invalid", "true");
    field.setAttribute("aria-describedby", `${id}-error`);
    error.textContent = message;
  } else {
    field.removeAttribute("aria-invalid");
    error.textContent = "";
  }
}

["name", "phone", "garment"].forEach((id) => {
  const field = document.querySelector(`#${id}`);
  if (!field) return;
  field.addEventListener("input", () => fieldError(id, ""));
  field.addEventListener("change", () => fieldError(id, ""));
});

function readRequest() {
  const data = {
    name: document.querySelector("#name").value.trim(),
    phone: document.querySelector("#phone").value.trim(),
    garment: document.querySelector("#garment").value.trim(),
    day: document.querySelector("#day").value.trim(),
    note: document.querySelector("#note").value.trim()
  };
  let firstInvalid = null;
  const nameOk = data.name.length >= 2;
  const phoneOk = (data.phone.match(/\d/g) || []).length >= 8;
  const garmentOk = data.garment.length > 0;
  fieldError("name", nameOk ? "" : "Tell us what to call you.");
  fieldError("phone", phoneOk ? "" : "Add a number we can reach you on.");
  fieldError("garment", garmentOk ? "" : "Choose what we are making.");
  if (!nameOk) firstInvalid = document.querySelector("#name");
  else if (!phoneOk) firstInvalid = document.querySelector("#phone");
  else if (!garmentOk) firstInvalid = document.querySelector("#garment");
  return { data, firstInvalid };
}

function linesFrom(data) {
  const lines = [
    "Mars Tailors — fitting request",
    `Name: ${data.name}`,
    `Phone: ${data.phone}`,
    `Garment: ${data.garment}`
  ];
  if (data.day) lines.push(`Preferred day: ${data.day}`);
  if (data.note) lines.push(`Note: ${data.note}`);
  return lines;
}

function showSuccess(data) {
  const lines = linesFrom(data);
  latestNote = lines.join("\n");
  if (noteSlip) {
    noteSlip.replaceChildren();
    lines.forEach((line) => {
      const p = document.createElement("p");
      p.textContent = line;
      noteSlip.appendChild(p);
    });
  }
  if (copyStatus) copyStatus.textContent = "";
  if (sendWhatsapp) {
    sendWhatsapp.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(latestNote)}`;
  }
  formPanel.hidden = true;
  successPanel.hidden = false;
  if (successTitle) successTitle.focus();
}

function showForm() {
  successPanel.hidden = true;
  formPanel.hidden = false;
  sessionStorage.removeItem(STORAGE_KEY);
  const name = document.querySelector("#name");
  if (name) name.focus();
}

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const { data, firstInvalid } = readRequest();
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    showSuccess(data);
  });
}

if (copyButton) {
  copyButton.addEventListener("click", async () => {
    if (!latestNote) return;
    try {
      await navigator.clipboard.writeText(latestNote);
      if (copyStatus) copyStatus.textContent = "Copied. Paste it into a message to the shop.";
    } catch {
      if (copyStatus) copyStatus.textContent = "Select the note above and copy it by hand.";
    }
  });
}

if (anotherButton) {
  anotherButton.addEventListener("click", showForm);
}

try {
  const saved = sessionStorage.getItem(STORAGE_KEY);
  if (saved) showSuccess(JSON.parse(saved));
} catch {
  sessionStorage.removeItem(STORAGE_KEY);
}
