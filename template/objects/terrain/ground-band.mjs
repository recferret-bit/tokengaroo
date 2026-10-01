// Rolling ground band (dunes, hills, meadow) filling everything below a wavy top edge.
// Returns the svg plus its surface height yAt(x), for standing things on it.

import { W, H, between, smooth } from '../../lib/canvas.mjs';

export function groundBand(ctx, y, amp, color) {
  const ph1 = between(0, 6.28), ph2 = between(0, 6.28), k1 = between(1.5, 2.5), k2 = between(3, 5);
  const yAt = (x) => y + amp * (0.7 * Math.sin((x / W) * k1 * Math.PI + ph1) + 0.3 * Math.sin((x / W) * k2 * Math.PI + ph2));
  const pts = [];
  for (let x = -40; x <= W + 40; x += 80) pts.push([x, yAt(x)]);
  return { yAt, svg: `<path d="${smooth(pts)} L${W + 40},${H + 10} L-40,${H + 10} Z" ${ctx.s.paint(color)}/>` };
}
