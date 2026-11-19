// Fixed scenes for screenshots: ?shot=editor shows the editor with a sample photo
// loaded; ?shot=cover shows the finished cover alone. `photo` picks the sample
// (samples/<photo>.jpg), `caption` the words, `size` the export size and `layout`
// the panel count. window.__shotReady is set once the scene has painted.

/** Sets up a deterministic shot scene, then awaits `load` (sample URL, caption,
 *  options) so the photo is painted before window.__shotReady is set. */
export async function runShot(shot, query, load) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const photo = query.get('photo') ?? 'pier';
  const caption = query.get('caption') ?? 'Sunset Heist';
  await load(`samples/${photo}.jpg`, caption, {
    size: query.get('size') ?? undefined,
    layout: query.get('layout') ? Number(query.get('layout')) : undefined,
  });
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
