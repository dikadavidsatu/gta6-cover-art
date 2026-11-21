// Painted demo "photographs".
//
// Six little scenes — a beach at sunset, a neon boulevard, a night drive, a
// portrait, a marina, and a rooftop pool at dusk — drawn procedurally onto
// canvases when the page loads. They stand in for a visitor's own photos in
// demo mode and in the screenshots, so the app can show itself off with zero
// image files and zero network requests. Six scenes also fill every panel of
// the six-panel Mosaic and Grid layouts with a distinct image.
import { drawPalm, drawSkyline, mulberry32 } from './render.js';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function paintSky(ctx, w, h, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const [at, colour] of stops) g.addColorStop(at, colour);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

// A standing figure in silhouette. (x, y) is the ground point between the
// feet; `s` is the figure's height in pixels.
function figure(ctx, x, y, s, colour = '#12041f') {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(0, -1.62, 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-0.2, -1.44);
  ctx.quadraticCurveTo(0, -1.52, 0.2, -1.44);
  ctx.lineTo(0.26, -0.72);
  ctx.lineTo(0.13, -0.72);
  ctx.lineTo(0.16, 0);
  ctx.lineTo(0.02, 0);
  ctx.lineTo(-0.04, -0.68);
  ctx.lineTo(-0.16, 0);
  ctx.lineTo(-0.29, 0);
  ctx.lineTo(-0.24, -0.72);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function sceneBeach() {
  const c = makeCanvas(900, 1100);
  const ctx = c.getContext('2d');
  const { width: w, height: h } = c;
  paintSky(ctx, w, h, [[0, '#2b1055'], [0.35, '#b721ff'], [0.55, '#ff2e88'], [0.72, '#ff7a3d'], [0.85, '#ffd23f']]);

  const horizon = h * 0.66;
  ctx.fillStyle = '#ffe66d';
  ctx.beginPath();
  ctx.arc(w * 0.62, horizon, 92, 0, Math.PI * 2);
  ctx.fill();

  const sea = ctx.createLinearGradient(0, horizon, 0, h);
  sea.addColorStop(0, '#ff9a3d');
  sea.addColorStop(0.25, '#c22e7a');
  sea.addColorStop(1, '#1b2a6b');
  ctx.fillStyle = sea;
  ctx.fillRect(0, horizon, w, h - horizon);

  // Sun glitter scattered across the water.
  const rnd = mulberry32(41);
  ctx.fillStyle = 'rgba(255, 230, 150, 0.75)';
  for (let i = 0; i < 46; i++) {
    const y = horizon + 12 + rnd() * (h - horizon - 30);
    const spread = 40 + (y - horizon) * 0.55;
    ctx.fillRect(w * 0.62 + (rnd() - 0.5) * spread * 2, y, 14 + rnd() * 46, 3.5);
  }

  ctx.fillStyle = '#160a24';
  ctx.fillRect(0, h * 0.93, w, h * 0.07);
  drawPalm(ctx, w * 0.06, h * 0.97, 300, 1, 0.2);
  drawPalm(ctx, w * 0.97, h * 0.96, 240, -1, 0.24);
  figure(ctx, w * 0.34, h * 0.955, 120);
  return c;
}

export function sceneBoulevard() {
  const c = makeCanvas(900, 1100);
  const ctx = c.getContext('2d');
  const { width: w, height: h } = c;
  paintSky(ctx, w, h, [[0, '#050914'], [0.5, '#10264f'], [0.8, '#3b1160'], [1, '#12081f']]);

  const rnd = mulberry32(7);
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 90; i++) {
    ctx.globalAlpha = 0.35 + rnd() * 0.6;
    ctx.fillRect(rnd() * w, rnd() * h * 0.4, 2.4, 2.4);
  }
  ctx.globalAlpha = 1;

  drawSkyline(ctx, { x: 0, y: h * 0.34, w, h: h * 0.4 }, 1234, '#ffd23f');

  const street = ctx.createLinearGradient(0, h * 0.74, 0, h);
  street.addColorStop(0, '#1a1030');
  street.addColorStop(1, '#07030f');
  ctx.fillStyle = street;
  ctx.fillRect(0, h * 0.74, w, h * 0.26);

  // Vertical neon signs and their reflections on the wet street.
  for (const [colour, fx] of [['#ff2e88', 0.12], ['#22d3ee', 0.62], ['#ffb347', 0.8]]) {
    ctx.save();
    ctx.shadowColor = colour;
    ctx.shadowBlur = 34;
    ctx.fillStyle = colour;
    ctx.fillRect(w * fx, h * 0.47, 16, 120);
    ctx.restore();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = colour;
    ctx.fillRect(w * fx - 6, h * 0.74, 28, h * 0.2);
    ctx.globalAlpha = 1;
  }

  figure(ctx, w * 0.44, h * 0.9, 150, '#05030c');
  return c;
}

