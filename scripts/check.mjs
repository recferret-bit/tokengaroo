#!/usr/bin/env node
// Visual QA harness for the region backgrounds. Zero dependencies: Node >= 22 and a local Chrome.
//
//   node check.mjs                                     # every variant of ../template/generate.mjs
//   node check.mjs --gen ./generate.mjs --out ./qa --only australia
//
// Four checks per variant (region x style x format):
//   1. grounding  sky visible below the horizon; a landmark with sky under its base (it floats)
//   2. landmark   the hero landmark covered by later layers, or cropped on the target screen shapes
//   3. motion     loops that jump or flash at their seam while on canvas; a reduced-motion still
//                 with elements cut by the canvas edge, piled up on one spot, or frozen mid-effect
//   4. support    things that stand (data-rests="ground|water") standing on the wrong surface
//                 (data-surface="ground|water") or on nothing; a strip of ground floating in the
//                 water, parallel to the banks (a "causeway"). Skipped when nothing is tagged.
//
// Writes <out>/report.md (start here), report.json, svg/<variant>.svg, img/<variant>.still.png
// (a mid-animation frame to look at) and img/<variant>.<check>.png evidence for every failing check.
// Exit code: 0 everything passes, 1 findings, 2 harness error.
//
// Options: --gen <path> (default ../template/generate.mjs), --out <dir> (default ./qa),
//          --only <substring of variant name>, --seed <n> (default 7), --still <ms> (default 10000).
// Chrome is found at the usual macOS/Linux paths; override with CHROME_PATH.

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const args = {};
process.argv.slice(2).forEach((a, i, all) => {
  if (a.startsWith('--')) args[a.slice(2)] = all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true;
});
const GEN = resolve(typeof args.gen === 'string' ? args.gen : join(dirname(fileURLToPath(import.meta.url)), '..', 'template', 'generate.mjs'));
const OUT = resolve(typeof args.out === 'string' ? args.out : 'qa');
const SEED = Number(args.seed ?? 7);
const STILL_MS = Number(args.still ?? 10000);

const LIMITS = {
  skyLeakRows: 2,             // rows of sky tolerated directly under the horizon (antialiasing)
  floatColumns: 0.02,         // share of landmark columns allowed to have sky right under their base
  landmarkVisible: 0.85,      // share of the landmark that must stay visible (not covered, not cropped)
  popPx: 4,                   // movement across a loop seam that counts as a visible jump
  popOpacity: 0.3,            // opacity change across a loop seam that counts as a flash
  transientMeanOpacity: 0.35, // visible less than this on average while animated = a transient effect
  edgeCut: 0.1,               // at least this share inside AND outside the canvas = cut by the edge
  travel: 0.5,                // moves more than this share of W per cycle = a travelling element
  windowMs: 60000,            // timeline span searched for loop seams
  footBand: 6,                // px above an element's lowest pixel that still count as its footprint
  supportShare: 0.25,         // share of a footprint allowed over the wrong surface (or over sky)
  causewayWidth: 0.5,         // share of the width a ground strip with water above and below may span
};

// Screen shapes each format must survive under preserveAspectRatio="xMidYMid slice" (width / height).
const SCREENS = {
  desktop: { min: 16 / 10, max: 21 / 9 },
  mobile: { min: 9 / 20, max: 9 / 16 },
};

const HINTS = {
  'contract': 'The SVG breaks the contract with this harness (see the header of generate.mjs): layers wrapped in <g data-layer>, data-horizon and data-landmark on the root <svg>, the sky rect tagged data-layer="sky".',
  'sky-leak': 'Sky shows through below the horizon, so the band reads as water or a gap and whatever stands on the horizon floats. Add a ground or water layer that starts exactly at HORIZON, spans the full width (x from -10 to W+10) and is drawn before the landmark layers.',
  'floating': 'The landmark has sky directly under its base, so it hovers. Extend its base to HORIZON + 4, or put a ground layer and a contact shadow under it.',
  'covered': 'Later layers paint over the landmark. Move or shrink the culprit layer for this format (branch on ctx.m), push it toward the canvas edge, or move the landmark.',
  'cropped': 'Part of the landmark falls outside the area every target screen shows (dashed box in the evidence image). Pull it toward the centre or narrow it for this format.',
  'seam': 'The element jumps or flashes when its loop restarts while it is on canvas. Make the 0% and 100% keyframes identical, or start and end the loop fully off canvas (allow for the element\'s own width and this format\'s W).',
  'reduced-runs': 'Animations still run under prefers-reduced-motion: reduce. Keep `@media (prefers-reduced-motion: reduce) { * { animation: none !important } }` as the last rule in <style>.',
  'rest-cut': 'With reduced motion the element rests cut by the canvas edge (its path starts at x = 0 and the animation is what moves it). Give the animated element an on-canvas transform attribute as its rest pose; a running CSS animation overrides the attribute, so normal motion is unchanged.',
  'rest-pileup': 'With reduced motion several copies rest on the same spot. Give each copy its own transform attribute as a rest pose, spread across the canvas.',
  'frozen-transient': 'The element is only briefly visible while animated (a puff, flash, sparkle) but sits fully opaque in the reduced-motion still. Hide it in a reduced-motion block (opacity: 0).',
  'wrong-support': 'The element stands on the wrong kind of surface: a building, tree or land vehicle with water under its base (it stands in the river or pool), or a boat on land. Give it land: a bank or embankment (data-surface="ground") under its base, drawn after the water; or move it onto existing ground, or move or narrow the water for this format. If it really stands in water (a pier, a stilt house), tag it data-rests="water".',
  'unsupported': 'Only sky is under the element\'s base, so it floats. Extend its base down onto the surface (HORIZON + 4 for things on the horizon), or put ground under it.',
  'causeway': 'A strip of ground has water directly above and below it across most of the width, so it reads as a road or bank floating in the river, running along it. Make it a real bank: run it down to the bottom edge (the near bank) or up to the horizon (the far bank). A bridge should cross the water into the distance, not run along it.',
};

