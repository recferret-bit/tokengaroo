// Sea or lake from the horizon down: gradient body plus drifting wave lines that get longer and
// thicker toward the viewer. Straight horizontal dashes read as water, so keep them for water only.

import { W, H, HORIZON, between, f } from '../../lib/canvas.mjs';
import { useCss } from '../../lib/css.mjs';

// The drifting motion of class="wave" lines, shared with other water (see reflecting-pool.mjs).
export function useWaves(ctx) {
  useCss(ctx, 'water', `
  @keyframes drift { from { transform: translateX(-30px) } to { transform: translateX(30px) } }
  .wave { animation: drift 6s ease-in-out infinite alternate }`);
}

export function water(ctx) {
  const { s, p } = ctx;
  useWaves(ctx);
  let waves = '';
  for (let i = 0; i < 22; i++) {
    const t = i / 21;
    const y = HORIZON + 18 + t * t * (H - HORIZON - 30);
    const len = 30 + t * 140, x = between(0, W - len);
    waves += `<line class="wave" style="animation-duration:${f(between(4, 8))}s;animation-delay:${f(-between(0, 8))}s" x1="${f(x)}" y1="${f(y)}" x2="${f(x + len)}" y2="${f(y)}" ${s.line(p.waveLine, 2 + t * 2)} opacity="${f(0.35 + t * 0.4)}"/>`;
  }
  return `<rect data-surface="water" x="0" y="${HORIZON}" width="${W}" height="${H - HORIZON}" fill="${s.water}"/>${waves}`;
}
