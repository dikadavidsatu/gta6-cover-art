// Vice Frame UI wiring: photo loading, panel framing, presets, lettering,
// before/after, randomize, demo mode and full-resolution PNG export.
import { renderCover, LAYOUTS } from './render.js';
import { demoScenes } from './scenes.js';

const $ = (id) => document.getElementById(id);
const stage = $('stage-canvas');
const sctx = stage.getContext('2d');

const state = {
  layout: 'classic',
  preset: 'sunset',
  grade: 1,
  grain: 0.35,
  vignette: 0.55,
  palms: true,
  skyline: true,
  sun: true,
  title: 'VICE HEAT',
  subtitle: 'WELCOME BACK TO THE CITY OF NEON',
  titleSize: 1,
  badge: true,
  badgeText: 'VI',
  selected: 0,
  frames: [],
  size: '1080x1350',
};

const photos = []; // { img, url, thumb }
let before = false;
let shotMode = false;
let lastRects = [];

function resetFrames() {
  const n = (LAYOUTS[state.layout] || []).length;
  state.frames = Array.from({ length: n }, (_, i) => state.frames[i] || { zoom: 1, panX: 0, panY: 0 });
  if (state.selected >= n) state.selected = 0;
}

function draw() {
  const [w, h] = state.size.split('x').map(Number);
  if (stage.width !== w || stage.height !== h) { stage.width = w; stage.height = h; }
  const view = { ...state, selected: before || shotMode ? null : state.selected };
  lastRects = renderCover(sctx, w, h, view, photos.map((p) => p.img), before);
  $('empty-note').classList.toggle('hide', photos.length > 0);
  $('photo-count').textContent = `${photos.length} / 5`;
  $('panel-label').textContent = `Panel ${state.selected + 1} selected`;
}

function syncFrameControls() {
  const f = state.frames[state.selected] || { zoom: 1, panX: 0, panY: 0 };
  $('zoom').value = f.zoom;
  $('panx').value = f.panX;
  $('pany').value = f.panY;
}

function addPhoto(img, url) {
  if (photos.length >= 5) return;
  photos.push({ img, url });
  const fig = document.createElement('figure');
  const t = document.createElement('img');
  t.src = url;
  t.alt = 'Loaded photo';
  const x = document.createElement('button');
  x.type = 'button';
  x.textContent = '×';
  x.title = 'Remove photo';
  x.addEventListener('click', () => {
    const i = photos.findIndex((p) => p.url === url);
    if (i >= 0) photos.splice(i, 1);
    fig.remove();
    draw();
  });
  fig.append(t, x);
  $('thumbs').append(fig);
  draw();
}

function loadFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => addPhoto(img, url);
  img.src = url;
}

async function loadDemo() {
  for (const scene of demoScenes()) {
    if (photos.length >= 5) break;
    const url = await new Promise((res) => scene.toBlob(res, 'image/png'));
    const blobUrl = URL.createObjectURL(url);
    const img = new Image();
    await new Promise((res) => { img.onload = res; img.src = blobUrl; });
    addPhoto(img, blobUrl);
  }
}

function segWire(id, attr, apply) {
  $(id).addEventListener('click', (e) => {
    const btn = e.target.closest(`button[data-${attr}]`);
    if (!btn) return;
    for (const b of $(id).querySelectorAll('button')) b.classList.toggle('on', b === btn);
    apply(btn.dataset[attr]);
    draw();
  });
}

segWire('layout-seg', 'layout', (v) => { state.layout = v; resetFrames(); syncFrameControls(); });
segWire('preset-seg', 'preset', (v) => { state.preset = v; });
segWire('size-seg', 'size', (v) => { state.size = v; });

const frameInput = (id, key) => {
  $(id).addEventListener('input', () => {
    const f = state.frames[state.selected];
    if (f) f[key] = Number($(id).value);
    draw();
  });
};
frameInput('zoom', 'zoom');
frameInput('panx', 'panX');
frameInput('pany', 'panY');

$('grade').addEventListener('input', () => { state.grade = Number($('grade').value); draw(); });
$('grain').addEventListener('input', () => { state.grain = Number($('grain').value); draw(); });
$('vignette').addEventListener('input', () => { state.vignette = Number($('vignette').value); draw(); });
$('opt-palms').addEventListener('change', () => { state.palms = $('opt-palms').checked; draw(); });
$('opt-skyline').addEventListener('change', () => { state.skyline = $('opt-skyline').checked; draw(); });
$('opt-sun').addEventListener('change', () => { state.sun = $('opt-sun').checked; draw(); });
$('title').addEventListener('input', () => { state.title = $('title').value; draw(); });
$('subtitle').addEventListener('input', () => { state.subtitle = $('subtitle').value; draw(); });
$('title-size').addEventListener('input', () => { state.titleSize = Number($('title-size').value); draw(); });
$('opt-badge').addEventListener('change', () => { state.badge = $('opt-badge').checked; draw(); });
$('badge-text').addEventListener('input', () => { state.badgeText = $('badge-text').value || 'VI'; draw(); });

