/* ════════════════════════════════════════
   PERFORMANCE & ACCESSIBILITY FLAGS
   ════════════════════════════════════════ */
const isMobile       = window.innerWidth < 768;
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let reduceMotion     = prefersReduced;

document.getElementById('reduceMotionBtn').addEventListener('click', () => {
  reduceMotion = !reduceMotion;
  document.getElementById('reduceMotionBtn').style.opacity = reduceMotion ? '0.4' : '1';
});

/* ════════════════════════════════════════
   PAGE ROUTER
   ════════════════════════════════════════ */
let activePage = document.getElementById('page-home');

function navigateTo(pageId) {
  const next = document.getElementById(pageId);
  if (!next || next === activePage) return;
  activePage.classList.add('exiting');
  const old = activePage;
  setTimeout(() => old.classList.remove('active', 'exiting'), 380);
  next.classList.add('active');
  activePage = next;
  window.scrollTo(0, 0);
  updateNavActive(pageId);
  setTimeout(() => initPageReveals(next), 60);
  if (pageId === 'page-skills')  triggerSkillBars();
  if (pageId === 'page-home')    triggerCounters();
  if (pageId === 'page-resume')  triggerVrBars();
}

function updateNavActive(pageId) {
  document.querySelectorAll('[data-page]').forEach(el => {
    el.classList.toggle('active', el.dataset.page === pageId);
  });
}

// Wire up all data-page elements
document.querySelectorAll('[data-page]').forEach(el => {
  el.addEventListener('click', () => {
    navigateTo(el.dataset.page);
    const mm = document.getElementById('mobileMenu');
    if (mm.classList.contains('open')) {
      mm.classList.remove('open');
      document.getElementById('navMenu').textContent = '☰';
    }
  });
});

/* ════════════════════════════════════════
   BACKGROUND CANVAS — indigo/cyan particles,
   gears, code brackets
   ════════════════════════════════════════ */
const bgCanvas   = document.getElementById('bg-canvas');
const bgRenderer = new THREE.WebGLRenderer({ canvas: bgCanvas, antialias: !isMobile, alpha: true });
bgRenderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));
bgRenderer.setSize(window.innerWidth, window.innerHeight);

const bgScene  = new THREE.Scene();
const bgCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
bgCamera.position.set(0, 0, 5);

// — Indigo particle field —
const pCount = isMobile ? 350 : 750;
const pPos   = new Float32Array(pCount * 3);
for (let i = 0; i < pCount; i++) {
  pPos[i*3]   = (Math.random() - 0.5) * 22;
  pPos[i*3+1] = (Math.random() - 0.5) * 22;
  pPos[i*3+2] = (Math.random() - 0.5) * 14;
}
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const pMat = new THREE.PointsMaterial({ size: 0.022, color: 0x818CF8, transparent: true, opacity: 0.22 });
const bgParticles = new THREE.Points(pGeo, pMat);
bgScene.add(bgParticles);

// — Instanced gears (indigo) —
const gearMat   = new THREE.MeshStandardMaterial({ color: 0x6366F1, roughness: 0.5, metalness: 0.45, transparent: true, opacity: 0.45 });
const gearCount = isMobile ? 6 : 14;
const gears     = [];
for (let i = 0; i < gearCount; i++) {
  const size  = 0.55 + Math.random() * 0.9;
  const ring  = new THREE.Mesh(new THREE.TorusGeometry(0.22 * size, 0.04 * size, 6, 14), gearMat);
  const gGroup = new THREE.Group();
  gGroup.add(ring);
  for (let t = 0; t < 8; t++) {
    const a     = (t / 8) * Math.PI * 2;
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.09 * size, 0.07 * size, 0.04 * size), gearMat);
    tooth.position.set(Math.cos(a) * 0.27 * size, Math.sin(a) * 0.27 * size, 0);
    tooth.rotation.z = a;
    gGroup.add(tooth);
  }
  gGroup.position.set(
    (Math.random() - 0.5) * 18,
    (Math.random() - 0.5) * 18,
    (Math.random() - 0.5) * 8 - 4
  );
  gGroup.userData.baseY  = gGroup.position.y;
  gGroup.userData.speed  = 0.003 + Math.random() * 0.005;
  gGroup.userData.dir    = Math.random() > 0.5 ? 1 : -1;
  gGroup.userData.floatS = Math.random() * Math.PI * 2;
  bgScene.add(gGroup);
  gears.push(gGroup);
}

