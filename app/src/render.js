// Vice Frame renderer: panel layouts, the Vice City grade, silhouette overlays
// and cover lettering, all drawn on a 2D canvas. Pure functions of (ctx, size,
// state) so the stage preview and the full-size export share one code path.

export const PRESETS = {
  sunset: {
    name: 'Sunset Blvd',
    sky: ['#160a33', '#5b1b6e', '#ff2e88', '#ff7a3d', '#ffd23f'],
    tint: 'rgba(255, 90, 120, 0.16)',
    glow: 'rgba(255, 150, 60, 0.55)',
    sat: 1.38, con: 1.14, bri: 1.03,
    titleA: '#ffffff', titleB: '#ffd23f', accent: '#ff2e88',
  },
  neon: {
    name: 'Neon Rain',
    sky: ['#020617', '#0e2a5c', '#155e8a', '#22d3ee', '#ff2e88'],
    tint: 'rgba(40, 120, 255, 0.15)',
    glow: 'rgba(34, 211, 238, 0.5)',
    sat: 1.28, con: 1.2, bri: 0.99,
    titleA: '#ffffff', titleB: '#22d3ee', accent: '#22d3ee',
  },
  golden: {
    name: 'Golden Hour',
    sky: ['#2a1206', '#7a2d0e', '#e0641e', '#ffb347', '#ffe9a8'],
    tint: 'rgba(255, 160, 40, 0.18)',
    glow: 'rgba(255, 190, 80, 0.6)',
    sat: 1.22, con: 1.08, bri: 1.06,
    titleA: '#fff7e0', titleB: '#ffb347', accent: '#ff7a3d',
  },
};

// Panel rectangles in unit space (x, y, w, h), resolved against the canvas.
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
};

// Small deterministic PRNG so grain and skylines look the same on every render.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let grainTile = null;
function getGrainTile() {
  if (grainTile) return grainTile;
  const c = document.createElement('canvas');
  c.width = c.height = 160;
  const g = c.getContext('2d');
  const img = g.createImageData(160, 160);
  const rnd = mulberry32(20261119);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rnd() * 255);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grainTile = c;
  return c;
}

