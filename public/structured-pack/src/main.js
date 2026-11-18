import { PACK_BRAND, PACK_THEMES, RARITY_META, MASCOT_CONFIG, CARD_POOL, QUESTION_CATEGORIES } from './cards-config.js';
import { createSoundController } from './sound.js';

const $ = (sel) => document.querySelector(sel);
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const rand = (min, max) => min + Math.random() * (max - min);
const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];

const stageEl = $('#stage');
const scene = $('#scene');
const pack = $('#pack');
const packAura = $('#packAura');
const tearFlap = $('#tearFlap');
const grabZone = $('#grabZone');
const groundShadow = $('#groundShadow');
const shakeBtn = $('#shakeBtn');
const flipAllBtn = $('#flipAllBtn');
const againBtn = $('#againBtn');
const muteBtn = $('#muteBtn');
const themeModeBtn = $('#themeModeBtn');
const themeModeLabel = $('#themeModeLabel');
const gestureHint = $('#gestureHint');
const liveStatus = $('#liveStatus');
const lightJet = $('#lightJet');
const jetAnchor = $('#jetAnchor');
const confettiCanvas = $('#confettiCanvas');
const ctx2d = confettiCanvas.getContext('2d');

const binderBtn = $('#binderBtn');
const binderCountEl = $('#binderCount');
const pityBadge = $('#pityBadge');
const pityTextEl = $('#pityText');
const pityPips = [...pityBadge.querySelectorAll('.pity-pip')];
const luckBtn = $('#luckBtn');
const luckLabel = $('#luckLabel');
const pullBanner = $('#pullBanner');
const bannerKicker = $('#bannerKicker');
const bannerTitle = $('#bannerTitle');

const binderModal = $('#binderModal');
const binderBackdrop = $('#binderBackdrop');
const binderGrid = $('#binderGrid');
const binderStatsText = $('#binderStatsText');
const closeBinderBtn = $('#closeBinderBtn');
const resetBinderBtn = $('#resetBinderBtn');

const pouchFaces = [...pack.querySelectorAll(':scope > .pouch-face')];
const bodyLip = $('#bodyLip');
const editionTag = $('#editionTag');
const mascotSlot = $('#mascotSlot');

// 初始化品牌文案
$('#brandLogo').textContent = PACK_BRAND.logo;
$('#backLogo').textContent = PACK_BRAND.logo;
$('#tearLabel').textContent = PACK_BRAND.tearHint;
$('#footLeft').textContent = PACK_BRAND.footerLeft;
$('#footRight').textContent = PACK_BRAND.footerRight;
$('#microSpec').textContent = PACK_BRAND.microSpec;
$('#backBlurb').innerHTML = PACK_BRAND.backHeadline.replace(/\n/g, '<br>');
$('#backSpec').textContent = PACK_BRAND.backSpec;

const sound = createSoundController();
muteBtn.setAttribute('aria-pressed', String(sound.isMuted));
muteBtn.addEventListener('click', () => {
  const nowMuted = sound.toggleMute();
  muteBtn.setAttribute('aria-pressed', String(nowMuted));
});

/* ---------- 舞台灯光主题切换（默认暗房聚光 / 可切换白昼展台） ---------- */
const LIGHT_STORAGE_KEY = 'fenhao-pack-lighting';
function applyStudioLight(mode) {
  const next = mode === 'day' ? 'day' : 'dark';
  document.documentElement.dataset.studioLight = next;
  themeModeLabel.textContent = next === 'dark' ? '暗房聚光' : '白昼展台';
  try {
    localStorage.setItem(LIGHT_STORAGE_KEY, next);
  } catch {}
}
try {
  const savedLight = localStorage.getItem(LIGHT_STORAGE_KEY);
  applyStudioLight('day');
} catch {
  applyStudioLight('day');
}
themeModeBtn.addEventListener('click', () => {
  sound.call('click');
  const current = document.documentElement.dataset.studioLight;
  applyStudioLight(current === 'dark' ? 'day' : 'dark');
});

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

/* ---------- 图鉴存档与保底状态（localStorage 持久化） ---------- */
const STORAGE_KEY = 'smkt-pack-binder-v2';
const PITY_THRESHOLD = 3; // 每 3 包必出 Ultra / Secret

const FOIL_VARIANTS = [
  { key: 'reverse', label: '逆闪异画' },
  { key: 'prism', label: '棱镜星尘' },
];

function loadBinderState() { return { packsOpened: 0, pitySinceUltra: 0, owned: {} }; }

let binderState = loadBinderState();
let luckArmed = false;
let currentPackRoll = null; // { entries: [{ def, foilVariant }], isGodPack, maxRank, topRarity }
let bannerHideTimer = null;
let peekAuraTimer = null;

function saveBinderState() {}
function recordCardUnlock() { return false; }
function updateHud() {}

function showPullBanner(kicker, title, durationMs = 2900) {
  clearTimeout(bannerHideTimer);
  bannerKicker.textContent = kicker;
  bannerTitle.textContent = title;
  pullBanner.hidden = false;
  bannerHideTimer = setTimeout(() => {
    pullBanner.hidden = true;
  }, durationMs);
}

/* ---------- 抽卡权重与欧皇包生成器 ---------- */
const POOL_BY_RARITY = {
  common: CARD_POOL.filter((c) => c.rarity === 'common'),
  rare: CARD_POOL.filter((c) => c.rarity === 'rare'),
  holo: CARD_POOL.filter((c) => c.rarity === 'holo'),
  ultra: CARD_POOL.filter((c) => c.rarity === 'ultra'),
  secret: CARD_POOL.filter((c) => c.rarity === 'secret'),
};

function rollRarityByWeights(weights) {
  const total = weights.reduce((acc, [, w]) => acc + w, 0);
  let r = Math.random() * total;
  for (const [key, w] of weights) {
    r -= w;
    if (r <= 0) return key;
  }
  return weights[weights.length - 1][0];
}

const lastQuestionByCategory = new Map();
function generatePackRoll() {
  const entries = QUESTION_CATEGORIES.map((category, idx) => {
    const pool = category.questions.filter(q => q !== lastQuestionByCategory.get(category.id));
    const question = pickOne(pool.length ? pool : category.questions);
    lastQuestionByCategory.set(category.id, question);
    return { def: { ...CARD_POOL[idx], question }, foilVariant: null };
  });
  return { entries, isGodPack: false, maxRank: 1, topRarity: 'common' };
}

/* ---------- 角色表情矢量生成 ---------- */
function eyeSvg() {
  return `<svg class="rig-pupil" viewBox="0 0 24 28" aria-hidden="true">
    <ellipse cx="12" cy="14" rx="9.5" ry="11.5" fill="#1b1417"/>
    <circle cx="8.5" cy="9.5" r="3.3" fill="#ffffff"/>
    <circle cx="15.5" cy="18.2" r="1.4" fill="#ffffff" fill-opacity="0.85"/>
  </svg>`;
}

function mouthSvg() {
  return `<svg viewBox="0 0 28 14" width="100%" height="100%" aria-hidden="true">
    <path d="M4 4.5 Q14 13 24 4.5" fill="none" stroke="#1b1417" stroke-width="3.2" stroke-linecap="round"/>
  </svg>`;
}

function joyOverlaySvg(rig) {
  const lx = rig.eyeLeft.x + rig.eyeLeft.size * 0.5;
  const ly = rig.eyeLeft.y + rig.eyeLeft.size * 0.55;
  const rx = rig.eyeRight.x + rig.eyeRight.size * 0.5;
  const ry = rig.eyeRight.y + rig.eyeRight.size * 0.55;
  const mx = rig.mouth.x + rig.mouth.width * 0.5;
  const my = rig.mouth.y + 1.5;
  const r = rig.eyeLeft.size * 0.48;
  return `<svg class="rig-joy" viewBox="0 0 100 100" aria-hidden="true">
    <ellipse cx="${(lx - r * 0.9).toFixed(1)}" cy="${(ly + r * 1.05).toFixed(1)}" rx="${(r * 0.85).toFixed(1)}" ry="${(r * 0.48).toFixed(1)}" fill="#ff6b8b" fill-opacity="0.45"/>
    <ellipse cx="${(rx + r * 0.9).toFixed(1)}" cy="${(ry + r * 1.05).toFixed(1)}" rx="${(r * 0.85).toFixed(1)}" ry="${(r * 0.48).toFixed(1)}" fill="#ff6b8b" fill-opacity="0.45"/>
    <path d="M${(lx - r).toFixed(1)} ${(ly + r * 0.2).toFixed(1)} Q${lx.toFixed(1)} ${(ly - r * 1.05).toFixed(1)} ${(lx + r).toFixed(1)} ${(ly + r * 0.2).toFixed(1)}" fill="none" stroke="#1b1417" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M${(rx - r).toFixed(1)} ${(ry + r * 0.2).toFixed(1)} Q${rx.toFixed(1)} ${(ry - r * 1.05).toFixed(1)} ${(rx + r).toFixed(1)} ${(ry + r * 0.2).toFixed(1)}" fill="none" stroke="#1b1417" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M${(mx - 4.2).toFixed(1)} ${my.toFixed(1)} Q${mx.toFixed(1)} ${(my + 6.2).toFixed(1)} ${(mx + 4.2).toFixed(1)} ${my.toFixed(1)} Z" fill="#d9385a" stroke="#1b1417" stroke-width="1.8" stroke-linejoin="round"/>
  </svg>`;
}

function ouchOverlaySvg(rig) {
  const lx = rig.eyeLeft.x + rig.eyeLeft.size * 0.5;
  const ly = rig.eyeLeft.y + rig.eyeLeft.size * 0.55;
  const rx = rig.eyeRight.x + rig.eyeRight.size * 0.5;
  const ry = rig.eyeRight.y + rig.eyeRight.size * 0.55;
  const mx = rig.mouth.x + rig.mouth.width * 0.5;
  const my = rig.mouth.y + 2.2;
  const s = rig.eyeLeft.size * 0.46;
  return `<svg class="rig-ouch" viewBox="0 0 100 100" aria-hidden="true">
    <path d="M${(lx - s).toFixed(1)} ${(ly - s * 0.75).toFixed(1)} L${(lx + s * 0.85).toFixed(1)} ${ly.toFixed(1)} L${(lx - s).toFixed(1)} ${(ly + s * 0.75).toFixed(1)}" fill="none" stroke="#1b1417" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${(rx + s).toFixed(1)} ${(ry - s * 0.75).toFixed(1)} L${(rx - s * 0.85).toFixed(1)} ${ry.toFixed(1)} L${(rx + s).toFixed(1)} ${(ry + s * 0.75).toFixed(1)}" fill="none" stroke="#1b1417" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${(mx - 4.6).toFixed(1)} ${(my + 1.2).toFixed(1)} Q${(mx - 2.3).toFixed(1)} ${(my - 1.6).toFixed(1)} ${mx.toFixed(1)} ${(my + 1.2).toFixed(1)} T${(mx + 4.6).toFixed(1)} ${(my + 1.2).toFixed(1)}" fill="none" stroke="#1b1417" stroke-width="2.2" stroke-linecap="round"/>
  </svg>
  <svg class="rig-sweat" style="left:${rig.sweat.x}%;top:${rig.sweat.y}%;width:${rig.sweat.width}%" viewBox="0 0 20 28" aria-hidden="true">
    <path d="M10 1 C10 1 18 12 18 18.5 A8 8 0 1 1 2 18.5 C2 12 10 1 10 1 Z" fill="#5ce1ff" stroke="#1b6ca8" stroke-width="1.4"/>
    <ellipse cx="7.2" cy="17" rx="2" ry="3.2" fill="#ffffff" fill-opacity="0.8"/>
  </svg>`;
}

function buildRigMarkup(rig, { withShadow = false, withOuch = false, withJoy = false } = {}) {
  const shadow = withShadow ? `<img class="char-drop-shadow" src="${rig.image}" alt="">` : '';
  const body = `<img class="char-body" src="${rig.image}" alt="">`;
  if (rig.rigged === false) return shadow + body;

  const eyeL = `<i class="rig-eye" style="left:${rig.eyeLeft.x}%;top:${rig.eyeLeft.y}%;width:${rig.eyeLeft.size}%">${eyeSvg()}</i>`;
  const eyeR = `<i class="rig-eye" style="left:${rig.eyeRight.x}%;top:${rig.eyeRight.y}%;width:${rig.eyeRight.size}%">${eyeSvg()}</i>`;
  const mouth = `<i class="rig-mouth" style="left:${rig.mouth.x}%;top:${rig.mouth.y}%;width:${rig.mouth.width}%">${mouthSvg()}</i>`;
  const joy = withJoy ? joyOverlaySvg(rig) : '';
  const ouch = withOuch ? ouchOverlaySvg(rig) : '';
  return shadow + body + eyeL + eyeR + mouth + joy + ouch;
}