// — Code bracket shapes ({ } < >) — cyan —
const bracketMat = new THREE.MeshStandardMaterial({ color: 0x22D3EE, transparent: true, opacity: 0.22 });
function makeBracket(type = 'curly') {
  const g = new THREE.Group();
  if (type === 'curly') {
    const vert = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.04), bracketMat);
    g.add(vert);
    [[0, 0.13], [0, -0.13]].forEach(([, y]) => {
      const h = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 0.04), bracketMat);
      h.position.set(0.04, y, 0);
      g.add(h);
    });
    const nub = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), bracketMat);
    nub.position.set(-0.04, 0, 0);
    g.add(nub);
  } else {
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.04), bracketMat);
    top.position.set(0.04, 0.1, 0); top.rotation.z = -0.6;
    g.add(top);
    const bot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.04), bracketMat);
    bot.position.set(0.04, -0.1, 0); bot.rotation.z = 0.6;
    g.add(bot);
  }
  return g;
}

const bracketCount = isMobile ? 5 : 12;
const brackets     = [];
const bTypes       = ['curly', 'angle'];
for (let i = 0; i < bracketCount; i++) {
  const b = makeBracket(bTypes[i % 2]);
  const s = 0.8 + Math.random() * 1.4;
  b.scale.setScalar(s);
  b.position.set(
    (Math.random() - 0.5) * 18,
    (Math.random() - 0.5) * 18,
    (Math.random() - 0.5) * 6 - 5
  );
  b.rotation.z = Math.random() * Math.PI;
  b.userData.rotSpd  = (Math.random() - 0.5) * 0.006;
  b.userData.floatS  = Math.random() * Math.PI * 2;
  b.userData.floatSp = 0.4 + Math.random() * 0.4;
  b.userData.baseY   = b.position.y;
  bgScene.add(b);
  brackets.push(b);
}

// Lights for bg
bgScene.add(new THREE.AmbientLight(0x818CF8, 0.6));
const bgPoint = new THREE.PointLight(0x22D3EE, 0.8, 20);
bgPoint.position.set(3, 3, 3);
bgScene.add(bgPoint);

/* ════════════════════════════════════════
   CHARACTER CANVAS — new anime-style girl
   ════════════════════════════════════════ */
const charCanvas   = document.getElementById('character-canvas');
const charRenderer = new THREE.WebGLRenderer({ canvas: charCanvas, antialias: true, alpha: true });
charRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const charScene  = new THREE.Scene();
const charCamera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
charCamera.position.set(0, 0.3, 6.2);
charCamera.lookAt(0, 0.1, 0);

function resizeCharCanvas() {
  const el = charCanvas.parentElement;
  if (!el) return;
  const w = el.clientWidth || 500, h = el.clientHeight || 540;
  charRenderer.setSize(w, h);
  charCamera.aspect = w / h;
  charCamera.updateProjectionMatrix();
}
resizeCharCanvas();

// Lighting
charScene.add(new THREE.AmbientLight(0xC8D8FF, 0.38));
const keyL  = new THREE.DirectionalLight(0xFFF0E8, 1.25); keyL.position.set(-2.5, 4, 3); charScene.add(keyL);
const rimL  = new THREE.PointLight(0x818CF8, 1.1, 14);   rimL.position.set(3, 2, 2);    charScene.add(rimL);
const fillL = new THREE.PointLight(0x22D3EE, 0.8, 12);   fillL.position.set(-1, 3, -4); charScene.add(fillL);
const groundL = new THREE.PointLight(0x6366F1, 0.55, 8); groundL.position.set(0, -2, 0); charScene.add(groundL);

const mat = (col, rough=0.5, metal=0, op=1, em=null, ei=0) => {
  const m = new THREE.MeshStandardMaterial({ color: col, roughness: rough, metalness: metal });
  if (op < 1) { m.transparent = true; m.opacity = op; }
  if (em)     { m.emissive = new THREE.Color(em); m.emissiveIntensity = ei; }
  return m;
};

/* ── Platform ── */
function createPlatform() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.05, 6), mat(0x0D1117, 0.15, 0.92, 0.9));
  g.add(base);
  const r1 = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.04, 8, 72), mat(0x818CF8, 0.2, 0.4, 1, 0x818CF8, 0.65));
  r1.rotation.x = Math.PI / 2; r1.position.y = 0.03; g.add(r1);
  const r2 = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.025, 8, 56), mat(0x22D3EE, 0.2, 0.4, 0.75, 0x22D3EE, 0.5));
  r2.rotation.x = Math.PI / 2; r2.position.y = 0.03; g.add(r2);
  for (let i = 0; i < 6; i++) {
    const a  = (i / 6) * Math.PI * 2;
    const sp = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.01, 2.2), mat(0x818CF8, 0.4, 0.2, 0.18, 0x818CF8, 0.1));
    sp.rotation.y = a; sp.position.y = 0.03; g.add(sp);
  }
  return g;
}

