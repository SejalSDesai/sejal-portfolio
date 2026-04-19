/* ════════════════════════════════════════
   PERFORMANCE & ACCESSIBILITY FLAGS
   ════════════════════════════════════════ */
const isMobile       = window.innerWidth < 768;
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let reduceMotion     = prefersReduced;

document.getElementById('reduceMotionBtn').addEventListener('click', () => {
  reduceMotion = !reduceMotion;
  document.getElementById('reduceMotionBtn').style.opacity = reduceMotion ? '0.45' : '1';
});

/* ════════════════════════════════════════
   BACKGROUND CANVAS — sage particles,
   gears, code brackets, circuit lines
   ════════════════════════════════════════ */
const bgCanvas   = document.getElementById('bg-canvas');
const bgRenderer = new THREE.WebGLRenderer({ canvas: bgCanvas, antialias: !isMobile, alpha: true });
bgRenderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));
bgRenderer.setSize(window.innerWidth, window.innerHeight);

const bgScene  = new THREE.Scene();
const bgCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
bgCamera.position.set(0, 0, 5);

// — Sage particle field —
const pCount = isMobile ? 350 : 750;
const pPos   = new Float32Array(pCount * 3);
for (let i = 0; i < pCount; i++) {
  pPos[i*3]   = (Math.random() - 0.5) * 22;
  pPos[i*3+1] = (Math.random() - 0.5) * 22;
  pPos[i*3+2] = (Math.random() - 0.5) * 14;
}
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const pMat     = new THREE.PointsMaterial({ size: 0.02, color: 0xB2C2A3, transparent: true, opacity: 0.38 });
const bgParticles = new THREE.Points(pGeo, pMat);
bgScene.add(bgParticles);

// — Instanced gears (performance: one draw call) —
function makeGearGeo() {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.045, 6, 14), null);
  g.add(ring);
  const teeth = 8;
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.045), null);
    t.position.set(Math.cos(a) * 0.27, Math.sin(a) * 0.27, 0);
    t.rotation.z = a;
    g.add(t);
  }
  // Centre hole
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.07, 12), null);
  g.add(hole);
  return g;
}