// One leaning palm: curved trunk plus a fan of drooping fronds, filled black.
export function drawPalm(ctx, x, y, s, flip = 1, lean = 0.16) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip * s, s);
  ctx.fillStyle = '#050208';
  ctx.beginPath();
  ctx.moveTo(-0.045, 0);
  ctx.quadraticCurveTo(lean * 0.4, -0.55, lean, -1.0);
  ctx.quadraticCurveTo(lean + 0.05, -0.55, 0.045, 0);
  ctx.closePath();
  ctx.fill();
  const topX = lean, topY = -1.0;
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * (0.08 + i * 0.15);
    const len = 0.52 + 0.14 * Math.sin(i * 2.3);
    const ex = topX + Math.cos(a) * len;
    const ey = topY + Math.sin(a) * len * 0.42 + 0.16;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + Math.cos(a) * len * 0.55, topY + Math.sin(a) * len * 0.3 - 0.1, ex, ey);
    ctx.quadraticCurveTo(topX + Math.cos(a) * len * 0.5, topY + Math.sin(a) * len * 0.34, topX, topY);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(topX, topY + 0.02, 0.035, 0, Math.PI * 2);
  ctx.arc(topX + 0.06, topY + 0.045, 0.028, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// A deterministic skyline band along the bottom of a rect, with lit windows.
export function drawSkyline(ctx, rect, seed, litColor) {
  const rnd = mulberry32(seed);
  const base = rect.y + rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  let x = rect.x - 10;
  const windows = [];
  ctx.fillStyle = '#07020f';
  while (x < rect.x + rect.w + 10) {
    const bw = 26 + rnd() * 70;
    const bh = rect.h * (0.25 + rnd() * 0.6);
    ctx.fillRect(x, base - bh, bw, bh);
    if (rnd() > 0.6) ctx.fillRect(x + bw * 0.3, base - bh - 8, bw * 0.16, 8); // antenna block
    for (let wy = base - bh + 8; wy < base - 10; wy += 13) {
      for (let wx = x + 5; wx < x + bw - 6; wx += 11) {
        if (rnd() > 0.62) windows.push([wx, wy]);
      }
    }
    x += bw + 2 + rnd() * 8;
  }
  ctx.fillStyle = litColor;
  ctx.globalAlpha = 0.85;
  for (const [wx, wy] of windows) ctx.fillRect(wx, wy, 5, 7);
  ctx.restore();
}

function coverFit(img, rect, zoom, panX, panY) {
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const roomX = Math.max(0, (dw - rect.w) / 2);
  const roomY = Math.max(0, (dh - rect.h) / 2);
  return {
    dx: rect.x + (rect.w - dw) / 2 + panX * roomX,
    dy: rect.y + (rect.h - dh) / 2 + panY * roomY,
    dw, dh,
  };
}

function sCurve(ctx, rect, amount) {
  // Cheap S-curve: a translucent black/white pair blended in overlay mode.
  if (amount <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = Math.min(0.35, amount);
  const g = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.5, 'rgba(128,128,128,0)');
  g.addColorStop(1, '#000000');
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function drawPanel(ctx, img, rect, frame, preset, gradeAmt, before) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (img) {
    if (!before && gradeAmt > 0) {
      ctx.filter = `saturate(${1 + (preset.sat - 1) * gradeAmt}) contrast(${1 + (preset.con - 1) * gradeAmt}) brightness(${1 + (preset.bri - 1) * gradeAmt})`;
    }
    const f = coverFit(img, rect, frame.zoom, frame.panX, frame.panY);
    ctx.drawImage(img, f.dx, f.dy, f.dw, f.dh);
    ctx.filter = 'none';
  } else {
    const g = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
    g.addColorStop(0, '#241040');
    g.addColorStop(1, '#0d0618');
    ctx.fillStyle = g;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
  if (!before && gradeAmt > 0) {
    // Sunset sky wash, stronger toward the top of each panel.
    const sky = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
    const stops = preset.sky;
    sky.addColorStop(0, stops[1]);
    sky.addColorStop(0.45, stops[2]);
    sky.addColorStop(0.75, stops[3]);
    sky.addColorStop(1, stops[4]);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = 0.55 * gradeAmt;
    ctx.fillStyle = sky;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = preset.tint;
    ctx.globalAlpha = gradeAmt;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.globalAlpha = 1;
    sCurve(ctx, rect, 0.5 * gradeAmt);
  }
  ctx.restore();
}

function fitFontSize(ctx, text, maxWidth, startPx, weight, family) {
  let px = startPx;
  while (px > 12) {
    ctx.font = `${weight} ${px}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    px -= 4;
  }
  return px;
}

function drawLettering(ctx, W, H, state, preset) {
  const title = (state.title || '').trim();
  const subtitle = (state.subtitle || '').trim();
  const cx = W / 2;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  if (state.badge) {
    const bw = W * 0.115;
    const bx = W - bw - W * 0.035;
    const by = H * 0.03;
    ctx.save();
    ctx.translate(bx + bw / 2, by + bw / 2);
    ctx.rotate(-0.06);
    const grad = ctx.createLinearGradient(-bw / 2, -bw / 2, bw / 2, bw / 2);
    grad.addColorStop(0, preset.sky[2]);
    grad.addColorStop(1, preset.sky[4]);
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = bw * 0.045;
    ctx.beginPath();
    ctx.roundRect(-bw / 2, -bw / 2, bw, bw, bw * 0.16);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = bw * 0.05;
    const bp = fitFontSize(ctx, state.badgeText || 'VI', bw * 0.8, bw * 0.62, '900', '"Arial Narrow", Impact, sans-serif');
    ctx.font = `900 ${bp}px "Arial Narrow", Impact, sans-serif`;
    ctx.fillText(state.badgeText || 'VI', 0, bp * 0.36);
    ctx.restore();
  }

  if (title) {
    const family = '"Arial Narrow", "Franklin Gothic Medium", Impact, sans-serif';
    const startPx = W * 0.155 * state.titleSize;
    const px = fitFontSize(ctx, title.toUpperCase(), W * 0.92, startPx, '900', family);
    ctx.font = `900 ${px}px ${family}`;
    try { ctx.letterSpacing = `${Math.round(px * 0.02)}px`; } catch { /* older engines */ }
    const y = H * 0.135 + px * 0.55;
    const grad = ctx.createLinearGradient(0, y - px, 0, y);
    grad.addColorStop(0, preset.titleA);
    grad.addColorStop(1, preset.titleB);
    ctx.lineWidth = px * 0.16;
    ctx.strokeStyle = '#0a0214';
    ctx.lineJoin = 'round';
    ctx.shadowColor = preset.accent;
    ctx.shadowBlur = px * 0.35;
    ctx.strokeText(title.toUpperCase(), cx, y);
    ctx.shadowBlur = 0;
    ctx.fillStyle = grad;
    ctx.fillText(title.toUpperCase(), cx, y);
    try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }

    if (subtitle) {
      const spx = Math.max(13, W * 0.026);
      ctx.font = `700 ${spx}px "Segoe UI", Arial, sans-serif`;
      try { ctx.letterSpacing = `${Math.round(spx * 0.42)}px`; } catch { /* ignore */ }
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = spx * 0.4;
      ctx.fillText(subtitle.toUpperCase(), cx, y + spx * 1.7);
      ctx.shadowBlur = 0;
      try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
      // Neon rule under the subtitle.
      const rw = Math.min(W * 0.6, ctx.measureText(subtitle.toUpperCase()).width);
      const rg = ctx.createLinearGradient(cx - rw / 2, 0, cx + rw / 2, 0);
      rg.addColorStop(0, 'rgba(255,46,136,0)');
      rg.addColorStop(0.5, preset.accent);
      rg.addColorStop(1, 'rgba(34,211,238,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(cx - rw / 2, y + spx * 2.15, rw, Math.max(2, H * 0.0035));
    }
  }
  ctx.restore();
}

// The whole poster. `state` is the plain object main.js keeps; `photos` are
// HTMLImageElements (possibly empty slots cycle). `before` renders raw photos.
export function renderCover(ctx, W, H, state, photos, before = false) {
  const preset = PRESETS[state.preset] || PRESETS.sunset;
  const layout = LAYOUTS[state.layout] || LAYOUTS.classic;
  const gutter = Math.max(6, Math.round(W * 0.008));
  const gradeAmt = before ? 0 : state.grade;

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
    drawPanel(ctx, img, rect, frame, preset, gradeAmt, before);
  });

  if (!before) {
    // Sunset glow disc behind the hero panel's horizon.
    if (state.sun) {
      const hero = rects[0];
      const sx = hero.x + hero.w * 0.68;
      const sy = hero.y + hero.h * 0.62;
      const sr = Math.min(hero.w, hero.h) * 0.34;
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 2.1);
      glow.addColorStop(0, preset.glow);
      glow.addColorStop(0.35, preset.glow.replace(/[\d.]+\)$/, '0.22)'));
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.save();
      ctx.beginPath();
      ctx.rect(hero.x, hero.y, hero.w, hero.h);
      ctx.clip();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = glow;
      ctx.fillRect(hero.x, hero.y, hero.w, hero.h);
      ctx.beginPath();
      ctx.arc(sx, sy, sr * 0.52, 0, Math.PI * 2);
      ctx.fillStyle = preset.sky[4];
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.restore();
    }

    if (state.skyline) {
      const hero = rects[0];
      drawSkyline(ctx, { x: hero.x, y: hero.y + hero.h * 0.62, w: hero.w, h: hero.h * 0.38 }, 77, preset.sky[4]);
    }

    if (state.palms) {
      drawPalm(ctx, W * 0.015, H * 0.995, H * 0.34, 1, 0.18);
      drawPalm(ctx, W * 0.995, H * 0.99, H * 0.27, -1, 0.22);
      drawPalm(ctx, W * 0.06, H * 1.0, H * 0.2, 1, 0.1);
    }

    // Selected panel outline.
    if (state.selected != null && rects[state.selected]) {
      const r = rects[state.selected];
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = Math.max(3, W * 0.004);
      ctx.setLineDash([W * 0.02, W * 0.012]);
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.setLineDash([]);
    }

    // Vignette.
    if (state.vignette > 0) {
      const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.78);
      v.addColorStop(0, 'rgba(0,0,0,0)');
      v.addColorStop(1, `rgba(2,0,10,${0.72 * state.vignette})`);
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, W, H);
    }

    // Film grain.
    if (state.grain > 0) {
      ctx.save();
      ctx.globalAlpha = 0.16 * state.grain;
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = ctx.createPattern(getGrainTile(), 'repeat');
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // Outer frame line.
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = Math.max(2, W * 0.0022);
    ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, W - ctx.lineWidth * 2, H - ctx.lineWidth * 2);

    drawLettering(ctx, W, H, state, preset);
  }
  ctx.restore();
  return rects;
}
