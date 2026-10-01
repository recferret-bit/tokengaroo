// Mountain ridge: a skyline of peaks and smaller bumps (three summed sines) filling everything
// below it. The surface stays between top and top + amp. Returns the svg plus yAt(x), for standing
// things on it (the Great Wall follows it).

import { W, H, between, smooth } from '../../lib/canvas.mjs';

export function ridge(ctx, top, amp, color) {
  const ph = [between(0, 6.28), between(0, 6.28), between(0, 6.28)], fq = [between(2, 3), between(5, 7), between(11, 14)];
  const yAt = (x) => {
    const u = (x / W) * Math.PI;
    return top + amp * (0.5 - 0.5 * (0.6 * Math.sin(u * fq[0] + ph[0]) + 0.3 * Math.sin(u * fq[1] + ph[1]) + 0.1 * Math.sin(u * fq[2] + ph[2])));
  };
  const pts = [];
  for (let x = -40; x <= W + 40; x += 32) pts.push([x, yAt(x)]);
  return { yAt, svg: `<path data-surface="ground" d="${smooth(pts)} L${W + 40},${H + 10} L-40,${H + 10} Z" ${ctx.s.paint(color)}/>` };
}
