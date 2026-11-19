// Procedural demo "photos": four little painted scenes (beach, boulevard,
// night drive, portrait) drawn on canvases at runtime. They stand in for a
// user's own photos in demo mode and screenshots — no image files, no network.
import { drawPalm, drawSkyline, mulberry32 } from './render.js';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function skyGrad(ctx, w, h, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const [at, col] of stops) g.addColorStop(at, col);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function person(ctx, x, y, s, color = '#12041f') {
  // Simple standing figure silhouette: head, torso, legs.
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(0, -1.62, 0.16, 0, Math.PI * 2); ctx.fill();
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
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

export function sceneBeach() {
  const c = canvas(900, 1100), ctx = c.getContext('2d');
  const w = c.width, h = c.height;
  skyGrad(ctx, w, h, [[0, '#2b1055'], [0.35, '#b721ff'], [0.55, '#ff2e88'], [0.72, '#ff7a3d'], [0.85, '#ffd23f']]);
  // Sun + sea
  const sunY = h * 0.66;
  ctx.fillStyle = '#ffe66d';
  ctx.beginPath(); ctx.arc(w * 0.62, sunY, 92, 0, Math.PI * 2); ctx.fill();
  const sea = ctx.createLinearGradient(0, sunY, 0, h);
  sea.addColorStop(0, '#ff9a3d'); sea.addColorStop(0.25, '#c22e7a'); sea.addColorStop(1, '#1b2a6b');
  ctx.fillStyle = sea; ctx.fillRect(0, sunY, w, h - sunY);
  const rnd = mulberry32(41);
  ctx.fillStyle = 'rgba(255,230,150,0.75)';
  for (let i = 0; i < 46; i++) {
    const y = sunY + 12 + rnd() * (h - sunY - 30);
    const spread = 40 + (y - sunY) * 0.55;
    const x = w * 0.62 + (rnd() - 0.5) * spread * 2;
    ctx.fillRect(x, y, 14 + rnd() * 46, 3.5);
  }
  // Sand strip + palms + figure
  ctx.fillStyle = '#160a24'; ctx.fillRect(0, h * 0.93, w, h * 0.07);
  drawPalm(ctx, w * 0.06, h * 0.97, 300, 1, 0.2);
  drawPalm(ctx, w * 0.97, h * 0.96, 240, -1, 0.24);
  person(ctx, w * 0.34, h * 0.955, 120);
  return c;
}

export function sceneBoulevard() {
  const c = canvas(900, 1100), ctx = c.getContext('2d');
  const w = c.width, h = c.height;
  skyGrad(ctx, w, h, [[0, '#050914'], [0.5, '#10264f'], [0.8, '#3b1160'], [1, '#12081f']]);
  const rnd = mulberry32(7);
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 90; i++) { ctx.globalAlpha = 0.35 + rnd() * 0.6; ctx.fillRect(rnd() * w, rnd() * h * 0.4, 2.4, 2.4); }
  ctx.globalAlpha = 1;
  drawSkyline(ctx, { x: 0, y: h * 0.34, w, h: h * 0.4 }, 1234, '#ffd23f');
  // Wet street
  const st = ctx.createLinearGradient(0, h * 0.74, 0, h);
  st.addColorStop(0, '#1a1030'); st.addColorStop(1, '#07030f');
  ctx.fillStyle = st; ctx.fillRect(0, h * 0.74, w, h * 0.26);
  // Neon signs
  const signs = [['#ff2e88', 0.12], ['#22d3ee', 0.62], ['#ffb347', 0.8]];
  for (const [col, fx] of signs) {
    ctx.save();
    ctx.shadowColor = col; ctx.shadowBlur = 34;
    ctx.fillStyle = col;
    ctx.fillRect(w * fx, h * 0.47, 16, 120);
    ctx.restore();
    ctx.fillStyle = col; ctx.globalAlpha = 0.28;
    ctx.fillRect(w * fx - 6, h * 0.74, 28, h * 0.2);
    ctx.globalAlpha = 1;
  }
  person(ctx, w * 0.44, h * 0.9, 150, '#05030c');
  return c;
}

