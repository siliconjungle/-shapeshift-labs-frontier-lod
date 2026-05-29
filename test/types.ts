import {
  createLodBandFrame,
  createLodCompactFrame,
  createLodEngine,
  createLodMultiObserverFrame,
  createLodTransitionFrame,
  createLodWorkPlan,
  lodItem,
  lodLevel,
  lodProfile,
  materializeLodFrame,
  scheduleLodWork,
  setLodItemEnabledPatch,
  type FrontierLodAssignment,
  type FrontierLodBandFrame,
  type FrontierLodCompactFrame,
  type FrontierLodEngine,
  type FrontierLodFrame,
  type FrontierLodMaterialization,
  type FrontierLodMultiObserverFrame,
  type FrontierLodSnapshot,
  type FrontierLodTransitionFrame,
  type FrontierLodWorkPlan
} from '../dist/index.js';

const snapshot: FrontierLodSnapshot = {
  kind: 'frontier.lod.set',
  version: 1,
  profiles: [
    lodProfile('default', [
      lodLevel('near', { maxDistance: 10, renderCost: 4, computeCost: 3 }),
      lodLevel('far', { visible: false })
    ])
  ],
  items: [
    lodItem('item:0', 0, 0, { profile: 'default' })
  ]
};

const engine: FrontierLodEngine = createLodEngine(snapshot);
engine.commit(setLodItemEnabledPatch(0, true));
const frame: FrontierLodFrame = engine.evaluate({ x: 0, y: 0 }, { includeHidden: true });
const compactFrame: FrontierLodCompactFrame = engine.evaluateInto(createLodCompactFrame(1), { x: 0, y: 0 });
const bandFrame: FrontierLodBandFrame = engine.evaluateBandsInto(createLodBandFrame(1), { x: 0, y: 0 });
const transitionFrame: FrontierLodTransitionFrame = engine.evaluateBandTransitionsInto(createLodTransitionFrame(1), { x: 0, y: 0 });
const multiObserverFrame: FrontierLodMultiObserverFrame = engine.evaluateMultiObserverInto(createLodMultiObserverFrame(1), [{ x: 0, y: 0 }]);
const assignments: FrontierLodAssignment[] = engine.assignments(frame);
const workPlan: FrontierLodWorkPlan = createLodWorkPlan(frame, { nowMs: 1 });
const materialization: FrontierLodMaterialization = materializeLodFrame(frame);

scheduleLodWork({
  schedule(task) {
    return task;
  }
}, workPlan);

void assignments;
void compactFrame;
void bandFrame;
void transitionFrame;
void multiObserverFrame;
void materialization;
