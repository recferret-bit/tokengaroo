// Flowering cherry: dark trunk forking into three limbs, a crown of blossom clusters that sways
// from the fork, and petals that drift down and fade. Petals are hidden with reduced motion.

import { between, f } from '../../lib/canvas.mjs';
import { useCss } from '../../lib/css.mjs';
import { useSway } from './sway.mjs';

export function cherryTree(ctx, x, baseY, h, k) {
  const { s, p } = ctx;
  useSway(ctx);
  useCss(ctx, 'petals', `
  @keyframes petal { 0% { transform: translate(0, 0) rotate(0); opacity: 0 } 15% { opacity: .9 } 100% { transform: translate(-70px, 150px) rotate(240deg); opacity: 0 } }
  .petal { transform-box: fill-box; transform-origin: center; animation: petal 7s ease-in infinite }
  @media (prefers-reduced-motion: reduce) { .petal { opacity: 0 } }`);
  const fx = x, fy = baseY - h * 0.45;
  const tips = [[x - h * 0.4, baseY - h * 0.78], [x + h * 0.04, baseY - h], [x + h * 0.42, baseY - h * 0.8]];
  let crown = '';
  for (const [bx, by] of tips) {
    crown += `<path d="M${f(fx)},${f(fy)} Q${f((fx + bx) / 2)},${f((fy + by) / 2 + 20 * k)} ${f(bx)},${f(by)}" ${s.line(p.trunk, f(8 * k))}/>`;
  }
  for (const [bx, by] of tips) {
    for (let i = 0; i < 6; i++) {
      crown += `<circle cx="${f(bx + between(-55, 55) * k)}" cy="${f(by + between(-30, 30) * k)}" r="${f(between(28, 46) * k)}" ${s.paint(i % 2 ? p.blossom : p.blossomDark, { accent: true })}/>`;
    }
  }
  let petals = '';
  for (let i = 0; i < 5; i++) {
    const px = between(tips[0][0], tips[2][0]), py = between(baseY - h * 0.85, baseY - h * 0.6);
    petals += `<ellipse class="petal" style="animation-delay:${f(-i * 1.4 - between(0, 1))}s" cx="${f(px)}" cy="${f(py)}" rx="${f(4 * k)}" ry="${f(2.5 * k)}" ${s.paint(p.blossomDark, { accent: true })}/>`;
  }
  return `
  <g data-rests="ground">
    <path d="M${f(x)},${f(baseY + 10 * k)} Q${f(x + 10 * k)},${f(baseY - h * 0.25)} ${f(fx)},${f(fy)}" ${s.line(p.trunk, f(16 * k))}/>
    <g class="crown" style="transform-origin:${f(fx)}px ${f(fy)}px">${crown}</g>
    ${petals}
  </g>`;
}
