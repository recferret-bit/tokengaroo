// London double-decker bus driving right across the scene, then off-screen for a while.
// y = road surface under the wheels. Rest pose at 0.3 W for reduced motion.

import { W, f } from '../../lib/canvas.mjs';
import { useCss } from '../../lib/css.mjs';

export function doubleDecker(ctx, y, k) {
  const { s, p } = ctx;
  useCss(ctx, 'bus', `
  @keyframes bus-drive { 0% { transform: translateX(-220px) } 50%, 100% { transform: translateX(${W + 220}px) } }
  .bus-drive { animation: bus-drive 44s linear infinite }`);
  let win = '';
  for (const wy of [-90, -58]) for (let i = 0; i < 5; i++) win += `M${-66 + i * 25},${wy} h19 v16 h-19 Z `;
  return `
  <g data-rests="ground" transform="translate(0 ${f(y)})"><g class="bus-drive" transform="translate(${f(W * 0.3)} 0)"><g transform="scale(${f(k)})">
    <rect x="-75" y="-100" width="150" height="88" rx="9" ${s.paint(p.bus, { accent: true })}/>
    <path d="${win}M60,-90 h11 v16 h-11 Z M60,-58 h11 v26 h-11 Z" ${s.paint(p.busWindow)}/>
    <rect x="-75" y="-68" width="150" height="5" ${s.paint(p.trim)}/>
    <circle cx="-44" cy="-12" r="12" ${s.paint(p.tyre)}/>
    <circle cx="46" cy="-12" r="12" ${s.paint(p.tyre)}/>
  </g></g></g>`;
}
