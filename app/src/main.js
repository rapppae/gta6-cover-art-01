// Vice City Cover Maker wiring: controls, drag-to-pan on the preview, file and
// drag-drop photo intake, and PNG export. A `?shot=` query sets up a fixed scene
// for a screenshot instead (./shots.js).
import { drawCover, panelRects } from './cover.js';
import { runShot } from './shots.js';
import { freshState, parseSize, SIZES } from './state.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const state = freshState();
let coverOnly = false;

/** Loads an image from a URL or object URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function redraw() {
  drawCover(canvas, state, coverOnly ? -1 : state.selected);
}

function syncPanelPicker() {
  const picker = document.getElementById('panelPicker');
  picker.innerHTML = '';
  for (let i = 0; i < state.layout; i += 1) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = `Panel ${i + 1}`;
    if (i === state.selected) b.classList.add('selected');
    b.addEventListener('click', () => {
      state.selected = i;
      document.getElementById('zoom').value = String(state.slots[i].zoom);
      syncPanelPicker();
      redraw();
    });
    picker.appendChild(b);
  }
}

function syncActive(container, attr, value) {
  container.querySelectorAll('button').forEach((b) => {
    b.classList.toggle('active', b.dataset[attr] === String(value));
  });
}

/** Puts `img` into the selected panel (or every panel when `all` is true). */
function placePhoto(img, all = false) {
  if (all) {
    state.slots.forEach((slot) => {
      slot.img = img;
      slot.zoom = 1;
      slot.ox = 0;
      slot.oy = 0;
    });
  } else {
    const slot = state.slots[state.selected];
    slot.img = img;
    slot.zoom = 1;
    slot.ox = 0;
    slot.oy = 0;
    document.getElementById('zoom').value = '1';
  }
  redraw();
}

async function placePhotoUrl(url, all = false) {
  try {
    placePhoto(await loadImage(url), all);
    status.textContent = 'Photo loaded.';
  } catch {
    status.textContent = 'That photo could not be loaded.';
  }
}

// --- Photo intake: file picker, drag-drop, and the two built-in samples. ---
document.getElementById('photoFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  await placePhotoUrl(URL.createObjectURL(file));
  e.target.value = '';
});
document.getElementById('fillAll').addEventListener('click', async () => {
  const slot = state.slots[state.selected];
  if (slot.img) placePhoto(slot.img, true);
  else status.textContent = 'Load a photo into a panel first.';
});
document.getElementById('samplePier').addEventListener('click', () => placePhotoUrl('samples/pier.jpg'));
document.getElementById('sampleBoulevard').addEventListener('click', () => placePhotoUrl('samples/boulevard.jpg'));

for (const type of ['dragover', 'dragenter']) {
  canvas.addEventListener(type, (e) => e.preventDefault());
}
canvas.addEventListener('drop', async (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) await placePhotoUrl(URL.createObjectURL(file));
});

// --- Click a panel to select it; drag inside it to pan the photo. ---
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const rects = panelRects(canvas.width, canvas.height, state.layout, state.captionPos);
  const hit = rects.findIndex((r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
  if (hit === -1) return;
  state.selected = hit;
  document.getElementById('zoom').value = String(state.slots[hit].zoom);
  syncPanelPicker();
  const slot = state.slots[hit];
  drag = { x: p.x, y: p.y, ox: slot.ox, oy: slot.oy, rect: rects[hit], moved: false };
  canvas.classList.add('dragging');
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const slot = state.slots[state.selected];
  const dx = (p.x - drag.x) / drag.rect.w;
  const dy = (p.y - drag.y) / drag.rect.h;
  if (Math.abs(dx) + Math.abs(dy) > 0.002) drag.moved = true;
  slot.ox = Math.max(-0.6, Math.min(0.6, drag.ox + dx));
  slot.oy = Math.max(-0.6, Math.min(0.6, drag.oy + dy));
  redraw();
});
canvas.addEventListener('pointerup', () => {
  drag = null;
  canvas.classList.remove('dragging');
});

// --- Layout, zoom, caption and export size controls. ---
document.getElementById('layoutPicker').addEventListener('click', (e) => {
  const layout = Number(e.target.dataset.layout);
  if (!layout) return;
  state.layout = layout;
  if (state.selected >= layout) state.selected = 0;
  syncActive(document.getElementById('layoutPicker'), 'layout', layout);
  syncPanelPicker();
  redraw();
});
document.getElementById('zoom').addEventListener('input', (e) => {
  state.slots[state.selected].zoom = Number(e.target.value);
  redraw();
});
document.getElementById('recenter').addEventListener('click', () => {
  const slot = state.slots[state.selected];
  slot.ox = 0;
  slot.oy = 0;
  slot.zoom = 1;
  document.getElementById('zoom').value = '1';
  redraw();
});
document.getElementById('caption').addEventListener('input', (e) => {
  state.caption = e.target.value;
  redraw();
});
document.getElementById('captionSize').addEventListener('input', (e) => {
  state.captionScale = Number(e.target.value);
  redraw();
});
document.getElementById('colorPicker').addEventListener('click', (e) => {
  const color = e.target.dataset.color;
  if (!color) return;
  state.captionColor = color;
  syncActive(document.getElementById('colorPicker'), 'color', color);
  redraw();
});
document.getElementById('captionPos').addEventListener('click', (e) => {
  const pos = e.target.dataset.pos;
  if (!pos) return;
  state.captionPos = pos;
  syncActive(document.getElementById('captionPos'), 'pos', pos);
  redraw();
});
document.getElementById('sizePicker').addEventListener('click', (e) => {
  const size = e.target.dataset.size;
  if (!size || !SIZES.includes(size)) return;
  state.size = size;
  syncActive(document.getElementById('sizePicker'), 'size', size);
  redraw();
});

// --- Export: the live canvas is already at export size, so toBlob is the PNG. ---
document.getElementById('export').addEventListener('click', () => {
  const { w, h } = parseSize(state.size);
  canvas.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed — try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-city-cover-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    status.textContent = `Saved vice-city-cover-${w}x${h}.png`;
  }, 'image/png');
});

// --- Deterministic shot scenes, or the plain editor. ---
const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  coverOnly = shot === 'cover';
  runShot(shot, query, async (sample, text, opts) => {
    if (opts.size && SIZES.includes(opts.size)) {
      state.size = opts.size;
      syncActive(document.getElementById('sizePicker'), 'size', opts.size);
    }
    if (opts.layout && [2, 3, 4].includes(opts.layout)) {
      state.layout = opts.layout;
      syncActive(document.getElementById('layoutPicker'), 'layout', opts.layout);
    }
    state.caption = text;
    document.getElementById('caption').value = text;
    const img = await loadImage(sample);
    placePhoto(img, true);
    syncPanelPicker();
    redraw();
  });
} else {
  syncPanelPicker();
  redraw();
}
