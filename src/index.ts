import { applyPatch } from '@shapeshift-labs/frontier';
import type { JsonValue, Patch } from '@shapeshift-labs/frontier';

export const FRONTIER_LOD_SET_KIND = 'frontier.lod.set';
export const FRONTIER_LOD_SET_VERSION = 1;
export const FRONTIER_LOD_FRAME_KIND = 'frontier.lod.frame';
export const FRONTIER_LOD_FRAME_VERSION = 1;

const DEFAULT_RADIUS = 1;
const DEFAULT_PRIORITY = 1;
const DEFAULT_WEIGHT = 1;
const DEFAULT_VIEWPORT_HEIGHT = 1080;
const DEFAULT_FOV_Y = Math.PI / 3;
const EPSILON = 1e-9;
const NO_LEVEL = -1;

export type FrontierLodMode = 'distance' | 'screen' | 'priority';

export interface FrontierLodPoint {
  x: number;
  y: number;
  z?: number;
}

export interface FrontierLodLevel {
  id: string;
  maxDistance?: number;
  minScreenCoverage?: number;
  renderCost?: number;
  computeCost?: number;
  updateIntervalMs?: number;
  lane?: string;
  visible?: boolean;
  metadata?: Record<string, JsonValue>;
}

export interface FrontierLodProfile {
  id: string;
  mode?: FrontierLodMode;
  levels: FrontierLodLevel[];
  metadata?: Record<string, JsonValue>;
}

export interface FrontierLodItem {
  id: string;
  profile?: string;
  x: number;
  y: number;
  z?: number;
  radius?: number;
  priority?: number;
  weight?: number;
  enabled?: boolean;
  category?: string;
  metadata?: Record<string, JsonValue>;
}

export interface FrontierLodSnapshot {
  kind: typeof FRONTIER_LOD_SET_KIND;
  version: typeof FRONTIER_LOD_SET_VERSION;
  profiles: FrontierLodProfile[];
  items: FrontierLodItem[];
  metadata?: Record<string, JsonValue>;
}

export interface FrontierLodOptions {
  profiles: readonly FrontierLodProfile[];
  items: readonly FrontierLodItem[];
  metadata?: Record<string, JsonValue>;
}

export type FrontierLodInput = FrontierLodSnapshot | FrontierLodOptions;

export interface FrontierLodObserver extends FrontierLodPoint {
  fovY?: number;
  viewportHeight?: number;
  pixelRatio?: number;
  qualityBias?: number;
}

export interface FrontierLodBudget {
  maxVisible?: number;
  maxRenderCost?: number;
  maxComputeCost?: number;
}

export interface FrontierLodEvaluateOptions {
  mode?: FrontierLodMode;
  budget?: FrontierLodBudget;
  includeHidden?: boolean;
  hysteresisRatio?: number;
}

export interface FrontierLodFrame {
  kind: typeof FRONTIER_LOD_FRAME_KIND;
  version: typeof FRONTIER_LOD_FRAME_VERSION;
  generation: number;
  observer: FrontierLodObserver;
  itemIndexes: number[];
  ids: string[];
  levels: number[];
  levelIds: string[];
  visible: boolean[];
  distances: number[];
  screenCoverages: number[];
  scores: number[];
  renderCosts: number[];
  computeCosts: number[];
  updateIntervalsMs: number[];
  lanes: string[];
  visibleCount: number;
  totalRenderCost: number;
  totalComputeCost: number;
  changedIndexes: number[];
  countsByLevel: Record<string, number>;
}

export interface FrontierLodCompactFrame {
  kind: 'frontier.lod.compact-frame';
  version: 1;
  generation: number;
  itemCount: number;
  levels: Int16Array;
  visible: Uint8Array;
  distances: Float64Array;
  scores: Float64Array;
  visibleCount: number;
  totalRenderCost: number;
  totalComputeCost: number;
  changedIndexes: number[];
}

export interface FrontierLodBandFrame {
  kind: 'frontier.lod.band-frame';
  version: 1;
  generation: number;
  itemCount: number;
  levels: Int16Array;
  visible: Uint8Array;
  visibleCount: number;
  changedIndexes: number[];
}

export interface FrontierLodTransitionFrame {
  kind: 'frontier.lod.transition-frame';
  version: 1;
  generation: number;
  itemCount: number;
  transitionCount: number;
  visibleCount: number;
  indexes: Int32Array;
  previousLevels: Int16Array;
  levels: Int16Array;
  previousVisible: Uint8Array;
  visible: Uint8Array;
}

export interface FrontierLodMultiObserverFrame {
  kind: 'frontier.lod.multi-observer-frame';
  version: 1;
  generation: number;
  itemCount: number;
  observerCount: number;
  levels: Int16Array;
  visible: Uint8Array;
  observerIndexes: Int32Array;
  visibleCount: number;
  changedIndexes: number[];
}

export interface FrontierLodAssignment {
  id: string;
  index: number;
  level: number;
  levelId: string;
  visible: boolean;
  distance: number;
  screenCoverage: number;
  score: number;
  renderCost: number;
  computeCost: number;
  updateIntervalMs: number;
  lane: string;
}

export interface FrontierLodOrigin {
  actionId?: string;
  causeId?: string;
  actor?: string;
  source?: string;
  metadata?: Record<string, JsonValue>;
}

export interface FrontierLodCommitOptions {
  origin?: FrontierLodOrigin;
}

export interface FrontierLodCommitResult {
  changed: boolean;
  structural: boolean;
  patch: Patch;
  dirtyItemIndexes: number[];
  generation: number;
  origin?: FrontierLodOrigin;
}

export interface FrontierLodWorkPlanOptions {
  nowMs?: number;
  lastRunMsById?: Record<string, number>;
  taskType?: string;
  includeHidden?: boolean;
  metadata?: Record<string, JsonValue>;
}

export interface FrontierLodWorkItem {
  id: string;
  index: number;
  level: number;
  levelId: string;
  lane: string;
  key: string;
  type: string;
  units: number;
  due: boolean;
  reason: 'interval' | 'never' | 'hidden';
  metadata?: Record<string, JsonValue>;
}

export interface FrontierLodWorkPlan {
  kind: 'frontier.lod.work-plan';
  version: 1;
  generation: number;
  nowMs: number;
  items: FrontierLodWorkItem[];
}

export interface FrontierLodScheduler {
  schedule<TInput = unknown>(task: {
    id?: string;
    type?: string;
    input?: TInput;
    lane?: string;
    area?: string;
    key?: string;
    units?: number;
    metadata?: Record<string, unknown>;
    run?: (context: { input: TInput | undefined; metadata: Record<string, unknown> }) => unknown;
  }): unknown;
}

export interface FrontierLodMaterialization {
  kind: 'frontier.lod.materialization';
  version: 1;
  generation: number;
  visibleIndexes: number[];
  hiddenIndexes: number[];
  byLevel: Record<string, number[]>;
}

export interface FrontierLodEngine {
  readonly generation: number;
  readonly itemCount: number;
  snapshot(): FrontierLodSnapshot;
  commit(patch: Patch, options?: FrontierLodCommitOptions): FrontierLodCommitResult;
  evaluate(observer: FrontierLodObserver, options?: FrontierLodEvaluateOptions): FrontierLodFrame;
  evaluateInto(target: FrontierLodCompactFrame | undefined, observer: FrontierLodObserver, options?: FrontierLodEvaluateOptions): FrontierLodCompactFrame;
  evaluateBandsInto(target: FrontierLodBandFrame | undefined, observer: FrontierLodObserver): FrontierLodBandFrame;
  evaluateBandTransitionsInto(target: FrontierLodTransitionFrame | undefined, observer: FrontierLodObserver): FrontierLodTransitionFrame;
  evaluateMultiObserverInto(target: FrontierLodMultiObserverFrame | undefined, observers: readonly FrontierLodObserver[]): FrontierLodMultiObserverFrame;
  assignments(frame: FrontierLodFrame): FrontierLodAssignment[];
  createWorkPlan(frame: FrontierLodFrame, options?: FrontierLodWorkPlanOptions): FrontierLodWorkPlan;
}

