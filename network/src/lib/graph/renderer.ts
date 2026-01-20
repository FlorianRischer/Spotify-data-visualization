// Canvas Renderer — draws graph with animations, LOD, painter's order
import type { GenreNode, GenreEdge, ArtistGroup } from "$lib/graph/types";
import type { CategoryAnchor } from "./physics";

export interface RenderNode extends GenreNode {
  x: number;
  y: number;
  isPinned: boolean;
}

// RenderEdge can either have precomputed positions (legacy) or just be a GenreEdge
// For performance, we compute positions directly in the render loop
export interface RenderEdge extends GenreEdge {
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
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
  focusedCategory?: string | null; // For category-based focus effect
  categoryFilterProgress?: number; // 0-1 animation progress for category filter (smooth transition)
  hoverScaleMap?: Map<string, { scale: number; velocity: number; startTime: number }>; // For organic hover animation
  searchScaleMap?: Map<string, { targetScale: number; startScale: number; startTime: number; duration: number }>; // For smooth search scale animation
  categoryLabels?: CategoryAnchor[]; // Mini-Headings für Overview-Kategorien
  overviewTransitionProgress?: number; // 0-1 progress of overview transition
  overviewTransitionStartTime?: number | null; // When overview transition started (for delayed label display)
  // Search state
  searchMatchedIds?: Set<string>; // IDs of nodes that match the search
  isSearchActive?: boolean; // Whether search is active
  isFocusMode?: boolean; // Whether focus mode is active (after Enter press)
  // PERFORMANCE: Node positions for direct edge position calculation
  nodePositions?: Record<string, { x: number; y: number }>; // Direct position lookup
}

// Fallback color palette for genres (unified saturation ~45%, lightness ~55%)
const COLORS = [
  "#C98B6B", "#6BADC9", "#C96B6B", "#C96BB0", "#8B6BC9",
  "#C9A16B", "#7DC96B", "#6BC9B8", "#C9C16B", "#C97E6B",
  "#C9886B", "#6B7AC9", "#6B6BC9", "#C96B8B", "#A86BC9"
];

function getNodeColor(node: RenderNode, index: number): string {
  return node.color || COLORS[index % COLORS.length];
}