function triggerBlink(eyeElements, count = 1) {
  for (const el of eyeElements) {
    el.animate(
      [{ scale: '1 1' }, { scale: '1 0.08' }, { scale: '1 1' }],
      { duration: 165, iterations: count, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' }
    );
  }
}

// 装配封面吉祥物并预解码全部贴图
mascotSlot.innerHTML = '';
$('#drawBtn')?.addEventListener('click', () => grabZone.click());
const packEyes = [...mascotSlot.querySelectorAll('.rig-eye')];
const packPupils = [...mascotSlot.querySelectorAll('.rig-pupil')];

const preloadedImages = [
  MASCOT_CONFIG.image,
  ...CARD_POOL.flatMap((c) => [c.fullArtImage, c.character?.image].filter(Boolean)),
].map((src) => {
  const img = new Image();
  img.src = src;
  img.decode?.().catch(() => {});
  return img;
});
void preloadedImages;

/* ---------- 阻尼弹簧求解器 ---------- */
class SpringValue {
  constructor(initial = 0, response = 0.5, bounce = 0) {
    this.x = initial;
    this.to = initial;
    this.v = 0;
    this.configure(response, bounce);
  }
  configure(response, bounce = 0) {
    const omega = (2 * Math.PI) / response;
    this.k = omega * omega;
    this.c = (4 * Math.PI * (1 - bounce)) / response;
    return this;
  }
  step(dt) {
    this.v += (this.k * (this.to - this.x) - this.c * this.v) * dt;
    this.x += this.v * dt;
  }
}

function createSpringGroup(initObj, response, bounce) {
  const out = {};
  for (const [k, val] of Object.entries(initObj)) {
    out[k] = new SpringValue(val, response, bounce);
  }
  return out;
}

/* ---------- 袋身圆润侧边切片 ---------- */
const polyFromPoints = (pts) => `polygon(${pts.map(([x, y]) => `${(+x).toFixed(2)}% ${(+y).toFixed(2)}%`).join(',')})`;
const mirrorPointsX = (pts) => pts.map(([x, y]) => [100 - x, y]);

const gussetSlices = [];
for (const sideSign of [-1, 1]) {
  for (const angleDeg of [80, 60, 40, 20, 0, -20, -40, -60, -80]) {
    const rad = (angleDeg * Math.PI) / 180;
    const depthRatio = (1 - Math.sin(rad)) / 2;
    const baseW = 4;
    const bulgeW = 5 * Math.cos(rad);
    const el = document.createElement('i');
    const curve = Array.from({ length: 13 }, (_, i) => [
      ((baseW + bulgeW * Math.pow(Math.sin((Math.PI * i) / 12), 0.8)) / (baseW + bulgeW)) * 100,
      (i / 12) * 100,
    ]);
    const shape = [[0, 0], ...curve, [0, 100]];
    const mixTone = sideSign > 0 ? `#000 ${(10 + depthRatio * 40).toFixed(0)}%` : `#fff ${(45 * (1 - depthRatio)).toFixed(0)}%`;
    const topInset = 11.5 + depthRatio * 13;

    el.className = 'gusset-slice';
    el.style.cssText =
      `${sideSign > 0 ? 'left' : 'right'}:calc(50% + var(--pack-w)*0.476 - ${baseW}px);` +
      `width:${(baseW + bulgeW).toFixed(2)}px;` +
      `top:${topInset.toFixed(2)}%;bottom:${topInset.toFixed(2)}%;` +
      `transform:translateZ(calc(var(--pack-depth)*${(Math.sin(rad) / 2).toFixed(3)}));` +
      `clip-path:${polyFromPoints(sideSign > 0 ? shape : mirrorPointsX(shape))};` +
      `background:color-mix(in srgb, var(--pack-color), ${mixTone});`;

    pack.insertBefore(el, tearFlap);
    gussetSlices.push({ el, sideSign, defaultTop: topInset });
  }
}

/* ---------- 封口随机反光折痕与底部褶皱阴影 ---------- */
const inlineSvgUrl = (inner) =>
  `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'>${inner}</svg>")`;

function randomizeFoilShading(styleTarget) {
  const fmt = (n) => n.toFixed(2);
  let streaks = '';
  for (let x = 0; x < 100; ) {
    const w = rand(0.5, 2.5);
    streaks += `<rect x='${fmt(x)}' y='6.8' width='${fmt(w)}' height='${fmt(rand(3.2, 8.4))}' fill='url(%23g)' fill-opacity='${fmt(rand(0.08, 0.42))}'/>`;
    x += w + rand(0, 1.4);
  }
  let foldPath = 'M0 93.2V91.6';
  for (let x = 0; x < 100; ) {
    const w = rand(2.5, 6.8);
    const peak = x + w * rand(0.35, 0.65);
    x = Math.min(100, x + w);
    foldPath += `Q${fmt(peak)} ${fmt(rand(86.6, 90.0))} ${fmt(x)} ${fmt(rand(91.1, 91.7))}`;
  }

  styleTarget.setProperty(
    '--foil-shine',
    inlineSvgUrl(
      `<linearGradient id='g' x2='0' y2='1'><stop stop-color='%23fff' stop-opacity='.72'/><stop offset='1' stop-color='%23fff' stop-opacity='0'/></linearGradient>` +
      `<filter id='b'><feGaussianBlur stdDeviation='.28 .5'/></filter><g filter='url(%23b)'>${streaks}</g>`
    )
  );
  styleTarget.setProperty(
    '--foil-shade',
    inlineSvgUrl(`<filter id='b'><feGaussianBlur stdDeviation='.35 .24'/></filter><path d='${foldPath}V93.2Z' fill-opacity='.11' filter='url(%23b)'/>`)
  );
}

/* ---------- 96 段可偏折锯齿撕裂几何 + 12 段卷曲封条 ---------- */
const TEAR_BASE_Y = 10.6;
const TEAR_SEGMENTS = 96;
const STRIP_SLICES = isCoarsePointer ? 8 : 12;
const TEAR_MIN_Y = 8.0;
const TEAR_MAX_Y = 19.5;

const stripSegments = Array.from({ length: STRIP_SLICES }, () => {
  const el = document.createElement('div');
  el.className = 'strip-segment';
  el.hidden = true;
  el.innerHTML =
    `<div class="pouch-face front"><span class="tear-label">${PACK_BRAND.tearHint}</span><i class="foil-lip"></i><i class="curl-shade"></i></div>` +
    `<div class="pouch-face foil-lining"><i class="curl-shade"></i></div>`;
  tearFlap.append(el);
  const [frontEl, liningEl] = el.children;
  return {
    el,
    frontEl,
    liningEl,
    lipEl: frontEl.querySelector('.foil-lip'),
    frontShade: frontEl.querySelector('.curl-shade'),
    backShade: liningEl.querySelector('.curl-shade'),
    locked: false,
  };
});

let tearVertices = [];
let curlTightness = 1;

function applyVertexBend(vert, bendOffset) {
  vert[5] = bendOffset;
  vert[1] = clamp(vert[2] + bendOffset, TEAR_MIN_Y, TEAR_MAX_Y) + vert[3];
}

function generateTearLine() {
  curlTightness = rand(0.7, 1.38);
  const slope = rand(-7.0, 7.0);
  const arch = rand(-2.8, 2.8);
  const waveFreq = rand(1.6, 3.4);
  const wavePhase = rand(0, Math.PI * 2);
  const waveAmp = rand(0.3, 1.05);
  const startY = rand(10.6, 13.8);
  let drift = 0;

  tearVertices = Array.from({ length: TEAR_SEGMENTS + 1 }, (_, i) => {
    const x = (i / TEAR_SEGMENTS) * 100;
    const normX = x / 50 - 1;
    drift = clamp(drift + rand(-0.24, 0.24) + (Math.random() < 0.05 ? rand(-1.4, 1.4) : 0), -2.1, 2.1);
    const px = i > 0 && i < TEAR_SEGMENTS ? x + rand(-0.28, 0.28) : x;
    const baseY = startY + slope * normX + arch * (1 - normX * normX) + waveAmp * Math.sin(normX * waveFreq * Math.PI + wavePhase) + drift;
    const microTooth = rand(-0.4, 0.4) + (Math.random() < 0.14 ? rand(-1.15, 1.15) : 0);
    const lipWidth = Math.random() < 0.12 ? rand(1.2, 2.05) : rand(0.36, 1.08);
    const v = [px, 0, baseY, microTooth, lipWidth, 0];
    applyVertexBend(v, 0);
    return v;
  });
}

function tearYAt(xPercent) {
  const f = (clamp(xPercent, 0, 100) / 100) * TEAR_SEGMENTS;
  const idx = Math.min(TEAR_SEGMENTS - 1, Math.floor(f));
  return tearVertices[idx][1] + (tearVertices[idx + 1][1] - tearVertices[idx][1]) * (f - idx);
}

function steerRemainingTear(steerSlope, progress, dir) {
  const pivotIdx = clamp(Math.round((dir > 0 ? progress : 1 - progress) * TEAR_SEGMENTS), 0, TEAR_SEGMENTS);
  for (let i = pivotIdx + dir; i >= 0 && i <= TEAR_SEGMENTS; i += dir) {
    const dist = (Math.abs(i - pivotIdx) * 100) / TEAR_SEGMENTS;
    applyVertexBend(tearVertices[i], tearVertices[pivotIdx][5] + steerSlope * dist);
  }
}

const buildLipBand = (pts, dirSign) => [
  ...pts,
  ...pts.slice().reverse().map((q) => [q[0], q[1] + dirSign * q[4]]),
];

/* ---------- 舞台状态变量 ---------- */
const packPose = createSpringGroup({ x: 0, y: 0, rx: 0, ry: 0, rz: 0 }, 0.7, 0.28);
const pupilOffset = createSpringGroup({ x: 0, y: 0 }, 0.18, 0.3);
const tearState = {
  p: new SpringValue(0, 0.1),
  zAngle: new SpringValue(0, 0.28, 0.35),
  xAngle: new SpringValue(0, 0.3, 0.2),
  dir: 1,
  prevP: 0,
};
const squeezeSpring = new SpringValue(0, 0.3, 0.45);
const jetGlowSpring = new SpringValue(0, 0.5);

const pointer = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  prevX: window.innerWidth / 2,
  inside: false,
  down: false,
  isTouch: false,
  tapped: false,
};

let stageState = 'enter';
let currentTheme = null;
let enterTimer = null;
let dragSession = null;
let didDragMove = false;
let openedByKeyboard = false;
let packFall = null;
let stripFlight = null;
let jetAnchorFrozen = { y: 0, rx: 0, ry: 0, rz: 0, sq: 0 };
let cards = [];
let zoomedCard = null;
let showcaseCard = null;
let confettiBits = [];
let sparkParticles = [];
let shockRings = [];
let confettiDirty = false;
let clockSec = 0;
let lastFrameMs = performance.now();
let openedAtSec = 0;
let orbitStartedAt = 0;
let nextBlinkSec = 2.4;
let nextIdleNudgeSec = 5.0;
let lastShakeAtSec = -2;
let pointerShakeEnergy = 0;
let sparkCarry = 0;
let packWidth = 280;
let packHeight = 406;

function measureStage() {
  packWidth = pack.offsetWidth || 280;
  packHeight = pack.offsetHeight || 406;
  const dpr = Math.min(isCoarsePointer ? 1.5 : 2, window.devicePixelRatio || 1);
  confettiCanvas.width = Math.floor(window.innerWidth * dpr);
  confettiCanvas.height = Math.floor(window.innerHeight * dpr);
}

function updateTearClips(p) {
  const d = tearState.dir;
  const tipX = d > 0 ? p * 100 : 100 - p * 100;
  const tipY = tearYAt(tipX);
  const tipVert = [tipX, tipY, 0, 0, 0];

  const tornPart = tearVertices.filter(([x]) => (d > 0 ? x < tipX : x > tipX));
  const bodyPoly =
    d > 0
      ? [[tipX, 0], [100, 0], [100, 100], [0, 100], ...tornPart, [tipX, tipY]]
      : [[0, 0], [tipX, 0], [tipX, tipY], ...tornPart, [100, 100], [0, 100]];

  pouchFaces[0].style.clipPath = polyFromPoints(bodyPoly);
  pouchFaces[1].style.clipPath = polyFromPoints(mirrorPointsX(bodyPoly));
  bodyLip.style.clipPath = polyFromPoints(buildLipBand(d > 0 ? [...tornPart, tipVert] : [tipVert, ...tornPart], 1));

  for (const g of gussetSlices) {
    const edgeX = g.sideSign > 0 ? 100 : 0;
    if (d > 0 ? edgeX <= tipX : edgeX >= tipX) {
      g.el.style.top = Math.max(g.defaultTop, tearYAt(edgeX) + 1.4).toFixed(2) + '%';
    }
  }

  tearFlap.style.transformOrigin = `${tipX}% ${tipY}%`;
  const sliceW = 100 / STRIP_SLICES;
  const seamOverlap = 0.25;

  stripSegments.forEach((seg, idx) => {
    const lo = d > 0 ? idx * sliceW : Math.max(idx * sliceW, tipX);
    const hi = d > 0 ? Math.min((idx + 1) * sliceW, tipX) : (idx + 1) * sliceW;
    if (hi <= lo) {
      seg.el.hidden = true;
      return;
    }
    seg.el.hidden = false;
    if (!seg.locked) {
      const leftEdge = d < 0 && lo === tipX ? lo : Math.max(0, lo - seamOverlap);
      const rightEdge = d > 0 && hi === tipX ? hi : Math.min(100, hi + seamOverlap);
      const span = [
        [leftEdge, tearYAt(leftEdge), 0, 0, 0.8],
        ...tearVertices.filter((q) => q[0] > leftEdge && q[0] < rightEdge),
        [rightEdge, tearYAt(rightEdge), 0, 0, 0.8],
      ];
      const flapPoly = [[leftEdge, 0], [rightEdge, 0], ...span.slice().reverse()];
      seg.frontEl.style.clipPath = polyFromPoints(flapPoly);
      seg.liningEl.style.clipPath = polyFromPoints(mirrorPointsX(flapPoly));
      seg.lipEl.style.clipPath = polyFromPoints(buildLipBand(span, -1));
      seg.locked = d > 0 ? hi < tipX || tipX >= 100 : lo > tipX || tipX <= 0;
    }
  });

  const activeSlice = clamp(Math.floor((d > 0 ? tipX - 1e-6 : tipX) / sliceW), 0, STRIP_SLICES - 1);
  const curlBase = (2.6 + 2.6 * p) * curlTightness;
  const flutter = Math.min(1, Math.abs(tearState.p.v) * 0.4) * 1.6;
  let matrixChain = '';
  let totalAngle = 0;

  for (let n = 0, k = activeSlice; k >= 0 && k < STRIP_SLICES; n++, k -= d) {
    const hingePx = (((n ? (d > 0 ? k + 1 : k) * sliceW : tipX) / 100) * packWidth).toFixed(2);
    const degY = d * (curlBase * (0.4 + 0.3 * n) + Math.sin(clockSec * 16 + n * 0.9) * flutter);
    const degZ = (d * 0.9 * n) / 4;
    totalAngle += degY;
    matrixChain += `translateX(${hingePx}px) rotateY(${degY.toFixed(2)}deg) rotateZ(${degZ.toFixed(2)}deg) translateX(-${hingePx}px) `;

    const seg = stripSegments[k];
    seg.el.style.transform = matrixChain;
    seg.frontShade.style.opacity = Math.min(0.5, Math.abs(totalAngle) / 200).toFixed(2);
    seg.backShade.style.opacity = Math.max(0, 0.34 - Math.abs(totalAngle) / 420).toFixed(2);
  }
}

