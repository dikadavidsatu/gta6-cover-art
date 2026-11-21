// Vice Frame — workbench wiring.
//
// Owns the editable state, loads the visitor's photos (files stay local),
// connects every control in the rail to the renderer in render.js, and handles
// the full-resolution PNG export. Demo mode and the screenshot URL parameters
// are resolved once at startup, at the bottom of this file.
import { LAYOUTS, PRESETS, renderCover } from './render.js';
import { demoScenes } from './scenes.js';

const byId = (id) => document.getElementById(id);
const canvas = byId('stage-canvas');
const ctx = canvas.getContext('2d');

const SIZES = ['1080x1350', '1080x1080', '1920x1080', '1080x1920', '1440x1800'];
const MAX_PHOTOS = 6;

const state = {
  layout: 'classic',
  preset: 'sunset',
  grade: 1,
  grain: 0.35,
  vignette: 0.55,
  lightLeak: 0.45,
  palms: true,
  skyline: true,
  sun: true,
  title: 'VICE HEAT',
  subtitle: 'WELCOME BACK TO THE CITY OF NEON',
  tagline: 'A VICE FRAME ORIGINAL',
  titleSize: 1,
  badge: true,
  badgeText: 'VI',
  selected: 0,
  frames: [],
  size: '1080x1350',
};

const photos = []; // entries: { img, url }
let showingRaw = false;
let inShotMode = false;
let panelRects = [];

// ------------------------------------------------------------- rendering --

function ensureFrames() {
  const count = (LAYOUTS[state.layout] || []).length;
  while (state.frames.length < count) state.frames.push({ zoom: 1, panX: 0, panY: 0 });
  state.frames.length = count;
  if (state.selected >= count) state.selected = 0;
}

function paint() {
  const [w, h] = state.size.split('x').map(Number);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const view = { ...state, selected: showingRaw || inShotMode ? null : state.selected };
  panelRects = renderCover(ctx, w, h, view, photos.map((p) => p.img), showingRaw);
  byId('empty-note').classList.toggle('hide', photos.length > 0);
  byId('photo-count').textContent = `${photos.length} / ${MAX_PHOTOS}`;
  byId('panel-label').textContent = `Panel ${state.selected + 1} selected`;
}

function syncFrameSliders() {
  const f = state.frames[state.selected] || { zoom: 1, panX: 0, panY: 0 };
  byId('zoom').value = f.zoom;
  byId('panx').value = f.panX;
  byId('pany').value = f.panY;
}

// ---------------------------------------------------------- photo intake --

function registerPhoto(img, url) {
  if (photos.length >= MAX_PHOTOS) return;
  photos.push({ img, url });

  const fig = document.createElement('figure');
  const thumb = document.createElement('img');
  thumb.src = url;
  thumb.alt = 'Loaded photo';
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.textContent = '×';
  remove.title = 'Remove this photo';
  remove.addEventListener('click', () => {
    const at = photos.findIndex((p) => p.url === url);
    if (at >= 0) photos.splice(at, 1);
    fig.remove();
    paint();
  });
  fig.append(thumb, remove);
  byId('thumbs').append(fig);
  paint();
}

function readFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => registerPhoto(img, url);
  img.src = url;
}

async function loadDemoPhotos() {
  for (const scene of demoScenes()) {
    if (photos.length >= MAX_PHOTOS) break;
    const blob = await new Promise((done) => scene.toBlob(done, 'image/png'));
    const url = URL.createObjectURL(blob);
    const img = new Image();
    await new Promise((done) => { img.onload = done; img.src = url; });
    registerPhoto(img, url);
  }
}

// -------------------------------------------------------------- controls --

function wirePillRow(rowId, attr, apply) {
  byId(rowId).addEventListener('click', (event) => {
    const btn = event.target.closest(`button[data-${attr}]`);
    if (!btn) return;
    for (const b of byId(rowId).querySelectorAll('button')) b.classList.toggle('on', b === btn);
    apply(btn.dataset[attr]);
    paint();
  });
}

function markPill(rowId, attr, value) {
  for (const b of byId(rowId).querySelectorAll('button')) {
    b.classList.toggle('on', b.dataset[attr] === value);
  }
}

