// Elizabeth Tower (Big Ben): tall shaft, clock stage with a face, belfry, pinnacled spire.
// Base centre at (x, y), 66 wide and 490 tall at k = 1.

import { f } from '../../lib/canvas.mjs';

export function elizabethTower(ctx, x, y, k) {
  const { s, p } = ctx;
  return `
  <g data-rests="ground" transform="translate(${f(x)} ${f(y)}) scale(${f(k)})">
    <rect x="-26" y="-300" width="52" height="300" ${s.paint(p.stone)}/>
    <path d="M-14,-290 V-10 M0,-290 V-10 M14,-290 V-10" ${s.line(p.stoneShade, 2)}/>
    <rect x="-33" y="-366" width="66" height="66" ${s.paint(p.stone)}/>
    <circle cx="0" cy="-333" r="23" ${s.paint(p.clockFace, { accent: true })}/>
    <path d="M0,-333 V-349 M0,-333 L11,-327" ${s.line(p.ink, 3)}/>
    <rect x="-27" y="-392" width="54" height="26" ${s.paint(p.stone)}/>
    <path d="M-18,-370 V-382 Q-13,-389 -8,-382 V-370 Z M-5,-370 V-382 Q0,-389 5,-382 V-370 Z M8,-370 V-382 Q13,-389 18,-382 V-370 Z" ${s.paint(p.stoneShade)}/>
    <path d="M-31,-392 L0,-462 L31,-392 Z" ${s.paint(p.roof)}/>
    <path d="M-33,-392 l5,-24 l5,24 Z M23,-392 l5,-24 l5,24 Z" ${s.paint(p.roof)}/>
    <path d="M0,-462 V-490" ${s.line(p.roof, 3)}/>
  </g>`;
}
