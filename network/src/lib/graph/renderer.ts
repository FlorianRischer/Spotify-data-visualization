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
  centeredNodeId?: string | null;
  showConnections: boolean;
  animatingNodes: Map<string, { startTime: number; duration: number }>;
  reducedMotion: boolean;
  dpr: number;
  now: number;
  groups?: ArtistGroup[]; // artist groups for visual clustering
  // Camera state for zoom/pan
  cameraZoom?: number;
  cameraX?: number;
  cameraY?: number;
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
  const { hoveredId, focusedId, centeredNodeId, showConnections, animatingNodes, reducedMotion, dpr, now, groups } = options;
  const cameraZoom = options.cameraZoom ?? 1;
  const cameraX = options.cameraX ?? 0;
  const cameraY = options.cameraY ?? 0;
  
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(dpr * cameraZoom, dpr * cameraZoom);
  // Apply camera pan (towards the target position)
  ctx.translate(-cameraX, -cameraY);

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
    const isCentered = centeredNodeId === n.id;
    const hasCenteredNode = !!centeredNodeId;
    
    // Size multiplier for centered node
    const sizeMultiplier = isCentered ? 2.5 : 1;
    // Dim other nodes when one is centered
    const dimFactor = hasCenteredNode && !isCentered ? 0.3 : 1;
    
    const r = Math.max(8, n.size) * scale * 0.4 * sizeMultiplier;
    const color = getNodeColor(n, i);
    
    // Shadow/glow for hovered or centered
    if ((isHovered || isCentered) && !reducedMotion) {
      ctx.beginPath();
      const glowSize = isCentered ? 25 : 12;
      ctx.fillStyle = isCentered ? `${color}66` : `${color}44`;
      ctx.arc(n.x / dpr, n.y / dpr, r + glowSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Main circle
    ctx.beginPath();
    const nodeOpacity = opacity * dimFactor;
    ctx.fillStyle = (isHovered || isCentered) ? color : `rgba(223, 230, 255, ${nodeOpacity.toFixed(3)})`;
    ctx.strokeStyle = `rgba(0,0,0,${(0.2 * nodeOpacity).toFixed(3)})`;
    ctx.lineWidth = 1;
    ctx.arc(n.x / dpr, n.y / dpr, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Hover ring
    if (isHovered && !isCentered) {
      ctx.beginPath();
      ctx.strokeStyle = `${color}aa`;
      ctx.lineWidth = 3;
      ctx.arc(n.x / dpr, n.y / dpr, r + 5, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Centered node special ring
    if (isCentered) {
      ctx.beginPath();
      ctx.strokeStyle = `${color}`;
      ctx.lineWidth = 4;
      ctx.arc(n.x / dpr, n.y / dpr, r + 8, 0, Math.PI * 2);
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
    
    // Label for larger, hovered, or centered nodes
    if (r > 14 || isHovered || isCentered) {
      const fontSize = isCentered ? Math.max(16, Math.min(24, r * 0.5)) : Math.max(10, Math.min(14, r * 0.6));
      ctx.font = `${(isHovered || isCentered) ? "bold " : ""}${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.fillStyle = `rgba(255, 255, 255, ${(opacity * dimFactor * 0.9).toFixed(3)})`;
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
  dpr: number,
  cameraZoom: number = 1,
  cameraX: number = 0,
  cameraY: number = 0
): string | null {
  // Convert screen coordinates to world coordinates
  // Inverse of: translate(center) -> scale(dpr * zoom) -> translate(-cameraX, -cameraY)
  const centerX = canvasWidth / 2 / dpr;
  const centerY = canvasHeight / 2 / dpr;
  
  // Mouse relative to center, then unscale by zoom, then add camera offset
  const worldX = ((mouseX - centerX) / cameraZoom + cameraX) * dpr;
  const worldY = ((mouseY - centerY) / cameraZoom + cameraY) * dpr;
  
  // Check in reverse order (top-most first)
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    const r = (Math.max(8, n.size) * 0.4) + 8; // hit area slightly larger
    const dx = worldX - n.x;
    const dy = worldY - n.y;
    if (dx * dx + dy * dy <= r * r) {
      return n.id;
    }
  }
  return null;
}
