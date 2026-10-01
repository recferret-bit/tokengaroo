// London: the Thames at dusk. The Palace of Westminster and Elizabeth Tower (Big Ben), the London
// Eye turning slowly, all on the far bank; a red double-decker drives along the near embankment.

import { W, H, HORIZON } from '../lib/canvas.mjs';
import { clouds } from '../objects/sky/clouds.mjs';
import { sun } from '../objects/sky/sun.mjs';
import { birds } from '../objects/animals/birds.mjs';
import { water } from '../objects/water/water.mjs';
import { ferrisWheel } from '../objects/buildings/ferris-wheel.mjs';
import { westminsterPalace } from '../objects/buildings/westminster-palace.mjs';
import { elizabethTower } from '../objects/buildings/elizabeth-tower.mjs';
import { riverWall, promenade } from '../objects/buildings/embankment.mjs';
import { doubleDecker } from '../objects/vehicles/double-decker.mjs';

export const london = {
  palettes: {
    flat: {
      skyTop: '#7f9cc4', skyBottom: '#f6d3b3', sun: '#fff2d6', cloud: '#eef1f6',
      stone: '#d1ab6c', stoneShade: '#a07c44', roof: '#4d5a6b', clockFace: '#fbf1d2',
      steel: '#5d6b7d', capsule: '#eef2f6',
      waterTop: '#a9bccf', waterBottom: '#3f566d', waveLine: '#dfe8f1',
      bank: '#9a8f7c', bankShade: '#5f584c', lamp: '#f6d58a',
      parapet: '#8a8d93', parapetShade: '#4f535a', road: '#4b5059', pavement: '#c4bbab',
      bus: '#d7342a', busWindow: '#2a2f3a', trim: '#f4ead2', tyre: '#23262e', ink: '#2a2f3a',
    },
    line: {
      paper: '#fbf3e4', ink: '#2a2f3a', sun: '#f4a259', clockFace: '#f6d58a', lamp: '#f6d58a', bus: '#d7342a',
    },
  },
  landmark: 'westminster',
  scene(ctx) {
    const { m, k } = ctx;
    const roadY = HORIZON + (H - HORIZON) * (m ? 0.62 : 0.6), towerX = W * (m ? 0.56 : 0.46);
    return {
      clouds: clouds(ctx, m ? 4 : 5),
      sun: sun(ctx, W * (m ? 0.3 : 0.62), HORIZON - (m ? 640 : 380) * k, 44 * k),
      birds: birds(ctx, 3),
      londonEye: ferrisWheel(ctx, W * (m ? 0.86 : 0.8), (m ? 150 : 190) * k, k),
      westminster: westminsterPalace(ctx, W * 0.1, towerX + 46 * k, k) + elizabethTower(ctx, towerX, HORIZON + 4, k),
      thames: water(ctx),
      // the far bank the palace and the Eye stand on; without it they stand in the river
      farBank: riverWall(ctx, HORIZON, 18 * k),
      embankment: promenade(ctx, roadY, k),
      bus: doubleDecker(ctx, roadY + 30 * k, k),
    };
  },
};
