import assert from 'node:assert';
import {
  createLodEngine,
  createLodMultiObserverFrame,
  createLodTransitionFrame,
  createLodWorkPlan,
  lodItem,
  lodLevel,
  lodProfile,
  materializeLodFrame,
  scheduleLodWork,
  setLodItemPositionPatch,
  setLodItemPriorityPatch
} from '../dist/index.js';

const profile = lodProfile('npc', [
  lodLevel('full', { maxDistance: 20, renderCost: 8, computeCost: 6, updateIntervalMs: 16, lane: 'near' }),
  lodLevel('sim', { maxDistance: 80, renderCost: 3, computeCost: 2, updateIntervalMs: 120, lane: 'mid' }),
  lodLevel('coarse', { maxDistance: 200, renderCost: 1, computeCost: 1, updateIntervalMs: 1000, lane: 'far' }),
  lodLevel('culled', { visible: false, renderCost: 0, computeCost: 0, updateIntervalMs: -1 })
]);

const engine = createLodEngine({
  profiles: [profile],
  items: [
    lodItem('a', 0, 0, { profile: 'npc', radius: 2, priority: 2 }),
    lodItem('b', 40, 0, { profile: 'npc', radius: 1 }),
    lodItem('c', 300, 0, { profile: 'npc', radius: 1 })
  ]
});

const frame = engine.evaluate({ x: 0, y: 0 }, { includeHidden: true });
assert.strictEqual(frame.kind, 'frontier.lod.frame');
assert.deepStrictEqual(frame.levelIds, ['full', 'sim', 'culled']);
assert.strictEqual(frame.visibleCount, 2);
assert.deepStrictEqual(materializeLodFrame(frame).byLevel.full, [0]);

const compact = engine.evaluateInto(undefined, { x: 0, y: 0 }, { mode: 'distance' });
assert.strictEqual(compact.kind, 'frontier.lod.compact-frame');
assert.strictEqual(compact.itemCount, 3);
assert.strictEqual(compact.levels[0], 0);
assert.strictEqual(compact.levels[1], 1);
assert.strictEqual(compact.visible[2], 0);

const bands = engine.evaluateBandsInto(undefined, { x: 0, y: 0 });
assert.strictEqual(bands.kind, 'frontier.lod.band-frame');
assert.strictEqual(bands.visibleCount, 2);
assert.strictEqual(bands.levels[2], 3);

const transitionEngine = createLodEngine({
  profiles: [profile],
  items: [
    lodItem('a', 0, 0, { profile: 'npc', radius: 2, priority: 2 }),
    lodItem('b', 40, 0, { profile: 'npc', radius: 1 }),
    lodItem('c', 300, 0, { profile: 'npc', radius: 1 })
  ]
});
const transitions = transitionEngine.evaluateBandTransitionsInto(createLodTransitionFrame(3), { x: 0, y: 0 });
assert.strictEqual(transitions.kind, 'frontier.lod.transition-frame');
assert.strictEqual(transitions.visibleCount, bands.visibleCount);
assert.deepStrictEqual(Array.from(transitions.indexes.slice(0, transitions.transitionCount)), [0, 1, 2]);
const stableTransitions = transitionEngine.evaluateBandTransitionsInto(transitions, { x: 0, y: 0 });
assert.strictEqual(stableTransitions.transitionCount, 0);

const multiObserverEngine = createLodEngine({
  profiles: [profile],
  items: [
    lodItem('a', 0, 0, { profile: 'npc', radius: 2, priority: 2 }),
    lodItem('b', 40, 0, { profile: 'npc', radius: 1 }),
    lodItem('c', 300, 0, { profile: 'npc', radius: 1 })
  ]
});
const multi = multiObserverEngine.evaluateMultiObserverInto(createLodMultiObserverFrame(3), [
  { x: 0, y: 0 },
  { x: 300, y: 0 }
]);
assert.strictEqual(multi.kind, 'frontier.lod.multi-observer-frame');
assert.strictEqual(multi.itemCount, 3);
assert.strictEqual(multi.observerCount, 2);
assert.strictEqual(multi.visibleCount, 3);
assert.strictEqual(multi.levels[2], 0);
assert.strictEqual(multi.observerIndexes[2], 1);
const hiddenMulti = multiObserverEngine.evaluateMultiObserverInto(multi, []);
assert.strictEqual(hiddenMulti.visibleCount, 0);
assert.deepStrictEqual(Array.from(hiddenMulti.observerIndexes.slice(0, hiddenMulti.itemCount)), [-1, -1, -1]);

const assignments = engine.assignments(frame);
assert.strictEqual(assignments[0].id, 'a');
assert.strictEqual(assignments[2].visible, false);

const budgeted = engine.evaluate({ x: 0, y: 0 }, {
  includeHidden: true,
  budget: { maxRenderCost: 4, maxComputeCost: 4 }
});
assert.ok(budgeted.totalRenderCost <= 4);
assert.ok(budgeted.totalComputeCost <= 4);

engine.commit(setLodItemPositionPatch(2, 50, 0));
const moved = engine.evaluate({ x: 0, y: 0 }, { includeHidden: true });
assert.strictEqual(moved.levelIds[2], 'sim');

engine.commit(setLodItemPriorityPatch(1, 8));
const priority = engine.evaluate({ x: 0, y: 0 }, { mode: 'priority' });
assert.ok(priority.scores[1] > frame.scores[1]);

const workPlan = createLodWorkPlan(moved, {
  nowMs: 1000,
  lastRunMsById: { a: 990, b: 0, c: 0 },
  taskType: 'frontier.test.work'
});
assert.ok(workPlan.items.some((item) => item.id === 'b'));
assert.ok(workPlan.items.some((item) => item.id === 'c'));
assert.ok(!workPlan.items.some((item) => item.id === 'a'));

const scheduled = [];
scheduleLodWork({
  schedule(task) {
    scheduled.push(task);
    return task.key;
  }
}, workPlan, (item) => item.id);
assert.strictEqual(scheduled.length, workPlan.items.length);
assert.strictEqual(scheduled[0].area, 'frontier-lod');

assert.strictEqual(JSON.parse(JSON.stringify(engine.snapshot())).items.length, 3);

console.log('frontier lod smoke passed');
