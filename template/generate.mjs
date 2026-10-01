#!/usr/bin/env node
// Region background generator: deterministic, dependency-free, animated SVG.
//
//   node generate.mjs --region thailand --style flat --format mobile --seed 7 > thailand.svg
//   node generate.mjs --all --out dist     # every region x style x format, plus dist/index.html preview
//
// This file only orchestrates. Everything that gets drawn lives elsewhere:
//   lib/       canvas + seeded RNG, formats, styles, CSS registry, preview page
//   objects/   one file per kind of object, grouped by kind (sky, animals, plants, terrain, water,
//              landmarks, buildings, vehicles); each object registers its own animation CSS
//   regions/   one file per region: palettes per style, the landmark layer, scene()
//
// Contract with check.mjs (the QA harness); keep it when editing:
//   - scene() returns an ordered object { layerName: svgString }; render() wraps each in <g data-layer>.
//   - region.landmark names the layer holding the hero landmark.
//   - the root <svg> carries data-horizon and data-landmark; the sky rect is data-layer="sky".
//   - the reduced-motion block stays last in <style>.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { begin, W, H, HORIZON } from './lib/canvas.mjs';
import { FORMATS } from './lib/formats.mjs';
import { STYLES } from './lib/styles.mjs';
import { previewPage } from './lib/preview.mjs';
import { REGIONS } from './regions/index.mjs';

export function render(regionName, styleName, formatName, seed = 7) {
  const region = REGIONS[regionName], fmt = FORMATS[formatName];
  if (!region) throw new Error(`unknown region "${regionName}" (have: ${Object.keys(REGIONS).join(', ')})`);
  if (!fmt) throw new Error(`unknown format "${formatName}" (have: ${Object.keys(FORMATS).join(', ')})`);
  const p = region.palettes[styleName];
  if (!p || !STYLES[styleName]) throw new Error(`style "${styleName}" not defined for ${regionName}`);

  begin(fmt, seed);
  const ctx = { p, s: STYLES[styleName](p), m: formatName === 'mobile', k: fmt.k, css: new Map() };
  const layers = Object.entries(region.scene(ctx))
    .map(([name, svg]) => `<g data-layer="${name}">${svg}</g>`)
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${regionName} background" data-horizon="${HORIZON}" data-landmark="${region.landmark ?? ''}">
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.skyTop ?? p.paper}"/><stop offset="1" stop-color="${p.skyBottom ?? p.paper}"/></linearGradient>
  <linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.waterTop ?? p.skyBottom ?? p.paper}"/><stop offset="1" stop-color="${p.waterBottom ?? p.skyBottom ?? p.paper}"/></linearGradient>
</defs>
<style>${[...ctx.css.values()].join('')}
  @media (prefers-reduced-motion: reduce) { * { animation: none !important } }
</style>
<rect data-layer="sky" width="${W}" height="${H}" fill="${ctx.s.sky}"/>
${layers}
</svg>
`;
}

// Every region x style x format the generator can build, for --all and for check.mjs.
export function variants() {
  return Object.keys(REGIONS).flatMap((region) =>
    Object.keys(REGIONS[region].palettes).flatMap((style) =>
      Object.keys(FORMATS).map((format) => ({ region, style, format, name: `${region}-${style}-${format}` }))));
}

function cli() {
  const args = {};
  process.argv.slice(2).forEach((a, i, all) => {
    if (a.startsWith('--')) args[a.slice(2)] = all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true;
  });
  const seed = Number(args.seed ?? 7);

  if (args.all) {
    const out = typeof args.out === 'string' ? args.out : 'dist';
    mkdirSync(out, { recursive: true });
    const files = variants().map((v) => ({ ...v, name: `${v.name}.svg` }));
    for (const v of files) writeFileSync(join(out, v.name), render(v.region, v.style, v.format, seed));
    writeFileSync(join(out, 'index.html'), previewPage(files));
    console.error(`wrote ${files.length} backgrounds + index.html to ${out}/`);
  } else {
    process.stdout.write(render(args.region ?? 'thailand', args.style ?? 'flat', args.format ?? 'desktop', seed));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) cli();
