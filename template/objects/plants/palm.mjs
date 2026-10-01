// Coconut palm: curved trunk, seven leaf fronds that sway from the top of the trunk.

import { between, f } from '../../lib/canvas.mjs';
import { useSway } from './sway.mjs';

export function palm(ctx, x, baseY, h, lean) {
  const { s, p } = ctx;
  useSway(ctx);
  const tx = x + lean, ty = baseY - h;
  let fronds = '';
  const angles = [-160, -125, -90, -55, -20, 15, 160 + 35];
  for (const a of angles) {
    const rad = (a * Math.PI) / 180, len = h * 0.42;
    const ex = tx + Math.cos(rad) * len, ey = ty + Math.sin(rad) * len + len * 0.35;
    const cx1 = tx + Math.cos(rad - 0.25) * len * 0.6, cy1 = ty + Math.sin(rad - 0.25) * len * 0.6 - 10;
    const cx2 = tx + Math.cos(rad + 0.25) * len * 0.5, cy2 = ty + Math.sin(rad + 0.25) * len * 0.5 + 6;
    fronds += `<path d="M${f(tx)},${f(ty)} Q${f(cx1)},${f(cy1)} ${f(ex)},${f(ey)} Q${f(cx2)},${f(cy2)} ${f(tx)},${f(ty)} Z" ${s.paint(p.palm)}/>`;
  }
  return `
  <g>
    <path d="M${f(x)},${f(baseY)} Q${f(x + lean * 0.1)},${f(baseY - h * 0.55)} ${f(tx)},${f(ty)}" ${s.line(p.palm, 14)}/>
    <g class="crown" style="transform-origin:${f(tx)}px ${f(ty)}px;animation-delay:${f(-between(0, 5))}s">${fronds}
      <circle cx="${f(tx)}" cy="${f(ty + 6)}" r="8" ${s.paint(p.palm)}/>
    </g>
  </g>`;
}
