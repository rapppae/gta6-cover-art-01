// Vice City Cover Maker renderer: draws the whole cover onto a canvas — a Vice City
// sunset sky, multi-panel photos with a neon grade, hand-drawn palm silhouettes and
// big condensed caption lettering. No Rockstar art, logo or font anywhere: the
// lettering is the system Impact / Arial Black stack and the palms are drawn here
// with plain canvas paths. Works at any export size.

import { parseSize } from './state.js';

const DARK = '#1a0b2e';
const SUNSET = ['#2b1055', '#7b2fbe', '#e84393', '#ff5e78', '#ff9a3c'];

/** Panel rectangles for a layout, in canvas pixels. Layout 2 is two columns,
 *  3 is one tall panel left with two stacked right, 4 is a 2×2 grid. The panels
 *  leave a band at the top or bottom for the sunset sky and the caption. */
export function panelRects(w, h, layout, captionPos) {
  const m = Math.round(w * 0.03);
  const g = Math.round(w * 0.014);
  const band = Math.round(h * 0.19);
  const top = captionPos === 'top' ? m + band : m;
  const bottom = captionPos === 'top' ? h - m : h - m - band;
  const x0 = m;
  const x1 = w - m;
  const y0 = top;
  const y1 = bottom;
  const cw = x1 - x0;
  const ch = y1 - y0;
  if (layout === 2) {
    const half = (cw - g) / 2;
    return [
      { x: x0, y: y0, w: half, h: ch },
      { x: x0 + half + g, y: y0, w: half, h: ch },
    ];
  }
  if (layout === 3) {
    const leftW = cw * 0.56;
    const rightW = cw - leftW - g;
    const halfH = (ch - g) / 2;
    return [
      { x: x0, y: y0, w: leftW, h: ch },
      { x: x0 + leftW + g, y: y0, w: rightW, h: halfH },
      { x: x0 + leftW + g, y: y0 + halfH + g, w: rightW, h: halfH },
    ];
  }
  const halfW = (cw - g) / 2;
  const halfH = (ch - g) / 2;
  return [
    { x: x0, y: y0, w: halfW, h: halfH },
    { x: x0 + halfW + g, y: y0, w: halfW, h: halfH },
    { x: x0, y: y0 + halfH + g, w: halfW, h: halfH },
    { x: x0 + halfW + g, y: y0 + halfH + g, w: halfW, h: halfH },
  ];
}

/** The caption band rectangle, where the sunset sky and lettering live. */
export function captionRect(w, h, captionPos) {
  const band = Math.round(h * 0.19);
  return captionPos === 'top'
    ? { x: 0, y: 0, w, h: band + Math.round(w * 0.03) }
    : { x: 0, y: h - band - Math.round(w * 0.03), w, h: band + Math.round(w * 0.03) };
}

/** Paints the sunset sky: purple-to-orange gradient, a glowing sun sitting in the
 *  caption band, faint neon scan lines and a dark skyline silhouette. */
