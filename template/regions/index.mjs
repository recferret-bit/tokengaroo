// Every region the generator builds. Add a region: create regions/<name>.mjs and list it here.
//
// A region is { palettes: { <style>: {...colours} }, landmark: '<layer name>', scene(ctx) }.
// scene() returns an ordered object { layerName: svg }; key order is draw order (back to front).

import { thailand } from './thailand.mjs';
import { australia } from './australia.mjs';
import { washington } from './washington.mjs';
import { moscow } from './moscow.mjs';
import { london } from './london.mjs';
import { china } from './china.mjs';
import { dublin } from './dublin.mjs';

export const REGIONS = { thailand, australia, washington, moscow, london, china, dublin };