const EVIDENCE = {
  grounding: 'sky painted magenta, landmark cyan, red box = problem area',
  landmark: 'landmark painted cyan, red boxes = what covers it, dashed box = area every target screen shows',
  motion: 'real frame (seams: just after the jump; rest: reduced-motion still), red box = the element',
  support: 'surface map: ground green, water blue, sky magenta, everything else hidden; red box = the footprint or the floating strip',
};

// --- chrome over the devtools protocol --------------------------------------

function findChrome() {
  return [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].find((c) => c && existsSync(c));
}

async function launchChrome() {
  const bin = findChrome();
  if (!bin) throw new Error('Chrome not found; set CHROME_PATH');
  const profile = mkdtempSync(join(tmpdir(), 'bg-qa-'));
  const proc = spawn(bin, [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars', 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise((res, rej) => {
    let log = '';
    const timer = setTimeout(() => rej(new Error(`Chrome did not start:\n${log}`)), 20000);
    proc.stderr.on('data', (d) => {
      log += d;
      const m = log.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) { clearTimeout(timer); res(m[1]); }
    });
    proc.on('exit', (code) => { clearTimeout(timer); rej(new Error(`Chrome exited (${code}):\n${log}`)); });
  });
  return {
    wsUrl,
    close() {
      proc.kill();
      try { rmSync(profile, { recursive: true, force: true }); } catch { /* chrome may still hold files */ }
    },
  };
}

async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('cannot connect to Chrome')); });
  let seq = 0;
  const pending = new Map();
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    const p = pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id);
    msg.error ? p.rej(new Error(`${p.method}: ${msg.error.message}`)) : p.res(msg.result);
  };
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
    const id = ++seq;
    pending.set(id, { res, rej, method });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
  return { send, close: () => ws.close() };
}

// --- in-page library ------------------------------------------------------
// Serialised with toString() and evaluated in the page, so it must not use anything from this module.