/* ---------- 袋口 32 道矢量彩虹流光 ---------- */
const RAINBOW_PALETTE = ['#ff3d6e', '#ff8a3d', '#ffd34d', '#4fd9a0', '#4fb2ff', '#8b6cff', '#ff5cc8'];
const RIBBON_COUNT = 32;
const JET_ORIGIN_Y = 107.5;
const JET_SPAN = 1500;
const JET_TIP = 36;
const JET_STEP = isCoarsePointer ? 3.5 : 2.5;

let jetEdges = [];
let jetRibbons = [];
let jetMotes = [];
let bandPaths = [];
let seamPaths = [];
let fadeStops = [];
let jetReach = 0;
let jetDrained = false;
let jetStartY = 62.5;
let jetRadius0 = 45;

const lightenHex = (hex, ratio) =>
  '#' +
  [1, 3, 5]
    .map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - ratio) + 255 * ratio).toString(16).padStart(2, '0'))
    .join('');

function initLightJet() {
  const colorOffset = Math.floor(rand(0, 7));
  const unit = packWidth / 100;
  jetStartY = 62.5 + (((TEAR_MAX_Y - TEAR_BASE_Y) / 100) * packHeight) / unit;
  jetRadius0 = JET_ORIGIN_Y - jetStartY;

  jetEdges = Array.from({ length: RIBBON_COUNT + 1 }, (_, j) => {
    const ox = 3 + (94 * j) / RIBBON_COUNT;
    const x = 50 + ((ox - 50) * jetRadius0) / 45;
    const angle = Math.atan2(x - 50, jetRadius0) + rand(-0.012, 0.012);
    return { ox, x, ux: Math.sin(angle), uy: -Math.cos(angle), phase: j * 0.35 + rand(-0.1, 0.1), r: Math.hypot(x - 50, jetRadius0) };
  });

  jetRibbons = Array.from({ length: RIBBON_COUNT }, (_, j) => {
    const r = (jetEdges[j].r + jetEdges[j + 1].r) / 2;
    return {
      midX: (jetEdges[j].ox + jetEdges[j + 1].ox) / 2,
      gradX: (jetEdges[j].x + jetEdges[j + 1].x) / 2,
      r,
      maxLen: 0,
      color: RAINBOW_PALETTE[(j + colorOffset) % 7],
      active: false,
      len: 0,
      growth: new SpringValue(0, 0.4, prefersReducedMotion ? 0 : 0.3),
    };
  });

  lightJet.innerHTML = `<defs>
    <radialGradient id="jetMote"><stop offset=".2" stop-color="#fff"/><stop offset=".45" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    ${jetRibbons
      .map((b, j) => {
        const ux = (jetEdges[j].ux + jetEdges[j + 1].ux) / 2;
        const uy = (jetEdges[j].uy + jetEdges[j + 1].uy) / 2;
        const hotDist = 26 + jetStartY - 62.5;
        return `<linearGradient id="jb${j}" gradientUnits="userSpaceOnUse" x1="${b.gradX.toFixed(2)}" y1="${jetStartY}" x2="${(b.gradX + ux * hotDist).toFixed(2)}" y2="${(jetStartY + uy * hotDist).toFixed(2)}"><stop stop-color="${lightenHex(b.color, 0.7)}"/><stop offset="1" stop-color="${b.color}"/></linearGradient>`;
      })
      .join('')}
    <radialGradient id="jetFadeGrad" gradientUnits="userSpaceOnUse" cx="50" cy="${jetStartY + jetRadius0}" r="${JET_SPAN}">
      <stop stop-color="#fff" stop-opacity="0"/><stop stop-color="#fff"/><stop stop-color="#fff"/><stop stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <mask id="jetFadeMask" maskUnits="userSpaceOnUse"><rect fill="url(#jetFadeGrad)"/></mask>
    <filter id="jetBloom" filterUnits="userSpaceOnUse"><feGaussianBlur stdDeviation="2.4"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <g${isCoarsePointer ? '' : ' filter="url(#jetBloom)"'}>
    <g${isCoarsePointer ? '' : ' mask="url(#jetFadeMask)"'}>
      ${jetRibbons.map((_, j) => `<path class="jet-band" fill="url(#jb${j})"/>`).join('')}
      ${isCoarsePointer ? '' : `<g fill="none" stroke="#fff" stroke-opacity=".68" stroke-width=".4">${'<path class="jet-seam"/>'.repeat(RIBBON_COUNT + 1)}</g>`}
      ${'<circle class="jet-spark" fill="url(#jetMote)"/>'.repeat(10)}
    </g>
  </g>`;

  bandPaths = [...lightJet.querySelectorAll('.jet-band')];
  seamPaths = [...lightJet.querySelectorAll('.jet-seam')];
  fadeStops = [...lightJet.querySelectorAll('#jetFadeGrad stop')];
  jetMotes = [...lightJet.querySelectorAll('.jet-spark')].map((el) => ({
    el,
    bandIdx: -1,
    u: Math.random(),
    v: rand(0.2, 0.8),
    speed: rand(0.3, 0.5),
    radius: rand(1.6, 3.0),
  }));

  fitLightJetBounds();
}

function fitLightJetBounds() {
  const unit = packWidth / 100;
  const topRoom = 2.5 + (window.innerHeight / 2 - packHeight * (0.5 - TEAR_BASE_Y / 100)) / unit;
  const halfSpanW = Math.min(window.innerWidth / 2 / unit, topRoom * 1.2 + 60) + 20;
  jetReach = prefersReducedMotion ? 45 + topRoom * 0.6 : (45 + topRoom) * Math.hypot(47 / 45, 1) + JET_TIP + 20;
  for (const b of jetRibbons) b.maxLen = jetReach - b.r;

  const bbox = { x: 50 - halfSpanW, y: 32.5 - topRoom, width: 2 * halfSpanW, height: topRoom + 60 };
  for (const el of lightJet.querySelectorAll('#jetFadeMask, #jetFadeMask rect, #jetBloom')) {
    for (const [k, val] of Object.entries(bbox)) el.setAttribute(k, val.toFixed(1));
  }
}

function stepLightJet(dt) {
  const animT = prefersReducedMotion ? 0 : clockSec;
  const tipX = tearState.dir > 0 ? tearState.p.x * 100 : 100 - tearState.p.x * 100;
  const sway = Math.sin(animT * 0.9) * 1.5;
  const released = !prefersReducedMotion && (stageState === 'open' || stageState === 'spread');
  const elapsed = clockSec - openedAtSec;
  const unit = packWidth / 100;
  const rzRad = (jetAnchorFrozen.rz * Math.PI) / 180;
  const screenRoof = 60 + ((-window.innerHeight / 2 - jetAnchorFrozen.y) / Math.cos(rzRad) + packHeight * (0.5 - TEAR_BASE_Y / 100)) / unit;

  const fullThrow = ((jetStartY + jetRadius0 - screenRoof) * jetRibbons[0].r) / jetRadius0 + JET_TIP + 20;
  const farDist = released ? jetReach + (fullThrow - jetReach) * (1 - Math.pow(1 - Math.min(1, elapsed / 0.5), 2)) : jetReach;
  const tailDist = jetRadius0 - 5 + (released ? (fullThrow + 21 - jetRadius0) * Math.pow(clamp((elapsed - 0.35) / 0.55, 0, 1), 2) : 0);
  const waveCarry = released ? (45 * elapsed * elapsed) / (elapsed + 0.25) : 0;

  for (const b of jetRibbons) {
    if (stageState === 'idle' && tearState.p.x > 0 && (tearState.dir > 0 ? b.midX < tipX : b.midX > tipX)) {
      b.active = true;
    }
    b.growth.to = b.active ? 1 : 0;
    b.len = b.maxLen * Math.max(0, b.growth.x) + farDist - jetReach;
  }

  if (!isCoarsePointer) {
    [tailDist - 16, tailDist, farDist - JET_TIP, farDist].forEach((val, idx) => {
      fadeStops[idx]?.setAttribute('offset', clamp(Math.min(val, farDist) / JET_SPAN, 0, 1).toFixed(4));
    });
  }

  const pointAlongEdge = (edgeIdx, dist) => {
    const e = jetEdges[edgeIdx];
    const k = Math.min(1, dist / 90);
    const wave = (0.4 + 2 * k) * Math.sin(((dist - waveCarry) / 22 - animT * 1.4) * Math.PI * 2 + e.phase) + sway * k;
    return [e.x + e.ux * dist - e.uy * wave, jetStartY + e.uy * dist + e.ux * wave];
  };

  const leadPad = isCoarsePointer ? 0 : 20;
  const maxSide = window.innerWidth / 2 / unit + 14;
  const snap = (n) => Math.round(n * 20) / 20;

  const sampledEdges = jetEdges.map((e, j) => {
    const stopLimit = Math.min((jetStartY - screenRoof) / -e.uy, (maxSide - Math.abs(e.x - 50)) / Math.abs(e.ux)) + 24;
    const len = Math.min(Math.max(jetRibbons[j - 1]?.len || 0, jetRibbons[j]?.len || 0), stopLimit);
    const iStart = Math.max(0, Math.floor((tailDist - leadPad - e.r) / JET_STEP));
    const pts = [];
    if (len > iStart * JET_STEP) {
      for (let i = iStart; ; i++) {
        const d = Math.min(i * JET_STEP, len);
        const [px, py] = pointAlongEdge(j, d);
        pts.push(`${snap(px)} ${snap(py)}`);
        if (d >= len) break;
      }
    }
    return { iStart, pts };
  });

  const slicePts = (edgeObj, len) => edgeObj.pts.slice(0, Math.max(0, Math.ceil(len / JET_STEP) - edgeObj.iStart + 1));

  jetRibbons.forEach((b, j) => {
    const leftPts = slicePts(sampledEdges[j], b.len);
    const rightPts = slicePts(sampledEdges[j + 1], b.len);
    bandPaths[j].setAttribute('d', leftPts.length > 1 && rightPts.length > 1 ? `M${leftPts.join('L')}L${rightPts.slice().reverse().join('L')}Z` : '');
  });

  seamPaths.forEach((el, j) => {
    el.setAttribute('d', sampledEdges[j].pts.length > 1 ? `M${sampledEdges[j].pts.join('L')}` : '');
  });

  jetDrained = released && elapsed > 0.92;

  const activeIndices = jetRibbons.flatMap((b, j) => (b.active ? [j] : []));
  for (const m of jetMotes) {
    if (!prefersReducedMotion) m.u += dt * m.speed;
    if (m.u > 1 || !jetRibbons[m.bandIdx]?.active) {
      if (m.u > 1) m.u -= 1;
      if (!activeIndices.length) {
        m.el.setAttribute('opacity', '0');
        continue;
      }
      m.bandIdx = activeIndices[Math.floor(rand(0, activeIndices.length))];
    }
    const len = jetRibbons[m.bandIdx].len;
    const d0 = Math.max(0, tailDist - jetEdges[m.bandIdx].r);
    const dist = d0 + m.u * (len - d0);
    const [x1, y1] = pointAlongEdge(m.bandIdx, dist);
    const [x2, y2] = pointAlongEdge(m.bandIdx + 1, dist);
    m.el.setAttribute('cx', (x1 + (x2 - x1) * m.v).toFixed(2));
    m.el.setAttribute('cy', (y1 + (y2 - y1) * m.v).toFixed(2));
    m.el.setAttribute('r', (m.radius * (0.6 + m.u * 0.7)).toFixed(2));
    m.el.setAttribute('opacity', (Math.sin(Math.PI * m.u) * Math.min(1, len / 20)).toFixed(2));
  }
}

/* ---------- Canvas 2D 纸屑、撕口火花与翻牌冲击波 ---------- */
const CONFETTI_SHAPES = [new Path2D(), new Path2D(), new Path2D('M0-6 1.3-1.3 6 0 1.3 1.3 0 6-1.3 1.3-6 0-1.3-1.3Z')];
CONFETTI_SHAPES[0].arc(0, 0, 4.4, 0, Math.PI * 2);
CONFETTI_SHAPES[1].roundRect(-3.4, -6, 6.8, 12, 2);

