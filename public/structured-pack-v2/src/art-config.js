/**
 * 卡池、稀有度概率与包装配置文件（唯一数据入口）
 *
 * 自定义卡面说明：
 * 1. 仅替换角色图：修改 `character.image` 指向你的透明 PNG/WebP；不需要表情绑定时设 `character.rigged = false`。
 * 2. 整张卡面直出：在卡片对象上增加 `fullArtImage: 'assets/your-card.png'`，保留全息闪膜、卡背悬念翻牌与厚度。
 */

export const PACK_BRAND = {
  logo: 'PRISM',
  seriesCode: 'ARCHIVE · S01',
  tearHint: '◀ TEAR SEAL ⟶',
  footerLeft: 'SERIES 01 // ARCHIVE',
  footerRight: '5 FOIL CARDS',
  microSpec: 'METALLIZED EDITION · HOLO GUARANTEED',
  backHeadline: '12 Archival Sprites\nHolo Foil or Higher Guaranteed',
  backSpec: 'AUTHENTIC MYLAR FOIL PACK · LOT 2026-S01',
};

export const PACK_THEMES = [
  { name: 'COBALT', code: 'CBL-01', color: '#1e38dc', highlight: '#7ba2ff', shadow: '#081042' },
  { name: 'CRIMSON', code: 'CRM-02', color: '#cc292b', highlight: '#ff8566', shadow: '#3d070c' },
  { name: 'VIOLET', code: 'VLT-03', color: '#5928db', highlight: '#b594ff', shadow: '#180742' },
  { name: 'EMERALD', code: 'EMR-04', color: '#0b7d5e', highlight: '#63ebb9', shadow: '#04291f' },
  { name: 'OBSIDIAN', code: 'OBS-05', color: '#1d2336', highlight: '#8a9bc4', shadow: '#070912' },
  { name: 'ROSE', code: 'RSE-06', color: '#c42b74', highlight: '#ff91c7', shadow: '#3d0823' },
];

// 稀有度视觉与悬念光环定义
export const RARITY_META = {
  common: { rank: 1, aura: 'rgba(180, 195, 220, 0.0)', shockColor: '#ffffff', autoFlip: true },
  rare: { rank: 2, aura: '#7c6bff', shockColor: '#9b8cff', autoFlip: false },
  holo: { rank: 3, aura: '#3ad8ff', shockColor: '#5ce6ff', autoFlip: false },
  ultra: { rank: 4, aura: '#ffbe2e', shockColor: '#ffd454', autoFlip: false },
  secret: { rank: 5, aura: '#ff5cd6', shockColor: '#ff7ae6', autoFlip: false },
};

export const MASCOT_CONFIG = {
  image: 'assets/characters/mascot.png',
  eyeLeft: { x: 37.5, y: 45.5, size: 7.4 },
  eyeRight: { x: 54.5, y: 44.5, size: 7.4 },
  mouth: { x: 46.2, y: 52.5, width: 7.2 },
  sweat: { x: 63.0, y: 34.0, width: 6.2 },
};

