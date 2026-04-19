/* ============================
   BACKGROUND SCENE (bg-canvas)
   ============================ */
const bgCanvas = document.getElementById('bg-canvas');
const bgRenderer = new THREE.WebGLRenderer({ canvas: bgCanvas, antialias: true, alpha: true });
bgRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
bgRenderer.setSize(window.innerWidth, window.innerHeight);

const bgScene = new THREE.Scene();
const bgCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
bgCamera.position.set(0, 0, 5);

// Soft particle field
const pCount = 900;
const pPos = new Float32Array(pCount * 3);
for (let i = 0; i < pCount; i++) {
  pPos[i * 3]     = (Math.random() - 0.5) * 24;
  pPos[i * 3 + 1] = (Math.random() - 0.5) * 24;
  pPos[i * 3 + 2] = (Math.random() - 0.5) * 14;
}
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const pMat = new THREE.PointsMaterial({ size: 0.022, color: 0x8B7EC8, transparent: true, opacity: 0.42 });
const bgParticles = new THREE.Points(pGeo, pMat);
bgScene.add(bgParticles);

// Subtle nebula spheres
const nebMat = new THREE.MeshBasicMaterial({ color: 0x7B6EB8, transparent: true, opacity: 0.022, side: THREE.BackSide });
[[-4, 2, -6, 3.5], [5, -3, -9, 4.2], [-1, -4, -7, 2.8], [3, 4, -8, 3]].forEach(([x, y, z, r]) => {
  const neb = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 16), nebMat.clone());
  neb.position.set(x, y, z);
  bgScene.add(neb);
});

// Distant wireframe shapes
const bgShapes = [];
const wMat = new THREE.MeshBasicMaterial({ color: 0x8B7EC8, wireframe: true, transparent: true, opacity: 0.055 });
[
  [new THREE.IcosahedronGeometry(0.9, 1), -5.5, 3, -5],
  [new THREE.OctahedronGeometry(0.7, 0),  5.5, -2, -6],
  [new THREE.TetrahedronGeometry(0.8, 0), -3,  -3.5, -7],
  [new THREE.IcosahedronGeometry(0.6, 0),  4,   4,   -4],
  [new THREE.OctahedronGeometry(0.5, 0),  -6,  -1,   -3],
].forEach(([geo, x, y, z]) => {
  const m = new THREE.Mesh(geo, wMat.clone());
  m.position.set(x, y, z);
  bgScene.add(m);
  bgShapes.push(m);
});

/* ============================
   CHARACTER CANVAS
   ============================ */
const charCanvas = document.getElementById('character-canvas');
const charRenderer = new THREE.WebGLRenderer({ canvas: charCanvas, antialias: true, alpha: true });
charRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const charScene = new THREE.Scene();
const charCamera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
charCamera.position.set(0, 0.5, 6.2);
charCamera.lookAt(0, 0.2, 0);

function resizeCharCanvas() {
  const el = charCanvas.parentElement;
  if (!el) return;
  const w = el.clientWidth || 500;
  const h = el.clientHeight || 520;
  charRenderer.setSize(w, h);
  charCamera.aspect = w / h;
  charCamera.updateProjectionMatrix();
}
resizeCharCanvas();

// — Lighting —
charScene.add(new THREE.AmbientLight(0xA090C8, 0.45));

const keyLight = new THREE.DirectionalLight(0xFFEEDD, 1.35);
keyLight.position.set(-2.5, 4, 3);
charScene.add(keyLight);

const fillLight = new THREE.PointLight(0x9B8EC8, 1.1, 14);
fillLight.position.set(3.5, 2, 2);
charScene.add(fillLight);

const rimLight = new THREE.PointLight(0x5577BB, 0.7, 10);
rimLight.position.set(-1, 3, -4);
charScene.add(rimLight);

const groundGlow = new THREE.PointLight(0x8B7EC8, 0.55, 7);
groundGlow.position.set(0, -2, 0);
charScene.add(groundGlow);