export function createLodEngine(input: FrontierLodInput): FrontierLodEngine {
  return new FrontierLodEngineImpl(normalizeSnapshot(input));
}

export function createLodCompactFrame(capacity = 0): FrontierLodCompactFrame {
  const size = Math.max(0, Math.floor(capacity));
  return {
    kind: 'frontier.lod.compact-frame',
    version: 1,
    generation: 0,
    itemCount: 0,
    levels: new Int16Array(size),
    visible: new Uint8Array(size),
    distances: new Float64Array(size),
    scores: new Float64Array(size),
    visibleCount: 0,
    totalRenderCost: 0,
    totalComputeCost: 0,
    changedIndexes: []
  };
}

export function createLodBandFrame(capacity = 0): FrontierLodBandFrame {
  const size = Math.max(0, Math.floor(capacity));
  return {
    kind: 'frontier.lod.band-frame',
    version: 1,
    generation: 0,
    itemCount: 0,
    levels: new Int16Array(size),
    visible: new Uint8Array(size),
    visibleCount: 0,
    changedIndexes: []
  };
}

export function createLodTransitionFrame(capacity = 0): FrontierLodTransitionFrame {
  const size = Math.max(0, Math.floor(capacity));
  return {
    kind: 'frontier.lod.transition-frame',
    version: 1,
    generation: 0,
    itemCount: 0,
    transitionCount: 0,
    visibleCount: 0,
    indexes: new Int32Array(size),
    previousLevels: new Int16Array(size),
    levels: new Int16Array(size),
    previousVisible: new Uint8Array(size),
    visible: new Uint8Array(size)
  };
}

export function createLodMultiObserverFrame(capacity = 0): FrontierLodMultiObserverFrame {
  const size = Math.max(0, Math.floor(capacity));
  const observerIndexes = new Int32Array(size);
  observerIndexes.fill(-1);
  return {
    kind: 'frontier.lod.multi-observer-frame',
    version: 1,
    generation: 0,
    itemCount: 0,
    observerCount: 0,
    levels: new Int16Array(size),
    visible: new Uint8Array(size),
    observerIndexes,
    visibleCount: 0,
    changedIndexes: []
  };
}

export function lodProfile(id: string, levels: readonly FrontierLodLevel[], options: {
  mode?: FrontierLodMode;
  metadata?: Record<string, JsonValue>;
} = {}): FrontierLodProfile {
  return normalizeProfile({ id, levels: Array.from(levels), mode: options.mode, metadata: options.metadata });
}

export function lodLevel(id: string, options: Omit<FrontierLodLevel, 'id'> = {}): FrontierLodLevel {
  return normalizeLevel({ id, ...options });
}

export function lodItem(id: string, x: number, y: number, options: Omit<FrontierLodItem, 'id' | 'x' | 'y'> = {}): FrontierLodItem {
  return normalizeItem({ id, x, y, ...options });
}

export function setLodItemPositionPatch(index: number, x: number, y: number, z = 0): Patch {
  return [
    [0, ['items', index, 'x'], finiteOr(x, 0)],
    [0, ['items', index, 'y'], finiteOr(y, 0)],
    [0, ['items', index, 'z'], finiteOr(z, 0)]
  ];
}

export function setLodItemPriorityPatch(index: number, priority: number): Patch {
  return [[0, ['items', index, 'priority'], nonNegative(priority, DEFAULT_PRIORITY)]];
}

export function setLodItemEnabledPatch(index: number, enabled: boolean): Patch {
  return [[0, ['items', index, 'enabled'], Boolean(enabled)]];
}

export function createLodWorkPlan(frame: FrontierLodFrame, options: FrontierLodWorkPlanOptions = {}): FrontierLodWorkPlan {
  const nowMs = finiteOr(options.nowMs, 0);
  const lastRunMsById = options.lastRunMsById;
  const hasLastRunMs = lastRunMsById !== undefined && Object.keys(lastRunMsById).length !== 0;
  const includeHidden = options.includeHidden === true;
  const taskType = options.taskType ?? 'frontier.lod.compute';
  const metadata = options.metadata;
  const itemIndexes = frame.itemIndexes;
  const ids = frame.ids;
  const visible = frame.visible;
  const intervals = frame.updateIntervalsMs;
  const levels = frame.levels;
  const levelIds = frame.levelIds;
  const lanes = frame.lanes;
  const computeCosts = frame.computeCosts;
  const items: FrontierLodWorkItem[] = [];
  for (let i = 0; i < itemIndexes.length; i++) {
    const id = ids[i];
    const itemVisible = visible[i];
    const interval = intervals[i];
    if (!itemVisible && !includeHidden) continue;
    let due = false;
    let reason: FrontierLodWorkItem['reason'] = 'interval';
    if (!itemVisible) {
      reason = 'hidden';
    } else if (!Number.isFinite(interval) || interval < 0) {
      reason = 'never';
    } else {
      const lastRun = hasLastRunMs ? (lastRunMsById as Record<string, number>)[id] ?? Number.NEGATIVE_INFINITY : Number.NEGATIVE_INFINITY;
      due = nowMs - lastRun >= interval;
    }
    if (!due && !includeHidden) continue;
    items[items.length] = {
      id,
      index: itemIndexes[i],
      level: levels[i],
      levelId: levelIds[i],
      lane: lanes[i] || 'lod',
      key: id + ':' + levelIds[i],
      type: taskType,
      units: Math.max(0, computeCosts[i]),
      due,
      reason,
      metadata
    };
  }
  return { kind: 'frontier.lod.work-plan', version: 1, generation: frame.generation, nowMs, items };
}

export function scheduleLodWork(
  scheduler: FrontierLodScheduler,
  plan: FrontierLodWorkPlan,
  run?: (item: FrontierLodWorkItem) => unknown
): unknown[] {
  const results = new Array<unknown>(plan.items.length);
  for (let i = 0; i < plan.items.length; i++) {
    const item = plan.items[i];
    results[i] = scheduler.schedule({
      id: 'lod:' + item.key,
      type: item.type,
      lane: item.lane,
      area: 'frontier-lod',
      key: item.key,
      units: item.units,
      input: item,
      metadata: {
        generation: plan.generation,
        level: item.level,
        levelId: item.levelId,
        due: item.due,
        reason: item.reason,
        ...(item.metadata ?? {})
      },
      run: run ? () => run(item) : undefined
    });
  }
  return results;
}

export function materializeLodFrame(frame: FrontierLodFrame): FrontierLodMaterialization {
  const total = frame.itemIndexes.length;
  const visibleIndexes = new Array<number>(frame.visibleCount);
  const hiddenIndexes = new Array<number>(Math.max(0, total - frame.visibleCount));
  const byLevel: Record<string, number[]> = {};
  const byLevelPositions: Record<string, number> = {};
  const levelCounts = frame.countsByLevel;
  for (const levelId of Object.keys(levelCounts)) {
    byLevel[levelId] = new Array<number>(levelCounts[levelId]);
    byLevelPositions[levelId] = 0;
  }
  let visibleWrite = 0;
  let hiddenWrite = 0;
  for (let i = 0; i < total; i++) {
    const index = frame.itemIndexes[i];
    if (frame.visible[i]) visibleIndexes[visibleWrite++] = index;
    else hiddenIndexes[hiddenWrite++] = index;
    const levelId = frame.levelIds[i] || 'hidden';
    const levelItems = byLevel[levelId] ?? (byLevel[levelId] = []);
    const position = byLevelPositions[levelId] ?? 0;
    levelItems[position] = index;
    byLevelPositions[levelId] = position + 1;
  }
  visibleIndexes.length = visibleWrite;
  hiddenIndexes.length = hiddenWrite;
  for (const levelId of Object.keys(byLevelPositions)) byLevel[levelId].length = byLevelPositions[levelId];
  return { kind: 'frontier.lod.materialization', version: 1, generation: frame.generation, visibleIndexes, hiddenIndexes, byLevel };
}

