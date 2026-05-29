import assert from 'node:assert';
import {
  createLodBandFrame,
  createLodEngine,
  createLodMultiObserverFrame,
  createLodTransitionFrame,
  lodItem,
  lodLevel,
  lodProfile,
  setLodItemPositionPatch
} from '../dist/index.js';

const args = parseArgs(process.argv.slice(2));
const cases = readPositiveInt(args.cases, 300);
let seed = readPositiveInt(args.seed, 0x10d);

for (let i = 0; i < cases; i++) {
  const levelCount = randInt(2, 5);
  const profile = makeProfile(levelCount);
  const itemCount = randInt(1, 256);
  const items = new Array(itemCount);
  for (let j = 0; j < itemCount; j++) {
    items[j] = lodItem('i' + j, randRange(-500, 500), randRange(-500, 500), {
      profile: profile.id,
      radius: randRange(0.1, 10),
      priority: randRange(0.1, 5),
      weight: randRange(0.1, 4),
      enabled: chance(0.96)
    });
  }
  const engine = createLodEngine({ profiles: [profile], items });
  const transitionEngine = createLodEngine({ profiles: [profile], items });
  const multiEngine = createLodEngine({ profiles: [profile], items });
  const frame = engine.evaluate({
    x: randRange(-50, 50),
    y: randRange(-50, 50),
    z: randRange(-10, 10),
    viewportHeight: 720,
    fovY: Math.PI / 3
  }, {
    includeHidden: true,
    budget: chance(0.5) ? { maxRenderCost: itemCount * 2, maxComputeCost: itemCount * 2 } : undefined,
    hysteresisRatio: chance(0.5) ? 0.1 : 0
  });
  assert.strictEqual(frame.itemIndexes.length, itemCount);
  assert.strictEqual(frame.ids.length, frame.itemIndexes.length);
  assert.strictEqual(frame.levels.length, frame.itemIndexes.length);
  assert.ok(frame.visibleCount <= itemCount);
  assert.ok(frame.totalRenderCost >= 0);
  assert.ok(frame.totalComputeCost >= 0);
  for (let j = 0; j < frame.itemIndexes.length; j++) {
    assert.ok(frame.itemIndexes[j] >= 0 && frame.itemIndexes[j] < itemCount);
    assert.ok(frame.levels[j] >= -1 && frame.levels[j] < levelCount);
    assert.ok(frame.distances[j] >= 0);
    assert.ok(frame.screenCoverages[j] >= 0 && frame.screenCoverages[j] <= 1);
  }

  const observer = {
    x: randRange(-50, 50),
    y: randRange(-50, 50),
    z: randRange(-10, 10)
  };
  const band = engine.evaluateBandsInto(undefined, observer);
  const transitions = transitionEngine.evaluateBandTransitionsInto(createLodTransitionFrame(itemCount), observer);
  assert.strictEqual(transitions.visibleCount, band.visibleCount);
  assert.ok(transitions.transitionCount <= itemCount);
  for (let j = 0; j < transitions.transitionCount; j++) {
    assert.ok(transitions.indexes[j] >= 0 && transitions.indexes[j] < itemCount);
    assert.ok(transitions.levels[j] >= -1 && transitions.levels[j] < levelCount);
    assert.ok(transitions.previousLevels[j] >= -1 && transitions.previousLevels[j] < levelCount);
    assert.ok(transitions.visible[j] === 0 || transitions.visible[j] === 1);
    assert.ok(transitions.previousVisible[j] === 0 || transitions.previousVisible[j] === 1);
  }
  assert.strictEqual(transitionEngine.evaluateBandTransitionsInto(transitions, observer).transitionCount, 0);

  const observers = new Array(randInt(1, 4));
  for (let j = 0; j < observers.length; j++) {
    observers[j] = {
      x: randRange(-100, 100),
      y: randRange(-100, 100),
      z: randRange(-10, 10),
      qualityBias: randRange(0.5, 2)
    };
  }
  const multi = multiEngine.evaluateMultiObserverInto(createLodMultiObserverFrame(itemCount), observers);
  const naive = naiveMultiObserver({ profiles: [profile], items }, observers, itemCount);
  assert.strictEqual(multi.visibleCount, naive.visibleCount);
  for (let j = 0; j < itemCount; j++) {
    assert.strictEqual(multi.levels[j], naive.levels[j]);
    assert.strictEqual(multi.visible[j], naive.visible[j]);
    assert.ok(multi.observerIndexes[j] >= -1 && multi.observerIndexes[j] < observers.length);
  }

  const patchIndex = randInt(0, itemCount - 1);
  const nextX = randRange(-100, 100);
  engine.commit(setLodItemPositionPatch(patchIndex, nextX, randRange(-100, 100), randRange(-10, 10)));
  assert.strictEqual(engine.snapshot().items[patchIndex].x, nextX);
}

console.log(`frontier lod fuzz passed: cases=${cases}`);

function makeProfile(levelCount) {
  const levels = [];
  let distance = 20;
  for (let i = 0; i < levelCount - 1; i++) {
    levels.push(lodLevel('l' + i, {
      maxDistance: distance,
      minScreenCoverage: 1 / (i + 2),
      renderCost: Math.max(0, levelCount - i),
      computeCost: Math.max(0, levelCount - i),
      updateIntervalMs: i * 100,
      lane: i === 0 ? 'near' : 'lod'
    }));
    distance *= 2.5;
  }
  levels.push(lodLevel('hidden', { visible: false, renderCost: 0, computeCost: 0, updateIntervalMs: -1 }));
  return lodProfile('p' + randInt(0, 100000), levels, { mode: pick(['distance', 'screen', 'priority']) });
}

function naiveMultiObserver(snapshot, observers, itemCount) {
  const levels = new Int16Array(itemCount);
  const visible = new Uint8Array(itemCount);
  const observerIndexes = new Int32Array(itemCount);
  levels.fill(-1);
  observerIndexes.fill(-1);
  let visibleCount = 0;
  for (let observerIndex = 0; observerIndex < observers.length; observerIndex++) {
    const engine = createLodEngine(snapshot);
    const frame = engine.evaluateBandsInto(createLodBandFrame(itemCount), observers[observerIndex]);
    for (let itemIndex = 0; itemIndex < itemCount; itemIndex++) {
      const nextLevel = frame.levels[itemIndex];
      if (nextLevel === -1) continue;
      const nextVisible = frame.visible[itemIndex];
      const previousVisible = visible[itemIndex];
      if (levels[itemIndex] === -1 || nextLevel < levels[itemIndex]) {
        if (previousVisible === 0 && nextVisible !== 0) visibleCount++;
        else if (previousVisible !== 0 && nextVisible === 0) visibleCount--;
        levels[itemIndex] = nextLevel;
        visible[itemIndex] = nextVisible;
        observerIndexes[itemIndex] = observerIndex;
      }
    }
  }
  return { levels, visible, observerIndexes, visibleCount };
}

function rand() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0x100000000;
}

function randInt(min, max) {
  return min + Math.floor(rand() * (max - min + 1));
}

function randRange(min, max) {
  return min + rand() * (max - min);
}

function chance(probability) {
  return rand() < probability;
}

function pick(values) {
  return values[randInt(0, values.length - 1)];
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--cases') out.cases = argv[++i];
    else if (arg === '--seed') out.seed = argv[++i];
  }
  return out;
}

function readPositiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}
