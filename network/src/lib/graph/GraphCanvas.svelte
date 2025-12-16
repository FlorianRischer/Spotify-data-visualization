<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { get } from "svelte/store";
  import {
    graphData,
    visibleNodes,
    visibleEdges,
    addNeighbors,
    togglePin
  } from "$lib/stores/graphStore";
  import {
    hoverNodeId,
    hoverPosition,
    reducedMotion,
    focusedNodeId,
    keyboardMode,
    tooltipData,
    animatingNodes,
    startNodeAnimation,
    clearExpiredAnimations,
    isStartAnimationRunning,
    CONFIG,
    uiStore
  } from "$lib/stores/uiStore";
  import { scrollyStore, setIntroComplete } from "$lib/stores/scrollyStore";
  import { renderGraph, hitTest, type RenderNode, type RenderEdge } from "./renderer";
  import { stepPhysics, createPhysicsState, createGenreAnchors, createCategoryBasedGenreAnchors, createOverviewAnchors, type GenreAnchor } from "$lib/graph/physics";
  import { positions as positionsStore } from "$lib/stores";

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let width = 1200;
  let height = 800;
  let dpr = 1;
  let scaleFactor = 1; // Proportional scaling factor für alle Größen
  
  let frameId: number | null = null;
  let hoverTimer: ReturnType<typeof setTimeout> | null = null;
  let hideTimer: ReturnType<typeof setTimeout> | null = null;
  
  // Local state for render loop
  let nodes: RenderNode[] = [];
  let edges: RenderEdge[] = [];
  let hoveredId: string | null = null;
  let focusedId: string | null = null;
  let rm = false;
  let animMap = new Map<string, { startTime: number; duration: number }>();
  let physicsState = createPhysicsState([]);
  let genreAnchors: GenreAnchor[] = []; // Vordefinierte Genre-Positionen
  
  // Drag state
  let draggedNodeId: string | null = null;
  let dragOffset = { x: 0, y: 0 };
  let isDragging = false;
  
  // Hover scale animation state (for organic water-droplet effect)
  let hoverScaleMap = new Map<string, { scale: number; velocity: number; startTime: number }>();
  const HOVER_SCALE_TARGET = 1.35; // Target scale for hovered nodes (strong growth)
  const HOVER_SCALE_SPEED = 0.08; // Animation speed (higher = faster)
  const HOVER_SCALE_BOUNCE = 0.6; // Bounce/elasticity factor
  
  // Camera state for scrolly-telling
  let cameraZoom = 1;
  let cameraX = 0;
  let cameraY = 0;
  let focusedCategory: string | null = null;
  
  // Centered/focused node state
  let centeredNodeId: string | null = null;
  let centerAnimationStart: number | null = null;
  let centerAnimationDuration = 800; // ms
  let originalNodePosition: { x: number; y: number } | null = null;
  
  // Animation state
  let startAnimationTime: number | null = null;
  let initialPositions: Record<string, { x: number; y: number }> | null = null;
  let settlingTime: number | null = null; // Phase after animation where physics stabilize nodes
  const START_ANIMATION_DURATION = 10000; // 10 seconds spiral + deceleration
  const SETTLING_DURATION = 300; // Physics run freely to settle nodes (300ms)
  const TRANSITION_DURATION = 800; // Faster grouping: reduced from 1500ms for quicker node sorting
  let transitionStartTime: number | null = null; // Startet wenn Animation endet
  
  // Overview-Modus: Verzögerung bis Ankerpunkte aktiviert werden
  let overviewTransitionStartTime: number | null = null;
  const OVERVIEW_TRANSITION_DURATION = 1200; // Sanfte Transition zu Overview
  
  // Baseline-Parameter für 1200x800 Canvas (Referenzbasis für alle Skalierungen)
  const BASELINE_PHYSICS_PARAMS = {
    repulsion: 160, // Reduced from 180 for smoother spacing
    spring: 0.005,
    restLength: 200,
    damping: 0.82, // Increased from 0.75 for smoother motion
    jitter: 0.05,
    maxSpeed: 1.8, // Reduced from 2.2 to prevent snappy movements
    groupAttraction: 5,
    genreAnchorStrength: 3.2
  };

  const BASELINE_SPIRAL_PARAMS = {
    minRadius: 220, // Increased to prevent node overlapping at end of animation
    maxRadius: 380, // Increased to prevent node overlapping at end of animation
    radiusVariation: 160, // Increased from 120 for better spacing
    offsetRange: 30,
    offsetAmount: 15
  };
  
  let physicsParams = {
    repulsion: BASELINE_PHYSICS_PARAMS.repulsion,
    spring: BASELINE_PHYSICS_PARAMS.spring,
    restLength: BASELINE_PHYSICS_PARAMS.restLength,
    damping: BASELINE_PHYSICS_PARAMS.damping,
    jitter: BASELINE_PHYSICS_PARAMS.jitter,
    maxSpeed: BASELINE_PHYSICS_PARAMS.maxSpeed,
    groupAttraction: BASELINE_PHYSICS_PARAMS.groupAttraction,
    genreAnchorStrength: BASELINE_PHYSICS_PARAMS.genreAnchorStrength
  };

  function getSpiralPosition(
    centerX: number,
    centerY: number,
    index: number,
    total: number,
    progress: number // 0 to 1
  ): { x: number; y: number } {
    // Smooth easing for natural motion: ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    
    // Pseudo-random seed basierend auf Index für konsistente, aber variierende Positionen
    // Simple seeded random function
    const pseudoRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    
    // Angle per node in the circle
    const anglePerNode = (Math.PI * 2) / total;
    const baseAngle = index * anglePerNode;
    
    // Spiral out: start from center (radius 0) and expand to final radius
    // While rotating multiple times
    const rotations = eased * 3; // 3 full rotations during spiral out (reduced from 4)
    const angle = baseAngle + rotations * Math.PI * 2;
    
    // Variiere die finalen Radien: Min 220, Max 380 für breitere Verteilung
    // RESPONSIVE: Alle Werte werden mit scaleFactor multipliziert
    const radiusVariation = pseudoRandom(index * 7.3) * (BASELINE_SPIRAL_PARAMS.radiusVariation * scaleFactor);
    const minRadius = BASELINE_SPIRAL_PARAMS.minRadius * scaleFactor;
    const maxRadius = BASELINE_SPIRAL_PARAMS.maxRadius * scaleFactor;
    const randomizedFinalRadius = minRadius + radiusVariation;
    
    // Spirale von Mitte (0) zum variierten Radius
    const radius = eased * randomizedFinalRadius;
    
    // Kleine zufällige Offsets für natürlichere Asteroiden-Verteilung
    // RESPONSIVE: Offsets werden auch mit scaleFactor multipliziert
    const offsetRange = BASELINE_SPIRAL_PARAMS.offsetRange * scaleFactor;
    const offsetAmount = BASELINE_SPIRAL_PARAMS.offsetAmount * scaleFactor;
    const offsetX = pseudoRandom(index * 11.7) * offsetRange - offsetAmount;
    const offsetY = pseudoRandom(index * 13.1) * offsetRange - offsetAmount;
    
    return {
      x: centerX + Math.cos(angle) * radius + offsetX,
      y: centerY + Math.sin(angle) * radius + offsetY
    };
  }

  function resize() {
    if (!canvas) return;
    
    // ============================================
    // DEVICE PIXEL RATIO (nur für Buffer-Größe)
    // ============================================
    dpr = window.devicePixelRatio || 1;
    
    // ============================================
    // CSS PIXEL SPACE (für Simulation)
    // ============================================
    const rect = canvas.getBoundingClientRect();
    const cssWidth = rect.width;
    const cssHeight = rect.height;
    
    // Aktualisiere nur wenn sich CSS-Dimensionen ändern
    if (cssWidth === width && cssHeight === height) {
      return; // Keine Änderung
    }
    
    width = cssWidth;
    height = cssHeight;
    
    // ============================================
    // SCALE FACTOR (nur aus CSS-Pixeln)
    // ============================================
    // Baseline = 1200x800 CSS-Pixel
    const baselineWidth = 1200;
    const baselineHeight = 800;
    const widthScale = width / baselineWidth;
    const heightScale = height / baselineHeight;
    scaleFactor = Math.min(widthScale, heightScale);
    
    // ============================================
    // LOGGING
    // ============================================
    console.log('%c[RESIZE]', 'color:blue;font-weight:bold', {
      cssW: cssWidth,
      cssH: cssHeight,
      dpr: dpr,
      scaleFactor: scaleFactor.toFixed(3),
      bufferW: Math.floor(cssWidth * dpr),
      bufferH: Math.floor(cssHeight * dpr)
    });
    
    // ============================================
    // PHYSICS PARAMETER UPDATE
    // ============================================
    // Alle skalierbaren Parameter werden nur mit scaleFactor multipliziert
    physicsParams.repulsion = BASELINE_PHYSICS_PARAMS.repulsion * scaleFactor;
    physicsParams.restLength = BASELINE_PHYSICS_PARAMS.restLength * scaleFactor;
    physicsParams.jitter = BASELINE_PHYSICS_PARAMS.jitter * scaleFactor;
    physicsParams.maxSpeed = BASELINE_PHYSICS_PARAMS.maxSpeed * scaleFactor;
    physicsParams.groupAttraction = BASELINE_PHYSICS_PARAMS.groupAttraction * scaleFactor;
    physicsParams.genreAnchorStrength = BASELINE_PHYSICS_PARAMS.genreAnchorStrength * scaleFactor;
    // spring und damping bleiben konstant (keine Skalierung)
    
    // ============================================
    // CANVAS BUFFER SIZE (nur für Rendering-Auflösung)
    // ============================================
    // Buffer-Größe = CSS-Pixel × dpr
    const bufferWidth = Math.floor(cssWidth * dpr);
    const bufferHeight = Math.floor(cssHeight * dpr);
    canvas.width = bufferWidth;
    canvas.height = bufferHeight;
  }

  function loop() {
    if (!ctx || !canvas) return;
    
    clearExpiredAnimations();
    
    // Handle start animation (spiral motion) - completely separate from physics
    if (startAnimationTime !== null && !rm && nodes.length > 0) {
      // Setze animation state auf true
      isStartAnimationRunning.set(true);
      
      const elapsed = performance.now() - startAnimationTime;
      const animProgress = Math.min(1, elapsed / START_ANIMATION_DURATION);
      
      if (animProgress < 1) {
        // Still animating: apply spiral motion only, no physics
        const pos = get(positionsStore);
        const centerX = 0;
        const centerY = 0;
        
        for (let i = 0; i < nodes.length; i++) {
          const nodeId = nodes[i].id;
          // Stagger animation: each node starts slightly later
          const staggerAmount = 0.15; // 15% of total animation per node
          const staggerDelay = (i / nodes.length) * staggerAmount;
          const nodeAnimProgress = Math.min(1, Math.max(0, (animProgress - staggerDelay) / (1 - staggerAmount)));
          
          const spiralPos = getSpiralPosition(centerX, centerY, i, nodes.length, nodeAnimProgress);
          pos[nodeId] = spiralPos;
        }
        // Reset physics state to prevent any interference
        physicsState = createPhysicsState(nodes.map(n => n.id));
        positionsStore.set(pos);
      } else {
        // Animation complete - let physics settle nodes to stable positions
        startAnimationTime = null;
        settlingTime = performance.now();
        // Setze animation state auf false
        isStartAnimationRunning.set(false);
      }
    }
    
    // Settling phase: let physics run freely to find equilibrium positions
    if (settlingTime !== null && !rm && nodes.length > 0) {
      const elapsed = performance.now() - settlingTime;
      
      if (elapsed < SETTLING_DURATION) {
        // Physics are settling - run them normally with high damping
        const radii: Record<string, number> = {};
        for (const n of nodes) radii[n.id] = Math.max(8, n.size) * 0.4 * scaleFactor;
        const pos = get(positionsStore);
        
        const settlingParams = {
          ...physicsParams,
          damping: 0.90, // High damping to quickly find equilibrium
          maxSpeed: 1.2, // Limit speed during settling
          repulsion: physicsParams.repulsion * 0.9 // Slightly reduced for stability
        };
        
        stepPhysics(nodes, edges, pos, radii, physicsState, settlingParams, 1/60, {
          width: canvas.width / dpr,
          height: canvas.height / dpr
        });
        
        positionsStore.set(pos);
      } else {
        // Settling complete - capture final positions and start normal physics
        initialPositions = { ...get(positionsStore) };
        settlingTime = null;
        transitionStartTime = performance.now();
      }
    }
    
    // Physics step (skip if reduced motion or during animation)
    // Keep running even while dragging so nearby nodes can react/escape
    if (!rm && nodes.length > 0 && startAnimationTime === null && settlingTime === null) {
      // Build radii map mit proportionalem Scaling
      // scaleFactor berücksichtigt unterschiedliche Canvas-Größen
      const radii: Record<string, number> = {};
      for (const n of nodes) radii[n.id] = Math.max(8, n.size) * 0.4 * scaleFactor;
      // Fetch and mutate positions from store
      const pos = get(positionsStore);
      
      // Handle smooth transition to physics after animation
      let transitionProgress = 0; // 0 = animation just ended, 1 = full physics
      
      if (transitionStartTime !== null && initialPositions) {
        // Smooth transition phase: blend from animation end position to physics equilibrium
        const elapsed = performance.now() - transitionStartTime;
        transitionProgress = Math.min(1, elapsed / TRANSITION_DURATION);
        
        if (transitionProgress >= 1) {
          // Transition complete
          transitionStartTime = null;
          initialPositions = null;
        }
      } else {
        // Normal physics mode
        transitionProgress = 1;
      }
      
      // Ensure physics state has all ids
      if (Object.keys(physicsState.vx).length !== nodes.length) {
        physicsState = createPhysicsState(nodes.map(n => n.id));
      }
      // Reset velocity of dragged node to prevent physics interference
      if (draggedNodeId) {
        physicsState.vx[draggedNodeId] = 0;
        physicsState.vy[draggedNodeId] = 0;
      }
      
      // Get current UI state to determine if grouping is active
      const uiState = get(uiStore);
      const graphState = get(graphData);
      const scrollState = get(scrollyStore);
      const groups = uiState.showArtistGroups ? graphState?.groups : undefined;
      
      // Bestimme welche Ankerpunkte zu verwenden sind
      const isOverviewMode = scrollState.phase === 'overview' || scrollState.isInOverview;
      
      // Starte Overview-Transition wenn in Overview-Modus gewechselt wird
      if (isOverviewMode && overviewTransitionStartTime === null) {
        overviewTransitionStartTime = performance.now();
        // Lösche alte Ankerpunkte beim Wechsel zu Overview
        genreAnchors = [];
      } else if (!isOverviewMode) {
        overviewTransitionStartTime = null;
      }
      
      // Berechne Overview-Transition-Progress
      let overviewTransitionProgress = 0;
      if (overviewTransitionStartTime !== null) {
        const elapsed = performance.now() - overviewTransitionStartTime;
        overviewTransitionProgress = Math.min(1, elapsed / OVERVIEW_TRANSITION_DURATION);
      }
      
      // Erstelle Ankerpunkte basierend auf Mode mit Transition-Verzögerung
      if (isOverviewMode && overviewTransitionProgress > 0.2 && genreAnchors.length === 0 && nodes.length > 0) {
        // Overview-Modus: verteile Gruppen über den Screen (nach 20% der Transition)
        const scaledWidth = canvas.width / dpr;
        const scaledHeight = canvas.height / dpr;
        genreAnchors = createOverviewAnchors(nodes as any, scaledWidth, scaledHeight, 300);
      } else if (!isOverviewMode && uiState.showGenreGrouping && genreAnchors.length === 0 && nodes.length > 0) {
        // Genre-Gruppierung aktiviert: erstelle Ankerpunkte im Kreis
        // RESPONSIVE: Genre Anchor Radius wird mit scaleFactor multipliziert (Baseline: 350 für mehr Abstand)
        const scaledGenreAnchorRadius = 350 * scaleFactor;
        genreAnchors = createCategoryBasedGenreAnchors(nodes as any, scaledGenreAnchorRadius);
      } else if (!isOverviewMode && !uiState.showGenreGrouping && genreAnchors.length > 0) {
        // Genre-Gruppierung deaktiviert: entferne Ankerpunkte
        genreAnchors = [];
      }
      
      // Angepasste Physics-Parameter für sanften Übergang
      // Wenn Genre-Gruppierung aktiv ist: verwende genreAnchorStrength, sonst 0
      const activeGenreAnchorStrength = (uiState.showGenreGrouping || isOverviewMode) ? physicsParams.genreAnchorStrength : 0;
      
      // Für Overview-Transition: verstärke genreAnchorStrength graduell UND STÄRKER
      const finalGenreAnchorStrength = isOverviewMode 
        ? activeGenreAnchorStrength * overviewTransitionProgress * 1.5 
        : activeGenreAnchorStrength;
      
      const transitionPhysicsParams = {
        ...physicsParams,
        // Reduziere Krfte während Transition - nicht zu aggressiv
        repulsion: isOverviewMode 
          ? physicsParams.repulsion * 0.4  // Schwächere Repulsion im Overview
          : physicsParams.repulsion * (0.3 + transitionProgress * 0.7),
        maxSpeed: isOverviewMode 
          ? physicsParams.maxSpeed * 0.8  // Höhere maxSpeed im Overview für schnellere Verteilung
          : physicsParams.maxSpeed * 0.5, // Keep nodes slow during transition
        damping: isOverviewMode 
          ? 0.75  // Weniger Damping im Overview für bessere Verteilung
          : 0.85, // High damping for smooth, slow motion
        // Erhh genreAnchorStrength graduell während bergang (nur wenn aktiv)
        genreAnchorStrength: finalGenreAnchorStrength
      };
      
      stepPhysics(nodes, edges, pos, radii, physicsState, transitionPhysicsParams, 1/60, {
        width: canvas.width / dpr,
        height: canvas.height / dpr
      }, groups, genreAnchors);
      
      // During transition: blend positions from animation end to physics equilibrium
      if (transitionProgress < 1 && initialPositions) {
        const easeOut = 1 - Math.pow(1 - transitionProgress, 3); // Ease out cubic for smooth blend
        for (const n of nodes) {
          if (pos[n.id] && initialPositions[n.id]) {
            // Smoothly interpolate from animation position to physics position
            const animPos = initialPositions[n.id];
            const physicsPos = pos[n.id];
            pos[n.id] = {
              x: animPos.x + (physicsPos.x - animPos.x) * easeOut,
              y: animPos.y + (physicsPos.y - animPos.y) * easeOut
            };
          }
        }
      }
      
      // Apply hover repulsion force on nearby nodes (water displacement effect)
      if (hoveredId && hoverScaleMap.has(hoveredId)) {
        const hoveredNode = nodes.find(n => n.id === hoveredId);
        const hoveredScale = hoverScaleMap.get(hoveredId)?.scale ?? 1;
        
        if (hoveredNode && hoveredScale > 1) {
          const hoverInfluenceRadius = 220;
          const hoverRepulsionForce = (hoveredScale - 1) * 0.18; // Slightly reduced from 0.25
          
          for (const n of nodes) {
            if (n.id === hoveredId) continue;
            const posNode = pos[n.id];
            const posHovered = pos[hoveredId];
            if (!posNode || !posHovered) continue;
            
            const dx = posNode.x - posHovered.x;
            const dy = posNode.y - posHovered.y;
            const distSq = dx * dx + dy * dy;
            const distance = Math.sqrt(distSq);
            
            // Quadratic falloff within influence radius
            if (distance < hoverInfluenceRadius && distance > 0.1) {
              const influence = (1 - distance / hoverInfluenceRadius) * hoverRepulsionForce;
              const nx = (dx / distance) * influence;
              const ny = (dy / distance) * influence;
              
              // Apply smooth push to nearby nodes
              physicsState.vx[n.id] += nx * 0.6; // Reduced from 0.8
              physicsState.vy[n.id] += ny * 0.6; // Reduced from 0.8
              posNode.x += nx * 0.04; // Reduced from 0.06
              posNode.y += ny * 0.04; // Reduced from 0.06
            }
          }
        }
      }
      
      // Animate centered node to center
      if (centeredNodeId && centerAnimationStart !== null) {
        const elapsed = performance.now() - centerAnimationStart;
        const progress = Math.min(1, elapsed / centerAnimationDuration);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        
        if (originalNodePosition && pos[centeredNodeId]) {
          // Interpolate to center (0, 0)
          pos[centeredNodeId] = {
            x: originalNodePosition.x * (1 - eased),
            y: originalNodePosition.y * (1 - eased)
          };
          // Freeze velocity
          physicsState.vx[centeredNodeId] = 0;
          physicsState.vy[centeredNodeId] = 0;
        }
      }
      
      // Persist positions back to store so derived edges update
      positionsStore.set(pos);
    }
    
    // Update hover scale animations (organic water-droplet physics)
    const now = performance.now();
    for (const [nodeId, state] of hoverScaleMap.entries()) {
      const target = hoveredId === nodeId ? HOVER_SCALE_TARGET : 1;
      const diff = target - state.scale;
      
      // Elastic animation with bounce
      const acceleration = diff * HOVER_SCALE_SPEED;
      state.velocity = (state.velocity + acceleration) * HOVER_SCALE_BOUNCE;
      state.scale += state.velocity;
      
      // Stop animating when close enough to target
      if (Math.abs(state.scale - target) < 0.02 && Math.abs(state.velocity) < 0.01) {
        state.scale = target;
        state.velocity = 0;
        if (target === 1) {
          hoverScaleMap.delete(nodeId);
        }
      }
    }
    
    renderGraph(ctx, canvas, nodes, edges, {
      hoveredId,
      focusedId,
      centeredNodeId,
      showConnections: get(uiStore).showConnections,
      animatingNodes: animMap,
      reducedMotion: rm,
      dpr,
      now: performance.now(),
      groups: (get(graphData)?.groups),
      // Native canvas zoom
      cameraZoom,
      cameraX,
      cameraY,
      focusedCategory,
      hoverScaleMap
    });
    
    frameId = requestAnimationFrame(loop);
  }

  function getNodeUnderMouse(x: number, y: number): string | null {
    return hitTest(nodes, x, y, canvas.width, canvas.height, dpr, cameraZoom, cameraX, cameraY);
  }

  function scheduleExpansion(nodeId: string) {
    if (hoverTimer) clearTimeout(hoverTimer);
    
    hoverTimer = setTimeout(() => {
      const added = addNeighbors(nodeId, CONFIG.batchSize);
      for (const id of added) {
        startNodeAnimation(id, CONFIG.animationDuration);
      }
    }, CONFIG.hoverDelay);
  }

  function updateTooltip(nodeId: string | null, x: number, y: number) {
    if (!nodeId) {
      tooltipData.set(null);
      return;
    }
    
    const g = get(graphData);
    if (!g) return;
    
    const node = g.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const totalMs = g.nodes.reduce((sum, n) => sum + n.totalMinutes, 0);
    const pct = totalMs > 0 ? (node.totalMinutes / totalMs) * 100 : 0;
    const degree = g.adjacency[nodeId]?.length ?? 0;
    
    tooltipData.set({
      nodeId,
      label: node.label,
      playCount: node.playCount,
      totalMinutes: node.totalMinutes,
      degree,
      percentage: pct,
      topArtist: node.topArtist,
      topArtistMinutes: node.topArtistMinutes,
      x,
      y
    });
  }

  function handleMouseMove(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    // CSS-Pixel Koordinaten relativ zum Canvas
    const cssX = event.clientX - rect.left;
    const cssY = event.clientY - rect.top;
    
    // Konvertiere zu Buffer-Pixel Koordinaten für hitTest
    const bufferX = cssX * dpr;
    const bufferY = cssY * dpr;
    
    // Handle dragging - need to convert to world coordinates for node position
    if (draggedNodeId) {
      isDragging = true; // Mark as dragging on first move
      const pos = get(positionsStore);
      // Convert screen to world coordinates (accounting for camera)
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const worldX = ((cssX - centerX) / cameraZoom + cameraX) * dpr;
      const worldY = ((cssY - centerY) / cameraZoom + cameraY) * dpr;
      pos[draggedNodeId] = {
        x: worldX - dragOffset.x,
        y: worldY - dragOffset.y
      };
      positionsStore.set(pos);
      // Reset velocity to prevent physics interference
      if (physicsState.vx[draggedNodeId] !== undefined) {
        physicsState.vx[draggedNodeId] = 0;
        physicsState.vy[draggedNodeId] = 0;
      }
      return;
    }
    
    // Übergebe Buffer-Pixel an hitTest
    const id = getNodeUnderMouse(bufferX, bufferY);
    
    // Hide timer management
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    
    if (id !== hoveredId) {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
      }
      
      // Trigger hover scale animation for new node
      if (id) {
        hoverScaleMap.set(id, {
          scale: 1,
          velocity: 0,
          startTime: performance.now()
        });
        // Show pointer cursor when hovering a node
        canvas.style.cursor = 'pointer';
      } else {
        // Clear old hover scale
        if (hoveredId) {
          hoverScaleMap.delete(hoveredId);
        }
        // Reset cursor when leaving node
        canvas.style.cursor = 'default';
      }
      
      hoverNodeId.set(id);
      // Speichere die CSS-Pixel Position für Tooltip
      hoverPosition.set(id ? { x: cssX, y: cssY } : null);
      
      if (id) {
        scheduleExpansion(id);
        // Übergebe Fenster-Koordinaten für das Tooltip
        updateTooltip(id, event.clientX, event.clientY);
      } else {
        tooltipData.set(null);
      }
    } else if (id) {
      // Update tooltip position while hovering same node
      updateTooltip(id, event.clientX, event.clientY);
    }
  }

  function handleMouseLeave() {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      hoverTimer = null;
    }
    
    // Clear hover scale for current node
    if (hoveredId) {
      hoverScaleMap.delete(hoveredId);
    }
    
    // Reset cursor when leaving canvas
    canvas.style.cursor = 'default';
    
    // Grace period before hiding
    hideTimer = setTimeout(() => {
      hoverNodeId.set(null);
      hoverPosition.set(null);
      tooltipData.set(null);
    }, CONFIG.hideDelay);
  }

  function handleMouseDown(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    // CSS-Pixel Koordinaten relativ zum Canvas
    const cssX = event.clientX - rect.left;
    const cssY = event.clientY - rect.top;
    
    // Konvertiere zu Buffer-Pixel Koordinaten für hitTest
    const bufferX = cssX * dpr;
    const bufferY = cssY * dpr;
    
    const id = getNodeUnderMouse(bufferX, bufferY);
    if (id) {
      // Start dragging
      draggedNodeId = id;
      isDragging = false; // will become true on first move
      const pos = get(positionsStore);
      const nodePos = pos[id];
      if (nodePos) {
        // Convert screen to world coordinates (accounting for camera)
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const worldX = ((cssX - centerX) / cameraZoom + cameraX) * dpr;
        const worldY = ((cssY - centerY) / cameraZoom + cameraY) * dpr;
        dragOffset = {
          x: worldX - nodePos.x,
          y: worldY - nodePos.y
        };
      }
    }
  }
  
  function handleMouseUp(event: MouseEvent) {
    // If we didn't actually drag, treat as click
    if (draggedNodeId && !isDragging) {
      // Toggle centered state
      if (centeredNodeId === draggedNodeId) {
        // Click on already centered node: uncenter
        unCenterNode();
      } else {
        // Center this node
        centerNode(draggedNodeId);
      }
    }
    draggedNodeId = null;
    isDragging = false;
  }
  
  function centerNode(nodeId: string) {
    const pos = get(positionsStore);
    const nodePos = pos[nodeId];
    if (nodePos) {
      originalNodePosition = { ...nodePos };
      centeredNodeId = nodeId;
      centerAnimationStart = performance.now();
      focusedNodeId.set(nodeId);
    }
  }
  
  function unCenterNode() {
    if (centeredNodeId && originalNodePosition) {
      // Animate back to original position
      const pos = get(positionsStore);
      pos[centeredNodeId] = { ...originalNodePosition };
      positionsStore.set(pos);
    }
    centeredNodeId = null;
    centerAnimationStart = null;
    originalNodePosition = null;
    focusedNodeId.set(null);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Tab") {
      keyboardMode.set(true);
      
      const currentNodes = nodes;
      const currentFocused = focusedId;
      
      if (currentNodes.length === 0) return;
      
      event.preventDefault();
      
      const currentIndex = currentFocused 
        ? currentNodes.findIndex(n => n.id === currentFocused)
        : -1;
      
      let nextIndex: number;
      if (event.shiftKey) {
        nextIndex = currentIndex <= 0 ? currentNodes.length - 1 : currentIndex - 1;
      } else {
        nextIndex = currentIndex >= currentNodes.length - 1 ? 0 : currentIndex + 1;
      }
      
      focusedNodeId.set(currentNodes[nextIndex].id);
    }
    
    if (event.key === "Enter" && focusedId) {
      togglePin(focusedId);
      const added = addNeighbors(focusedId, CONFIG.batchSize);
      for (const id of added) {
        startNodeAnimation(id, CONFIG.animationDuration);
      }
    }
    
    if (event.key === "Escape") {
      focusedNodeId.set(null);
      keyboardMode.set(false);
    }
  }

  let unsubs: Array<() => void> = [];

  onMount(() => {
    ctx = canvas.getContext("2d");
    dpr = window.devicePixelRatio || 1;
    resize();
    
    // Global mouseup to handle drag release outside canvas
    const globalMouseUp = () => {
      if (draggedNodeId) {
        draggedNodeId = null;
        isDragging = false;
      }
    };
    window.addEventListener('mouseup', globalMouseUp);
    unsubs.push(() => window.removeEventListener('mouseup', globalMouseUp));
    
    // Global mousemove to continue drag outside canvas
    const globalMouseMove = (e: MouseEvent) => {
      if (isDragging && draggedNodeId) {
        handleMouseMove(e);
      }
    };
    window.addEventListener('mousemove', globalMouseMove);
    unsubs.push(() => window.removeEventListener('mousemove', globalMouseMove));
    
    // Subscribe to stores
    unsubs.push(visibleNodes.subscribe((n) => {
      // Trigger start animation only on first load
      if (nodes.length === 0 && n.length > 0) {
        startAnimationTime = performance.now();
        // Setze animation state sofort, nicht erst im loop!
        isStartAnimationRunning.set(true);
      }
      nodes = n as RenderNode[];
    }));
    unsubs.push(visibleEdges.subscribe((e) => { edges = e as RenderEdge[]; }));
    unsubs.push(hoverNodeId.subscribe((id) => { hoveredId = id; }));
    unsubs.push(focusedNodeId.subscribe((id) => { focusedId = id; }));
    unsubs.push(reducedMotion.subscribe((v) => { rm = v; }));
    unsubs.push(animatingNodes.subscribe((m) => { animMap = m; }));
    // Subscribe to scrolly camera state
    unsubs.push(scrollyStore.subscribe((state) => {
      cameraZoom = state.cameraZoom;
      cameraX = state.cameraX;
      cameraY = state.cameraY;
      focusedCategory = state.focusedCategory;
    }));
    
    // ResizeObserver
    const resizeObs = new ResizeObserver(() => {
      resize();
    });
    resizeObs.observe(canvas);
    unsubs.push(() => resizeObs.disconnect());
    
    // Start render loop
    frameId = requestAnimationFrame(loop);
    
    // Focus canvas for keyboard
    canvas.focus();
  });

  onDestroy(() => {
    if (frameId) cancelAnimationFrame(frameId);
    if (hoverTimer) clearTimeout(hoverTimer);
    if (hideTimer) clearTimeout(hideTimer);
    for (const unsub of unsubs) unsub();
  });
</script>

<div class="canvas-wrapper">
  <canvas
    bind:this={canvas}
    tabindex="0"
    aria-label="Musical Brain Activity Graph - Navigate with Tab, Enter to pin, Escape to exit"
    on:mousemove={handleMouseMove}
    on:mouseleave={handleMouseLeave}
    on:mousedown={handleMouseDown}
    on:mouseup={handleMouseUp}
    on:keydown={handleKeyDown}
    class="graph-canvas"
  ></canvas>
</div>

<style>
  .canvas-wrapper {
    width: 100%;
    height: 100%;
    overflow: hidden;
    flex: 1;
  }

  .graph-canvas {
    width: 100%;
    height: 100%;
    display: block;
    background: transparent;
    outline: none;
    border: none;
  }
  
  .graph-canvas:focus {
    box-shadow: 0 0 0 3px rgba(29, 185, 84, 0.4);
  }
</style>
