// Side-by-side desktop/mobile preview page for everything built by `generate.mjs --all`.

export function previewPage(files) {
  const groups = {};
  for (const file of files) (groups[`${file.region} · ${file.style}`] ??= {})[file.format] = file.name;
  const sections = Object.entries(groups).map(([title, g]) => `
  <section>
    <h2>${title}</h2>
    <div class="row">
      <figure><img class="desktop" src="${g.desktop}" alt="${title}, desktop"><figcaption>${g.desktop}</figcaption></figure>
      <figure><img class="mobile" src="${g.mobile}" alt="${title}, mobile"><figcaption>${g.mobile}</figcaption></figure>
    </div>
  </section>`).join('');
  return `<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Region backgrounds</title>
<style>
  body { margin: 0; padding: 24px 16px; font: 14px/1.4 system-ui, sans-serif; background: #f4f1ec; color: #222 }
  h1 { margin: 0 0 8px } h2 { margin: 32px 0 12px; font-weight: 600; text-transform: capitalize }
  .row { display: flex; gap: 24px; align-items: flex-end; flex-wrap: wrap }
  figure { margin: 0 } figcaption { margin-top: 6px; color: #777; font: 12px ui-monospace, monospace }
  img { display: block; max-width: 100%; box-shadow: 0 2px 12px #0002 }
  .desktop { width: 720px; aspect-ratio: 16 / 9; border-radius: 10px }
  .mobile { width: 228px; aspect-ratio: 9 / 16; border-radius: 26px }
</style>
<h1>Region backgrounds</h1>
${sections}
`;
}
