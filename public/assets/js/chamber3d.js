/* Nepal Federal Parliament, 3D Chamber
   You are standing inside the hemicycle. 332 real seats, real party colors,
   a camera that flies in on load and that you can look around by dragging. */

const PARTY_COLOR = {
  RSP: 0xC9A227, NC: 0xA6303F, UML: 0x3D5799, MLM: 0xB5493A,
  RPP: 0x5B7A6E, SP: 0x8A6FB0, JSP: 0x4C9A8C, LSP: 0xC77C3C,
  IND: 0x8D8D8D, NOM: 0x6F7B93, OTH: 0x5A5A5A
};

let DATA = { members: [], statistics: null, leadership: null };
let scene, camera, renderer, composer, controls, raycaster, mouse;
let seatMeshes = [];
let hoveredSeat = null;
let tooltip;
const clock = new THREE.Clock();
let scrollProgress = 0;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

async function loadData() {
  const [membersRes, statsRes, leadRes] = await Promise.all([
    fetch('assets/data/members.json').then(r => r.json()),
    fetch('assets/data/statistics.json').then(r => r.json()),
    fetch('assets/data/leadership.json').then(r => r.json()),
  ]);
  DATA.members = membersRes.members;
  DATA.statistics = statsRes;
  DATA.leadership = leadRes.leadership;
}

/* ---------- Scene setup ---------- */
function initScene() {
  const canvas = document.getElementById('ambient-canvas');
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0d1117, 0.014);

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 300);
  camera.position.set(0, 70, 100);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setClearColor(0x0d1117, 1);

  // -- lights --
  scene.add(new THREE.AmbientLight(0x1a2233, 1.4));
  const podiumLight = new THREE.PointLight(0xC9A227, 6, 55, 2);
  podiumLight.position.set(0, 7, -16);
  scene.add(podiumLight);
  const rimL = new THREE.PointLight(0x3D5799, 3, 60, 2);
  rimL.position.set(-30, 14, 6);
  scene.add(rimL);
  const rimR = new THREE.PointLight(0x3D5799, 3, 60, 2);
  rimR.position.set(30, 14, 6);
  scene.add(rimR);
  const fill = new THREE.HemisphereLight(0x28344a, 0x05070a, 0.6);
  scene.add(fill);

  // -- floor --
  const floorGeo = new THREE.CircleGeometry(46, 64);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x0a0e14, roughness: 0.55, metalness: 0.25 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.05;
  scene.add(floor);

  // subtle concentric floor rings (institutional, not decorative)
  for (let r = 8; r <= 40; r += 8) {
    const ringGeo = new THREE.RingGeometry(r, r + 0.06, 96);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x2a3a2a, transparent: true, opacity: 0.12, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.03;
    scene.add(ring);
  }

  // -- colonnade --
  const colGeo = new THREE.CylinderGeometry(0.55, 0.65, 16, 12);
  const colMat = new THREE.MeshStandardMaterial({ color: 0x1a1f2b, roughness: 0.6, metalness: 0.3 });
  const colCount = 28;
  for (let i = 0; i <= colCount; i++) {
    const t = i / colCount;
    const angle = Math.PI * (1.02 - t * 1.04);
    const r = 40;
    const col = new THREE.Mesh(colGeo, colMat);
    col.position.set(r * Math.cos(angle), 8, -6 - r * Math.sin(angle) * 0.55);
    scene.add(col);
  }

  // -- podium / speaker's dais --
  const daisGeo = new THREE.CylinderGeometry(3.2, 3.6, 1.1, 24);
  const daisMat = new THREE.MeshStandardMaterial({ color: 0x1c2130, roughness: 0.4, metalness: 0.5, emissive: 0xC9A227, emissiveIntensity: 0.05 });
  const dais = new THREE.Mesh(daisGeo, daisMat);
  dais.position.set(0, 0.55, -16);
  scene.add(dais);

  const wallGeo = new THREE.PlaneGeometry(30, 14);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x10141d, roughness: 0.8, metalness: 0.1 });
  const wall = new THREE.Mesh(wallGeo, wallMat);
  wall.position.set(0, 7, -24);
  scene.add(wall);

  const sealGeo = new THREE.RingGeometry(1.6, 2.2, 48);
  const sealMat = new THREE.MeshStandardMaterial({ color: 0xC9A227, emissive: 0xC9A227, emissiveIntensity: 0.9, side: THREE.DoubleSide });
  const seal = new THREE.Mesh(sealGeo, sealMat);
  seal.position.set(0, 8, -23.9);
  scene.add(seal);

  buildSeats();

  // -- controls: look around by dragging, gentle idle rotation, no zoom/pan --
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 5, -6);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minPolarAngle = Math.PI * 0.32;
  controls.maxPolarAngle = Math.PI * 0.5;
  controls.autoRotate = !reducedMotion;
  controls.autoRotateSpeed = 0.35;
  controls.update();

  // -- postprocessing: bloom on the emissive/glowing elements --
  composer = new THREE.EffectComposer(renderer);
  composer.addPass(new THREE.RenderPass(scene, camera));
  const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.85, 0.4, 0.2);
  composer.addPass(bloom);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2(-10, -10);

  tooltip = document.createElement('div');
  tooltip.className = 'seat-tooltip';
  document.body.appendChild(tooltip);

  window.addEventListener('resize', onResize);
  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('click', onClick);
}

