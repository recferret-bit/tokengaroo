// The canvas being rendered and its seeded random stream.
//
// render() calls begin() before a scene runs. Objects import W, H and HORIZON as live bindings,
// so they always see the current canvas. Every random value goes through between() or random():
// the same seed then gives the same picture, as long as the calls happen in the same order.

export let W = 0, H = 0, HORIZON = 0;
let rand = () => { throw new Error('begin() must run before drawing'); };

export function begin(format, seed) {
  ({ w: W, h: H, horizon: HORIZON } = format);
  rand = mulberry32(seed);
}

function mulberry32(s) {
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const random = () => rand();
export const between = (a, b) => a + rand() * (b - a);

// Round to one decimal for compact SVG.
export const f = (n) => Math.round(n * 10) / 10;

// Catmull-Rom spline through points, as cubic Bezier segments.
export function smooth(pts) {
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i - 1] ?? pts[i], b = pts[i], c = pts[i + 1], e = pts[i + 2] ?? c;
    d += ` C${f(b[0] + (c[0] - a[0]) / 6)},${f(b[1] + (c[1] - a[1]) / 6)} ${f(c[0] - (e[0] - b[0]) / 6)},${f(c[1] - (e[1] - b[1]) / 6)} ${f(c[0])},${f(c[1])}`;
  }
  return d;
}