// 12 张完整图鉴卡池（4 Common · 3 Rare · 2 Holo · 2 Ultra · 1 Secret）
export const CARD_POOL = [
  {
    id: 'mochi',
    name: 'Mochi',
    tag: 'SPARK',
    trait: '初生暖焰 · Ember Puff',
    serial: '001/012',
    rarity: 'common',
    rarityMark: '◆',
    rarityLabel: 'COMMON',
    frameBg: 'linear-gradient(155deg, #e8d8ce 0%, #cfb4a4 48%, #9e7e6e 100%)',
    plaqueBg: 'linear-gradient(180deg, rgba(252, 246, 242, 0.94), rgba(238, 225, 216, 0.96))',
    edgeColor: '#8c6d5e',
    textColor: '#231712',
    windowBg:
      'radial-gradient(85% 65% at 50% 26%, rgba(255, 244, 224, 0.9) 0%, rgba(255, 179, 138, 0.55) 44%, transparent 76%), ' +
      'radial-gradient(90% 70% at 50% 88%, #6e2b23 0%, transparent 72%), ' +
      'linear-gradient(170deg, #ff9d76 0%, #d95b49 56%, #4a1c1d 100%)',
    character: {
      image: 'assets/characters/mochi.png',
      rigged: true,
      eyeLeft: { x: 35.5, y: 49.0, size: 8.6 },
      eyeRight: { x: 55.5, y: 49.0, size: 8.6 },
      mouth: { x: 46.2, y: 58.0, width: 8.2 },
    },
  },
  {
    id: 'voxel',
    name: 'Voxel',
    tag: 'MATRIX',
    trait: '晶格构筑 · Jade Tessera',
    serial: '002/012',
    rarity: 'common',
    rarityMark: '◆',
    rarityLabel: 'COMMON',
    frameBg: 'linear-gradient(155deg, #d7e4dc 0%, #a9c2b5 48%, #6f8c7e 100%)',
    plaqueBg: 'linear-gradient(180deg, rgba(244, 250, 246, 0.94), rgba(223, 236, 228, 0.96))',
    edgeColor: '#5c786a',
    textColor: '#13221b',
    windowBg:
      'radial-gradient(75% 60% at 50% 30%, rgba(150, 255, 214, 0.45) 0%, transparent 68%), ' +
      'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.08) 75%, transparent 75%) 0 0 / 28px 28px, ' +
      'linear-gradient(175deg, #1b7a64 0%, #0d473b 62%, #06211c 100%)',
    character: {
      image: 'assets/characters/voxel.png',
      rigged: true,
      eyeLeft: { x: 40.5, y: 46.5, size: 8.2 },
      eyeRight: { x: 58.5, y: 45.0, size: 8.2 },
      mouth: { x: 50.0, y: 54.8, width: 7.6 },
    },
  },
  {
    id: 'sprout',
    name: 'Sprout',
    tag: 'FLORA',
    trait: '晨露新芽 · Canopy Dew',
    serial: '003/012',
    rarity: 'common',
    rarityMark: '◆',
    rarityLabel: 'COMMON',
    frameBg: 'linear-gradient(155deg, #dcebd9 0%, #b1cfa9 48%, #76996f 100%)',
    plaqueBg: 'linear-gradient(180deg, rgba(245, 251, 243, 0.94), rgba(226, 239, 222, 0.96))',
    edgeColor: '#63855d',
    textColor: '#142416',
    windowBg:
      'radial-gradient(80% 55% at 50% 22%, rgba(226, 255, 189, 0.78) 0%, rgba(114, 214, 134, 0.32) 52%, transparent 78%), ' +
      'radial-gradient(100% 60% at 50% 100%, #0c331e 0%, transparent 70%), ' +
      'linear-gradient(175deg, #5ec279 0%, #267847 58%, #0f3b22 100%)',
    character: {
      image: 'assets/characters/sprout.png',
      rigged: true,
      eyeLeft: { x: 38.0, y: 52.0, size: 8.0 },
      eyeRight: { x: 55.0, y: 52.0, size: 8.0 },
      mouth: { x: 47.0, y: 60.5, width: 7.4 },
    },
  },
  {
    id: 'cloudy',
    name: 'Nimbus',
    tag: 'ZEPHYR',
    trait: '高空流云 · Stratosphere',
    serial: '004/012',
    rarity: 'common',
    rarityMark: '◆',
    rarityLabel: 'COMMON',
    frameBg: 'linear-gradient(155deg, #dde7f2 0%, #b3c7de 48%, #7891ad 100%)',
    plaqueBg: 'linear-gradient(180deg, rgba(245, 249, 254, 0.94), rgba(225, 234, 245, 0.96))',
    edgeColor: '#647d99',
    textColor: '#14202e',
    windowBg:
      'radial-gradient(90% 60% at 50% 20%, rgba(255, 255, 255, 0.88) 0%, rgba(173, 219, 255, 0.42) 48%, transparent 78%), ' +
      'linear-gradient(175deg, #6bb5ff 0%, #3778c2 58%, #18365e 100%)',
    character: {
      image: 'assets/characters/cloudy.png',
      rigged: true,
      eyeLeft: { x: 37.5, y: 50.5, size: 7.8 },
      eyeRight: { x: 54.5, y: 50.5, size: 7.8 },
      mouth: { x: 46.5, y: 58.5, width: 7.2 },
    },
  },
  {
    id: 'blaze',
    name: 'Ember',
    tag: 'IGNIS',
    trait: '熔核炽羽 · Magma Core',
    serial: '005/012',
    rarity: 'rare',
    rarityMark: '◆◆',
    rarityLabel: 'RARE',
    frameBg: 'linear-gradient(155deg, #59202b 0%, #2e0f17 50%, #17070c 100%)',
    plaqueBg: 'linear-gradient(180deg, rgba(40, 14, 21, 0.93), rgba(24, 8, 13, 0.96))',
    edgeColor: '#1f080e',
    textColor: '#fff0f2',
    windowBg:
      'radial-gradient(70% 58% at 50% 54%, rgba(255, 198, 92, 0.88) 0%, rgba(235, 68, 62, 0.62) 45%, transparent 76%), ' +
      'radial-gradient(90% 50% at 50% 10%, rgba(255, 110, 74, 0.35), transparent 70%), ' +
      'linear-gradient(175deg, #5c1020 0%, #2e0712 62%, #120308 100%)',
    character: {
      image: 'assets/characters/blaze.png',
      rigged: true,
      eyeLeft: { x: 38.5, y: 53.5, size: 7.8 },
      eyeRight: { x: 54.5, y: 53.5, size: 7.8 },
      mouth: { x: 47.0, y: 61.5, width: 7.0 },
    },
  },
  {
    id: 'ripple',
    name: 'Tide',
    tag: 'ABYSS',
    trait: '深海潮汐 · Pelagic Pulse',
    serial: '006/012',
    rarity: 'rare',
    rarityMark: '◆◆',
    rarityLabel: 'RARE',
    frameBg: 'linear-gradient(155deg, #184459 0%, #0c2533 50%, #06131c 100%)',
    plaqueBg: 'linear-gradient(180deg, rgba(13, 35, 48, 0.93), rgba(7, 20, 29, 0.96))',
    edgeColor: '#071722',
    textColor: '#e8faff',
    windowBg:
      'radial-gradient(80% 50% at 50% 18%, rgba(120, 242, 255, 0.68) 0%, rgba(26, 150, 196, 0.36) 48%, transparent 78%), ' +
      'radial-gradient(65% 55% at 50% 68%, rgba(56, 214, 235, 0.28), transparent 72%), ' +
      'linear-gradient(175deg, #0d5d7a 0%, #072f45 58%, #03131f 100%)',
    character: {
      image: 'assets/characters/ripple.png',
      rigged: true,
      eyeLeft: { x: 39.5, y: 47.5, size: 7.4 },
      eyeRight: { x: 53.5, y: 47.5, size: 7.4 },
      mouth: { x: 46.8, y: 55.2, width: 6.8 },
    },
  },
  {
    id: 'amethyst',
    name: 'Facet',
    tag: 'CRYSTAL',
    trait: '紫晶折射 · Geode Prism',
    serial: '007/012',
    rarity: 'rare',
    rarityMark: '◆◆',
    rarityLabel: 'RARE',
    frameBg: 'linear-gradient(155deg, #372975 0%, #1b1440 50%, #0e0a24 100%)',
    plaqueBg: 'linear-gradient(180deg, rgba(27, 20, 58, 0.93), rgba(15, 11, 34, 0.96))',
    edgeColor: '#110c2b',
    textColor: '#f2efff',
    windowBg:
      'linear-gradient(125deg, rgba(255, 255, 255, 0.14) 0%, transparent 32%, rgba(176, 138, 255, 0.18) 54%, transparent 78%), ' +
      'radial-gradient(70% 60% at 50% 42%, rgba(168, 130, 255, 0.78) 0%, rgba(76, 42, 176, 0.48) 52%, transparent 80%), ' +
      'linear-gradient(175deg, #2d1b70 0%, #170d42 62%, #09051f 100%)',
    character: {
      image: 'assets/characters/amethyst.png',
      rigged: true,
      eyeLeft: { x: 38.5, y: 47.0, size: 8.2 },
      eyeRight: { x: 56.5, y: 46.0, size: 8.2 },
      mouth: { x: 48.0, y: 55.5, width: 7.4 },
    },
  },
  {
    id: 'saturn',
    name: 'Orbit',
    tag: 'COSMOS',
    trait: '星环巡游 · Celestial Ring',
    serial: '008/012',
    rarity: 'holo',
    rarityMark: '◆◆◆',
    rarityLabel: 'HOLO RARE',
    frameBg: 'linear-gradient(155deg, #2b3f8c 0%, #152052 48%, #0b102e 100%)',
    plaqueBg: 'linear-gradient(180deg, rgba(18, 28, 68, 0.93), rgba(10, 16, 42, 0.96))',
    edgeColor: '#0c1336',
    textColor: '#edf3ff',
    windowBg:
      'radial-gradient(circle, rgba(255, 255, 255, 0.9) 0 1px, transparent 1.6px) 0 0 / 32px 32px, ' +
      'radial-gradient(circle, rgba(168, 212, 255, 0.65) 0 0.9px, transparent 1.5px) 15px 11px / 23px 23px, ' +
      'radial-gradient(75% 58% at 50% 46%, rgba(88, 148, 255, 0.62) 0%, rgba(38, 68, 184, 0.35) 54%, transparent 82%), ' +
      'linear-gradient(170deg, #0b133b 0%, #162b78 55%, #070b24 100%)',
    character: {
      image: 'assets/characters/saturn.png',
      rigged: true,
      eyeLeft: { x: 39.0, y: 49.5, size: 7.4 },
      eyeRight: { x: 54.0, y: 48.5, size: 7.4 },
      mouth: { x: 46.8, y: 56.8, width: 6.8 },
    },
  },
  {
    id: 'nebula',
    name: 'Vortex',
    tag: 'NEBULA',
    trait: '星云坍缩 · Event Horizon',
    serial: '009/012',
    rarity: 'holo',
    rarityMark: '◆◆◆',
    rarityLabel: 'HOLO RARE',
    frameBg: 'linear-gradient(155deg, #54206e 0%, #260d38 50%, #12051c 100%)',
    plaqueBg: 'linear-gradient(180deg, rgba(36, 13, 52, 0.93), rgba(19, 6, 29, 0.96))',
    edgeColor: '#160624',
    textColor: '#fcedff',
    windowBg:
      'radial-gradient(circle, rgba(255, 230, 255, 0.78) 0 1px, transparent 1.6px) 6px 8px / 28px 28px, ' +
      'radial-gradient(70% 58% at 50% 46%, rgba(255, 102, 224, 0.75) 0%, rgba(118, 34, 196, 0.5) 48%, transparent 82%), ' +
      'linear-gradient(170deg, #24083d 0%, #4d136e 52%, #11041f 100%)',
    character: {
      image: 'assets/characters/nebula.png',
      rigged: true,
      eyeLeft: { x: 41.5, y: 46.5, size: 6.8 },
      eyeRight: { x: 53.0, y: 46.5, size: 6.8 },
      mouth: { x: 47.5, y: 53.8, width: 6.2 },
    },
  },
  {
    id: 'prismix',
    name: 'Prismix',
    tag: 'ORIGIN',
    trait: '原初棱镜 · Genesis Spectrum',
    serial: '010/012',
    rarity: 'ultra',
    rarityMark: '★★★',
    rarityLabel: 'ULTRA RARE',
    frameBg: 'linear-gradient(135deg, #f4f7ff 0%, #c5d6ff 26%, #ffffff 50%, #d8c7ff 74%, #dce8ff 100%)',
    plaqueBg: 'linear-gradient(180deg, rgba(248, 250, 255, 0.94), rgba(232, 238, 252, 0.97))',
    edgeColor: '#7b8ec4',
    textColor: '#161d36',
    windowBg:
      'radial-gradient(68% 58% at 50% 45%, rgba(255, 255, 255, 0.92) 0%, rgba(132, 224, 255, 0.62) 38%, rgba(162, 132, 255, 0.48) 68%, transparent 92%), ' +
      'linear-gradient(125deg, #3264d6 0%, #5b3fd6 36%, #249ec9 72%, #1d2659 100%)',
    character: {
      image: 'assets/characters/mascot.png',
      rigged: true,
      eyeLeft: { x: 37.5, y: 45.5, size: 7.4 },
      eyeRight: { x: 54.5, y: 44.5, size: 7.4 },
      mouth: { x: 46.2, y: 52.5, width: 7.2 },
    },
  },
  {
    id: 'helios',
    name: 'Helios',
    tag: 'SOLAR',
    trait: '曜金日冕 · Sovereign Corona',
    serial: '011/012',
    rarity: 'ultra',
    rarityMark: '★★★',
    rarityLabel: 'ULTRA RARE',
    frameBg: 'linear-gradient(135deg, #fff0ba 0%, #d9a136 28%, #fff7d6 50%, #bd821c 74%, #f5d67f 100%)',
    plaqueBg: 'linear-gradient(180deg, rgba(255, 249, 232, 0.94), rgba(244, 228, 188, 0.97))',
    edgeColor: '#8c5e14',
    textColor: '#2e1c00',
    windowBg:
      'radial-gradient(66% 56% at 50% 46%, rgba(255, 248, 196, 0.96) 0%, rgba(255, 166, 58, 0.72) 42%, rgba(194, 58, 48, 0.48) 74%, transparent 95%), ' +
      'linear-gradient(165deg, #6e2219 0%, #b8531e 48%, #36100d 100%)',
    character: {
      image: 'assets/characters/helios.png',
      rigged: true,
      eyeLeft: { x: 38.5, y: 47.5, size: 7.6 },
      eyeRight: { x: 55.0, y: 47.0, size: 7.6 },
      mouth: { x: 47.0, y: 55.5, width: 7.2 },
    },
  },
  {
    id: 'astral',
    name: 'Astral',
    tag: 'RELIC',
    trait: '秘藏星骸 · Eternal Relic',
    serial: '012/012',
    rarity: 'secret',
    rarityMark: '✦✦✦',
    rarityLabel: 'SECRET RARE',
    frameBg: 'linear-gradient(135deg, #242033 0%, #40325e 28%, #14121f 52%, #2d3c59 76%, #181526 100%)',
    plaqueBg: 'linear-gradient(180deg, rgba(24, 21, 36, 0.94), rgba(14, 12, 23, 0.97))',
    edgeColor: '#d4af5a',
    textColor: '#fff5d6',
    windowBg:
      'radial-gradient(circle, rgba(255, 232, 166, 0.85) 0 1px, transparent 1.7px) 4px 6px / 24px 24px, ' +
      'radial-gradient(68% 56% at 50% 46%, rgba(255, 214, 118, 0.56) 0%, rgba(168, 78, 235, 0.45) 46%, rgba(42, 168, 224, 0.26) 74%, transparent 92%), ' +
      'linear-gradient(165deg, #0d0b18 0%, #22163d 52%, #090812 100%)',
    character: {
      image: 'assets/characters/astral.png',
      rigged: true,
      eyeLeft: { x: 42.0, y: 47.5, size: 6.4 },
      eyeRight: { x: 53.0, y: 47.5, size: 6.4 },
      mouth: { x: 47.6, y: 54.5, width: 5.8 },
    },
  },
];
