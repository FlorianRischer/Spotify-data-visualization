// Graph Store — manages graph data, visible set, positions
import { writable, derived, get } from "svelte/store";
import type { GraphData, GenreNode, GenreEdge } from "$lib/graph/types";

// ============ Graph Data ============
export const graphData = writable<GraphData | null>(null);

// ============ Visible State ============
interface VisibleState {
  nodes: Set<string>;
  edges: Set<string>;
  pinned: Set<string>;
}

export const visibleState = writable<VisibleState>({
  nodes: new Set(),
  edges: new Set(),
  pinned: new Set()
});

// ============ Layout Positions ============
export const positions = writable<Record<string, { x: number; y: number }>>({});

// ============ Derived Stores ============
export const visibleNodes = derived(
  [graphData, visibleState, positions],
  ([$g, $v, $p]) => {
    if (!$g) return [];
    return $g.nodes
      .filter((n) => $v.nodes.has(n.id))
      .map((n) => ({
        ...n,
        x: $p[n.id]?.x ?? 0,
        y: $p[n.id]?.y ?? 0,
        isPinned: $v.pinned.has(n.id)
      }));
  }
);

// PERFORMANCE OPTIMIZATION: Only compute visible edge set once (not on every frame)
// Position updates are done in the renderer directly to avoid derived store recalculation
export const visibleEdges = derived(
  [graphData, visibleState],
  ([$g, $v]) => {
    if (!$g) return [];
    // Return base edges without position calculation - positions are applied in renderer
    return $g.edges.filter((e) => $v.edges.has(e.id));
  }
);

export const topK = derived(graphData, ($g) => $g?.topK ?? []);

// ============ Actions ============
export function initVisible() {
  const g = get(graphData);
  if (!g) return;
  
  // Show ALL genres from the start
  const nodes = new Set(g.nodes.map(n => n.id));
  
  const edges = new Set<string>();
  
  for (const e of g.edges) {
    if (nodes.has(e.source) && nodes.has(e.target)) {
      edges.add(e.id);
    }
  }
  
  visibleState.set({ nodes, edges, pinned: new Set() });
}

function addVisibleNode(nodeId: string) {
  const g = get(graphData);
  if (!g) return;
  
  visibleState.update((state) => {
    const nodes = new Set(state.nodes);
    nodes.add(nodeId);
    
    const edges = new Set(state.edges);
    for (const e of g.edges) {
      if (nodes.has(e.source) && nodes.has(e.target)) {
        edges.add(e.id);
      }
    }
    
    return { ...state, nodes, edges };
  });
}

export function addNeighbors(nodeId: string, limit = 8): string[] {
  const g = get(graphData);
  if (!g) return [];
  
  const neighbors = g.adjacency[nodeId] || [];
  const added: string[] = [];
  const currentVisible = get(visibleState).nodes;
  
  for (const n of neighbors.slice(0, limit)) {
    if (!currentVisible.has(n.neighborId)) {
      addVisibleNode(n.neighborId);
      added.push(n.neighborId);
    }
  }
  
  return added;
}

function pinNode(nodeId: string) {
  visibleState.update((state) => {
    const pinned = new Set(state.pinned);
    pinned.add(nodeId);
    const nodes = new Set(state.nodes);
    nodes.add(nodeId);
    return { ...state, nodes, pinned };
  });
}

function unpinNode(nodeId: string) {
  visibleState.update((state) => {
    const pinned = new Set(state.pinned);
    pinned.delete(nodeId);
    return { ...state, pinned };
  });
}

export function togglePin(nodeId: string) {
  const state = get(visibleState);
  if (state.pinned.has(nodeId)) {
    unpinNode(nodeId);
  } else {
    pinNode(nodeId);
  }
}

export function setPositions(newPositions: Record<string, { x: number; y: number }>) {
  positions.set(newPositions);
}