/* ── Girl character ── */
function createGirl() {
  const g = new THREE.Group();

  const mSkin     = mat(0xDBA58A, 0.75, 0.05);
  const mHair     = mat(0x0A0812, 0.85, 0.1);
  const mHairTip  = mat(0x7C3AED, 0.3, 0.4, 1, 0x9333EA, 0.7);
  const mOutfit   = mat(0x0D1117, 0.4, 0.85);
  const mOutfitMid = mat(0x1A2035, 0.35, 0.75);
  const mAccP     = mat(0x818CF8, 0.1, 0.2, 1, 0x818CF8, 1.2);
  const mAccC     = mat(0x22D3EE, 0.1, 0.2, 1, 0x22D3EE, 1.0);
  const mEyeW     = mat(0xF8FAFC, 0.9);
  const mLip      = mat(0xB87B78, 0.7);
  const mBoots    = mat(0x080C12, 0.2, 0.9);
  const mShine    = mat(0xFFFFFF, 0.1, 0, 1, 0xFFFFFF, 1);

  // HEAD
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.365, 32, 32), mSkin);
  head.position.y = 1.85; head.scale.set(0.93, 1.06, 0.91); g.add(head);

  // HAIR — back volume
  const hBack = new THREE.Mesh(new THREE.SphereGeometry(0.39, 32, 32), mHair);
  hBack.position.y = 1.85; hBack.scale.set(0.95, 1.07, 0.88); g.add(hBack);
  // hair top cap
  const hTop = new THREE.Mesh(new THREE.SphereGeometry(0.375, 32, 16, 0, Math.PI*2, 0, Math.PI*0.52), mHair);
  hTop.position.y = 1.85; g.add(hTop);
  // bangs
  const bangs = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.16), mHair);
  bangs.position.set(0, 2.1, 0.23); bangs.rotation.x = 0.15; g.add(bangs);
  // side panels + glowing tips
  [-1, 1].forEach(s => {
    const sp  = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.58, 0.2), mHair);
    sp.position.set(s*0.36, 1.68, 0.05); g.add(sp);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.058, 10, 10), mHairTip.clone());
    tip.position.set(s*0.37, 1.37, 0.06); g.add(tip);
  });
  // long back strand
  const lh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.045, 0.95, 12), mHair);
  lh.position.set(0, 1.35, -0.3); lh.rotation.x = 0.28; g.add(lh);

  // EYES
  const eyeMats = [];
  [-0.13, 0.13].forEach(x => {
    const ew = new THREE.Mesh(new THREE.SphereGeometry(0.068, 20, 20), mEyeW);
    ew.position.set(x, 1.87, 0.3); ew.scale.set(1, 0.83, 0.62); g.add(ew);
    const em = mat(0x6366F1, 0.1, 0, 1, 0x818CF8, 0.9);
    eyeMats.push(em);
    const ei = new THREE.Mesh(new THREE.CircleGeometry(0.05, 24), em);
    ei.position.set(x, 1.87, 0.368); g.add(ei);
    const ep = new THREE.Mesh(new THREE.CircleGeometry(0.026, 16), mat(0x050308, 0.3));
    ep.position.set(x, 1.87, 0.372); g.add(ep);
    const es = new THREE.Mesh(new THREE.CircleGeometry(0.011, 8), mShine);
    es.position.set(x+0.02, 1.882, 0.376); g.add(es);
    const eb = new THREE.Mesh(new THREE.BoxGeometry(0.094, 0.014, 0.01), mHair);
    eb.position.set(x, 1.957, 0.282); eb.rotation.z = x > 0 ? -0.07 : 0.07; g.add(eb);
    const el = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.009, 0.005), mHair);
    el.position.set(x, 1.836, 0.364); g.add(el);
  });
  g.userData.eyeMats = eyeMats;

  // NOSE, LIPS, EARS
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), mSkin);
  nose.position.set(0, 1.814, 0.354); nose.scale.set(1, 0.65, 0.72); g.add(nose);
  const lips = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), mLip);
  lips.position.set(0, 1.77, 0.354); lips.scale.set(1.7, 0.65, 0.62); g.add(lips);
  [-1, 1].forEach(s => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.038, 10, 10), mSkin);
    ear.position.set(s*0.35, 1.84, 0); ear.scale.set(0.52, 0.88, 0.52); g.add(ear);
    const ering = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), mAccC.clone());
    ering.position.set(s*0.375, 1.79, 0); g.add(ering);
  });

  // NECK
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.115, 0.2, 16), mSkin);
  neck.position.y = 1.6; g.add(neck);

  // TORSO
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.265, 0.295, 0.72, 24), mOutfit);
  torso.position.y = 1.1; g.add(torso);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.155, 0.16, 16), mOutfitMid);
  collar.position.y = 1.42; g.add(collar);
  // circuit strips
  [1.26, 1.12, 0.98, 0.84].forEach((y, i) => {
    const w     = i % 2 === 0 ? 0.38 : 0.28;
    const strip = new THREE.Mesh(new THREE.BoxGeometry(w, 0.011, 0.018), i % 2 === 0 ? mAccC.clone() : mAccP.clone());
    strip.position.set(0, y, 0.275); g.add(strip);
  });
  [-1, 1].forEach(s => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.68, 0.28), mOutfitMid);
    p.position.set(s*0.235, 1.12, 0); g.add(p);
  });

  // LEFT ARM (relaxed at side)
  const lSh = new THREE.Mesh(new THREE.SphereGeometry(0.098, 12, 12), mOutfitMid);
  lSh.position.set(-0.4, 1.3, 0); g.add(lSh);
  const lUA = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.076, 0.4, 12), mOutfit);
  lUA.position.set(-0.455, 1.05, 0); lUA.rotation.z = 0.14; g.add(lUA);
  const lEl = new THREE.Mesh(new THREE.SphereGeometry(0.078, 10, 10), mOutfitMid);
  lEl.position.set(-0.5, 0.82, 0); g.add(lEl);
  const lLA = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.064, 0.38, 12), mOutfit);
  lLA.position.set(-0.53, 0.575, 0.04); lLA.rotation.set(-0.06, 0, 0.2); g.add(lLA);
  const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.068, 12, 12), mSkin);
  lHand.position.set(-0.555, 0.36, 0.08); lHand.scale.set(0.86, 0.73, 0.64); g.add(lHand);

  // RIGHT ARM (extended toward hologram)
  const rSh = new THREE.Mesh(new THREE.SphereGeometry(0.098, 12, 12), mOutfitMid);
  rSh.position.set(0.4, 1.3, 0.05); g.add(rSh);
  const rUA = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.076, 0.4, 12), mOutfit);
  rUA.position.set(0.47, 1.1, 0.1); rUA.rotation.set(0.32, 0, -0.22); g.add(rUA);
  const rEl = new THREE.Mesh(new THREE.SphereGeometry(0.078, 10, 10), mOutfitMid);
  rEl.position.set(0.5, 0.88, 0.26); g.add(rEl);
  const rLA = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.064, 0.38, 12), mOutfit);
  rLA.position.set(0.48, 0.66, 0.42); rLA.rotation.set(-0.52, 0, -0.28); g.add(rLA);
  const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.068, 12, 12), mSkin);
  rHand.position.set(0.45, 0.465, 0.58); rHand.scale.set(0.86, 0.73, 0.64); g.add(rHand);

  // Wrist bands
  [-1, 1].forEach(s => {
    const wb = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.01, 6, 24), mAccC.clone());
    if (s < 0) { wb.position.set(-0.555, 0.41, 0.06); wb.rotation.set(-0.06, 0, 0.2); }
    else       { wb.position.set(0.46, 0.515, 0.56);  wb.rotation.set(-0.52, 0, -0.28); }
    g.add(wb);
  });

  // HIPS + HIP RING
  const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.26, 0.3, 20), mOutfit);
  hips.position.y = 0.575; g.add(hips);
  const hipR = new THREE.Mesh(new THREE.TorusGeometry(0.272, 0.01, 6, 48), mAccP.clone());
  hipR.position.y = 0.66; g.add(hipR);

  // LEGS
  [-1, 1].forEach(s => {
    const th = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.09, 0.43, 12), mOutfit);
    th.position.set(s*0.12, 0.24, 0); g.add(th);
    const kn = new THREE.Mesh(new THREE.SphereGeometry(0.094, 12, 12), mOutfitMid);
    kn.position.set(s*0.12, 0.0, 0); g.add(kn);
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.084, 0.074, 0.42, 12), mOutfit);
    sh.position.set(s*0.12, -0.235, 0); g.add(sh);
    const bt = new THREE.Mesh(new THREE.BoxGeometry(0.148, 0.115, 0.265), mBoots);
    bt.position.set(s*0.12, -0.48, 0.04); g.add(bt);
    const bs = new THREE.Mesh(new THREE.BoxGeometry(0.148, 0.013, 0.005), mAccP.clone());
    bs.position.set(s*0.12, -0.435, 0.183); g.add(bs);
  });

  return g;
}