class FrontierLodEngineImpl implements FrontierLodEngine {
  private state: FrontierLodSnapshot;
  private generationValue = 0;
  private profileIndexById = new Map<string, number>();
  private compiledProfiles: CompiledLodProfile[] = [];
  private itemProfileIndexes = new Int32Array(0);
  private x = new Float64Array(0);
  private y = new Float64Array(0);
  private z = new Float64Array(0);
  private radius = new Float64Array(0);
  private priority = new Float64Array(0);
  private weight = new Float64Array(0);
  private enabled = new Uint8Array(0);
  private lastLevels = new Int16Array(0);
  private lastVisible = new Uint8Array(0);
  private bucketNext = new Int32Array(0);
  private observerX = new Float64Array(0);
  private observerY = new Float64Array(0);
  private observerZ = new Float64Array(0);
  private observerQualityScale = new Float64Array(0);

  constructor(snapshot: FrontierLodSnapshot) {
    this.state = cloneSnapshot(snapshot);
    this.rebuildCaches();
  }

  get generation(): number {
    return this.generationValue;
  }

  get itemCount(): number {
    return this.state.items.length;
  }

  snapshot(): FrontierLodSnapshot {
    return cloneSnapshot(this.state);
  }

  commit(patch: Patch, options: FrontierLodCommitOptions = {}): FrontierLodCommitResult {
    if (patch.length === 0) {
      return { changed: false, structural: false, patch, dirtyItemIndexes: [], generation: this.generationValue, origin: options.origin };
    }
    const dirtyItemIndexes: number[] = [];
    let structural = false;
    for (let i = 0; i < patch.length; i++) {
      const op = patch[i];
      const path = op[1];
      if (
        op[0] === 0 &&
        path.length === 3 &&
        path[0] === 'items' &&
        typeof path[1] === 'number' &&
        path[1] >= 0 &&
        path[1] < this.state.items.length &&
        isItemScalarField(path[2])
      ) {
        const itemIndex = path[1];
        dirtyItemIndexes[dirtyItemIndexes.length] = itemIndex;
      } else {
        structural = true;
      }
    }
    if (!structural) {
      for (let i = 0; i < patch.length; i++) {
        const op = patch[i];
        const path = op[1];
        const item = this.state.items[path[1] as number] as FrontierLodItem & Record<string, JsonValue | undefined>;
        item[path[2] as string] = op[2] as JsonValue;
      }
      this.generationValue++;
      let previousDirtyIndex = -1;
      for (let i = 0; i < dirtyItemIndexes.length; i++) {
        const dirtyIndex = dirtyItemIndexes[i];
        if (dirtyIndex === previousDirtyIndex) continue;
        previousDirtyIndex = dirtyIndex;
        this.updateItemCache(dirtyIndex);
      }
      return { changed: true, structural: false, patch, dirtyItemIndexes, generation: this.generationValue, origin: options.origin };
    }
    const previousLength = this.state.items.length;
    this.state = applyPatch(this.state as unknown as JsonValue, patch) as unknown as FrontierLodSnapshot;
    this.generationValue++;
    if (structural || !isSnapshot(this.state) || this.state.items.length !== previousLength) {
      this.state = normalizeSnapshot(this.state as FrontierLodInput);
      this.rebuildCaches();
      return { changed: true, structural: true, patch, dirtyItemIndexes, generation: this.generationValue, origin: options.origin };
    }
    let previousDirtyIndex = -1;
    for (let i = 0; i < dirtyItemIndexes.length; i++) {
      const dirtyIndex = dirtyItemIndexes[i];
      if (dirtyIndex === previousDirtyIndex) continue;
      previousDirtyIndex = dirtyIndex;
      this.updateItemCache(dirtyIndex);
    }
    return { changed: true, structural: false, patch, dirtyItemIndexes, generation: this.generationValue, origin: options.origin };
  }

