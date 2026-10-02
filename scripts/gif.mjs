#!/usr/bin/env node
// Converts animated SVG backgrounds into animated GIFs (both desktop and mobile).
// Zero dependencies: Node >= 22 and a local Chrome/Chromium.
//
// Usage:
//   node scripts/gif.mjs --region australia                    # converts both desktop and mobile
//   node scripts/gif.mjs --region thailand --format desktop    # desktop only
//   node scripts/gif.mjs --region thailand --format mobile     # mobile only
//   node scripts/gif.mjs examples/london-flat-desktop.svg      # convert specific SVG file
//   node scripts/gif.mjs --all --out dist/gifs                 # convert all variants
//   node scripts/gif.mjs --only dublin                         # convert matching variants
//
// Options:
//   --region <name>     Region name (default converts both desktop and mobile)
//   --format <fmt>      Format: desktop | mobile | both (default: both for regions)
//   --style <style>     Style: flat | line | all (default: flat, or all when --all)
//   --all               Convert all variants from the generator
//   --only <substr>     Filter variants by substring
//   --gen <path>        Path to generate.mjs (default: ../template/generate.mjs or ./template/generate.mjs)
//   --seed <n>          Random seed for generator (default: 7)
//   --fps <n>           Frames per second (default: 12)
//   --duration <s>      Animation duration in seconds to capture (default: 10)
//   --scale <n>         Scale factor relative to viewBox (default: 0.5 -> 800x450 desktop, 450x800 mobile)
//   --width <px>        Target width in pixels (overrides --scale, keeps aspect ratio)
//   --out <dir|file>    Output directory or file path (default: current directory or alongside input)
//   -h, --help          Show help message

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import zlib from 'node:zlib';

const here = dirname(fileURLToPath(import.meta.url));

// --- Chrome discovery & CDP connection ---------------------------------------

export function findChrome() {
  return [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].find((c) => c && existsSync(c));
}

export async function launchChrome() {
  const bin = findChrome();
  if (!bin) throw new Error('Chrome not found; set CHROME_PATH environment variable');
  const profile = mkdtempSync(join(tmpdir(), 'bg-gif-chrome-'));
  const proc = spawn(bin, [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--hide-scrollbars',
    'about:blank',
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

  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = () => rej(new Error('Cannot connect to Chrome WebSocket'));
  });

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

  const createPage = async () => {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const page = (method, params) => send(method, params, sessionId);
    return {
      page,
      async close() {
        try { await send('Target.closeTarget', { targetId }); } catch {}
      },
    };
  };

  const defaultPage = await createPage();

  return {
    page: defaultPage.page,
    createPage,
    close() {
      try { defaultPage.close(); } catch {}
      try { ws.close(); } catch {}
      proc.kill();
      try { rmSync(profile, { recursive: true, force: true }); } catch {}
    },
  };
}

// --- PNG decoding (Chrome screenshots are RGBA PNGs) -------------------------

