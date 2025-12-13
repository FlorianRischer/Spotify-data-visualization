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

// ============================================================================
// HIERARCHICAL MAGNETIC FORCE SIMULATION
// ============================================================================
// Physics Model:
// 1. Size-aware collision force: prevents overlap using effective radius
// 2. Inverse-weighted repulsion: small nodes repel stronger (∝ 1/size * 1/dist²)
// 3. Center gravitation for large nodes: keeps important genres in core
// 4. Weak edge forces: show connections but don't dominate
// 5. Damping & cooling: creates stable, non-chaotic motion
// ============================================================================

export function computeForceLayout(
  nodes: GenreNode[],
  edges: GenreEdge[],
  opts: LayoutOptions = {}
): LayoutResult {
  const seed = opts.seed ?? 1;
  const rand = mulberry32(seed);
  const center = opts.center ?? { x: 0, y: 0 };
  const iterations = opts.iterations ?? 200;
  
  // Physics parameters (tuned for hierarchical, non-overlapping layout)
  const linkDistance = opts.linkDistance ?? 220; // increased from 140 for larger graph
  const linkStrength = opts.linkStrength ?? 0.05; // weak edges
  
  // Init positions on a noisy ring
  // Default radius = 500px → ~1000px horizontal spread
  const radius = opts.radius ?? 500;
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

  // Normalize node sizes for repulsion weighting
  const maxSize = Math.max(...nodes.map(n => n.size), 1);
  const minSize = Math.min(...nodes.map(n => n.size), 1);
  const sizeRange = Math.max(maxSize - minSize, 1);
  
  // Normalize totalMinutes for center gravity
  const maxMinutes = Math.max(...nodes.map(n => n.totalMinutes), 1);

  for (let iter = 0; iter < iterations; iter += 1) {
    // === PHASE 1: SIZE-AWARE COLLISION & INVERSE-WEIGHTED REPULSION ===
    // Small nodes repel strongly; large nodes less so
    // This makes smaller genres "bounce" toward periphery naturally
    for (let i = 0; i < nodes.length; i += 1) {
      const ni = nodes[i];
      const pi = positions[ni.id];
      
      for (let j = i + 1; j < nodes.length; j += 1) {
        const nj = nodes[j];
        const pj = positions[nj.id];
        
        const dx = pi.x - pj.x;
        const dy = pi.y - pj.y;
        const dist2 = dx * dx + dy * dy + 0.01;
        const dist = Math.sqrt(dist2);
        
        // Collision radius: based on node size (bigger nodes = bigger radius)
        const radiusFactor = 0.5; // adjust collision bubble size
        const ri = radiusFactor * ni.size;
        const rj = radiusFactor * nj.size;
        const minDist = ri + rj;
        
        // Inverse-weighted repulsion: small nodes repel more
        // Normalize sizes to 0-1 range, invert: small→1, large→0
        const sizePriority_i = (maxSize - ni.size) / sizeRange + 0.5; // small nodes get ~1.0-1.5
        const sizePriority_j = (maxSize - nj.size) / sizeRange + 0.5;
        const repulsionFactor = sizePriority_i * sizePriority_j;
        
        // Repulsion force: increases as distance decreases below minDist
        let force = 0;
        if (dist < minDist) {
          // Exponential push-away for collision avoidance
          force = repulsionFactor * (minDist - dist) * (minDist - dist) * 0.08;
        } else {
          // Gentle repulsion at distance (prevents clustering)
          force = repulsionFactor * 300 / dist2;
        }
        
        const fx = force * (dx / dist);
        const fy = force * (dy / dist);
        
        pi.vx += fx;
        pi.vy += fy;
        pj.vx -= fx;
        pj.vy -= fy;
      }
    }

    // === PHASE 2: WEAK EDGE FORCES (show connections, don't dominate) ===
    // Build edge count per node for dynamic link distance
    const edgeCountPerNode = new Map<string, number>();
    edges.forEach(e => {
      edgeCountPerNode.set(e.source, (edgeCountPerNode.get(e.source) ?? 0) + 1);
      edgeCountPerNode.set(e.target, (edgeCountPerNode.get(e.target) ?? 0) + 1);
    });
    
    for (const e of edges) {
      const a = positions[e.source];
      const b = positions[e.target];
      if (!a || !b) continue;
      
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
      
      // Adjust link distance based on edge count
      // If node has < 5 edges, increase link distance proportionally
      const edgesA = edgeCountPerNode.get(e.source) ?? 1;
      const edgesB = edgeCountPerNode.get(e.target) ?? 1;
      const minEdges = Math.min(edgesA, edgesB);
      
      // Scale: if minEdges < 5, multiply distance by factor
      // minEdges=1: factor=1.8, minEdges=5: factor=1.0
      const isolationFactor = minEdges < 5 ? 1.0 + (5 - minEdges) * 0.16 : 1.0;
      const desired = linkDistance * isolationFactor;
      const diff = dist - desired;
      
      // Weak link force (prioritize repulsion over attraction)
      const strength = linkStrength * 0.5;
      const fx = (dx / dist) * diff * strength;
      const fy = (dy / dist) * diff * strength;
      
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }

    // === PHASE 3: SOFT CENTER GRAVITATION FOR LARGE NODES ===
    // Large genres (high totalMinutes) gently pulled to center
    // Small genres influenced weakly
    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      const pos = positions[node.id];
      
      // Center pull proportional to node importance (totalMinutes ^ 1.2)
      const importance = Math.pow(node.totalMinutes / maxMinutes, 1.2);
      const centerStrength = importance * 0.04; // gentle pull for large nodes
      
      const dx = center.x - pos.x;
      const dy = center.y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
      
      if (dist > 1) {
        const fx = (dx / dist) * centerStrength;
        const fy = (dy / dist) * centerStrength;
        pos.vx += fx;
        pos.vy += fy;
      }
    }

    // === PHASE 4: VELOCITY DAMPING (cooling) & INTEGRATION ===
    // Higher damping in later iterations = freezing effect
    const coolingFactor = Math.pow(0.95, iter / 50); // gradually increase damping
    const damping = 0.85 * coolingFactor; // 0.85 → 0.4 over iterations
    
    for (const p of Object.values(positions)) {
      // Apply damping (friction / air resistance)
      p.vx *= damping;
      p.vy *= damping;
      
      // Update positions
      p.x += p.vx;
      p.y += p.vy;
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