/* ---------- Seats: real data, real proportions, real depth ---------- */
function buildSeats() {
  const byHouse = { HoR: [], NA: [] };
  DATA.members.forEach(m => byHouse[m.house]?.push(m));
  ['HoR', 'NA'].forEach(h => byHouse[h].sort((a, b) => a.party_code.localeCompare(b.party_code)));

  const seatGeo = new THREE.CylinderGeometry(0.42, 0.5, 0.62, 6);
  const materialCache = {};
  function matFor(code) {
    if (!materialCache[code]) {
      materialCache[code] = new THREE.MeshStandardMaterial({
        color: PARTY_COLOR[code] || 0x888888,
        emissive: PARTY_COLOR[code] || 0x888888,
        emissiveIntensity: 0.35,
        roughness: 0.4, metalness: 0.3,
      });
    }
    return materialCache[code];
  }

  const houseConfig = [
    { key: 'NA', rows: [10, 12.2, 14.4], baseY: 0.3, rowStep: 0.55 },
    { key: 'HoR', rows: [18, 21, 24, 27, 30], baseY: 0.9, rowStep: 0.62 },
  ];

  houseConfig.forEach(cfg => {
    const list = byHouse[cfg.key];
    const rows = cfg.rows.length;
    const totalCirc = cfg.rows.reduce((s, r) => s + r, 0);
    let idx = 0;
    cfg.rows.forEach((r, rowI) => {
      const seatsInRow = Math.round(list.length * (r / totalCirc));
      const count = rowI === rows - 1 ? list.length - idx : seatsInRow;
      const y = cfg.baseY + rowI * cfg.rowStep;
      for (let i = 0; i < count && idx < list.length; i++, idx++) {
        const m = list[idx];
        const t = count === 1 ? 0.5 : i / (count - 1);
        const angle = Math.PI * (0.99 - t * 0.98);
        const x = r * Math.cos(angle);
        const z = -2 - r * Math.sin(angle) * 0.62;
        const seat = new THREE.Mesh(seatGeo, matFor(m.party_code));
        seat.position.set(x, y, z);
        seat.rotation.y = angle;
        seat.userData = { id: m.id, name_ne: m.name_ne, name_en: m.name_en, district: m.district, party_code: m.party_code, house: m.house, role: m.role, baseY: y, baseScale: 1 };
        scene.add(seat);
        seatMeshes.push(seat);
      }
    });
  });
}

/* ---------- Cinematic entrance ---------- */
let introDone = false;
function flyIn() {
  const from = { x: 0, y: 70, z: 100, tx: 0, ty: 6, tz: -10 };
  camera.position.set(from.x, from.y, from.z);
  if (reducedMotion) {
    camera.position.set(0, 7.5, 21);
    controls.target.set(0, 5, -6);
    controls.update();
    introDone = true;
    return;
  }
  const state = { y: from.y, z: from.z };
  gsap.to(state, {
    y: 7.5, z: 21, duration: 3.4, ease: 'power3.inOut',
    onUpdate: () => {
      camera.position.set(0, state.y, state.z);
      controls.update();
    },
    onComplete: () => { introDone = true; }
  });
}

/* ---------- Interaction ---------- */
function onPointerMove(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  lastPointer = { x: e.clientX, y: e.clientY };
}
let lastPointer = { x: 0, y: 0 };

function onClick() {
  if (hoveredSeat) window.location.href = `member.html?id=${hoveredSeat.userData.id}`;
}

function updateHover() {
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(seatMeshes);
  if (hits.length) {
    const seat = hits[0].object;
    if (hoveredSeat !== seat) {
      if (hoveredSeat) resetSeat(hoveredSeat);
      hoveredSeat = seat;
      gsap.to(seat.scale, { x: 1.9, y: 1.9, z: 1.9, duration: 0.2 });
      seat.material.emissiveIntensity = 1.1;
    }
    const m = seat.userData;
    tooltip.innerHTML = `
      <span class="t-name-ne">${m.name_ne}</span>
      <span class="t-name-en">${m.name_en} · ${m.district}</span>
      <span class="t-meta">${m.party_code} · ${m.house}${m.role ? ' · ' + m.role : ''}</span>
    `;
    tooltip.style.left = Math.min(lastPointer.x + 16, window.innerWidth - 240) + 'px';
    tooltip.style.top = Math.max(lastPointer.y - 10, 10) + 'px';
    tooltip.classList.add('show');
    document.body.style.cursor = 'pointer';
  } else if (hoveredSeat) {
    resetSeat(hoveredSeat);
    hoveredSeat = null;
    tooltip.classList.remove('show');
    document.body.style.cursor = 'default';
  }
}
function resetSeat(seat) {
  gsap.to(seat.scale, { x: 1, y: 1, z: 1, duration: 0.25 });
  seat.material.emissiveIntensity = 0.35;
}

