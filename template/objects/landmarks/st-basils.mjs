// St Basil's Cathedral: arcaded red brick base, central tent spire, and six onion-domed towers,
// each dome its own colour with twisting stripes. Base centre at (x, y), 388 wide, 411 tall at k = 1.

import { f } from '../../lib/canvas.mjs';

// Onion dome sitting on (x, t), w wide at the drum, with two stripes and a cross.
function onion(s, p, x, t, w, dome, stripe) {
  const tip = t - w * 1.3;
  return `<path d="M${f(x - w * 0.42)},${f(t)} C${f(x - w * 0.95)},${f(t - w * 0.5)} ${f(x - w * 0.22)},${f(t - w * 0.85)} ${f(x)},${f(tip)} C${f(x + w * 0.22)},${f(t - w * 0.85)} ${f(x + w * 0.95)},${f(t - w * 0.5)} ${f(x + w * 0.42)},${f(t)} Z" ${s.paint(dome, { accent: true })}/>`
    + `<path d="M${f(x - w * 0.3)},${f(t - 2)} Q${f(x - w * 0.55)},${f(t - w * 0.7)} ${f(x)},${f(tip)} M${f(x + w * 0.12)},${f(t - 2)} Q${f(x + w * 0.5)},${f(t - w * 0.55)} ${f(x)},${f(tip)}" ${s.line(stripe, 3)}/>`
    + `<path d="M${f(x)},${f(tip)} v-18 M${f(x - 6)},${f(tip - 12)} h12" ${s.line(p.cross, 2.5)}/>`;
}

// Drum from the base (y = -46) up to t, trim band, onion on top.
function tower(s, p, x, t, w, dome, stripe) {
  return `<rect x="${f(x - w / 2)}" y="${f(t)}" width="${f(w)}" height="${f(-46 - t)}" ${s.paint(p.brick)}/>`
    + `<rect x="${f(x - w / 2 - 3)}" y="${f(t + 10)}" width="${f(w + 6)}" height="7" ${s.paint(p.trim)}/>`
    + onion(s, p, x, t, w, dome, stripe);
}

export function stBasils(ctx, x, y, k) {
  const { s, p } = ctx;
  let arches = '';
  for (let i = -4; i <= 4; i++) arches += `M${i * 40 - 10},0 V-22 Q${i * 40},-34 ${i * 40 + 10},-22 V0 Z `;
  return `
  <g data-rests="ground" transform="translate(${f(x)} ${f(y)}) scale(${f(k)})">
    ${tower(s, p, -150, -150, 44, p.domeA, p.stripeA)}
    ${tower(s, p, 152, -160, 46, p.domeC, p.stripeC)}
    <rect x="-34" y="-232" width="68" height="186" ${s.paint(p.brick)}/>
    <rect x="-38" y="-240" width="76" height="8" ${s.paint(p.trim)}/>
    <path d="M-30,-240 L0,-372 L30,-240 Z" ${s.paint(p.tent)}/>
    <path d="M-21,-276 L0,-266 L21,-276 M-14,-310 L0,-302 L14,-310" ${s.line(p.domeA, 3)}/>
    ${onion(s, p, 0, -370, 14, p.domeB, p.stripeB)}
    ${tower(s, p, -92, -200, 52, p.domeB, p.stripeB)}
    ${tower(s, p, 94, -210, 54, p.domeD, p.stripeD)}
    ${tower(s, p, -40, -128, 40, p.domeC, p.stripeC)}
    ${tower(s, p, 44, -136, 42, p.domeA, p.stripeA)}
    <rect x="-194" y="-52" width="388" height="8" ${s.paint(p.trim)}/>
    <rect x="-190" y="-46" width="380" height="46" ${s.paint(p.brick)}/>
    <path d="${arches}" ${s.paint(p.brickShade)}/>
  </g>`;
}