function drawSunset(ctx, w, h, band) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  SUNSET.forEach((c, i) => sky.addColorStop(i / (SUNSET.length - 1), c));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const sunX = w * 0.9;
  const sunY = band.y + band.h * 0.48;
  const sunR = band.h * 0.32;
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.6);
  glow.addColorStop(0, 'rgba(255, 220, 130, 0.85)');
  glow.addColorStop(1, 'rgba(255, 220, 130, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - sunR * 2.6, sunY - sunR * 2.6, sunR * 5.2, sunR * 5.2);
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(0, 229, 255, 0.16)';
  ctx.lineWidth = Math.max(1, h * 0.0015);
  for (let i = 1; i <= 5; i += 1) {
    const y = (h / 6) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

/** A palm silhouette, drawn from scratch: a curved trunk and seven drooping
 *  fronds. `flip` mirrors it; `s` is its height in pixels. */
export function drawPalm(ctx, baseX, baseY, s, flip = 1) {
  ctx.save();
  ctx.translate(baseX, baseY);
  ctx.scale(flip, 1);
  ctx.fillStyle = DARK;
  ctx.strokeStyle = DARK;
  ctx.lineCap = 'round';
  // Trunk: a gently curving tapered shape.
  ctx.beginPath();
  ctx.moveTo(-s * 0.035, 0);
  ctx.quadraticCurveTo(-s * 0.02, -s * 0.5, s * 0.05, -s * 0.92);
  ctx.quadraticCurveTo(s * 0.09, -s * 0.95, s * 0.085, -s * 0.9);
  ctx.quadraticCurveTo(s * 0.03, -s * 0.5, s * 0.035, 0);
  ctx.closePath();
  ctx.fill();
  // Fronds: seven filled lens shapes fanning out from the crown.
  const crownX = s * 0.07;
  const crownY = -s * 0.93;
  const spread = [-150, -115, -80, -45, -12, 22, 55];
  for (const deg of spread) {
    const a = (deg * Math.PI) / 180;
    const len = s * (0.34 + Math.abs(Math.sin(a)) * 0.1);
    const tipX = crownX + Math.cos(a) * len;
    const tipY = crownY + Math.sin(a) * len * 0.55 + len * 0.22;
    const midX = crownX + Math.cos(a) * len * 0.55;
    const midY = crownY + Math.sin(a) * len * 0.2 - len * 0.08;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(midX, midY, tipX, tipY);
    ctx.quadraticCurveTo(midX + len * 0.08, midY + len * 0.14, crownX, crownY);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** A row of dark rooftop silhouettes with a few lit windows, for the horizon. */
function drawSkyline(ctx, w, y, h) {
  ctx.fillStyle = 'rgba(26, 11, 46, 0.9)';
  let x = -w * 0.01;
  let seed = 7;
  while (x < w) {
    seed = (seed * 31 + 17) % 97;
    const bw = w * (0.04 + (seed % 5) * 0.012);
    const bh = h * (0.35 + (seed % 7) * 0.09);
    ctx.fillRect(x, y - bh, bw, bh);
    ctx.fillStyle = 'rgba(255, 211, 25, 0.75)';
    for (let k = 0; k < 3; k += 1) {
      if ((seed + k) % 3 === 0) {
        ctx.fillRect(x + bw * 0.2 + k * bw * 0.22, y - bh + bh * 0.25, 3, 4);
      }
    }
    ctx.fillStyle = 'rgba(26, 11, 46, 0.9)';
    x += bw + w * 0.008;
  }
}

/** Draws one photo slot into its panel: cover-fit, zoomed and panned by the
 *  slot's own settings, with a warm sunset grade and a white frame. */
function drawPanel(ctx, rect, slot, index, highlight) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (slot.img) {
    const iw = slot.img.naturalWidth;
    const ih = slot.img.naturalHeight;
    const base = Math.max(rect.w / iw, rect.h / ih) * slot.zoom;
    const dw = iw * base;
    const dh = ih * base;
    const dx = rect.x + (rect.w - dw) / 2 + slot.ox * rect.w;
    const dy = rect.y + (rect.h - dh) / 2 + slot.oy * rect.h;
    ctx.drawImage(slot.img, dx, dy, dw, dh);
    const grade = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
    grade.addColorStop(0, 'rgba(255, 154, 60, 0.05)');
    grade.addColorStop(1, 'rgba(232, 67, 147, 0.22)');
    ctx.fillStyle = grade;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  } else {
    const empty = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    empty.addColorStop(0, '#3d1e57');
    empty.addColorStop(1, '#241031');
    ctx.fillStyle = empty;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.setLineDash([14, 10]);
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x + 14, rect.y + 14, rect.w - 28, rect.h - 28);
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = `700 ${Math.max(14, rect.w * 0.045)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`PANEL ${index + 1} · DROP A PHOTO`, rect.x + rect.w / 2, rect.y + rect.h / 2);
  }
  ctx.restore();
  ctx.lineWidth = Math.max(3, rect.w * 0.008);
  ctx.strokeStyle = '#ffffff';
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  if (highlight === index) {
    ctx.lineWidth = Math.max(4, rect.w * 0.012);
    ctx.strokeStyle = '#00e5ff';
    ctx.setLineDash([18, 10]);
    ctx.strokeRect(rect.x - 6, rect.y - 6, rect.w + 12, rect.h + 12);
    ctx.setLineDash([]);
  }
}

/** The big caption: a small neon "VICE CITY" kicker above the user's words in
 *  heavy condensed capitals, slightly tilted, with a dark outline and glow. */
function drawCaption(ctx, w, h, state) {
  const band = captionRect(w, h, state.captionPos);
  const cx = w / 2;
  const min = Math.min(w, h);
  const cy = state.captionPos === 'top' ? band.y + band.h * 0.52 : band.y + band.h * 0.56;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.026);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const kickSize = min * 0.026;
  ctx.font = `700 ${kickSize}px system-ui, sans-serif`;
  ctx.fillStyle = '#00e5ff';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = kickSize * 0.9;
  const kicker = 'V I C E   C I T Y';
  const kickY = -min * 0.085;
  ctx.fillText(kicker, 0, kickY);
  ctx.shadowBlur = 0;

  const text = state.caption.trim().toUpperCase() || 'VICE CITY';
  let size = min * 0.115 * state.captionScale;
  ctx.font = `${size}px Impact, "Arial Black", "Franklin Gothic Medium", sans-serif`;
  while (ctx.measureText(text).width > w * 0.92 && size > 16) {
    size -= 2;
    ctx.font = `${size}px Impact, "Arial Black", "Franklin Gothic Medium", sans-serif`;
  }
  const grad = ctx.createLinearGradient(0, -size * 0.6, 0, size * 0.6);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.55, state.captionColor);
  grad.addColorStop(1, '#ffd319');
  ctx.lineWidth = Math.max(3, size * 0.09);
  ctx.strokeStyle = DARK;
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(255, 94, 120, 0.9)';
  ctx.shadowBlur = size * 0.22;
  ctx.shadowOffsetY = size * 0.04;
  ctx.strokeText(text, 0, size * 0.08);
  ctx.fillStyle = grad;
  ctx.fillText(text, 0, size * 0.08);
  ctx.restore();
}

/** Draws the full cover for `state` onto `canvas`, resizing the canvas to the
 *  export size first. `highlight` is the selected panel index, or -1 for none. */
export function drawCover(canvas, state, highlight = -1) {
  const { w, h } = parseSize(state.size);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext('2d');
  const band = captionRect(w, h, state.captionPos);
  drawSunset(ctx, w, h, band);
  const horizon = state.captionPos === 'top' ? band.y + band.h : band.y;
  drawSkyline(ctx, w, horizon, Math.min(w, h) * 0.06);
  const rects = panelRects(w, h, state.layout, state.captionPos);
  rects.forEach((rect, i) => drawPanel(ctx, rect, state.slots[i], i, highlight));
  // Palms lean in from the two bottom corners, in front of the panels.
  const palmH = Math.min(w, h) * 0.34;
  drawPalm(ctx, w * 0.015, h * 1.005, palmH, 1);
  drawPalm(ctx, w * 0.985, h * 1.005, palmH * 0.85, -1);
  // A thin neon frame holds the whole poster together.
  ctx.lineWidth = Math.max(2, w * 0.002);
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.85)';
  ctx.strokeRect(w * 0.008, h * 0.008, w * 0.984, h * 0.984);
  drawCaption(ctx, w, h, state);
}