/* ---------- Scroll dolly: moving through the room as you scroll ---------- */
function setupScrollDolly() {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.create({
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.6,
    onUpdate: self => { scrollProgress = self.progress; }
  });
  document.querySelectorAll('[data-reveal]').forEach(el => {
    gsap.fromTo(el, { opacity: 0, y: 28 }, {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });
  ScrollTrigger.create({
    trigger: '#party-bars', start: 'top 80%', once: true,
    onEnter: () => document.querySelectorAll('.fill').forEach(f => { f.style.width = f.dataset.w + '%'; })
  });
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

/* ---------- Render loop ---------- */
let baseRadius = null;
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  if (introDone) {
    controls.target.y = 5 + scrollProgress * 4;
    controls.update();

    // scroll dolly: pull back along the current view direction as the page scrolls,
    // so it reads as walking backward out of the chamber rather than a camera cut.
    // baseRadius is captured once, right when the intro finishes and controls take over,
    // so it reflects the resting shot, not the intro's starting distance.
    if (baseRadius === null) baseRadius = camera.position.distanceTo(controls.target);
    const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
    const radius = baseRadius + scrollProgress * 22;
    camera.position.copy(controls.target).addScaledVector(dir, radius);
  }
  // during the intro, flyIn() owns camera.position entirely, animate() just renders

  updateHover();
  composer.render(dt);
}

(async function init() {
  await loadData();
  initScene();
  renderStats();
  renderLeadership();
  setupSearch();
  setupScrollDolly();
  flyIn();
  animate();
  gsap.from('.hero .eyebrow, .hero h1, .hero p.lede, .hero-search, .hero-cta', {
    opacity: 0, y: 20, duration: 0.9, stagger: 0.09, ease: 'power3.out', delay: 0.6
  });
})();

/* ---------- Stats / leadership / search (unchanged data logic) ---------- */
function renderStats() {
  const s = DATA.statistics;
  document.getElementById('stat-total').textContent = s.total_members;
  document.getElementById('stat-hor').textContent = s.by_house.HoR;
  document.getElementById('stat-na').textContent = s.by_house.NA;
  document.getElementById('stat-committees').textContent = '16';
  const container = document.getElementById('party-bars');
  const entries = Object.entries(s.by_party).sort((a, b) => b[1] - a[1]);
  const max = entries[0][1];
  container.innerHTML = entries.map(([code, count]) => `
    <div class="party-bar-row">
      <span style="color:#${PARTY_COLOR[code].toString(16).padStart(6,'0')}">${code}</span>
      <span class="track"><span class="fill" data-w="${(count / max * 100).toFixed(1)}" style="background:#${PARTY_COLOR[code].toString(16).padStart(6,'0')}"></span></span>
      <span class="count">${count}</span>
    </div>
  `).join('');
}
function renderLeadership() {
  document.getElementById('lead-grid').innerHTML = DATA.leadership.map(l => `
    <div class="lead-card">
      <div class="role">${l.role_ne}</div>
      <div class="name-ne">${l.name_ne}</div>
      <div class="name-en">${l.name_en}</div>
      <div class="phone">${l.office_phone || 'N/A'}</div>
    </div>
  `).join('');
}
function setupSearch() {
  const input = document.getElementById('hero-search-input');
  const results = document.getElementById('hero-search-results');
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { results.classList.remove('open'); results.innerHTML = ''; return; }
    const matches = DATA.members.filter(m =>
      m.name_en.toLowerCase().includes(q) || m.name_ne.includes(q) || m.district.toLowerCase().includes(q) || m.district.includes(q)
    ).slice(0, 8);
    results.innerHTML = matches.map(m => `
      <a class="result-row" href="member.html?id=${m.id}">
        <span class="party-dot" style="background:#${(PARTY_COLOR[m.party_code]||0x888888).toString(16).padStart(6,'0')}"></span>
        <span>${m.name_ne} <span class="r-en">${m.name_en} · ${m.district}</span></span>
      </a>
    `).join('') || `<div class="result-row">No matches</div>`;
    results.classList.add('open');
  });
  document.addEventListener('click', e => { if (!e.target.closest('.hero-search')) results.classList.remove('open'); });
}