const holoLight = new THREE.PointLight(0x88C8FF, 0.9, 5);
holoLight.position.set(0.5, 0.8, 2);
charScene.add(holoLight);

/* ——— PLATFORM ——— */
function createPlatform() {
  const g = new THREE.Group();

  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(2.6, 2.6, 0.05, 6),
    new THREE.MeshStandardMaterial({ color: 0x0C0F20, roughness: 0.18, metalness: 0.92, transparent: true, opacity: 0.88 })
  );
  g.add(disc);

  // Outer glow ring
  const outerRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.6, 0.04, 8, 80),
    new THREE.MeshStandardMaterial({ color: 0x8B7EC8, emissive: 0x8B7EC8, emissiveIntensity: 0.65 })
  );
  outerRing.rotation.x = Math.PI / 2;
  outerRing.position.y = 0.03;
  g.add(outerRing);

  // Inner ring
  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.5, 0.025, 8, 60),
    new THREE.MeshStandardMaterial({ color: 0xB87EC4, emissive: 0xB87EC4, emissiveIntensity: 0.38, transparent: true, opacity: 0.7 })
  );
  innerRing.rotation.x = Math.PI / 2;
  innerRing.position.y = 0.03;
  g.add(innerRing);

  // Tiny center ring
  const cRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.45, 0.018, 8, 40),
    new THREE.MeshStandardMaterial({ color: 0x88C8FF, emissive: 0x55AADD, emissiveIntensity: 0.45, transparent: true, opacity: 0.6 })
  );
  cRing.rotation.x = Math.PI / 2;
  cRing.position.y = 0.03;
  g.add(cRing);

  // Radial spokes
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const spoke = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.01, 2.6),
      new THREE.MeshStandardMaterial({ color: 0x8B7EC8, emissive: 0x8B7EC8, emissiveIntensity: 0.18, transparent: true, opacity: 0.28 })
    );
    spoke.rotation.y = a;
    spoke.position.y = 0.03;
    g.add(spoke);
  }

  return g;
}

