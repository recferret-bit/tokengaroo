// Gentle back-and-forth rotation shared by tree crowns. Put class="crown" on the group and a px
// transform-origin at its pivot (where it meets the trunk).

import { useCss } from '../../lib/css.mjs';

export function useSway(ctx) {
  useCss(ctx, 'sway', `
  @keyframes sway { 0%,100% { transform: rotate(-2.5deg) } 50% { transform: rotate(2.5deg) } }
  .crown { animation: sway 5s ease-in-out infinite }`);
}