const STAR_SPARK_PATH = new Path2D('M0-7 1.4-1.4 7 0 1.4 1.4 0 7-1.4 1.4-7 0-1.4-1.4Z');

function stageToScreen(x, y, z = 0) {
  const persp = 1400 / Math.max(200, 1400 - z);
  return [
    window.innerWidth / 2 + x * persp,
    window.innerHeight * 0.4 + (window.innerHeight * 0.1 + y) * persp,
    persp,
  ];
}

function preloadConfettiPool(isGodPack = false) {
  confettiBits = [];
  const count = isCoarsePointer ? 40 : 90;
  const colors = isGodPack
    ? ['#ffd454', '#fff4b8', '#ff66dc', '#5ce6ff', '#a288ff', '#ffffff']
    : [...RAINBOW_PALETTE, '#ffffff'];
  for (let i = 0; i < count; i++) {
    confettiBits.push({ shapeIdx: i % 3, color: colors[i % colors.length] });
  }
}

function packLocalToStage(lx, ly, lz) {
  const deg = Math.PI / 180;
  const cx = Math.cos(packPose.rx.x * deg), sx = Math.sin(packPose.rx.x * deg);
  const cy = Math.cos(packPose.ry.x * deg), sy = Math.sin(packPose.ry.x * deg);
  const cz = Math.cos(packPose.rz.x * deg), sz = Math.sin(packPose.rz.x * deg);
  const x0 = ((lx - 50) / 100) * packWidth;
  const y0 = ((ly - 50) / 100) * packHeight;
  const x1 = x0 * cz - y0 * sz;
  const y1 = x0 * sz + y0 * cz;
  const x2 = x1 * cy + lz * sy;
  const z2 = -x1 * sy + lz * cy;
  return [x2 + packPose.x.x, y1 * cx - z2 * sx + packPose.y.x + (packFall ? packFall.y : 0), y1 * sx + z2 * cx];
}

function launchConfetti() {
  confettiBits.forEach((bit, i) => {
    if (bit.age !== undefined) return;
    const lx = rand(6, 94);
    const termVel = 260 + 400 * Math.pow(Math.random(), 1.5);
    Object.assign(bit, {
      insidePouch: true,
      lx,
      ly: tearYAt(lx) + rand(1, 16),
      lz: rand(4.5, 7.0),
      upSpeed: rand(900, 2550),
      spreadAngle: ((lx - 50) / 50 + rand(-0.5, 0.5)) * clamp(window.innerWidth / 1000, 0.5, 1),
      burstSpeed: rand(520, 2650),
      rot: rand(0, 360),
      spin: rand(-700, 700),
      dragCoeff: 2600 / (termVel * termVel),
      flutterAmp: rand(900, 2500),
      driftX: Math.sign(lx - 50) * rand(-180, 880),
      scale: rand(0.9, 1.85),
      phase: rand(0, Math.PI * 2),
      age: i < 48 ? 0 : -rand(0, 0.22),
      x: 0,
      y: 0,
      z: 0,
    });
  });
}

function emitScreenSparks(sx, sy, { count = 12, colors = ['#ffffff'], speedMin = 120, speedMax = 420, gravity = 680, lifeMin = 0.28, lifeMax = 0.62, scaleMin = 0.55, scaleMax = 1.25 } = {}) {
  if (prefersReducedMotion) return;
  for (let i = 0; i < count; i++) {
    const ang = rand(0, Math.PI * 2);
    const spd = rand(speedMin, speedMax);
    sparkParticles.push({
      x: sx,
      y: sy,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd - rand(20, 90),
      gravity,
      age: 0,
      life: rand(lifeMin, lifeMax),
      scale: rand(scaleMin, scaleMax),
      rot: rand(0, Math.PI * 2),
      spin: rand(-8, 8),
      color: pickOne(colors),
    });
  }
}

function spawnFlipBurst(cardObj) {
  if (prefersReducedMotion) return;
  const rarity = cardObj.def.rarity;
  const meta = RARITY_META[rarity];
  if (meta.rank <= 1 && !cardObj.foilVariant) return;

  const [sx, sy, persp] = stageToScreen(cardObj.pose.x.x, cardObj.pose.y.x, cardObj.pose.z.x + 24);
  const baseRadius = packWidth * 0.34 * persp;

  if (rarity === 'secret') {
    ['#ff5cd6', '#ffd454', '#5ce6ff'].forEach((col, i) => {
      shockRings.push({ x: sx, y: sy, r0: baseRadius * 0.35, r1: baseRadius * (2.5 + i * 0.45), age: -i * 0.055, life: 0.58, color: col, width: 4.5 - i * 0.8 });
    });
    emitScreenSparks(sx, sy, {
      count: isCoarsePointer ? 34 : 58,
      colors: ['#ffd454', '#ff66dc', '#5ce6ff', '#ffffff', '#a98cff'],
      speedMin: 180,
      speedMax: 660,
      gravity: 520,
      lifeMin: 0.42,
      lifeMax: 0.88,
      scaleMin: 0.8,
      scaleMax: 1.65,
    });
  } else if (rarity === 'ultra') {
    ['#ffd454', '#ffffff'].forEach((col, i) => {
      shockRings.push({ x: sx, y: sy, r0: baseRadius * 0.35, r1: baseRadius * (2.15 + i * 0.35), age: -i * 0.05, life: 0.5, color: col, width: 4 - i });
    });
    emitScreenSparks(sx, sy, {
      count: isCoarsePointer ? 24 : 40,
      colors: ['#ffd454', '#fff3b0', '#ff9e44', '#ffffff'],
      speedMin: 160,
      speedMax: 540,
      gravity: 560,
      lifeMin: 0.36,
      lifeMax: 0.75,
      scaleMin: 0.7,
      scaleMax: 1.45,
    });
  } else {
    const col = meta.shockColor || '#5ce6ff';
    shockRings.push({ x: sx, y: sy, r0: baseRadius * 0.35, r1: baseRadius * 1.75, age: 0, life: 0.42, color: col, width: 3 });
    emitScreenSparks(sx, sy, {
      count: rarity === 'holo' ? 24 : 15,
      colors: [col, '#ffffff'],
      speedMin: 120,
      speedMax: 400,
      gravity: 620,
      lifeMin: 0.3,
      lifeMax: 0.6,
      scaleMin: 0.6,
      scaleMax: 1.2,
    });
  }
}

function triggerStageImpact(rarity) {
  if (prefersReducedMotion) return;
  const cls = rarity === 'secret' ? 'impact-secret' : rarity === 'ultra' ? 'impact-ultra' : '';
  if (!cls) return;
  stageEl.classList.remove('impact-ultra', 'impact-secret');
  void stageEl.offsetWidth;
  stageEl.classList.add(cls);
}

/* ---------- 摇一摇验包（拆封前透视最高稀有度气息） ---------- */
const PEEK_RARITY_NAMES = {
  common: '常规卡包',
  rare: '稀有微光',
  holo: '全息虹彩',
  ultra: '超稀有金光',
  secret: '秘藏幻彩神迹',
};

function shakePackPeek() {
  if ((stageState !== 'idle' && stageState !== 'enter') || tearState.p.to > 0.05 || !currentPackRoll) return;
  if (clockSec - lastShakeAtSec < 0.32) return;
  lastShakeAtSec = clockSec;

  if (stageState === 'enter') {
    clearTimeout(enterTimer);
    stageState = 'idle';
  }

  const { maxRank, topRarity, isGodPack } = currentPackRoll;
  const auraColor = isGodPack ? 'rgba(255, 198, 58, 0.78)' : RARITY_META[topRarity].aura || 'rgba(130, 175, 255, 0.45)';

  // 给卡包物理摇晃冲量
  packPose.rz.v += (Math.random() < 0.5 ? -1 : 1) * (210 + maxRank * 35);
  packPose.x.v += (Math.random() < 0.5 ? -1 : 1) * 320;
  packPose.y.v -= 180;
  squeezeSpring.v += 11;

  sound.call('shake', maxRank);

  // 点亮封口光晕与顶部缝隙星火
  packAura.style.setProperty('--peek-aura', auraColor);
  packAura.classList.add('active');
  clearTimeout(peekAuraTimer);
  peekAuraTimer = setTimeout(() => {
    packAura.classList.remove('active');
  }, 1350);

  const sparkColor = isGodPack ? '#ffd454' : RARITY_META[topRarity].shockColor;
  for (let i = 0; i < 4; i++) {
    const [wx, wy, wz] = packLocalToStage(rand(18, 82), 8, 8);
    const [sx, sy] = stageToScreen(wx, wy, wz);
    emitScreenSparks(sx, sy, {
      count: 4 + maxRank,
      colors: isGodPack ? ['#ffd454', '#ff66dc', '#5ce6ff', '#ffffff'] : [sparkColor, '#ffffff'],
      speedMin: 80,
      speedMax: 280 + maxRank * 35,
      gravity: 420,
      lifeMin: 0.3,
      lifeMax: 0.68,
    });
  }

  const label = isGodPack ? '欧皇全闪气息' : PEEK_RARITY_NAMES[topRarity];
  gestureHint.textContent = `验包感应：封口透出【${label}】· 拖动顶部撕开`;
  gestureHint.classList.remove('hidden');
}

/* ---------- 双面卡牌构建、螺旋出包与悬念翻牌 ---------- */
const ORBIT_DURATION = 1.22;
const smoothStep = (a, b, x) => {
  const k = clamp((x - a) / (b - a), 0, 1);
  return k * k * (3 - 2 * k);
};

function buildCardBackMarkup() {
  return (
    `<div class="card-back" aria-hidden="true">` +
    `<svg class="card-back-guilloche" viewBox="0 0 200 280" aria-hidden="true">` +
    `<rect x="14" y="14" width="172" height="252" rx="10" fill="none" stroke="currentColor" stroke-opacity="0.26" stroke-width="0.9"/>` +
    `<rect x="20" y="20" width="160" height="240" rx="7" fill="none" stroke="currentColor" stroke-opacity="0.14" stroke-width="0.65" stroke-dasharray="2.5 3"/>` +
    `<path d="M14 34 L34 14 M166 14 L186 34 M14 246 L34 266 M166 266 L186 246" fill="none" stroke="currentColor" stroke-opacity="0.32" stroke-width="0.85"/>` +
    `<circle cx="100" cy="132" r="64" fill="none" stroke="currentColor" stroke-opacity="0.16" stroke-width="0.7"/>` +
    `<circle cx="100" cy="132" r="53" fill="none" stroke="currentColor" stroke-opacity="0.26" stroke-width="0.8" stroke-dasharray="2 3.5"/>` +
    `<ellipse cx="100" cy="132" rx="62" ry="25" transform="rotate(-32 100 132)" fill="none" stroke="currentColor" stroke-opacity="0.22" stroke-width="0.75"/>` +
    `<ellipse cx="100" cy="132" rx="62" ry="25" transform="rotate(32 100 132)" fill="none" stroke="currentColor" stroke-opacity="0.22" stroke-width="0.75"/>` +
    `<path d="M100 62 L110 122 L170 132 L110 142 L100 202 L90 142 L30 132 L90 122 Z" fill="currentColor" fill-opacity="0.07" stroke="currentColor" stroke-opacity="0.36" stroke-width="0.85"/>` +
    `<path d="M100 84 L106 126 L148 132 L106 138 L100 180 L94 138 L52 132 L94 126 Z" fill="none" stroke="currentColor" stroke-opacity="0.28" stroke-width="0.7"/>` +
    `</svg>` +
    `<div class="card-back-crest"><span class="card-back-gem">◆</span></div>` +
    `<span class="card-back-top">六大类别 · 每类一题</span>` +
    `<span class="card-back-sub">分号教育 · 结构化练习</span>` +
    `</div>`
  );
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function buildCardMarkup(cardDef) {
  return '<i class="card-edge"></i><i class="card-edge"></i><i class="card-edge"></i>' + buildCardBackMarkup() +
    `<div class="card-face question-card"><span class="new-badge" hidden></span>
    <div class="question-number">${escapeHtml(cardDef.serial)} / 06</div>
    <h2 class="question-type">${escapeHtml(cardDef.name)}</h2>
    <p class="question-text">${escapeHtml(cardDef.question || '')}</p>
    <span class="question-footer">点击查看完整题目 ↗</span>
    <i class="foil-glare"></i></div>`;
}

const questionDialog = document.createElement('dialog');
questionDialog.className = 'question-dialog';
questionDialog.style.cssText = 'border:0;border-radius:24px;padding:28px;max-width:460px;width:calc(100% - 40px);max-height:80dvh;box-sizing:border-box;background:#fff;color:#20202a;box-shadow:0 24px 100px #0003';
document.body.append(questionDialog);
function showQuestion(def) {
  questionDialog.innerHTML = `<div class="question-dialog-category" style="font-size:14px;color:#6e63d4;margin-bottom:14px">结构化练习 · ${escapeHtml(def.name)}</div><h2 style="font-size:23px;margin:0 0 20px">你的本轮题目</h2><p class="question-dialog-text" style="font-size:20px;line-height:1.8;white-space:pre-wrap">${escapeHtml(def.question)}</p><button type="button" style="margin-top:20px;width:100%;padding:14px;border:0;border-radius:14px;background:#262431;color:white;font-size:16px">返回六张卡</button>`;
  questionDialog.querySelector('button').addEventListener('click', () => questionDialog.close());
  questionDialog.showModal();
}
questionDialog.addEventListener('click', e => { if (e.target === questionDialog) { const r = questionDialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) questionDialog.close(); } });