/* ——— GIRL CHARACTER ——— */
function createGirl() {
  const g = new THREE.Group();

  // Materials
  const skin    = new THREE.MeshStandardMaterial({ color: 0xD4A574, roughness: 0.85 });
  const hair    = new THREE.MeshStandardMaterial({ color: 0x160F0A, roughness: 0.95 });
  const coat    = new THREE.MeshStandardMaterial({ color: 0xECEAF8, roughness: 0.62 });
  const shirt   = new THREE.MeshStandardMaterial({ color: 0x7B6BB5, roughness: 0.75 });
  const pants   = new THREE.MeshStandardMaterial({ color: 0x1C1C34, roughness: 0.82 });
  const frames  = new THREE.MeshStandardMaterial({ color: 0x282838, roughness: 0.3, metalness: 0.7 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x14141E, roughness: 0.35, metalness: 0.45 });
  const eyeW    = new THREE.MeshStandardMaterial({ color: 0xFFF8F5 });
  const eyeD    = new THREE.MeshStandardMaterial({ color: 0x100A06 });
  const lipMat  = new THREE.MeshStandardMaterial({ color: 0xB87070, roughness: 0.8 });
  const tieMat  = new THREE.MeshStandardMaterial({ color: 0xC078C0, roughness: 0.6 });
  const btnMat  = new THREE.MeshStandardMaterial({ color: 0xA898D8, roughness: 0.4, metalness: 0.5 });
  const penMat  = new THREE.MeshStandardMaterial({ color: 0x8B7EC8, metalness: 0.82, roughness: 0.2 });
  const screenM = new THREE.MeshStandardMaterial({ color: 0xAADDFF, emissive: 0x5599CC, emissiveIntensity: 0.55, transparent: true, opacity: 0.92 });
  const shineM  = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: 0xFFFFFF, emissiveIntensity: 1 });

  // — HEAD —
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.31, 32, 32), skin);
  head.position.y = 1.72;
  head.scale.set(0.96, 1.06, 0.94);
  g.add(head);

  // Hair back dome
  const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.335, 32, 32), hair);
  hairBack.position.y = 1.74;
  hairBack.scale.set(0.98, 1.01, 0.9);
  g.add(hairBack);

  // Hair top cap (upper half)
  const hairTop = new THREE.Mesh(
    new THREE.SphereGeometry(0.332, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.52),
    hair
  );
  hairTop.position.y = 1.72;
  g.add(hairTop);

  // Fringe / bangs
  const bangs = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.1, 0.16), hair);
  bangs.position.set(0, 1.925, 0.225);
  bangs.rotation.x = 0.2;
  g.add(bangs);

  // Side hair strands
  [-1, 1].forEach(s => {
    const sh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.1), hair);
    sh.position.set(s * 0.305, 1.64, 0.18);
    g.add(sh);
  });

  // Ponytail
  const ptyBase = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), hair);
  ptyBase.position.set(0, 1.7, -0.315);
  g.add(ptyBase);
  const pty = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.04, 0.52, 10), hair);
  pty.position.set(0, 1.44, -0.41);
  pty.rotation.x = 0.4;
  g.add(pty);
  const ptyTip = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), hair);
  ptyTip.position.set(0, 1.17, -0.59);
  g.add(ptyTip);
  const tie = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.022, 8, 20), tieMat);
  tie.position.set(0, 1.59, -0.355);
  tie.rotation.x = 0.4;
  g.add(tie);

  // — FACE —
  [-0.112, 0.112].forEach(x => {
    // Eye whites
    const eW = new THREE.Mesh(new THREE.SphereGeometry(0.058, 16, 16), eyeW);
    eW.position.set(x, 1.7, 0.268);
    eW.scale.set(1, 0.88, 0.72);
    g.add(eW);
    // Iris
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.033, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x3A2618 }));
    iris.position.set(x, 1.7, 0.315);
    g.add(iris);
    // Pupil
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.017, 10, 10), eyeD);
    pupil.position.set(x, 1.7, 0.342);
    g.add(pupil);
    // Eye shine
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.007, 6, 6), shineM);
    shine.position.set(x + 0.013, 1.714, 0.348);
    g.add(shine);
    // Eyebrows
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.096, 0.017, 0.012), hair);
    brow.position.set(x, 1.782, 0.288);
    brow.rotation.z = x > 0 ? -0.08 : 0.08;
    g.add(brow);
  });

  // Glasses
  [-0.112, 0.112].forEach(x => {
    const fr = new THREE.Mesh(new THREE.TorusGeometry(0.082, 0.012, 8, 24), frames);
    fr.position.set(x, 1.7, 0.288);
    g.add(fr);
  });
  const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.066, 6), frames);
  bridge.position.set(0, 1.71, 0.298);
  bridge.rotation.z = Math.PI / 2;
  g.add(bridge);
  [-1, 1].forEach(s => {
    const tmpl = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.2, 6), frames);
    tmpl.position.set(s * 0.278, 1.7, 0.19);
    tmpl.rotation.z = Math.PI / 2;
    g.add(tmpl);
  });

  // Nose
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), skin);
  nose.position.set(0, 1.654, 0.32);
  nose.scale.set(1, 0.7, 0.8);
  g.add(nose);

  // Subtle smile
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.058, 0.009, 8, 12, Math.PI * 0.72),
    lipMat
  );
  smile.position.set(0, 1.612, 0.31);
  smile.rotation.set(0, 0, Math.PI + 0.22);
  g.add(smile);

  // Ears
  [-1, 1].forEach(s => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.038, 10, 10), skin);
    ear.position.set(s * 0.312, 1.67, 0);
    ear.scale.set(0.55, 0.85, 0.5);
    g.add(ear);
  });

  // — NECK —
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.106, 0.21, 16), skin);
  neck.position.y = 1.44;
  g.add(neck);

  // — TORSO (lab coat) —
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.295, 0.72, 20), coat);
  torso.position.y = 0.9;
  g.add(torso);

  // Shirt collar
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.132, 0.158, 0.17, 16), shirt);
  collar.position.y = 1.225;
  g.add(collar);

  // Lapels
  [-1, 1].forEach(s => {
    const lap = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.41, 0.055), coat);
    lap.position.set(s * 0.088, 1.065, 0.238);
    lap.rotation.z = s * 0.17;
    g.add(lap);
  });

  // Coat buttons
  [1.08, 0.92, 0.76].forEach(y => {
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.018, 8), btnMat);
    btn.position.set(0, y, 0.288);
    btn.rotation.x = Math.PI / 2;
    g.add(btn);
  });

  // Pocket + pen
  const pkt = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.014), coat);
  pkt.position.set(0.19, 0.9, 0.292);
  g.add(pkt);
  const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.11, 6), penMat);
  pen.position.set(0.185, 0.96, 0.306);
  g.add(pen);

  // — LEFT ARM (relaxed down) —
  const lUA = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.074, 0.41, 12), coat);
  lUA.position.set(-0.358, 0.9, 0);
  lUA.rotation.z = 0.22;
  g.add(lUA);
  const lLA = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.064, 0.37, 12), coat);
  lLA.position.set(-0.462, 0.638, 0.032);
  lLA.rotation.set(0.08, 0, 0.28);
  g.add(lLA);
  const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.066, 12, 12), skin);
  lHand.position.set(-0.478, 0.435, 0.07);
  lHand.scale.set(0.88, 0.74, 0.62);
  g.add(lHand);

  // — RIGHT ARM (extended, holding tablet) —
  const rUA = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.074, 0.41, 12), coat);
  rUA.position.set(0.358, 0.92, 0.06);
  rUA.rotation.set(0.28, 0, -0.32);
  g.add(rUA);
  const rLA = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.064, 0.37, 12), coat);
  rLA.position.set(0.48, 0.695, 0.225);
  rLA.rotation.set(-0.55, 0, -0.38);
  g.add(rLA);
  const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.066, 12, 12), skin);
  rHand.position.set(0.5, 0.498, 0.385);
  rHand.scale.set(0.88, 0.74, 0.62);
  g.add(rHand);

  // Tablet in right hand
  const tabBody = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.285, 0.018),
    new THREE.MeshStandardMaterial({ color: 0x181825, roughness: 0.14, metalness: 0.88 }));
  tabBody.position.set(0.5, 0.438, 0.525);
  tabBody.rotation.set(-0.24, 0.14, -0.08);
  g.add(tabBody);
  const tabScreen = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.244, 0.005), screenM);
  tabScreen.position.set(0.5, 0.44, 0.535);
  tabScreen.rotation.set(-0.24, 0.14, -0.08);
  g.add(tabScreen);

  // — HIPS —
  const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.272, 0.252, 0.37, 18), shirt);
  hips.position.y = 0.368;
  g.add(hips);

  // — LEGS —
  [-1, 1].forEach(s => {
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.086, 0.43, 12), pants);
    thigh.position.set(s * 0.115, -0.042, 0);
    g.add(thigh);
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.41, 12), pants);
    shin.position.set(s * 0.115, -0.495, 0);
    g.add(shin);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.085, 0.215), shoeMat);
    shoe.position.set(s * 0.115, -0.735, 0.042);
    g.add(shoe);
  });

  return g;
}

