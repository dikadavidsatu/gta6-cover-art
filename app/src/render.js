// Vice Frame rendering engine.
//
// Everything the poster is made of lives here: the panel layouts, the four
// grade presets, the photo grade itself, the silhouette overlays (sun disc,
// skyline, palms), film grain, vignette, and the cover lettering. All of it is
// a pure function of (context, width, height, state, photos), so the on-screen
// preview and the full-resolution PNG export draw through the very same path.

// ---------------------------------------------------------------- presets --

export const PRESETS = {
  sunset: {
    label: 'Sunset Blvd',
    skyStops: ['#160a33', '#5b1b6e', '#ff2e88', '#ff7a3d', '#ffd23f'],
    wash: 'rgba(255, 90, 120, 0.16)',
    glowCore: [255, 150, 60],
    sat: 1.38, con: 1.14, bri: 1.03,
    titleTop: '#ffffff', titleBase: '#ffd23f', accent: '#ff2e88',
  },
  neon: {
    label: 'Neon Rain',
    skyStops: ['#020617', '#0e2a5c', '#155e8a', '#22d3ee', '#ff2e88'],
    wash: 'rgba(40, 120, 255, 0.15)',
    glowCore: [34, 211, 238],
    sat: 1.28, con: 1.2, bri: 0.99,
    titleTop: '#ffffff', titleBase: '#22d3ee', accent: '#22d3ee',
  },
  golden: {
    label: 'Golden Hour',
    skyStops: ['#2a1206', '#7a2d0e', '#e0641e', '#ffb347', '#ffe9a8'],
    wash: 'rgba(255, 160, 40, 0.18)',
    glowCore: [255, 190, 80],
    sat: 1.22, con: 1.08, bri: 1.06,
    titleTop: '#fff7e0', titleBase: '#ffb347', accent: '#ff7a3d',
  },
  midnight: {
    label: 'Midnight Vice',
    skyStops: ['#030014', '#1b0b45', '#4c1d95', '#0ea5b7', '#f0abfc'],
    wash: 'rgba(120, 60, 255, 0.17)',
    glowCore: [168, 85, 247],
    sat: 1.34, con: 1.22, bri: 0.96,
    titleTop: '#ffffff', titleBase: '#f0abfc', accent: '#a855f7',
  },
};

// ---------------------------------------------------------------- layouts --
// Panel rectangles in unit space; they are scaled to the canvas at draw time.

export const LAYOUTS = {
  classic: [
    { x: 0.0, y: 0.0, w: 0.62, h: 0.58 },
    { x: 0.62, y: 0.0, w: 0.38, h: 0.29 },
    { x: 0.62, y: 0.29, w: 0.38, h: 0.29 },
    { x: 0.0, y: 0.58, w: 0.5, h: 0.42 },
    { x: 0.5, y: 0.58, w: 0.5, h: 0.42 },
  ],
  triptych: [
    { x: 0.0, y: 0.0, w: 0.34, h: 1.0 },
    { x: 0.34, y: 0.0, w: 0.32, h: 1.0 },
    { x: 0.66, y: 0.0, w: 0.34, h: 1.0 },
  ],
  hero: [
    { x: 0.0, y: 0.0, w: 1.0, h: 0.66 },
    { x: 0.0, y: 0.66, w: 0.34, h: 0.34 },
    { x: 0.34, y: 0.66, w: 0.32, h: 0.34 },
    { x: 0.66, y: 0.66, w: 0.34, h: 0.34 },
  ],
  duo: [
    { x: 0.0, y: 0.0, w: 1.0, h: 0.52 },
    { x: 0.0, y: 0.52, w: 1.0, h: 0.48 },
  ],
  mosaic: [
    { x: 0.0, y: 0.0, w: 0.46, h: 0.44 },
    { x: 0.46, y: 0.0, w: 0.27, h: 0.44 },
    { x: 0.73, y: 0.0, w: 0.27, h: 0.27 },
    { x: 0.73, y: 0.27, w: 0.27, h: 0.29 },
    { x: 0.0, y: 0.44, w: 0.34, h: 0.56 },
    { x: 0.34, y: 0.44, w: 0.66, h: 0.56 },
  ],
};

// ------------------------------------------------------------- utilities --

// Deterministic PRNG: grain and skylines must look identical on every render,
// including between the preview and the exported file.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rgba = (rgb, alpha) => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;

