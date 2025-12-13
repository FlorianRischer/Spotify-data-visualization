import type { GenreEdge, GenreNode } from "./types";

// Deterministic pseudo-random (Mulberry32)
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFromString(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface LayoutResult {
  positions: Record<string, { x: number; y: number }>;
}

export interface LayoutOptions {
  seed?: number;
  radius?: number; // base radius for initial ring
  iterations?: number; // only for force layout
  chargeStrength?: number;
  linkDistance?: number;
  linkStrength?: number;
  center?: { x: number; y: number };
}

// Simple deterministic radial layout; placeholder until force-sim is wired.
// Keeps angles sorted by totalMinutes (or weight through degree) for stability.
export function computeLayout(
  nodes: GenreNode[],
  edges: GenreEdge[],
  opts: LayoutOptions = {}
): LayoutResult {
  const seed = opts.seed ?? 1;
  const rand = mulberry32(seed);
  const radius = opts.radius ?? 320;

  const sorted = [...nodes].sort((a, b) => {
    if (b.totalMinutes === a.totalMinutes) return a.label.localeCompare(b.label);
    return b.totalMinutes - a.totalMinutes;
  });

  const positions: Record<string, { x: number; y: number }> = {};
  const n = sorted.length || 1;
  const jitter = Math.min(24, radius * 0.08);

  sorted.forEach((node, idx) => {
    const angle = (2 * Math.PI * idx) / n;
    const r = radius * (0.6 + 0.4 * rand());
    const x = r * Math.cos(angle) + (rand() - 0.5) * jitter;
    const y = r * Math.sin(angle) + (rand() - 0.5) * jitter;
    positions[node.id] = { x, y };
  });

  return { positions };
}

// Lightweight deterministic force simulation (no external deps)
// Not physics-accurate like d3-force, but good enough for medium graphs.
export function computeForceLayout(
  nodes: GenreNode[],
  edges: GenreEdge[],
  opts: LayoutOptions = {}
): LayoutResult {
  const seed = opts.seed ?? 1;
  const rand = mulberry32(seed);
  const center = opts.center ?? { x: 0, y: 0 };
  const iterations = opts.iterations ?? 200;
  const chargeStrength = opts.chargeStrength ?? -200; // negative repulsion
  const linkDistance = opts.linkDistance ?? 140;
  const linkStrength = opts.linkStrength ?? 0.1;

  // init positions on a noisy ring
  const radius = opts.radius ?? 320;
  const n = Math.max(nodes.length, 1);
  const positions: Record<string, { x: number; y: number; vx: number; vy: number }> = {};
  nodes.forEach((node, idx) => {
    const angle = (2 * Math.PI * idx) / n;
    const r = radius * (0.6 + 0.4 * rand());
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    positions[node.id] = { x, y, vx: 0, vy: 0 };
  });

  const nodeIndex = new Map<string, number>();
  nodes.forEach((n, i) => nodeIndex.set(n.id, i));

  for (let iter = 0; iter < iterations; iter += 1) {
    // charge (repulsion)
    for (let i = 0; i < nodes.length; i += 1) {
      const ni = nodes[i];
      const pi = positions[ni.id];
      for (let j = i + 1; j < nodes.length; j += 1) {
        const nj = nodes[j];
        const pj = positions[nj.id];
        const dx = pi.x - pj.x;
        const dy = pi.y - pj.y;
        const dist2 = dx * dx + dy * dy + 0.01;
        const force = chargeStrength / dist2;
        const fx = force * dx;
        const fy = force * dy;
        pi.vx += fx;
        pi.vy += fy;
        pj.vx -= fx;
        pj.vy -= fy;
      }
    }

    // links (attraction)
    for (const e of edges) {
      const a = positions[e.source];
      const b = positions[e.target];
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
      const desired = linkDistance;
      const diff = dist - desired;
      const strength = linkStrength;
      const fx = (dx / dist) * diff * strength;
      const fy = (dy / dist) * diff * strength;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }

    // radial restraint: pull high-degree nodes to center, push low-degree to periphery
    const maxDegree = Math.max(...nodes.map(n => n.degree), 1);
    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      const pos = positions[node.id];
      const degreeRatio = node.degree / maxDegree;
      const targetRadius = radius * (0.2 + 0.8 * (1 - degreeRatio)); // high-degree → center (0.2*radius), low-degree → periphery (1.0*radius)
      const currentRadius = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
      const radiusDiff = currentRadius - targetRadius;
      if (currentRadius > 0.01) {
        const radialForce = radiusDiff * 0.002; // gentle force
        const fx = (pos.x / currentRadius) * radialForce;
        const fy = (pos.y / currentRadius) * radialForce;
        pos.vx -= fx;
        pos.vy -= fy;
      }
    }

    // integrate + damping + centering
    const damping = 0.9;
    for (const p of Object.values(positions)) {
      p.vx *= damping;
      p.vy *= damping;
      p.x += p.vx;
      p.y += p.vy;
      // weak centering
      p.x += (center.x - p.x) * 0.002;
      p.y += (center.y - p.y) * 0.002;
    }
  }

  const out: Record<string, { x: number; y: number }> = {};
  for (const [id, p] of Object.entries(positions)) {
    out[id] = { x: p.x, y: p.y };
  }
  return { positions: out };
}

