// Gentle swing shared by things hanging from a bracket (shop signs, flower baskets). Put class="swing"
// on a group whose bounding box starts at the hanging point, centred on it: it pivots at its top middle.

import { useCss } from '../../lib/css.mjs';

export function useSwing(ctx) {
  useCss(ctx, 'swing', `
  @keyframes swing { 0%,100% { transform: rotate(-3deg) } 50% { transform: rotate(3deg) } }
  .swing { transform-box: fill-box; transform-origin: 50% 0; animation: swing 7s ease-in-out infinite }`);
}