/* ——— ROBOT COMPANION ——— */
function createRobot() {
  const g = new THREE.Group();

  const bodyM  = new THREE.MeshStandardMaterial({ color: 0xBECCDC, roughness: 0.22, metalness: 0.82 });
  const accentM = new THREE.MeshStandardMaterial({ color: 0x8B7EC8, roughness: 0.32, metalness: 0.68 });
  const darkM  = new THREE.MeshStandardMaterial({ color: 0x181828, roughness: 0.18, metalness: 0.92 });
  const eyeM   = new THREE.MeshStandardMaterial({ color: 0x88D8FF, emissive: 0x44AADD, emissiveIntensity: 1.1, roughness: 0.08 });
  const greenM = new THREE.MeshStandardMaterial({ color: 0x88EEB8, emissive: 0x44DD88, emissiveIntensity: 0.65 });
  const pinkM  = new THREE.MeshStandardMaterial({ color: 0xFFAACC, emissive: 0xFF66AA, emissiveIntensity: 0.95 });

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.67, 0.4), bodyM);
  torso.position.y = 0.34;
  g.add(torso);

  // Chest panel
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.02), darkM);
  panel.position.set(0, 0.36, 0.215);
  g.add(panel);
  [-0.1, 0, 0.1].forEach(y => {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.032, 0.014), greenM);
    line.position.set(0, y + 0.36, 0.228);
    g.add(line);
  });

  // Neck joint
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.125, 0.1, 12), accentM);
  neck.position.y = 0.68;
  g.add(neck);

  // Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.44, 0.44), bodyM);
  head.position.y = 0.9;
  head.scale.set(1, 1, 0.88);
  g.add(head);

  // Ear panels
  [-1, 1].forEach(s => {
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.26, 0.26), accentM);
    ear.position.set(s * 0.275, 0.9, 0);
    g.add(ear);
  });

  // Eyes — store refs for blinking
  const eyeMats = [];
  [-0.115, 0.115].forEach(x => {
    const eyeMat = eyeM.clone();
    eyeMats.push(eyeMat);
    const eye = new THREE.Mesh(new THREE.CircleGeometry(0.078, 24), eyeMat);
    eye.position.set(x, 0.92, 0.225);
    g.add(eye);
    const eyeRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.078, 0.012, 8, 24),
      new THREE.MeshStandardMaterial({ color: 0xBBEEFF, emissive: 0x66CCFF, emissiveIntensity: 0.45 })
    );
    eyeRing.position.set(x, 0.92, 0.218);
    g.add(eyeRing);
  });
  g.userData.eyeMats = eyeMats;

  // Mouth / speaker
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.034, 0.018), darkM);
  mouth.position.set(0, 0.8, 0.225);
  g.add(mouth);
  [-0.065, 0, 0.065].forEach(x => {
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.012, 8), greenM);
    dot.position.set(x, 0.8, 0.234);
    g.add(dot);
  });

  // Antenna
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.29, 8), accentM);
  ant.position.set(0.13, 1.255, 0);
  g.add(ant);
  const antTip = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), pinkM);
  antTip.position.set(0.13, 1.42, 0);
  g.add(antTip);
  g.userData.antTip = antTip;
  g.userData.antTipMat = pinkM;

  // Shoulders + arms
  [-1, 1].forEach(s => {
    const shldr = new THREE.Mesh(new THREE.SphereGeometry(0.118, 14, 14), accentM);
    shldr.position.set(s * 0.385, 0.57, 0);
    shldr.scale.set(1, 0.86, 0.86);
    g.add(shldr);
    const ua = new THREE.Mesh(new THREE.CylinderGeometry(0.076, 0.068, 0.43, 12), bodyM);
    ua.position.set(s * 0.46, 0.265, 0);
    ua.rotation.z = s * 0.12;
    g.add(ua);
    const jt = new THREE.Mesh(new THREE.SphereGeometry(0.074, 12, 12), accentM);
    jt.position.set(s * 0.495, 0.03, 0);
    g.add(jt);
    const la = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.058, 0.39, 12), bodyM);
    la.position.set(s * 0.51, -0.21, 0);
    la.rotation.set(0.1, 0, s * 0.1);
    g.add(la);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.082, 12, 12), accentM);
    hand.position.set(s * 0.51, -0.428, 0);
    hand.scale.set(1, 0.8, 0.8);
    g.add(hand);
  });

  // Waist
  const waist = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.225, 0.105, 16), accentM);
  waist.position.y = -0.025;
  g.add(waist);

  // Legs
  [-1, 1].forEach(s => {
    const hip = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), accentM);
    hip.position.set(s * 0.155, -0.125, 0);
    g.add(hip);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.082, 0.43, 12), bodyM);
    leg.position.set(s * 0.155, -0.39, 0);
    g.add(leg);
    const kj = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), accentM);
    kj.position.set(s * 0.155, -0.625, 0);
    g.add(kj);
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.072, 0.37, 12), bodyM);
    shin.position.set(s * 0.155, -0.84, 0);
    g.add(shin);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.175, 0.092, 0.255), darkM);
    foot.position.set(s * 0.155, -1.04, 0.042);
    g.add(foot);
    // Foot accent stripe
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.155, 0.018, 0.02), accentM);
    stripe.position.set(s * 0.155, -0.994, 0.175);
    g.add(stripe);
  });

  return g;
}

