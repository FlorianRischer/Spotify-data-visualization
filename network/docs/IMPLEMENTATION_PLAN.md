# Implementation Plan
## Musical Brain Activity — Neural Network Graph
**Version:** 1.0.0  
**Datum:** 12. Dezember 2025  
**Status:** In Progress

---

## 1. Architektur & Rendering
- **Rendering-Stack:** SvelteKit + TypeScript, Client-only für Graph. Empfehlung: **Canvas/WebGL** (via `pixi.js` oder `sigma.js`/`graphology` backend) für Performance >300 sichtbare Nodes. Alternative: **d3-force** + Canvas. SVG nur für kleine Debug-Overlays.
- **Layout:** Force-directed mit deterministischem Seed. Positionen werden gecacht (per Hash aus Dataset + Seed). Stabilisierung: frühes Simulieren off-thread (Web Worker optional) und dann einfrieren, danach nur leichte Nudge bei Expansion.
- **State-Slices:**
  - `graphStore`: Nodes, Edges, adjacency map, visible set.
  - `layoutStore`: Positions, velocities (if simulated), seed.
  - `uiStore`: hover target, pinned set, expansion queue, reducedMotion flag.
- **Services:**
  - `graphBuilder`: baut Nodes/Edges/Weights/Adjacency.
  - `layoutEngine`: übernimmt Simulation/Positionscache.
  - `interactionEngine`: Hover/Pins/Reset/Debounce.
  - `renderer`: Canvas/WebGL draw loop, batching, LOD.

## 2. Datenpipeline
1) **Ingest & Normalize**: Lade Streaming-History; mappe Tracks → Artists → Genres. Filtere unknown/empty.
2) **Aggregate Genre Metrics**: Summe Playcount und totalMinutes pro Genre; berechne `size = clamp(sqrt(playCount) * k, minSize, maxSize)`.
3) **Edge Construction**:
   - Multi-genre Artists: für jedes Genre-Paar eines Artists `weight++ (kind="multi-genre")`.
   - Kollabo-Tracks: wenn Track Artists mit unterschiedlichen Genres hat → Paare der beteiligten Genres `weight++ (kind="collab")`.
   - Merge Kanten gleicher Paare; setze `kind="mixed"` falls beide Quellen beitragen.
4) **Adjacency Map**: `adj[genreId] = [{ neighborId, weight, kind }]` für O(1) Nachbarsuche.
5) **Top-3 Detection**: Sortiere Genres nach Playcount/totalMinutes (deterministisch) → Startset.
6) **Derive Visible Graph**: `visibleNodes = top3`, `visibleEdges = edges touching visibleNodes` (gefiltert). Bereite Expansion-Queue vor.
7) **Position Seed**: Erzeuge Seed aus Hash(dataset fingerprint) → init layout.
8) **Cache**: Persistiere Layout-Positions (per fingerprint) in localStorage oder precomputed JSON.

## 3. Interaktionslogik
- **Hover Detection:** Hit-Test auf Nodes (circle radius = rendered size). Optional spatial index (quadtree) für große Graphs.
- **Expansion Queue:** Beim Hover wird 1-Hop Nachbarn in Batch (z.B. max 8 auf einmal) in die Render-Pipeline gestellt. Rate-Limit (e.g. 1 batch per 120 ms). Debounce beim Mouseleave (150 ms) bevor Entfernen.
- **State Machine (vereinfachte):**
  - `idle` → `hovering(node)` → `expanding` (queue neighbors) → `stable` (after draw) → back to `hovering` oder `idle`.
  - `pinning`: Click toggelt `pinned` Flag; pinned Nodes bleiben im Visible-Set, Edges bleiben; Hover-Expansion darf von gepinnten Nodes ausgehen.
  - `reset`: Clear visible to Top-3, clear pins, clear queue.
- **Determinismus:** Sortiere Nachbarn nach `weight desc, label asc` vor Einfügen; gleiche Seeds für Force.
- **Visibility Rules:**
  - Beim Hover: add neighbors; hide only wenn kein Hover-Context und Node nicht pinned; apply grace period.
  - Optional: Depth cap (z.B. max Expansion Depth 4) um Explosion zu vermeiden.