export function sceneDrive() {
  const c = canvas(1100, 900), ctx = c.getContext('2d');
  const w = c.width, h = c.height;
  skyGrad(ctx, w, h, [[0, '#0b0620'], [0.45, '#47135f'], [0.7, '#c22e7a'], [0.88, '#ff7a3d'], [1, '#2a1206']]);
  drawSkyline(ctx, { x: 0, y: h * 0.3, w, h: h * 0.34 }, 555, '#ffe9a8');
  // Road with perspective
  ctx.fillStyle = '#0a0714';
  ctx.beginPath();
  ctx.moveTo(0, h); ctx.lineTo(w * 0.42, h * 0.64); ctx.lineTo(w * 0.58, h * 0.64); ctx.lineTo(w, h);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 7; ctx.setLineDash([46, 34]);
  ctx.beginPath(); ctx.moveTo(w * 0.5, h * 0.66); ctx.lineTo(w * 0.5, h); ctx.stroke();
  ctx.setLineDash([]);
  // Car silhouette, rear three-quarter, low and wide
  ctx.save();
  ctx.translate(w * 0.5, h * 0.86); ctx.scale(1, 1);
  ctx.fillStyle = '#07030d';
  ctx.beginPath();
  ctx.moveTo(-330, 30);
  ctx.quadraticCurveTo(-340, -28, -250, -42);
  ctx.quadraticCurveTo(-170, -108, -60, -112);
  ctx.quadraticCurveTo(90, -116, 180, -52);
  ctx.quadraticCurveTo(320, -38, 330, 26);
  ctx.lineTo(300, 44); ctx.lineTo(-300, 44);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#0d1b2e';
  ctx.beginPath();
  ctx.moveTo(-150, -52); ctx.quadraticCurveTo(-90, -94, 10, -94); ctx.quadraticCurveTo(90, -92, 140, -52);
  ctx.closePath(); ctx.fill();
  // Tail-light bar + glow
  ctx.save();
  ctx.shadowColor = '#ff2255'; ctx.shadowBlur = 42;
  ctx.fillStyle = '#ff3860';
  ctx.fillRect(-308, -6, 616, 13);
  ctx.restore();
  ctx.fillStyle = '#0a0714';
  for (const wx of [-225, 225]) { ctx.beginPath(); ctx.arc(wx, 44, 47, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
  drawPalm(ctx, w * 0.03, h * 0.68, 190, 1, 0.2);
  drawPalm(ctx, w * 0.98, h * 0.68, 170, -1, 0.24);
  return c;
}

export function scenePortrait() {
  const c = canvas(900, 1100), ctx = c.getContext('2d');
  const w = c.width, h = c.height;
  skyGrad(ctx, w, h, [[0, '#12082b'], [0.55, '#5b1b6e'], [1, '#ff5e62']]);
  // Halo sun behind the head
  const halo = ctx.createRadialGradient(w / 2, h * 0.4, 10, w / 2, h * 0.4, 330);
  halo.addColorStop(0, 'rgba(255,210,63,0.95)');
  halo.addColorStop(0.55, 'rgba(255,122,61,0.55)');
  halo.addColorStop(1, 'rgba(255,46,136,0)');
  ctx.fillStyle = halo; ctx.fillRect(0, 0, w, h);
  // Shoulders + head silhouette
  ctx.fillStyle = '#0a0214';
  ctx.beginPath(); ctx.arc(w / 2, h * 0.42, 128, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w * 0.14, h);
  ctx.quadraticCurveTo(w * 0.16, h * 0.66, w * 0.38, h * 0.6);
  ctx.lineTo(w * 0.62, h * 0.6);
  ctx.quadraticCurveTo(w * 0.84, h * 0.66, w * 0.86, h);
  ctx.closePath(); ctx.fill();
  // Sunglasses glint
  ctx.fillStyle = '#22d3ee';
  ctx.save(); ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 18;
  ctx.fillRect(w / 2 - 96, h * 0.4, 76, 20);
  ctx.fillRect(w / 2 + 20, h * 0.4, 76, 20);
  ctx.restore();
  drawPalm(ctx, w * 0.02, h * 1.0, 260, 1, 0.14);
  drawPalm(ctx, w * 1.0, h * 1.0, 300, -1, 0.18);
  return c;
}

export function demoScenes() {
  return [sceneBeach(), sceneBoulevard(), sceneDrive(), scenePortrait()];
}