/* ── Hologram panel ── */
function createHologram() {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.52, 0.01),
    mat(0x22D3EE, 0.15, 0.8, 0.82, 0x22D3EE, 0.45)
  );
  g.add(frame);
  [[-0.36, 0.24], [0.36, 0.24], [-0.36, -0.24], [0.36, -0.24]].forEach(([x, y]) => {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.055, 0.015), mat(0x22D3EE, 0.1, 0, 1, 0x22D3EE, 1.3));
    c.position.set(x, y, 0.005); g.add(c);
  });
  const barDefs = [
    { w:0.44, y:0.17,  col:0x818CF8 },
    { w:0.3,  y:0.09,  col:0x22D3EE },
    { w:0.52, y:0.01,  col:0x818CF8 },
    { w:0.22, y:-0.07, col:0x22D3EE },
    { w:0.4,  y:-0.15, col:0x818CF8 }
  ];
  barDefs.forEach(d => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(d.w, 0.024, 0.015), mat(d.col, 0.1, 0, 1, d.col, 0.88));
    b.position.set(-0.38 + d.w/2, d.y, 0.005); g.add(b);
  });
  const scanLine = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.006, 0.016), mat(0x22D3EE, 0.1, 0, 1, 0x22D3EE, 1.1));
  scanLine.position.set(0, 0.2, 0.005); g.add(scanLine);
  g.userData.scanLine = scanLine;
  return g;
}

