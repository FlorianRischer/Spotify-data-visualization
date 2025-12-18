// Simple physics engine for genre nodes
import type { GenreNode, GenreEdge, ArtistGroup } from "$lib/graph/types";
import type { GenreCategory } from "$lib/graph/genreMapping";

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
  genreAnchorStrength?: number; // strength of attraction to genre anchor points (0-1, 0=disabled)
}

// Genre-Ankerpunkte auf Kreis verteilt
export interface GenreAnchor {
  genreId: string;
  x: number;
  y: number;
}

// Kategorie-Ankerpunkte mit Namen für Overview-Headings
export interface CategoryAnchor {
  category: GenreCategory;
  x: number;
  y: number;
  genreIds: string[]; // IDs der Genres in dieser Kategorie
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

/**
 * Erstellt Ankerpunkte für Genres, die gleichmäßig auf einem Kreis verteilt sind
 * Dies ermöglicht schnelle und eindeutige Genre-Gruppierungen
 */
export function createGenreAnchors(genreIds: string[], radius: number = 350): GenreAnchor[] {
  const anchors: GenreAnchor[] = [];
  const count = genreIds.length;
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    anchors.push({
      genreId: genreIds[i],
      x,
      y
    });
  }
  
  return anchors;
}

/**
 * Erstellt Ankerpunkte für Genres mit Kategorien-Clustering
 * Genres in der gleichen Kategorie werden zusammen positioniert
 * Die Kategorien sind gleichmäßig auf dem Kreis verteilt
 */
export function createCategoryBasedGenreAnchors(
  nodes: GenreNode[],
  radius: number = 350
): GenreAnchor[] {
  const anchors: GenreAnchor[] = [];
  
  // Gruppiere Genres nach Kategorie
  const categoriesMap = new Map<string, GenreNode[]>();
  
  for (const node of nodes) {
    const category = node.category || "Specialty & Other";
    if (!categoriesMap.has(category)) {
      categoriesMap.set(category, []);
    }
    categoriesMap.get(category)!.push(node);
  }
  
  // Sortiere Kategorien nach Größe (absteigend) - größte zuerst
  // Dies entspricht der Anordnung in der Zoom-Phase
  const categories = Array.from(categoriesMap.entries())
    .sort((a, b) => b[1].length - a[1].length) // Absteigend nach Anzahl
    .map(entry => entry[0]);
  
  const categoryCount = categories.length;
  
  // Position jede Kategorie auf dem Kreis
  // Start bei 12 Uhr (-π/2) und gehe im Uhrzeigersinn
  for (let catIdx = 0; catIdx < categoryCount; catIdx++) {
    const categoryAngle = -Math.PI / 2 + (catIdx / categoryCount) * Math.PI * 2;
    const categoryX = Math.cos(categoryAngle) * radius;
    const categoryY = Math.sin(categoryAngle) * radius;
    
    const category = categories[catIdx];
    const genresInCategory = categoriesMap.get(category)!;
    const genreCount = genresInCategory.length;
    
    // Positioniere Genres um ihre Kategorie-Position
    // Bei nur einem Genre ist es genau auf dem Kreis
    // Bei mehreren Genres bilden sie einen kleinen Cluster
    const clusterRadius = Math.min(28, 140 / genreCount); // Kleinere Cluster für große Kategorien
    
    for (let genreIdx = 0; genreIdx < genreCount; genreIdx++) {
      const genre = genresInCategory[genreIdx];
      
      if (genreCount === 1) {
        // Einzelnes Genre: exakt auf dem Kreis
        anchors.push({
          genreId: genre.id,
          x: categoryX,
          y: categoryY
        });
      } else {
        // Mehrere Genres: kleine Cluster um die Kategorie-Position
        const angle = (genreIdx / genreCount) * Math.PI * 2;
        const x = categoryX + Math.cos(angle) * clusterRadius;
        const y = categoryY + Math.sin(angle) * clusterRadius;
        anchors.push({
          genreId: genre.id,
          x,
          y
        });
      }
    }
  }
  
  return anchors;
}

/**
 * Erstellt Ankerpunkte für Overview-Modus
 * Verteilt 17 Kategorien über den verfügbaren Screen-Bereich (rechts vom Genre-Titel)
 * Verhindert Überlappungen zwischen den Gruppen
 */
