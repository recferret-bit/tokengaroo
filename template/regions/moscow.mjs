// Moscow: Red Square on a winter evening. St Basil's Cathedral in front of the Kremlin wall and
// Spasskaya Tower, fresh snow on the square and snow still falling.

import { W, H, HORIZON } from '../lib/canvas.mjs';
import { clouds } from '../objects/sky/clouds.mjs';
import { sun } from '../objects/sky/sun.mjs';
import { snow } from '../objects/sky/snow.mjs';
import { birds } from '../objects/animals/birds.mjs';
import { plain } from '../objects/terrain/plain.mjs';
import { groundBand } from '../objects/terrain/ground-band.mjs';
import { kremlinWall } from '../objects/buildings/kremlin-wall.mjs';
import { spasskayaTower } from '../objects/buildings/spasskaya-tower.mjs';
import { stBasils } from '../objects/landmarks/st-basils.mjs';

export const moscow = {
  palettes: {
    flat: {
      skyTop: '#4f6fa8', skyBottom: '#f4c7a6', sun: '#fff1d6', cloud: '#f6eef0',
      snow: '#f3f6fa', snowMid: '#e4eaf3', snowShade: '#d3dcea', flake: '#ffffff',
      brick: '#b5412f', brickShade: '#7a2a20', trim: '#efe6d6', tent: '#f1e3c4', roof: '#2f7a55',
      star: '#e0453a', clock: '#f7e7b0', cross: '#e8b93c',
      domeA: '#2f8a5b', stripeA: '#f0d36a', domeB: '#f0b93a', stripeB: '#c43b2e',
      domeC: '#3567a8', stripeC: '#f4f1ea', domeD: '#d4473a', stripeD: '#3b9c63', ink: '#2b2233',
    },
    line: {
      paper: '#fbf3e4', ink: '#2b2233', sun: '#f4a259', star: '#e0453a', clock: '#f7e7b0',
      domeA: '#2f8a5b', domeB: '#f0b93a', domeC: '#3567a8', domeD: '#d4473a',
    },
  },
  landmark: 'stBasils',
  scene(ctx) {
    const { p, m, k } = ctx;
    const depth = H - HORIZON;
    const driftFar = groundBand(ctx, HORIZON + depth * 0.4, 8 * k, p.snowMid);
    const drift = groundBand(ctx, H - depth * 0.24, 14 * k, p.snowShade);
    return {
      clouds: clouds(ctx, m ? 3 : 4),
      sun: sun(ctx, W * (m ? 0.8 : 0.86), HORIZON - (m ? 560 : 420) * k, 46 * k),
      birds: birds(ctx, 3),
      square: plain(ctx, p.snow),
      kremlinWall: kremlinWall(ctx, -10, W + 10, 64 * k, k, m ? [W * 0.06] : [W * 0.06, W * 0.94]),
      spasskaya: spasskayaTower(ctx, W * (m ? 0.16 : 0.24), HORIZON + 4, (m ? 0.9 : 1) * k),
      stBasils: stBasils(ctx, W * (m ? 0.6 : 0.62), HORIZON + 4, k),
      driftFar: driftFar.svg,
      drift: drift.svg,
      snow: snow(ctx, m ? 22 : 26),
    };
  },
};