const gearMat   = new THREE.MeshStandardMaterial({ color: 0x7A8A6E, roughness: 0.5, metalness: 0.45, transparent: true, opacity: 0.55 });
const gearCount = isMobile ? 6 : 14;
const gears     = [];
for (let i = 0; i < gearCount; i++) {
  const size = 0.55 + Math.random() * 0.9;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22 * size, 0.04 * size, 6, 14), gearMat);
  const gGroup = new THREE.Group();
  gGroup.add(ring);
  for (let t = 0; t < 8; t++) {
    const a = (t / 8) * Math.PI * 2;
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

// — Code bracket shapes ({ } < >) —
const bracketMat = new THREE.MeshStandardMaterial({ color: 0xB2C2A3, transparent: true, opacity: 0.28 });
function makeBracket(type = 'curly') {
  const g = new THREE.Group();
  if (type === 'curly') {
    // { shape from boxes
    const vert  = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.04), bracketMat);
    g.add(vert);
    [[0, 0.13],[0, -0.13]].forEach(([,y]) => {
      const h = new THREE.Mesh(new THREE.BoxGeometry( 0.1, 0.04, 0.04), bracketMat);
      h.position.set(0.04, y, 0);
      g.add(h);
    });
    const nub = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), bracketMat);
    nub.position.set(-0.04, 0, 0);
    g.add(nub);
  } else {
    // < shape
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
const brackets = [];
const types = ['curly', 'angle'];
for (let i = 0; i < bracketCount; i++) {
  const b = makeBracket(types[i % 2]);
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

// — Ambient light for bg —
bgScene.add(new THREE.AmbientLight(0xB2C2A3, 0.6));
const bgPoint = new THREE.PointLight(0xB2C2A3, 0.8, 20);
bgPoint.position.set(3, 3, 3);
bgScene.add(bgPoint);

/* ════════════════════════════════════════
   CHARACTER CANVAS — sage palette
   cute Wall-E style robot + girl
   ════════════════════════════════════════ */
const charCanvas   = document.getElementById('character-canvas');
const charRenderer = new THREE.WebGLRenderer({ canvas: charCanvas, antialias: true, alpha: true });
charRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const charScene  = new THREE.Scene();
const charCamera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
charCamera.position.set(0, 0.5, 6.2);
charCamera.lookAt(0, 0.2, 0);

function resizeCharCanvas() {
  const el = charCanvas.parentElement;
  if (!el) return;
  const w = el.clientWidth || 500, h = el.clientHeight || 520;
  charRenderer.setSize(w, h);
  charCamera.aspect = w / h;
  charCamera.updateProjectionMatrix();
}
resizeCharCanvas();

// Lighting
charScene.add(new THREE.AmbientLight(0xC8D8B8, 0.55));
const keyLight  = new THREE.DirectionalLight(0xF5EEE0, 1.3);
keyLight.position.set(-2.5, 4, 3);
charScene.add(keyLight);
const fillLight = new THREE.PointLight(0x8FA583, 1.0, 14);
fillLight.position.set(3.5, 2, 2);
charScene.add(fillLight);
const rimLight  = new THREE.PointLight(0x7A8A6E, 0.7, 10);
rimLight.position.set(-1, 3, -4);
charScene.add(rimLight);
const groundGlow = new THREE.PointLight(0xB2C2A3, 0.5, 7);
groundGlow.position.set(0, -2, 0);
charScene.add(groundGlow);
const holoLight = new THREE.PointLight(0x88C0A0, 0.85, 5);
holoLight.position.set(0.5, 0.8, 2);
charScene.add(holoLight);

/* — Sage material helpers — */
const mat = (col, rough=0.5, metal=0, op=1, em=null, ei=0) => {
  const m = new THREE.MeshStandardMaterial({ color: col, roughness: rough, metalness: metal });
  if (op < 1) { m.transparent = true; m.opacity = op; }
  if (em) { m.emissive = new THREE.Color(em); m.emissiveIntensity = ei; }
  return m;
};

/* ——————————————————————————————
   PLATFORM (sage hexagonal)
—————————————————————————————— */
function createPlatform() {
  const g = new THREE.Group();
  g.add(Object.assign(new THREE.Mesh(
    new THREE.CylinderGeometry(2.5, 2.5, 0.05, 6),
    mat(0x1A2218, 0.18, 0.92, 0.88)
  ), {}));

  // Outer ring glow
  const outerR = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.04, 8, 80), mat(0xB2C2A3, 0.3, 0.4, 1, 0xB2C2A3, 0.6));
  outerR.rotation.x = Math.PI / 2; outerR.position.y = 0.03;
  g.add(outerR);

  const innerR = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.025, 8, 60), mat(0x8FA583, 0.3, 0.4, 0.7, 0x8FA583, 0.4));
  innerR.rotation.x = Math.PI / 2; innerR.position.y = 0.03;
  g.add(innerR);

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.01, 2.5), mat(0xB2C2A3, 0.4, 0.2, 0.25, 0xB2C2A3, 0.15));
    spoke.rotation.y = a; spoke.position.y = 0.03;
    g.add(spoke);
  }
  return g;
}

