// Kangaroo facing right; crosses the scene in hops, then stays off-screen for a while.
// A dust puff kicks up at its feet on every landing.
//
// The roo crosses W+400 in 24s (60% of 40s). Each puff drifts back by one hop's worth of that
// distance (in the roo's scaled units), so it stays put on the ground while the roo moves on.
// hop and dust share the .75s period and both start at landing, so they stay in sync.

import { W, f } from '../../lib/canvas.mjs';
import { useCss } from '../../lib/css.mjs';

export function kangaroo(ctx, y, k) {
  const { s, p } = ctx, c = p.animal;
  useCss(ctx, 'kangaroo', `
  @keyframes roo-run { 0% { transform: translateX(-200px) } 60%, 100% { transform: translateX(${W + 200}px) } }
  @keyframes hop {
    0%, 100% { transform: translateY(0) rotate(5deg); animation-timing-function: ease-out }
    50% { transform: translateY(-36px) rotate(-6deg); animation-timing-function: ease-in }
  }
  @keyframes dust {
    0% { transform: translateX(0) scale(.3); opacity: 0 }
    10% { opacity: .85 }
    100% { transform: translateX(-${f(((W + 400) / 24) * 0.75 / k)}px) scale(1.6); opacity: 0 }
  }
  .roo-run { animation: roo-run 40s linear infinite }
  .roo-hop { transform-box: fill-box; transform-origin: center; animation: hop .75s infinite }
  .dust { transform-box: fill-box; transform-origin: 50% 100%; animation: dust .75s ease-out infinite }
  @media (prefers-reduced-motion: reduce) { .dust { opacity: 0 } }`);
  return `
  <g data-rests="ground" transform="translate(0 ${f(y)})"><g class="roo-run" transform="translate(${f(W * 0.55)} 0)"><g transform="scale(${f(k)})">
  <g class="dust">
    <circle cx="2" cy="-4" r="6" ${s.paint(p.dust)}/>
    <circle cx="14" cy="-7" r="8" ${s.paint(p.dust)}/>
    <circle cx="26" cy="-3" r="5" ${s.paint(p.dust)}/>
  </g>
  <g class="roo-hop">
    <path d="M-22,-28 Q-58,-18 -96,-2 Q-56,-8 -18,-14 Z" ${s.paint(c)}/>
    <path d="M-30,-22 C-34,-50 -10,-64 10,-68 C22,-70 30,-64 30,-56 C28,-44 16,-32 8,-20 C2,-8 -22,-6 -30,-22 Z" ${s.paint(c)}/>
    <path d="M20,-62 Q30,-72 36,-78" ${s.line(c, 9)}/>
    <ellipse cx="42" cy="-80" rx="12" ry="7" transform="rotate(20 42 -80)" ${s.paint(c)}/>
    <path d="M32,-84 L27,-101 L37,-86 Z" ${s.paint(c)}/>
    <path d="M36,-85 L35,-102 L41,-86 Z" ${s.paint(c)}/>
    <path d="M22,-46 L30,-40 L33,-35" ${s.line(c, 3.5)}/>
    <path d="M-12,-16 L-4,-3 L28,0" ${s.line(c, 7)} stroke-linejoin="round"/>
  </g></g></g></g>`;
}