/* ——— HOLOGRAM / LAB DATA DISPLAY ——— */
function createHologram() {
  const g = new THREE.Group();

  const hMat = (col, em, ei = 0.6, op = 0.7) => new THREE.MeshStandardMaterial({
    color: col, emissive: em, emissiveIntensity: ei, transparent: true, opacity: op
  });

  // Orbiting rings at different tilts
  const ringDefs = [
    { r: 0.46, tube: 0.018, col: 0x88CCFF, em: 0x4488AA, ei: 0.58, rx: 0,           ry: 0,           rz: 0 },
    { r: 0.58, tube: 0.013, col: 0xBB88FF, em: 0x8844CC, ei: 0.48, rx: Math.PI/3,   ry: 0,           rz: Math.PI/6 },
    { r: 0.68, tube: 0.011, col: 0x88FFCC, em: 0x44CC88, ei: 0.38, rx: Math.PI/2,   ry: Math.PI/4,   rz: 0 },
  ];
  const holoRings = [];
  ringDefs.forEach(d => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(d.r, d.tube, 8, 52),
      hMat(d.col, d.em, d.ei, 0.62)
    );
    ring.rotation.set(d.rx, d.ry, d.rz);
    g.add(ring);
    holoRings.push(ring);
  });

  // Central atom core
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.082, 16, 16),
    hMat(0xDDEEFF, 0xAADDFF, 1.4, 0.88)
  );
  g.add(core);

  // Electron-like orbiting spheres (local children)
  const electrons = [];
  for (let i = 0; i < 5; i++) {
    const eMat = hMat(0xCCEEFF, 0x88CCFF, 0.95, 0.82);
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 10), eMat);
    g.add(e);
    electrons.push({
      mesh: e,
      angle: (i / 5) * Math.PI * 2,
      orbit: 0.34 + (i % 2) * 0.16,
      speed: 0.75 + i * 0.18,
      tilt: i * 0.42
    });
  }

  // Data bar pillars rising around perimeter
  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2;
    const h = 0.18 + (i % 3) * 0.22;
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(0.038, h, 0.038),
      hMat(0x8B7EC8, 0x6655AA, 0.5, 0.58)
    );
    bar.position.set(Math.cos(angle) * 0.95, -1.08 + h / 2, Math.sin(angle) * 0.95);
    g.add(bar);
  }

  // Connection lines (thin cylinders between core and perimeter)
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const line = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.9, 4),
      hMat(0x88CCFF, 0x4488AA, 0.3, 0.35)
    );
    line.position.set(Math.cos(angle) * 0.45, 0, Math.sin(angle) * 0.45);
    line.rotation.z = Math.PI / 2;
    line.rotation.y = angle;
    g.add(line);
  }

  g.userData.holoRings = holoRings;
  g.userData.electrons = electrons;
  return g;
}

