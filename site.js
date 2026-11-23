const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

/* ---------- Loader ---------- */
(function loader() {
  const count = document.querySelector(".loader__count");
  if (reduceMotion || !count) { root.classList.add("is-loaded"); return; }
  const duration = 1100;
  const start = performance.now();
  const tick = (now) => {
    const p = clamp((now - start) / duration);
    count.textContent = Math.round(p * 100);
    if (p < 1) requestAnimationFrame(tick);
    else setTimeout(() => root.classList.add("is-loaded"), 150);
  };
  requestAnimationFrame(tick);
})();

/* ---------- Smooth scroll (Lenis) ---------- */
let lenis = null;
if (!reduceMotion && window.Lenis) {
  lenis = new window.Lenis({ lerp: 0.1 });
  window.lenis = lenis;
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}

/* ---------- Anchor links + mobile menu ---------- */
const menu = document.querySelector(".mobile-menu");
document.addEventListener("click", (event) => {
  const link = event.target.closest("a[href^='#']");
  if (!link) return;
  const target = link.hash === "#top" ? document.body : document.querySelector(link.hash);
  if (!target) return;
  event.preventDefault();
  if (menu) menu.open = false;
  if (lenis) lenis.scrollTo(link.hash === "#top" ? 0 : target);
  else target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  if (target !== document.body) target.focus({ preventScroll: true });
  history.replaceState(null, "", link.hash);
});
menu?.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menu.open) { menu.open = false; menu.querySelector("summary").focus(); }
});

/* ---------- Reveal on scroll ---------- */
const revealables = document.querySelectorAll("[data-reveal], .orbit");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      io.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -5% 0px" });
  revealables.forEach((el) => io.observe(el));
} else {
  revealables.forEach((el) => el.classList.add("is-in"));
}

/* ---------- Language: English (written in the HTML) / Spanish ---------- */
const ES = {
  "skip": "Saltar al contenido",
  "nav.about": "Sobre mí",
  "nav.services": "Servicios",
  "nav.work": "Proyectos",
  "nav.process": "Proceso",
  "cta.talk": "Hablemos",
  "menu": "Menú",
  "hero.tag": "Diseño UX/UI creativo",
  "hero.l1": "Digital por diseño",
  "hero.l2": "Humano por",
  "hero.l3": "naturaleza",
  "hero.lead": "Sitios web, aplicaciones web e identidades de marca que combinan una interfaz limpia, una estrategia UX sólida y un enfoque en conversión.",
  "hero.scroll": "Desliza para explorar",
  "based": "Desde Costa Rica",
  "about.title": "¡Hola! Diseño experiencias UX/UI",
  "about.text": "Me especializo en diseño de sitios web, aplicaciones web, sistemas de identidad de marca y experiencias digitales centradas en las personas. Combino estrategia UX, diseño de interfaces y desarrollo front-end, así que lo que diseñamos es exactamente lo que se publica.",
  "about.ring": "¡Hola! Hago diseño UX/UI · Desde Costa Rica ·",
  "quote.text": "“Crearé algo con significado y sacaré a relucir su identidad de la forma más distintiva.”",
  "quote.role": "Al frente de baycode (diseño UX/UI)",
  "services.eyebrow": "Servicios de diseño UX/UI",
  "services.title": "Hecho con intención",
  "services.text": "Un estudio de una sola persona que va de la investigación al lanzamiento. Estrategia, interfaz y código bajo el mismo techo.",
  "svc.1": "Diseño UX/UI",
  "svc.2": "Diseño web",
  "svc.3": "Aplicaciones web",
  "svc.4": "Identidad de marca",
  "svc.5": "Desarrollo front-end",
  "work.eyebrow": "Mis proyectos / portafolio",
  "work.title": "Trabajo seleccionado",
  "work.start": "Empecemos un proyecto",
  "work.hint": "Desliza o arrastra para explorar",
  "work.jr.alt": "Página de inicio de JR Embalajes con la foto de una bodega y un botón para cotizar",
  "work.jr.type": "Diseño web · 3D",
  "work.haki.alt": "Panel de Haki Tracker con el plan del día y el progreso semanal",
  "work.haki.type": "Aplicación web",
  "work.voley.type": "Aplicación web · 3D",
  "work.next.type": "Tu proyecto",
  "work.next.title": "Podría ser el siguiente",
  "process.eyebrow": "Cómo trabajo",
  "process.title": "De la idea al lanzamiento",
  "process.word": "Proceso",
  "step.1": "Descubrir",
  "step.2": "Definir",
  "step.3": "Diseñar",
  "step.4": "Desarrollar",
  "step.5": "Lanzar",
  "step.1.text": "Objetivos, público y competencia. Definimos juntos qué significa el éxito.",
  "step.2.text": "Mapa del sitio, flujos de usuario y estructura de contenido antes de cualquier píxel.",
  "step.3.text": "Wireframes, dirección visual y un prototipo navegable.",
  "step.4.text": "Código rápido y adaptable que respeta el diseño al detalle.",
  "step.5.text": "Pruebas, SEO básico, publicación y soporte después del lanzamiento.",
  "cta.title": "Creemos algo",
  "cta.word": "excepcional",
  "cta.text": "Disponible para proyectos freelance, colaboración en diseño de producto y consultoría UX.",
  "cta.quote": "Pedir una cotización",
  "cta.call": "Agendar una llamada",
  "footer.top": "Volver arriba",
};
const META_ES = {
  title: "Baycode — Diseño UX/UI en Costa Rica | Diseño web y de apps",
  description: "Baycode diseña sitios web, aplicaciones web e identidades de marca para startups y negocios desde Costa Rica.",
};