// Helper to apply alpha channel to hex color
function hexColorWithAlpha(hexColor: string, alpha: number): string {
  const alphaHex = Math.round(Math.max(0, Math.min(1, alpha)) * 0xff).toString(16).padStart(2, '0');
  return hexColor + alphaHex;
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

// Get smooth search scale animation using easing
function getSearchScaleAnimation(
  nodeId: string,
  searchScaleMap: Map<string, { targetScale: number; startScale: number; startTime: number; duration: number }> | undefined,
  now: number,
  reducedMotion: boolean
): number | null {
  if (reducedMotion || !searchScaleMap) return null;
  
  const anim = searchScaleMap.get(nodeId);
  if (!anim) return null;
  
  const elapsed = now - anim.startTime;
  if (elapsed >= anim.duration) {
    // Animation completed - return target scale
    return anim.targetScale;
  }
  
  const progress = elapsed / anim.duration;
  
  // Ease-in-out cubic for smooth animation
  const eased = progress < 0.5 
    ? 4 * progress * progress * progress 
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
  
  return anim.startScale + (anim.targetScale - anim.startScale) * eased;
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

// Render mini category labels for Overview mode
function renderCategoryLabels(
  ctx: CanvasRenderingContext2D,
  labels: CategoryAnchor[],
  overviewTransitionProgress: number,
  overviewTransitionStartTime: number | undefined,
  now: number
): void {
  const OVERVIEW_TRANSITION_DURATION = 1200;
  const LABEL_DELAY = 10000; // 10 second delay after transition completes
  
  // Check if 2 seconds have passed since transition started + duration
  if (!overviewTransitionStartTime) {
    return;
  }
  
  const transitionEndTime = overviewTransitionStartTime + OVERVIEW_TRANSITION_DURATION;
  const timeSinceTransitionEnd = now - transitionEndTime;
  
  if (timeSinceTransitionEnd < LABEL_DELAY) {
    return;
  }
  
  // Calculate opacity: fade in over 300ms after delay completes
  const fadeInDuration = 300;
  const timeSinceLabelStart = timeSinceTransitionEnd - LABEL_DELAY;
  const labelOpacity = Math.min(1, timeSinceLabelStart / fadeInDuration);
  
  ctx.save();
  
  for (const label of labels) {
    ctx.save();
    
    // Move to label position (offset slightly to the left of group center)
    // Adjusted offset to position subheadings a bit closer, but not too far
    ctx.translate(label.x - 80, label.y);
    
    // Rotate 90 degrees to make text vertical (like the main "Overview" heading)
    // Use 270deg (same as genre title)
    ctx.rotate(-Math.PI / 2);
    
    // Set up text style - match Anton font from GenreTitle but slightly smaller
    ctx.font = '400 24px "Anton", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Use black color for all labels
    ctx.fillStyle = `rgba(0, 0, 0, ${labelOpacity})`;
    
    // Draw the category name
    ctx.fillText(label.category, 0, 0);
    
    ctx.restore();
  }
  
  ctx.restore();
}

export function renderGraph(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  nodes: RenderNode[],
  edges: RenderEdge[],
  options: RenderOptions
) {
  const { hoveredId, focusedId, centeredNodeId, showConnections, animatingNodes, reducedMotion, dpr, now, groups, focusedCategory, categoryFilterProgress, hoverScaleMap } = options;
  const cameraZoom = options.cameraZoom ?? 1;
  const cameraX = options.cameraX ?? 0;
  const cameraY = options.cameraY ?? 0;
  
  // WICHTIG: Canvas.width/height sind bereits in Buffer-Pixeln (CSS × dpr)
  // Simulation läuft in CSS-Pixel-Raum → keine /dpr Divisionen nötig!
  const cssCanvasWidth = canvas.width / dpr;
  const cssCanvasHeight = canvas.height / dpr;
  
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // ============================================
  // TRANSFORM: DPR-Skalierung + Camera
  // ============================================
  // setTransform setzt die komplette Transformationsmatrix neu
  // [a, b, c, d, e, f] = [dpr, 0, 0, dpr, translationX, translationY]
  ctx.setTransform(
    dpr * cameraZoom,  // Horizontal Scaling
    0,                  // Horizontal Skew
    0,                  // Vertical Skew
    dpr * cameraZoom,  // Vertical Scaling
    cssCanvasWidth * dpr / 2,   // Translation X (in Buffer-Pixel)
    cssCanvasHeight * dpr / 2   // Translation Y (in Buffer-Pixel)
  );
  // Camera pan (in CSS-Pixel-Raum, keine Skalierung nötig)
  ctx.translate(-cameraX, -cameraY);

  // Genre groups visualization removed - only physics-based grouping

  // Draw edges if enabled - OPTIMIZED: batch rendering with direct position lookup
  if (showConnections) {
    // Get positions lookup - either from options or build from nodes
    const positions = options.nodePositions ?? Object.fromEntries(nodes.map(n => [n.id, { x: n.x, y: n.y }]));
    
    // Build node category lookup once (avoids O(n) find() per edge)
    const nodeCategory = new Map<string, string>();
    for (const n of nodes) {
      nodeCategory.set(n.id, n.category || '');
    }
    
    // Calculate viewport bounds for culling (with some padding)
    const viewHalfWidth = (cssCanvasWidth / 2 / cameraZoom) + 100;
    const viewHalfHeight = (cssCanvasHeight / 2 / cameraZoom) + 100;
    const viewMinX = cameraX - viewHalfWidth;
    const viewMaxX = cameraX + viewHalfWidth;
    const viewMinY = cameraY - viewHalfHeight;
    const viewMaxY = cameraY + viewHalfHeight;
    
    // PERFORMANCE: Use typed arrays for batch edge data to avoid object creation
    // Group edges by style for batched rendering - store just coordinates
    const normalEdgeCoords: number[] = [];
    const dimmedEdgeCoords: number[] = [];
    const highlightedEdgeCoords: number[] = [];
    
    for (const e of edges) {
      // Get positions directly from lookup
      const srcPos = positions[e.source];
      const tgtPos = positions[e.target];
      
      // Skip edges without valid positions
      if (!srcPos || !tgtPos) continue;
      if ((srcPos.x === 0 && srcPos.y === 0) || (tgtPos.x === 0 && tgtPos.y === 0)) continue;
      
      const x1 = srcPos.x;
      const y1 = srcPos.y;
      const x2 = tgtPos.x;
      const y2 = tgtPos.y;
      
      // VIEWPORT CULLING: Skip edges completely outside viewport
      const edgeMinX = Math.min(x1, x2);
      const edgeMaxX = Math.max(x1, x2);
      const edgeMinY = Math.min(y1, y2);
      const edgeMaxY = Math.max(y1, y2);
      if (edgeMaxX < viewMinX || edgeMinX > viewMaxX || edgeMaxY < viewMinY || edgeMinY > viewMaxY) {
        continue; // Edge is completely outside viewport
      }
      
      const isHighlighted = hoveredId === e.source || hoveredId === e.target;
      
      if (isHighlighted) {
        highlightedEdgeCoords.push(x1, y1, x2, y2);
      } else if (focusedCategory) {
        const srcCat = nodeCategory.get(e.source);
        const tgtCat = nodeCategory.get(e.target);
        const isInFocusedCategory = srcCat === focusedCategory || tgtCat === focusedCategory;
        if (isInFocusedCategory) {
          normalEdgeCoords.push(x1, y1, x2, y2);
        } else {
          dimmedEdgeCoords.push(x1, y1, x2, y2);
        }
      } else {
        normalEdgeCoords.push(x1, y1, x2, y2);
      }
    }
    
    const edgeAlphaBase = edges.length > 400 ? 0.25 : 0.4;
    ctx.lineCap = "round";
    
    // Batch draw dimmed edges (single path, single stroke)
    if (dimmedEdgeCoords.length > 0) {
      ctx.strokeStyle = `rgba(100, 120, 200, ${(edgeAlphaBase * 0.3).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < dimmedEdgeCoords.length; i += 4) {
        ctx.moveTo(dimmedEdgeCoords[i], dimmedEdgeCoords[i + 1]);
        ctx.lineTo(dimmedEdgeCoords[i + 2], dimmedEdgeCoords[i + 3]);
      }
      ctx.stroke();
    }
    
    // Batch draw normal edges (single path, single stroke)
    if (normalEdgeCoords.length > 0) {
      ctx.strokeStyle = `rgba(100, 120, 200, ${edgeAlphaBase.toFixed(3)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < normalEdgeCoords.length; i += 4) {
        ctx.moveTo(normalEdgeCoords[i], normalEdgeCoords[i + 1]);
        ctx.lineTo(normalEdgeCoords[i + 2], normalEdgeCoords[i + 3]);
      }
      ctx.stroke();
    }
    
    // Draw highlighted edges (single batch path)
    if (highlightedEdgeCoords.length > 0) {
      ctx.strokeStyle = `rgba(100, 120, 200, 0.7)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < highlightedEdgeCoords.length; i += 4) {
        ctx.moveTo(highlightedEdgeCoords[i], highlightedEdgeCoords[i + 1]);
        ctx.lineTo(highlightedEdgeCoords[i + 2], highlightedEdgeCoords[i + 3]);
      }
      ctx.stroke();
    }
  }

  // Sort nodes by size (smaller first, so larger draw on top)
  // OPTIMIZATION: Only sort if array has changed
  const sortedNodes = [...nodes].sort((a, b) => a.size - b.size);
  
  // Find hovered node for influence calculation on neighbors
  let hoveredNode: RenderNode | null = null;
  let hoveredNodeScale = 1;
  if (hoveredId && hoverScaleMap) {
    hoveredNode = sortedNodes.find(n => n.id === hoveredId) || null;
    if (hoveredNode) {
      hoveredNodeScale = hoverScaleMap.get(hoveredId)?.scale ?? 1;
    }
  }
  
  // Pre-calculate common values outside the loop
  const searchMatchedIds = options.searchMatchedIds;
  const isSearchActiveOpt = options.isSearchActive ?? false;
  const isFocusModeOpt = options.isFocusMode ?? false;
  const hasCenteredNode = !!centeredNodeId;
  const catFilterProgress = categoryFilterProgress ?? 1;
  const searchScaleMap = options.searchScaleMap;
  
  // Draw nodes - OPTIMIZED with reduced calculations
  for (let i = 0; i < sortedNodes.length; i++) {
    const n = sortedNodes[i];
    const progress = getAnimationProgress(n.id, animatingNodes, now, reducedMotion);
    const scale = reducedMotion ? 1 : 0.3 + 0.7 * progress;
    const opacity = reducedMotion ? 1 : progress;
    
    const isHovered = hoveredId === n.id;
    const isFocused = focusedId === n.id;
    const isCentered = centeredNodeId === n.id;
    const isInFocusedCategory = focusedCategory && n.category === focusedCategory;
    
    // Search state - use pre-calculated values
    const isSearchMatch = isSearchActiveOpt && searchMatchedIds?.has(n.id);
    
    // Calculate influence from hovered node (only if needed)
    let hoverInfluence = 0;
    if (hoveredNode && !isHovered && hoveredNodeScale > 1) {
      const dx = n.x - hoveredNode.x;
      const dy = n.y - hoveredNode.y;
      const distSq = dx * dx + dy * dy;
      // Early exit if too far
      if (distSq < 22500) { // 150^2
        const distance = Math.sqrt(distSq);
        const influenceRadius = 150;
        hoverInfluence = Math.max(0, 1 - (distance / influenceRadius)) * (hoveredNodeScale - 1);
      }
    }
    
    // Size multiplier - target value based on search state
    let targetSizeMultiplier = 1;
    if (isCentered) {
      targetSizeMultiplier = 2.5;
    } else if (isFocusModeOpt && isSearchMatch) {
      targetSizeMultiplier = 2.2;
    } else if (isSearchMatch) {
      targetSizeMultiplier = 1.4;
    } else if (isFocusModeOpt && isSearchActiveOpt) {
      targetSizeMultiplier = 0.6;
    }
    
    // Get smoothly animated size multiplier (directly interpolates from old to new value)
    const sizeMultiplier = getSearchScaleAnimation(n.id, searchScaleMap, now, reducedMotion) ?? targetSizeMultiplier;
    
    // Dim factor - simplified logic
    let dimFactor = 1;
    if (hasCenteredNode && !isCentered) {
      dimFactor = 0.3;
    } else if (isSearchActiveOpt && !isSearchMatch) {
      dimFactor = 0.25;
    } else if (focusedCategory && !isInFocusedCategory) {
      dimFactor = 1 - (catFilterProgress * 0.8);
    } else if (hoverInfluence > 0.1) {
      dimFactor = 1 - (hoverInfluence * 0.35);
    }
    
    const r = Math.max(8, n.size) * scale * 0.4 * sizeMultiplier;
    const color = getNodeColor(n, i);
    
    // Get hover scale animation for organic water-droplet effect
    const hoverScale = hoverScaleMap?.get(n.id)?.scale ?? 1;
    const scaledRadius = r * hoverScale;
    
    // Shadow/glow for centered node only (no glow for search matches)
    if (isCentered && !reducedMotion) {
      ctx.beginPath();
      const glowSize = 25;
      ctx.fillStyle = `${color}66`;
      // x, y sind bereits im CSS-Pixel-Raum → direkt zeichnen (keine /dpr)
      ctx.arc(n.x, n.y, scaledRadius + glowSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Main circle - with hover scale for organic growth effect
    ctx.beginPath();
    const nodeOpacity = opacity * dimFactor;
    // All nodes use their category color - hovered nodes get full opacity
    if (isHovered || isCentered) {
      ctx.fillStyle = color; // Full color without transparency
    } else {
      // Apply opacity to category color for non-hovered nodes
      ctx.fillStyle = hexColorWithAlpha(color, nodeOpacity);
    }
    ctx.lineWidth = isCentered ? 1 : 0; // No stroke for hovered nodes
    ctx.strokeStyle = `rgba(0,0,0,${(0.2 * nodeOpacity).toFixed(3)})`;
    ctx.arc(n.x, n.y, scaledRadius, 0, Math.PI * 2);
    ctx.fill();
    if (ctx.lineWidth > 0) ctx.stroke();
    
    // Centered node special ring
    if (isCentered) {
      ctx.beginPath();
      ctx.strokeStyle = `${color}`;
      ctx.lineWidth = 4;
      ctx.arc(n.x, n.y, scaledRadius + 8, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Pinned ring
    if (n.isPinned) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 214, 102, 0.85)";
      ctx.lineWidth = 2.5;
      ctx.arc(n.x, n.y, scaledRadius + 8, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Keyboard focus ring
    if (isFocused) {
      ctx.beginPath();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.arc(n.x, n.y, r + 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Mini category labels disabled - using GenreTitle component instead
  // if (options.categoryLabels && options.categoryLabels.length > 0 && options.overviewTransitionProgress !== undefined) {
  //   renderCategoryLabels(ctx, options.categoryLabels, options.overviewTransitionProgress, options.overviewTransitionStartTime ?? undefined, options.now);
  // }

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
  cameraY: number = 0,
  searchMatchedIds?: Set<string>,
  isSearchActive?: boolean,
  isFocusMode?: boolean,
  centeredNodeId?: string | null,
  hoverScaleMap?: Map<string, { scale: number; velocity: number; startTime: number }>,
  searchScaleMap?: Map<string, { targetScale: number; startScale: number; startTime: number; duration: number }>,
  now?: number,
  reducedMotion?: boolean
): string | null {
  // Input mouseX/Y sind Buffer-Pixel (bereits mit dpr multipliziert)
  // Canvas dimensions
  const canvasWidthBuffer = canvasWidth; // bereits Buffer-Pixel
  const canvasHeightBuffer = canvasHeight; // bereits Buffer-Pixel
  
  // INVERSE TRANSFORM:
  // Render macht: setTransform(dpr*zoom, 0, 0, dpr*zoom, canvasW/2, canvasH/2) dann translate(-camX, -camY)
  // 
  // Inverse:
  // 1. Rückgängig der Zentrierung (canvas center offset)
  // 2. Rückgängig der Scale (÷ (dpr*zoom))
  // 3. Camera pan hinzufügen
  
  // Schritt 1: Rückgängig der Zentrierung (canvasW/2, canvasH/2 in Buffer-Pixeln)
  const uncenteredX = mouseX - canvasWidthBuffer / 2;
  const uncenteredY = mouseY - canvasHeightBuffer / 2;
  
  // Schritt 2: Rückgängig der Scale (dpr * cameraZoom)
  const scaleFactor = dpr * cameraZoom;
  const unscaledX = uncenteredX / scaleFactor;
  const unscaledY = uncenteredY / scaleFactor;
  
  // Schritt 3: Camera pan hinzufügen
  const worldX = unscaledX + cameraX;
  const worldY = unscaledY + cameraY;
  
  // Check in reverse order (top-most first)
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    
    // Calculate target size multiplier matching renderer logic
    let targetSizeMultiplier = 1;
    const isCentered = centeredNodeId === n.id;
    const isSearchMatch = isSearchActive && searchMatchedIds?.has(n.id);
    
    if (isCentered) {
      targetSizeMultiplier = 2.5;
    } else if (isFocusMode && isSearchMatch) {
      targetSizeMultiplier = 2.2;
    } else if (isSearchMatch) {
      targetSizeMultiplier = 1.4;
    } else if (isFocusMode && isSearchActive) {
      targetSizeMultiplier = 0.6;
    }
    
    // Get smoothly animated size multiplier (directly interpolates from old to new value)
    const sizeMultiplier = (now && searchScaleMap
      ? getSearchScaleAnimation(n.id, searchScaleMap, now, reducedMotion ?? false)
      : null) ?? targetSizeMultiplier;
    
    // Get hover scale for organic growth effect
    const hoverScale = hoverScaleMap?.get(n.id)?.scale ?? 1;
    
    // Hit radius matches visual node size exactly
    const r = Math.max(8, n.size) * 0.4 * sizeMultiplier * hoverScale;
    const dx = worldX - n.x;
    const dy = worldY - n.y;
    if (dx * dx + dy * dy <= r * r) {
      return n.id;
    }
  }
  return null;
}