  evaluate(observer: FrontierLodObserver, options: FrontierLodEvaluateOptions = {}): FrontierLodFrame {
    const normalizedObserver = normalizeObserver(observer);
    const mode = options.mode;
    const qualityBias = Math.max(EPSILON, normalizedObserver.qualityBias ?? 1);
    const qualityScale = qualityBias * qualityBias;
    const hysteresisRatio = Math.max(0, options.hysteresisRatio ?? 0);
    const includeHidden = options.includeHidden === true;
    const itemIndexes: number[] = [];
    const ids: string[] = [];
    const levels: number[] = [];
    const levelIds: string[] = [];
    const visible: boolean[] = [];
    const distances: number[] = [];
    const screenCoverages: number[] = [];
    const scores: number[] = [];
    const renderCosts: number[] = [];
    const computeCosts: number[] = [];
    const updateIntervalsMs: number[] = [];
    const lanes: string[] = [];
    const changedIndexes: number[] = [];
    const countsByLevel: Record<string, number> = {};
    const profileCount = this.state.profiles.length;
    let visibleCount = 0;
    let totalRenderCost = 0;
    let totalComputeCost = 0;
    const budget = options.budget;
    const buildBudgetBuckets = !!budget && (budget.maxRenderCost !== undefined || budget.maxComputeCost !== undefined || budget.maxVisible !== undefined);
    const bucketHeads = buildBudgetBuckets ? new Int32Array(64) : undefined;
    const thisRef = this;
    if (bucketHeads) bucketHeads.fill(-1);
    if (buildBudgetBuckets && this.bucketNext.length < this.state.items.length) this.bucketNext = new Int32Array(this.state.items.length);
    const focal = focalPixels(normalizedObserver);
    const itemCount = this.state.items.length;
    const items = this.state.items;
    const sourceProfiles = this.state.profiles;
    const compiledProfiles = this.compiledProfiles;
    const singleCompiledProfile = compiledProfiles.length === 1 ? compiledProfiles[0] : undefined;
    const itemProfileIndexes = this.itemProfileIndexes;
    const xs = this.x;
    const ys = this.y;
    const zs = this.z;
    const radii = this.radius;
    const priorities = this.priority;
    const weights = this.weight;
    const enabled = this.enabled;

    for (let index = 0; index < itemCount; index++) {
      if (enabled[index] === 0) {
        this.lastLevels[index] = NO_LEVEL;
        this.lastVisible[index] = 0;
        if (includeHidden) {
          appendAssignment(index, NO_LEVEL, false, 0, 0, 0, undefined);
        }
        continue;
      }
      const profileIndex = itemProfileIndexes[index];
      const profile = sourceProfiles[profileIndex];
      const compiledProfile = singleCompiledProfile ?? compiledProfiles[profileIndex];
      if (!profile || !compiledProfile || profileCount === 0) continue;
      const dx = xs[index] - normalizedObserver.x;
      const dy = ys[index] - normalizedObserver.y;
      const dz = zs[index] - (normalizedObserver.z ?? 0);
      const distanceSquared = dx * dx + dy * dy + dz * dz;
      const distance = Math.sqrt(distanceSquared);
      const coverage = screenCoverage(radii[index], distance, focal, normalizedObserver.viewportHeight ?? DEFAULT_VIEWPORT_HEIGHT);
      const activeMode = mode ?? compiledProfile.mode;
      const score = significanceScore(distance, coverage, priorities[index], weights[index], activeMode);
      let levelIndex: number;
      if (hysteresisRatio === 0 && activeMode === 'distance') {
        const maxDistanceSquares = compiledProfile.maxDistanceSquares;
        levelIndex = compiledProfile.count - 1;
        for (let candidate = 0; candidate < compiledProfile.count; candidate++) {
          if (distanceSquared <= maxDistanceSquares[candidate] * qualityScale) {
            levelIndex = candidate;
            break;
          }
        }
      } else {
        levelIndex = hysteresisRatio === 0
          ? selectCompiledLevel(compiledProfile, distance, coverage, qualityBias, activeMode)
          : selectLevel(profile, distance, coverage, qualityBias, hysteresisRatio, this.lastLevels[index], mode);
      }
      const isVisible = levelIndex !== NO_LEVEL && compiledProfile.visible[levelIndex] === 1;
      const framePosition = appendAssignment(index, levelIndex, isVisible, distance, coverage, score, compiledProfile);
      if (bucketHeads && isVisible && levelIndex >= 0 && levelIndex < compiledProfile.count - 1) {
        const bucket = scoreBucket(score);
        this.bucketNext[framePosition] = bucketHeads[bucket];
        bucketHeads[bucket] = framePosition;
      }
    }

    if (budget && bucketHeads) {
      let overBudget = isOverBudget(budget, visibleCount, totalRenderCost, totalComputeCost);
      let budgetChanged = false;
      for (let bucket = 0; bucket < bucketHeads.length && overBudget; bucket++) {
        let cursor = bucketHeads[bucket];
        while (cursor !== -1 && overBudget) {
          const itemIndex = itemIndexes[cursor];
          const profile = singleCompiledProfile ?? compiledProfiles[itemProfileIndexes[itemIndex]];
          const currentLevelIndex = levels[cursor];
          const nextLevelIndex = nextCheaperCompiledLevel(profile, currentLevelIndex);
          if (nextLevelIndex !== currentLevelIndex) {
            const wasVisible = visible[cursor];
            const nextVisible = nextLevelIndex !== NO_LEVEL && profile.visible[nextLevelIndex] === 1;
            totalRenderCost += compactRenderCost(profile, nextLevelIndex) - compactRenderCost(profile, currentLevelIndex);
            totalComputeCost += compactComputeCost(profile, nextLevelIndex) - compactComputeCost(profile, currentLevelIndex);
            if (wasVisible && !nextVisible) visibleCount--;
            levels[cursor] = nextLevelIndex;
            levelIds[cursor] = nextLevelIndex === NO_LEVEL ? 'hidden' : profile.levelIds[nextLevelIndex];
            visible[cursor] = nextVisible;
            renderCosts[cursor] = nextVisible ? profile.renderCosts[nextLevelIndex] : 0;
            computeCosts[cursor] = nextVisible ? profile.computeCosts[nextLevelIndex] : 0;
            updateIntervalsMs[cursor] = nextVisible ? profile.updateIntervalsMs[nextLevelIndex] : -1;
            lanes[cursor] = nextVisible ? profile.lanes[nextLevelIndex] : '';
            this.lastLevels[itemIndex] = nextLevelIndex;
            this.lastVisible[itemIndex] = nextVisible ? 1 : 0;
            changedIndexes[changedIndexes.length] = itemIndex;
            budgetChanged = true;
            overBudget = isOverBudget(budget, visibleCount, totalRenderCost, totalComputeCost);
          }
          cursor = this.bucketNext[cursor];
        }
      }
      if (budgetChanged) rebuildCounts();
    }

    return {
      kind: FRONTIER_LOD_FRAME_KIND,
      version: FRONTIER_LOD_FRAME_VERSION,
      generation: this.generationValue,
      observer: normalizedObserver,
      itemIndexes,
      ids,
      levels,
      levelIds,
      visible,
      distances,
      screenCoverages,
      scores,
      renderCosts,
      computeCosts,
      updateIntervalsMs,
      lanes,
      visibleCount,
      totalRenderCost,
      totalComputeCost,
      changedIndexes,
      countsByLevel
    };

    function appendAssignment(
      index: number,
      levelIndex: number,
      isVisible: boolean,
      distance: number,
      coverage: number,
      score: number,
      profile: CompiledLodProfile | undefined
    ): number {
      const previousLevel = thisRef.lastLevels[index];
      const previousVisible = thisRef.lastVisible[index] === 1;
      if (previousLevel !== levelIndex || previousVisible !== isVisible) changedIndexes[changedIndexes.length] = index;
      thisRef.lastLevels[index] = levelIndex;
      thisRef.lastVisible[index] = isVisible ? 1 : 0;
      const position = itemIndexes.length;
      const levelId = levelIndex === NO_LEVEL || !profile ? 'hidden' : profile.levelIds[levelIndex];
      if (isVisible || includeHidden) {
        itemIndexes[position] = index;
        ids[position] = items[index].id;
        levels[position] = levelIndex;
        levelIds[position] = levelId;
        visible[position] = isVisible;
        distances[position] = distance;
        screenCoverages[position] = coverage;
        scores[position] = score;
        renderCosts[position] = isVisible && profile ? profile.renderCosts[levelIndex] : 0;
        computeCosts[position] = isVisible && profile ? profile.computeCosts[levelIndex] : 0;
        updateIntervalsMs[position] = isVisible && profile ? profile.updateIntervalsMs[levelIndex] : -1;
        lanes[position] = isVisible && profile ? profile.lanes[levelIndex] : '';
      }
      if (isVisible) {
        visibleCount++;
        totalRenderCost += profile ? profile.renderCosts[levelIndex] : 0;
        totalComputeCost += profile ? profile.computeCosts[levelIndex] : 0;
      }
      countsByLevel[levelId] = (countsByLevel[levelId] ?? 0) + 1;
      return position;
    }

    function rebuildCounts(): void {
      for (const key of Object.keys(countsByLevel)) delete countsByLevel[key];
      visibleCount = 0;
      totalRenderCost = 0;
      totalComputeCost = 0;
      for (let i = 0; i < itemIndexes.length; i++) {
        const levelId = visible[i] ? levelIds[i] : 'hidden';
        countsByLevel[levelId] = (countsByLevel[levelId] ?? 0) + 1;
        if (visible[i]) {
          visibleCount++;
          totalRenderCost += renderCosts[i];
          totalComputeCost += computeCosts[i];
        }
      }
    }
  }

  assignments(frame: FrontierLodFrame): FrontierLodAssignment[] {
    const out = new Array<FrontierLodAssignment>(frame.itemIndexes.length);
    for (let i = 0; i < frame.itemIndexes.length; i++) {
      out[i] = {
        id: frame.ids[i],
        index: frame.itemIndexes[i],
        level: frame.levels[i],
        levelId: frame.levelIds[i],
        visible: frame.visible[i],
        distance: frame.distances[i],
        screenCoverage: frame.screenCoverages[i],
        score: frame.scores[i],
        renderCost: frame.renderCosts[i],
        computeCost: frame.computeCosts[i],
        updateIntervalMs: frame.updateIntervalsMs[i],
        lane: frame.lanes[i]
      };
    }
    return out;
  }

