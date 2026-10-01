// Flat ground from the horizon down, full width. Anything standing on the horizon needs ground
// under it, or the sky shows through and the object floats (the harness's grounding check).

import { W, H, HORIZON } from '../../lib/canvas.mjs';

export function plain(ctx, color) {
  return `<rect data-surface="ground" x="-10" y="${HORIZON}" width="${W + 20}" height="${H - HORIZON + 10}" ${ctx.s.paint(color)}/>`;
}
