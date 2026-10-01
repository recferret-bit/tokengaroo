// Victorian street lamp: cast-iron post with a ladder bar and a glowing lantern on top.
// Base at (x, y), 310 tall at k = 1. lanterns() draws lanterns alone, for lamps on buildings.

import { f } from '../../lib/canvas.mjs';
import { useCss } from '../../lib/css.mjs';

// Lanterns hanging from each [x, y] in the caller's coordinates, 28 tall: glass under a cap, with
// a soft halo that breathes. The halo keeps its opacity attribute as the rest pose.
export function lanterns(ctx, at) {
  const { s, p } = ctx;
  useCss(ctx, 'glow', `
  @keyframes glow { from { opacity: .3 } to { opacity: .55 } }
  .glow { animation: glow 4s ease-in-out infinite alternate }`);
  let halo = '', iron = '', glass = '';
  for (const [x, y] of at) {
    halo += `M${f(x - 26)},${f(y + 15)}a26,26 0 1 0 52,0a26,26 0 1 0-52,0Z`;
    iron += `M${f(x - 9)},${f(y + 6)}L${f(x)},${f(y)}L${f(x + 9)},${f(y + 6)}Z M${f(x - 7)},${f(y + 24)}h14v4h-14Z`;
    glass += `M${f(x - 8)},${f(y + 6)}H${f(x + 8)}L${f(x + 6)},${f(y + 24)}H${f(x - 6)}Z`;
  }
  return `<path class="glow" d="${halo}" ${s.paint(p.glow, { accent: true })} opacity=".4"/>`
    + `<path d="${iron}" ${s.paint(p.iron)}/><path d="${glass}" ${s.paint(p.glow, { accent: true })}/>`;
}

export function streetLamp(ctx, x, y, k) {
  const { s, p } = ctx;
  return `
  <g data-rests="ground" transform="translate(${f(x)} ${f(y)}) scale(${f(k)})">
    <path d="M-14,0h28l-4,-26h-20Z M-6,-26h12l-2,-240h-8Z M-24,-226h48v5h-48Z M-10,-266h20v-8h-20Z" ${s.paint(p.iron)}/>
    <g transform="translate(0 -318) scale(1.6)">${lanterns(ctx, [[0, 0]])}</g>
  </g>`;
}