function pageLib(LIM) {
  const SVGNS = 'http://www.w3.org/2000/svg';
  const SKY = [255, 0, 255], MARK = [0, 255, 255];
  const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  const pct = (x) => `${Math.round(x * 100)}%`;
  const round = (b) => `x ${Math.round(b.x0)}–${Math.round(b.x1)}, y ${Math.round(b.y0)}–${Math.round(b.y1)}`;

  function parse(svgText) {
    const root = new DOMParser().parseFromString(svgText, 'image/svg+xml').documentElement;
    if (root.nodeName !== 'svg') throw new Error('not an SVG document: ' + root.textContent.slice(0, 200));
    const [, , w, h] = root.getAttribute('viewBox').trim().split(/[\s,]+/).map(Number);
    const layers = [...root.children].filter((el) => el.hasAttribute('data-layer')).map((el) => el.getAttribute('data-layer'));
    return { root, w, h, horizon: Number(root.getAttribute('data-horizon') ?? NaN), landmark: root.getAttribute('data-landmark') || null, layers };
  }

  // --- static rasters (checks 1 and 2) ---

  async function raster(m, css = '', mutate = null) {
    const root = m.root.cloneNode(true);
    if (mutate) mutate(root);
    root.setAttribute('width', m.w);
    root.setAttribute('height', m.h);
    const style = document.createElementNS(SVGNS, 'style');
    style.textContent = `* { animation: none !important; transition: none !important } ${css}`;
    root.appendChild(style);
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(root));
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = m.w;
    canvas.height = m.h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, m.w, m.h);
    return { canvas, ctx, px: ctx.getImageData(0, 0, m.w, m.h).data };
  }
  const near = (px, i, c) => px[i + 3] > 200 && Math.abs(px[i] - c[0]) < 40 && Math.abs(px[i + 1] - c[1]) < 40 && Math.abs(px[i + 2] - c[2]) < 40;
  const at = (m, x, y) => (y * m.w + x) * 4;
  const box = () => ({ x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity, n: 0 });
  const grow = (b, x, y) => { b.n++; b.x0 = Math.min(b.x0, x); b.y0 = Math.min(b.y0, y); b.x1 = Math.max(b.x1, x); b.y1 = Math.max(b.y1, y); };
  const done = (b) => (b.n ? { x0: b.x0, y0: b.y0, x1: b.x1 + 1, y1: b.y1 + 1 } : null);
  const markCss = (layer) => `[data-layer="${layer}"], [data-layer="${layer}"] * { fill: ${hex(MARK)} !important; stroke: ${hex(MARK)} !important; opacity: 1 !important }`;

  function annotate(r, boxes, dashed = []) {
    const { canvas, ctx } = r;
    ctx.lineWidth = 4;
    for (const b of boxes) {
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,45,45,.15)';
      ctx.strokeStyle = '#ff2d2d';
      ctx.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
      ctx.strokeRect(b.x0 - 2, b.y0 - 2, b.x1 - b.x0 + 4, b.y1 - b.y0 + 4);
    }
    for (const b of dashed) {
      ctx.setLineDash([16, 10]);
      ctx.strokeStyle = '#111';
      ctx.strokeRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
    }
    return canvas.toDataURL('image/png');
  }

  // 1. grounding
  async function grounding(svgText) {
    const m = parse(svgText);
    const size = { w: m.w, h: m.h };
    if (!Number.isFinite(m.horizon)) return { size, findings: [{ kind: 'contract', message: 'root <svg> has no data-horizon; grounding not checked' }] };
    const r = await raster(m, `[data-layer="sky"] { fill: ${hex(SKY)} !important }` + (m.landmark ? markCss(m.landmark) : ''));
    const findings = [], boxes = [];

    const leak = box();
    for (let y = Math.min(m.h, m.horizon + LIM.skyLeakRows); y < m.h; y++) {
      for (let x = 0; x < m.w; x++) if (near(r.px, at(m, x, y), SKY)) grow(leak, x, y);
    }
    if (leak.n) {
      const b = done(leak);
      boxes.push(b);
      findings.push({ kind: 'sky-leak', message: `sky visible below the horizon (y = ${m.horizon}): ${leak.n} px in ${round(b)}`, box: b });
    }

    let cols = 0;
    const fl = box();
    if (m.landmark) {
      for (let x = 0; x < m.w; x++) {
        let low = -1;
        for (let y = m.h - 1; y >= 0; y--) if (near(r.px, at(m, x, y), MARK)) { low = y; break; }
        if (low < 0) continue;
        cols++;
        if (near(r.px, at(m, x, Math.min(m.h - 1, low + 3)), SKY)) grow(fl, x, low);
      }
      if (!cols) findings.push({ kind: 'contract', message: `landmark layer "${m.landmark}" paints nothing` });
      else if (fl.n / cols > LIM.floatColumns) {
        const b = done(fl);
        b.y1 += 8;
        boxes.push(b);
        findings.push({ kind: 'floating', message: `landmark "${m.landmark}" has sky under its base in ${pct(fl.n / cols)} of its columns (${round(b)})`, box: b });
      }
    }
    return { size, findings, metrics: { skyLeakPx: leak.n, floatingShare: cols ? fl.n / cols : 0 }, image: findings.length ? annotate(r, boxes) : null };
  }

  // 2. landmark visibility
  async function landmark(svgText, screens) {
    const m = parse(svgText);
    if (!m.landmark) return { findings: [{ kind: 'contract', message: 'root <svg> has no data-landmark; landmark not checked' }] };
    const index = m.layers.indexOf(m.landmark);
    if (index < 0) return { findings: [{ kind: 'contract', message: `no layer named "${m.landmark}"` }] };

    const ratio = m.w / m.h;
    const wf = Math.min(1, screens.min / ratio), hf = Math.min(1, ratio / screens.max);
    const safe = { x0: Math.round((m.w * (1 - wf)) / 2), y0: Math.round((m.h * (1 - hf)) / 2), x1: Math.round((m.w * (1 + wf)) / 2), y1: Math.round((m.h * (1 + hf)) / 2) };
    const all = { x0: 0, y0: 0, x1: m.w, y1: m.h };
    const count = (px, b = all) => {
      let n = 0;
      for (let y = b.y0; y < b.y1; y++) for (let x = b.x0; x < b.x1; x++) if (near(px, at(m, x, y), MARK)) n++;
      return n;
    };

    const alone = await raster(m, markCss(m.landmark) + `:root > :not([data-layer="${m.landmark}"]):not(defs):not(style) { display: none !important }`);
    const total = count(alone.px);
    if (!total) return { findings: [{ kind: 'contract', message: `landmark layer "${m.landmark}" paints nothing` }] };
    const comp = await raster(m, markCss(m.landmark));
    // antialiased edges count slightly differently over a background than alone, so clamp to [0, 1]
    const clamp = (x) => Math.min(1, Math.max(0, x));
    const covered = clamp(1 - count(comp.px) / total);
    const cropped = clamp(1 - count(alone.px, safe) / total);
    const visible = clamp(count(comp.px, safe) / total);

    const culprits = [];
    for (const layer of m.layers.slice(index + 1)) {
      const r = await raster(m, markCss(m.landmark) + `[data-layer="${layer}"] { display: none !important }`);
      const b = box();
      for (let y = 0; y < m.h; y++) {
        for (let x = 0; x < m.w; x++) { const i = at(m, x, y); if (near(r.px, i, MARK) && !near(comp.px, i, MARK)) grow(b, x, y); }
      }
      if (b.n / total > 0.01) culprits.push({ layer, share: b.n / total, box: done(b) });
    }
    culprits.sort((a, b) => b.share - a.share);

    const findings = [];
    if (visible < LIM.landmarkVisible) {
      const head = `landmark "${m.landmark}" is ${pct(visible)} visible (needs ${pct(LIM.landmarkVisible)})`;
      if (covered > 0.02) findings.push({ kind: 'covered', message: `${head}; ${pct(covered)} covered by ${culprits.map((c) => `${c.layer} ${pct(c.share)}`).join(', ') || 'overlapping layers'}`, culprits: culprits.map(({ layer, share }) => ({ layer, share })) });
      if (cropped > 0.02) findings.push({ kind: 'cropped', message: `${head}; ${pct(cropped)} lies outside the area every ${screens.label} screen shows (${round(safe)})`, safe });
      if (!findings.length) findings.push({ kind: 'covered', message: `${head}; covered ${pct(covered)} and cropped ${pct(cropped)} combined` });
    }
    return {
      findings,
      metrics: { visible, covered, cropped, safe, culprits: culprits.map(({ layer, share }) => ({ layer, share })) },
      image: findings.length ? annotate(comp, culprits.map((c) => c.box), [safe]) : null,
    };
  }

  // 4. support
  // Surfaces are tagged data-surface="ground|water"; things that stand, data-rests="ground|water".
  // The surface map paints every tagged surface in its own colour (draw order kept, so a bank drawn
  // over the water wins) and hides everything else. An element's footprint is its lowest pixels
  // (within footBand of its very lowest, so a tree is judged by its trunk, not its overhanging crown);
  // the surface 3 px under the footprint is what it stands on.
  const GROUND = [0, 255, 0], WATER = [0, 0, 255];
  const HIDE = '[data-layer], [data-layer] * { visibility: hidden !important }';
  async function support(svgText) {
    const m = parse(svgText);
    if (!m.root.querySelector('[data-surface]')) return { skip: 'no data-surface tags in this SVG', findings: [] };
    const surf = await raster(m, HIDE
      + `[data-layer="sky"] { visibility: visible !important; fill: ${hex(SKY)} !important }`
      + '[data-surface], [data-surface] * { visibility: visible !important; opacity: 1 !important }'
      + `[data-surface="ground"], [data-surface="ground"] * { fill: ${hex(GROUND)} !important; stroke: ${hex(GROUND)} !important }`
      + `[data-surface="water"], [data-surface="water"] * { fill: ${hex(WATER)} !important; stroke: ${hex(WATER)} !important }`
      + '[data-surface] [fill="none"] { fill: none !important }');
    const kindAt = (x, y) => {
      if (x < 0 || y < 0 || x >= m.w || y >= m.h) return 'edge';
      const i = at(m, x, y);
      return near(surf.px, i, GROUND) ? 'ground' : near(surf.px, i, WATER) ? 'water' : near(surf.px, i, SKY) ? 'sky' : 'none';
    };
    const findings = [], boxes = [];

    // where every standing element is at rest
    const resters = [...m.root.querySelectorAll('[data-rests]')];
    const probe = document.importNode(m.root, true);
    probe.setAttribute('width', m.w);
    probe.setAttribute('height', m.h);
    probe.style.cssText = 'position:absolute;left:0;top:0';
    const still = document.createElementNS(SVGNS, 'style');
    still.textContent = '* { animation: none !important; transition: none !important }';
    probe.appendChild(still);
    document.body.style.margin = '0';
    document.body.replaceChildren(probe);
    const rects = [...probe.querySelectorAll('[data-rests]')].map(rectOf);
    probe.remove();

    // pack elements whose columns don't overlap into one raster each
    const items = resters.map((el, i) => ({ i, el, want: el.getAttribute('data-rests'), b: rects[i], label: labelOf(el) }))
      .filter((it) => it.b.x1 > 0 && it.b.x0 < m.w && it.b.y1 > 0 && it.b.y0 < m.h)
      .sort((a, b) => a.b.x0 - b.b.x0);
    const batches = [];
    for (const it of items) {
      const bt = batches.find((bt) => bt.end + 8 < it.b.x0);
      if (bt) { bt.items.push(it); bt.end = it.b.x1; } else batches.push({ end: it.b.x1, items: [it] });
    }
    const groups = new Map();
    for (const bt of batches) {
      const r = await raster(m, HIDE
        + `[data-qa-target], [data-qa-target] * { visibility: visible !important; fill: ${hex(MARK)} !important; stroke: ${hex(MARK)} !important; opacity: 1 !important }`
        + '[data-qa-target] [fill="none"] { fill: none !important }',
        (root) => { const all = root.querySelectorAll('[data-rests]'); for (const it of bt.items) all[it.i].setAttribute('data-qa-target', ''); });
      for (const it of bt.items) {
        const low = [];
        let maxY = -1;
        for (let x = Math.max(0, Math.floor(it.b.x0) - 4); x < Math.min(m.w, Math.ceil(it.b.x1) + 4); x++) {
          let y = m.h - 1;
          while (y >= 0 && !near(r.px, at(m, x, y), MARK)) y--;
          if (y >= 0) { low.push([x, y]); maxY = Math.max(maxY, y); }
        }
        if (maxY < 0 || maxY >= m.h - 4) continue; // paints nothing, or its base runs off the bottom edge
        const feet = low.filter(([, y]) => y >= maxY - LIM.footBand);
        const n = { ground: 0, water: 0, sky: 0, none: 0, edge: 0 };
        for (const [x, y] of feet) n[kindAt(x, y + 3)]++;
        if ((n.ground + n.water + n.sky) / feet.length < 0.5) continue; // mostly on untagged things (a rock): not judged
        const wrongOn = it.want === 'water' ? 'ground' : 'water';
        const kind = n.sky / feet.length > LIM.supportShare ? 'unsupported' : n[wrongOn] / feet.length > LIM.supportShare ? 'wrong-support' : null;
        if (!kind) continue;
        const fb = box();
        for (const [x, y] of feet) { grow(fb, x, y); grow(fb, x, y + 6); }
        const key = `${kind}|${it.label}`;
        const g = groups.get(key) ?? { kind, label: it.label, want: it.want, on: kind === 'unsupported' ? 'sky' : wrongOn, items: [], share: 0 };
        g.items.push(done(fb));
        g.share = Math.max(g.share, n[g.on] / feet.length);
        groups.set(key, g);
      }
    }
    for (const g of groups.values()) {
      const b = { x0: Math.min(...g.items.map((b) => b.x0)), y0: Math.min(...g.items.map((b) => b.y0)), x1: Math.max(...g.items.map((b) => b.x1)), y1: Math.max(...g.items.map((b) => b.y1)) };
      boxes.push(...g.items.map((b) => ({ x0: b.x0 - 12, y0: b.y0 - 12, x1: b.x1 + 12, y1: b.y1 + 12 })));
      const who = `${g.items.length > 1 ? `${g.items.length} × ` : ''}${g.label}`;
      findings.push({
        kind: g.kind, box: b,
        message: g.kind === 'unsupported'
          ? `${who} has only sky under ${pct(g.share)} of its footprint (${round(b)})`
          : `${who} stands on ${g.on} in ${pct(g.share)} of its footprint but should stand on ${g.want} (${round(b)})`,
      });
    }

    // a ground strip with water right above and right below it, over much of the width
    const gap = Math.round(m.h * 0.08);
    const look = (x, from, step) => {
      for (let y = from, i = 0; y >= 0 && y < m.h && i < gap; y += step, i++) { const k = kindAt(x, y); if (k !== 'none') return k; }
      return 'none';
    };
    let cols = 0;
    const cw = box();
    for (let x = 0; x < m.w; x++) {
      for (let y = 0; y < m.h;) {
        if (kindAt(x, y) !== 'ground') { y++; continue; }
        const y0 = y;
        while (y < m.h && kindAt(x, y) === 'ground') y++;
        if (y >= m.h) break; // runs down to the bottom edge: a near bank
        if (look(x, y0 - 1, -1) === 'water' && look(x, y, 1) === 'water') { cols++; grow(cw, x, y0); grow(cw, x, y - 1); break; }
      }
    }
    if (cols / m.w > LIM.causewayWidth) {
      const b = done(cw);
      boxes.push(b);
      findings.push({ kind: 'causeway', message: `a strip of ground (${round(b)}) has water right above and below it across ${pct(cols / m.w)} of the width: it reads as land floating in the water`, box: b });
    }
    return { findings, metrics: { resters: items.length, causewayShare: cols / m.w }, image: findings.length ? annotate(surf, boxes) : null };
  }

  // --- live document (check 3) ---

  let live = null;
  function mount(svgText) {
    const m = parse(svgText);
    document.body.replaceChildren();
    document.body.style.margin = '0';
    const root = document.importNode(m.root, true);
    root.setAttribute('width', m.w);
    root.setAttribute('height', m.h);
    root.style.cssText = 'position:absolute;left:0;top:0';
    document.body.appendChild(root);
    const anims = document.getAnimations().filter((a) => a.effect?.target && root.contains(a.effect.target));
    live = { m, root, all: [...root.querySelectorAll('*')], anims };
    return live;
  }
  const rectOf = (el) => { const r = el.getBoundingClientRect(); return { x0: r.left, y0: r.top, x1: r.right, y1: r.bottom }; };
  const opacityOf = (el, root) => { let o = 1; for (let e = el; e && e !== root.parentNode; e = e.parentNode) o *= Number(getComputedStyle(e).opacity); return o; };
  // share of [a0, a1] inside [lo, hi]; a zero-length span counts as inside or outside as a whole
  const span = (a0, a1, lo, hi) => (a1 - a0 < 1 ? (a0 >= lo && a0 <= hi ? 1 : 0) : Math.max(0, Math.min(hi, a1) - Math.max(lo, a0)) / (a1 - a0));
  const inside = (b, m) => span(b.x0, b.x1, 0, m.w) * span(b.y0, b.y1, 0, m.h);
  const labelOf = (el) => {
    const cls = el.getAttribute('class');
    return `${el.closest('[data-layer]')?.getAttribute('data-layer') ?? '?'} › ${el.tagName.toLowerCase()}${cls ? '.' + cls.trim().split(/\s+/).join('.') : ''}`;
  };

  // 3a. loop seams, plus per-element stats the reduced-motion pass needs
  function motion(svgText) {
    const { m, root, all, anims } = mount(svgText);
    anims.forEach((a) => a.pause());
    const setT = (t) => { for (const a of anims) a.currentTime = t; };
    const findings = [], stats = [];
    for (const a of anims) {
      const el = a.effect.target, timing = a.effect.getComputedTiming();
      const name = a.animationName || a.id || 'animation';
      const dur = Number(timing.duration), delay = Number(timing.delay) || 0;
      if (!(dur > 0)) continue;
      const base = delay + Math.max(0, Math.ceil(-delay / dur)) * dur; // first iteration start at t >= 0

      let opacity = 0, xMin = Infinity, xMax = -Infinity;
      for (let s = 0; s < 24; s++) {
        setT(base + (s / 24) * dur);
        opacity += opacityOf(el, root);
        const r = rectOf(el), cx = (r.x0 + r.x1) / 2;
        xMin = Math.min(xMin, cx);
        xMax = Math.max(xMax, cx);
      }
      stats.push({ index: all.indexOf(el), label: labelOf(el), name, meanOpacity: opacity / 24, travel: (xMax - xMin) / m.w });

      if (String(timing.direction).includes('alternate')) continue;
      for (let t = base; t <= Math.max(LIM.windowMs, 2 * dur); t += dur) {
        if (t < 2) continue;
        setT(t - 1);
        const r0 = rectOf(el), o0 = opacityOf(el, root);
        setT(t + 1);
        const r1 = rectOf(el), o1 = opacityOf(el, root);
        const seen0 = o0 > 0.05 && inside(r0, m) > 0, seen1 = o1 > 0.05 && inside(r1, m) > 0;
        if (!seen0 && !seen1) continue;
        const jump = Math.hypot((r1.x0 + r1.x1 - r0.x0 - r0.x1) / 2, (r1.y0 + r1.y1 - r0.y0 - r0.y1) / 2);
        const flash = Math.abs(o1 - o0);
        if (jump > LIM.popPx || flash > LIM.popOpacity) {
          const what = jump > LIM.popPx ? `jumps ${Math.round(jump)}px` : `flashes opacity ${o0.toFixed(2)} → ${o1.toFixed(2)}`;
          findings.push({ kind: 'seam', message: `${labelOf(el)} (animation "${name}") ${what} at t = ${(t / 1000).toFixed(2)}s while on canvas`, box: seen1 ? r1 : r0, t: t + 1 });
          break;
        }
      }
    }
    return { findings, stats, animations: anims.length };
  }

  function freeze(t) { for (const a of live.anims) { a.pause(); a.currentTime = t; } }

  // 3b. reduced-motion still: run with prefers-reduced-motion: reduce emulated by the caller
  function rest(svgText, stats) {
    const { m, root, all } = mount(svgText);
    const findings = [];
    const running = document.getAnimations().filter((a) => a.effect?.target && root.contains(a.effect.target)).length;
    if (running) findings.push({ kind: 'reduced-runs', message: `${running} animations still run with prefers-reduced-motion: reduce` });

    const items = stats.map((s) => {
      const el = all[s.index];
      return el && { ...s, el, b: rectOf(el), o: opacityOf(el, root) };
    }).filter(Boolean);
    const reported = { 'rest-cut': [], 'frozen-transient': [] };
    const report = (kind, it, message) => {
      if (reported[kind].some((p) => p !== it.el && p.contains(it.el))) return; // an ancestor already says it
      reported[kind].push(it.el);
      findings.push({ kind, message, box: it.b });
    };
    for (const it of items) {
      const share = inside(it.b, m);
      // only travellers: something parked at the edge on purpose (a palm crown) is cut while animated too
      if (it.travel > LIM.travel && it.o > 0.05 && share > LIM.edgeCut && share < 1 - LIM.edgeCut) {
        report('rest-cut', it, `${it.label} rests ${pct(1 - share)} outside the canvas (${round(it.b)})`);
      }
      if (it.meanOpacity < LIM.transientMeanOpacity && it.o > 0.6 && share > 0) {
        report('frozen-transient', it, `${it.label} is visible ~${pct(it.meanOpacity)} of the time while animated but fully opaque (${it.o.toFixed(2)}) in the reduced-motion still`);
      }
    }
    const groups = {};
    for (const it of items) if (it.travel > LIM.travel && it.o > 0.05 && inside(it.b, m) > 0) (groups[it.name] ??= []).push(it);
    for (const [name, group] of Object.entries(groups)) {
      const clusters = [];
      for (const it of group) {
        const c = clusters.find((c) => Math.abs(c[0].b.x0 - it.b.x0) < 3);
        c ? c.push(it) : clusters.push([it]);
      }
      for (const c of clusters.filter((c) => c.length > 1)) {
        const b = { x0: Math.min(...c.map((i) => i.b.x0)), y0: Math.min(...c.map((i) => i.b.y0)), x1: Math.max(...c.map((i) => i.b.x1)), y1: Math.max(...c.map((i) => i.b.y1)) };
        findings.push({ kind: 'rest-pileup', message: `${c.length} × ${c[0].label} (animation "${name}") all rest at x ≈ ${Math.round(c[0].b.x0)} in the reduced-motion still`, box: b });
      }
    }
    return { findings };
  }

  function overlay(boxes) {
    clearOverlay();
    for (const b of boxes) {
      const d = document.createElement('div');
      d.className = '__qa_box';
      d.style.cssText = `position:absolute;left:${b.x0 - 3}px;top:${b.y0 - 3}px;width:${b.x1 - b.x0}px;height:${b.y1 - b.y0}px;border:4px solid #ff2d2d;background:rgba(255,45,45,.12);pointer-events:none`;
      document.body.appendChild(d);
    }
  }
  function clearOverlay() { document.querySelectorAll('.__qa_box').forEach((d) => d.remove()); }

  return { grounding, landmark, support, motion, freeze, rest, overlay, clearOverlay };
}

