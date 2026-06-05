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
   CHARACTER — real photo; Three.js char removed.
   Avatar animation is handled purely in CSS.
   ════════════════════════════════════════ */


/* ════════════════════════════════════════
   ANIMATION LOOPS
   ════════════════════════════════════════ */
let bgTime = 0;
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

/* ════════════════════════════════════════
   VOICE GREETING
   ════════════════════════════════════════ */
function speakGreeting() {
  const fallback = document.getElementById('voiceFallback');
  if (!window.speechSynthesis) {
    if (fallback) fallback.textContent = '🎧 Voice not supported in this browser.';
    return;
  }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(
    "Hey, this is Sejal. I work as an Automation Engineer, and I also like building apps. Welcome to my portfolio."
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
    if (fallback) fallback.textContent = '🔊 Playing…';
    u.onend = () => {
      if (btn) btn.classList.remove('speaking');
      if (fallback) fallback.textContent = '🎧 Click play to hear my voice';
    };
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
});