/* ——— FLOATING DATA ORBS ——— */
function createOrbs() {
  const g = new THREE.Group();
  const orbs = [];
  for (let i = 0; i < 22; i++) {
    const mat = new THREE.MeshStandardMaterial({
      color: i % 3 === 0 ? 0x8B7EC8 : i % 3 === 1 ? 0xB87EC4 : 0x88CCEE,
      emissive: i % 3 === 0 ? 0x6655AA : i % 3 === 1 ? 0x9960B0 : 0x4488AA,
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.65
    });
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.022 + Math.random() * 0.018, 8, 8), mat);
    orb.position.set(
      (Math.random() - 0.5) * 4.5,
      (Math.random() - 0.5) * 2.8,
      (Math.random() - 0.5) * 2.2 - 0.8
    );
    g.add(orb);
    orbs.push({ mesh: orb, off: Math.random() * Math.PI * 2, spd: 0.45 + Math.random() * 0.55 });
  }
  g.userData.orbs = orbs;
  return g;
}

/* ——— BUILD SCENE ——— */
const platform = createPlatform();
platform.position.set(0, -1.08, 0);
charScene.add(platform);

const girl = createGirl();
girl.position.set(-0.65, -1.08, 0);
charScene.add(girl);

const robot = createRobot();
robot.position.set(1.15, -1.08, 0.15);
robot.scale.setScalar(0.58);
robot.rotation.y = -0.28;
charScene.add(robot);

