// Canvas Renderer — draws graph with animations, LOD, painter's order
import type { GenreNode, GenreEdge, ArtistGroup } from "$lib/graph/types";

export interface RenderNode extends GenreNode {
  x: number;
  y: number;
  isPinned: boolean;
}

export interface RenderEdge extends GenreEdge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface RenderOptions {
  hoveredId: string | null;
  focusedId: string | null;
  showConnections: boolean;
  animatingNodes: Map<string, { startTime: number; duration: number }>;
  reducedMotion: boolean;
  dpr: number;
  now: number;
  groups?: ArtistGroup[]; // artist groups for visual clustering
}

// Color palette for genres
const COLORS = [
  "#1DB954", "#667eea", "#764ba2", "#f093fb", "#f5576c",
  "#4facfe", "#00f2fe", "#43e97b", "#fa709a", "#fee140",
  "#30cfd0", "#c471f5", "#6a11cb", "#2575fc", "#ff6b6b"
];

function getNodeColor(node: RenderNode, index: number): string {
  return node.color || COLORS[index % COLORS.length];
}

function getAnimationProgress(
  nodeId: string,
  animatingNodes: Map<string, { startTime: number; duration: number }>,
  now: number,
  reducedMotion: boolean
): number {
  if (reducedMotion) return 1;
  const anim = animatingNodes.get(nodeId);
  if (!anim) return 1;
  const elapsed = now - anim.startTime;
  return Math.min(1, elapsed / anim.duration);
}

// Compute convex hull of points using gift wrapping
function convexHull(points: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> {
  if (points.length < 3) return points;
  
  // Find leftmost point
  let left = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i].x < points[left].x || (points[i].x === points[left].x && points[i].y < points[left].y)) {
      left = i;
    }
  }
  
  const hull: Array<{ x: number; y: number }> = [];
  let current = left;
  
  do {
    hull.push(points[current]);
    let next = (current + 1) % points.length;
    
    for (let i = 0; i < points.length; i++) {
      const cross = (points[next].x - points[current].x) * (points[i].y - points[current].y) -
                    (points[next].y - points[current].y) * (points[i].x - points[current].x);
      if (cross > 0) next = i;
    }
    current = next;
  } while (current !== left);
  
  return hull;
}

export function renderGraph(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  nodes: RenderNode[],
  edges: RenderEdge[],
  options: RenderOptions
) {
  const { hoveredId, focusedId, showConnections, animatingNodes, reducedMotion, dpr, now, groups } = options;
  
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(dpr, dpr);

  // Draw vinyl record with center hole
  // Outer circle background (vinyl look)
  ctx.fillStyle = "rgba(30, 30, 30, 0.3)";
  ctx.beginPath();
  ctx.arc(0, 0, 350, 0, Math.PI * 2);
  ctx.fill();
  
  // Clear center hole (no fill, transparent)
  ctx.clearRect(-25, -25, 50, 50);
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.arc(0, 0, 25, 0, Math.PI * 2);
  ctx.fill();

  // Genre groups visualization removed - only physics-based grouping

  // Draw edges if enabled
  if (showConnections) {
    const edgeAlphaBase = edges.length > 400 ? 0.08 : 0.18;
    ctx.lineCap = "round";
    for (const e of edges) {
      const isHighlighted = hoveredId === e.source || hoveredId === e.target;
      const alpha = isHighlighted ? 0.5 : edgeAlphaBase + Math.min(0.2, e.weight * 0.015);
      const width = isHighlighted ? 3 : Math.min(5, 1 + e.weight * 0.2);
      
      ctx.strokeStyle = `rgba(130, 148, 255, ${alpha.toFixed(3)})`;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(e.x1 / dpr, e.y1 / dpr);
      ctx.lineTo(e.x2 / dpr, e.y2 / dpr);
      ctx.stroke();
    }
  }

  // Sort nodes by size (smaller first, so larger draw on top)
  const sortedNodes = [...nodes].sort((a, b) => a.size - b.size);
  
  // Draw nodes
  for (let i = 0; i < sortedNodes.length; i++) {
    const n = sortedNodes[i];
    const progress = getAnimationProgress(n.id, animatingNodes, now, reducedMotion);
    const scale = reducedMotion ? 1 : 0.3 + 0.7 * progress;
    const opacity = reducedMotion ? 1 : progress;
    
    const isHovered = hoveredId === n.id;
    const isFocused = focusedId === n.id;
    const r = Math.max(8, n.size) * scale * 0.4;
    const color = getNodeColor(n, i);
    
    // Shadow/glow for hovered
    if (isHovered && !reducedMotion) {
      ctx.beginPath();
      ctx.fillStyle = `${color}44`;
      ctx.arc(n.x / dpr, n.y / dpr, r + 12, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Main circle
    ctx.beginPath();
    ctx.fillStyle = isHovered ? color : `rgba(223, 230, 255, ${opacity.toFixed(3)})`;
    ctx.strokeStyle = `rgba(0,0,0,${(0.2 * opacity).toFixed(3)})`;
    ctx.lineWidth = 1;
    ctx.arc(n.x / dpr, n.y / dpr, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Hover ring
    if (isHovered) {
      ctx.beginPath();
      ctx.strokeStyle = `${color}aa`;
      ctx.lineWidth = 3;
      ctx.arc(n.x / dpr, n.y / dpr, r + 5, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Pinned ring
    if (n.isPinned) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 214, 102, 0.85)";
      ctx.lineWidth = 2.5;
      ctx.arc(n.x / dpr, n.y / dpr, r + 8, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Keyboard focus ring
    if (isFocused) {
      ctx.beginPath();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.arc(n.x / dpr, n.y / dpr, r + 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Label for larger or hovered nodes
    if (r > 14 || isHovered) {
      ctx.font = `${isHovered ? "bold " : ""}${Math.max(10, Math.min(14, r * 0.6))}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.fillStyle = `rgba(255, 255, 255, ${(opacity * 0.9).toFixed(3)})`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(n.label, n.x / dpr, n.y / dpr + r + 14);
    }
  }

  ctx.restore();
}

// Hit test — returns node id or null
export function hitTest(
  nodes: RenderNode[],
  mouseX: number,
  mouseY: number,
  canvasWidth: number,
  canvasHeight: number,
  dpr: number
): string | null {
  const cx = (mouseX - canvasWidth / 2 / dpr) * dpr;
  const cy = (mouseY - canvasHeight / 2 / dpr) * dpr;
  
  // Check in reverse order (top-most first)
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    const r = (Math.max(8, n.size) * 0.4) + 8; // hit area slightly larger
    const dx = cx - n.x;
    const dy = cy - n.y;
    if (dx * dx + dy * dy <= r * r) {
      return n.id;
    }
  }
  return null;
}