export function sceneDrive() {
  const c = makeCanvas(1100, 900);
  const ctx = c.getContext('2d');
  const { width: w, height: h } = c;
  paintSky(ctx, w, h, [[0, '#0b0620'], [0.45, '#47135f'], [0.7, '#c22e7a'], [0.88, '#ff7a3d'], [1, '#2a1206']]);
  drawSkyline(ctx, { x: 0, y: h * 0.3, w, h: h * 0.34 }, 555, '#ffe9a8');

  // Road narrowing to a vanishing point.
  ctx.fillStyle = '#0a0714';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(w * 0.42, h * 0.64);
  ctx.lineTo(w * 0.58, h * 0.64);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffd23f';
  ctx.lineWidth = 7;
  ctx.setLineDash([46, 34]);
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.66);
  ctx.lineTo(w * 0.5, h);
  ctx.stroke();
  ctx.setLineDash([]);

  // A low, wide car seen from behind: body, glasshouse, light bar, wheels.
  ctx.save();
  ctx.translate(w * 0.5, h * 0.86);
  ctx.fillStyle = '#07030d';
  ctx.beginPath();
  ctx.moveTo(-330, 30);
  ctx.quadraticCurveTo(-340, -28, -250, -42);
  ctx.quadraticCurveTo(-170, -108, -60, -112);
  ctx.quadraticCurveTo(90, -116, 180, -52);
  ctx.quadraticCurveTo(320, -38, 330, 26);
  ctx.lineTo(300, 44);
  ctx.lineTo(-300, 44);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#0d1b2e';
  ctx.beginPath();
  ctx.moveTo(-150, -52);
  ctx.quadraticCurveTo(-90, -94, 10, -94);
  ctx.quadraticCurveTo(90, -92, 140, -52);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.shadowColor = '#ff2255';
  ctx.shadowBlur = 42;
  ctx.fillStyle = '#ff3860';
  ctx.fillRect(-308, -6, 616, 13);
  ctx.restore();
  ctx.fillStyle = '#0a0714';
  for (const wheelX of [-225, 225]) {
    ctx.beginPath();
    ctx.arc(wheelX, 44, 47, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  drawPalm(ctx, w * 0.03, h * 0.68, 190, 1, 0.2);
  drawPalm(ctx, w * 0.98, h * 0.68, 170, -1, 0.24);
  return c;
}

export function scenePortrait() {
  const c = makeCanvas(900, 1100);
  const ctx = c.getContext('2d');
  const { width: w, height: h } = c;
  paintSky(ctx, w, h, [[0, '#12082b'], [0.55, '#5b1b6e'], [1, '#ff5e62']]);

  const halo = ctx.createRadialGradient(w / 2, h * 0.4, 10, w / 2, h * 0.4, 330);
  halo.addColorStop(0, 'rgba(255, 210, 63, 0.95)');
  halo.addColorStop(0.55, 'rgba(255, 122, 61, 0.55)');
  halo.addColorStop(1, 'rgba(255, 46, 136, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#0a0214';
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.42, 128, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w * 0.14, h);
  ctx.quadraticCurveTo(w * 0.16, h * 0.66, w * 0.38, h * 0.6);
  ctx.lineTo(w * 0.62, h * 0.6);
  ctx.quadraticCurveTo(w * 0.84, h * 0.66, w * 0.86, h);
  ctx.closePath();
  ctx.fill();

  // The glint of neon in a pair of sunglasses.
  ctx.save();
  ctx.shadowColor = '#22d3ee';
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#22d3ee';
  ctx.fillRect(w / 2 - 96, h * 0.4, 76, 20);
  ctx.fillRect(w / 2 + 20, h * 0.4, 76, 20);
  ctx.restore();

  drawPalm(ctx, w * 0.02, h, 260, 1, 0.14);
  drawPalm(ctx, w, h, 300, -1, 0.18);
  return c;
}

export function sceneMarina() {
  const c = makeCanvas(1100, 900);
  const ctx = c.getContext('2d');
  const { width: w, height: h } = c;
  paintSky(ctx, w, h, [[0, '#0b1035'], [0.4, '#3730a3'], [0.62, '#c22e7a'], [0.8, '#ff7a3d'], [1, '#ffd23f']]);

  const waterline = h * 0.58;
  const water = ctx.createLinearGradient(0, waterline, 0, h);
  water.addColorStop(0, '#e0641e');
  water.addColorStop(0.3, '#7a2d6e');
  water.addColorStop(1, '#0b1e4b');
  ctx.fillStyle = water;
  ctx.fillRect(0, waterline, w, h - waterline);

  // Broken reflections dancing on the harbour.
  const rnd = mulberry32(2026);
  for (let i = 0; i < 60; i++) {
    const y = waterline + 10 + rnd() * (h - waterline - 24);
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255, 190, 90, 0.6)' : 'rgba(120, 220, 255, 0.45)';
    ctx.fillRect(rnd() * w, y, 18 + rnd() * 60, 3);
  }

  // Two yachts at anchor: hull, cabin, mast and a string of deck lights.
  const yacht = (cx, cy, s, flip) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(flip * s, s);
    ctx.fillStyle = '#0a0618';
    ctx.beginPath();
    ctx.moveTo(-150, 0);
    ctx.lineTo(150, 0);
    ctx.lineTo(112, 34);
    ctx.lineTo(-118, 34);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-62, -26, 118, 26);
    ctx.fillRect(-8, -118, 5, 118);
    ctx.beginPath();
    ctx.moveTo(-3, -112);
    ctx.lineTo(-3, -14);
    ctx.lineTo(-74, -14);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.shadowColor = '#ffd23f';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffe9a8';
    for (let i = 0; i < 6; i++) ctx.fillRect(-120 + i * 44, 8, 12, 7);
    ctx.restore();
    ctx.restore();
  };
  yacht(w * 0.3, waterline + 26, 1, 1);
  yacht(w * 0.76, waterline + 52, 0.72, -1);

  // Boardwalk strip with a lone walker.
  ctx.fillStyle = '#12081f';
  ctx.fillRect(0, h * 0.9, w, h * 0.1);
  figure(ctx, w * 0.55, h * 0.985, 105, '#05030c');
  drawPalm(ctx, w * 0.04, h * 0.92, 170, 1, 0.2);
  drawPalm(ctx, w * 0.97, h * 0.92, 150, -1, 0.22);
  return c;
}