## 4. Layout & Rendering
- **Force Layout:** d3-force (forceManyBody, forceLink, forceCollide). Parameters from dataset size; clamp velocities; alpha decay; stop once stable. Freeze positions, reuse for future renders.
- **Rendering Strategy:**
  - Canvas/WebGL draw loop mit `requestAnimationFrame`.
  - Batch draw: sort nodes by size for painter's order; draw edges first (low alpha).
  - LOD: Wenn >400 edges sichtbar, reduziere alpha oder stroke width; evtl. nur subset zeichnen.
  - Animations: scale/opacity-in für neue Nodes/Edges (200–400 ms). Respect reducedMotion toggle.
- **Hit-Testing:** Separate interaction layer oder reuse quadtree of node positions.

## 5. Performance-Strategien
- Adjacency map + sets für O(1) lookups.
- Precompute layout off-main-thread (Web Worker optional): Worker accepts graph payload + seed, returns positions. Main thread renders only.
- Progressive rendering: first draw nodes, then edges; large batches chunked via microtasks.
- Memoization: cache visible neighbor lists per node to avoid recompute during repeated hovers.
- Avoid O(n^2) in hover loop; never iterate full edge list on hover.

## 6. Testplan
- **Unit:**
  - Graph building: nodes/edges counts, weight aggregation, top-3 selection determinism.
  - Adjacency map correctness (neighbors match edge list).
- **Determinismus:** Same input + seed → identical positions/order (snapshot positions hash).
- **Interaction:** Hover adds correct neighbors; debounce prevents flicker; reset works; pinned nodes persist.
- **Performance Smoke:** 300 nodes/800 edges visible reach >=50 FPS on reference laptop; hover latency <100 ms.
- **Accessibility:** Keyboard navigation (Tab/Enter/Esc); reducedMotion disables scale animations.

## 7. Datei-/Ordnerstruktur (Vorschlag)
```
src/
  lib/
    graph/
      graphBuilder.ts        # build nodes/edges/adjacency/top3
      layoutEngine.ts        # force sim, seed, cache
      interaction.ts         # hover/pin/reset state machine
      renderer.ts            # canvas/webgl drawing + LOD
      types.ts               # Graph types
    stores/
      graphStore.ts          # writable stores for nodes/edges/visible
      uiStore.ts             # hover target, pinned, reducedMotion
    components/
      GraphCanvas.svelte     # renders canvas, handles events
      ControlPanel.svelte    # reset, reducedMotion, pin indicators
      Legend.svelte          # optional counts
```

## 8. TypeScript Interfaces (Kern)
```ts
export interface GenreNode {
  id: string;
  label: string;
  playCount: number;
  totalMinutes: number;
  size: number;
  degree: number;
  color?: string;
  pinned?: boolean;
}

export type EdgeKind = "multi-genre" | "collab" | "mixed";

export interface GenreEdge {
  id: string; // `${source}-${target}`
  source: string;
  target: string;
  weight: number;
  kind: EdgeKind;
  examples?: string[]; // artistIds or trackIds
}

export interface AdjacencyEntry {
  neighborId: string;
  weight: number;
  kind: EdgeKind;
}

export interface GraphData {
  nodes: GenreNode[];
  edges: GenreEdge[];
  adjacency: Record<string, AdjacencyEntry[]>;
  top3: string[];
}
```

## 9. Web Worker (optional)
- **Message In:** `{ nodes, edges, seed }`.
- **Message Out:** `{ positions: Record<nodeId, { x: number; y: number }>, seed }`.
- Deterministischer RNG im Worker; layoutEngine merges positions into store.

## 10. Deployment / Config
- Reduced-motion Default: OS `prefers-reduced-motion` respektieren; UI Toggle erlaubt Override.
- Configurable thresholds: maxVisibleNeighbors, hoverDelay, hideDelay, depthCap.

## 11. Changelog
- **12.12.2025:** Initialer Implementierungsplan für "Musical Brain Activity" Graph erstellt.
