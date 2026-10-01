// Sun disc with two slowly pulsing halo rings.

import { f } from '../../lib/canvas.mjs';
import { useCss } from '../../lib/css.mjs';

export function sun(ctx, x, y, r) {
  const { s, p } = ctx;
  useCss(ctx, 'sun', `
  @keyframes pulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.08) } }
  .halo { transform-box: fill-box; transform-origin: center; animation: pulse 6s ease-in-out infinite }`);
  return `
  <g>
    <circle class="halo" cx="${f(x)}" cy="${f(y)}" r="${f(r * 1.9)}" ${s.paint(p.sun, { accent: true })} opacity=".15"/>
    <circle class="halo" style="animation-delay:-3s" cx="${f(x)}" cy="${f(y)}" r="${f(r * 1.4)}" ${s.paint(p.sun, { accent: true })} opacity=".25"/>
    <circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" ${s.paint(p.sun, { accent: true })}/>
  </g>`;
}
