// Spasskaya Tower of the Kremlin: gate block, clock stage, tiered top, green tent roof, red star.
// Base centre at (x, y), 96 wide and 401 tall at k = 1.

import { f } from '../../lib/canvas.mjs';

export function spasskayaTower(ctx, x, y, k) {
  const { s, p } = ctx;
  const star = Array.from({ length: 10 }, (_, i) => {
    const a = (i * Math.PI) / 5 - Math.PI / 2, r = i % 2 ? 5 : 13;
    return `${f(Math.cos(a) * r)},${f(-388 + Math.sin(a) * r)}`;
  }).join(' L');
  return `
  <g data-rests="ground" transform="translate(${f(x)} ${f(y)}) scale(${f(k)})">
    <rect x="-44" y="-150" width="88" height="150" ${s.paint(p.brick)}/>
    <path d="M-15,0 V-42 Q0,-60 15,-42 V0 Z" ${s.paint(p.brickShade)}/>
    <rect x="-48" y="-158" width="96" height="8" ${s.paint(p.trim)}/>
    <rect x="-34" y="-222" width="68" height="64" ${s.paint(p.brick)}/>
    <circle cx="0" cy="-190" r="21" ${s.paint(p.clock, { accent: true })}/>
    <path d="M0,-190 V-204 M0,-190 L10,-184" ${s.line(p.ink, 3)}/>
    <rect x="-38" y="-230" width="76" height="8" ${s.paint(p.trim)}/>
    <rect x="-24" y="-284" width="48" height="54" ${s.paint(p.brick)}/>
    <path d="M-13,-238 V-262 Q-8,-270 -3,-262 V-238 Z M3,-238 V-262 Q8,-270 13,-262 V-238 Z" ${s.paint(p.brickShade)}/>
    <rect x="-28" y="-292" width="56" height="8" ${s.paint(p.trim)}/>
    <path d="M-26,-292 L0,-372 L26,-292 Z" ${s.paint(p.roof)}/>
    <path d="M0,-372 V-380" ${s.line(p.roof, 3)}/>
    <path d="M${star} Z" ${s.paint(p.star, { accent: true })}/>
  </g>`;
}