function computeFanSlot(cardObj) {
  const total = cards.length || 5;
  const offsetIdx = cardObj.slot - (total - 1) / 2;
  const baseW = cardObj.el.offsetWidth || packWidth * 0.84;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (vh > vw * 1.15) {
    const targetW = Math.min((vw - 42) / 2, (vh - 190) / 4.5, baseW);
    const col = cardObj.slot % 2;
    const row = Math.floor(cardObj.slot / 2);
    return {
      x: (col - 0.5) * (targetW + 10),
      y: -12 + (row - 1) * (targetW * 1.4 + 10),
      z: 0, rz: 0, s: targetW / baseW,
    };
  }

  const s = clamp((vw - 48) / (baseW * (1 + (total - 1) * 1.08)), 0.6, 1);
  const scaledW = baseW * s;
  const idealStep = Math.min(scaledW * 1.08, (vw - 40 - scaledW) / (total - 1));
  const isTight = idealStep < scaledW;
  const halfEnds = (total - 1) / 2;
  const leanRad = (halfEnds * 7 * Math.PI) / 180;
  const perspBoost = 1400 / (1400 - halfEnds * 40);
  const stepX = isTight
    ? Math.max(6, Math.min(idealStep, (vw / 2 - 8 - (scaledW * 0.5 * Math.cos(leanRad) + scaledW * 0.7 * Math.sin(leanRad)) * perspBoost) / (halfEnds * perspBoost)))
    : idealStep;

  return {
    x: offsetIdx * stepX,
    y: -vh * 0.025 + offsetIdx * offsetIdx * (isTight ? 9 : 5) * s,
    z: isTight ? offsetIdx * 40 : 0,
    rz: offsetIdx * (isTight ? 7 : 2),
    s,
  };
}

function updateDockButtons() {
  if (stageState !== 'spread') return;
  const unrevealed = cards.filter((c) => !c.revealed);
  if (unrevealed.length > 0) {
    flipAllBtn.hidden = false;
    flipAllBtn.textContent = `一键翻开 (${unrevealed.length})`;
    againBtn.hidden = false;
    againBtn.classList.remove('primary');
    againBtn.classList.add('secondary');
  } else {
    flipAllBtn.hidden = true;
    againBtn.hidden = false;
    againBtn.classList.remove('secondary');
    againBtn.classList.add('primary');
  }
}

function flipCard(cardObj, { silentBanner = false } = {}) {
  if (!cardObj || cardObj.revealed) return;
  cardObj.revealed = true;
  cardObj.flippedAt = clockSec;
  cardObj.el.classList.remove('unrevealed');
  cardObj.el.classList.add('revealed');

  const { def, foilVariant } = cardObj;
  const rank = RARITY_META[def.rarity].rank;
  const isNew = recordCardUnlock(def, foilVariant);

  if (isNew && cardObj.newBadgeEl) {
    cardObj.newBadgeEl.hidden = false;
  }

  cardObj.el.setAttribute(
    'aria-label',
    `${def.name}：${def.question}。点击查看完整题目。`
  );

  cardObj.flip.configure(rank >= 4 ? 0.58 : 0.44, 0.25);
  cardObj.flip.to = 0;

  if (!prefersReducedMotion) {
    cardObj.pose.z.v += rank >= 4 ? 540 : 280;
    cardObj.pose.y.v -= rank >= 4 ? 250 : 135;
  } else {
    cardObj.flip.x = 0;
    cardObj.el.classList.add('front-visible');
  }

  sound.call('cardFlip', def.rarity, cardObj.slot);
  spawnFlipBurst(cardObj);
  triggerStageImpact(def.rarity);

  if (!silentBanner && rank >= 4) {
    showPullBanner(
      def.rarity === 'secret' ? 'SECRET RARE DISCOVERED' : 'ULTRA RARE HIT',
      `${def.rarity === 'secret' ? '秘藏幻彩出货' : '超稀有金卡'} · ${def.name}${foilVariant ? ' (' + foilVariant.label + ')' : ''}`
    );
  }

  updateDockButtons();
}

function spawnPackCards() {
  zoomedCard = null;
  dismissShowcaseCard();

  const entries = currentPackRoll.entries;
  const maxTearY = Math.max(...tearVertices.map((q) => q[1]));

  cards = entries.map((entry, idx) => {
    const { def, foilVariant } = entry;
    const meta = RARITY_META[def.rarity];
    const el = document.createElement('div');
    el.className = `card rarity-${def.rarity} unrevealed${foilVariant ? ` variant-${foilVariant.key}` : ''}`;
    el.style.setProperty('--card-frame-bg', def.frameBg);
    el.style.setProperty('--card-plaque-bg', def.plaqueBg || 'rgba(20, 20, 28, 0.92)');
    el.style.setProperty('--card-edge-color', def.edgeColor);
    el.style.setProperty('--card-text-color', def.textColor);
    el.style.setProperty('--card-window-bg', def.windowBg);
    el.style.setProperty('--aura-color', meta.aura);
    el.innerHTML = buildCardMarkup(def, { foilVariant });
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', '未翻开的神秘卡牌，点击翻开揭晓。');
    el.style.zIndex = String(entries.length - idx);
    el.tabIndex = 0;

    const cardObj = {
      el,
      def,
      foilVariant,
      idx,
      slot: idx,
      faceEl: el.querySelector('.card-face'),
      newBadgeEl: el.querySelector('.new-badge'),
      eyes: [...el.querySelectorAll('.rig-eye')],
      nextBlink: clockSec + rand(0.8, 3.2),
      phase: 'inside',
      revealed: false,
      frontShown: false,
      flippedAt: -10,
      autoFlipScheduled: false,
      hovered: false,
      wasHovered: false,
      kbFocused: false,
      hx: 0.5,
      hy: 0.5,
      touchHoldUntil: 0,
      flip: new SpringValue(180, 0.46, 0.24),
      pose: createSpringGroup(
        {
          x: packPose.x.x,
          y: packPose.y.x + packHeight * ((maxTearY + 39.0) / 100 - 0.5),
          z: 3.5 - idx * 1.75,
          rx: 0,
          ry: 0,
          rz: packPose.rz.x,
          s: 0.94,
        },
        0.55,
        0.22
      ),
    };

    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } });
    el.addEventListener('focus', () => {
      cardObj.kbFocused = el.matches(':focus-visible');
    });
    el.addEventListener('blur', () => {
      cardObj.kbFocused = false;
    });
    el.addEventListener('click', (e) => {
      if (cardObj.phase !== 'fanned') return;
      e.stopPropagation();
      if (!cardObj.revealed) {
        flipCard(cardObj);
        return;
      }
      if (clockSec - cardObj.flippedAt < 0.24) return;
      sound.call('click');
      showQuestion(cardObj.def);
    });

    return cardObj;
  });

  for (const c of cards.slice().reverse()) scene.append(c.el);

  if (prefersReducedMotion) {
    for (const c of cards) {
      c.phase = 'fanned';
      c.fan = computeFanSlot(c);
      c.el.classList.add('settled');
      for (const [k, val] of Object.entries(c.fan)) {
        c.pose[k].x = c.pose[k].to = val;
      }
      if (RARITY_META[c.def.rarity].autoFlip && !c.foilVariant) {
        flipCard(c, { silentBanner: true });
      }
    }
  }
}

function scheduleCardAutoFlipIfCommon(c) {
  if (c.autoFlipScheduled) return;
  c.autoFlipScheduled = true;
  // 普通无异画卡自动轻盈翻开，把交互焦点留给发光高罕悬念卡
  if (RARITY_META[c.def.rarity].autoFlip && !c.foilVariant) {
    setTimeout(() => {
      if (cards.includes(c) && !c.revealed) {
        flipCard(c, { silentBanner: true });
      }
    }, 110 + c.slot * 85);
  }
}

function beginCardOrbit() {
  orbitStartedAt = clockSec;
  scene.classList.add('flat');
  sound.call('swirl', ORBIT_DURATION);

  for (const c of cards) {
    const p = c.pose;
    const f = (c.fan = computeFanSlot(c));
    Object.assign(c, {
      phase: 'orbit',
      orbitStart: clockSec + c.idx * 0.03,
      startX: p.x.x,
      startY: p.y.x,
      ejectVy: p.y.v,
      startRz: p.rz.x,
      ringAngle: (-c.slot * 2 * Math.PI) / cards.length,
      endAngle: Math.PI / 2 - (c.slot - (cards.length - 1) / 2) * 0.55,
    });
    c.landAt = c.orbitStart + ORBIT_DURATION;
    p.s.to = f.s;
    for (const k of Object.keys(p)) {
      if (k !== 's') p[k].k = p[k].c = p[k].v = 0;
    }
  }
}

function stepCardOrbit(c) {
  const p = c.pose;
  const f = c.fan;
  const u = clamp((clockSec - c.orbitStart) / ORBIT_DURATION, 0, 1);
  const easeTurn = 1 - Math.pow(1 - u, 2);
  const blendFan = smoothStep(0.52, 1, u);
  const ringWeight = Math.sin(Math.min(1, u / 0.42) * (Math.PI / 2)) * (1 - blendFan);

  const angle = c.endAngle + (1 - easeTurn) * (c.ringAngle - c.endAngle + Math.PI * 2.5);
  const sinA = Math.sin(angle);
  const cosA = Math.cos(angle);
  const radiusX = Math.min(window.innerWidth * 0.33, 430);
  const decelY = c.startY + (c.ejectVy / 9) * (1 - Math.exp(-9 * Math.max(0, clockSec - c.orbitStart)));
  const centerY = decelY + (-window.innerHeight * 0.025 - decelY) * smoothStep(0, 0.42, u);

  p.x.x = c.startX * (1 - blendFan) + f.x * blendFan + cosA * radiusX * ringWeight;
  p.y.x = centerY * (1 - blendFan) + f.y * blendFan + sinA * radiusX * 0.2 * ringWeight;
  p.z.x = f.z * blendFan + sinA * 300 * ringWeight;
  p.rz.x = c.startRz * (1 - blendFan) + f.rz * blendFan - cosA * 8 * ringWeight;
  p.ry.x = -cosA * 26 * ringWeight;
  p.rx.x = 7 * ringWeight;

  if (u === 1) {
    c.phase = 'fanned';
    c.el.classList.add('settled');
    for (const k of Object.keys(p)) p[k].configure(0.5, 0.22);
    sound.call('cardLand', c.slot);
    scheduleCardAutoFlipIfCommon(c);
  }
}

function hitTestHoveredCard() {
  if (showcaseCard) {
    const cardW = packWidth * 0.84 * 1.35;
    const cardH = cardW * 1.4;
    showcaseCard.hx = clamp((pointer.x - window.innerWidth / 2) / cardW + 0.5, 0, 1);
    showcaseCard.hy = clamp((pointer.y - window.innerHeight * 0.46) / cardH + 0.5, 0, 1);
    return showcaseCard;
  }

  if (zoomedCard) {
    const cardW = packWidth * 0.84 * 1.38;
    const cardH = cardW * 1.4;
    const hx = (pointer.x - window.innerWidth / 2) / cardW + 0.5;
    const hy = (pointer.y - window.innerHeight * 0.46) / cardH + 0.5;
    zoomedCard.hx = clamp(hx, 0, 1);
    zoomedCard.hy = clamp(hy, 0, 1);
    return zoomedCard;
  }

  let picked = null;
  for (const c of cards) {
    if (c.phase !== 'fanned') continue;
    const f = c.fan;
    const persp = 1400 / (1400 - f.z);
    const rad = (f.rz * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const w = packWidth * 0.84 * f.s * persp;
    const h = w * 1.4;
    const dx = pointer.x - (window.innerWidth / 2 + f.x * persp);
    const dy = pointer.y - (window.innerHeight * 0.4 + (window.innerHeight * 0.1 + f.y) * persp);
    const hx = (dx * cos + dy * sin) / w + 0.5;
    const hy = (dy * cos - dx * sin) / h + 0.5;
    if (hx >= 0 && hx <= 1 && hy >= 0 && hy <= 1 && (!picked || f.z >= picked.fan.z)) {
      picked = c;
      c.hx = hx;
      c.hy = hy;
    }
  }
  return picked;
}

/* ---------- 图鉴弹窗渲染与 3D 独立检视 ---------- */
function spawnShowcaseCard(def, foilLabel = null) {
  dismissShowcaseCard();
  const foilVariant = FOIL_VARIANTS.find((f) => f.label === foilLabel) || null;
  const el = document.createElement('div');
  el.className = `card rarity-${def.rarity} settled revealed front-visible${foilVariant ? ` variant-${foilVariant.key}` : ''}`;
  el.style.setProperty('--card-frame-bg', def.frameBg);
  el.style.setProperty('--card-plaque-bg', def.plaqueBg || 'rgba(20, 20, 28, 0.92)');
  el.style.setProperty('--card-edge-color', def.edgeColor);
  el.style.setProperty('--card-text-color', def.textColor);
  el.style.setProperty('--card-window-bg', def.windowBg);
  el.innerHTML = buildCardMarkup(def, { foilVariant });
  el.style.zIndex = '45';
  scene.append(el);

  showcaseCard = {
    el,
    def,
    faceEl: el.querySelector('.card-face'),
    hx: 0.5,
    hy: 0.5,
    pose: createSpringGroup({ x: 0, y: 24, z: 60, rx: 0, ry: -24, rz: 0, s: 0.85 }, 0.48, 0.24),
  };
  showcaseCard.pose.y.to = -window.innerHeight * 0.03;
  showcaseCard.pose.z.to = 270;
  showcaseCard.pose.ry.to = 0;
  showcaseCard.pose.s.to = Math.min(1.32, (window.innerWidth * 0.78) / (packWidth * 0.84));

  el.addEventListener('click', (e) => {
    e.stopPropagation();
    sound.call('click');
    dismissShowcaseCard();
  });
}

function dismissShowcaseCard() {
  if (!showcaseCard) return;
  showcaseCard.el.remove();
  showcaseCard = null;
}

function renderBinderGrid() {
  const unlockedCount = Object.keys(binderState.owned).length;
  const totalCards = Object.values(binderState.owned).reduce((sum, rec) => sum + rec.count, 0);
  binderStatsText.textContent = `图鉴进度 ${unlockedCount} / ${CARD_POOL.length} · 已拆 ${binderState.packsOpened} 包 · 累计收录 ${totalCards} 张`;

  binderGrid.innerHTML = CARD_POOL.map((def) => {
    const rec = binderState.owned[def.id];
    const unlocked = Boolean(rec);
    const foilTag = unlocked && rec.foils?.length ? `<span class="binder-foil-pill">${rec.foils[0]}</span>` : '';
    const countTag = unlocked ? `<span class="binder-count-pill">x${rec.count}</span>` : '';

    return `<button
      class="binder-slot ${unlocked ? 'unlocked' : 'locked'}"
      type="button"
      data-card-id="${def.id}"
      ${unlocked ? '' : 'disabled'}
      style="${unlocked ? `--slot-bg:${def.frameBg};--slot-plaque:${def.plaqueBg};--slot-ink:${def.textColor};--slot-win:${def.windowBg}` : ''}"
    >
      <div class="binder-art">
        ${foilTag}
        ${countTag}
        <img src="${def.character.image}" alt="${unlocked ? def.name : '未解锁角色'}">
      </div>
      <div class="binder-plaque">
        <span class="binder-meta-name">${unlocked ? def.name : 'UNREVEALED'}</span>
        <div class="binder-meta-sub">
          <span>NO. ${def.serial}</span>
          <span>${def.rarityMark}</span>
        </div>
      </div>
    </button>`;
  }).join('');
}

function openBinder() {
  sound.call('click');
  renderBinderGrid();
  binderModal.hidden = false;
}

function closeBinder() {
  if (binderModal.hidden) return;
  binderModal.hidden = true;
}

binderBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  dismissShowcaseCard();
  openBinder();
});