/* ——————————————————————————————
   CUTE ROBOT (Wall-E meets Roomba)
   sage-painted, round, big eyes
—————————————————————————————— */
function createCuteRobot() {
  const g = new THREE.Group();

  const sageMat   = mat(0xB2C2A3, 0.35, 0.55);
  const deepSage  = mat(0x7A8A6E, 0.32, 0.62);
  const darkMat   = mat(0x1E2A1E, 0.18, 0.9);
  const eyeGlow   = mat(0x88EEC0, 0.08, 0, 1, 0x44CC88, 0.9);
  const greenGlow = mat(0x88EEB8, 0.1, 0, 1, 0x44DD88, 0.65);
  const pinkGlow  = mat(0xFFAACC, 0.1, 0, 1, 0xFF66AA, 0.95);

  // BODY (rounded-look box)
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.62, 0.5), sageMat);
  body.position.y = 0.12;
  g.add(body);

  // Body corner spheres (give rounded appearance)
  [[-0.34, 0.42, 0.23],[0.34, 0.42, 0.23],[-0.34,-0.18, 0.23],[0.34,-0.18, 0.23]].forEach(([x,y,z]) => {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), sageMat);
    s.position.set(x, y, z);
    g.add(s);
  });

  // Chest panel
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.38, 0.02), darkMat);
  panel.position.set(0, 0.14, 0.268);
  g.add(panel);
  [-0.1, 0, 0.1].forEach(y => {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.014), greenGlow);
    line.position.set(0, y + 0.14, 0.282);
    g.add(line);
  });

  // NECK
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.11, 12), deepSage);
  neck.position.y = 0.48;
  g.add(neck);

  // HEAD (big and round — Wall-E style box with dome)
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.42, 0.6), sageMat);
  head.position.y = 0.86;
  g.add(head);

  // Head dome top
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.37, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    sageMat
  );
  dome.position.y = 1.07;
  g.add(dome);

  // Head side panels (ears)
  [-1, 1].forEach(s => {
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.26, 0.28), deepSage);
    ear.position.set(s * 0.4, 0.86, 0);
    g.add(ear);
    const earDot = new THREE.Mesh(new THREE.CircleGeometry(0.04, 12), mat(0x88EEC0, 0.1, 0, 1, 0x44CC88, 0.42));
    earDot.position.set(s * 0.435, 0.86, 0.01);
    earDot.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2;
    g.add(earDot);
  });

  // EYES — big binocular cylinders (Wall-E!)
  const eyeMats = [];
  [-0.18, 0.18].forEach(x => {
    // Eye housing cylinder
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.22, 20), deepSage);
    housing.position.set(x, 0.88, 0.27);
    housing.rotation.x = Math.PI / 2;
    g.add(housing);

    // Eye housing rim
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.016, 8, 24), mat(0xD4DCC5, 0.3, 0.6));
    rim.position.set(x, 0.88, 0.385);
    g.add(rim);

    // Eye glass (glowing)
    const eM = eyeGlow.clone();
    eyeMats.push(eM);
    const eyeGl = new THREE.Mesh(new THREE.CircleGeometry(0.12, 24), eM);
    eyeGl.position.set(x, 0.88, 0.392);
    g.add(eyeGl);

    // Pupil
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.058, 16), mat(0x1E2A1E));
    pupil.position.set(x, 0.88, 0.398);
    g.add(pupil);

    // Eye shine
    const shine = new THREE.Mesh(new THREE.CircleGeometry(0.022, 8), mat(0xFFFFFF, 0.1, 0, 1, 0xFFFFFF, 1));
    shine.position.set(x + 0.035, 0.905, 0.402);
    g.add(shine);
  });
  g.userData.eyeMats = eyeMats;

  // Eye bridge
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 0.12), deepSage);
  bridge.position.set(0, 0.88, 0.31);
  g.add(bridge);

  // MOUTH (speaker grille)
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.035, 0.018), darkMat);
  mouth.position.set(0, 0.72, 0.31);
  g.add(mouth);
  [-0.07, 0, 0.07].forEach(x => {
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.013, 8), greenGlow);
    dot.position.set(x, 0.72, 0.322);
    g.add(dot);
  });

  // ANTENNA (with glowing pink tip)
  const antBase = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.06, 8), deepSage);
  antBase.position.set(-0.16, 1.22, 0);
  g.add(antBase);
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.3, 8), deepSage);
  ant.position.set(-0.16, 1.41, 0);
  g.add(ant);
  const antTip = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 12), pinkGlow);
  antTip.position.set(-0.16, 1.575, 0);
  g.add(antTip);
  g.userData.antTipMat = pinkGlow;

  // SHOULDERS + ARMS
  [-1, 1].forEach(s => {
    const shldr = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), deepSage);
    shldr.position.set(s * 0.44, 0.3, 0);
    shldr.scale.set(1, 0.88, 0.88);
    g.add(shldr);

    const ua = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.072, 0.38, 10), sageMat);
    ua.position.set(s * 0.5, 0.04, 0);
    ua.rotation.z = s * 0.14;
    g.add(ua);

    const jt = new THREE.Mesh(new THREE.SphereGeometry(0.076, 10, 10), deepSage);
    jt.position.set(s * 0.53, -0.18, 0);
    g.add(jt);

    const la = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.06, 0.36, 10), sageMat);
    la.position.set(s * 0.55, -0.4, 0);
    la.rotation.set(0.08, 0, s * 0.1);
    g.add(la);

    // Claw hand
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 10), deepSage);
    hand.position.set(s * 0.55, -0.6, 0);
    hand.scale.set(1, 0.82, 0.82);
    g.add(hand);

    // Claw fingers
    for (let j = 0; j < 3; j++) {
      const a = (j / 3) * Math.PI - Math.PI / 2;
      const f = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.018, 0.1, 6), sageMat);
      f.position.set(s * 0.55 + Math.cos(a) * 0.08, -0.71 + Math.sin(a) * 0.055, 0);
      f.rotation.z = a + (s > 0 ? 0 : Math.PI);
      g.add(f);
    }
  });

  // WAIST
  const waist = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.24, 0.1, 16), deepSage);
  waist.position.y = -0.24;
  g.add(waist);

  // LEGS (stubby, cute)
  [-1, 1].forEach(s => {
    const hip = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), deepSage);
    hip.position.set(s * 0.15, -0.35, 0);
    g.add(hip);

    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.086, 0.36, 10), sageMat);
    leg.position.set(s * 0.15, -0.56, 0);
    g.add(leg);

    const knee = new THREE.Mesh(new THREE.SphereGeometry(0.092, 10, 10), deepSage);
    knee.position.set(s * 0.15, -0.76, 0);
    g.add(knee);

    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.075, 0.3, 10), sageMat);
    shin.position.set(s * 0.15, -0.93, 0);
    g.add(shin);

    // Round cute foot (sphere-scaled)
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 10), deepSage);
    foot.position.set(s * 0.15, -1.1, 0.04);
    foot.scale.set(1.25, 0.65, 1.5);
    g.add(foot);

    // Foot stripe accent
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.016, 0.015), mat(0xB2C2A3, 0.3, 0.4, 1, 0xB2C2A3, 0.3));
    stripe.position.set(s * 0.15, -1.07, 0.18);
    g.add(stripe);
  });

  return g;
}

