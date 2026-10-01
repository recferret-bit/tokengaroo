// Gentle snowfall: n flakes falling from above the canvas to below it with a slight flutter.
// Each flake's transform attribute is its rest pose, scattered over the canvas for reduced motion.

import { W, H, between, f } from '../../lib/canvas.mjs';
import { useCss } from '../../lib/css.mjs';

export function snow(ctx, n) {
  const { s, p, k } = ctx;
  useCss(ctx, 'snow', `
  @keyframes fall { from { transform: translateY(-20px) } to { transform: translateY(${H + 20}px) } }
  @keyframes flutter { from { transform: translateX(-8px) } to { transform: translateX(8px) } }
  .flake { animation: fall 20s linear infinite }
  .flutter { animation: flutter 3s ease-in-out infinite alternate }`);
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = between(0, W), y = between(0, H), r = between(2, 4.5) * k, dur = between(16, 28);
    out += `<g class="flake" transform="translate(0 ${f(y)})" style="animation-duration:${f(dur)}s;animation-delay:${f(-between(0, dur))}s"><g class="flutter" style="animation-delay:${f(-between(0, 3))}s"><circle cx="${f(x)}" cy="0" r="${f(r)}" ${s.paint(p.flake)}/></g></g>`;
  }
  return out;
}