export function sceneRooftop() {
  const c = makeCanvas(900, 1100);
  const ctx = c.getContext('2d');
  const { width: w, height: h } = c;
  paintSky(ctx, w, h, [[0, '#070b2e'], [0.38, '#312e81'], [0.62, '#9d2c6e'], [0.82, '#ff7a3d'], [1, '#ffb347']]);

  // Distant skyline behind the rooftop parapet.
  drawSkyline(ctx, { x: 0, y: h * 0.3, w, h: h * 0.32 }, 909, '#ffe9a8');

  // Rooftop deck and parapet wall.
  ctx.fillStyle = '#170b28';
  ctx.fillRect(0, h * 0.62, w, h * 0.38);
  ctx.fillStyle = '#24123d';
  ctx.fillRect(0, h * 0.62, w, h * 0.035);

  // The pool: a glowing turquoise inset with a bright coping edge and
  // slow caustic ripples scattered by the seeded PRNG.
  const pool = { x: w * 0.14, y: h * 0.7, w: w * 0.72, h: h * 0.2 };
  const waterGlow = ctx.createLinearGradient(0, pool.y, 0, pool.y + pool.h);
  waterGlow.addColorStop(0, '#67e8f9');
  waterGlow.addColorStop(0.5, '#22d3ee');
  waterGlow.addColorStop(1, '#0e7490');
  ctx.save();
  ctx.shadowColor = '#22d3ee';
  ctx.shadowBlur = 36;
  ctx.fillStyle = waterGlow;
  ctx.fillRect(pool.x, pool.y, pool.w, pool.h);
  ctx.restore();
  ctx.strokeStyle = '#f5eeff';
  ctx.lineWidth = 6;
  ctx.strokeRect(pool.x, pool.y, pool.w, pool.h);
  const rnd = mulberry32(314);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 22; i++) {
    const y = pool.y + 12 + rnd() * (pool.h - 24);
    const x = pool.x + 14 + rnd() * (pool.w - 110);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 28, y - 6 + rnd() * 12, x + 56 + rnd() * 30, y);
    ctx.stroke();
  }

  // String lights sagging between two poles over the deck.
  for (const poleX of [w * 0.08, w * 0.92]) {
    ctx.fillStyle = '#0a0514';
    ctx.fillRect(poleX - 4, h * 0.56, 8, h * 0.14);
  }
  ctx.strokeStyle = 'rgba(10, 5, 20, 0.9)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, h * 0.56);
  ctx.quadraticCurveTo(w * 0.5, h * 0.68, w * 0.92, h * 0.56);
  ctx.stroke();
  ctx.save();
  ctx.shadowColor = '#ffd23f';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#ffe9a8';
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const x = (1 - t) * (1 - t) * w * 0.08 + 2 * (1 - t) * t * w * 0.5 + t * t * w * 0.92;
    const y = (1 - t) * (1 - t) * h * 0.56 + 2 * (1 - t) * t * h * 0.68 + t * t * h * 0.56;
    ctx.beginPath();
    ctx.arc(x, y + 7, 5.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  figure(ctx, w * 0.82, h * 0.985, 118, '#05030c');
  drawPalm(ctx, w * 0.03, h * 0.99, 210, 1, 0.18);
  return c;
}

// The demo set, in poster order.
export function demoScenes() {
  return [sceneBeach(), sceneBoulevard(), sceneDrive(), scenePortrait(), sceneMarina(), sceneRooftop()];
}