/* ——————————————————————————————
   GIRL CHARACTER (sage lab coat)
—————————————————————————————— */
function createGirl() {
  const g = new THREE.Group();

  const skin   = mat(0xD4A574, 0.85);
  const hair   = mat(0x160F0A, 0.95);
  const coat   = mat(0xECEAF5, 0.62);  // slight sage tint
  const shirt  = mat(0x8FA583, 0.75);  // sage shirt instead of purple
  const pants  = mat(0x2B342C, 0.82);  // dark sage pants
  const frames = mat(0x282838, 0.3, 0.7);
  const shoes  = mat(0x14201A, 0.35, 0.45);
  const eyeW   = mat(0xFFF8F5);
  const eyeD   = mat(0x100A06);
  const lipM   = mat(0xB87070, 0.8);
  const tieMat = mat(0x8FA583, 0.6);   // sage hair tie
  const btnMat = mat(0xB2C2A3, 0.4, 0.5);
  const penMat = mat(0x7A8A6E, 0.2, 0.82);
  const scrM   = mat(0x88C8A8, 0.1, 0, 0.92, 0x44AA77, 0.55); // sage screen
  const shineM = mat(0xFFFFFF, 0.1, 0, 1, 0xFFFFFF, 1);

  // HEAD
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.31, 32, 32), skin);
  head.position.y = 1.72; head.scale.set(0.96, 1.06, 0.94);
  g.add(head);

  const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.335, 32, 32), hair);
  hairBack.position.y = 1.74; hairBack.scale.set(0.98, 1.01, 0.9);
  g.add(hairBack);

  const hairTop = new THREE.Mesh(new THREE.SphereGeometry(0.332, 32, 16, 0, Math.PI*2, 0, Math.PI*0.52), hair);
  hairTop.position.y = 1.72;
  g.add(hairTop);

  const bangs = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.1, 0.16), hair);
  bangs.position.set(0, 1.925, 0.225); bangs.rotation.x = 0.2;
  g.add(bangs);

  [-1,1].forEach(s => {
    const sh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.1), hair);
    sh.position.set(s*0.305, 1.64, 0.18);
    g.add(sh);
  });

  const ptyBase = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), hair);
  ptyBase.position.set(0, 1.7, -0.315);
  g.add(ptyBase);
  const pty = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.04, 0.52, 10), hair);
  pty.position.set(0, 1.44, -0.41); pty.rotation.x = 0.4;
  g.add(pty);
  const ptyTip = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), hair);
  ptyTip.position.set(0, 1.17, -0.59);
  g.add(ptyTip);
  const tie = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.022, 8, 20), tieMat);
  tie.position.set(0, 1.59, -0.355); tie.rotation.x = 0.4;
  g.add(tie);

  // FACE
  [-0.112, 0.112].forEach(x => {
    const eW = new THREE.Mesh(new THREE.SphereGeometry(0.058, 16, 16), eyeW);
    eW.position.set(x, 1.7, 0.268); eW.scale.set(1, 0.88, 0.72);
    g.add(eW);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.033, 12, 12), mat(0x3A2618));
    iris.position.set(x, 1.7, 0.315);
    g.add(iris);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.017, 10, 10), eyeD);
    pupil.position.set(x, 1.7, 0.342);
    g.add(pupil);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.007, 6, 6), shineM);
    shine.position.set(x+0.013, 1.714, 0.348);
    g.add(shine);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.096, 0.017, 0.012), hair);
    brow.position.set(x, 1.782, 0.288); brow.rotation.z = x > 0 ? -0.08 : 0.08;
    g.add(brow);
  });

  // Glasses
  [-0.112, 0.112].forEach(x => {
    const fr = new THREE.Mesh(new THREE.TorusGeometry(0.082, 0.012, 8, 24), frames);
    fr.position.set(x, 1.7, 0.288);
    g.add(fr);
  });
  const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.006,0.006,0.066,6), frames);
  bridge.position.set(0, 1.71, 0.298); bridge.rotation.z = Math.PI/2;
  g.add(bridge);
  [-1,1].forEach(s => {
    const tmpl = new THREE.Mesh(new THREE.CylinderGeometry(0.005,0.005,0.2,6), frames);
    tmpl.position.set(s*0.278, 1.7, 0.19); tmpl.rotation.z = Math.PI/2;
    g.add(tmpl);
  });

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.02,8,8), skin);
  nose.position.set(0, 1.654, 0.32); nose.scale.set(1, 0.7, 0.8);
  g.add(nose);

  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.058,0.009,8,12,Math.PI*0.72), lipM);
  smile.position.set(0, 1.612, 0.31); smile.rotation.set(0,0,Math.PI+0.22);
  g.add(smile);

  [-1,1].forEach(s => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.038,10,10), skin);
    ear.position.set(s*0.312, 1.67, 0); ear.scale.set(0.55, 0.85, 0.5);
    g.add(ear);
  });

  // NECK + TORSO
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.106,0.21,16), skin);
  neck.position.y = 1.44;
  g.add(neck);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.295,0.72,20), coat);
  torso.position.y = 0.9;
  g.add(torso);

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.132,0.158,0.17,16), shirt);
  collar.position.y = 1.225;
  g.add(collar);

  [-1,1].forEach(s => {
    const lap = new THREE.Mesh(new THREE.BoxGeometry(0.095,0.41,0.055), coat);
    lap.position.set(s*0.088, 1.065, 0.238); lap.rotation.z = s*0.17;
    g.add(lap);
  });

  [1.08,0.92,0.76].forEach(y => {
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.016,0.016,0.018,8), btnMat);
    btn.position.set(0, y, 0.288); btn.rotation.x = Math.PI/2;
    g.add(btn);
  });

  const pkt = new THREE.Mesh(new THREE.BoxGeometry(0.12,0.09,0.014), coat);
  pkt.position.set(0.19, 0.9, 0.292);
  g.add(pkt);
  const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.009,0.009,0.11,6), penMat);
  pen.position.set(0.185, 0.96, 0.306);
  g.add(pen);

  // ARMS
  const lUA = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.074,0.41,12), coat);
  lUA.position.set(-0.358, 0.9, 0); lUA.rotation.z = 0.22;
  g.add(lUA);
  const lLA = new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.064,0.37,12), coat);
  lLA.position.set(-0.462, 0.638, 0.032); lLA.rotation.set(0.08,0,0.28);
  g.add(lLA);
  const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.066,12,12), skin);
  lHand.position.set(-0.478, 0.435, 0.07); lHand.scale.set(0.88,0.74,0.62);
  g.add(lHand);

  const rUA = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.074,0.41,12), coat);
  rUA.position.set(0.358, 0.92, 0.06); rUA.rotation.set(0.28,0,-0.32);
  g.add(rUA);
  const rLA = new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.064,0.37,12), coat);
  rLA.position.set(0.48, 0.695, 0.225); rLA.rotation.set(-0.55,0,-0.38);
  g.add(rLA);
  const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.066,12,12), skin);
  rHand.position.set(0.5, 0.498, 0.385); rHand.scale.set(0.88,0.74,0.62);
  g.add(rHand);

  // Tablet (sage-tinted screen)
  const tabBody = new THREE.Mesh(new THREE.BoxGeometry(0.21,0.285,0.018), mat(0x181825,0.14,0.88));
  tabBody.position.set(0.5,0.438,0.525); tabBody.rotation.set(-0.24,0.14,-0.08);
  g.add(tabBody);
  const tabScreen = new THREE.Mesh(new THREE.BoxGeometry(0.18,0.244,0.005), scrM);
  tabScreen.position.set(0.5,0.44,0.535); tabScreen.rotation.set(-0.24,0.14,-0.08);
  g.add(tabScreen);

  // HIPS + LEGS
  const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.272,0.252,0.37,18), shirt);
  hips.position.y = 0.368;
  g.add(hips);

  [-1,1].forEach(s => {
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.095,0.086,0.43,12), pants);
    thigh.position.set(s*0.115, -0.042, 0);
    g.add(thigh);
    const shin2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.07,0.41,12), pants);
    shin2.position.set(s*0.115, -0.495, 0);
    g.add(shin2);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.13,0.085,0.215), shoes);
    shoe.position.set(s*0.115, -0.735, 0.042);
    g.add(shoe);
  });

  return g;
}