/* ── Orbit elements ── */
function createOrbitElements() {
  const g    = new THREE.Group();
  const defs = [
    { col:0x818CF8, size:0.058, r:1.55, spd:0.42, ang:0,    yo:0.2,  tilt:0   },
    { col:0x22D3EE, size:0.044, r:1.75, spd:0.65, ang:1.26, yo:-0.1, tilt:0.4 },
    { col:0xF472B6, size:0.05,  r:1.62, spd:0.38, ang:2.51, yo:0.4,  tilt:0.8 },
    { col:0x34D399, size:0.038, r:1.82, spd:0.55, ang:3.77, yo:-0.3, tilt:1.2 },
    { col:0xFBBF24, size:0.046, r:1.68, spd:0.48, ang:5.03, yo:0.1,  tilt:1.6 }
  ];
  const items = [];
  defs.forEach(d => {
    const orb = new THREE.Mesh(new THREE.SphereGeometry(d.size, 12, 12), mat(d.col, 0.15, 0.3, 1, d.col, 1.0));
    g.add(orb);
    items.push({ mesh:orb, ...d });
  });
  g.userData.items = items;
  return g;
}

// BUILD SCENE
const platform = createPlatform();
platform.position.set(0, -1.1, 0);
charScene.add(platform);

const girl = createGirl();
girl.position.set(0, -1.1, 0);
charScene.add(girl);

const hologram = createHologram();
hologram.position.set(0.7, 0.85, 1.2);
hologram.rotation.y = -0.22;
charScene.add(hologram);

const orbitGroup = createOrbitElements();
orbitGroup.position.set(0, 0.2, 0);
charScene.add(orbitGroup);

/* ════════════════════════════════════════
   ANIMATION LOOPS
   ════════════════════════════════════════ */
let bgTime = 0, charTime = 0;
let mouseX = 0, mouseY = 0;

document.addEventListener('mousemove', e => {
  mouseX = (e.clientX / window.innerWidth  - 0.5) * 0.36;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 0.36;
});

