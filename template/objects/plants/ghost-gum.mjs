// Ghost gum (eucalyptus): pale forked trunk, clumped canopy that sways from the fork.

import { between, f } from '../../lib/canvas.mjs';
import { useSway } from './sway.mjs';

export function ghostGum(ctx, x, baseY, h, k) {
  const { s, p } = ctx;
  useSway(ctx);
  const fx = x + 10 * k, fy = baseY - h * 0.5, top = baseY - h;
  const tips = [[x - 110 * k, top + 50 * k], [x + 15 * k, top], [x + 130 * k, top + 60 * k]];
  let crown = '';
  for (const [bx, by] of tips) {
    crown += `<path d="M${f(fx)},${f(fy)} Q${f((fx + bx) / 2 + 18 * k)},${f((fy + by) / 2)} ${f(bx)},${f(by)}" ${s.line(p.trunk, f(9 * k))}/>`;
  }
  for (const [bx, by] of tips) {
    for (let i = 0; i < 5; i++) {
      crown += `<ellipse cx="${f(bx + between(-60, 60) * k)}" cy="${f(by + between(-30, 18) * k)}" rx="${f(between(32, 52) * k)}" ry="${f(between(18, 28) * k)}" ${s.paint(i % 2 ? p.leaf : p.leafDark)}/>`;
    }
  }
  return `
  <g data-rests="ground">
    <path d="M${f(x)},${f(baseY + 10 * k)} Q${f(x - 8 * k)},${f(baseY - h * 0.3)} ${f(fx)},${f(fy)}" ${s.line(p.trunk, f(18 * k))}/>
    <g class="crown" style="transform-origin:${f(fx)}px ${f(fy)}px">${crown}</g>
  </g>`;
}