wirePillRow('layout-seg', 'layout', (v) => { state.layout = v; ensureFrames(); syncFrameSliders(); });
wirePillRow('preset-seg', 'preset', (v) => { state.preset = v; });
wirePillRow('size-seg', 'size', (v) => { state.size = v; });

function wireFrameSlider(id, key) {
  byId(id).addEventListener('input', () => {
    const frame = state.frames[state.selected];
    if (frame) frame[key] = Number(byId(id).value);
    paint();
  });
}
wireFrameSlider('zoom', 'zoom');
wireFrameSlider('panx', 'panX');
wireFrameSlider('pany', 'panY');

function wireRange(id, apply) {
  byId(id).addEventListener('input', () => { apply(Number(byId(id).value)); paint(); });
}
wireRange('grade', (v) => { state.grade = v; });
wireRange('grain', (v) => { state.grain = v; });
wireRange('vignette', (v) => { state.vignette = v; });
wireRange('light-leak', (v) => { state.lightLeak = v; });
wireRange('title-size', (v) => { state.titleSize = v; });

function wireToggle(id, apply) {
  byId(id).addEventListener('change', () => { apply(byId(id).checked); paint(); });
}
wireToggle('opt-palms', (v) => { state.palms = v; });
wireToggle('opt-skyline', (v) => { state.skyline = v; });
wireToggle('opt-sun', (v) => { state.sun = v; });
wireToggle('opt-badge', (v) => { state.badge = v; });

function wireText(id, apply) {
  byId(id).addEventListener('input', () => { apply(byId(id).value); paint(); });
}
wireText('title', (v) => { state.title = v; });
wireText('subtitle', (v) => { state.subtitle = v; });
wireText('tagline', (v) => { state.tagline = v; });
wireText('badge-text', (v) => { state.badgeText = v || 'VI'; });

// ------------------------------------------------------------ drag & drop --

const dropZone = byId('drop-zone');
byId('file-input').addEventListener('change', (event) => {
  for (const file of event.target.files) readFile(file);
  event.target.value = '';
});
for (const name of ['dragover', 'dragenter']) {
  dropZone.addEventListener(name, (e) => { e.preventDefault(); dropZone.classList.add('over'); });
}
for (const name of ['dragleave', 'drop']) {
  dropZone.addEventListener(name, (e) => { e.preventDefault(); dropZone.classList.remove('over'); });
}
dropZone.addEventListener('drop', (e) => { for (const f of e.dataTransfer.files) readFile(f); });
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => e.preventDefault());

// Clicking a panel on the poster selects it for framing.
canvas.addEventListener('click', (event) => {
  const box = canvas.getBoundingClientRect();
  const x = (event.clientX - box.left) * (canvas.width / box.width);
  const y = (event.clientY - box.top) * (canvas.height / box.height);
  const hit = panelRects.findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
  if (hit >= 0) {
    state.selected = hit;
    syncFrameSliders();
    paint();
  }
});

// ------------------------------------------------------- header actions --

const beforeBtn = byId('btn-before');
function setRaw(v) {
  showingRaw = v;
  beforeBtn.classList.toggle('on', v);
  paint();
}
beforeBtn.addEventListener('mousedown', () => setRaw(true));
window.addEventListener('mouseup', () => { if (showingRaw) setRaw(false); });
beforeBtn.addEventListener('click', () => setRaw(false));

const CAPTION_POOL = [
  ['VICE HEAT', 'WELCOME BACK TO THE CITY OF NEON'],
  ['NEON HARBOR', 'EVERY SUNSET HIDES A SCORE'],
  ['PALM CITY', 'TRUST NO ONE AFTER DARK'],
  ['MIDNIGHT REV', 'ONE LAST RIDE DOWN OCEAN DRIVE'],
  ['GOLDEN GUNS', 'LOYALTY IS A LOADED WORD'],
  ['MARINA KINGS', 'THE TIDE ALWAYS COLLECTS'],
];
byId('btn-random').addEventListener('click', () => {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  state.layout = pick(Object.keys(LAYOUTS));
  state.preset = pick(Object.keys(PRESETS));
  const [title, subtitle] = pick(CAPTION_POOL);
  state.title = title;
  state.subtitle = subtitle;
  byId('title').value = title;
  byId('subtitle').value = subtitle;
  state.grain = 0.15 + Math.random() * 0.5;
  state.vignette = 0.3 + Math.random() * 0.5;
  state.lightLeak = Math.random() * 0.8;
  byId('grain').value = state.grain;
  byId('vignette').value = state.vignette;
  byId('light-leak').value = state.lightLeak;
  markPill('layout-seg', 'layout', state.layout);
  markPill('preset-seg', 'preset', state.preset);
  ensureFrames();
  syncFrameSliders();
  paint();
});