function animateBg() {
  requestAnimationFrame(animateBg);
  if (reduceMotion) { bgRenderer.render(bgScene, bgCamera); return; }
  bgTime += 0.004;

  bgParticles.rotation.y = bgTime * 0.025;
  bgParticles.rotation.x = bgTime * 0.012;

  bgCamera.position.x += (mouseX - bgCamera.position.x) * 0.032;
  bgCamera.position.y += (-mouseY - bgCamera.position.y) * 0.032;
  bgCamera.lookAt(bgScene.position);

  gears.forEach(gear => {
    gear.rotation.z += gear.userData.speed * gear.userData.dir;
    gear.position.y = gear.userData.baseY + Math.sin(bgTime * 0.5 + gear.userData.floatS) * 0.18;
  });

  brackets.forEach(b => {
    b.rotation.z += b.userData.rotSpd;
    b.position.y = b.userData.baseY + Math.sin(bgTime * b.userData.floatSp + b.userData.floatS) * 0.14;
  });

  bgRenderer.render(bgScene, bgCamera);
}
animateBg();

let charTime2 = 0;
function animateChar() {
  requestAnimationFrame(animateChar);
  charTime2 += 0.012;
  if (!reduceMotion) {
    girl.position.y = -1.1 + Math.sin(charTime2 * 0.65) * 0.022;
    girl.rotation.y = Math.sin(charTime2 * 0.38) * 0.05;
    if (girl.userData.eyeMats) {
      const ei = 0.75 + Math.sin(charTime2 * 2.4) * 0.3;
      girl.userData.eyeMats.forEach(m => m.emissiveIntensity = ei);
    }
    hologram.position.y = 0.85 + Math.sin(charTime2 * 0.9) * 0.04;
    if (hologram.userData.scanLine) {
      const sl = hologram.userData.scanLine;
      sl.position.y = 0.2 - ((charTime2 * 0.35) % 1) * 0.44;
    }
    const { items } = orbitGroup.userData;
    if (items) items.forEach(o => {
      o.ang += o.spd * 0.016;
      o.mesh.position.set(
        Math.cos(o.ang) * o.r,
        o.yo + Math.sin(o.tilt + o.ang * 0.4) * 0.2,
        Math.sin(o.ang) * o.r
      );
    });
    groundL.intensity = 0.4 + Math.sin(charTime2 * 1.5) * 0.18;
    rimL.intensity    = 1.0 + Math.sin(charTime2 * 0.7) * 0.2;
  }
  charRenderer.render(charScene, charCamera);
}
animateChar();

/* ════════════════════════════════════════
   VOICE GREETING
   ════════════════════════════════════════ */
function speakGreeting() {
  if (!window.speechSynthesis) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(
    "Hi! I'm Sejal. I work as an Automation Engineer and I also build apps. Welcome to my portfolio!"
  );
  u.rate = 0.88; u.pitch = 1.1; u.volume = 0.85;
  const btn = document.getElementById('voiceReplayBtn');
  const trySpeak = () => {
    const vs   = speechSynthesis.getVoices();
    const pick = vs.find(v => v.lang.startsWith('en') && ['Samantha','Victoria','Karen','Moira','Zira'].some(n => v.name.includes(n)))
               || vs.find(v => v.lang === 'en-US')
               || vs[0];
    if (pick) u.voice = pick;
    if (btn) btn.classList.add('speaking');
    u.onend = () => { if (btn) btn.classList.remove('speaking'); };
    speechSynthesis.speak(u);
  };
  if (speechSynthesis.getVoices().length) trySpeak();
  else speechSynthesis.onvoiceschanged = trySpeak;
}

window.addEventListener('load', () => setTimeout(speakGreeting, 1800));
document.getElementById('voiceReplayBtn')?.addEventListener('click', speakGreeting);
document.getElementById('voiceBtn')?.addEventListener('click', speakGreeting);

/* ════════════════════════════════════════
   CUSTOM CURSOR
   ════════════════════════════════════════ */
if (!isMobile && window.matchMedia('(pointer:fine)').matches) {
  const dot  = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  });

  (function lerpRing() {
    rx += (mx - rx) * 0.13;
    ry += (my - ry) * 0.13;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(lerpRing);
  })();

  document.querySelectorAll('a,button,.project-card,.filter-btn,.about-card,.cert-badge,.timeline-card').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('big'));
    el.addEventListener('mouseleave', () => ring.classList.remove('big'));
  });
} else {
  document.getElementById('cursorDot').style.display  = 'none';
  document.getElementById('cursorRing').style.display = 'none';
}

/* ════════════════════════════════════════
   TYPING ANIMATION
   ════════════════════════════════════════ */
