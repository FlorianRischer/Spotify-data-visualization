// Simple physics engine for genre nodes
import type { GenreNode, GenreEdge, ArtistGroup } from "$lib/graph/types";

export interface PhysicsState {
  vx: Record<string, number>;
  vy: Record<string, number>;
}

export interface PhysicsParams {
  repulsion: number; // strength of node-node repulsion
  spring: number; // link spring strength
  restLength: number; // natural length of links
  damping: number; // velocity damping (0..1)
  jitter: number; // small random jitter to keep motion alive
  maxSpeed: number; // clamp velocity
  groupAttraction?: number; // strength of artist group attraction (optional)
}

export function createPhysicsState(nodeIds: string[]): PhysicsState {
  const vx: Record<string, number> = {};
  const vy: Record<string, number> = {};
  for (const id of nodeIds) {
    vx[id] = 0;
    vy[id] = 0;
  }
  return { vx, vy };
}

export function stepPhysics(
  nodes: GenreNode[],
  edges: GenreEdge[],
  positions: Record<string, { x: number; y: number }>,
  radii: Record<string, number>,
  state: PhysicsState,
  params: PhysicsParams,
  dt = 1 / 60,
  bounds?: { width: number; height: number },
  groups?: ArtistGroup[]
) {
  const { repulsion, spring, restLength, damping, jitter, maxSpeed, groupAttraction = 0 } = params;
  
  // Node-node repulsion
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    const pa = positions[a.id];
    if (!pa) continue;
    
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j];
      const pb = positions[b.id];
      if (!pb) continue;
      
      const dx = pa.x - pb.x;
      const dy = pa.y - pb.y;
      let d2 = dx * dx + dy * dy;
      if (d2 === 0) {
        // separate coincident points slightly
        const eps = 0.01;
        d2 = eps;
      }
      const d = Math.sqrt(d2);
      const minSep = (radii[a.id] || 10) + (radii[b.id] || 10) + 2;
      
      // Soft repulsion always; additional collision push if overlapping
      const forceMag = repulsion / (d2 + 1);
      const fx = (dx / (d + 1e-6)) * forceMag;
      const fy = (dy / (d + 1e-6)) * forceMag;
      
      state.vx[a.id] += fx * dt;
      state.vy[a.id] += fy * dt;
      state.vx[b.id] -= fx * dt;
      state.vy[b.id] -= fy * dt;
      
      // Collision resolution to avoid overlap - stronger force
      if (d < minSep) {
        const overlap = (minSep - d) * 0.8; // increased from 0.5 to 0.8
        const nx = dx / (d + 1e-6);
        const ny = dy / (d + 1e-6);
        pa.x += nx * overlap;
        pa.y += ny * overlap;
        pb.x -= nx * overlap;
        pb.y -= ny * overlap;
      }
    }
  }
  
  // Spring forces along edges
  for (const e of edges) {
    const ps = positions[e.source];
    const pt = positions[e.target];
    if (!ps || !pt) continue;
    const dx = pt.x - ps.x;
    const dy = pt.y - ps.y;
    const d = Math.sqrt(dx * dx + dy * dy) + 1e-6;
    const k = spring;
    const rest = restLength;
    const stretch = d - rest;
    const fx = (dx / d) * (k * stretch);
    const fy = (dy / d) * (k * stretch);
    
    state.vx[e.source] += fx * dt;
    state.vy[e.source] += fy * dt;
    state.vx[e.target] -= fx * dt;
    state.vy[e.target] -= fy * dt;
  }
  
  // Artist group attractions (smooth pull towards group center when enabled)
  if (groupAttraction > 0 && groups && groups.length > 0) {
    for (const group of groups) {
      if (group.genreIds.length < 2) continue;
      
      // Calculate center of group
      let cx = 0, cy = 0;
      let count = 0;
      for (const genreId of group.genreIds) {
        const pos = positions[genreId];
        if (pos) {
          cx += pos.x;
          cy += pos.y;
          count++;
        }
      }
      
      if (count === 0) continue;
      cx /= count;
      cy /= count;
      
      // Pull each node in the group towards the center
      for (const genreId of group.genreIds) {
        const pos = positions[genreId];
        if (!pos) continue;
        
        const dx = cx - pos.x;
        const dy = cy - pos.y;
        const d = Math.sqrt(dx * dx + dy * dy) + 1e-6;
        
        // Smooth attraction force that decreases with distance
        const forceMag = groupAttraction * (d * 0.1); // proportional to distance
        const fx = (dx / d) * forceMag;
        const fy = (dy / d) * forceMag;
        
        state.vx[genreId] += fx * dt;
        state.vy[genreId] += fy * dt;
      }
    }
  }
  
  // Integrate velocities, apply damping, jitter, clamp, and boundary checks
  for (const n of nodes) {
    if (!positions[n.id]) continue;
    let vx = (state.vx[n.id] || 0) * (1 - damping);
    let vy = (state.vy[n.id] || 0) * (1 - damping);
    
    vx += (Math.random() - 0.5) * jitter;
    vy += (Math.random() - 0.5) * jitter;
    
    // clamp speed
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed > maxSpeed) {
      const scale = maxSpeed / speed;
      vx *= scale;
      vy *= scale;
    }
    
    positions[n.id].x += vx;
    positions[n.id].y += vy;
    
    // Boundary checking - keep nodes within viewport
    if (bounds) {
      const radius = radii[n.id] || 10;
      const margin = radius + 20; // extra margin for safety
      const maxX = bounds.width / 2 - margin;
      const maxY = bounds.height / 2 - margin;
      
      // Bounce off walls with velocity reversal
      if (positions[n.id].x < -maxX) {
        positions[n.id].x = -maxX;
        vx = Math.abs(vx) * 0.5; // bounce back with damping
      } else if (positions[n.id].x > maxX) {
        positions[n.id].x = maxX;
        vx = -Math.abs(vx) * 0.5;
      }
      
      if (positions[n.id].y < -maxY) {
        positions[n.id].y = -maxY;
        vy = Math.abs(vy) * 0.5;
      } else if (positions[n.id].y > maxY) {
        positions[n.id].y = maxY;
        vy = -Math.abs(vy) * 0.5;
      }
    }
    
    state.vx[n.id] = vx;
    state.vy[n.id] = vy;
  }
}