  evaluateInto(target: FrontierLodCompactFrame | undefined, observer: FrontierLodObserver, options: FrontierLodEvaluateOptions = {}): FrontierLodCompactFrame {
    const normalizedObserver = normalizeObserver(observer);
    const frame = ensureCompactFrame(target, this.state.items.length);
    frame.generation = this.generationValue;
    frame.itemCount = this.state.items.length;
    frame.visibleCount = 0;
    frame.totalRenderCost = 0;
    frame.totalComputeCost = 0;
    frame.changedIndexes.length = 0;
    const qualityBias = Math.max(EPSILON, normalizedObserver.qualityBias ?? 1);
    const mode = options.mode;
    const budget = options.budget;
    const buildBudgetBuckets = !!budget && (budget.maxRenderCost !== undefined || budget.maxComputeCost !== undefined || budget.maxVisible !== undefined);
    const bucketHeads = buildBudgetBuckets ? new Int32Array(64) : undefined;
    if (bucketHeads) bucketHeads.fill(-1);
    if (buildBudgetBuckets && this.bucketNext.length < this.state.items.length) this.bucketNext = new Int32Array(this.state.items.length);
    const focal = focalPixels(normalizedObserver);
    const thisRef = this;
    const eyeX = normalizedObserver.x;
    const eyeY = normalizedObserver.y;
    const eyeZ = normalizedObserver.z ?? 0;
    const viewportHeight = normalizedObserver.viewportHeight ?? DEFAULT_VIEWPORT_HEIGHT;
    const qualityScale = qualityBias * qualityBias;
    const itemCount = this.state.items.length;
    const singleProfile = this.compiledProfiles.length === 1 ? this.compiledProfiles[0] : undefined;
    const compiledProfiles = this.compiledProfiles;
    const itemProfileIndexes = this.itemProfileIndexes;
    const xs = this.x;
    const ys = this.y;
    const zs = this.z;
    const radii = this.radius;
    const priorities = this.priority;
    const weights = this.weight;
    const enabled = this.enabled;
    for (let index = 0; index < itemCount; index++) {
      if (enabled[index] === 0) {
        writeCompact(frame, index, NO_LEVEL, false, 0, 0);
        continue;
      }
      const profile = singleProfile ?? compiledProfiles[itemProfileIndexes[index]];
      if (!profile) {
        writeCompact(frame, index, NO_LEVEL, false, 0, 0);
        continue;
      }
      const dx = xs[index] - eyeX;
      const dy = ys[index] - eyeY;
      const dz = zs[index] - eyeZ;
      const distanceSquared = dx * dx + dy * dy + dz * dz;
      const distance = Math.sqrt(distanceSquared);
      const activeMode = mode ?? profile.mode;
      const coverage = activeMode === 'distance' ? 0 : screenCoverage(radii[index], distance, focal, viewportHeight);
      const score = buildBudgetBuckets || activeMode !== 'distance'
        ? significanceScore(distance, coverage, priorities[index], weights[index], activeMode)
        : 0;
      let level = profile.count - 1;
      if (activeMode === 'distance') {
        const maxDistanceSquares = profile.maxDistanceSquares;
        for (let levelIndex = 0; levelIndex < profile.count; levelIndex++) {
          if (distanceSquared <= maxDistanceSquares[levelIndex] * qualityScale) {
            level = levelIndex;
            break;
          }
        }
      } else {
        level = selectCompiledLevel(profile, distance, coverage, qualityBias, activeMode);
      }
      const isVisible = level !== NO_LEVEL && profile.visible[level] === 1;
      writeCompact(frame, index, level, isVisible, distance, score);
      if (isVisible) {
        frame.visibleCount++;
        frame.totalRenderCost += profile.renderCosts[level];
        frame.totalComputeCost += profile.computeCosts[level];
        if (bucketHeads && level < profile.count - 1) {
          const bucket = scoreBucket(score);
          this.bucketNext[index] = bucketHeads[bucket];
          bucketHeads[bucket] = index;
        }
      }
    }

    if (budget && bucketHeads) {
      let overBudget = isOverBudget(budget, frame.visibleCount, frame.totalRenderCost, frame.totalComputeCost);
      for (let bucket = 0; bucket < bucketHeads.length && overBudget; bucket++) {
        let cursor = bucketHeads[bucket];
        while (cursor !== -1 && overBudget) {
          const profile = singleProfile ?? compiledProfiles[itemProfileIndexes[cursor]];
          const current = frame.levels[cursor];
          const next = nextCheaperCompiledLevel(profile, current);
          if (next !== current) {
            const wasVisible = frame.visible[cursor] === 1;
            const nextVisible = next !== NO_LEVEL && profile.visible[next] === 1;
            frame.totalRenderCost += compactRenderCost(profile, next) - compactRenderCost(profile, current);
            frame.totalComputeCost += compactComputeCost(profile, next) - compactComputeCost(profile, current);
            if (wasVisible && !nextVisible) frame.visibleCount--;
            frame.levels[cursor] = next;
            frame.visible[cursor] = nextVisible ? 1 : 0;
            this.lastLevels[cursor] = next;
            this.lastVisible[cursor] = nextVisible ? 1 : 0;
            frame.changedIndexes[frame.changedIndexes.length] = cursor;
            overBudget = isOverBudget(budget, frame.visibleCount, frame.totalRenderCost, frame.totalComputeCost);
          }
          cursor = this.bucketNext[cursor];
        }
      }
    }
    return frame;

    function writeCompact(frame: FrontierLodCompactFrame, index: number, level: number, isVisible: boolean, distance: number, score: number): void {
      const previousLevel = thisRef.lastLevels[index];
      const previousVisible = thisRef.lastVisible[index] === 1;
      if (previousLevel !== level || previousVisible !== isVisible) frame.changedIndexes[frame.changedIndexes.length] = index;
      frame.levels[index] = level;
      frame.visible[index] = isVisible ? 1 : 0;
      frame.distances[index] = distance;
      frame.scores[index] = score;
      thisRef.lastLevels[index] = level;
      thisRef.lastVisible[index] = isVisible ? 1 : 0;
    }
  }

  evaluateBandsInto(target: FrontierLodBandFrame | undefined, observer: FrontierLodObserver): FrontierLodBandFrame {
    const normalizedObserver = normalizeObserver(observer);
    const frame = ensureBandFrame(target, this.state.items.length);
    frame.generation = this.generationValue;
    frame.itemCount = this.state.items.length;
    frame.visibleCount = 0;
    frame.changedIndexes.length = 0;
    const eyeX = normalizedObserver.x;
    const eyeY = normalizedObserver.y;
    const eyeZ = normalizedObserver.z ?? 0;
    const qualityBias = Math.max(EPSILON, normalizedObserver.qualityBias ?? 1);
    const qualityScale = qualityBias * qualityBias;
    const itemCount = this.state.items.length;
    const singleProfile = this.compiledProfiles.length === 1 ? this.compiledProfiles[0] : undefined;
    const compiledProfiles = this.compiledProfiles;
    const itemProfileIndexes = this.itemProfileIndexes;
    const xs = this.x;
    const ys = this.y;
    const zs = this.z;
    const enabled = this.enabled;
    const lastLevels = this.lastLevels;
    const lastVisible = this.lastVisible;
    const frameLevels = frame.levels;
    const frameVisible = frame.visible;
    for (let index = 0; index < itemCount; index++) {
      let level = NO_LEVEL;
      let isVisible = false;
      if (enabled[index] !== 0) {
        const profile = singleProfile ?? compiledProfiles[itemProfileIndexes[index]];
        const dx = xs[index] - eyeX;
        const dy = ys[index] - eyeY;
        const dz = zs[index] - eyeZ;
        const distanceSquared = dx * dx + dy * dy + dz * dz;
        const maxDistanceSquares = profile.maxDistanceSquares;
        level = profile.count - 1;
        for (let levelIndex = 0; levelIndex < profile.count; levelIndex++) {
          if (distanceSquared <= maxDistanceSquares[levelIndex] * qualityScale) {
            level = levelIndex;
            break;
          }
        }
        isVisible = level !== NO_LEVEL && profile.visible[level] === 1;
      }
      const previousLevel = lastLevels[index];
      const previousVisible = lastVisible[index] === 1;
      if (previousLevel !== level || previousVisible !== isVisible) frame.changedIndexes[frame.changedIndexes.length] = index;
      frameLevels[index] = level;
      frameVisible[index] = isVisible ? 1 : 0;
      lastLevels[index] = level;
      lastVisible[index] = isVisible ? 1 : 0;
      if (isVisible) frame.visibleCount++;
    }
    return frame;
  }

  evaluateBandTransitionsInto(target: FrontierLodTransitionFrame | undefined, observer: FrontierLodObserver): FrontierLodTransitionFrame {
    const normalizedObserver = normalizeObserver(observer);
    const frame = ensureTransitionFrame(target, this.state.items.length);
    frame.generation = this.generationValue;
    frame.itemCount = this.state.items.length;
    frame.transitionCount = 0;
    frame.visibleCount = 0;
    const eyeX = normalizedObserver.x;
    const eyeY = normalizedObserver.y;
    const eyeZ = normalizedObserver.z ?? 0;
    const qualityBias = Math.max(EPSILON, normalizedObserver.qualityBias ?? 1);
    const qualityScale = qualityBias * qualityBias;
    const itemCount = this.state.items.length;
    const singleProfile = this.compiledProfiles.length === 1 ? this.compiledProfiles[0] : undefined;
    const compiledProfiles = this.compiledProfiles;
    const itemProfileIndexes = this.itemProfileIndexes;
    const xs = this.x;
    const ys = this.y;
    const zs = this.z;
    const enabled = this.enabled;
    const lastLevels = this.lastLevels;
    const lastVisible = this.lastVisible;
    for (let index = 0; index < itemCount; index++) {
      let level = NO_LEVEL;
      let isVisible = false;
      if (enabled[index] !== 0) {
        const profile = singleProfile ?? compiledProfiles[itemProfileIndexes[index]];
        const dx = xs[index] - eyeX;
        const dy = ys[index] - eyeY;
        const dz = zs[index] - eyeZ;
        const distanceSquared = dx * dx + dy * dy + dz * dz;
        const maxDistanceSquares = profile.maxDistanceSquares;
        level = profile.count - 1;
        for (let levelIndex = 0; levelIndex < profile.count; levelIndex++) {
          if (distanceSquared <= maxDistanceSquares[levelIndex] * qualityScale) {
            level = levelIndex;
            break;
          }
        }
        isVisible = level !== NO_LEVEL && profile.visible[level] === 1;
      }
      const previousLevel = lastLevels[index];
      const wasVisible = lastVisible[index] === 1;
      if (previousLevel !== level || wasVisible !== isVisible) {
        const position = frame.transitionCount++;
        frame.indexes[position] = index;
        frame.previousLevels[position] = previousLevel;
        frame.levels[position] = level;
        frame.previousVisible[position] = wasVisible ? 1 : 0;
        frame.visible[position] = isVisible ? 1 : 0;
      }
      lastLevels[index] = level;
      lastVisible[index] = isVisible ? 1 : 0;
      if (isVisible) frame.visibleCount++;
    }
    return frame;
  }

