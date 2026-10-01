// Stroke lettering for shop signs: capitals in a 15 × 22 box, drawn with s.line() by the caller.
// lettering() returns path data only, so a sign's whole text is one path. No RNG.

const GLYPHS = {
  A: 'm0,22l7.5,-22l7.5,22m-12.5,-8h10',
  B: 'v22m0,-22h8q6,0 6,5.5q0,5.5 -6,5.5h-8h9q6,0 6,5.5q0,5.5 -6,5.5h-9',
  E: 'h14m-14,0v22h14m-14,-11h11',
  H: 'v22m14,-22v22m-14,-11h14',
  K: 'v22m14,-22l-14,14m5,-5l9,13',
  L: 'v22h13',
  M: 'm0,22v-22l7.5,13l7.5,-13v22',
  O: 'm7.5,0a7.5,11 0 0 1 0,22a7.5,11 0 0 1 0,-22',
  P: 'm0,22v-22h8q6,0 6,6q0,6 -6,6h-8',
  R: 'm0,22v-22h8q6,0 6,6q0,6 -6,6h-8m7,0l8,10',
  S: 'm14,3.5q-2,-3.5 -6.5,-3.5q-6.5,0 -6.5,5.5q0,5.5 6.5,5.5q6.5,0 6.5,5.5q0,5.5 -6.5,5.5q-5.5,0 -7.5,-3.5',
  T: 'h15m-7.5,0v22',
};

// Text from its top left corner at (x, y), one letter every `advance` units. Spaces just advance.
export function lettering(text, x, y, advance = 22) {
  let d = '';
  [...text].forEach((c, i) => { if (GLYPHS[c]) d += `M${x + i * advance},${y}${GLYPHS[c]}`; });
  return d;
}

export const letteringWidth = (text, advance = 22) => (text.length - 1) * advance + 15;
