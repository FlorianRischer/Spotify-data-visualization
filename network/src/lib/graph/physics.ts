// Simple physics engine for genre nodes
import type { GenreNode, GenreEdge, ArtistGroup } from "$lib/graph/types";
import type { GenreCategory } from "$lib/graph/genreMapping";
import { getMonthWorldPosition, TIMELINE_CONFIG } from "$lib/stores/timelineStore";

export interface PhysicsState {
  vx: Record<string, number>;
  vy: Record<string, number>;
  // Wander direction for smooth random movement (angle in radians)
  wanderAngle: Record<string, number>;
  // Wander strength per node
  wanderStrength: Record<string, number>;
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
  wanderEnabled?: boolean; // enable smooth random pathing (for overview mode)
  wanderStrength?: number; // strength of wander force
  wanderTurnRate?: number; // how fast wander direction changes (radians per second)
}

// Search bar force configuration
export interface SearchBarForce {
  position: { x: number; y: number };
  repulsionRadius: number; // Radius where repulsion starts
  repulsionStrength: number; // Strength of repulsion for non-matched nodes
  attractionStrength: number; // Strength of attraction for matched nodes
  matchedNodeIds: Set<string>; // IDs of nodes that match the search
  isActive: boolean; // Whether search is active
}

// Cursor attraction force for explore mode
export interface CursorForce {
  position: { x: number; y: number }; // Cursor position in world coordinates
  attractionRadius: number; // Radius of influence
  attractionStrength: number; // Strength of attraction
  slowdownRadius: number; // Radius where nodes slow down
  slowdownFactor: number; // How much to slow down (0-1, lower = slower)
  isActive: boolean; // Whether cursor force is active
  // Tethered mode - nodes can only move limited distance from anchor
  tetheredMode?: boolean; // If true, nodes stay close to their anchor positions
  maxTetherDistance?: number; // Maximum distance nodes can move from anchor
  tetherStrength?: number; // How strongly nodes are pulled back to anchor (0-1)
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
  const wanderAngle: Record<string, number> = {};
  const wanderStrength: Record<string, number> = {};
  for (const id of nodeIds) {
    vx[id] = 0;
    vy[id] = 0;
    // Random initial wander direction for each node
    wanderAngle[id] = Math.random() * Math.PI * 2;
    // Varying wander strength for organic feel
    wanderStrength[id] = 0.7 + Math.random() * 0.6;
  }
  return { vx, vy, wanderAngle, wanderStrength };
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
 * SORTIERUNG: Nach totalMinutes (Gesamtspielzeit) - größter Anteil oben
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
  
  // Sortiere Kategorien nach Gesamtspielzeit (totalMinutes) - größte zuerst
  // Dies platziert die meistgehörten Kategorien oben in der Mitte
  const categories = Array.from(categoriesMap.entries())
    .sort((a, b) => {
      const totalMinutesA = a[1].reduce((sum, node) => sum + (node.totalMinutes || 0), 0);
      const totalMinutesB = b[1].reduce((sum, node) => sum + (node.totalMinutes || 0), 0);
      return totalMinutesB - totalMinutesA; // Absteigend nach Gesamtspielzeit
    })
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
 * SORTIERUNG: Nach totalMinutes (Gesamtspielzeit) - meistgehört oben links
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
  
  // Sortiere Kategorien nach Gesamtspielzeit (totalMinutes) - meistgehört zuerst
  const categories = Array.from(categoriesMap.entries())
    .sort((a, b) => {
      const totalMinutesA = a[1].reduce((sum, node) => sum + (node.totalMinutes || 0), 0);
      const totalMinutesB = b[1].reduce((sum, node) => sum + (node.totalMinutes || 0), 0);
      return totalMinutesB - totalMinutesA;
    })
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
    
