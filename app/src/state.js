// Vice City Cover Maker state: export sizes, panel layouts and the per-panel photo
// slots (each slot holds an image plus its own zoom and pan). Everything here is
// plain data; src/cover.js turns it into pixels.

/** The three post sizes the bounty asks for, as "W×H" labels. */
export const SIZES = ['1080x1080', '1080x1350', '1920x1080'];

/** Parses a "W×H" size label into { w, h }. */
export function parseSize(label) {
  const [w, h] = label.split('x').map(Number);
  return { w, h };
}

/** A fresh, empty photo slot: no image yet, centred, at 1× zoom. */
export function emptySlot() {
  return { img: null, zoom: 1, ox: 0, oy: 0 };
}

/** The app's whole editable state. */
export function freshState() {
  return {
    layout: 3,
    size: '1920x1080',
    caption: 'Sunset Heist',
    captionScale: 1,
    captionColor: '#ffffff',
    captionPos: 'bottom',
    selected: 0,
    slots: [emptySlot(), emptySlot(), emptySlot(), emptySlot()],
  };
}

/** How many panels a layout shows. */
export function panelCount(layout) {
  return layout;
}
