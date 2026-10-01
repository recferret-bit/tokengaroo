// Washington, D.C.: the National Mall in cherry-blossom season. The Washington Monument and its
// reflection in the pool, the Capitol beyond a line of trees, blossoming cherries at the edges.

import { W, H, HORIZON } from '../lib/canvas.mjs';
import { clouds } from '../objects/sky/clouds.mjs';
import { sun } from '../objects/sky/sun.mjs';
import { birds } from '../objects/animals/birds.mjs';
import { plain } from '../objects/terrain/plain.mjs';
import { karstRange } from '../objects/terrain/karst.mjs';
import { obelisk } from '../objects/buildings/obelisk.mjs';
import { capitol } from '../objects/buildings/capitol.mjs';
import { reflectingPool } from '../objects/water/reflecting-pool.mjs';
import { cherryTree } from '../objects/plants/cherry-tree.mjs';

export const washington = {
  palettes: {
    flat: {
      skyTop: '#6fa8dc', skyBottom: '#fbd7b8', sun: '#fff4dc', cloud: '#ffffff',
      marble: '#f7f3ea', marbleShade: '#cfc5b2', trees: '#5f8d4e', lawn: '#93c06a',
      poolRim: '#ddd5c5', waterTop: '#a7c9e6', waterBottom: '#5e8fbf', waveLine: '#eef6fc',
      trunk: '#4a3530', blossom: '#f7bcd0', blossomDark: '#ec95b2', ink: '#2d3142',
    },
    line: {
      paper: '#fbf3e4', ink: '#2d3142', sun: '#f4a259', blossom: '#f7bcd0', blossomDark: '#ec95b2',
    },
  },
  landmark: 'capitol',
  scene(ctx) {
    const { p, m, k } = ctx;
    const monX = W * (m ? 0.27 : 0.36), monW = 36 * k;
    return {
      clouds: clouds(ctx, 3),
      sun: sun(ctx, W * (m ? 0.78 : 0.86), HORIZON - (m ? 520 : 400) * k, 52 * k),
      birds: birds(ctx, 3),
      lawn: plain(ctx, p.lawn),
      // the line of elms along the Mall, behind the monuments
      trees: karstRange(ctx, m ? 7 : 12, 26 * k, 48 * k, 70 * k, 110 * k, p.trees, -40, W + 40),
      monument: obelisk(ctx, monX, HORIZON + 4, monW, 400 * k),
      capitol: capitol(ctx, W * (m ? 0.62 : 0.64), HORIZON + 4, (m ? 0.75 : 0.8) * k),
      // the pool's near end stays inside the lawn, so the cherry trees stand on grass, not in the water
      pool: reflectingPool(ctx, monX, HORIZON + 16 * k, 150 * k, m ? W * 1.1 : W * 0.58, { x: monX, w: monW }),
      // mobile: the pool fills the lower left, so only the right-hand tree; both stay clear of the Capitol
      cherries: (m ? '' : cherryTree(ctx, 90, H - 24 * k, 380 * k, k))
        + cherryTree(ctx, W - (m ? 40 : 80), H - 20 * k, (m ? 330 : 360) * k, k),
    };
  },
};