function decodePng(buf) {
  let pos = 8;
  let width = 0, height = 0, colorType = 6;
  const idatParts = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IHDR') {
      width = buf.readUInt32BE(pos + 8);
      height = buf.readUInt32BE(pos + 12);
      colorType = buf[pos + 17];
    } else if (type === 'IDAT') {
      idatParts.push(buf.subarray(pos + 8, pos + 8 + len));
    } else if (type === 'IEND') {
      break;
    }
    pos += 12 + len;
  }
  const idat = Buffer.concat(idatParts);
  const raw = zlib.inflateSync(idat);

  let bpp = 4;
  if (colorType === 2) bpp = 3;
  else if (colorType === 6) bpp = 4;
  else if (colorType === 0) bpp = 1;
  else if (colorType === 4) bpp = 2;

  const stride = width * bpp;
  const out = new Uint8Array(width * height * 4);
  let srcPos = 0;
  let dstPos = 0;
  const prevRow = new Uint8Array(stride);
  const currRow = new Uint8Array(stride);

  function paeth(a, b, c) {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    return (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
  }

  for (let y = 0; y < height; y++) {
    const filter = raw[srcPos++];
    for (let i = 0; i < stride; i++) {
      const v = raw[srcPos++];
      const left = i >= bpp ? currRow[i - bpp] : 0;
      const up = prevRow[i];
      const upLeft = i >= bpp ? prevRow[i - bpp] : 0;
      let val = 0;
      if (filter === 0) val = v;
      else if (filter === 1) val = (v + left) & 0xff;
      else if (filter === 2) val = (v + up) & 0xff;
      else if (filter === 3) val = (v + Math.floor((left + up) / 2)) & 0xff;
      else if (filter === 4) val = (v + paeth(left, up, upLeft)) & 0xff;
      currRow[i] = val;
    }
    for (let x = 0; x < width; x++) {
      const off = x * bpp;
      if (bpp === 3) {
        out[dstPos++] = currRow[off];
        out[dstPos++] = currRow[off + 1];
        out[dstPos++] = currRow[off + 2];
        out[dstPos++] = 255;
      } else if (bpp === 4) {
        out[dstPos++] = currRow[off];
        out[dstPos++] = currRow[off + 1];
        out[dstPos++] = currRow[off + 2];
        out[dstPos++] = currRow[off + 3];
      } else if (bpp === 1) {
        const g = currRow[off];
        out[dstPos++] = g;
        out[dstPos++] = g;
        out[dstPos++] = g;
        out[dstPos++] = 255;
      } else if (bpp === 2) {
        const g = currRow[off];
        out[dstPos++] = g;
        out[dstPos++] = g;
        out[dstPos++] = g;
        out[dstPos++] = currRow[off + 1];
      }
    }
    prevRow.set(currRow);
  }
  return { width, height, data: out };
}

// --- Color quantization (median cut with pre-mapped palette cache) ------------

