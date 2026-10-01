#!/usr/bin/env node
// Self-test for the QA harness: runs check.mjs over the known-bad scenes in fixtures/generate.mjs
// and fails unless every fixture produces the finding kinds it expects and every control comes out
// clean. Run it after any change to check.mjs (or to the objects the fixtures use).
//
//   node scripts/selftest.mjs        exit 0 = the harness catches everything, 1 = it missed something

import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FIXTURES } from './fixtures/generate.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const out = mkdtempSync(join(tmpdir(), 'bg-qa-selftest-'));
try {
  const run = spawnSync(process.execPath, [join(here, 'check.mjs'), '--gen', join(here, 'fixtures', 'generate.mjs'), '--out', out], { encoding: 'utf8' });
  if (run.status === 2 || run.status === null) {
    console.error(run.stderr);
    console.error('selftest: the harness itself failed (exit 2)');
    process.exit(1);
  }
  const { results } = JSON.parse(readFileSync(join(out, 'report.json'), 'utf8'));
  let missed = 0;
  for (const r of results) {
    const found = new Set(Object.values(r.checks).flatMap((c) => c.findings.map((f) => f.kind)));
    const expect = FIXTURES[r.region].expect;
    const lacking = expect.filter((k) => !found.has(k));
    const bad = expect.length ? lacking.length > 0 : found.size > 0;
    if (bad) missed++;
    const detail = expect.length
      ? `expects ${expect.join(', ')}${lacking.length ? `; MISSING ${lacking.join(', ')}` : ''}`
      : `control${found.size ? `; UNEXPECTED ${[...found].join(', ')}` : ''}`;
    console.log(`${bad ? 'FAIL' : 'ok  '}  ${r.name.padEnd(26)} ${detail}  (found: ${[...found].join(', ') || 'nothing'})`);
  }
  console.log(missed ? `\nselftest: ${missed} variant(s) not caught as expected` : `\nselftest: all ${results.length} fixture variants behave as expected`);
  process.exitCode = missed ? 1 : 0;
} finally {
  rmSync(out, { recursive: true, force: true });
}
