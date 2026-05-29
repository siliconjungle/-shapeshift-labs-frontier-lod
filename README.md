# @shapeshift-labs/frontier-lod

Patch-native level-of-detail and significance primitives for Frontier rendering and computation workloads. The package stores LOD profiles and item state as JSON, accepts Frontier patch tuples for mutation, and keeps hot distance/significance state in typed-array caches.

- npm: [`@shapeshift-labs/frontier-lod`](https://www.npmjs.com/package/@shapeshift-labs/frontier-lod)
- source: [`siliconjungle/-shapeshift-labs-frontier-lod`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lod)

## API Shape

```ts
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
  setLodItemPositionPatch
} from '@shapeshift-labs/frontier-lod';

const profile = lodProfile('npc', [
  lodLevel('full', { maxDistance: 20, renderCost: 8, computeCost: 8, updateIntervalMs: 16, lane: 'near' }),
  lodLevel('sim', { maxDistance: 80, renderCost: 3, computeCost: 2, updateIntervalMs: 120, lane: 'mid' }),
  lodLevel('coarse', { maxDistance: 220, renderCost: 1, computeCost: 1, updateIntervalMs: 1000, lane: 'far' }),
  lodLevel('culled', { visible: false, renderCost: 0, computeCost: 0, updateIntervalMs: -1 })
]);

const lod = createLodEngine({
  profiles: [profile],
  items: [
    lodItem('npc:1', 0, 0, { profile: 'npc', radius: 1, priority: 2 }),
    lodItem('npc:2', 90, 0, { profile: 'npc', radius: 1 })
  ]
});

const frame = lod.evaluate({ x: 0, y: 0 }, {
  includeHidden: true,
  budget: { maxVisible: 2000, maxRenderCost: 8000, maxComputeCost: 5000 }
});

const materialized = materializeLodFrame(frame);
const workPlan = createLodWorkPlan(frame, { nowMs: performance.now() });
scheduleLodWork(scheduler, workPlan, (item) => updateNpc(item.id, item.levelId));

lod.commit(setLodItemPositionPatch(1, 40, 0), {
  origin: { actionId: 'npc.move', causeId: 'pathfinding.tick' }
});

const compact = lod.evaluateInto(createLodCompactFrame(lod.itemCount), { x: 0, y: 0 }, { mode: 'distance' });
const bands = lod.evaluateBandsInto(createLodBandFrame(lod.itemCount), { x: 0, y: 0 });
const transitions = lod.evaluateBandTransitionsInto(createLodTransitionFrame(lod.itemCount), { x: 0, y: 0 });
const sharedWorld = lod.evaluateMultiObserverInto(createLodMultiObserverFrame(lod.itemCount), [
  { x: 0, y: 0 },
  { x: 300, y: 0, qualityBias: 0.9 }
]);
```

## Design Notes

`frontier-lod` deliberately does not own a renderer, virtualizer, scene graph, pathfinder, game loop, or scheduler. It produces JSON-shaped frames for inspection/persistence and typed-array frames for hot loops.

- JSON snapshots are the durable LOD state.
- Frontier patch tuples are the mutation format.
- Item scalar changes update typed caches by exact item index.
- Profiles support distance, screen-coverage, and priority/significance selection.
- LOD levels carry render cost, compute cost, lane, update interval, visibility, and metadata.
- Budgeted evaluation degrades lower-significance items when render/compute/visible budgets are exceeded.
- `evaluate(...)` produces a serializable inspection/materialization frame.
- `evaluateInto(...)` reuses typed buffers for per-frame distance/screen/priority loops.
- `evaluateBandsInto(...)` is a distance-band-only hot path for very large homogeneous sets.
- `evaluateBandTransitionsInto(...)` is a Unity CullingGroup-style event path: it keeps internal band state current but only materializes changed indexes, previous levels, and next levels.
- `evaluateMultiObserverInto(...)` selects one shared LOD frame across several cameras, spectators, minimaps, AI-interest origins, or server-relevance observers without requiring separate full frames and a merge pass.
- `materializeLodFrame(...)` exposes visible/hidden/by-level index lists for DOM, Canvas, WebGL, WebGPU, or game hosts.
- `createLodWorkPlan(...)` converts levels and update intervals into scheduler-friendly compute tasks.
- Scheduler integration is structural, so `frontier-scheduler` can queue work without becoming a dependency.
- Scene/virtual/pathfinding integration stays data-shaped: scene graphs can feed world positions, virtualizers can materialize visible indexes, and pathfinding/game systems can lower update cadence for far or low-priority entities.

## Related Packages

The published Frontier package family is generated from one shared package catalog so READMEs stay in sync across packages:

- [`@shapeshift-labs/frontier`](https://www.npmjs.com/package/@shapeshift-labs/frontier): Core JSON diff/apply, compact patch tuples, JSON Pointer, equality, clone, validation, Unicode helpers, and tiny dependency-free runtime budget/scheduler primitives.
- [`@shapeshift-labs/frontier-query`](https://www.npmjs.com/package/@shapeshift-labs/frontier-query): Shared query-key, selector path, condition, entity identity, and table-shape primitives.
- [`@shapeshift-labs/frontier-codec`](https://www.npmjs.com/package/@shapeshift-labs/frontier-codec): Patch serialization, binary frames, canonical JSON, and patch-history codecs.
- [`@shapeshift-labs/frontier-engine`](https://www.npmjs.com/package/@shapeshift-labs/frontier-engine): Stateful planned diff engine, adaptive profiles, schema plans, and engine-level history helpers.
- [`@shapeshift-labs/frontier-state`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state): Patch-routed app-state subscriptions, owned commits, maintained views, and path mapping.
- [`@shapeshift-labs/frontier-state-cache`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state-cache): Normalized query-result cache with entity/query watchers, persistence, change logs, optimistic layers, scheduled persistence, and mutation bridge.
- [`@shapeshift-labs/frontier-state-cache-idb`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state-cache-idb): IndexedDB persistence adapter for Frontier state-cache snapshots and durable change logs.
- [`@shapeshift-labs/frontier-state-cache-file`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state-cache-file): Structured file persistence adapter for Frontier state-cache snapshots and change logs.
- [`@shapeshift-labs/frontier-state-cache-sql`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state-cache-sql): SQL persistence adapter for Frontier state-cache snapshots and change logs.
- [`@shapeshift-labs/frontier-schema`](https://www.npmjs.com/package/@shapeshift-labs/frontier-schema): JSON Schema validation, Frontier profile generation, CloudEvent envelopes, and query/table schema helpers.
- [`@shapeshift-labs/frontier-event-log`](https://www.npmjs.com/package/@shapeshift-labs/frontier-event-log): Bounded event logs, replay cursors, consumer acknowledgements, keyed compaction, checkpoints, and Frontier patch event records.
- [`@shapeshift-labs/frontier-scheduler`](https://www.npmjs.com/package/@shapeshift-labs/frontier-scheduler): Deterministic work scheduling, lanes, cancellation, backpressure, frame policies, replay snapshots, and work graphs.
- [`@shapeshift-labs/frontier-logging`](https://www.npmjs.com/package/@shapeshift-labs/frontier-logging): Opt-in structured logging, browser telemetry, scheduled sinks, file sinks, exporters, benchmark traces, and Frontier patch/update summaries.
- [`@shapeshift-labs/frontier-mutation`](https://www.npmjs.com/package/@shapeshift-labs/frontier-mutation): Explicit mutation and selector plans compiled to Frontier patches or CRDT operations.
- [`@shapeshift-labs/frontier-virtual`](https://www.npmjs.com/package/@shapeshift-labs/frontier-virtual): DOM-neutral virtualization, layout providers, range materialization, grids, spatial/frustum indexes, patch invalidation, camera anchors, and serializable layout state.
- [`@shapeshift-labs/frontier-scene`](https://www.npmjs.com/package/@shapeshift-labs/frontier-scene): Patch-native 2D/3D scene graph, transform propagation, bounds queries, virtual/culling adapters, spatial invalidation, and camera/frustum materialization.
- [`@shapeshift-labs/frontier-pathfinding`](https://www.npmjs.com/package/@shapeshift-labs/frontier-pathfinding): Patch-native grid pathfinding, typed-array A*/Dijkstra search, flow fields, connected components, line-of-sight smoothing, dirty-cell invalidation, and scheduler-friendly path jobs.
- [`@shapeshift-labs/frontier-dom`](https://www.npmjs.com/package/@shapeshift-labs/frontier-dom): Patch-native DOM and host renderer bindings, manifest hydration, JSX runtime/compiler helpers, SSR, devtools, and logging bridges.
- [`@shapeshift-labs/frontier-playwright`](https://www.npmjs.com/package/@shapeshift-labs/frontier-playwright): Playwright/headless automation probes for Frontier state, DOM, devtools, marks, and timeline queries.
- [`@shapeshift-labs/frontier-crdt`](https://www.npmjs.com/package/@shapeshift-labs/frontier-crdt): Native CRDT documents, update tooling, awareness, branches, conflict introspection, version frames, and undo.
- [`@shapeshift-labs/frontier-crdt-sync`](https://www.npmjs.com/package/@shapeshift-labs/frontier-crdt-sync): CRDT sync endpoints, repo/storage/provider contracts, scheduled sync work, document URLs, local networks, model checking, forensics, and text binding contracts.
- [`@shapeshift-labs/frontier-crdt-websocket`](https://www.npmjs.com/package/@shapeshift-labs/frontier-crdt-websocket): WebSocket client/server transports for Frontier CRDT sync providers.
- [`@shapeshift-labs/frontier-react`](https://www.npmjs.com/package/@shapeshift-labs/frontier-react): React external-store hooks and adapters for Frontier state, cache, and CRDT surfaces.
- [`@shapeshift-labs/frontier-richtext`](https://www.npmjs.com/package/@shapeshift-labs/frontier-richtext): Rich text Delta normalization/application, marks, embeds, ranges, and cursor/selection transforms for local editor integrations.
- [`@shapeshift-labs/frontier-realtime`](https://www.npmjs.com/package/@shapeshift-labs/frontier-realtime): Shared realtime command, tick, snapshot, prediction, reconciliation, interpolation, rollback, message, and delta primitives.
- [`@shapeshift-labs/frontier-realtime-server`](https://www.npmjs.com/package/@shapeshift-labs/frontier-realtime-server): Authoritative realtime room, tick, command validation, rate-limit, session, and snapshot-history runtime.
- [`@shapeshift-labs/frontier-realtime-websocket`](https://www.npmjs.com/package/@shapeshift-labs/frontier-realtime-websocket): WebSocket client, wire, and Node room-server transport for Frontier realtime.
- [`@shapeshift-labs/frontier-game`](https://www.npmjs.com/package/@shapeshift-labs/frontier-game): Game-facing entity, component, player, room, ownership, spatial interest, rollback, physics, and replication helpers above realtime.

Package source repositories:

- [`siliconjungle/-shapeshift-labs-frontier`](https://github.com/siliconjungle/-shapeshift-labs-frontier)
- [`siliconjungle/-shapeshift-labs-frontier-query`](https://github.com/siliconjungle/-shapeshift-labs-frontier-query)
- [`siliconjungle/-shapeshift-labs-frontier-codec`](https://github.com/siliconjungle/-shapeshift-labs-frontier-codec)
- [`siliconjungle/-shapeshift-labs-frontier-engine`](https://github.com/siliconjungle/-shapeshift-labs-frontier-engine)
- [`siliconjungle/-shapeshift-labs-frontier-state`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state)
- [`siliconjungle/-shapeshift-labs-frontier-state-cache`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state-cache)
- [`siliconjungle/-shapeshift-labs-frontier-state-cache-idb`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state-cache-idb)
- [`siliconjungle/-shapeshift-labs-frontier-state-cache-file`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state-cache-file)
- [`siliconjungle/-shapeshift-labs-frontier-state-cache-sql`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state-cache-sql)
- [`siliconjungle/-shapeshift-labs-frontier-schema`](https://github.com/siliconjungle/-shapeshift-labs-frontier-schema)
- [`siliconjungle/-shapeshift-labs-frontier-event-log`](https://github.com/siliconjungle/-shapeshift-labs-frontier-event-log)
- [`siliconjungle/-shapeshift-labs-frontier-scheduler`](https://github.com/siliconjungle/-shapeshift-labs-frontier-scheduler)
- [`siliconjungle/-shapeshift-labs-frontier-logging`](https://github.com/siliconjungle/-shapeshift-labs-frontier-logging)
- [`siliconjungle/-shapeshift-labs-frontier-mutation`](https://github.com/siliconjungle/-shapeshift-labs-frontier-mutation)
- [`siliconjungle/-shapeshift-labs-frontier-virtual`](https://github.com/siliconjungle/-shapeshift-labs-frontier-virtual)
- [`siliconjungle/-shapeshift-labs-frontier-scene`](https://github.com/siliconjungle/-shapeshift-labs-frontier-scene)
- [`siliconjungle/-shapeshift-labs-frontier-pathfinding`](https://github.com/siliconjungle/-shapeshift-labs-frontier-pathfinding)
- [`siliconjungle/-shapeshift-labs-frontier-lod`](https://github.com/siliconjungle/-shapeshift-labs-frontier-lod)
- [`siliconjungle/-shapeshift-labs-frontier-dom`](https://github.com/siliconjungle/-shapeshift-labs-frontier-dom)
- [`siliconjungle/-shapeshift-labs-frontier-playwright`](https://github.com/siliconjungle/-shapeshift-labs-frontier-playwright)
- [`siliconjungle/-shapeshift-labs-frontier-crdt`](https://github.com/siliconjungle/-shapeshift-labs-frontier-crdt)
- [`siliconjungle/-shapeshift-labs-frontier-crdt-sync`](https://github.com/siliconjungle/-shapeshift-labs-frontier-crdt-sync)
- [`siliconjungle/-shapeshift-labs-frontier-crdt-websocket`](https://github.com/siliconjungle/-shapeshift-labs-frontier-crdt-websocket)
- [`siliconjungle/-shapeshift-labs-frontier-react`](https://github.com/siliconjungle/-shapeshift-labs-frontier-react)
- [`siliconjungle/-shapeshift-labs-frontier-richtext`](https://github.com/siliconjungle/-shapeshift-labs-frontier-richtext)
- [`siliconjungle/-shapeshift-labs-frontier-realtime`](https://github.com/siliconjungle/-shapeshift-labs-frontier-realtime)
- [`siliconjungle/-shapeshift-labs-frontier-realtime-server`](https://github.com/siliconjungle/-shapeshift-labs-frontier-realtime-server)
- [`siliconjungle/-shapeshift-labs-frontier-realtime-websocket`](https://github.com/siliconjungle/-shapeshift-labs-frontier-realtime-websocket)
- [`siliconjungle/-shapeshift-labs-frontier-game`](https://github.com/siliconjungle/-shapeshift-labs-frontier-game)

## Install

```sh
npm install @shapeshift-labs/frontier-lod
```

## Benchmarks

These are Frontier-only package measurements, not competitor comparisons.

Run package-local measurements:

```sh
npm run bench
```

The benchmark covers 100k-item distance, compact typed-array, distance-band, sparse transition, multi-observer, screen-coverage, priority budget, materialization, scheduler work-plan, and patch-routed position update fixtures.

Latest local package benchmark on Node v26.1.0, darwin arm64, 100k items and 120 rounds:

| Fixture | Median | p95 |
| --- | ---: | ---: |
| `evaluate-bands-distance-100000` | 743.83 us | 844.67 us |
| `evaluate-band-transitions-static-100000` | 603.79 us | 746.46 us |
| `evaluate-multi-observer-distance-100000` | 1.56 ms | 1.76 ms |
| `evaluate-compact-distance-100000` | 1.34 ms | 1.42 ms |
| `evaluate-distance-100000` | 4.11 ms | 4.36 ms |
| `evaluate-screen-100000` | 12.23 ms | 19.68 ms |
| `evaluate-budget-100000` | 17.80 ms | 29.29 ms |
| `materialize-frame-100000` | 777.42 us | 1.13 ms |
| `work-plan-100000` | 5.06 ms | 9.45 ms |
| `patch-128-positions-100000` | 44.21 us | 100.37 us |
