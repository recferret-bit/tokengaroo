// Thai chedi (stupa): stacked plinths, bell, rings, spire. Base centre at (x, y), 210 units tall at k = 1.

import { f } from '../../lib/canvas.mjs';

export function chedi(ctx, x, y, k) {
  const { s, p } = ctx;
  const c = p.temple;
  return `
  <g data-rests="ground" transform="translate(${f(x)} ${f(y)}) scale(${f(k)})">
    <rect x="-60" y="-16" width="120" height="16" ${s.paint(c)}/>
    <rect x="-45" y="-32" width="90" height="16" ${s.paint(c)}/>
    <rect x="-32" y="-46" width="64" height="14" ${s.paint(c)}/>
    <path d="M-34,-46 C-34,-96 -12,-112 0,-120 C12,-112 34,-96 34,-46 Z" ${s.paint(c)}/>
    <rect x="-12" y="-132" width="24" height="12" ${s.paint(c)}/>
    <rect x="-8" y="-142" width="16" height="10" ${s.paint(c)}/>
    <path d="M-6,-142 L0,-210 L6,-142 Z" ${s.paint(c)}/>
  </g>`;
}
