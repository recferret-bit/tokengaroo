// Observation wheel (the London Eye): A-frame legs, rim, spokes and capsules turning slowly about
// the hub. Stands on the horizon at cx, radius r. A full turn is seamless, so the loop never jumps.

import { HORIZON, f } from '../../lib/canvas.mjs';
import { useCss } from '../../lib/css.mjs';

export function ferrisWheel(ctx, cx, r, k) {
  const { s, p } = ctx, b = HORIZON + 4, cy = b - r - 24 * k;
  useCss(ctx, 'wheel', `
  @keyframes spin { to { transform: rotate(360deg) } }
  .wheel { animation: spin 160s linear infinite }`);
  let spokes = '', pods = '';
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    spokes += `M${f(cx)},${f(cy)} L${f(cx + Math.cos(a) * r)},${f(cy + Math.sin(a) * r)} `;
  }
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI) / 12;
    pods += `<circle cx="${f(cx + Math.cos(a) * (r + 6 * k))}" cy="${f(cy + Math.sin(a) * (r + 6 * k))}" r="${f(6 * k)}" ${s.paint(p.capsule)}/>`;
  }
  return `<g data-rests="ground">
  <path d="M${f(cx - r * 0.42)},${f(b)} L${f(cx)},${f(cy)} L${f(cx + r * 0.42)},${f(b)}" ${s.line(p.steel, f(7 * k))}/>
  <g class="wheel" style="transform-origin:${f(cx)}px ${f(cy)}px">
    <path d="${spokes}" ${s.line(p.steel, f(1.5 * k))}/>
    <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" ${s.line(p.steel, f(5 * k))}/>
    <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.93)}" ${s.line(p.steel, f(2 * k))}/>
    ${pods}
  </g>
  <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(10 * k)}" ${s.paint(p.steel)}/></g>`;
}