  evaluateMultiObserverInto(target: FrontierLodMultiObserverFrame | undefined, observers: readonly FrontierLodObserver[]): FrontierLodMultiObserverFrame {
    const observerCount = observers.length;
    const itemCount = this.state.items.length;
    const frame = ensureMultiObserverFrame(target, itemCount);
    frame.generation = this.generationValue;
    frame.itemCount = itemCount;
    frame.observerCount = observerCount;
    frame.visibleCount = 0;
    frame.changedIndexes.length = 0;
    this.ensureObserverScratch(observerCount);
    for (let observerIndex = 0; observerIndex < observerCount; observerIndex++) {
      const observer = normalizeObserver(observers[observerIndex]);
      const qualityBias = Math.max(EPSILON, observer.qualityBias ?? 1);
      this.observerX[observerIndex] = observer.x;
      this.observerY[observerIndex] = observer.y;
      this.observerZ[observerIndex] = observer.z ?? 0;
      this.observerQualityScale[observerIndex] = 1 / (qualityBias * qualityBias);
    }
    const xs = this.x;
    const ys = this.y;
    const zs = this.z;
    const enabled = this.enabled;
    const levels = frame.levels;
    const visible = frame.visible;
    const observerIndexes = frame.observerIndexes;
    const lastLevels = this.lastLevels;
    const lastVisible = this.lastVisible;
    const itemProfileIndexes = this.itemProfileIndexes;
    const compiledProfiles = this.compiledProfiles;
    const singleProfile = compiledProfiles.length === 1 ? compiledProfiles[0] : undefined;
    const observerX = this.observerX;
    const observerY = this.observerY;
    const observerZ = this.observerZ;
    const observerQualityScale = this.observerQualityScale;
    for (let index = 0; index < itemCount; index++) {
      let level = NO_LEVEL;
      let isVisible = false;
      let bestObserver = -1;
      if (enabled[index] !== 0 && observerCount !== 0) {
        const itemX = xs[index];
        const itemY = ys[index];
        const itemZ = zs[index];
        let bestScaledDistanceSquared: number;
        if (observerCount === 1) {
          const dx = itemX - observerX[0];
          const dy = itemY - observerY[0];
          const dz = itemZ - observerZ[0];
          bestScaledDistanceSquared = (dx * dx + dy * dy + dz * dz) * observerQualityScale[0];
          bestObserver = 0;
        } else if (observerCount === 2) {
          const dx0 = itemX - observerX[0];
          const dy0 = itemY - observerY[0];
          const dz0 = itemZ - observerZ[0];
          const dx1 = itemX - observerX[1];
          const dy1 = itemY - observerY[1];
          const dz1 = itemZ - observerZ[1];
          const d0 = (dx0 * dx0 + dy0 * dy0 + dz0 * dz0) * observerQualityScale[0];
          const d1 = (dx1 * dx1 + dy1 * dy1 + dz1 * dz1) * observerQualityScale[1];
          if (d0 <= d1) {
            bestScaledDistanceSquared = d0;
            bestObserver = 0;
          } else {
            bestScaledDistanceSquared = d1;
            bestObserver = 1;
          }
        } else if (observerCount === 3) {
          const dx0 = itemX - observerX[0];
          const dy0 = itemY - observerY[0];
          const dz0 = itemZ - observerZ[0];
          const dx1 = itemX - observerX[1];
          const dy1 = itemY - observerY[1];
          const dz1 = itemZ - observerZ[1];
          const dx2 = itemX - observerX[2];
          const dy2 = itemY - observerY[2];
          const dz2 = itemZ - observerZ[2];
          bestScaledDistanceSquared = (dx0 * dx0 + dy0 * dy0 + dz0 * dz0) * observerQualityScale[0];
          bestObserver = 0;
          const d1 = (dx1 * dx1 + dy1 * dy1 + dz1 * dz1) * observerQualityScale[1];
          if (d1 < bestScaledDistanceSquared) {
            bestScaledDistanceSquared = d1;
            bestObserver = 1;
          }
          const d2 = (dx2 * dx2 + dy2 * dy2 + dz2 * dz2) * observerQualityScale[2];
          if (d2 < bestScaledDistanceSquared) {
            bestScaledDistanceSquared = d2;
            bestObserver = 2;
          }
        } else if (observerCount === 4) {
          const dx0 = itemX - observerX[0];
          const dy0 = itemY - observerY[0];
          const dz0 = itemZ - observerZ[0];
          const dx1 = itemX - observerX[1];
          const dy1 = itemY - observerY[1];
          const dz1 = itemZ - observerZ[1];
          const dx2 = itemX - observerX[2];
          const dy2 = itemY - observerY[2];
          const dz2 = itemZ - observerZ[2];
          const dx3 = itemX - observerX[3];
          const dy3 = itemY - observerY[3];
          const dz3 = itemZ - observerZ[3];
          bestScaledDistanceSquared = (dx0 * dx0 + dy0 * dy0 + dz0 * dz0) * observerQualityScale[0];
          bestObserver = 0;
          const d1 = (dx1 * dx1 + dy1 * dy1 + dz1 * dz1) * observerQualityScale[1];
          if (d1 < bestScaledDistanceSquared) {
            bestScaledDistanceSquared = d1;
            bestObserver = 1;
          }
          const d2 = (dx2 * dx2 + dy2 * dy2 + dz2 * dz2) * observerQualityScale[2];
          if (d2 < bestScaledDistanceSquared) {
            bestScaledDistanceSquared = d2;
            bestObserver = 2;
          }
          const d3 = (dx3 * dx3 + dy3 * dy3 + dz3 * dz3) * observerQualityScale[3];
          if (d3 < bestScaledDistanceSquared) {
            bestScaledDistanceSquared = d3;
            bestObserver = 3;
          }
        } else {
          bestScaledDistanceSquared = Number.POSITIVE_INFINITY;
          for (let observerIndex = 0; observerIndex < observerCount; observerIndex++) {
            const dx = itemX - observerX[observerIndex];
            const dy = itemY - observerY[observerIndex];
            const dz = itemZ - observerZ[observerIndex];
            const scaledDistanceSquared = (dx * dx + dy * dy + dz * dz) * observerQualityScale[observerIndex];
            if (scaledDistanceSquared < bestScaledDistanceSquared) {
              bestScaledDistanceSquared = scaledDistanceSquared;
              bestObserver = observerIndex;
            }
          }
        }
        const profile = singleProfile ?? compiledProfiles[itemProfileIndexes[index]];
        const maxDistanceSquares = profile.maxDistanceSquares;
        level = profile.count - 1;
        for (let levelIndex = 0; levelIndex < profile.count; levelIndex++) {
          if (bestScaledDistanceSquared <= maxDistanceSquares[levelIndex]) {
            level = levelIndex;
            break;
          }
        }
        isVisible = level !== NO_LEVEL && profile.visible[level] === 1;
      }
      const previousLevel = lastLevels[index];
      const previousVisible = lastVisible[index] === 1;
      if (previousLevel !== level || previousVisible !== isVisible) frame.changedIndexes[frame.changedIndexes.length] = index;
      levels[index] = level;
      visible[index] = isVisible ? 1 : 0;
      observerIndexes[index] = bestObserver;
      lastLevels[index] = level;
      lastVisible[index] = isVisible ? 1 : 0;
      if (isVisible) frame.visibleCount++;
    }
    return frame;
  }