function quantize(pixels, width, height, maxColors = 256) {
  const colorCounts = new Map();
  const nPixels = width * height;
  for (let i = 0; i < nPixels; i++) {
    const off = i * 4;
    const r = pixels[off], g = pixels[off + 1], b = pixels[off + 2];
    const key = (r << 16) | (g << 8) | b;
    colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
  }

  const unique = Array.from(colorCounts.entries()).map(([k, count]) => ({
    r: (k >> 16) & 0xff,
    g: (k >> 8) & 0xff,
    b: k & 0xff,
    count,
  }));

  // If frame has <= 256 unique colors, no quantization loss is needed.
  if (unique.length <= maxColors) {
    const palette = unique.map((u) => [u.r, u.g, u.b]);
    while (palette.length < maxColors) palette.push([0, 0, 0]);
    const map = new Map();
    unique.forEach((u, idx) => map.set((u.r << 16) | (u.g << 8) | u.b, idx));
    const indexed = new Uint8Array(nPixels);
    for (let i = 0; i < nPixels; i++) {
      const off = i * 4;
      const key = (pixels[off] << 16) | (pixels[off + 1] << 8) | pixels[off + 2];
      indexed[i] = map.get(key);
    }
    return { palette, indexed };
  }

  // Median-cut algorithm
  const boxes = [{ colors: unique }];

  function boxRange(box) {
    let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
    for (const c of box.colors) {
      if (c.r < minR) minR = c.r; if (c.r > maxR) maxR = c.r;
      if (c.g < minG) minG = c.g; if (c.g > maxG) maxG = c.g;
      if (c.b < minB) minB = c.b; if (c.b > maxB) maxB = c.b;
    }
    const rR = maxR - minR, rG = maxG - minG, rB = maxB - minB;
    const maxRange = Math.max(rR, rG, rB);
    const axis = maxRange === rR ? 'r' : maxRange === rG ? 'g' : 'b';
    return { maxRange, axis };
  }

  while (boxes.length < maxColors) {
    let bestIdx = -1, bestRange = -1, bestAxis = 'r';
    for (let i = 0; i < boxes.length; i++) {
      if (boxes[i].colors.length <= 1) continue;
      const { maxRange, axis } = boxRange(boxes[i]);
      if (maxRange > bestRange) {
        bestRange = maxRange;
        bestIdx = i;
        bestAxis = axis;
      }
    }
    if (bestIdx === -1 || bestRange === 0) break;

    const targetBox = boxes.splice(bestIdx, 1)[0];
    targetBox.colors.sort((a, b) => a[bestAxis] - b[bestAxis]);

    let total = 0;
    for (const c of targetBox.colors) total += c.count;
    const half = total / 2;
    let acc = 0, medianIdx = 0;
    for (let i = 0; i < targetBox.colors.length; i++) {
      acc += targetBox.colors[i].count;
      if (acc >= half) {
        medianIdx = Math.max(1, i);
        break;
      }
    }

    boxes.push({ colors: targetBox.colors.slice(0, medianIdx) });
    boxes.push({ colors: targetBox.colors.slice(medianIdx) });
  }

  const palette = boxes.map((b) => {
    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    for (const c of b.colors) {
      rSum += c.r * c.count;
      gSum += c.g * c.count;
      bSum += c.b * c.count;
      count += c.count;
    }
    return [Math.round(rSum / count), Math.round(gSum / count), Math.round(bSum / count)];
  });
  while (palette.length < maxColors) palette.push([0, 0, 0]);

  // Fast mapping: pre-map only the unique colors
  const colorMap = new Map();
  for (const u of unique) {
    let bestDist = Infinity, bestIdx = 0;
    for (let i = 0; i < boxes.length; i++) {
      const pr = palette[i][0], pg = palette[i][1], pb = palette[i][2];
      const dr = u.r - pr, dg = u.g - pg, db = u.b - pb;
      const dist = dr * dr * 2 + dg * dg * 4 + db * db * 3;
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    colorMap.set((u.r << 16) | (u.g << 8) | u.b, bestIdx);
  }

  const indexed = new Uint8Array(nPixels);
  for (let i = 0; i < nPixels; i++) {
    const off = i * 4;
    const key = (pixels[off] << 16) | (pixels[off + 1] << 8) | pixels[off + 2];
    indexed[i] = colorMap.get(key);
  }

  return { palette, indexed };
}

// --- GIF89a LZW encoder & binary structure ------------------------------------

function encodeLZW(indexedPixels, colorDepth = 8) {
  const clearCode = 1 << colorDepth;
  const eoiCode = clearCode + 1;
  let nextCode = clearCode + 2;
  let codeSize = colorDepth + 1;

  const output = [];
  let curSubBlock = [];

  let accum = 0;
  let accumBits = 0;

  function writeBits(code, bits) {
    accum |= (code << accumBits);
    accumBits += bits;
    while (accumBits >= 8) {
      curSubBlock.push(accum & 0xff);
      accum >>= 8;
      accumBits -= 8;
      if (curSubBlock.length === 255) {
        output.push(255, ...curSubBlock);
        curSubBlock = [];
      }
    }
  }

  function flushBits() {
    if (accumBits > 0) {
      curSubBlock.push(accum & 0xff);
      accum = 0;
      accumBits = 0;
      if (curSubBlock.length === 255) {
        output.push(255, ...curSubBlock);
        curSubBlock = [];
      }
    }
    if (curSubBlock.length > 0) {
      output.push(curSubBlock.length, ...curSubBlock);
      curSubBlock = [];
    }
  }

  const HASH_SIZE = 9001;
  const hashKey = new Int32Array(HASH_SIZE).fill(-1);
  const hashVal = new Int32Array(HASH_SIZE);

  function resetTable() {
    hashKey.fill(-1);
    codeSize = colorDepth + 1;
    nextCode = clearCode + 2;
  }

  writeBits(clearCode, codeSize);
  resetTable();

  let prefix = indexedPixels[0];
  for (let i = 1; i < indexedPixels.length; i++) {
    const k = indexedPixels[i];
    const key = (prefix << 8) | k;
    let h = ((prefix ^ (k << 4)) % HASH_SIZE);
    if (h < 0) h += HASH_SIZE;

    let found = false;
    while (hashKey[h] !== -1) {
      if (hashKey[h] === key) {
        prefix = hashVal[h];
        found = true;
        break;
      }
      h = (h + 1) % HASH_SIZE;
    }

    if (!found) {
      writeBits(prefix, codeSize);
      if (nextCode < 4096) {
        hashKey[h] = key;
        hashVal[h] = nextCode++;
        if (nextCode > (1 << codeSize) && codeSize < 12) {
          codeSize++;
        }
      } else {
        writeBits(clearCode, codeSize);
        resetTable();
      }
      prefix = k;
    }
  }

  writeBits(prefix, codeSize);
  writeBits(eoiCode, codeSize);
  flushBits();
  output.push(0x00); // Block terminator

  return Buffer.from(output);
}

function assembleGif(width, height, frames, delayCentisec = 8) {
  const parts = [];

  // Header: GIF89a
  parts.push(Buffer.from('GIF89a', 'ascii'));

  // Logical Screen Descriptor
  const lsd = Buffer.alloc(7);
  lsd.writeUInt16LE(width, 0);
  lsd.writeUInt16LE(height, 2);
  lsd[4] = 0x70; // 8-bit color resolution, no global color table
  lsd[5] = 0;    // background color index
  lsd[6] = 0;    // pixel aspect ratio
  parts.push(lsd);

  // Netscape 2.0 Loop Extension (infinite loop)
  parts.push(Buffer.from([
    0x21, 0xff, 0x0b,
    0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2e, 0x30, // "NETSCAPE2.0"
    0x03, 0x01, 0x00, 0x00,                                           // loop count = 0 (infinite)
    0x00,
  ]));

  // Frames
  for (const frame of frames) {
    const { palette, indexed } = frame;

    // Graphic Control Extension
    // Byte 3: 0x04 = disposal method 1 (do not dispose, overwrite)
    parts.push(Buffer.from([
      0x21, 0xf9, 0x04,
      0x04,
      delayCentisec & 0xff, (delayCentisec >> 8) & 0xff,
      0x00,
      0x00,
    ]));

    // Image Descriptor
    const id = Buffer.alloc(10);
    id[0] = 0x2c; // ','
    id.writeUInt16LE(0, 1);      // Left
    id.writeUInt16LE(0, 3);      // Top
    id.writeUInt16LE(width, 5);  // Width
    id.writeUInt16LE(height, 7); // Height
    id[9] = 0x87;                // Local Color Table present, 256 colors (2^(7+1))
    parts.push(id);

    // Local Color Table (256 * 3 bytes RGB)
    const lct = Buffer.alloc(256 * 3);
    for (let i = 0; i < 256; i++) {
      const c = palette[i] || [0, 0, 0];
      lct[i * 3] = c[0];
      lct[i * 3 + 1] = c[1];
      lct[i * 3 + 2] = c[2];
    }
    parts.push(lct);

    // Image Data
    parts.push(Buffer.from([0x08])); // LZW minimum code size
    parts.push(encodeLZW(indexed, 8));
  }

  // Trailer
  parts.push(Buffer.from([0x3b])); // ';'

  return Buffer.concat(parts);
}

// --- Dimensions & SVG parsing ------------------------------------------------

function parseSvgDimensions(svg) {
  const vbMatch = svg.match(/viewBox=["']\s*([0-9.]+)[,\s]+([0-9.]+)[,\s]+([0-9.]+)[,\s]+([0-9.]+)\s*["']/i);
  if (vbMatch) {
    const w = parseFloat(vbMatch[3]);
    const h = parseFloat(vbMatch[4]);
    if (w > 0 && h > 0) return { w, h };
  }
  const wMatch = svg.match(/\bwidth=["']([0-9.]+)["']/i);
  const hMatch = svg.match(/\bheight=["']([0-9.]+)["']/i);
  if (wMatch && hMatch) {
    const w = parseFloat(wMatch[1]);
    const h = parseFloat(hMatch[1]);
    if (w > 0 && h > 0) return { w, h };
  }
  return { w: 1600, h: 900 };
}

// --- Core Conversion Routine -------------------------------------------------

export async function convertSvgToGif(svg, options = {}) {
  const {
    chrome,
    page: existingPage,
    fps = 12,
    duration = 10,
    scale: customScale,
    width: customWidth,
  } = options;

  let pageHolder = null;
  let page = existingPage;
  if (!page) {
    if (!chrome) throw new Error('convertSvgToGif requires a connected CDP page or chrome instance');
    pageHolder = await chrome.createPage();
    page = pageHolder.page;
  }

  try {
    const { w, h } = parseSvgDimensions(svg);

    let scale;
    let outW, outH;

    if (customWidth) {
      outW = Math.round(Number(customWidth));
      scale = outW / w;
      outH = Math.round(h * scale);
    } else if (customScale) {
      scale = Number(customScale);
      outW = Math.round(w * scale);
      outH = Math.round(h * scale);
    } else {
      // Default 0.5: desktop 1600x900 -> 800x450; mobile 900x1600 -> 450x800
      scale = 0.5;
      outW = Math.round(w * scale);
      outH = Math.round(h * scale);
    }

    // Ensure even dimensions
    if (outW % 2 !== 0) outW -= 1;
    if (outH % 2 !== 0) outH -= 1;

    const totalFrames = Math.max(1, Math.round(fps * duration));
    const frameStepMs = (duration * 1000) / totalFrames;
    const delayCentisec = Math.max(2, Math.round(100 / fps));

    await page('Emulation.setDeviceMetricsOverride', {
      width: Math.round(w),
      height: Math.round(h),
      deviceScaleFactor: 1,
      mobile: false,
    });

    await page('Runtime.evaluate', {
      expression: `
        document.documentElement.style.margin = '0';
        document.documentElement.style.padding = '0';
        document.documentElement.style.overflow = 'hidden';
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.overflow = 'hidden';
        document.body.innerHTML = ${JSON.stringify(svg)};
        const svgEl = document.querySelector('svg');
        if (svgEl) {
          svgEl.style.display = 'block';
          svgEl.style.width = '100vw';
          svgEl.style.height = '100vh';
        }
        document.body.offsetHeight;
        window.__anims = document.getAnimations();
        for (const a of window.__anims) a.pause();
      `,
    });

    const frames = [];

    for (let i = 0; i < totalFrames; i++) {
      const timeMs = i * frameStepMs;
      await page('Runtime.evaluate', {
        expression: `for (const a of window.__anims) a.currentTime = ${timeMs};`,
      });

      const { data } = await page('Page.captureScreenshot', {
        format: 'png',
        clip: { x: 0, y: 0, width: w, height: h, scale },
      });

      const decoded = decodePng(Buffer.from(data, 'base64'));
      const q = quantize(decoded.data, decoded.width, decoded.height);
      frames.push(q);
    }

    return assembleGif(outW, outH, frames, delayCentisec);
  } finally {
    if (pageHolder) {
      await pageHolder.close();
    }
  }
}

// --- CLI Runner --------------------------------------------------------------

function parseArgs() {
  const args = { _: [] };
  const raw = process.argv.slice(2);
  for (let i = 0; i < raw.length; i++) {
    const a = raw[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = raw[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else if (a.startsWith('-')) {
      const key = a.slice(1);
      args[key] = true;
    } else {
      args._.push(a);
    }
  }
  return args;
}

function printHelp() {
  console.log(`
tokengaroo GIF converter: convert animated SVG backgrounds into animated GIFs.

Usage:
  node scripts/gif.mjs --region <name> [options]         # converts both desktop & mobile
  node scripts/gif.mjs <file.svg...> [options]          # convert existing SVG files
  node scripts/gif.mjs --all [options]                  # convert all variants

Options:
  --region <name>     Region name (default converts both desktop and mobile)
  --format <fmt>      Format: desktop | mobile | both (default: both)
  --style <style>     Style: flat | line | all (default: flat, or all when --all)
  --all               Convert all variants from the generator
  --only <substr>     Filter variants by substring
  --gen <path>        Path to generate.mjs
  --seed <n>          Random seed for generator (default: 7)
  --fps <n>           Frames per second (default: 12)
  --duration <s>      Duration in seconds (default: 10)
  --scale <n>         Scale factor relative to viewBox (default: 0.5)
  --width <px>        Target width in pixels (overrides --scale)
  --out <dir|file>    Output directory or file path
  -h, --help          Show this help message
`);
}

export async function main() {
  const args = parseArgs();
  if (args.h || args.help) {
    printHelp();
    return;
  }

  const fps = Number(args.fps ?? 12);
  const duration = Number(args.duration ?? 10);
  const seed = Number(args.seed ?? 7);
  const scale = args.scale ? Number(args.scale) : undefined;
  const width = args.width ? Number(args.width) : undefined;

  // Resolve generator path
  const defaultGenPath = existsSync(join(here, '..', 'template', 'generate.mjs'))
    ? join(here, '..', 'template', 'generate.mjs')
    : join(process.cwd(), 'template', 'generate.mjs');
  const genPath = resolve(typeof args.gen === 'string' ? args.gen : defaultGenPath);

  // Determine tasks to execute
  const tasks = []; // { name, svg, outPath }

  if (args._.length > 0) {
    // Positional files or directories
    for (const item of args._) {
      const p = resolve(item);
      if (!existsSync(p)) {
        // Maybe it's a region name passed positionally?
        // Check if generator exists and has this region
        let isRegion = false;
        if (existsSync(genPath)) {
          try {
            const gen = await import(pathToFileURL(genPath).href);
            const vars = gen.variants();
            if (vars.some((v) => v.region === item)) {
              isRegion = true;
              args.region = item;
            }
          } catch {}
        }
        if (!isRegion) throw new Error(`File or region not found: ${item}`);
      } else {
        const stat = statSync(p);
        if (stat.isDirectory()) {
          const { readdirSync } = await import('node:fs');
          const files = readdirSync(p).filter((f) => f.endsWith('.svg'));
          for (const f of files) {
            const filePath = join(p, f);
            const svg = readFileSync(filePath, 'utf8');
            const base = basename(f, '.svg');
            const outPath = args.out ? (args.out.endsWith('.gif') ? args.out : join(args.out, `${base}.gif`)) : join(p, `${base}.gif`);
            tasks.push({ name: base, svg, outPath });
          }
        } else if (p.endsWith('.svg')) {
          const svg = readFileSync(p, 'utf8');
          const base = basename(p, '.svg');
          const outPath = args.out ? (args.out.endsWith('.gif') ? args.out : join(args.out, `${base}.gif`)) : join(dirname(p), `${base}.gif`);
          tasks.push({ name: base, svg, outPath });
        }
      }
    }
  }

  if (args.region || args.all || args.only) {
    if (!existsSync(genPath)) throw new Error(`Generator not found at ${genPath}`);
    const gen = await import(pathToFileURL(genPath).href);
    if (typeof gen.render !== 'function' || typeof gen.variants !== 'function') {
      throw new Error(`${genPath} must export render() and variants()`);
    }

    let list = gen.variants();

    if (args.all) {
      if (args.style && args.style !== 'all') list = list.filter((v) => v.style === args.style);
    } else if (args.region) {
      list = list.filter((v) => v.region === args.region);
      const style = args.style ?? 'flat';
      if (style !== 'all') list = list.filter((v) => v.style === style);
    }

    if (args.format && args.format !== 'both') {
      list = list.filter((v) => v.format === args.format);
    }

    if (args.only) {
      list = list.filter((v) => v.name.includes(args.only));
    }

    if (!list.length) throw new Error(`No matching variants found for region="${args.region}", style="${args.style}", format="${args.format}"`);

    const outDir = typeof args.out === 'string' && !args.out.endsWith('.gif') ? resolve(args.out) : resolve('dist');

    for (const v of list) {
      const svg = gen.render(v.region, v.style, v.format, seed);
      const outPath = args.out && args.out.endsWith('.gif') && list.length === 1
        ? resolve(args.out)
        : join(outDir, `${v.name}.gif`);
      tasks.push({ name: v.name, svg, outPath });
    }
  }

  if (!tasks.length) {
    printHelp();
    return;
  }

  console.log(`Converting ${tasks.length} background${tasks.length > 1 ? 's' : ''} to GIF (${fps} fps, ${duration}s loop)...`);

  const chrome = await launchChrome();

  try {
    for (const task of tasks) {
      const t0 = performance.now();
      const dir = dirname(task.outPath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

      const gifBuf = await convertSvgToGif(task.svg, {
        chrome,
        fps,
        duration,
        scale,
        width,
      });

      writeFileSync(task.outPath, gifBuf);
      const elapsed = Math.round(performance.now() - t0);
      const kb = Math.round(gifBuf.length / 1024);
      console.log(`  ✓ ${task.name} → ${task.outPath} (${kb} KB, ${elapsed} ms)`);
    }
    console.log('Done!');
  } finally {
    chrome.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  });
}