const textEls = [...document.querySelectorAll("[data-i18n]")];
const altEls = [...document.querySelectorAll("[data-i18n-alt]")];
const metaDesc = document.querySelector('meta[name="description"]');
const EN = new Map();
textEls.forEach((el) => EN.set(el, el.textContent));
altEls.forEach((el) => EN.set(el, el.alt));
const META_EN = { title: document.title, description: metaDesc?.content };
const langToggle = document.querySelector("[data-lang-toggle]");
let lang = "en";

function applyLang(next) {
  lang = next;
  const es = next === "es";
  textEls.forEach((el) => { el.textContent = (es && ES[el.dataset.i18n]) || EN.get(el); });
  altEls.forEach((el) => { el.alt = (es && ES[el.dataset.i18nAlt]) || EN.get(el); });
  root.lang = next;
  document.title = es ? META_ES.title : META_EN.title;
  if (metaDesc) metaDesc.content = es ? META_ES.description : META_EN.description;
  langToggle?.querySelectorAll("[data-lang]").forEach((s) => {
    s.setAttribute("aria-current", String(s.dataset.lang === next));
  });
  langToggle?.setAttribute("aria-label", es ? "View in English" : "Ver en español");
  splitQuote();   // the quote and marquees are built from the text,
  fillMarquees(); // so rebuild them in the new language
  try { localStorage.setItem("lang", next); } catch { /* storage blocked: fine */ }
}

/* ---------- Quote: words light up while scrolling ---------- */
const quote = document.querySelector("[data-words]");
let words = [];
function splitQuote() {
  if (!quote || reduceMotion) return;
  quote.innerHTML = quote.textContent.trim().split(/\s+/)
    .map((w) => `<span class="w">${w}</span>`).join(" ");
  words = [...quote.querySelectorAll(".w")];
}

/* ---------- Services: flowing menu ---------- */
function fillMarquees() {
  document.querySelectorAll(".flow__item").forEach((item) => {
    const label = item.querySelector(".flow__label").textContent;
    const img = item.dataset.img; // each service has its own picture
    item.querySelector(".flow__track").innerHTML =
      // label, then a small image pill before the next repetition
      Array.from({ length: 12 }, () =>
        `<span>${label}${img ? `<img class="flow__img" src="${img}" alt="" decoding="async">` : ""}</span>`
      ).join("");
  });
}

// The black strip slides in from the edge the pointer/finger came from
const FLOW_EASE = "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)";
const flowEdge = (item, y) => {
  const r = item.getBoundingClientRect();
  return y < r.top + r.height / 2 ? "-101%" : "101%";
};
function flowOpen(item, y) {
  const m = item.querySelector(".flow__marquee");
  m.style.transition = "none";
  m.style.transform = `translateY(${flowEdge(item, y)})`;
  m.offsetHeight; // reflow so the next transition starts from the edge
  m.style.transition = FLOW_EASE;
  m.style.transform = "translateY(0)";
  item.classList.add("is-open");
}
function flowClose(item, y) {
  const m = item.querySelector(".flow__marquee");
  m.style.transition = FLOW_EASE;
  m.style.transform = `translateY(${y == null ? "101%" : flowEdge(item, y)})`;
  item.classList.remove("is-open");
  clearTimeout(item._flowTimer);
}