  createWorkPlan(frame: FrontierLodFrame, options: FrontierLodWorkPlanOptions = {}): FrontierLodWorkPlan {
    return createLodWorkPlan(frame, options);
  }

  private rebuildCaches(): void {
    this.state = normalizeSnapshot(this.state);
    this.profileIndexById = new Map();
    this.compiledProfiles = new Array(this.state.profiles.length);
    for (let i = 0; i < this.state.profiles.length; i++) {
      this.profileIndexById.set(this.state.profiles[i].id, i);
      this.compiledProfiles[i] = compileProfile(this.state.profiles[i]);
    }
    const size = this.state.items.length;
    this.itemProfileIndexes = new Int32Array(size);
    this.x = new Float64Array(size);
    this.y = new Float64Array(size);
    this.z = new Float64Array(size);
    this.radius = new Float64Array(size);
    this.priority = new Float64Array(size);
    this.weight = new Float64Array(size);
    this.enabled = new Uint8Array(size);
    this.lastLevels = new Int16Array(size);
    this.lastVisible = new Uint8Array(size);
    this.bucketNext = new Int32Array(size);
    this.lastLevels.fill(NO_LEVEL);
    for (let i = 0; i < size; i++) this.updateItemCache(i);
  }

  private ensureObserverScratch(size: number): void {
    if (this.observerX.length >= size) return;
    this.observerX = new Float64Array(size);
    this.observerY = new Float64Array(size);
    this.observerZ = new Float64Array(size);
    this.observerQualityScale = new Float64Array(size);
  }

  private updateItemCache(index: number): void {
    if (index < 0 || index >= this.state.items.length) return;
    const item = normalizeItem(this.state.items[index]);
    this.state.items[index] = item;
    this.itemProfileIndexes[index] = this.profileIndexById.get(item.profile ?? this.state.profiles[0]?.id ?? '') ?? 0;
    this.x[index] = item.x;
    this.y[index] = item.y;
    this.z[index] = item.z ?? 0;
    this.radius[index] = item.radius ?? DEFAULT_RADIUS;
    this.priority[index] = item.priority ?? DEFAULT_PRIORITY;
    this.weight[index] = item.weight ?? DEFAULT_WEIGHT;
    this.enabled[index] = item.enabled === false ? 0 : 1;
  }
}

interface CompiledLodProfile {
  mode: FrontierLodMode;
  count: number;
  levelIds: string[];
  lanes: string[];
  maxDistances: Float64Array;
  maxDistanceSquares: Float64Array;
  minScreenCoverages: Float64Array;
  renderCosts: Float64Array;
  computeCosts: Float64Array;
  updateIntervalsMs: Float64Array;
  visible: Uint8Array;
}

function ensureCompactFrame(target: FrontierLodCompactFrame | undefined, size: number): FrontierLodCompactFrame {
  const frame = target ?? createLodCompactFrame(size);
  if (frame.levels.length < size) {
    frame.levels = new Int16Array(size);
    frame.visible = new Uint8Array(size);
    frame.distances = new Float64Array(size);
    frame.scores = new Float64Array(size);
  }
  return frame;
}

function ensureBandFrame(target: FrontierLodBandFrame | undefined, size: number): FrontierLodBandFrame {
  const frame = target ?? createLodBandFrame(size);
  if (frame.levels.length < size) {
    frame.levels = new Int16Array(size);
    frame.visible = new Uint8Array(size);
  }
  return frame;
}

function ensureTransitionFrame(target: FrontierLodTransitionFrame | undefined, size: number): FrontierLodTransitionFrame {
  const frame = target ?? createLodTransitionFrame(size);
  if (frame.indexes.length < size) {
    frame.indexes = new Int32Array(size);
    frame.previousLevels = new Int16Array(size);
    frame.levels = new Int16Array(size);
    frame.previousVisible = new Uint8Array(size);
    frame.visible = new Uint8Array(size);
  }
  return frame;
}

function ensureMultiObserverFrame(target: FrontierLodMultiObserverFrame | undefined, size: number): FrontierLodMultiObserverFrame {
  const frame = target ?? createLodMultiObserverFrame(size);
  if (frame.levels.length < size) {
    frame.levels = new Int16Array(size);
    frame.visible = new Uint8Array(size);
    frame.observerIndexes = new Int32Array(size);
    frame.observerIndexes.fill(-1);
  }
  return frame;
}

function compileProfile(profile: FrontierLodProfile): CompiledLodProfile {
  const count = profile.levels.length;
  const levelIds = new Array<string>(count);
  const lanes = new Array<string>(count);
  const maxDistances = new Float64Array(count);
  const maxDistanceSquares = new Float64Array(count);
  const minScreenCoverages = new Float64Array(count);
  const renderCosts = new Float64Array(count);
  const computeCosts = new Float64Array(count);
  const updateIntervalsMs = new Float64Array(count);
  const visible = new Uint8Array(count);
  for (let i = 0; i < count; i++) {
    const level = profile.levels[i];
    levelIds[i] = level.id;
    lanes[i] = level.lane ?? 'lod';
    maxDistances[i] = level.maxDistance ?? Number.POSITIVE_INFINITY;
    maxDistanceSquares[i] = maxDistances[i] * maxDistances[i];
    minScreenCoverages[i] = level.minScreenCoverage ?? Number.NEGATIVE_INFINITY;
    renderCosts[i] = levelRenderCost(level);
    computeCosts[i] = levelComputeCost(level);
    updateIntervalsMs[i] = levelUpdateInterval(level);
    visible[i] = level.visible === false ? 0 : 1;
  }
  return {
    mode: profile.mode ?? 'distance',
    count,
    levelIds,
    lanes,
    maxDistances,
    maxDistanceSquares,
    minScreenCoverages,
    renderCosts,
    computeCosts,
    updateIntervalsMs,
    visible
  };
}

function selectCompiledLevel(profile: CompiledLodProfile, distance: number, coverage: number, qualityBias: number, mode: FrontierLodMode): number {
  if (profile.count === 0) return NO_LEVEL;
  if (mode === 'screen' || mode === 'priority') {
    for (let i = 0; i < profile.count; i++) {
      if (coverage >= profile.minScreenCoverages[i] / qualityBias) return i;
    }
    return profile.count - 1;
  }
  for (let i = 0; i < profile.count; i++) {
    if (distance <= profile.maxDistances[i] * qualityBias) return i;
  }
  return profile.count - 1;
}

function nextCheaperCompiledLevel(profile: CompiledLodProfile, levelIndex: number): number {
  if (levelIndex < 0) return levelIndex;
  const currentCost = compactRenderCost(profile, levelIndex) + compactComputeCost(profile, levelIndex);
  for (let i = levelIndex + 1; i < profile.count; i++) {
    if (profile.visible[i] === 0 || profile.renderCosts[i] + profile.computeCosts[i] <= currentCost) return i;
  }
  return levelIndex;
}

function compactRenderCost(profile: CompiledLodProfile, levelIndex: number): number {
  return levelIndex >= 0 && levelIndex < profile.count ? profile.renderCosts[levelIndex] : 0;
}

function compactComputeCost(profile: CompiledLodProfile, levelIndex: number): number {
  return levelIndex >= 0 && levelIndex < profile.count ? profile.computeCosts[levelIndex] : 0;
}

function normalizeSnapshot(input: FrontierLodInput): FrontierLodSnapshot {
  const raw = isSnapshot(input)
    ? input
    : {
        kind: FRONTIER_LOD_SET_KIND,
        version: FRONTIER_LOD_SET_VERSION,
        profiles: Array.from(input.profiles),
        items: Array.from(input.items),
        metadata: input.metadata
      };
  const profiles = raw.profiles.map(normalizeProfile).filter((profile) => profile.levels.length > 0);
  if (profiles.length === 0) profiles[0] = normalizeProfile({ id: 'default', levels: [lodLevel('full'), lodLevel('culled', { visible: false })] });
  const knownProfiles = new Set(profiles.map((profile) => profile.id));
  const defaultProfile = profiles[0].id;
  return {
    kind: FRONTIER_LOD_SET_KIND,
    version: FRONTIER_LOD_SET_VERSION,
    profiles,
    items: raw.items.map((item) => {
      const normalized = normalizeItem(item);
      if (!normalized.profile || !knownProfiles.has(normalized.profile)) normalized.profile = defaultProfile;
      return normalized;
    }),
    metadata: raw.metadata ? { ...raw.metadata } : undefined
  };
}

