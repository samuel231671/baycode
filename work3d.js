// Selected work: curved 3D project reel (Three.js).
// - Each project cover is a cylindrically bent mesh on an elliptical track.
// - The section is pinned; page scroll (wheel) drives the reel, so after the last
//   project the page simply keeps scrolling to Process.
// - Drag moves the reel and settles on the nearest project; arrow keys / Home / End navigate.
// - The project in front plays its "in use" video; one glass link opens it.
// - If Three.js or WebGL is unavailable, nothing here runs and the HTML gallery stays.

const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
const work = document.querySelector(".work");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Geometry and motion constants (from the spec)
const PLANE_W = 2.38, PLANE_H = 1.5771, SEG_X = 48, SEG_Y = 24;
const BEND_BASE = 0.3, BEND_MAX = 0.42, RIPPLE = 0.006;
const THETA_STEP = 0.73, DAMPING = 13, MAX_DT = 0.05;
const COVER_W = 1190, COVER_H = Math.round(COVER_W * PLANE_H / PLANE_W);

const VERTEX = /* glsl */ `
  uniform float uBend; uniform float uTime; uniform float uRipple;
  varying vec2 vUv; varying float vShade;
  void main() {
    vUv = uv;
    vec3 p = position;
    float hw = ${(PLANE_W / 2).toFixed(4)};
    float b = max(uBend, 0.0001);
    float ang = (p.x / hw) * b;
    float r = hw / b;
    p.x = sin(ang) * r;
    p.z += (cos(ang) - 1.0) * r;
    p.y += sin(p.x * 2.2 + uTime * 0.7) * uRipple;
    vShade = cos(ang);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`;
const FRAGMENT = /* glsl */ `
  uniform sampler2D uMap; uniform float uOpacity; uniform vec2 uSize; uniform float uRadius;
  varying vec2 vUv; varying float vShade;
  float sdRoundBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }
  void main() {
    vec2 p = (vUv - 0.5) * uSize;
    float d = sdRoundBox(p, uSize * 0.5, uRadius);
    float aa = fwidth(d);
    float mask = 1.0 - smoothstep(-aa, aa, d);
    vec4 c = texture2D(uMap, vUv);
    c.rgb *= mix(0.8, 1.0, vShade);          // subtle curvature shading
    gl_FragColor = vec4(c.rgb, mask * uOpacity);
    if (gl_FragColor.a < 0.003) discard;
  }`;