const hologram = createHologram();
hologram.position.set(0.15, 0.62, 1.05);
hologram.scale.setScalar(0.88);
charScene.add(hologram);

const orbGroup = createOrbs();
charScene.add(orbGroup);

/* ============================
   ANIMATION LOOPS
   ============================ */
let bgTime = 0, charTime = 0;
let mouseX = 0, mouseY = 0;

document.addEventListener('mousemove', e => {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 0.38;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 0.38;
});

window.addEventListener('resize', () => {
  bgCamera.aspect = window.innerWidth / window.innerHeight;
  bgCamera.updateProjectionMatrix();
  bgRenderer.setSize(window.innerWidth, window.innerHeight);
  resizeCharCanvas();
});

function animateBg() {
  requestAnimationFrame(animateBg);
  bgTime += 0.005;
  bgParticles.rotation.y = bgTime * 0.028;
  bgParticles.rotation.x = bgTime * 0.013;
  bgCamera.position.x += (mouseX - bgCamera.position.x) * 0.035;
  bgCamera.position.y += (-mouseY - bgCamera.position.y) * 0.035;
  bgCamera.lookAt(bgScene.position);
  bgShapes.forEach((m, i) => {
    m.rotation.x += 0.0025 * (i % 2 ? 1 : -1);
    m.rotation.y += 0.003;
  });
  bgRenderer.render(bgScene, bgCamera);
}
animateBg();

function animateChar() {
  requestAnimationFrame(animateChar);
  charTime += 0.011;

  // Girl breathing + subtle look-around
  girl.position.y = -1.08 + Math.sin(charTime * 0.68) * 0.022;
  girl.rotation.y  = Math.sin(charTime * 0.38) * 0.055;

  // Robot hover + head sway
  robot.position.y = -1.08 + Math.sin(charTime * 1.05 + 1.2) * 0.032;
  robot.rotation.y = -0.28 + Math.sin(charTime * 0.58) * 0.075;

  // Robot eye glow pulse
  if (robot.userData.eyeMats) {
    const ei = 0.75 + Math.sin(charTime * 2.8) * 0.38;
    robot.userData.eyeMats.forEach(m => { m.emissiveIntensity = ei; });
  }
  // Antenna tip throb
  if (robot.userData.antTipMat) {
    robot.userData.antTipMat.emissiveIntensity = 0.7 + Math.sin(charTime * 4.2) * 0.28;
  }

  // Hologram float + ring spin
  hologram.position.y = 0.62 + Math.sin(charTime * 0.85) * 0.055;
  const { holoRings, electrons } = hologram.userData;
  if (holoRings) {
    holoRings[0].rotation.y += 0.016;
    holoRings[1].rotation.z += 0.013;
    holoRings[2].rotation.x += 0.009;
    holoRings[2].rotation.y += 0.007;
  }
  // Electrons orbit in local hologram space
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

  // Floating orbs drift
  const { orbs } = orbGroup.userData;
  if (orbs) {
    orbs.forEach(o => {
      o.mesh.position.y += Math.sin(charTime * o.spd + o.off) * 0.0025;
      o.mesh.position.x += Math.cos(charTime * o.spd * 0.5 + o.off) * 0.0018;
      o.mesh.material.opacity = 0.38 + Math.sin(charTime * o.spd + o.off) * 0.28;
    });
  }

  // Pulsing lights
  holoLight.intensity  = 0.72 + Math.sin(charTime * 1.9) * 0.26;
  groundGlow.intensity = 0.38 + Math.sin(charTime * 1.4) * 0.18;
  fillLight.intensity  = 0.95 + Math.sin(charTime * 0.6) * 0.18;

  charRenderer.render(charScene, charCamera);
}
animateChar();