function normalizeProfile(profile: FrontierLodProfile): FrontierLodProfile {
  return {
    id: String(profile.id || 'default'),
    mode: profile.mode ?? 'distance',
    levels: profile.levels.map(normalizeLevel),
    metadata: profile.metadata ? { ...profile.metadata } : undefined
  };
}

function normalizeLevel(level: FrontierLodLevel): FrontierLodLevel {
  return {
    id: String(level.id || 'level'),
    maxDistance: finiteOptional(level.maxDistance),
    minScreenCoverage: finiteOptional(level.minScreenCoverage),
    renderCost: nonNegative(level.renderCost, 1),
    computeCost: nonNegative(level.computeCost, 1),
    updateIntervalMs: level.updateIntervalMs === undefined ? 0 : finiteOr(level.updateIntervalMs, -1),
    lane: level.lane,
    visible: level.visible,
    metadata: level.metadata ? { ...level.metadata } : undefined
  };
}

function normalizeItem(item: FrontierLodItem): FrontierLodItem {
  return {
    id: String(item.id),
    profile: item.profile,
    x: finiteOr(item.x, 0),
    y: finiteOr(item.y, 0),
    z: finiteOr(item.z, 0),
    radius: nonNegative(item.radius, DEFAULT_RADIUS),
    priority: nonNegative(item.priority, DEFAULT_PRIORITY),
    weight: nonNegative(item.weight, DEFAULT_WEIGHT),
    enabled: item.enabled,
    category: item.category,
    metadata: item.metadata ? { ...item.metadata } : undefined
  };
}

function cloneSnapshot(snapshot: FrontierLodSnapshot): FrontierLodSnapshot {
  return {
    kind: FRONTIER_LOD_SET_KIND,
    version: FRONTIER_LOD_SET_VERSION,
    profiles: snapshot.profiles.map((profile) => ({
      id: profile.id,
      mode: profile.mode,
      levels: profile.levels.map((level) => ({
        id: level.id,
        maxDistance: level.maxDistance,
        minScreenCoverage: level.minScreenCoverage,
        renderCost: level.renderCost,
        computeCost: level.computeCost,
        updateIntervalMs: level.updateIntervalMs,
        lane: level.lane,
        visible: level.visible,
        metadata: level.metadata ? { ...level.metadata } : undefined
      })),
      metadata: profile.metadata ? { ...profile.metadata } : undefined
    })),
    items: snapshot.items.map((item) => ({ ...item, metadata: item.metadata ? { ...item.metadata } : undefined })),
    metadata: snapshot.metadata ? { ...snapshot.metadata } : undefined
  };
}

function isSnapshot(input: FrontierLodInput): input is FrontierLodSnapshot {
  return !!input && (input as FrontierLodSnapshot).kind === FRONTIER_LOD_SET_KIND;
}

function normalizeObserver(observer: FrontierLodObserver): FrontierLodObserver {
  return {
    x: finiteOr(observer.x, 0),
    y: finiteOr(observer.y, 0),
    z: finiteOr(observer.z, 0),
    fovY: finiteOr(observer.fovY, DEFAULT_FOV_Y),
    viewportHeight: finiteOr(observer.viewportHeight, DEFAULT_VIEWPORT_HEIGHT),
    pixelRatio: finiteOr(observer.pixelRatio, 1),
    qualityBias: finiteOr(observer.qualityBias, 1)
  };
}

function selectLevel(
  profile: FrontierLodProfile,
  distance: number,
  coverage: number,
  qualityBias: number,
  hysteresisRatio: number,
  previousLevel: number,
  mode: FrontierLodMode | undefined
): number {
  const levels = profile.levels;
  if (levels.length === 0) return NO_LEVEL;
  const activeMode = mode ?? profile.mode ?? 'distance';
  if (previousLevel >= 0 && previousLevel < levels.length && hysteresisRatio > 0) {
    const previous = levels[previousLevel];
    if (previous.visible !== false) {
      if (activeMode === 'screen' && previous.minScreenCoverage !== undefined) {
        if (coverage >= previous.minScreenCoverage * Math.max(0, 1 - hysteresisRatio)) return previousLevel;
      } else if (previous.maxDistance !== undefined && distance <= previous.maxDistance * (1 + hysteresisRatio)) {
        return previousLevel;
      }
    }
  }
  if (activeMode === 'screen') {
    for (let i = 0; i < levels.length; i++) {
      const minCoverage = levels[i].minScreenCoverage;
      if (minCoverage === undefined || coverage >= minCoverage / qualityBias) return i;
    }
    return levels.length - 1;
  }
  if (activeMode === 'priority') {
    const priorityDistance = coverage * qualityBias;
    for (let i = 0; i < levels.length; i++) {
      const minCoverage = levels[i].minScreenCoverage;
      if (minCoverage === undefined || priorityDistance >= minCoverage) return i;
    }
    return levels.length - 1;
  }
  for (let i = 0; i < levels.length; i++) {
    const maxDistance = levels[i].maxDistance;
    if (maxDistance === undefined || distance <= maxDistance * qualityBias) return i;
  }
  return levels.length - 1;
}

function isOverBudget(budget: FrontierLodBudget, visibleCount: number, renderCost: number, computeCost: number): boolean {
  return (budget.maxVisible !== undefined && visibleCount > budget.maxVisible) ||
    (budget.maxRenderCost !== undefined && renderCost > budget.maxRenderCost) ||
    (budget.maxComputeCost !== undefined && computeCost > budget.maxComputeCost);
}

function screenCoverage(radius: number, distance: number, focal: number, viewportHeight: number): number {
  if (distance <= EPSILON) return 1;
  const diameterPixels = (2 * radius * focal) / distance;
  const normalized = diameterPixels / Math.max(1, viewportHeight);
  return Math.max(0, Math.min(1, normalized * normalized));
}

function significanceScore(distance: number, coverage: number, priority: number, weight: number, mode: FrontierLodMode): number {
  if (mode === 'screen') return priority * weight * coverage;
  if (mode === 'priority') return priority * weight * (coverage + 1 / (distance + 1));
  return priority * weight / (distance + 1);
}

function focalPixels(observer: FrontierLodObserver): number {
  const viewportHeight = observer.viewportHeight ?? DEFAULT_VIEWPORT_HEIGHT;
  const pixelRatio = observer.pixelRatio ?? 1;
  const fovY = Math.max(EPSILON, observer.fovY ?? DEFAULT_FOV_Y);
  return (viewportHeight * pixelRatio * 0.5) / Math.tan(fovY * 0.5);
}

function scoreBucket(score: number): number {
  const normalized = score / (score + 1);
  return Math.max(0, Math.min(63, Math.floor(normalized * 63)));
}

function levelRenderCost(level: FrontierLodLevel): number {
  return level.visible === false ? 0 : nonNegative(level.renderCost, 1);
}

function levelComputeCost(level: FrontierLodLevel): number {
  return level.visible === false ? 0 : nonNegative(level.computeCost, 1);
}

function levelUpdateInterval(level: FrontierLodLevel): number {
  return level.visible === false ? -1 : finiteOr(level.updateIntervalMs, 0);
}

function isItemScalarField(value: string | number): boolean {
  return value === 'x' || value === 'y' || value === 'z' || value === 'radius' ||
    value === 'priority' || value === 'weight' || value === 'enabled' || value === 'profile';
}

function finiteOptional(value: number | undefined): number | undefined {
  return Number.isFinite(value) ? value : undefined;
}

function finiteOr(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) ? value as number : fallback;
}

function nonNegative(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && (value as number) >= 0 ? value as number : fallback;
}