closeBinderBtn.addEventListener('click', () => {
  sound.call('click');
  closeBinder();
});

binderBackdrop.addEventListener('click', closeBinder);

resetBinderBtn.addEventListener('click', () => {
  sound.call('click');
  binderState = { packsOpened: 0, pitySinceUltra: 0, owned: {} };
  saveBinderState();
  updateHud();
  renderBinderGrid();
});

binderGrid.addEventListener('click', (e) => {
  const slotBtn = e.target.closest('.binder-slot.unlocked');
  if (!slotBtn) return;
  const def = CARD_POOL.find((c) => c.id === slotBtn.dataset.cardId);
  if (!def) return;
  const rec = binderState.owned[def.id];
  sound.call('click');
  closeBinder();

  const onStage = stageState === 'spread' && cards.find((c) => c.def.id === def.id && c.revealed);
  if (onStage) {
    zoomedCard = onStage;
  } else {
    spawnShowcaseCard(def, rec?.foils?.[0] || null);
  }
});

/* ---------- 欧皇包武装切换 ---------- */
luckBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  sound.call('click');
  luckArmed = !luckArmed;

  // 若当前卡包尚未开始撕裂，实时切换当前卡包内容与流光，并触发 360° 炫金觉醒翻转
  if ((stageState === 'idle' || stageState === 'enter') && tearState.p.to === 0) {
    currentPackRoll = generatePackRoll({ forceGod: luckArmed });
    syncPackGodVisual();
    if (luckArmed) {
      if (!prefersReducedMotion) {
        packPose.ry.configure(0.62, 0.24);
        packPose.ry.x -= 360;
        packPose.y.v -= 260;
        const [sx, sy] = stageToScreen(packPose.x.x, packPose.y.x, 18);
        shockRings.push(
          { x: sx, y: sy, r0: packWidth * 0.25, r1: packWidth * 1.15, age: 0, life: 0.48, color: '#ffd454', width: 4 },
          { x: sx, y: sy, r0: packWidth * 0.2, r1: packWidth * 1.42, age: -0.06, life: 0.54, color: '#32ad62', width: 2.8 }
        );
        emitScreenSparks(sx, sy, {
          count: isCoarsePointer ? 18 : 30,
          colors: ['#ffd454', '#fff4b8', '#32ad62', '#5ce6ff', '#ff66dc'],
          speedMin: 140,
          speedMax: 480,
          gravity: 480,
          lifeMin: 0.34,
          lifeMax: 0.72,
          scaleMin: 0.65,
          scaleMax: 1.35,
        });
      }
      shakePackPeek();
    }
  }
  updateHud();
});

function syncPackGodVisual() {
  const isGod = Boolean(currentPackRoll?.isGodPack);
  pack.classList.toggle('god-pack', isGod);
  packAura.classList.toggle('god-mode', isGod && (stageState === 'enter' || stageState === 'idle'));
  editionTag.textContent = isGod ? 'GOD PACK · OMNI' : `${currentTheme.name} · ${currentTheme.code}`;
}

/* ---------- 新卡包入场与撕包事件 ---------- */
function enterFreshPack() {
  if ($('#drawBtn')) $('#drawBtn').hidden = false;
  stageState = 'enter';
  zoomedCard = null;
  dismissShowcaseCard();
  pullBanner.hidden = true;

  currentTheme = PACK_THEMES[0];

  currentPackRoll = generatePackRoll({ forceGod: luckArmed });

  pack.style.setProperty('--pack-color', currentTheme.color);
  pack.style.setProperty('--pack-highlight', currentTheme.highlight);
  pack.style.setProperty('--pack-shadow', currentTheme.shadow);
  randomizeFoilShading(pack.style);
  generateTearLine();
  syncPackGodVisual();
  updateHud();

  gestureHint.textContent = '点击抽卡，或沿封口横向撕开';
  gestureHint.classList.remove('hidden');
  shakeBtn.hidden = true;
  flipAllBtn.hidden = true;
  againBtn.hidden = true;

  for (const f of pouchFaces) f.style.clipPath = '';
  bodyLip.style.clipPath = '';
  for (const seg of stripSegments) {
    seg.el.hidden = true;
    seg.locked = false;
    seg.el.style.transform = '';
  }
  for (const g of gussetSlices) g.el.style.top = g.defaultTop + '%';

  tearFlap.className = 'tear-flap';
  tearFlap.style.transform = '';
  lightJet.style.cssText = '';
  pack.style.visibility = '';
  jetAnchor.style.visibility = '';
  pack.classList.remove('tearing', 'wincing', 'tugging');
  scene.classList.remove('flat');

  initLightJet();
  if (!prefersReducedMotion) {
    preloadConfettiPool(currentPackRoll.isGodPack);
    sound.call('packArrive');
  }

  grabZone.disabled = false;
  packFall = null;
  stripFlight = null;
  dragSession = null;
  orbitStartedAt = 0;
  tearState.prevP = 0;
  tearState.dir = 1;

  for (const s of [tearState.p, tearState.zAngle, tearState.xAngle, squeezeSpring, jetGlowSpring, ...Object.values(packPose)]) {
    s.x = s.to = s.v = 0;
  }
  for (const s of Object.values(packPose)) s.configure(0.7, 0.28);

  if (!prefersReducedMotion) {
    packPose.x.x = window.innerWidth * 0.62;
    packPose.y.x = -50;
    packPose.ry.x = -200;
    packPose.rz.x = 16;
  }

  clearTimeout(enterTimer);
  enterTimer = setTimeout(() => {
    stageState = 'idle';
  }, prefersReducedMotion ? 0 : 900);
}

function activateTearingFeedback() {
  if ($('#drawBtn')) $('#drawBtn').hidden = true;
  gestureHint.classList.add('hidden');
  shakeBtn.hidden = true;
  packAura.classList.remove('active', 'god-mode');
  if (!pack.classList.contains('wincing')) sound.call('ouch');
  tearFlap.classList.add('visible');
  pack.classList.remove('tugging');
  pack.classList.add('tearing', 'wincing');
}

function autoCompleteTear(responseSec) {
  tearState.p.configure(responseSec);
  tearState.p.to = 1;
  tearState.zAngle.to = rand(14, 30);
  tearState.xAngle.to = -rand(20, 44);
}

function triggerPackBurst() {
  if (dragSession && grabZone.hasPointerCapture(dragSession.id)) {
    grabZone.releasePointerCapture(dragSession.id);
  }
  stageState = 'open';
  openedAtSec = clockSec;
  dragSession = null;
  shakeBtn.hidden = true;
  packAura.classList.remove('active', 'god-mode');

  tearState.p.x = tearState.p.to = 1;
  updateTearClips(1);
  grabZone.disabled = true;

  if (currentPackRoll.isGodPack) {
    showPullBanner('GOD PACK TRIGGERED', '欧皇全闪包降临 · 5 张全高罕悬念卡', 3600);
  }

  liveStatus.textContent = '六类题目已抽好，点击卡片查看完整题目。';
  packPose.rx.configure(0.3);
  packPose.ry.configure(0.3);
  packPose.rx.to = 0;
  packPose.ry.to = 0;

  if (prefersReducedMotion) {
    pack.style.visibility = 'hidden';
    jetAnchor.style.visibility = 'hidden';
    tearFlap.className = 'tear-flap';
  } else {
    stripFlight = {
      x: 0,
      y: 0,
      vx: tearState.dir * 245,
      vy: -1880,
      rz: tearState.zAngle.x,
      vrz: 520,
      rx: tearState.xAngle.x,
      vrx: -320,
    };
    packPose.y.v += 320;
    packPose.rz.v -= tearState.dir * 40;
    launchConfetti();

    const [mx, my] = stageToScreen(packPose.x.x, packPose.y.x - packHeight * 0.34, 20);
    shockRings.push(
      { x: mx, y: my, r0: packWidth * 0.22, r1: packWidth * 1.35, age: 0, life: 0.46, color: currentPackRoll.isGodPack ? '#ffd454' : '#5ce6ff', width: 4.2 },
      { x: mx, y: my, r0: packWidth * 0.18, r1: packWidth * 1.65, age: -0.05, life: 0.52, color: '#ff66dc', width: 2.8 }
    );
    emitScreenSparks(mx, my, {
      count: isCoarsePointer ? 24 : 42,
      colors: ['#ffd454', '#ffffff', '#5ce6ff', '#ff66dc', '#4fd9a0'],
      speedMin: 180,
      speedMax: 620,
      gravity: 540,
      lifeMin: 0.36,
      lifeMax: 0.78,
      scaleMin: 0.75,
      scaleMax: 1.5,
    });
    triggerStageImpact(currentPackRoll.isGodPack ? 'secret' : 'ultra');
  }

  spawnPackCards();
  sound.call('setRip', 0);
  sound.call('burst', currentPackRoll.isGodPack);
  if (prefersReducedMotion) {
    for (const c of cards) sound.call('cardLand', c.slot);
  }
}

/* ---------- 指针、横扫翻牌与键盘交互 ---------- */
shakeBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  dismissShowcaseCard();
  shakePackPeek();
});

flipAllBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  sound.call('click');
  const pending = cards
    .filter((c) => !c.revealed)
    .sort((a, b) => RARITY_META[a.def.rarity].rank - RARITY_META[b.def.rarity].rank);
  pending.forEach((c, idx) => {
    setTimeout(() => {
      if (cards.includes(c) && !c.revealed) flipCard(c);
    }, idx * 145);
  });
});

grabZone.addEventListener('pointerdown', (e) => {
  openedByKeyboard = false;
  dismissShowcaseCard();
  if (e.button !== 0 || dragSession) return;
  if (stageState === 'enter') {
    clearTimeout(enterTimer);
    stageState = 'idle';
    squeezeSpring.v -= 6;
    for (const s of Object.values(packPose)) s.configure(0.28, 0.25);
  }
  if (stageState !== 'idle') return;
  grabZone.setPointerCapture(e.pointerId);
  sound.call('grab');
  dragSession = {
    id: e.pointerId,
    x0: e.clientX,
    y0: e.clientY,
    p0: tearState.p.to,
    moved: false,
    dy: 0,
    steer: 0,
  };
});

grabZone.addEventListener('pointermove', (e) => {
  if (!dragSession || e.pointerId !== dragSession.id || stageState !== 'idle') return;
  if (e.pointerType === 'mouse' && !e.buttons) {
    endDrag(e);
    return;
  }

  const dx = e.clientX - dragSession.x0;
  let dy = e.clientY - dragSession.y0;

  if (!dragSession.moved) {
    if (Math.hypot(dx, dy) < 6) return;
    dragSession.moved = true;
    tearState.p.configure(0.1);
    pack.classList.add('tugging');
  }

  if (tearState.p.to === 0) {
    dragSession.dy = dy;
    if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy) * 0.5) return;
    tearState.dir = dx < 0 ? -1 : 1;
    dragSession.y0 = e.clientY;
    dy = 0;
  }

  activateTearingFeedback();
  const deltaP = (dragSession.p0 ? Math.abs(dx) : dx * tearState.dir) / (packWidth * 0.85);
  tearState.p.to = clamp(dragSession.p0 + deltaP, tearState.p.to, 1);
  tearState.zAngle.to = 6 + tearState.p.to * 14 + clamp(-dy * 0.16, -6, 22);
  tearState.xAngle.to = -(8 + tearState.p.to * 22) - clamp(-dy * 0.2, 0, 24);

  const targetSteer = clamp(dy / Math.max(60, Math.abs(dx)), -0.7, 0.7) * (packWidth / packHeight);
  dragSession.steer += (targetSteer - dragSession.steer) * 0.3;
  steerRemainingTear(dragSession.steer, tearState.p.x, tearState.dir);
});

