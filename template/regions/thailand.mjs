// Thailand: Phang Nga bay at sunset. Limestone karsts, a temple island, long-tail boat, palms.

import { W, H, HORIZON, between, f } from '../lib/canvas.mjs';
import { clouds } from '../objects/sky/clouds.mjs';
import { sun } from '../objects/sky/sun.mjs';
import { birds } from '../objects/animals/birds.mjs';
import { karst, karstRange } from '../objects/terrain/karst.mjs';
import { templeIsland } from '../objects/landmarks/temple-island.mjs';
import { water } from '../objects/water/water.mjs';
import { sunGlints } from '../objects/water/sun-glints.mjs';
import { longtailBoat } from '../objects/vehicles/longtail-boat.mjs';
import { palm } from '../objects/plants/palm.mjs';

export const thailand = {
  palettes: {
    flat: {
      skyTop: '#ff8a5c', skyBottom: '#ffd59e', sun: '#fff3d1', cloud: '#ffe7c4',
      far: '#eaa07e', mid: '#c46f68', near: '#7f3f57',
      waterTop: '#f0a985', waterBottom: '#6a2f4f', waveLine: '#ffe3c2',
      temple: '#4a2140', palm: '#2e1430', boat: '#2e1430', accent: '#f2b84b', ink: '#2e1430',
    },
    line: {
      paper: '#fbf3e4', ink: '#2e1430', sun: '#f4a259', accent: '#e76f51', waveLine: '#2e1430',
    },
  },
  landmark: 'temple',
  scene(ctx) {
    const { p, m, k } = ctx;
    const sunX = between(W * 0.55, W * 0.75);
    // mobile keeps the palms in the right edge so the centre stays clear
    const beachX = W - (m ? 380 : 520) * k;
    return {
      clouds: clouds(ctx, m ? 3 : 4),
      sun: sun(ctx, sunX, HORIZON - 250 * k, 70 * k),
      birds: birds(ctx, 4),
      karstFar: karstRange(ctx, m ? 4 : 7, 110 * k, 190 * k, 140 * k, 240 * k, p.far),
      karstMid: karstRange(ctx, m ? 3 : 5, 170 * k, 290 * k, 160 * k, 260 * k, p.mid),
      temple: templeIsland(ctx, m ? 30 : 120, 440 * k, k),
      karstNear: karst(ctx, W - 120 * k, 300 * k, 420 * k, p.near),
      water: water(ctx),
      glints: sunGlints(ctx, sunX),
      boat: longtailBoat(ctx, W * 0.5, HORIZON + (H - HORIZON) * 0.6, k),
      // one-off foreground sand bar for the palms, bottom right
      beach: `<path data-surface="ground" d="M${f(beachX)},${H} C${f(beachX + 140 * k)},${f(H - 70 * k)} ${f(W - 150 * k)},${f(H - 90 * k)} ${W},${f(H - 100 * k)} L${W},${H} Z" ${ctx.s.paint(p.palm)}/>`,
      palms: palm(ctx, W - (m ? 130 : 230) * k, H - 70 * k, 360 * k, (m ? -50 : -90) * k)
        + palm(ctx, W - (m ? 40 : 120) * k, H - 85 * k, 280 * k, -40 * k),
    };
  },
};