/* ——————————————————————————————
   HOLOGRAM (sage-tinted atomic)
—————————————————————————————— */
function createHologram() {
  const g = new THREE.Group();

  const hm = (col, em, ei=0.6, op=0.65) => {
    const m = mat(col, 0.1, 0, op, em, ei);
    return m;
  };

  const ringDefs = [
    { r:0.46, tube:0.018, col:0x88C8A8, em:0x44AA77, ei:0.58 },
    { r:0.58, tube:0.013, col:0xB2C2A3, em:0x7A8A6E, ei:0.48, rx:Math.PI/3,ry:0,rz:Math.PI/6 },
    { r:0.68, tube:0.011, col:0xD4DCC5, em:0xB2C2A3, ei:0.38, rx:Math.PI/2,ry:Math.PI/4 },
  ];
  const holoRings = [];
  ringDefs.forEach(d => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(d.r,d.tube,8,52), hm(d.col,d.em,d.ei));
    if (d.rx) ring.rotation.x = d.rx;
    if (d.ry) ring.rotation.y = d.ry;
    if (d.rz) ring.rotation.z = d.rz;
    g.add(ring);
    holoRings.push(ring);
  });

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.08,16,16), hm(0xD4DCC5,0xB2C2A3,1.3,0.88));
  g.add(core);

  const electrons = [];
  for (let i = 0; i < 5; i++) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.035,10,10), hm(0xC8D8B8,0x8FA583,0.9,0.8));
    g.add(e);
    electrons.push({ mesh:e, angle:(i/5)*Math.PI*2, orbit:0.34+(i%2)*0.16, speed:0.72+i*0.18, tilt:i*0.42 });
  }

  for (let i = 0; i < 7; i++) {
    const a = (i/7)*Math.PI*2;
    const h = 0.18 + (i%3)*0.22;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.036,h,0.036), hm(0x8FA583,0x5A6B52,0.48,0.55));
    bar.position.set(Math.cos(a)*0.95, -1.08+h/2, Math.sin(a)*0.95);
    g.add(bar);
  }

  g.userData.holoRings = holoRings;
  g.userData.electrons = electrons;
  return g;
}