function endDrag(e) {
  if (!dragSession || (e.pointerId !== undefined && e.pointerId !== dragSession.id)) return;
  didDragMove = dragSession.moved;
  dragSession = null;
  if (!didDragMove || stageState !== 'idle') return;

  if (tearState.p.to > 0.54) {
    autoCompleteTear(0.18);
    return;
  }
  sound.call(pack.classList.contains('wincing') ? 'relief' : 'boing');
  pack.classList.remove('tearing', 'wincing', 'tugging');
  tearState.zAngle.to = 3 + tearState.p.to * 10;
  tearState.xAngle.to = -tearState.p.to * 14;
}

for (const evt of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  grabZone.addEventListener(evt, endDrag);
}

grabZone.addEventListener('click', (e) => {
  if (didDragMove && e.detail) {
    didDragMove = false;
    return;
  }
  if (stageState !== 'idle') return;
  openedByKeyboard = e.detail === 0;
  if (!tearState.p.to) tearState.dir = Math.random() < 0.5 ? -1 : 1;
  activateTearingFeedback();
  autoCompleteTear(tearState.p.to ? 0.18 : 0.52);
});

window.addEventListener('click', () => {
  if (showcaseCard) dismissShowcaseCard();
  if (zoomedCard) zoomedCard = null;
});

window.addEventListener('pointermove', (e) => {
  const vx = Math.abs(e.clientX - pointer.prevX);
  pointer.prevX = e.clientX;
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  pointer.inside = true;
  pointer.isTouch = e.pointerType !== 'mouse';

  // 扇形阶段按住指针横扫滑过未翻开卡牌即可丝滑连翻
  if (stageState === 'spread' && pointer.down && !zoomedCard && binderModal.hidden) {
    const hit = hitTestHoveredCard();
    if (hit && hit.phase === 'fanned' && !hit.revealed) {
      flipCard(hit);
    }
  }
});

window.addEventListener('pointerdown', (e) => {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  pointer.prevX = e.clientX;
  pointer.inside = true;
  pointer.down = true;
  pointer.isTouch = e.pointerType !== 'mouse';
  pointer.tapped = true;
});

window.addEventListener('pointerup', () => {
  pointer.down = false;
});
window.addEventListener('pointercancel', () => {
  pointer.down = false;
});

document.documentElement.addEventListener('pointerleave', () => {
  pointer.inside = false;
  pointer.down = false;
});

window.addEventListener('blur', (e) => {
  endDrag(e);
  pointer.inside = false;
  pointer.down = false;
});

window.addEventListener('resize', () => {
  if (!window.innerWidth || !window.innerHeight) return;
  measureStage();
  fitLightJetBounds();
  if (stageState === 'idle' && tearState.p.x > 0) {
    updateTearClips(Math.min(1, tearState.p.x));
  }
  for (const c of cards) {
    if (c.fan) c.fan = computeFanSlot(c);
  }
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!binderModal.hidden) {
      closeBinder();
      return;
    }
    if (showcaseCard) {
      dismissShowcaseCard();
      return;
    }
    if (zoomedCard) {
      zoomedCard = null;
      return;
    }
  }
  if (questionDialog.open) return;
  if (stageState !== 'spread' || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
  const step = e.key === 'ArrowLeft' ? -1 : 1;
  const focused = cards.find((c) => c.el === document.activeElement);
  const nextSlot = focused ? clamp(focused.slot + step, 0, cards.length - 1) : step > 0 ? 0 : cards.length - 1;
  cards.find((c) => c.slot === nextSlot)?.el.focus({ preventScroll: true });
  e.preventDefault();
});

againBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  sound.call('click');
  for (const c of cards) c.el.remove();
  cards = [];
  zoomedCard = null;
  flipAllBtn.hidden = true;
  againBtn.hidden = true;
  enterFreshPack();
  if (openedByKeyboard) grabZone.focus();
});