/* ============================
   THEME TOGGLE
   ============================ */
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

const savedTheme = localStorage.getItem('portfolio-theme') || 'dark';
html.setAttribute('data-theme', savedTheme);

themeToggle.addEventListener('click', () => {
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('portfolio-theme', next);
  // Adjust background particle color for theme
  pMat.color.set(next === 'dark' ? 0x8B7EC8 : 0x6B5BAD);
  pMat.opacity = next === 'dark' ? 0.42 : 0.22;
});

/* ============================
   NAVIGATION
   ============================ */
const nav = document.getElementById('nav');
const navLinks = document.querySelectorAll('.nav-link');
const navMenu = document.getElementById('navMenu');
const mobileMenu = document.getElementById('mobileMenu');
const sections = document.querySelectorAll('.section');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 120) current = s.getAttribute('id');
  });
  navLinks.forEach(l => {
    l.classList.toggle('active', l.getAttribute('href') === `#${current}`);
  });
});

navMenu.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
  navMenu.textContent = mobileMenu.classList.contains('open') ? '✕' : '☰';
});
document.querySelectorAll('.mobile-link').forEach(l => {
  l.addEventListener('click', () => { mobileMenu.classList.remove('open'); navMenu.textContent = '☰'; });
});

/* ============================
   SCROLL REVEAL
   ============================ */
const revealObserver = new IntersectionObserver(
  entries => entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 75);
      revealObserver.unobserve(entry.target);
    }
  }),
  { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
);
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ============================
   ANIMATED COUNTERS
   ============================ */
const counterObserver = new IntersectionObserver(
  entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.target);
      const start = Date.now();
      const update = () => {
        const p = Math.min((Date.now() - start) / 1500, 1);
        el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
        if (p < 1) requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
      counterObserver.unobserve(el);
    }
  }),
  { threshold: 0.5 }
);
document.querySelectorAll('.stat-number').forEach(el => counterObserver.observe(el));

/* ============================
   SKILL BARS
   ============================ */
const barObserver = new IntersectionObserver(
  entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.width = `${entry.target.dataset.width}%`;
      barObserver.unobserve(entry.target);
    }
  }),
  { threshold: 0.3 }
);
document.querySelectorAll('.skill-bar-fill').forEach(b => barObserver.observe(b));

/* ============================
   CONTACT FORM
   ============================ */
const form = document.getElementById('contactForm');
const toast = document.getElementById('toast');

form.addEventListener('submit', e => {
  e.preventDefault();
  const btn = form.querySelector('button[type="submit"]');
  btn.textContent = 'Sending...';
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = 'Send Message ✉️';
    btn.disabled = false;
    form.reset();
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
  }, 1200);
});

/* ============================
   PROJECT CARD 3D TILT
   ============================ */
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `translateY(-6px) rotateX(${-y * 7}deg) rotateY(${x * 7}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.transition = 'transform 0.5s ease';
  });
  card.addEventListener('mouseenter', () => {
    card.style.transition = 'transform 0.1s ease';
  });
});

/* ============================
   SMOOTH SCROLL
   ============================ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function(e) {
    const t = document.querySelector(this.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
  });
});
