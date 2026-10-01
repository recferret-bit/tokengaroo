// China: the Great Wall riding a mountain ridge at dawn, misty ranges behind, a red sun, and a
// pagoda and a wind-bent pine in the foreground.

import { W, H, HORIZON } from '../lib/canvas.mjs';
import { clouds } from '../objects/sky/clouds.mjs';
import { sun } from '../objects/sky/sun.mjs';
import { birds } from '../objects/animals/birds.mjs';
import { ridge } from '../objects/terrain/ridge.mjs';
import { greatWall } from '../objects/landmarks/great-wall.mjs';
import { pagoda } from '../objects/buildings/pagoda.mjs';
import { pine } from '../objects/plants/pine.mjs';

export const china = {
  palettes: {
    flat: {
      skyTop: '#9fc4d6', skyBottom: '#f9e3c4', sun: '#e2553c', cloud: '#fbf5ea',
      ridge1: '#bccdc6', ridge2: '#97b2a6', ridge3: '#6e9483', ridge4: '#456d58',
      wall: '#dcc08e', wallShade: '#8f7350',
      pine: '#3a6249', pineDark: '#24402f', trunk: '#4b3a2c',
      pagoda: '#c0392b', roof: '#2f3a3a', plinth: '#b8a58a', ink: '#2e3a33',
    },
    line: {
      paper: '#fbf3e4', ink: '#2e3a33', sun: '#e2553c', pagoda: '#c0392b',
    },
  },
  landmark: 'greatWall',
  scene(ctx) {
    const { p, m, k } = ctx;
    const far = ridge(ctx, HORIZON - 330 * k, 200 * k, p.ridge1);
    const back = ridge(ctx, HORIZON - 260 * k, 170 * k, p.ridge2);
    const wallRidge = ridge(ctx, HORIZON - 190 * k, 150 * k, p.ridge3);
    const near = ridge(ctx, HORIZON + (m ? 60 : -10) * k, (m ? 110 : 90) * k, p.ridge4);
    // mobile drops the pine and pagoda low on the near slope, well under the wall
    const pineX = m ? 70 : 80, pagodaX = W * (m ? 0.78 : 0.88);
    return {
      clouds: clouds(ctx, 3),
      sun: sun(ctx, W * (m ? 0.66 : 0.68), HORIZON - (m ? 560 : 380) * k, 54 * k),
      birds: birds(ctx, 3),
      ridgeFar: far.svg,
      ridgeBack: back.svg,
      ridgeWall: wallRidge.svg,
      greatWall: greatWall(ctx, wallRidge, W * (m ? 0.12 : 0.16), W * (m ? 0.88 : 0.78), k),
      ridgeNear: near.svg,
      pine: pine(ctx, pineX, m ? H - 30 * k : near.yAt(pineX) + 8 * k, (m ? 300 : 250) * k, -20 * k, k),
      pagoda: pagoda(ctx, pagodaX, m ? H - 150 * k : near.yAt(pagodaX) + 6 * k, k),
    };
  },
};