if (!reduceMotion) {
  const flowItems = [...document.querySelectorAll(".flow__item")];
  if (window.matchMedia("(hover: hover)").matches) {
    // Desktop: hover
    flowItems.forEach((item) => {
      item.addEventListener("mouseenter", (e) => flowOpen(item, e.clientY));
      item.addEventListener("mouseleave", (e) => flowClose(item, e.clientY));
    });
  } else {
    // Phone / tablet: a tap opens the strip, it closes by itself after a moment,
    // tapping it again closes it, and opening one closes the others
    flowItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        if (item.classList.contains("is-open")) { flowClose(item, e.clientY); return; }
        flowItems.forEach((other) => { if (other !== item && other.classList.contains("is-open")) flowClose(other); });
        flowOpen(item, e.clientY);
        item._flowTimer = setTimeout(() => flowClose(item), 2800);
      });
    });
  }
}

/* ---------- Work: project videos play only while on screen ---------- */
(function cardVideos() {
  const videos = document.querySelectorAll(".card__video");
  if (!videos.length || reduceMotion || !("IntersectionObserver" in window)) return; // poster stays
  const io = new IntersectionObserver((entries) => {
    entries.forEach(({ target: v, isIntersecting }) => {
      if (isIntersecting) {
        if (v.preload === "none") v.preload = "auto";
        v.play().catch(() => { /* autoplay blocked: poster stays visible */ });
      } else {
        v.pause();
      }
    });
  }, { threshold: 0.25 });
  videos.forEach((v) => io.observe(v));
})();

/* ---------- Always start in English; Spanish only when the visitor picks it ---------- */
(function initLang() {
  let saved = null;
  try { saved = localStorage.getItem("lang"); } catch { /* ignore */ }
  // Only a choice the visitor made with the EN / ES button is remembered
  applyLang(saved === "es" ? "es" : "en");
  langToggle?.addEventListener("click", () => {
    applyLang(lang === "es" ? "en" : "es");
    onScroll(); // re-light the quote words for the current position
  });
})();

/* ---------- Work: horizontal scroll gallery ---------- */
const work = document.querySelector(".work");
const viewport = work.querySelector(".work__viewport");
const track = work.querySelector(".work__track");
const counter = work.querySelector(".work__count");
const bar = work.querySelector(".work__bar span");
const cards = track.children.length;
const desktop = window.matchMedia("(min-width: 48.01rem)");
let distance = 0;

function setupGallery() {
  // The 3D reel (work3d.js) owns the section once it is running
  if (work.classList.contains("is-3d")) {
    work.classList.remove("is-pinned"); track.style.transform = ""; distance = 0; return;
  }
  const pin = desktop.matches && !reduceMotion;
  work.classList.toggle("is-pinned", pin);
  track.style.transform = "";
  if (!pin) { work.style.height = ""; distance = 0; return; }
  const pad = parseFloat(getComputedStyle(viewport).paddingLeft) || 0;
  distance = Math.max(0, track.scrollWidth + pad * 2 - viewport.clientWidth);
  work.style.height = `${window.innerHeight + distance}px`;
}

function setProgress(p) {
  const index = Math.round(p * (cards - 1)) + 1;
  counter.textContent = String(index).padStart(2, "0");
  bar.style.setProperty("--p", (1 + p * (cards - 1)) / cards);
}

viewport.addEventListener("scroll", () => {
  if (distance) return;
  const max = viewport.scrollWidth - viewport.clientWidth;
  setProgress(max > 0 ? viewport.scrollLeft / max : 0);
}, { passive: true });