/* ——————————————————————————————
   FLOATING ORBS
—————————————————————————————— */
function createOrbs() {
  const g = new THREE.Group();
  const orbs = [];
  const cols = [0x8FA583, 0xB2C2A3, 0x7A8A6E, 0xD4DCC5];
  for (let i = 0; i < 20; i++) {
    const m = mat(cols[i%4], 0.3, 0.2, 0.62, cols[(i+1)%4], 0.42);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.022+Math.random()*0.016,8,8), m);
    orb.position.set((Math.random()-0.5)*4.5, (Math.random()-0.5)*2.8, (Math.random()-0.5)*2.2-0.8);
    g.add(orb);
    orbs.push({ mesh:orb, off:Math.random()*Math.PI*2, spd:0.45+Math.random()*0.5 });
  }
  g.userData.orbs = orbs;
  return g;
}

// BUILD SCENE
const platform = createPlatform();
platform.position.set(0, -1.08, 0);
charScene.add(platform);

const girl = createGirl();
girl.position.set(-0.65, -1.08, 0);
charScene.add(girl);

const robot = createCuteRobot();
robot.position.set(1.1, -1.08, 0.15);
robot.scale.setScalar(0.6);
robot.rotation.y = -0.28;
charScene.add(robot);

const hologram = createHologram();
hologram.position.set(0.15, 0.62, 1.05);
hologram.scale.setScalar(0.88);
charScene.add(hologram);