// Hierarchical tree layout - spreads nodes like a tree diagram
export function computeTreeLayout(
  nodes: GenreNode[],
  edges: GenreEdge[],
  opts: LayoutOptions = {}
): LayoutResult {
  const positions: Record<string, { x: number; y: number }> = {};
  
  if (nodes.length === 0) return { positions };
  
  // Build adjacency list
  const adjacency = new Map<string, Set<string>>();
  nodes.forEach(n => adjacency.set(n.id, new Set()));
  edges.forEach(e => {
    adjacency.get(e.source)?.add(e.target);
    adjacency.get(e.target)?.add(e.source);
  });
  
  // Sort nodes by totalMinutes (most important first)
  const sorted = [...nodes].sort((a, b) => b.totalMinutes - a.totalMinutes);
  
  // BFS to assign levels
  const levels = new Map<string, number>();
  const visited = new Set<string>();
  const queue: Array<{ id: string; level: number }> = [];
  
  // Start with top node
  const root = sorted[0];
  queue.push({ id: root.id, level: 0 });
  visited.add(root.id);
  levels.set(root.id, 0);
  
  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    const neighbors = adjacency.get(id) || new Set();
    
    // Sort neighbors by totalMinutes for consistent ordering
    const sortedNeighbors = Array.from(neighbors)
      .map(nid => nodes.find(n => n.id === nid)!)
      .filter(n => n && !visited.has(n.id))
      .sort((a, b) => b.totalMinutes - a.totalMinutes);
    
    for (const neighbor of sortedNeighbors) {
      if (!visited.has(neighbor.id)) {
        visited.add(neighbor.id);
        levels.set(neighbor.id, level + 1);
        queue.push({ id: neighbor.id, level: level + 1 });
      }
    }
  }
  
  // Add unconnected nodes to their own levels
  sorted.forEach(node => {
    if (!visited.has(node.id)) {
      levels.set(node.id, visited.size);
      visited.add(node.id);
    }
  });
  
  // Group nodes by level
  const nodesByLevel = new Map<number, GenreNode[]>();
  nodes.forEach(node => {
    const level = levels.get(node.id) ?? 0;
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, []);
    }
    nodesByLevel.get(level)!.push(node);
  });
  
  // Layout parameters
  const verticalSpacing = 180;
  const horizontalSpacing = 200;
  const startY = -300;
  
  // Position nodes level by level
  const levelNumbers = Array.from(nodesByLevel.keys()).sort((a, b) => a - b);
  
  levelNumbers.forEach(levelNum => {
    const levelNodes = nodesByLevel.get(levelNum)!;
    const y = startY + levelNum * verticalSpacing;
    const totalWidth = (levelNodes.length - 1) * horizontalSpacing;
    const startX = -totalWidth / 2;
    
    levelNodes.forEach((node, idx) => {
      const x = startX + idx * horizontalSpacing;
      positions[node.id] = { x, y };
    });
  });
  
  return { positions };
}