export function createOverviewAnchors(
  nodes: GenreNode[],
  canvasWidth: number = 1920,
  canvasHeight: number = 1080,
  titleWidth: number = 300 // Platz für Genre-Titel links
): GenreAnchor[] {
  const anchors: GenreAnchor[] = [];
  
  // Gruppiere Genres nach Kategorie
  const categoriesMap = new Map<string, GenreNode[]>();
  
  for (const node of nodes) {
    const category = node.category || "Specialty & Other";
    if (!categoriesMap.has(category)) {
      categoriesMap.set(category, []);
    }
    categoriesMap.get(category)!.push(node);
  }
  
  // Sortiere Kategorien nach Größe (absteigend)
  const categories = Array.from(categoriesMap.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .map(entry => entry[0]);
  
  const categoryCount = categories.length; // 17 Kategorien
  
  // Grid-Layout: 5 Spalten × 4 Reihen (wie im Design gezeigt - 17 Punkte)
  const cols = 5;
  const rows = Math.ceil(categoryCount / cols); // = 4 Reihen
  
  // Canvas-Bereich für Ankerpunkte (0, 0 ist Mitte des Canvas)
  // Mit Canvas-Koordinaten: -width/2 bis +width/2, -height/2 bis +height/2
  const gridLeft = -canvasWidth * 0.15;  // Näher zur Mitte (weniger nach links)
  const gridRight = canvasWidth * 0.42;  // 42% nach rechts von Mitte (weniger weit)
  const gridTop = -canvasHeight * 0.4;   // 40% nach oben von Mitte
  const gridBottom = canvasHeight * 0.45; // 45% nach unten von Mitte
  
  const gridWidth = gridRight - gridLeft;
  const gridHeight = gridBottom - gridTop;
  
  const cellWidth = gridWidth / cols;
  const cellHeight = gridHeight / rows;
  
  // Positioniere jede Kategorie auf einem Grid-Punkt
  for (let catIdx = 0; catIdx < categoryCount; catIdx++) {
    const col = catIdx % cols;
    const row = Math.floor(catIdx / cols);
    
    // Position - zentriert in jeder Zelle
    const x = gridLeft + (col + 0.5) * cellWidth;
    const y = gridTop + (row + 0.5) * cellHeight;
    
    const category = categories[catIdx];
    const genresInCategory = categoriesMap.get(category)!;
    const genreCount = genresInCategory.length;
    
    // Kleinere Cluster für jede Kategorie
    const clusterRadius = Math.min(30, 150 / genreCount);
    
    for (let genreIdx = 0; genreIdx < genreCount; genreIdx++) {
      const genre = genresInCategory[genreIdx];
      
      if (genreCount === 1) {
        anchors.push({
          genreId: genre.id,
          x,
          y
        });
      } else {
        // Kleine Cluster um Grid-Position
        const angle = (genreIdx / genreCount) * Math.PI * 2;
        const px = x + Math.cos(angle) * clusterRadius;
        const py = y + Math.sin(angle) * clusterRadius;
        anchors.push({
          genreId: genre.id,
          x: px,
          y: py
        });
      }
    }
  }
  
  return anchors;
}

/**
 * Erstellt Kategorie-Ankerpunkte mit Namen für Overview-Headings
 * Speichert Kategoriename + Position für Mini-Headings
 */
export function createOverviewCategoryLabels(
  nodes: GenreNode[],
  genreAnchors: GenreAnchor[]
): CategoryAnchor[] {
  const labels: CategoryAnchor[] = [];
  
  // Gruppiere Genres nach Kategorie
  const categoriesMap = new Map<GenreCategory, GenreNode[]>();
  
  for (const node of nodes) {
    const category = (node.category || "Specialty") as GenreCategory;
    if (!categoriesMap.has(category)) {
      categoriesMap.set(category, []);
    }
    categoriesMap.get(category)!.push(node);
  }
  
  // Für jede Kategorie: berechne Durchschnittsposition der Ankerpunkte
  for (const [category, genresInCategory] of categoriesMap.entries()) {
    const genreIds = genresInCategory.map(g => g.id);
    
    // Finde alle Ankerpunkte dieser Genres
    const anchorsForCategory = genreAnchors.filter(a => genreIds.includes(a.genreId));
    
    if (anchorsForCategory.length === 0) continue;
    
    // Berechne Durchschnittsposition
    let sumX = 0, sumY = 0;
    for (const anchor of anchorsForCategory) {
      sumX += anchor.x;
      sumY += anchor.y;
    }
    const avgX = sumX / anchorsForCategory.length;
    const avgY = sumY / anchorsForCategory.length;
    
    labels.push({
      category,
      x: avgX,
      y: avgY,
      genreIds
    });
  }
  
  return labels;
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
  groups?: ArtistGroup[],
  genreAnchors?: GenreAnchor[]
) {
  const { repulsion, spring, restLength, damping, jitter, maxSpeed, groupAttraction = 0, genreAnchorStrength = 0 } = params;
  
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
      
      // Collision resolution to avoid overlap - smoother force
      if (d < minSep) {
        const overlap = (minSep - d) * 0.6; // Reduced from 0.8 for smoother separation
        const nx = dx / (d + 1e-6);
        const ny = dy / (d + 1e-6);
        pa.x += nx * overlap * 0.5; // Apply gradually to avoid jerking
        pa.y += ny * overlap * 0.5;
        pb.x -= nx * overlap * 0.5;
        pb.y -= ny * overlap * 0.5;
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
  
  // Genre anchor attraction (strong pull to predefined positions for fast grouping)
  if (genreAnchorStrength > 0 && genreAnchors && genreAnchors.length > 0) {
    const anchorMap = new Map(genreAnchors.map(a => [a.genreId, a]));
    
    for (const n of nodes) {
      const anchor = anchorMap.get(n.id);
      if (!anchor) continue;
      
      const pos = positions[n.id];
      if (!pos) continue;
      
      const dx = anchor.x - pos.x;
      const dy = anchor.y - pos.y;
      const d = Math.sqrt(dx * dx + dy * dy) + 1e-6;
      
      // Strong attraction to anchor point - pulls node towards its genre position
      // Force is proportional to distance for smooth approach
      const forceMag = genreAnchorStrength * d * 0.5;
      const fx = (dx / d) * forceMag;
      const fy = (dy / d) * forceMag;
      
      state.vx[n.id] += fx * dt;
      state.vy[n.id] += fy * dt;
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
