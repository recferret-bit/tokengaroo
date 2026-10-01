// Chinese pagoda: stone plinth, three storeys of red walls under dark upswept roofs, and a spire.
// Base centre at (x, y), about 132 wide (lowest eaves) and 224 tall at k = 1.

import { f } from '../../lib/canvas.mjs';

export function pagoda(ctx, x, y, k) {
  const { s, p } = ctx;
  let out = `<rect x="-56" y="-14" width="112" height="14" ${s.paint(p.plinth)}/>`, base = -14;
  for (const [bw, bh, rw] of [[76, 44, 66], [60, 38, 54], [46, 32, 42]]) {
    const ty = base - bh;
    out += `<rect x="${-bw / 2}" y="${ty}" width="${bw}" height="${bh}" ${s.paint(p.pagoda, { accent: true })}/>`
      + `<path d="M-8,${base} V${ty + 14} Q0,${ty + 8} 8,${ty + 14} V${base} Z" ${s.paint(p.roof)}/>`
      + `<path d="M${-rw},${ty - 4} Q${f(-rw * 0.7)},${ty + 4} ${f(-rw * 0.45)},${ty + 2} L${f(rw * 0.45)},${ty + 2} Q${f(rw * 0.7)},${ty + 4} ${rw},${ty - 4} L${f(rw * 0.4)},${ty - 20} L${f(-rw * 0.4)},${ty - 20} Z" ${s.paint(p.roof)}/>`;
    base = ty - 20;
  }
  out += `<path d="M0,${base} V${base - 36} M-6,${base - 12} h12 M-4,${base - 22} h8" ${s.line(p.roof, 4)}/>`;
  return `<g data-rests="ground" transform="translate(${f(x)} ${f(y)}) scale(${f(k)})">${out}</g>`;
}