async function init() {
  if (!work) return;
  const stage = work.querySelector(".work__stage3d");
  const cardsDom = [...work.querySelectorAll(".work__track .card")];
  if (!stage || cardsDom.length < 2) return;
  if (new URLSearchParams(location.search).has("no3d")) return; // test switch: show the fallback gallery

  let THREE;
  try { THREE = await import(THREE_URL); } catch { return; } // fallback: HTML gallery
  const canvas = stage.querySelector(".work__canvas");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch { return; } // no WebGL: fallback
  renderer.setClearColor(0x000000, 0);

  const visit = stage.querySelector(".work__visit");
  const visitLabel = visit.querySelector("span");
  const count = work.querySelector(".work__count");
  const bar = work.querySelector(".work__bar span");
  const N = cardsDom.length;

  // ---- Data: read from the existing cards (their text follows the EN / ES switch)
  const items = cardsDom.map((li) => {
    const a = li.querySelector("a");
    const v = li.querySelector("video");
    return {
      li, href: a.getAttribute("href"), external: a.getAttribute("target") === "_blank",
      posterSrc: v?.getAttribute("poster") || null, videoSrc: v?.getAttribute("src") || null,
      cta: li.classList.contains("card--cta"),
    };
  });
  const textOf = (it) => ({
    type: it.li.querySelector(".card__type")?.textContent.trim() || "",
    title: it.li.querySelector("h3")?.textContent.trim() || "",
  });
  const isEs = () => document.documentElement.lang === "es";

  // ---- Switch the section over to the reel
  work.classList.add("is-3d");
  window.baycodeResetGallery?.();
  const sizeRunway = () => { work.style.height = `calc(100svh + ${(N - 1) * 75}svh)`; };
  sizeRunway();

  // ---- Scene
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(65.7, 1, 0.1, 40);
  camera.position.set(0, 0, 8.1);
  const geometry = new THREE.PlaneGeometry(PLANE_W, PLANE_H, SEG_X, SEG_Y);

  const loadImage = (src) => new Promise((res) => {
    if (!src) return res(null);
    const img = new Image(); img.decoding = "async";
    img.onload = () => res(img); img.onerror = () => res(null); img.src = src;
  });
  try { await Promise.all([document.fonts.load('400 80px "Instrument Serif"'), document.fonts.load("700 24px Manrope")]); } catch { /* use fallbacks */ }

  const cards = await Promise.all(items.map(async (it) => {
    const cv = document.createElement("canvas");
    cv.width = COVER_W; cv.height = COVER_H;
    const ctx = cv.getContext("2d");
    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    tex.generateMipmaps = true;
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX, fragmentShader: FRAGMENT,
      uniforms: {
        uMap: { value: tex }, uBend: { value: BEND_BASE }, uTime: { value: 0 },
        uRipple: { value: reduceMotion ? 0 : RIPPLE }, uOpacity: { value: 1 },
        uSize: { value: new THREE.Vector2(PLANE_W, PLANE_H) }, uRadius: { value: 0.07 },
      },
      transparent: true, side: THREE.FrontSide, // surfaces facing away are hidden
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    const poster = await loadImage(it.posterSrc);
    return { it, cv, ctx, tex, material, mesh, poster, video: null };
  }));

  // ---- Cover artwork: project frame (video or poster) + the card's type and title
  function drawCover(c, frame) {
    const { ctx } = c;
    const W = COVER_W, H = COVER_H;
    ctx.clearRect(0, 0, W, H);
    if (c.it.cta || !frame) {
      const g = ctx.createRadialGradient(W * 0.7, H * 0.3, 0, W * 0.7, H * 0.3, W * 0.75);
      g.addColorStop(0, "#2a2a3a"); g.addColorStop(1, "#111111");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    } else {
      const fw = frame.videoWidth || frame.naturalWidth, fh = frame.videoHeight || frame.naturalHeight;
      const s = Math.max(W / fw, H / fh); // cover fit, anchored to the top like the HTML cards
      ctx.drawImage(frame, (W - fw * s) / 2, 0, fw * s, fh * s);
    }
    const grad = ctx.createLinearGradient(0, H * 0.45, 0, H);
    grad.addColorStop(0, "rgba(0,0,0,0)"); grad.addColorStop(1, "rgba(0,0,0,0.85)");
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    const { type, title } = textOf(c.it);
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.font = "700 24px Manrope, 'Helvetica Neue', Arial, sans-serif";
    if ("letterSpacing" in ctx) ctx.letterSpacing = "3px";
    ctx.fillText(type.toUpperCase(), 60, H - 150);
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
    ctx.fillStyle = "#ffffff";
    ctx.font = "400 104px 'Instrument Serif', Georgia, serif";
    ctx.fillText(title, 56, H - 56);
    c.tex.needsUpdate = true;
  }
  const redrawAll = () => cards.forEach((c) => drawCover(c, c.video?.readyState >= 2 ? c.video : c.poster));
  redrawAll();

  // ---- Layout: card ~37% of the width on desktop, ~77% on phones
  let trackRadius = 4, trackDepth = 3, pitch = 0.5, cardScale = 1;
  function layout() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const narrow = w < 768;
    trackDepth = narrow ? 2.2 : 3.0;
    const dist = camera.position.z - (trackDepth - 0.28);
    const visH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist;
    const visW = visH * camera.aspect;
    cardScale = Math.min(((narrow ? 0.77 : 0.37) * visW) / PLANE_W, (0.72 * visH) / PLANE_H);
    // wide enough that neighbours never overlap the front card (they peek from the sides on phones)
    trackRadius = visW * (narrow ? 1.15 : 0.78);
    pitch = 0.52 * cardScale * (narrow ? 0.6 : 1); // shallow on phones too: neighbours crop at the sides
  }
  layout();

  // ---- State
  let phase = 0, target = 0, velocity = 0;
  let manual = null;                 // drag-controlled phase
  let settleTo = null, settleUntil = 0;
  let activeIdx = -1;

  const runway = () => work.offsetHeight - window.innerHeight;
  const sectionTop = () => work.getBoundingClientRect().top + window.scrollY;
  function scrollPhase() {
    const r = work.getBoundingClientRect();
    return clamp(-r.top / Math.max(1, runway()), 0, 1) * (N - 1);
  }
  // Move the page so its scroll position matches project `i` (keeps scroll and reel in sync)
  function goTo(i) {
    i = clamp(Math.round(i), 0, N - 1);
    settleTo = i; settleUntil = performance.now() + 1600;
    if (reduceMotion) phase = target = i;
    const y = sectionTop() + (i / (N - 1)) * runway();
    if (window.lenis) window.lenis.scrollTo(y, { immediate: reduceMotion });
    else window.scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
  }

  // ---- Drag (pointer). Horizontal drag left advances; mouse vertical drag down advances.
  let drag = null;
  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, base: target, type: e.pointerType, moved: false };
    canvas.setPointerCapture?.(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = drag.type === "mouse" ? e.clientY - drag.y : 0;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    drag.moved = true;
    canvas.classList.add("is-dragging");
    const span = Math.max(240, stage.clientWidth * 0.45);
    manual = clamp(drag.base + (-dx + dy) / span, -0.3, N - 1 + 0.3);
  });
  const endDrag = (e) => {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    try { canvas.releasePointerCapture?.(drag.id); } catch { /* already released */ }
    canvas.classList.remove("is-dragging");
    if (drag.moved && manual != null) goTo(manual); // settle on the nearest project
    drag = null; manual = null;
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("lostpointercapture", endDrag);

  // ---- Keyboard: arrows move one project, Home / End jump to the ends
  canvas.addEventListener("keydown", (e) => {
    const cur = settleTo ?? Math.round(target);
    let next = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = cur + 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = cur - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = N - 1;
    if (next == null) return;
    e.preventDefault();
    goTo(next);
  });

  // ---- Active project: link, counter, accessible description, video
  function setActive(i) {
    if (i === activeIdx) return;
    activeIdx = i;
    const c = cards[i], { type, title } = textOf(c.it);
    visit.setAttribute("href", c.it.href);
    if (c.it.external) { visit.setAttribute("target", "_blank"); visit.setAttribute("rel", "noopener"); }
    else { visit.removeAttribute("target"); visit.removeAttribute("rel"); }
    visitLabel.textContent = c.it.cta ? (isEs() ? "Hablemos" : "Let's talk") : `${isEs() ? "Ver" : "Visit"} ${title}`;
    canvas.setAttribute("aria-label", `${i + 1} / ${N}: ${title} — ${type}. ${isEs()
      ? "Usa las flechas para cambiar de proyecto o arrastra."
      : "Use the arrow keys or drag to change project."}`);
    if (count) count.textContent = String(i + 1).padStart(2, "0");
    syncVideos();
  }
  function syncVideos() {
    cards.forEach((c, i) => {
      const want = running && i === activeIdx && !reduceMotion && c.it.videoSrc && !c.it.cta;
      if (want && !c.video) {
        const v = document.createElement("video");
        v.muted = true; v.loop = true; v.playsInline = true; v.preload = "auto";
        v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
        v.src = c.it.videoSrc;
        c.video = v;
      }
      if (!c.video) return;
      if (want) c.video.play().catch(() => {});
      else if (!c.video.paused) c.video.pause();
    });
  }
  new MutationObserver(() => { redrawAll(); const i = activeIdx; activeIdx = -1; setActive(i < 0 ? 0 : i); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  // ---- One animation loop; stops when the section is offscreen or the tab is hidden
  let running = false, raf = 0, last = 0, time = 0, frameCount = 0;
  const wrapRel = (x) => ((((x + N / 2) % N) + N) % N) - N / 2;

  function frame(now) {
    raf = 0;
    if (!running) return;
    step(now);
    raf = requestAnimationFrame(frame);
  }
  function step(now) {
    const dt = Math.min(MAX_DT, last ? (now - last) / 1000 : 0);
    last = now; time += dt; frameCount++;

    // target: drag > pending settle > page scroll
    const sp = scrollPhase();
    if (settleTo != null && (Math.abs(sp - settleTo) < 0.02 || now > settleUntil)) settleTo = null;
    target = manual ?? settleTo ?? sp;
    const prev = phase;
    phase = reduceMotion ? target : phase + (target - phase) * (1 - Math.exp(-DAMPING * dt));
    velocity = dt > 0 ? (phase - prev) / dt : 0;

    const bend = reduceMotion ? BEND_BASE : clamp(BEND_BASE + Math.abs(velocity) * 0.05, BEND_BASE, BEND_MAX);
    const lean = reduceMotion ? 0 : clamp(velocity * 0.02, -0.06, 0.06);

    cards.forEach((c, i) => {
      const rel = wrapRel(i - phase);
      const theta = rel * THETA_STEP;
      const m = c.mesh;
      m.position.set(Math.sin(theta) * trackRadius, rel * pitch, Math.cos(theta) * trackDepth - 0.28);
      m.rotation.set(rel * -0.01 + lean, Math.atan2(trackDepth * Math.sin(theta), trackRadius * Math.cos(theta)), 0);
      m.scale.setScalar(cardScale);
      // fade a card as it wraps from one end of the loop to the other
      c.material.uniforms.uOpacity.value = clamp((N / 2 - Math.abs(rel)) / 0.35, 0, 1);
      c.material.uniforms.uBend.value = bend;
      c.material.uniforms.uTime.value = time;
    });

    setActive(clamp(Math.round(phase), 0, N - 1));
    if (bar) bar.style.setProperty("--p", ((1 + phase) / N).toFixed(3));

    // the front project's video, drawn into its cover (~30 fps)
    const act = cards[activeIdx];
    if (act?.video && act.video.readyState >= 2 && !act.video.paused && frameCount % 2 === 0) drawCover(act, act.video);

    renderer.render(scene, camera);
  }
  function setRunning(on) {
    if (on === running) return;
    running = on;
    if (on) { last = 0; if (!raf) raf = requestAnimationFrame(frame); } // resume without a time jump
    else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    syncVideos();
  }
  let inView = false;
  const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; setRunning(inView && !document.hidden); }, { rootMargin: "100px 0px" });
  io.observe(work);
  const onVisibility = () => setRunning(inView && !document.hidden);
  document.addEventListener("visibilitychange", onVisibility);
  const ro = new ResizeObserver(() => { layout(); sizeRunway(); });
  ro.observe(stage);

  // first frame even before scrolling into view (so the reel is ready)
  setActive(0);
  step(performance.now()); last = 0;

  // ---- Cleanup
  window.addEventListener("pagehide", () => {
    setRunning(false);
    io.disconnect(); ro.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    cards.forEach((c) => { c.material.dispose(); c.tex.dispose(); if (c.video) { c.video.pause(); c.video.removeAttribute("src"); c.video.load(); } });
    geometry.dispose();
    renderer.dispose();
  }, { once: true });
}

init();
