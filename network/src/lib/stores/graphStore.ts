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
export const layoutSeed = writable<number>(1);

// ============ Derived Stores ============
export const visibleNodeIds = derived(visibleState, ($v) => Array.from($v.nodes));
export const visibleEdgeIds = derived(visibleState, ($v) => Array.from($v.edges));
export const pinnedNodeIds = derived(visibleState, ($v) => Array.from($v.pinned));

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

export const visibleEdges = derived(
  [graphData, visibleState, positions],
  ([$g, $v, $p]) => {
    if (!$g) return [];
    return $g.edges
      .filter((e) => $v.edges.has(e.id))
      .map((e) => ({
        ...e,
        x1: $p[e.source]?.x ?? 0,
        y1: $p[e.source]?.y ?? 0,
        x2: $p[e.target]?.x ?? 0,
        y2: $p[e.target]?.y ?? 0
      }));
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

export function addVisibleNode(nodeId: string) {
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

export function pinNode(nodeId: string) {
  visibleState.update((state) => {
    const pinned = new Set(state.pinned);
    pinned.add(nodeId);
    const nodes = new Set(state.nodes);
    nodes.add(nodeId);
    return { ...state, nodes, pinned };
  });
}

export function unpinNode(nodeId: string) {
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

export function reset() {
  initVisible();
}

export function showAllNodes() {
  const g = get(graphData);
  if (!g) return;
  
  // Add all nodes and edges to visible state
  const nodes = new Set(g.nodes.map(n => n.id));
  const edges = new Set(g.edges.map(e => e.id));
  
  visibleState.set({ nodes, edges, pinned: new Set() });
}

export function pruneUnpinned() {
  const g = get(graphData);
  if (!g) return;
  
  visibleState.update((state) => {
    const keepNodes = new Set([...state.pinned, ...g.topK]);
    const nodes = new Set<string>();
    for (const id of keepNodes) {
      nodes.add(id);
    }
    
    const edges = new Set<string>();
    for (const e of g.edges) {
      if (nodes.has(e.source) && nodes.has(e.target)) {
        edges.add(e.id);
      }
    }
    
    return { nodes, edges, pinned: new Set(state.pinned) };
  });
}

export function setPositions(newPositions: Record<string, { x: number; y: number }>) {
  positions.set(newPositions);
}
