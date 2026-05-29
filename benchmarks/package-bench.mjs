import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import {
  createLodBandFrame,
  createLodCompactFrame,
  createLodEngine,
  createLodTransitionFrame,
  createLodWorkPlan,
  lodItem,
  lodLevel,
  lodProfile,
  materializeLodFrame,
  setLodItemPositionPatch
} from '../dist/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(__dirname, '..');
const repoRoot = path.basename(path.dirname(packageDir)) === 'packages'
  ? path.resolve(packageDir, '..', '..')
  : packageDir;
const args = parseArgs(process.argv.slice(2));
const count = readPositiveInt(args.count, 100000);
const rounds = readPositiveInt(args.rounds, 40);
const outPath = args.out ? path.resolve(repoRoot, args.out) : null;

const profile = lodProfile('agent', [
  lodLevel('full', { maxDistance: 40, renderCost: 8, computeCost: 8, updateIntervalMs: 16, lane: 'near' }),
  lodLevel('medium', { maxDistance: 140, minScreenCoverage: 0.0002, renderCost: 4, computeCost: 3, updateIntervalMs: 120, lane: 'mid' }),
  lodLevel('coarse', { maxDistance: 420, minScreenCoverage: 0.00002, renderCost: 1, computeCost: 1, updateIntervalMs: 1000, lane: 'far' }),
  lodLevel('culled', { visible: false, renderCost: 0, computeCost: 0, updateIntervalMs: -1 })
]);
const items = makeItems(count);
const engine = createLodEngine({ profiles: [profile], items });
const observer = { x: 0, y: 0, z: 0, viewportHeight: 1080, fovY: Math.PI / 3 };
let cursor = 0;
let cachedFrame = engine.evaluate(observer);
let bandFrame = createLodBandFrame(count);
let compactFrame = createLodCompactFrame(count);
let transitionFrame = createLodTransitionFrame(count);

const rows = [
  measure('evaluate-bands-distance-' + count, () => {
    bandFrame = engine.evaluateBandsInto(bandFrame, observer);
    return bandFrame.visibleCount;
  }),
  measure('evaluate-band-transitions-static-' + count, () => {
    transitionFrame = engine.evaluateBandTransitionsInto(transitionFrame, observer);
    return transitionFrame.visibleCount + transitionFrame.transitionCount;
  }),
  measure('evaluate-compact-distance-' + count, () => {
    compactFrame = engine.evaluateInto(compactFrame, observer, { mode: 'distance' });
    return compactFrame.visibleCount;
  }),
  measure('evaluate-distance-' + count, () => {
    cachedFrame = engine.evaluate(observer, { mode: 'distance' });
    return cachedFrame.visibleCount;
  }),
  measure('evaluate-screen-' + count, () => {
    cachedFrame = engine.evaluate(observer, { mode: 'screen' });
    return cachedFrame.visibleCount;
  }),
  measure('evaluate-budget-' + count, () => {
    cachedFrame = engine.evaluate(observer, {
      mode: 'priority',
      budget: {
        maxVisible: Math.floor(count * 0.55),
        maxRenderCost: Math.floor(count * 1.5),
        maxComputeCost: Math.floor(count * 1.25)
      }
    });
    return cachedFrame.totalComputeCost;
  }),
  measure('materialize-frame-' + count, () => {
    return materializeLodFrame(cachedFrame).visibleIndexes.length;
  }),
  measure('work-plan-' + count, () => {
    return createLodWorkPlan(cachedFrame, { nowMs: cursor += 1000 }).items.length;
  }),
  measure('patch-128-positions-' + count, () => {
    const patch = [];
    for (let i = 0; i < 128; i++) {
      cursor = (cursor + 97) % count;
      patch.push(...setLodItemPositionPatch(cursor, (cursor % 997) - 498, ((cursor * 17) % 997) - 498, (cursor % 31) - 15));
    }
    engine.commit(patch);
    return engine.generation;
  })
];

const report = {
  package: '@shapeshift-labs/frontier-lod',
  version: readPackageVersion(),
  generatedAt: new Date().toISOString(),
  node: process.version,
  platform: process.platform + ' ' + process.arch,
  count,
  rounds,
  rows
};

if (outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');
}

console.log(report.package + ' package benchmark');
console.log('Node ' + report.node + ' on ' + report.platform + ', items=' + count + ', rounds=' + rounds);
console.log('These are Frontier-only package measurements, not competitor comparisons.');
console.log('');
console.log(padRight('Fixture', 34) + padLeft('Median', 12) + padLeft('p95', 12));
for (const row of rows) {
  console.log(padRight(row.fixture, 34) + padLeft(formatUs(row.medianUs), 12) + padLeft(formatUs(row.p95Us), 12));
}
if (outPath) console.log('\nwrote ' + path.relative(repoRoot, outPath));

function makeItems(total) {
  const out = new Array(total);
  for (let i = 0; i < total; i++) {
    out[i] = lodItem('agent:' + i, (i % 1000) - 500, (Math.floor(i / 1000) % 1000) - 500, {
      profile: 'agent',
      z: (i % 31) - 15,
      radius: 0.5 + (i % 11) * 0.2,
      priority: 0.5 + (i % 17) / 8,
      weight: 0.5 + (i % 7) / 6
    });
  }
  return out;
}

function measure(fixture, fn) {
  const values = [];
  let sink = 0;
  for (let round = 0; round < rounds; round++) {
    const started = performance.now();
    sink += fn();
    values[values.length] = (performance.now() - started) * 1000;
  }
  if (sink === -1) console.log('sink=' + sink);
  values.sort((left, right) => left - right);
  return {
    fixture,
    medianUs: percentile(values, 0.5),
    p95Us: percentile(values, 0.95)
  };
}

function percentile(values, p) {
  return values[Math.min(values.length - 1, Math.floor((values.length - 1) * p))] ?? 0;
}

function formatUs(value) {
  if (value >= 1000) return (value / 1000).toFixed(2) + ' ms';
  return value.toFixed(2) + ' us';
}

function padRight(value, width) {
  return String(value).padEnd(width, ' ');
}

function padLeft(value, width) {
  return String(value).padStart(width, ' ');
}

function readPackageVersion() {
  return JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8')).version;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--count') out.count = argv[++i];
    else if (arg === '--rounds') out.rounds = argv[++i];
    else if (arg === '--out') out.out = argv[++i];
    else if (arg === '--help' || arg === '-h') {
      console.log('Usage: npm run bench -- [--count 100000] [--rounds 40] [--out benchmarks/results/frontier-lod-package-bench-latest.json]');
      process.exit(0);
    }
  }
  return out;
}

function readPositiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}