// --- driver -----------------------------------------------------------------

async function checkVariant(v, svg, page, call) {
  const shot = async (file) => {
    const { data } = await page('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: size.w, height: size.h, scale: 1 } });
    writeFileSync(join(OUT, 'img', file), Buffer.from(data, 'base64'));
    return `img/${file}`;
  };
  const save = (dataUrl, file) => {
    writeFileSync(join(OUT, 'img', file), Buffer.from(dataUrl.split(',')[1], 'base64'));
    return `img/${file}`;
  };

  const grounding = await call('grounding', svg);
  const size = grounding.size;
  const screens = { ...(SCREENS[v.format] ?? { min: size.w / size.h, max: size.w / size.h }), label: v.format };
  const landmark = await call('landmark', svg, screens);
  if (grounding.image) grounding.evidence = save(grounding.image, `${v.name}.grounding.png`);
  if (landmark.image) landmark.evidence = save(landmark.image, `${v.name}.landmark.png`);
  const support = await call('support', svg);
  if (support.image) support.evidence = save(support.image, `${v.name}.support.png`);

  await page('Emulation.setDeviceMetricsOverride', { width: size.w, height: size.h, deviceScaleFactor: 1, mobile: false });
  await page('Emulation.setEmulatedMedia', { media: '', features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  const motion = await call('motion', svg);
  const evidence = [];
  for (const [i, f] of motion.findings.slice(0, 3).entries()) {
    await call('freeze', f.t);
    await call('overlay', [f.box]);
    evidence.push(await shot(`${v.name}.motion-seam-${i + 1}.png`));
  }
  await call('clearOverlay');
  await call('freeze', STILL_MS);
  const still = await shot(`${v.name}.still.png`);

  await page('Emulation.setEmulatedMedia', { media: '', features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const rest = await call('rest', svg, motion.stats);
  if (rest.findings.length) {
    await call('overlay', rest.findings.filter((f) => f.box).map((f) => f.box));
    evidence.push(await shot(`${v.name}.motion-rest.png`));
    await call('clearOverlay');
  }
  await page('Emulation.setEmulatedMedia', { media: '', features: [] });

  const finish = (r) => {
    if (r.skip) return { status: 'skip', note: r.skip, findings: [], metrics: {}, evidence: [] };
    const findings = r.findings.map(({ kind, message }) => ({ kind, message, hint: HINTS[kind] }));
    return { status: findings.length ? 'fail' : 'pass', findings, metrics: r.metrics ?? {}, evidence: r.evidence ? [r.evidence] : [] };
  };
  return {
    ...v,
    still,
    checks: {
      grounding: finish(grounding),
      landmark: finish(landmark),
      motion: { ...finish({ findings: [...motion.findings, ...rest.findings] }), metrics: { animations: motion.animations }, evidence },
      support: finish(support),
    },
  };
}

const pct = (x) => `${Math.round(x * 100)}%`;

function reportMd(results) {
  const failing = results.filter((r) => Object.values(r.checks).some((c) => c.status === 'fail'));
  const cell = (c, extra = '') => (c.status === 'skip' ? '⚪ skipped' : `${c.status === 'pass' ? '✅' : `❌ ${c.findings.length}`}${extra}`);
  const rows = results.map((r) => {
    const lm = r.checks.landmark.metrics.visible;
    return `| ${r.name} | ${cell(r.checks.grounding)} | ${cell(r.checks.landmark, lm === undefined ? '' : ` · ${pct(lm)} visible`)} | ${cell(r.checks.motion, ` · ${r.checks.motion.metrics.animations} anims`)} | ${cell(r.checks.support)} | [still](${r.still}) |`;
  });
  const details = failing.map((r) => {
    const parts = Object.entries(r.checks).filter(([, c]) => c.status === 'fail').map(([name, c]) => [
      `### ${name}`,
      ...c.findings.map((f) => `- **${f.kind}**: ${f.message}\n  - Fix: ${f.hint}`),
      ...c.evidence.map((e) => `- Evidence: [${e}](${e}) (${EVIDENCE[name]})`),
    ].join('\n'));
    return [`## ${r.name}`, `Look at [the still](${r.still}) and the evidence images before changing code.`, ...parts].join('\n\n');
  });
  return [
    `# Background QA: ${failing.length ? `${failing.length} of ${results.length} variants have findings` : `all ${results.length} variants pass`}`,
    '',
    `Generator \`${GEN}\` · seed ${SEED} · ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
    '',
    '| variant | 1 grounding | 2 landmark | 3 motion | 4 support | frame |',
    '|---|---|---|---|---|---|',
    ...rows,
    '',
    ...details,
    '',
    '---',
    'These checks catch geometry and timing artifacts only. They cannot tell whether a shape reads as the right thing',
    '(straight dashes read as water, blobs as nothing). Always look at a desktop and a mobile still yourself.',
    '',
  ].join('\n');
}

async function main() {
  const gen = await import(pathToFileURL(GEN).href);
  if (typeof gen.render !== 'function' || typeof gen.variants !== 'function') throw new Error(`${GEN} must export render() and variants()`);
  let list = gen.variants();
  if (typeof args.only === 'string') list = list.filter((v) => v.name.includes(args.only));
  if (!list.length) throw new Error(`no variant matches --only ${args.only}`);

  rmSync(OUT, { recursive: true, force: true });
  for (const d of ['svg', 'img']) mkdirSync(join(OUT, d), { recursive: true });

  const chrome = await launchChrome();
  const results = [];
  try {
    const browser = await connect(chrome.wsUrl);
    const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
    const page = (method, params) => browser.send(method, params, sessionId);
    const evaluate = async (expression) => {
      const r = await page('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
      return r.result.value;
    };
    const call = (fn, ...a) => evaluate(`__qa.${fn}(${a.map((x) => JSON.stringify(x)).join(', ')})`);
    await evaluate(`window.__qa = (${pageLib.toString()})(${JSON.stringify(LIMITS)}); true`);

    for (const v of list) {
      const svg = gen.render(v.region, v.style, v.format, SEED);
      writeFileSync(join(OUT, 'svg', `${v.name}.svg`), svg);
      const r = await checkVariant(v, svg, page, call);
      results.push(r);
      const line = Object.entries(r.checks).map(([k, c]) => `${k} ${c.status === 'fail' ? `FAIL(${c.findings.length})` : c.status === 'skip' ? 'skip' : 'ok'}`).join('  ');
      console.error(`${v.name.padEnd(28)} ${line}`);
    }
    browser.close();
  } finally {
    chrome.close();
  }

  writeFileSync(join(OUT, 'report.json'), JSON.stringify({ generator: GEN, seed: SEED, limits: LIMITS, screens: SCREENS, results }, null, 2));
  writeFileSync(join(OUT, 'report.md'), reportMd(results));
  const failed = results.some((r) => Object.values(r.checks).some((c) => c.status === 'fail'));
  console.error(`\n${failed ? 'FINDINGS' : 'ALL PASS'} → ${join(OUT, 'report.md')}`);
  process.exitCode = failed ? 1 : 0;
}

main().catch((e) => { console.error(e.stack ?? e); process.exitCode = 2; });