const phrases = [
  'Automation & Programming Specialist',
  'Full-Stack Developer',
  'Lab Robotics Engineer',
  'Hamilton VENUS Expert',
  'iOS App Developer',
  'UI/UX Designer'
];
let pIdx = 0, cIdx = 0, deleting = false;
function typeLoop() {
  const el = document.getElementById('typingText');
  if (!el) return;
  const phrase = phrases[pIdx];
  if (!deleting) {
    el.textContent = phrase.slice(0, ++cIdx);
    if (cIdx === phrase.length) { deleting = true; setTimeout(typeLoop, 2000); return; }
  } else {
    el.textContent = phrase.slice(0, --cIdx);
    if (cIdx === 0) { deleting = false; pIdx = (pIdx + 1) % phrases.length; }
  }
  setTimeout(typeLoop, deleting ? 55 : 85);
}
typeLoop();

/* ════════════════════════════════════════
   THEME TOGGLE
   ════════════════════════════════════════ */
const themeToggle = document.getElementById('themeToggle');
const html        = document.documentElement;
const saved       = localStorage.getItem('portfolio-theme') || 'dark';
html.setAttribute('data-theme', saved);

themeToggle.addEventListener('click', () => {
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('portfolio-theme', next);
  pMat.color.set(next === 'dark' ? 0x818CF8 : 0x6366F1);
  pMat.opacity = next === 'dark' ? 0.22 : 0.12;
});

/* ════════════════════════════════════════
   REVEAL OBSERVER (per-page)
   ════════════════════════════════════════ */
function initPageReveals(pageEl) {
  const obs = new IntersectionObserver(
    entries => entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 70);
        obs.unobserve(e.target);
      }
    }),
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );
  pageEl.querySelectorAll('.reveal:not(.visible)').forEach(el => obs.observe(el));
}
// Init home page reveals on load
setTimeout(() => initPageReveals(document.getElementById('page-home')), 100);

/* ════════════════════════════════════════
   ANIMATED COUNTERS
   ════════════════════════════════════════ */
let countersDone = false;
function triggerCounters() {
  if (countersDone) return;
  countersDone = true;
  document.querySelectorAll('#page-home .stat-number').forEach(el => {
    const target = parseInt(el.dataset.target), t0 = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - t0) / 1400, 1);
      el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
setTimeout(triggerCounters, 300);

/* ════════════════════════════════════════
   SKILL BARS TRIGGER
   ════════════════════════════════════════ */
let skillsDone = false;
function triggerSkillBars() {
  if (skillsDone) return;
  skillsDone = true;
  document.querySelectorAll('#page-skills .skill-bar-fill').forEach(b => {
    b.style.width = b.dataset.width + '%';
  });
}

/* ════════════════════════════════════════
   VISUAL RESUME BARS TRIGGER
   ════════════════════════════════════════ */
let vrDone = false;
function triggerVrBars() {
  if (vrDone) return;
  vrDone = true;
  document.querySelectorAll('.vr-bar-fill').forEach(b => {
    b.style.width = (b.dataset.w || 0) + '%';
  });
}

/* ════════════════════════════════════════
   PROJECT FILTER
   ════════════════════════════════════════ */
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    document.querySelectorAll('.project-card').forEach(card => {
      const cats = card.dataset.category || '';
      const show = filter === 'all' || cats.split(' ').includes(filter);
      card.style.display = show ? '' : 'none';
      if (show) {
        card.style.opacity   = '0';
        card.style.transform = 'translateY(16px)';
        setTimeout(() => {
          card.style.opacity   = '1';
          card.style.transform = 'translateY(0)';
          card.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
        }, 10);
      }
    });
  });
});