let cachedGrain = null;
function grainTile() {
  if (cachedGrain) return cachedGrain;
  const tile = document.createElement('canvas');
  tile.width = tile.height = 160;
  const g = tile.getContext('2d');
  const pixels = g.createImageData(160, 160);
  const rnd = mulberry32(987654321);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const v = (rnd() * 255) | 0;
    pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = v;
    pixels.data[i + 3] = 255;
  }
  g.putImageData(pixels, 0, 0);
  cachedGrain = tile;
  return tile;
}

// ------------------------------------------------------------- silhouettes --

// A single leaning palm tree, drawn in unit space then scaled by `s`:
// a curved trunk topped with a fan of drooping fronds and two coconuts.
export function drawPalm(ctx, x, y, s, flip = 1, lean = 0.16) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip * s, s);
  ctx.fillStyle = '#050208';
  ctx.beginPath();
  ctx.moveTo(-0.045, 0);
  ctx.quadraticCurveTo(lean * 0.4, -0.55, lean, -1);
  ctx.quadraticCurveTo(lean + 0.05, -0.55, 0.045, 0);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 7; i++) {
    const angle = -Math.PI * (0.08 + i * 0.15);
    const len = 0.52 + 0.14 * Math.sin(i * 2.3);
    const endX = lean + Math.cos(angle) * len;
    const endY = -1 + Math.sin(angle) * len * 0.42 + 0.16;
    ctx.beginPath();
    ctx.moveTo(lean, -1);
    ctx.quadraticCurveTo(lean + Math.cos(angle) * len * 0.55, -1 + Math.sin(angle) * len * 0.3 - 0.1, endX, endY);
    ctx.quadraticCurveTo(lean + Math.cos(angle) * len * 0.5, -1 + Math.sin(angle) * len * 0.34, lean, -1);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(lean, -0.98, 0.035, 0, Math.PI * 2);
  ctx.arc(lean + 0.06, -0.955, 0.028, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// A seeded skyline band: black towers of varying height along the bottom of
// `rect`, with a scatter of lit windows in `litColor`.
export function drawSkyline(ctx, rect, seed, litColor) {
  const rnd = mulberry32(seed);
  const ground = rect.y + rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  const lit = [];
  ctx.fillStyle = '#07020f';
  let cursor = rect.x - 10;
  while (cursor < rect.x + rect.w + 10) {
    const towerW = 26 + rnd() * 70;
    const towerH = rect.h * (0.25 + rnd() * 0.6);
    ctx.fillRect(cursor, ground - towerH, towerW, towerH);
    if (rnd() > 0.6) ctx.fillRect(cursor + towerW * 0.3, ground - towerH - 8, towerW * 0.16, 8);
    for (let wy = ground - towerH + 8; wy < ground - 10; wy += 13) {
      for (let wx = cursor + 5; wx < cursor + towerW - 6; wx += 11) {
        if (rnd() > 0.62) lit.push([wx, wy]);
      }
    }
    cursor += towerW + 2 + rnd() * 8;
  }
  ctx.fillStyle = litColor;
  ctx.globalAlpha = 0.85;
  for (const [wx, wy] of lit) ctx.fillRect(wx, wy, 5, 7);
  ctx.restore();
}

// ---------------------------------------------------------------- panels --

function placeImage(img, rect, frame) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(rect.w / iw, rect.h / ih) * frame.zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const slackX = Math.max(0, (dw - rect.w) / 2);
  const slackY = Math.max(0, (dh - rect.h) / 2);
  return {
    dx: rect.x + (rect.w - dw) / 2 + frame.panX * slackX,
    dy: rect.y + (rect.h - dh) / 2 + frame.panY * slackY,
    dw, dh,
  };
}

function paintPanel(ctx, img, rect, frame, preset, gradeAmt, raw) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();

  if (img) {
    if (!raw && gradeAmt > 0) {
      const mix = (target) => 1 + (target - 1) * gradeAmt;
      ctx.filter = `saturate(${mix(preset.sat)}) contrast(${mix(preset.con)}) brightness(${mix(preset.bri)})`;
    }
    const placed = placeImage(img, rect, frame);
    ctx.drawImage(img, placed.dx, placed.dy, placed.dw, placed.dh);
    ctx.filter = 'none';
  } else {
    const blank = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
    blank.addColorStop(0, '#251144');
    blank.addColorStop(1, '#0d0618');
    ctx.fillStyle = blank;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }

  if (!raw && gradeAmt > 0) {
    // Sky wash: the preset's sunset ramp laid over the photo in soft-light,
    // strongest near the top of the panel.
    const ramp = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
    ramp.addColorStop(0, preset.skyStops[1]);
    ramp.addColorStop(0.45, preset.skyStops[2]);
    ramp.addColorStop(0.75, preset.skyStops[3]);
    ramp.addColorStop(1, preset.skyStops[4]);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = 0.55 * gradeAmt;
    ctx.fillStyle = ramp;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = gradeAmt;
    ctx.fillStyle = preset.wash;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    // A gentle S-curve via an overlay gradient, white to black through clear.
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = Math.min(0.35, 0.5 * gradeAmt);
    const curve = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
    curve.addColorStop(0, '#ffffff');
    curve.addColorStop(0.5, 'rgba(128, 128, 128, 0)');
    curve.addColorStop(1, '#000000');
    ctx.fillStyle = curve;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// ------------------------------------------------------------- lettering --

const TITLE_FAMILY = '"Arial Narrow", "Franklin Gothic Medium", Impact, sans-serif';

function shrinkToFit(ctx, text, maxWidth, startPx, weight, family) {
  let px = startPx;
  while (px > 12) {
    ctx.font = `${weight} ${px}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) return px;
    px -= 4;
  }
  return px;
}

function setTracking(ctx, px) {
  try { ctx.letterSpacing = `${px}px`; } catch { /* older engines lack letterSpacing */ }
}

function paintBadge(ctx, W, H, state, preset) {
  const size = W * 0.115;
  const cx = W - size / 2 - W * 0.035;
  const cy = H * 0.03 + size / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.06);
  const fill = ctx.createLinearGradient(-size / 2, -size / 2, size / 2, size / 2);
  fill.addColorStop(0, preset.skyStops[2]);
  fill.addColorStop(1, preset.skyStops[4]);
  ctx.beginPath();
  ctx.roundRect(-size / 2, -size / 2, size, size, size * 0.16);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = size * 0.045;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  const text = state.badgeText || 'VI';
  const px = shrinkToFit(ctx, text, size * 0.8, size * 0.62, '900', TITLE_FAMILY);
  ctx.font = `900 ${px}px ${TITLE_FAMILY}`;
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowOffsetY = size * 0.05;
  ctx.fillText(text, 0, px * 0.36);
  ctx.restore();
}

function paintLettering(ctx, W, H, state, preset) {
  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim().toUpperCase();
  const tagline = (state.tagline || '').trim().toUpperCase();
  const centre = W / 2;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  if (state.badge) paintBadge(ctx, W, H, state, preset);

  if (title) {
    const px = shrinkToFit(ctx, title, W * 0.92, W * 0.155 * state.titleSize, '900', TITLE_FAMILY);
    ctx.font = `900 ${px}px ${TITLE_FAMILY}`;
    setTracking(ctx, Math.round(px * 0.02));
    const baseline = H * 0.135 + px * 0.55;

    // Chromatic fringe: the title ghosted a few pixels left in pink and right
    // in cyan before the real fill lands — the print-misregistration look.
    ctx.fillStyle = 'rgba(255, 46, 136, 0.75)';
    ctx.fillText(title, centre - px * 0.045, baseline);
    ctx.fillStyle = 'rgba(34, 211, 238, 0.75)';
    ctx.fillText(title, centre + px * 0.045, baseline);

    ctx.lineWidth = px * 0.16;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0a0214';
    ctx.shadowColor = preset.accent;
    ctx.shadowBlur = px * 0.35;
    ctx.strokeText(title, centre, baseline);
    ctx.shadowBlur = 0;
    const face = ctx.createLinearGradient(0, baseline - px, 0, baseline);
    face.addColorStop(0, preset.titleTop);
    face.addColorStop(1, preset.titleBase);
    ctx.fillStyle = face;
    ctx.fillText(title, centre, baseline);
    setTracking(ctx, 0);

    if (subtitle) {
      const spx = Math.max(13, W * 0.026);
      ctx.font = `700 ${spx}px "Segoe UI", Arial, sans-serif`;
      setTracking(ctx, Math.round(spx * 0.42));
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = spx * 0.4;
      ctx.fillText(subtitle, centre, baseline + spx * 1.7);
      ctx.shadowBlur = 0;
      const ruleW = Math.min(W * 0.6, ctx.measureText(subtitle).width);
      setTracking(ctx, 0);
      const rule = ctx.createLinearGradient(centre - ruleW / 2, 0, centre + ruleW / 2, 0);
      rule.addColorStop(0, 'rgba(255, 46, 136, 0)');
      rule.addColorStop(0.5, preset.accent);
      rule.addColorStop(1, 'rgba(34, 211, 238, 0)');
      ctx.fillStyle = rule;
      ctx.fillRect(centre - ruleW / 2, baseline + spx * 2.15, ruleW, Math.max(2, H * 0.0035));
    }
  }

  // Bottom credit strip: small tracked capitals centred over a hairline,
  // like the billing block on a real theatrical poster.
  if (tagline) {
    const tpx = Math.max(11, W * 0.02);
    ctx.font = `600 ${tpx}px "Segoe UI", Arial, sans-serif`;
    setTracking(ctx, Math.round(tpx * 0.5));
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = tpx * 0.5;
    ctx.fillText(tagline, centre, H * 0.972);
    ctx.shadowBlur = 0;
    setTracking(ctx, 0);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillRect(W * 0.3, H * 0.972 - tpx * 1.15, W * 0.4, Math.max(1, H * 0.0016));
  }

  ctx.restore();
}

// ------------------------------------------------------------ the poster --

// Draw the whole cover. `photos` is an array of images; empty slots and
// layouts with more panels than photos simply cycle what is available.
// `raw` renders the ungraded photos (the Before view). Returns the panel
// rectangles in device pixels so the UI can hit-test clicks.
export function renderCover(ctx, W, H, state, photos, raw = false) {
  const preset = PRESETS[state.preset] || PRESETS.sunset;
  const layout = LAYOUTS[state.layout] || LAYOUTS.classic;
  const gutter = Math.max(6, Math.round(W * 0.008));
  const gradeAmt = raw ? 0 : state.grade;

  ctx.save();
  ctx.fillStyle = '#07020f';
  ctx.fillRect(0, 0, W, H);

  const rects = layout.map((p) => ({
    x: p.x * W + gutter / 2,
    y: p.y * H + gutter / 2,
    w: p.w * W - gutter,
    h: p.h * H - gutter,
  }));

  rects.forEach((rect, i) => {
    const img = photos.length ? photos[i % photos.length] : null;
    const frame = state.frames[i] || { zoom: 1, panX: 0, panY: 0 };
    paintPanel(ctx, img, rect, frame, preset, gradeAmt, raw);
  });

  if (!raw) {
    const hero = rects[0];

    if (state.sun) {
      const sx = hero.x + hero.w * 0.68;
      const sy = hero.y + hero.h * 0.62;
      const sr = Math.min(hero.w, hero.h) * 0.34;
      const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 2.1);
      halo.addColorStop(0, rgba(preset.glowCore, 0.55));
      halo.addColorStop(0.35, rgba(preset.glowCore, 0.22));
      halo.addColorStop(1, rgba(preset.glowCore, 0));
      ctx.save();
      ctx.beginPath();
      ctx.rect(hero.x, hero.y, hero.w, hero.h);
      ctx.clip();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = halo;
      ctx.fillRect(hero.x, hero.y, hero.w, hero.h);
      ctx.beginPath();
      ctx.arc(sx, sy, sr * 0.52, 0, Math.PI * 2);
      ctx.fillStyle = preset.skyStops[4];
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.restore();
    }

    if (state.skyline) {
      drawSkyline(ctx, { x: hero.x, y: hero.y + hero.h * 0.62, w: hero.w, h: hero.h * 0.38 }, 77, preset.skyStops[4]);
    }

    if (state.palms) {
      drawPalm(ctx, W * 0.015, H * 0.995, H * 0.34, 1, 0.18);
      drawPalm(ctx, W * 0.995, H * 0.99, H * 0.27, -1, 0.22);
      drawPalm(ctx, W * 0.06, H, H * 0.2, 1, 0.1);
    }

    if (state.selected != null && rects[state.selected]) {
      const r = rects[state.selected];
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = Math.max(3, W * 0.004);
      ctx.setLineDash([W * 0.02, W * 0.012]);
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.setLineDash([]);
    }

    if (state.vignette > 0) {
      const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.78);
      v.addColorStop(0, 'rgba(0, 0, 0, 0)');
      v.addColorStop(1, `rgba(2, 0, 10, ${0.72 * state.vignette})`);
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, W, H);
    }

    if (state.grain > 0) {
      ctx.save();
      ctx.globalAlpha = 0.16 * state.grain;
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = ctx.createPattern(grainTile(), 'repeat');
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = Math.max(2, W * 0.0022);
    ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, W - ctx.lineWidth * 2, H - ctx.lineWidth * 2);

    paintLettering(ctx, W, H, state, preset);
  }

  ctx.restore();
  return rects;
}
