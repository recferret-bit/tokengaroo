// Cyclist in a flat cap and scarf riding right across the street, books in the front basket, then
// off-screen for a while. y = road surface under the wheels. Rest pose at 0.22 W for reduced motion.

import { W, f } from '../../lib/canvas.mjs';
import { useCss } from '../../lib/css.mjs';

export function cyclist(ctx, y, k) {
  const { s, p } = ctx;
  useCss(ctx, 'cyclist', `
  @keyframes ride { 0% { transform: translateX(-160px) } 55%, 100% { transform: translateX(${W + 160}px) } }
  @keyframes spin { to { transform: rotate(360deg) } }
  .ride { animation: ride 38s linear infinite }
  .wheel { transform-box: fill-box; transform-origin: center; animation: spin 1.6s linear infinite }`);
  const wheel = (cx) => `<g class="wheel"><circle cx="${cx}" cy="-24" r="23" ${s.line(p.tyre, 4)}/>`
    + `<path d="M${cx - 23},-24 H${cx + 23} M${cx - 11.5},-43.9 L${cx + 11.5},-4.1 M${cx + 11.5},-43.9 L${cx - 11.5},-4.1" ${s.line(p.spoke, 1.5)}/></g>`;
  return `
  <g data-rests="ground" transform="translate(0 ${f(y)})"><g class="ride" transform="translate(${f(W * 0.22)} 0)"><g transform="scale(${f(k)})">
    ${wheel(-36)}${wheel(36)}
    <path d="M-16,-72 L2,-50 L-8,-30" ${s.line(p.trousers, 7)}/>
    <path d="M-36,-24 L-14,-62 L24,-62 L-4,-26 Z M-14,-62 L-4,-26 M24,-62 L36,-24 M-14,-62 L-16,-70 M24,-62 L22,-78 L14,-80" ${s.line(p.frame, 4)}/>
    <path d="M-26,-73 h18 l-2,5 h-14 Z" ${s.paint(p.ink)}/>
    <path d="M29,-100 h6 v14 h-6 Z M37,-103 h5 v17 h-5 Z M44,-99 h5 v13 h-5 Z" ${s.paint(p.bookB)}/>
    <rect x="26" y="-90" width="24" height="16" rx="2" ${s.paint(p.basket)}/>
    <path d="M-16,-72 L10,-58 L2,-28" ${s.line(p.trousers, 7)}/>
    <path d="M-26,-66 L-8,-120 Q2,-126 10,-118 L0,-68 Z" ${s.paint(p.coat)}/>
    <path d="M4,-114 L20,-80" ${s.line(p.coat, 7)}/>
    <path d="M-7,-124 l15,2 l-1,6 l-15,-2 Z M-6,-119 l-8,16 l5,1 l7,-14 Z" ${s.paint(p.scarf, { accent: true })}/>
    <circle cx="4" cy="-134" r="10" ${s.paint(p.skin)}/>
    <path d="M-7,-136 Q-6,-147 5,-147 Q14,-147 16,-139 L22,-136 Z" ${s.paint(p.cap)}/>
  </g></g></g>`;
}