/* ════════════════════════════════════════
   PROJECT CARD TILT
   ════════════════════════════════════════ */
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    if (reduceMotion) return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left)  / r.width  - 0.5;
    const y = (e.clientY - r.top)   / r.height - 0.5;
    card.style.transform = `translateY(-6px) rotateX(${-y*6}deg) rotateY(${x*6}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform  = '';
    card.style.transition = 'transform 0.5s ease';
  });
  card.addEventListener('mouseenter', () => {
    card.style.transition = 'transform 0.1s ease';
  });
});

/* ════════════════════════════════════════
   NAV — mobile menu + scroll shadow
   ════════════════════════════════════════ */
const navMenu    = document.getElementById('navMenu');
const mobileMenu = document.getElementById('mobileMenu');

navMenu.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
  navMenu.textContent = mobileMenu.classList.contains('open') ? '✕' : '☰';
});

window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

/* ════════════════════════════════════════
   CONTACT FORM
   ════════════════════════════════════════ */
const form  = document.getElementById('contactForm');
const toast = document.getElementById('toast');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.textContent = 'Sending…'; btn.disabled = true;
    setTimeout(() => {
      btn.textContent = 'Send Message ✉️'; btn.disabled = false; form.reset();
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3500);
    }, 1200);
  });
}

/* ════════════════════════════════════════
   WINDOW RESIZE
   ════════════════════════════════════════ */
window.addEventListener('resize', () => {
  bgCamera.aspect = window.innerWidth / window.innerHeight;
  bgCamera.updateProjectionMatrix();
  bgRenderer.setSize(window.innerWidth, window.innerHeight);
  resizeCharCanvas();
});
�════ */
const nav      = document.getElementById('nav');
const navLinks = document.querySelectorAll('.nav-link');
const navMenu  = document.getElementById('navMenu');
const mobileMenu = document.getElementById('mobileMenu');
const sections = document.querySelectorAll('.section');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
  let current = '';
  sections.forEach(s => { if (window.scrollY >= s.offsetTop - 120) current = s.getAttribute('id'); });
  navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${current}`));
}, { passive: true });

navMenu.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
  navMenu.textContent = mobileMenu.classList.contains('open') ? '✕' : '☰';
});
document.querySelectorAll('.mobile-link').forEach(l => {
  l.addEventListener('click', () => { mobileMenu.classList.remove('open'); navMenu.textContent = '☰'; });
});

/* ════════════════════════════════════════
   PROJECT FILTER
   ════════════════════════════════════════ */
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    document.querySelectorAll('.project-card').forEach(card => {
      const cats = card.dataset.category || '';
      const show = filter === 'all' || cats.split(' ').includes(filter);
      card.style.display = show ? '' : 'none';
      if (show) {
        card.style.opacity = '0';
        card.style.transform = 'translateY(16px)';
        setTimeout(() => { card.style.opacity='1'; card.style.transform='translateY(0)'; card.style.transition='opacity 0.35s ease,transform 0.35s ease'; }, 10);
      }
    });
  });
});

/* ════════════════════════════════════════
   SCROLL REVEAL
   ════════════════════════════════════════ */
const revealObs = new IntersectionObserver(
  entries => entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 70);
      revealObs.unobserve(entry.target);
    }
  }),
  { threshold: 0.1, rootMargin: '0px 0px -55px 0px' }
);
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

/* ════════════════════════════════════════
   ANIMATED COUNTERS
   ════════════════════════════════════════ */
const ctrObs = new IntersectionObserver(
  entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target, target = parseInt(el.dataset.target), t0 = Date.now();
      const tick = () => {
        const p = Math.min((Date.now()-t0)/1500, 1);
        el.textContent = Math.round((1-Math.pow(1-p,3))*target);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      ctrObs.unobserve(el);
    }
  }),
  { threshold:0.5 }
);
document.querySelectorAll('.stat-number').forEach(el => ctrObs.observe(el));

/* ════════════════════════════════════════
   SKILL BARS
   ════════════════════════════════════════ */
const barObs = new IntersectionObserver(
  entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.width = `${entry.target.dataset.width}%`;
      barObs.unobserve(entry.target);
    }
  }),
  { threshold:0.3 }
);
document.querySelectorAll('.skill-bar-fill').forEach(b => barObs.observe(b));

/* ════════════════════════════════════════
   PROJECT CARD TILT
   ════════════════════════════════════════ */
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    if (reduceMotion) return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX-r.left)/r.width-0.5;
    const y = (e.clientY-r.top)/r.height-0.5;
    card.style.transform = `translateY(-6px) rotateX(${-y*6}deg) rotateY(${x*6}deg)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform=''; card.style.transition='transform 0.5s ease'; });
  card.addEventListener('mouseenter', () => { card.style.transition='transform 0.1s ease'; });
});

/* ════════════════════════════════════════
   CONTACT FORM
   ════════════════════════════════════════ */
const form  = document.getElementById('contactForm');
const toast = document.getElementById('toast');
form.addEventListener('submit', e => {
  e.preventDefault();
  const btn = form.querySelector('button[type="submit"]');
  btn.textContent = 'Sending…'; btn.disabled = true;
  setTimeout(() => {
    btn.textContent='Send Message ✉️'; btn.disabled=false; form.reset();
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
  }, 1200);
});

/* ════════════════════════════════════════
   SMOOTH SCROLL
   ════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function(e) {
    const t = document.querySelector(this.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior:'smooth' }); }
  });
});
