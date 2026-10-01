// Uluru: steep ends, long gently undulating top, vertical erosion grooves, contact shadow.

import { HORIZON, between, f } from '../../lib/canvas.mjs';

export function uluru(ctx, cx, w, h) {
  const { s, p } = ctx;
  const b = HORIZON + 4, l = cx - w / 2, r = cx + w / 2, t = b - h;
  const d = `M${f(l)},${b} C${f(l + w * 0.03)},${f(b - h * 0.6)} ${f(l + w * 0.08)},${f(t + h * 0.05)} ${f(l + w * 0.18)},${f(t + h * 0.02)}
    C${f(l + w * 0.4)},${f(t - h * 0.05)} ${f(l + w * 0.65)},${f(t + h * 0.03)} ${f(l + w * 0.82)},${f(t + h * 0.08)}
    C${f(l + w * 0.92)},${f(t + h * 0.12)} ${f(r - w * 0.02)},${f(b - h * 0.5)} ${f(r)},${b} Z`;
  let grooves = '';
  for (let i = 0; i < 9; i++) {
    const gx = l + w * (0.12 + i * 0.09 + between(-0.02, 0.02));
    const gTop = t + h * between(0.12, 0.3), bend = between(-14, 14);
    grooves += `<path d="M${f(gx)},${f(gTop)} q${f(bend)},${f((b - gTop) * 0.5)} ${f(bend * 0.4)},${f(b - gTop - 4)}" ${s.line(p.uluruShade, 3)} opacity=".55"/>`;
  }
  // contact shadow first, so the rock covers its upper half and only the part on the ground shows
  const shadow = `<ellipse cx="${f(cx)}" cy="${b}" rx="${f(w * 0.53)}" ry="${f(h * 0.05)}" ${s.paint(p.uluruShade)} opacity=".35"/>`;
  return `<g data-rests="ground">${shadow}<path d="${d}" ${s.paint(p.uluru, { accent: true })}/>${grooves}</g>`;
}