    const baseCluster = canvasWidth / 40;
    const clusterRadius = Math.min(baseCluster, (baseCluster * 5) / genreCount);
    
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

/**
 * Erstellt Ankerpunkte für den Timeline-Modus
 * Die Timeline erstreckt sich HORIZONTAL über mehrere "Screens" (Jahre)
 * Jedes Jahr hat eine Breite von YEAR_WIDTH und enthält Nodes nach Monat
 * Die Kamera bewegt sich horizontal, um zwischen Jahren zu navigieren
 * 
 * @param nodes - Die Graph-Nodes
 * @param canvasWidth - Breite des Canvas (ein "Screen")
 * @param canvasHeight - Höhe des Canvas
 * @param timelineHeight - Platz für Timeline-Bar unten
 * @param discoveryData - Optional: Map von genreId zu Discovery-Info (month: 1-12, year: number)
 * @param currentYear - Optional: Das aktuell angezeigte Jahr in der Timeline
 * @param startYear - Optional: Erstes Jahr in den Daten
 */
export function createTimelineAnchors(
  nodes: GenreNode[],
  canvasWidth: number = 1920,
  canvasHeight: number = 1080,
  timelineHeight: number = 200,
  discoveryData?: Map<string, { month: number; year: number }>,
  currentYear?: number,
  startYear?: number
): GenreAnchor[] {
  const anchors: GenreAnchor[] = [];
  
  // YEAR_WIDTH wird aus timelineStore importiert für konsistente Positionierung
  // (1200 Canvas-Einheiten pro Jahr)
  
  // Verfügbarer vertikaler Bereich für Nodes (oberhalb der Timeline)
  const areaTop = -canvasHeight * 0.3;
  const areaBottom = canvasHeight * 0.25;
  const areaHeight = areaBottom - areaTop;
  
  // Wenn Discovery-Daten vorhanden sind, positioniere nach Entdeckungsdatum
  if (discoveryData && discoveryData.size > 0) {
    // Finde Start- und End-Jahr aus den Discovery-Daten
    let minYear = Infinity;
    let maxYear = -Infinity;
    
    for (const discovery of discoveryData.values()) {
      minYear = Math.min(minYear, discovery.year);
      maxYear = Math.max(maxYear, discovery.year);
    }
    
    if (startYear !== undefined) {
      minYear = startYear;
    }
    
    if (minYear === Infinity) {
      minYear = currentYear || 2018;
      maxYear = currentYear || 2025;
    }
    
    // Positioniere jeden Node basierend auf seinem Entdeckungsdatum
    for (const node of nodes) {
      const discovery = discoveryData.get(node.id);
      
      if (!discovery) {
        // Nodes ohne Discovery-Daten: Verteile am linken Rand
        const noDataIndex = nodes.filter(n => !discoveryData.has(n.id)).indexOf(node);
        const col = noDataIndex % 5;
        const row = Math.floor(noDataIndex / 5);
        const cellScale = canvasWidth / 1200;
        anchors.push({
          genreId: node.id,
          x: -canvasWidth * 0.3 + col * 40 * cellScale,
          y: areaTop + 100 * cellScale + row * 50 * cellScale
        });
        continue;
      }
      
      // Berechne X-Position mit der zentralen Timeline-Funktion
      // Diese Funktion wird auch von der Timeline-UI verwendet, um konsistente Positionen zu garantieren
      const xPosition = getMonthWorldPosition(
        discovery.month,
        discovery.year,
        minYear,
        canvasWidth
      );
      
      // Vertikale Verteilung basierend auf Kategorie
      const categoryHash = hashString(node.category || "Other");
      const verticalOffset = ((categoryHash % 100) / 100 - 0.5) * areaHeight * 0.7;
      
      const scatterScale = canvasWidth / 1200;
      const scatterX = ((hashString(node.id) % 30) - 15) * scatterScale;
      const scatterY = (((hashString(node.id + "y") % 60) - 30)) * scatterScale;
      
      anchors.push({
        genreId: node.id,
        x: xPosition + scatterX,
        y: areaTop + areaHeight * 0.5 + verticalOffset + scatterY
      });
    }
    
  } else {
    // Fallback: Kategorie-basierte Positionierung
    const areaLeft = -canvasWidth * 0.40;
    const areaRight = canvasWidth * 0.45;
    const areaWidth = areaRight - areaLeft;
    
    const categoriesMap = new Map<string, GenreNode[]>();
    
    for (const node of nodes) {
      const category = node.category || "Specialty & Other";
      if (!categoriesMap.has(category)) {
        categoriesMap.set(category, []);
      }
      categoriesMap.get(category)!.push(node);
    }
    
    const categories = Array.from(categoriesMap.entries())
      .sort((a, b) => {
        const totalMinutesA = a[1].reduce((sum, node) => sum + (node.totalMinutes || 0), 0);
        const totalMinutesB = b[1].reduce((sum, node) => sum + (node.totalMinutes || 0), 0);
        return totalMinutesB - totalMinutesA;
      })
      .map(entry => entry[0]);
    
    const categoryCount = categories.length;
    const cols = Math.ceil(Math.sqrt(categoryCount * 1.5));
    const rows = Math.ceil(categoryCount / cols);
    const cellWidth = areaWidth / cols;
    const cellHeight = areaHeight / rows;
    
    for (let catIdx = 0; catIdx < categoryCount; catIdx++) {
      const col = catIdx % cols;
      const row = Math.floor(catIdx / cols);
      const baseX = areaLeft + (col + 0.5) * cellWidth;
      const baseY = areaTop + (row + 0.5) * cellHeight;
      
      const category = categories[catIdx];
      const genresInCategory = categoriesMap.get(category)!;
      const genreCount = genresInCategory.length;
      const clusterRadius = Math.min(40, 180 / Math.max(genreCount, 1));
      
      for (let genreIdx = 0; genreIdx < genreCount; genreIdx++) {
        const genre = genresInCategory[genreIdx];
        
        if (genreCount === 1) {
          anchors.push({ genreId: genre.id, x: baseX, y: baseY });
        } else {
          const angle = (genreIdx / genreCount) * Math.PI * 2;
          anchors.push({
            genreId: genre.id,
            x: baseX + Math.cos(angle) * clusterRadius,
            y: baseY + Math.sin(angle) * clusterRadius
          });
        }
      }
    }
  }
  
  return anchors;
}

/**
 * Simple hash function for strings
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Hilfsfunktion: Gruppiert Nodes nach Kategorie
 */
function groupByCategory(nodes: GenreNode[]): Map<string, GenreNode[]> {
  const map = new Map<string, GenreNode[]>();
  for (const node of nodes) {
    const cat = node.category || "Specialty & Other";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(node);
  }
  return map;
}


// Spatial grid for O(n) neighbor queries instead of O(n²)
const GRID_CELL_SIZE = 100; // Grid cell size in pixels

function buildSpatialGrid(
  nodes: GenreNode[],
  positions: Record<string, { x: number; y: number }>
): Map<string, string[]> {
  const grid = new Map<string, string[]>();
  
  for (const n of nodes) {
    const pos = positions[n.id];
    if (!pos) continue;
    
    const cellX = Math.floor(pos.x / GRID_CELL_SIZE);
    const cellY = Math.floor(pos.y / GRID_CELL_SIZE);
    const key = `${cellX},${cellY}`;
    
    if (!grid.has(key)) {
      grid.set(key, []);
    }
    grid.get(key)!.push(n.id);
  }
  
  return grid;
}

function getNeighborCells(cellX: number, cellY: number): string[] {
  const cells: string[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      cells.push(`${cellX + dx},${cellY + dy}`);
    }
  }
  return cells;
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
  genreAnchors?: GenreAnchor[],
  searchBarForce?: SearchBarForce,
  cursorForce?: CursorForce
) {
  const { repulsion, spring, restLength, damping, jitter, maxSpeed, groupAttraction = 0, genreAnchorStrength = 0, wanderEnabled = false, wanderStrength = 0.8, wanderTurnRate = 0.5 } = params;
  
  // Build spatial grid for efficient neighbor queries
  const grid = buildSpatialGrid(nodes, positions);
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  // Node-node repulsion using spatial grid (O(n) instead of O(n²))
  const processedPairs = new Set<string>();
  
  for (const n of nodes) {
    const pa = positions[n.id];
    if (!pa) continue;
    
    const cellX = Math.floor(pa.x / GRID_CELL_SIZE);
    const cellY = Math.floor(pa.y / GRID_CELL_SIZE);
    const neighborCells = getNeighborCells(cellX, cellY);
    
    for (const cellKey of neighborCells) {
      const cellNodes = grid.get(cellKey);
      if (!cellNodes) continue;
      
      for (const otherId of cellNodes) {
        if (otherId === n.id) continue;
        
        // Avoid processing same pair twice
        const pairKey = n.id < otherId ? `${n.id}-${otherId}` : `${otherId}-${n.id}`;
        if (processedPairs.has(pairKey)) continue;
        processedPairs.add(pairKey);
        
        const pb = positions[otherId];
        if (!pb) continue;
        
        const dx = pa.x - pb.x;
        const dy = pa.y - pb.y;
        let d2 = dx * dx + dy * dy;
        
        // Skip if too far apart (optimization)
        if (d2 > 40000) continue; // 200px max interaction distance
        
        if (d2 === 0) d2 = 0.01;
        const d = Math.sqrt(d2);
        const minSep = (radii[n.id] || 10) + (radii[otherId] || 10) + 2;
        
        // Soft repulsion
        const forceMag = repulsion / (d2 + 1);
        const fx = (dx / (d + 1e-6)) * forceMag;
        const fy = (dy / (d + 1e-6)) * forceMag;
        
        state.vx[n.id] += fx * dt;
        state.vy[n.id] += fy * dt;
        state.vx[otherId] -= fx * dt;
        state.vy[otherId] -= fy * dt;
        
        // Collision resolution
        if (d < minSep) {
          const overlap = (minSep - d) * 0.5;
          const nx = dx / (d + 1e-6);
          const ny = dy / (d + 1e-6);
          pa.x += nx * overlap * 0.5;
          pa.y += ny * overlap * 0.5;
          pb.x -= nx * overlap * 0.5;
          pb.y -= ny * overlap * 0.5;
        }
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
  
  // Search bar forces: attract matching nodes above the bar, repel non-matching nodes
  // Matching nodes gather above the search bar
  if (searchBarForce && searchBarForce.isActive) {
    const { position, repulsionRadius, repulsionStrength, attractionStrength, matchedNodeIds } = searchBarForce;
    const hasMatches = matchedNodeIds.size > 0;
    
    // Target position for matches: above the search bar
    const matchTargetY = position.y - 80; // 80px above center
    
    for (const n of nodes) {
      const pos = positions[n.id];
      if (!pos) continue;
      
      const dx = pos.x - position.x;
      const dy = pos.y - position.y;
      const d = Math.sqrt(dx * dx + dy * dy) + 1e-6;
      
      const isMatch = matchedNodeIds.has(n.id);
      
      if (isMatch && hasMatches) {
        // Attract matching nodes to position ABOVE the search bar
        const targetDx = pos.x - position.x;
        const targetDy = pos.y - matchTargetY;
        const targetD = Math.sqrt(targetDx * targetDx + targetDy * targetDy) + 1e-6;
        
        // Pull towards target position above search bar
        const pullStrength = attractionStrength * Math.min(targetD / 50, 2);
        const fx = -(targetDx / targetD) * pullStrength * 0.3; // Weak horizontal centering
        const fy = -(targetDy / targetD) * pullStrength; // Strong vertical pull
        state.vx[n.id] += fx * dt;
        state.vy[n.id] += fy * dt;
        
        // Reduce wander for matched nodes so they stay near target
        state.vx[n.id] *= 0.92;
        state.vy[n.id] *= 0.92;
      } else {
        // Repel non-matching nodes - stronger when there are matches
        const effectiveRadius = hasMatches ? repulsionRadius * 1.5 : repulsionRadius;
        const strengthMultiplier = hasMatches ? 2.0 : 1.0;
        
        if (d < effectiveRadius) {
          const falloff = 1 - (d / effectiveRadius);
          const repelForce = repulsionStrength * strengthMultiplier * falloff * falloff * 1.5;
          const fx = (dx / d) * repelForce;
          const fy = (dy / d) * repelForce;
          state.vx[n.id] += fx * dt;
          state.vy[n.id] += fy * dt;
        }
      }
    }
    
    // Extra: matching nodes repel non-matching nodes nearby (making room)
    if (hasMatches) {
      for (const matchId of matchedNodeIds) {
        const matchPos = positions[matchId];
        if (!matchPos) continue;
        
        for (const n of nodes) {
          if (matchedNodeIds.has(n.id)) continue; // Skip other matches
          const otherPos = positions[n.id];
          if (!otherPos) continue;
          
          const dx = otherPos.x - matchPos.x;
          const dy = otherPos.y - matchPos.y;
          const d = Math.sqrt(dx * dx + dy * dy) + 1e-6;
          
          // Push non-matches away from matches
          const pushRadius = 80;
          if (d < pushRadius) {
            const falloff = 1 - (d / pushRadius);
            const pushForce = 40 * falloff;
            const fx = (dx / d) * pushForce;
            const fy = (dy / d) * pushForce;
            state.vx[n.id] += fx * dt;
            state.vy[n.id] += fy * dt;
          }
        }
      }
    }
  }
  
  // Wander force - smooth random pathing
  if (wanderEnabled) {
    for (const n of nodes) {
      if (!positions[n.id]) continue;
      
      // Initialize wander state if not present
      if (state.wanderAngle[n.id] === undefined) {
        state.wanderAngle[n.id] = Math.random() * Math.PI * 2;
        state.wanderStrength[n.id] = 0.7 + Math.random() * 0.6;
      }
      
      // Slowly change wander direction (smooth turning)
      const turnAmount = (Math.random() - 0.5) * wanderTurnRate * dt * 60;
      state.wanderAngle[n.id] += turnAmount;
      
      // Apply wander force in current direction
      const angle = state.wanderAngle[n.id];
      const strength = wanderStrength * (state.wanderStrength[n.id] || 1);
      const fx = Math.cos(angle) * strength;
      const fy = Math.sin(angle) * strength;
      
      state.vx[n.id] += fx * dt;
      state.vy[n.id] += fy * dt;
    }
  }
  
  // Cursor attraction force - gently pull nodes toward cursor while maintaining wander
  if (cursorForce && cursorForce.isActive) {
    const { position, attractionRadius, attractionStrength, tetheredMode, maxTetherDistance = 25, tetherStrength = 0.15 } = cursorForce;
    
    // Build anchor position lookup if in tethered mode
    const anchorPositions = new Map<string, { x: number; y: number }>();
    if (tetheredMode && genreAnchors && genreAnchors.length > 0) {
      for (const anchor of genreAnchors) {
        anchorPositions.set(anchor.genreId, { x: anchor.x, y: anchor.y });
      }
    }
    
    for (const n of nodes) {
      const pos = positions[n.id];
      if (!pos) continue;
      
      const dx = position.x - pos.x;
      const dy = position.y - pos.y;
      const d = Math.sqrt(dx * dx + dy * dy) + 1e-6;
      
      // Only attract nodes within radius
      if (d < attractionRadius) {
        // Smooth falloff - stronger at edge, gentler close to cursor
        const normalizedDist = d / attractionRadius;
        // Use smooth curve: stronger pull at medium distance, weaker very close and far
        const falloff = normalizedDist * (1 - normalizedDist) * 4; // Bell curve peaking at 0.5
        
        if (tetheredMode) {
          // Tethered mode: direct pull but limited by anchor distance
          const anchor = anchorPositions.get(n.id);
          if (anchor) {
            // Calculate potential new position with attraction
            const pullForce = attractionStrength * falloff * 1.5;
            const pullX = (dx / d) * pullForce * 0.016; // dt approximation
            const pullY = (dy / d) * pullForce * 0.016;
            
            // Check if this would exceed tether distance
            const newX = pos.x + pullX;
            const newY = pos.y + pullY;
            const distFromAnchor = Math.sqrt((newX - anchor.x) ** 2 + (newY - anchor.y) ** 2);
            
            if (distFromAnchor < maxTetherDistance) {
              // Within tether range - apply full pull
              state.vx[n.id] += (dx / d) * pullForce * 0.016 * 60;
              state.vy[n.id] += (dy / d) * pullForce * 0.016 * 60;
            } else {
              // At tether limit - reduce pull based on how far over limit
              const overLimit = (distFromAnchor - maxTetherDistance) / maxTetherDistance;
              const reducedPull = Math.max(0, 1 - overLimit * 2);
              state.vx[n.id] += (dx / d) * pullForce * 0.016 * 60 * reducedPull;
              state.vy[n.id] += (dy / d) * pullForce * 0.016 * 60 * reducedPull;
            }
          }
        } else {
          // Normal mode: influence wander direction
          const targetAngle = Math.atan2(dy, dx);
          if (state.wanderAngle[n.id] !== undefined) {
            const angleDiff = targetAngle - state.wanderAngle[n.id];
            const normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
            state.wanderAngle[n.id] += normalizedDiff * attractionStrength * falloff * 0.016 * 2;
          }
          
          // Add very subtle direct attraction force
          const pullForce = attractionStrength * falloff * 0.3;
          state.vx[n.id] += (dx / d) * pullForce * 0.016;
          state.vy[n.id] += (dy / d) * pullForce * 0.016;
        }
      } else if (tetheredMode) {
        // Outside attraction radius in tethered mode - pull back to anchor
        const anchor = anchorPositions.get(n.id);
        if (anchor) {
          const toAnchorX = anchor.x - pos.x;
          const toAnchorY = anchor.y - pos.y;
          const distFromAnchor = Math.sqrt(toAnchorX * toAnchorX + toAnchorY * toAnchorY);
          
          if (distFromAnchor > 2) { // Only pull if noticeably away from anchor
            // Gentle spring back to anchor
            state.vx[n.id] += toAnchorX * tetherStrength;
            state.vy[n.id] += toAnchorY * tetherStrength;
          }
        }
      }
    }
  }
  
  // Integrate velocities, apply damping, jitter, clamp, and boundary checks
  for (const n of nodes) {
    if (!positions[n.id]) continue;
    let vx = (state.vx[n.id] || 0) * (1 - damping);
    let vy = (state.vy[n.id] || 0) * (1 - damping);
    
    // Only add jitter if wander is not enabled (wander provides smoother motion)
    if (!wanderEnabled) {
      vx += (Math.random() - 0.5) * jitter;
      vy += (Math.random() - 0.5) * jitter;
    }
    
    // Cursor slowdown effect - nodes near cursor move slower for easier clicking
    if (cursorForce && cursorForce.isActive) {
      const pos = positions[n.id];
      if (pos) {
        const dx = cursorForce.position.x - pos.x;
        const dy = cursorForce.position.y - pos.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        
        if (d < cursorForce.slowdownRadius) {
          // Smooth slowdown - slower closer to cursor
          const normalizedDist = d / cursorForce.slowdownRadius;
          // Ease-out curve for smooth transition
          const slowdown = cursorForce.slowdownFactor + (1 - cursorForce.slowdownFactor) * (normalizedDist * normalizedDist);
          vx *= slowdown;
          vy *= slowdown;
        }
      }
    }
    
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
      
      // Bounce off walls with velocity reversal and wander direction change
      if (positions[n.id].x < -maxX) {
        positions[n.id].x = -maxX;
        vx = Math.abs(vx) * 0.5; // bounce back with damping
        // Reverse wander direction horizontally
        if (state.wanderAngle[n.id] !== undefined) {
          state.wanderAngle[n.id] = Math.PI - state.wanderAngle[n.id];
        }
      } else if (positions[n.id].x > maxX) {
        positions[n.id].x = maxX;
        vx = -Math.abs(vx) * 0.5;
        if (state.wanderAngle[n.id] !== undefined) {
          state.wanderAngle[n.id] = Math.PI - state.wanderAngle[n.id];
        }
      }
      
      if (positions[n.id].y < -maxY) {
        positions[n.id].y = -maxY;
        vy = Math.abs(vy) * 0.5;
        // Reverse wander direction vertically
        if (state.wanderAngle[n.id] !== undefined) {
          state.wanderAngle[n.id] = -state.wanderAngle[n.id];
        }
      } else if (positions[n.id].y > maxY) {
        positions[n.id].y = maxY;
        vy = -Math.abs(vy) * 0.5;
        if (state.wanderAngle[n.id] !== undefined) {
          state.wanderAngle[n.id] = -state.wanderAngle[n.id];
        }
      }
    }
    
    state.vx[n.id] = vx;
    state.vy[n.id] = vy;
  }
}
