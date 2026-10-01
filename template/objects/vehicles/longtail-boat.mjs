// Thai long-tail boat with canopy and tail pole, bobbing on the water at (x, y).

import { f } from '../../lib/canvas.mjs';
import { useCss } from '../../lib/css.mjs';

export function longtailBoat(ctx, x, y, k) {
  const { s, p } = ctx;
  useCss(ctx, 'boat', `
  @keyframes bob { 0%,100% { transform: translateY(0) rotate(0) } 50% { transform: translateY(6px) rotate(1.5deg) } }
  .boat { transform-box: fill-box; transform-origin: center; animation: bob 4s ease-in-out infinite }`);
  return `
  <g data-rests="water" transform="translate(${f(x)} ${f(y)}) scale(${f(k)})">
    <g class="boat">
      <path d="M-100,-6 Q-10,26 110,-14 L124,-34 Q60,4 -100,-14 Z" ${s.paint(p.boat)}/>
      <path d="M-40,-14 L-40,-46 L40,-50 L40,-10" ${s.line(p.boat, 3)}/>
      <path d="M-50,-46 L50,-52" ${s.line(p.accent, 6)}/>
      <path d="M-100,-12 L-160,8" ${s.line(p.boat, 3)}/>
      <path d="M124,-34 l6,-6" ${s.line(p.accent, 5)}/>
    </g>
  </g>`;
}
