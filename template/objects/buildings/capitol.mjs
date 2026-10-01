// US Capitol seen from the west: long low wings, central block with portico and pediment,
// colonnaded drum, ribbed dome, lantern and statue. Base centre at (x, y), 524 wide, 346 tall at k = 1.

import { f } from '../../lib/canvas.mjs';

export function capitol(ctx, x, y, k) {
  const { s, p } = ctx, c = p.marble, sh = p.marbleShade;
  let cols = '', drumCols = '', windows = '';
  for (let cx = -78; cx <= 78; cx += 13) cols += `M${cx},-84 V-8 `;
  for (let cx = -56; cx <= 56; cx += 10) drumCols += `M${cx},-196 V-156 `;
  for (const side of [-1, 1]) for (let i = 0; i < 6; i++) windows += `M${side * (112 + i * 26) - 6},-50 h12 v24 h-12 Z `;
  return `
  <g data-rests="ground" transform="translate(${f(x)} ${f(y)}) scale(${f(k)})">
    <rect x="-84" y="-150" width="168" height="60" ${s.paint(c)}/>
    <rect x="-66" y="-200" width="132" height="50" ${s.paint(c)}/>
    <path d="${drumCols}" ${s.line(sh, 3)}/>
    <rect x="-72" y="-208" width="144" height="8" ${s.paint(sh)}/>
    <path d="M-62,-208 C-62,-270 -26,-294 0,-296 C26,-294 62,-270 62,-208 Z" ${s.paint(c)}/>
    <path d="M-34,-210 Q-30,-268 -6,-294 M34,-210 Q30,-268 6,-294 M0,-210 V-296" ${s.line(sh, 2)}/>
    <rect x="-10" y="-320" width="20" height="24" ${s.paint(c)}/>
    <path d="M-12,-320 Q0,-334 12,-320 Z" ${s.paint(c)}/>
    <path d="M-3,-328 L0,-346 L3,-328 Z" ${s.paint(sh)}/>
    <rect x="-266" y="-70" width="532" height="6" ${s.paint(sh)}/>
    <rect x="-262" y="-64" width="524" height="64" ${s.paint(c)}/>
    <path d="${windows}" ${s.paint(sh)}/>
    <rect x="-92" y="-96" width="184" height="96" ${s.paint(c)}/>
    <path d="M-72,-96 L0,-124 L72,-96 Z" ${s.paint(c)}/>
    <path d="${cols}" ${s.line(sh, 3)}/>
  </g>`;
}