const drop = $('drop-zone');
$('file-input').addEventListener('change', (e) => {
  for (const f of e.target.files) loadFile(f);
  e.target.value = '';
});
for (const ev of ['dragover', 'dragenter']) drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); });
for (const ev of ['dragleave', 'drop']) drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); });
drop.addEventListener('drop', (e) => { for (const f of e.dataTransfer.files) loadFile(f); });
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => e.preventDefault());

stage.addEventListener('click', (e) => {
  const r = stage.getBoundingClientRect();
  const x = (e.clientX - r.left) * (stage.width / r.width);
  const y = (e.clientY - r.top) * (stage.height / r.height);
  const i = lastRects.findIndex((p) => x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h);
  if (i >= 0) { state.selected = i; syncFrameControls(); draw(); }
});

const beforeBtn = $('btn-before');
const setBefore = (v) => { before = v; beforeBtn.classList.toggle('on', v); draw(); };
beforeBtn.addEventListener('mousedown', () => setBefore(true));
window.addEventListener('mouseup', () => { if (before) setBefore(false); });
beforeBtn.addEventListener('click', () => setBefore(false));

const CAPTIONS = [
  ['VICE HEAT', 'WELCOME BACK TO THE CITY OF NEON'],
  ['NEON HARBOR', 'EVERY SUNSET HIDES A SCORE'],
  ['PALM CITY', 'TRUST NO ONE AFTER DARK'],
  ['MIDNIGHT REV', 'ONE LAST RIDE DOWN OCEAN DRIVE'],
  ['GOLDEN GUNS', 'LOYALTY IS A LOADED WORD'],
];
$('btn-random').addEventListener('click', () => {
  const layouts = Object.keys(LAYOUTS);
  const presets = ['sunset', 'neon', 'golden'];
  state.layout = layouts[Math.floor(Math.random() * layouts.length)];
  state.preset = presets[Math.floor(Math.random() * presets.length)];
  const [t, s] = CAPTIONS[Math.floor(Math.random() * CAPTIONS.length)];
  state.title = t; state.subtitle = s;
  $('title').value = t; $('subtitle').value = s;
  state.grain = 0.15 + Math.random() * 0.5;
  state.vignette = 0.3 + Math.random() * 0.5;
  $('grain').value = state.grain; $('vignette').value = state.vignette;
  for (const [id, attr, val] of [['layout-seg', 'layout', state.layout], ['preset-seg', 'preset', state.preset]]) {
    for (const b of $(id).querySelectorAll('button')) b.classList.toggle('on', b.dataset[attr] === val);
  }
  resetFrames();
  syncFrameControls();
  draw();
});

$('btn-demo').addEventListener('click', loadDemo);

$('btn-export').addEventListener('click', () => {
  const [w, h] = state.size.split('x').map(Number);
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  renderCover(out.getContext('2d'), w, h, { ...state, selected: null }, photos.map((p) => p.img), false);
  out.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-frame-${state.size}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    $('export-note').textContent = `Exported vice-frame-${state.size}.png — check your downloads.`;
  }, 'image/png');
});

// URL params: ?demo=1 auto-loads the painted demo photos; ?shot=cover hides
// the UI for clean screenshots; ?caption= / ?preset= / ?layout= preselect.
async function init() {
  const q = new URLSearchParams(location.search);
  if (q.get('shot')) shotMode = true;
  if (q.get('shot') === 'cover') document.body.classList.add('shot-cover');
  if (q.get('caption')) { state.title = q.get('caption'); $('title').value = state.title; }
  if (q.get('subtitle')) { state.subtitle = q.get('subtitle'); $('subtitle').value = state.subtitle; }
  if (q.get('preset') && ['sunset', 'neon', 'golden'].includes(q.get('preset'))) {
    state.preset = q.get('preset');
    for (const b of $('preset-seg').querySelectorAll('button')) b.classList.toggle('on', b.dataset.preset === state.preset);
  }
  if (q.get('layout') && LAYOUTS[q.get('layout')]) {
    state.layout = q.get('layout');
    for (const b of $('layout-seg').querySelectorAll('button')) b.classList.toggle('on', b.dataset.layout === state.layout);
  }
  if (q.get('size') && ['1080x1350', '1080x1080', '1920x1080'].includes(q.get('size'))) {
    state.size = q.get('size');
    for (const b of $('size-seg').querySelectorAll('button')) b.classList.toggle('on', b.dataset.size === state.size);
  }
  resetFrames();
  syncFrameControls();
  draw();
  if (q.get('demo') === '1' || q.get('shot')) await loadDemo();
  draw();
  document.title = 'Vice Frame — ready';
}

init();