/* ---------- 主渲染循环 ---------- */
function tick(nowMs) {
  const dt = Math.min(0.05, (nowMs - lastFrameMs) / 1000);
  lastFrameMs = nowMs;
  clockSec += dt;
  pointerShakeEnergy *= Math.exp(-dt * 4.5);

  const motionScale = prefersReducedMotion ? 0 : 1;
  const isBeingTorn = pack.classList.contains('tearing');
  const verticalTug =
    motionScale && dragSession?.moved && !tearState.p.to
      ? Math.sign(dragSession.dy) * 170 * (1 - 1 / (1 + Math.abs(dragSession.dy) / 170))
      : 0;

  squeezeSpring.to = verticalTug ? -Math.abs(verticalTug) / 90 : isBeingTorn && stageState === 'idle' ? motionScale : 0;

  if (stageState === 'enter' || stageState === 'idle') {
    const dragDamp = dragSession?.moved ? 0.25 : 1;
    const tiltFactor = dragDamp * (prefersReducedMotion ? 0.5 : 1);
    const nx = pointer.inside ? clamp((pointer.x / window.innerWidth) * 2 - 1, -1, 1) : 0;
    const ny = pointer.inside ? clamp((pointer.y / window.innerHeight) * 2 - 1, -1, 1) : 0;

    packPose.y.to = Math.sin(clockSec * 1.4) * 7 * motionScale + verticalTug;
    packPose.ry.to = nx * 22 * tiltFactor;
    packPose.rx.to = -ny * 16 * tiltFactor - squeezeSpring.x * 6;
    packPose.rz.to = Math.sin(clockSec * 0.9) * 1.6 * motionScale - (isBeingTorn && tearState.p.x > 0 ? tearState.dir * tearState.p.x * 3 : 0);

    if (stageState === 'idle' && !dragSession && tearState.p.to < 1 && motionScale && clockSec > nextIdleNudgeSec) {
      packPose.rz.v += (Math.random() < 0.5 ? -1 : 1) * 68;
      if (tearState.p.to > 0) tearState.zAngle.v += 115;
      nextIdleNudgeSec = clockSec + rand(4.2, 7.0);
    }
  }

  if (clockSec > nextBlinkSec) {
    nextBlinkSec = clockSec + rand(2.2, 5.4);
    if (motionScale && !isBeingTorn) triggerBlink(packEyes);
  }

  // 吉祥物瞳孔跟随指针
  {
    const dx = pointer.x - (window.innerWidth / 2 + packPose.x.x);
    const dy = pointer.y - (window.innerHeight / 2 + packPose.y.x - packHeight * 0.02);
    const dist = Math.hypot(dx, dy) || 1;
    const maxShift = pointer.inside ? Math.min(1, dist / 260) * packWidth * 0.035 : 0;
    pupilOffset.x.to = (dx / dist) * maxShift;
    pupilOffset.y.to = (dy / dist) * maxShift;
  }

  // 240Hz 子步进更新全部弹簧
  const allSprings = [
    ...Object.values(packPose),
    ...Object.values(pupilOffset),
    tearState.p,
    tearState.zAngle,
    tearState.xAngle,
    squeezeSpring,
    jetGlowSpring,
    ...jetRibbons.map((r) => r.growth),
    ...cards.flatMap((c) => [...Object.values(c.pose), c.flip]),
    ...(showcaseCard ? Object.values(showcaseCard.pose) : []),
  ];
  const substeps = Math.max(1, Math.ceil(dt * 240));
  const subDt = dt / substeps;
  for (let s = 0; s < substeps; s++) {
    for (const sp of allSprings) sp.step(subDt);
  }

  // 撕裂推进、铝箔裂口星火与音效联动
  if (stageState === 'idle' && tearState.p.x > 0) {
    const p = Math.min(1, tearState.p.x);
    const dp = p - tearState.prevP;
    tearState.prevP = p;

    sound.call('setRip', dp > 0 ? Math.pow(dp / Math.max(dt, 0.004) / 4, 0.6) : 0);

    if (dp > 0 && motionScale) {
      packPose.rz.v += rand(-1, 1) * Math.min(dp, 0.02) * 880;
      packPose.y.v += dp * 410;
      tearState.zAngle.v += dp * 290;
      squeezeSpring.v += dp * 19;
      for (const b of jetRibbons) if (b.active) b.growth.v += dp * 6;

      // 沿撕裂尖端实时迸射铝箔金属与虹彩火花
      sparkCarry += dp * 46;
      const emitCount = Math.min(6, Math.floor(sparkCarry));
      if (emitCount > 0) {
        sparkCarry -= emitCount;
        const tipX = tearState.dir > 0 ? p * 100 : 100 - p * 100;
        const tipY = tearYAt(tipX);
        const [wx, wy, wz] = packLocalToStage(tipX, tipY, 8);
        const [sx, sy] = stageToScreen(wx, wy, wz);
        emitScreenSparks(sx, sy, {
          count: emitCount,
          colors: ['#ffffff', '#dce8ff', '#ffd454', '#5ce6ff', '#ff66dc'],
          speedMin: 70,
          speedMax: 250,
          gravity: 640,
          lifeMin: 0.18,
          lifeMax: 0.42,
          scaleMin: 0.45,
          scaleMax: 0.95,
        });
      }
    }

    if (dp > 0 || Math.abs(tearState.p.v) > 0.001) {
      updateTearClips(p);
    }

    const breeze = dragSession ? 0 : motionScale * (Math.sin(clockSec * 5.3) + Math.sin(clockSec * 8.7) * 0.5);
    tearFlap.style.transform = `rotateZ(${(tearState.zAngle.x + breeze) * tearState.dir}deg) rotateX(${tearState.xAngle.x + breeze * 1.5}deg)`;

    if (p > 0.985 && tearState.p.to >= 1) {
      triggerPackBurst();
    }
  }

  // 彩虹光流步进
  jetGlowSpring.to =
    (stageState === 'idle' && tearState.p.x > 0) || ((stageState === 'open' || stageState === 'spread') && !prefersReducedMotion && !jetDrained)
      ? 1
      : 0;
  if (jetGlowSpring.x > 0.003 || jetGlowSpring.to) {
    lightJet.style.opacity = jetGlowSpring.x.toFixed(3);
    stepLightJet(dt);
  }

  // 撕断封口条抛物线飞走
  if (stripFlight) {
    stripFlight.vy += 2600 * dt;
    stripFlight.x += stripFlight.vx * dt;
    stripFlight.y += stripFlight.vy * dt;
    stripFlight.rz += stripFlight.vrz * dt;
    stripFlight.rx += stripFlight.vrx * dt;
    tearFlap.style.transform = `translate3d(${stripFlight.x}px, ${stripFlight.y}px, 0) rotateZ(${stripFlight.rz * tearState.dir}deg) rotateX(${stripFlight.rx}deg)`;
    if (clockSec - openedAtSec > 1.6) {
      stripFlight = null;
      tearFlap.className = 'tear-flap';
    }
  }

  // 空铝箔袋反冲坠落
  if (stageState === 'open' && !packFall && !prefersReducedMotion && clockSec - openedAtSec > 0.02) {
    packFall = { y: 0, v: (1500 * packHeight) / 420 };
  }
  if (packFall && packFall.y < window.innerHeight) {
    packFall.v += 2800 * dt;
    packFall.y += packFall.v * dt;
    packPose.rz.to = tearState.dir * 9;
  }

  if (pack.style.visibility !== 'hidden') {
    const fallY = packFall ? packFall.y : 0;
    pack.style.transform =
      `translate3d(${packPose.x.x}px, ${packPose.y.x + fallY}px, 0) ` +
      `rotateX(${packPose.rx.x}deg) rotateY(${packPose.ry.x}deg) rotateZ(${packPose.rz.x}deg) ` +
      `scale3d(${1 + 0.03 * squeezeSpring.x}, ${1 - 0.06 * squeezeSpring.x}, 1)`;

    if (!packFall) {
      pack.style.setProperty('--glint-x', clamp(-packPose.ry.x * 0.12, -1.5, 3).toFixed(2));
      pack.style.setProperty('--glint-op', clamp(0.8 - packPose.ry.x * 0.012, 0.45, 1).toFixed(2));
      pack.style.setProperty('--shine-pos', clamp(50 + packPose.ry.x * 1.2, 20, 80).toFixed(1));
      pack.style.setProperty('--shine-op', clamp(0.85 + packPose.rx.x * 0.015, 0.5, 1).toFixed(2));
      pack.style.setProperty('--hue-shift', clamp(packPose.ry.x * 1.2 + packPose.rx.x * 0.8, -22, 22).toFixed(1));
      for (const pEl of packPupils) {
        pEl.style.transform = `translate(${pupilOffset.x.x}px, ${pupilOffset.y.x}px)`;
      }
    }
    if (fallY > window.innerHeight) pack.style.visibility = 'hidden';
  }

  if (!packFall) {
    jetAnchorFrozen = { y: packPose.y.x, rx: packPose.rx.x, ry: packPose.ry.x, rz: packPose.rz.x, sq: squeezeSpring.x };
    jetAnchor.style.transform = pack.style.transform;
  } else if (Math.abs(jetAnchorFrozen.rz) + Math.abs(jetAnchorFrozen.rx) + Math.abs(jetAnchorFrozen.sq) > 0.01) {
    const decay = Math.exp(-dt / 0.05);
    jetAnchorFrozen.rz *= decay;
    jetAnchorFrozen.rx *= decay;
    jetAnchorFrozen.ry *= decay;
    jetAnchorFrozen.sq *= decay;
    jetAnchor.style.transform =
      `translate3d(${packPose.x.x}px, ${jetAnchorFrozen.y}px, 0) ` +
      `rotateX(${jetAnchorFrozen.rx}deg) rotateY(${jetAnchorFrozen.ry}deg) rotateZ(${jetAnchorFrozen.rz}deg) ` +
      `scale3d(${1 + 0.03 * jetAnchorFrozen.sq}, ${1 - 0.06 * jetAnchorFrozen.sq}, 1)`;
  }

  groundShadow.style.transform = `translate3d(${packPose.x.x}px, ${packHeight / 2 + 26}px, 0) scale(${1 - packPose.y.x / 300})`;
  groundShadow.style.opacity = String(
    stageState === 'enter' || stageState === 'idle'
      ? clamp(1 - Math.abs(packPose.x.x) / 300, 0, 1)
      : packFall
        ? clamp(1 - packFall.y / 160, 0, 1)
        : 0
  );

  // 卡牌出包、螺旋与扇形交互
  if (stageState === 'open' && !orbitStartedAt && prefersReducedMotion) {
    orbitStartedAt = clockSec;
    scene.classList.add('flat');
  }
  if (stageState === 'open' && !orbitStartedAt && !prefersReducedMotion && cards.length && cards.every((c) => c.phase === 'ejected')) {
    const mouthY = packPose.y.x + (packFall ? packFall.y : 0) + packHeight * (Math.max(...tearVertices.map((q) => q[1])) / 100 - 0.5);
    const cardHeightApprox = packWidth * 1.176;
    if (cards.every((c) => c.pose.y.x + cardHeightApprox * 0.36 < mouthY)) {
      beginCardOrbit();
    }
  }

  for (const c of cards) {
    if (c.phase === 'orbit') stepCardOrbit(c);
  }

  [...cards].sort((a, b) => a.pose.z.x - b.pose.z.x).forEach((c, rankIdx) => {
    c.depthRank = rankIdx + 1;
  });

  const hoveredTarget = binderModal.hidden && (pointer.inside || pointer.tapped) ? hitTestHoveredCard() : null;
  const isPortraitLayout = window.innerHeight > window.innerWidth * 1.15;
  pointer.tapped = false;

  for (const c of cards) {
    const p = c.pose;
    const sinceOpen = clockSec - openedAtSec;

    if (c.phase === 'inside' && !prefersReducedMotion && sinceOpen > c.idx * 0.022) {
      c.phase = 'ejected';
      p.s.to = 1;
      p.y.k = 0;
      p.y.c = 1.2;
      p.y.v = (-rand(1260, 1450) * packHeight) / 420;
    }

    // 翻面跨过 90 度瞬间弹出 3D 角色立绘
    if (!c.frontShown && c.flip.x < 90) {
      c.frontShown = true;
      c.el.classList.add('front-visible');
    }

    if (c.phase === 'fanned') {
      const isZoomed = zoomedCard === c;
      if (c === hoveredTarget) {
        c.touchHoldUntil = clockSec + (pointer.isTouch ? 1.1 : 0);
      }
      const active = isZoomed || c === hoveredTarget || clockSec < c.touchHoldUntil || c.kbFocused;
      c.hovered = active;

      if (c.kbFocused && c !== hoveredTarget) {
        c.hx = 0.5 + Math.sin(clockSec * 1.7) * 0.22 * motionScale;
        c.hy = 0.5 + Math.cos(clockSec * 1.3) * 0.16 * motionScale;
      }

      if (active !== c.wasHovered) {
        c.wasHovered = active;
        c.el.classList.toggle('hovered', active);
        if (active) {
          if (!c.revealed && RARITY_META[c.def.rarity].rank >= 2) {
            sound.call('cardTease', c.def.rarity, c.slot);
          } else {
            sound.call('cardHover', c.slot);
          }
        }
      }

      if (motionScale && c.revealed && clockSec > c.nextBlink) {
        c.nextBlink = clockSec + rand(2.2, 5.4);
        triggerBlink(c.eyes, Math.random() < 0.25 ? 2 : 1);
      }

      const f = c.fan;
      const idleWave = clockSec * 0.8 + c.idx * 1.9;
      // 未翻开高罕卡在悬停时带有细微蓄力震颤
      const suspenseTremor =
        !c.revealed && active && motionScale && RARITY_META[c.def.rarity].rank >= 3
          ? Math.sin(clockSec * 44) * (RARITY_META[c.def.rarity].rank - 1.5) * 0.55
          : 0;

      if (isZoomed) {
        p.x.to = 0;
        p.y.to = -window.innerHeight * 0.04;
        p.z.to = 260;
        p.rz.to = 0;
        p.s.to = Math.min(1.32, (window.innerWidth * 0.78) / (packWidth * 0.84));
        p.rx.to = (0.5 - c.hy) * 32;
        p.ry.to = (c.hx - 0.5) * 36;
      } else if (zoomedCard || showcaseCard) {
        p.x.to = f.x * 1.06;
        p.y.to = f.y + 18;
        p.z.to = f.z - 80;
        p.rz.to = f.rz;
        p.s.to = f.s * 0.92;
        p.rx.to = 0;
        p.ry.to = 0;
      } else {
        const tiltSign = c.revealed ? 1 : -1;
        p.x.to = f.x;
        p.s.to = f.s;
        p.y.to = f.y + (active ? -18 : Math.sin(idleWave * 1.2) * 5 * motionScale);
        p.z.to = f.z + (active ? 115 : 0);
        p.rz.to = (active ? f.rz * 0.3 : f.rz) + suspenseTremor;
        p.rx.to = active ? (0.5 - c.hy) * 32 : Math.cos(idleWave * 0.9) * 4 * motionScale;
        p.ry.to = active ? (c.hx - 0.5) * 36 * tiltSign : Math.sin(idleWave) * 8 * motionScale;
      }
    }

    const isFree = c.phase === 'fanned' || c.phase === 'orbit';
    const rx = isFree ? p.rx.x - clamp(p.y.v * 0.006, -8, 8) : packPose.rx.x;
    const tiltRy = isFree ? p.ry.x + clamp(p.x.v * 0.008, -12, 12) : packPose.ry.x;
    const totalRy = tiltRy + c.flip.x;

    c.el.style.transform =
      `translate3d(${p.x.x}px, ${p.y.x}px, ${p.z.x}px) ` +
      `rotateZ(${p.rz.x}deg) rotateX(${rx}deg) rotateY(${totalRy}deg) scale(${p.s.x})`;

    if (isFree) {
      c.elevated = zoomedCard === c || (!zoomedCard && (c.hovered || (c.elevated && p.z.x > c.fan.z + 30)));
    }
    c.el.style.zIndex = String(zoomedCard === c ? 20 : c.elevated ? 10 : c.phase === 'orbit' || isPortraitLayout ? c.depthRank : cards.length - c.idx);

    if (c.phase === 'fanned' && c.frontShown) {
      const nx = clamp(tiltRy / 24, -1, 1);
      const ny = clamp(rx / 24, -1, 1);
      c.faceEl.style.setProperty('--px', (50 + nx * 50).toFixed(1));
      c.faceEl.style.setProperty('--py', (50 - ny * 50).toFixed(1));
      c.faceEl.style.setProperty('--hyp', Math.min(1, Math.hypot(nx, ny)).toFixed(3));
    }
  }

  // 图鉴独立 3D 展示卡更新
  if (showcaseCard) {
    const sp = showcaseCard.pose;
    const active = hoveredTarget === showcaseCard;
    sp.rx.to = active ? (0.5 - showcaseCard.hy) * 32 : Math.cos(clockSec * 1.1) * 6 * motionScale;
    sp.ry.to = active ? (showcaseCard.hx - 0.5) * 36 : Math.sin(clockSec * 0.9) * 14 * motionScale;
    showcaseCard.el.style.transform =
      `translate3d(${sp.x.x}px, ${sp.y.x}px, ${sp.z.x}px) ` +
      `rotateX(${sp.rx.x}deg) rotateY(${sp.ry.x}deg) scale(${sp.s.x})`;
    const nx = clamp(sp.ry.x / 24, -1, 1);
    const ny = clamp(sp.rx.x / 24, -1, 1);
    showcaseCard.faceEl.style.setProperty('--px', (50 + nx * 50).toFixed(1));
    showcaseCard.faceEl.style.setProperty('--py', (50 - ny * 50).toFixed(1));
    showcaseCard.faceEl.style.setProperty('--hyp', Math.min(1, Math.hypot(nx, ny)).toFixed(3));
  }

  if (stageState === 'open' && orbitStartedAt && clockSec > orbitStartedAt + (prefersReducedMotion ? 0.1 : ORBIT_DURATION + 0.22)) {
    stageState = 'spread';
    updateDockButtons();
    if (openedByKeyboard) (flipAllBtn.hidden ? againBtn : flipAllBtn).focus();
  }

  // 绘制纸屑、火花与翻牌冲击波
  if (confettiDirty) {
    ctx2d.setTransform(1, 0, 0, 1, 0, 0);
    ctx2d.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    confettiDirty = false;
  }

  const dpr = confettiCanvas.width / window.innerWidth;
  const originX = window.innerWidth / 2;
  const originY = window.innerHeight * 0.4;
  const deg = Math.PI / 180;

  // 1. 冲击波扩散光环
  if (shockRings.length) {
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    shockRings = shockRings.filter((ring) => {
      ring.age += dt;
      if (ring.age < 0) return true;
      const u = ring.age / ring.life;
      if (u >= 1) return false;
      const ease = 1 - Math.pow(1 - u, 3);
      const r = ring.r0 + (ring.r1 - ring.r0) * ease;
      ctx2d.save();
      ctx2d.globalAlpha = Math.pow(1 - u, 1.6) * 0.9;
      ctx2d.strokeStyle = ring.color;
      ctx2d.lineWidth = Math.max(0.5, ring.width * (1 - u * 0.7));
      ctx2d.beginPath();
      ctx2d.arc(ring.x, ring.y, r, 0, Math.PI * 2);
      ctx2d.stroke();
      ctx2d.restore();
      confettiDirty = true;
      return true;
    });
  }

  // 2. 四芒星火花粒子
  if (sparkParticles.length) {
    sparkParticles = sparkParticles.filter((sp) => {
      sp.age += dt;
      if (sp.age >= sp.life) return false;
      sp.vy += sp.gravity * dt;
      sp.vx *= 1 - Math.min(0.9, 2.4 * dt);
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.rot += sp.spin * dt;
      const u = sp.age / sp.life;
      const k = dpr * sp.scale * (1 - u * 0.65);
      const cr = Math.cos(sp.rot);
      const sr = Math.sin(sp.rot);
      ctx2d.setTransform(k * cr, k * sr, -k * sr, k * cr, sp.x * dpr, sp.y * dpr);
      ctx2d.globalAlpha = Math.pow(1 - u, 1.25);
      ctx2d.fillStyle = sp.color;
      ctx2d.fill(STAR_SPARK_PATH);
      ctx2d.globalAlpha = 1;
      confettiDirty = true;
      return true;
    });
  }

  // 3. 3D 翻滚彩纸屑
  confettiBits = confettiBits.filter((b) => {
    if (b.age === undefined || (b.age += dt) < 0) return true;
    if (b.insidePouch) {
      b.ly -= (b.upSpeed * dt / packHeight) * 100;
      b.rot += b.spin * dt;
      if (b.ly > tearYAt(b.lx)) return true;
      [b.x, b.y, b.z] = packLocalToStage(b.lx, b.ly, b.lz);
      b.insidePouch = false;
      b.age = 0;
      b.rot0 = b.rot;
      b.vx = Math.sin(b.spreadAngle) * b.burstSpeed;
      b.vy = -Math.cos(b.spreadAngle) * b.burstSpeed;
      b.vz = rand(0, 160);
    }

    b.z += b.vz * dt;
    b.vy += 2600 * dt;
    b.vx += (Math.sin(b.phase) * b.flutterAmp + b.driftX) * dt;

    const speed = Math.hypot(b.vx, b.vy);
    const dragFactor = 1 / (1 + b.dragCoeff * Math.min(1, 0.06 + b.age / 0.45) * speed * dt);
    const tumbleRate = 0.35 + speed / 800;

    b.vx *= dragFactor;
    b.vy *= dragFactor;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.rot += b.spin * tumbleRate * dt;
    b.phase += 7 * tumbleRate * dt;

    if (b.y >= window.innerHeight / 2 + 40) return false;

    const persp = 1400 / (1400 - b.z);
    const k = dpr * persp * b.scale;
    const cr = Math.cos(b.rot * deg);
    const sr = Math.sin(b.rot * deg);
    const foreshorten = Math.cos((b.rot - b.rot0) * 0.7 * deg);

    ctx2d.setTransform(k * cr, k * sr, -k * sr * foreshorten, k * cr * foreshorten, (originX + b.x * persp) * dpr, (originY + (window.innerHeight * 0.1 + b.y) * persp) * dpr);
    ctx2d.fillStyle = b.color;
    ctx2d.fill(CONFETTI_SHAPES[b.shapeIdx]);
    confettiDirty = true;
    return true;
  });

  requestAnimationFrame(tick);
}

measureStage();
enterFreshPack();
requestAnimationFrame(tick);