byId('btn-demo').addEventListener('click', loadDemoPhotos);

// ------------------------------------------------------- keyboard access --
// Shortcuts for the actions people repeat while art-directing a cover:
//   Ctrl/Cmd+E  export the PNG        S  shuffle the look
//   D           load the demo set     1–6  jump straight to a panel
//   ← / →       move the panel selection without reaching for the mouse
// They stay out of the way while typing in a text field or slider, so the
// lettering inputs keep their normal behaviour.
window.addEventListener('keydown', (event) => {
  const tag = (event.target.tagName || '').toLowerCase();
  const typing = tag === 'input' || tag === 'textarea' || event.target.isContentEditable;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'e') {
    event.preventDefault();
    exportCover();
    return;
  }
  if (typing || event.ctrlKey || event.metaKey || event.altKey) return;
  const key = event.key.toLowerCase();
  if (key === 's') byId('btn-random').click();
  else if (key === 'd') loadDemoPhotos();
  else if (key >= '1' && key <= '6') {
    const at = Number(key) - 1;
    if (at < (LAYOUTS[state.layout] || []).length) {
      state.selected = at;
      syncFrameSliders();
      paint();
    }
  } else if (key === 'arrowright' || key === 'arrowleft') {
    const count = (LAYOUTS[state.layout] || []).length;
    if (count > 0) {
      const step = key === 'arrowright' ? 1 : -1;
      state.selected = (state.selected + step + count) % count;
      syncFrameSliders();
      paint();
    }
  }
});

// ---------------------------------------------------------------- export --

function exportCover() {
  const [w, h] = state.size.split('x').map(Number);
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  renderCover(out.getContext('2d'), w, h, { ...state, selected: null }, photos.map((p) => p.img), false);
  out.toBlob((blob) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `vice-frame-${state.size}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 4000);
    byId('export-note').textContent = `Exported vice-frame-${state.size}.png — check your downloads.`;
  }, 'image/png');
}

byId('btn-export').addEventListener('click', exportCover);

// --------------------------------------------------------------- startup --
// URL parameters:
//   ?demo=1            load the painted demo scenes immediately
//   ?shot=cover        hide the workbench chrome (clean poster screenshots)
//   ?shot=editor       keep the chrome (editor screenshots); implies demo
//   ?caption= ?subtitle= ?tagline=   preset the lettering
//   ?preset= ?layout= ?size=         preset the look (validated against the
//                                    known presets, layouts and sizes)

async function start() {
  const q = new URLSearchParams(location.search);

  if (q.get('shot')) inShotMode = true;
  if (q.get('shot') === 'cover') document.body.classList.add('shot-cover');

  if (q.get('caption')) { state.title = q.get('caption'); byId('title').value = state.title; }
  if (q.get('subtitle')) { state.subtitle = q.get('subtitle'); byId('subtitle').value = state.subtitle; }
  if (q.get('tagline')) { state.tagline = q.get('tagline'); byId('tagline').value = state.tagline; }

  if (q.get('preset') && PRESETS[q.get('preset')]) {
    state.preset = q.get('preset');
    markPill('preset-seg', 'preset', state.preset);
  }
  if (q.get('layout') && LAYOUTS[q.get('layout')]) {
    state.layout = q.get('layout');
    markPill('layout-seg', 'layout', state.layout);
  }
  if (q.get('size') && SIZES.includes(q.get('size'))) {
    state.size = q.get('size');
    markPill('size-seg', 'size', state.size);
  }
  if (q.get('leak') !== null) {
    const leak = Number(q.get('leak'));
    if (Number.isFinite(leak)) {
      state.lightLeak = Math.min(1, Math.max(0, leak));
      byId('light-leak').value = state.lightLeak;
    }
  }

  ensureFrames();
  syncFrameSliders();
  paint();

  if (q.get('demo') === '1' || q.get('shot')) await loadDemoPhotos();
  paint();

  document.title = 'Vice Frame — ready';
  window.__shotReady = true;
}

start();
