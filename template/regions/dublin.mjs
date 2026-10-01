// Dublin: Temple Bar at dusk. The red Temple Bar pub with its flower baskets and lettered fascia,
// between narrow painted shopfronts (one a little bookshop) on a cobbled street. The lanterns glow,
// the baskets swing, and a cyclist rides past over the cobbles with books in the basket.

import { W, H, HORIZON } from '../lib/canvas.mjs';
import { clouds } from '../objects/sky/clouds.mjs';
import { sun } from '../objects/sky/sun.mjs';
import { birds } from '../objects/animals/birds.mjs';
import { plain } from '../objects/terrain/plain.mjs';
import { cobbles } from '../objects/terrain/cobbles.mjs';
import { paintedShops } from '../objects/buildings/painted-shops.mjs';
import { templeBarPub } from '../objects/buildings/temple-bar.mjs';
import { streetLamp } from '../objects/street/street-lamp.mjs';
import { cyclist } from '../objects/vehicles/bicycle.mjs';

export const dublin = {
  palettes: {
    flat: {
      skyTop: '#56648f', skyBottom: '#f0c39d', sun: '#fff1d4', cloud: '#ece4ea', ink: '#2a2730',
      pub: '#b3202a', pubShade: '#7f1720', pubDark: '#2b1d1f', letter: '#f3e3b8',
      trim: '#f3eee4', glass: '#3a4762', glow: '#ffd27a', stone: '#d9cdb6', iron: '#23262d',
      leaf: '#4c7a43', moss: '#5d6b3a', flowerA: '#e04a3a', flowerB: '#f2c84a', flowerC: '#e98bb0',
      paintA: '#e2ad3e', paintB: '#3f6f94', paintC: '#e9dcc0', paintD: '#4f7d5a',
      bookA: '#8e2f3a', bookB: '#2f5b8c', bookC: '#4a7a4f', bookD: '#c88a30', bookE: '#eadfc6',
      pavement: '#b8b0a3', cobble: '#8d8a86', cobbleLine: '#6d6a67',
      frame: '#c7372e', tyre: '#23262d', spoke: '#8a8f99', coat: '#33506f', trousers: '#6a5a4a',
      skin: '#e9b993', cap: '#6b5a46', scarf: '#efbf2f', basket: '#a87b4a',
    },
    line: {
      paper: '#fbf3e4', ink: '#2a2730', sun: '#f4a259', pub: '#c8323a', glow: '#f6d58a',
      flowerA: '#e04a3a', flowerB: '#f2c84a', flowerC: '#e98bb0', scarf: '#f2c230',
    },
  },
  landmark: 'templeBar',
  scene(ctx) {
    const { p, m, k } = ctx;
    const cx = W / 2, half = 240 * k, shop = 150 * k, kerb = HORIZON + 26 * k;
    return {
      clouds: clouds(ctx, m ? 3 : 4),
      sun: sun(ctx, W * (m ? 0.78 : 0.86), m ? 250 : 140, 34 * k),
      birds: birds(ctx, 3),
      street: plain(ctx, p.pavement) + cobbles(ctx, kerb),
      shopsLeft: paintedShops(ctx, cx - half - shop * (m ? 1 : 4), cx - half, k, 0),
      shopsRight: paintedShops(ctx, cx + half, W + 40, k, 2),
      templeBar: templeBarPub(ctx, cx, HORIZON + 4, k),
      lamps: streetLamp(ctx, W * (m ? 0.07 : 0.05), kerb - 6 * k, k) + streetLamp(ctx, W * (m ? 0.93 : 0.95), kerb - 6 * k, k),
      cyclist: cyclist(ctx, kerb + (H - kerb) * 0.6, k),
    };
  },
};