/* ---------- Hero light: moves opposite to the mouse (desktop) ---------- */
(function heroLight() {
  const layer = document.querySelector(".hero__light-x");
  const heroEl = document.querySelector(".hero");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (!layer || reduceMotion || !finePointer.matches) return; // touch uses the CSS wave

  let tx = 0, ty = 0, x = 0, y = 0, running = false;
  const RANGE_X = 0.3, RANGE_Y = 0.22; // share of the viewport the light can travel

  const loop = () => {
    x += (tx - x) * 0.06;
    y += (ty - y) * 0.06;
    layer.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    if (Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3) requestAnimationFrame(loop);
    else running = false;
  };
  const start = () => { if (!running) { running = true; requestAnimationFrame(loop); } };

  window.addEventListener("pointermove", (e) => {
    const r = heroEl.getBoundingClientRect();
    if (r.bottom < 0) return; // hero scrolled away
    const nx = e.clientX / window.innerWidth - 0.5;  // -0.5 … 0.5
    const ny = (e.clientY - r.top) / r.height - 0.5;
    tx = -nx * 2 * RANGE_X * window.innerWidth;       // opposite side of the cursor
    ty = -clamp(ny, -0.5, 0.5) * 2 * RANGE_Y * window.innerHeight;
    start();
  }, { passive: true });

  document.documentElement.addEventListener("pointerleave", () => { tx = 0; ty = 0; start(); });
})();

/* ---------- Process: growing orbit (phones) + "passage" deck of step cards (all sizes) ---------- */
const phone = window.matchMedia("(max-width: 48rem)");
const orbit = document.querySelector(".orbit");
const orbitCircles = orbit ? [...orbit.querySelectorAll(".orbit__circle")] : [];
const passage = document.querySelector("[data-passage]");
const passageStage = passage?.querySelector(".passage__stage");
let passageOn = false;

function setupProcess() {
  orbit?.classList.toggle("is-scrubbed", phone.matches && !reduceMotion);
  if (!passage) return;
  passageOn = !reduceMotion; // reduced motion: the plain list, no scroll runway
  passage.classList.toggle("is-active", passageOn);
  if (!passageOn) passageStage.style.removeProperty("--p");
}

function updateProcess(vh) {
  if (orbit?.classList.contains("is-scrubbed")) {
    const top = orbit.getBoundingClientRect().top;
    const g = clamp((vh * 0.95 - top) / (vh * 0.55));
    orbit.style.setProperty("--g", g.toFixed(3));
    orbitCircles.forEach((c, i) => c.style.setProperty("--c", clamp(g * 1.6 - i * 0.15).toFixed(3)));
  }
  if (!passageOn) return;
  // p = progress through the pinned runway of this section (0 at pin start, 1 at its end)
  const rect = passage.getBoundingClientRect();
  const stickyTop = parseFloat(getComputedStyle(passage.firstElementChild).top) || 0;
  const runway = rect.height - (vh - stickyTop);
  passageStage.style.setProperty("--p", clamp((stickyTop - rect.top) / runway).toFixed(4));
}
phone.addEventListener?.("change", () => { setupProcess(); onScroll(); });
setupProcess();

/* ---------- Scroll-driven updates ---------- */
const header = document.querySelector(".header");
const hero = document.querySelector(".hero");
const ring = document.querySelector(".badge__ring");
const quoteSection = document.querySelector(".quote");
const quoteInner = document.querySelector(".quote__inner");
const services = document.querySelector(".services");

function onScroll() {
  const y = window.scrollY;
  header.classList.toggle("is-solid", y > hero.offsetHeight - header.offsetHeight);

  if (distance) {
    const p = clamp((y - work.offsetTop) / distance);
    track.style.transform = `translate3d(${-p * distance}px, 0, 0)`;
    setProgress(p);
  }

  if (reduceMotion) return;
  const vh = window.innerHeight;

  // About: the ring turns with the scroll (down = clockwise, up = counter-clockwise)
  if (ring) ring.style.transform = `rotate(${y * 0.18}deg)`;

  // Quote: words light up as the section rises into view (fully lit once it pins)
  if (words.length) {
    const p = clamp((vh - quoteSection.getBoundingClientRect().top) / (vh * 0.85));
    const lit = p * words.length;
    words.forEach((w, i) => { w.style.opacity = i < lit ? 1 : 0.15; });
  }

  updateProcess(vh);

  // Services slides over the pinned quote: the quote shrinks and fades as it gets covered
  const covered = clamp(1 - services.getBoundingClientRect().top / vh);
  quoteInner.style.transform = `scale(${1 - covered * 0.14}) translateY(${-covered * 6}vh)`;
  quoteInner.style.opacity = 1 - covered * 0.75;
}

let ticking = false;
window.addEventListener("scroll", () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { onScroll(); ticking = false; });
}, { passive: true });

window.addEventListener("resize", () => { setupGallery(); onScroll(); });
window.baycodeResetGallery = () => { setupGallery(); onScroll(); };
window.addEventListener("load", () => { setupGallery(); onScroll(); });
setupGallery();
onScroll();

document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