const orbGroup = createOrbs();
charScene.add(orbGroup);

/* ════════════════════════════════════════
   ANIMATION LOOPS
   ════════════════════════════════════════ */
let bgTime = 0, charTime = 0;
let mouseX = 0, mouseY = 0;
let scrollY = 0;

document.addEventListener('mousemove', e => {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 0.36;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 0.36;
});

window.addEventListener('scroll', () => {
  scrollY = window.scrollY;

  // Scroll-reactive robot: waves when user scrolls
  const sf = Math.min(scrollY / (window.innerHeight * 0.5), 1);
  robot.rotation.y = -0.28 + sf * 0.6;
  robot.rotation.z = Math.sin(sf * Math.PI) * 0.12;  // wave gesture
}, { passive: true });

window.addEventListener('resize', () => {
  bgCamera.aspect = window.innerWidth / window.innerHeight;
  bgCamera.updateProjectionMatrix();
  bgRenderer.setSize(window.innerWidth, window.innerHeight);
  resizeCharCanvas();
});

function animateBg() {
  requestAnimationFrame(animateBg);
  if (reduceMotion) { bgRenderer.render(bgScene, bgCamera); return; }
  bgTime += 0.004;

  bgParticles.rotation.y = bgTime * 0.025;
  bgParticles.rotation.x = bgTime * 0.012;

  // Parallax on scroll
  bgParticles.position.y = scrollY * 0.0006;

  bgCamera.position.x += (mouseX - bgCamera.position.x) * 0.032;
  bgCamera.position.y += (-mouseY - bgCamera.position.y) * 0.032;
  bgCamera.lookAt(bgScene.position);

  // Gears rotate + float
  gears.forEach((gear, i) => {
    gear.rotation.z += gear.userData.speed * gear.userData.dir;
    gear.position.y = gear.userData.baseY
      + Math.sin(bgTime * 0.5 + gear.userData.floatS) * 0.18
      + scrollY * (0.0003 * (i % 3 + 1));
  });

  // Brackets rotate + float
  brackets.forEach(b => {
    b.rotation.z += b.userData.rotSpd;
    b.position.y = b.userData.baseY
      + Math.sin(bgTime * b.userData.floatSp + b.userData.floatS) * 0.14;
  });

  bgRenderer.render(bgScene, bgCamera);
}
animateBg();

function animateChar() {
  requestAnimationFrame(animateChar);
  charTime += 0.011;

  if (!reduceMotion) {
    // Girl idle breathing + look-around
    girl.position.y = -1.08 + Math.sin(charTime * 0.68) * 0.022;
    girl.rotation.y  = Math.sin(charTime * 0.38) * 0.055;

    // Robot hover
    robot.position.y = -1.08 + Math.sin(charTime * 1.05 + 1.2) * 0.032;

    // Robot eye glow pulse
    if (robot.userData.eyeMats) {
      const ei = 0.7 + Math.sin(charTime * 2.6) * 0.35;
      robot.userData.eyeMats.forEach(m => { m.emissiveIntensity = ei; });
    }
    if (robot.userData.antTipMat) {
      robot.userData.antTipMat.emissiveIntensity = 0.65 + Math.sin(charTime * 4) * 0.32;
    }

    // Hologram float + spin
    hologram.position.y = 0.62 + Math.sin(charTime * 0.85) * 0.055;
    const { holoRings, electrons } = hologram.userData;
    if (holoRings) {
      holoRings[0].rotation.y += 0.015;
      holoRings[1].rotation.z += 0.012;
      holoRings[2].rotation.x += 0.009;
      holoRings[2].rotation.y += 0.007;
    }
    if (electrons) {
      electrons.forEach(e => {
        e.angle += e.speed * 0.016;
        e.mesh.position.set(
          Math.cos(e.angle) * e.orbit,
          Math.sin(e.tilt + e.angle * 0.5) * 0.14,
          Math.sin(e.angle) * e.orbit
        );
      });
    }

    // Orbs drift
    const { orbs } = orbGroup.userData;
    if (orbs) {
      orbs.forEach(o => {
        o.mesh.position.y += Math.sin(charTime * o.spd + o.off) * 0.0024;
        o.mesh.position.x += Math.cos(charTime * o.spd * 0.5 + o.off) * 0.0017;
        o.mesh.material.opacity = 0.35 + Math.sin(charTime * o.spd + o.off) * 0.28;
      });
    }

    holoLight.intensity  = 0.7 + Math.sin(charTime * 1.8) * 0.24;
    groundGlow.intensity = 0.36 + Math.sin(charTime * 1.4) * 0.17;
    fillLight.intensity  = 0.9 + Math.sin(charTime * 0.6) * 0.16;
  }

  charRenderer.render(charScene, charCamera);
}
animateChar();

/* ════════════════════════════════════════
   TYPING ANIMATION
   ════════════════════════════════════════ */
const phrases = [
  'Automation & Programming Specialist',
  'Full-Stack Developer',
  'Lab Robotics Engineer',
  'Hamilton VENUS Expert',
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
const html = document.documentElement;
const saved = localStorage.getItem('portfolio-theme') || 'dark';
html.setAttribute('data-theme', saved);

themeToggle.addEventListener('click', () => {
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('portfolio-theme', next);
  pMat.color.set(next === 'dark' ? 0xB2C2A3 : 0x7A8A6E);
  pMat.opacity = next === 'dark' ? 0.38 : 0.18;
});

/* ════════════════════════════════════════
   NAVIGATION
   ════════════════════════════════════════ */
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
