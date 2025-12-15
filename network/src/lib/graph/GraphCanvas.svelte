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
    CONFIG,
    uiStore
  } from "$lib/stores/uiStore";
  import { scrollyStore, setIntroComplete } from "$lib/stores/scrollyStore";
  import { renderGraph, hitTest, type RenderNode, type RenderEdge } from "./renderer";
  import { stepPhysics, createPhysicsState, createGenreAnchors, createCategoryBasedGenreAnchors, type GenreAnchor } from "$lib/graph/physics";
  import { positions as positionsStore } from "$lib/stores";

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let width = 1200;
  let height = 800;
  let dpr = 1;
  
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
  const START_ANIMATION_DURATION = 5000; // 5 seconds spiral + deceleration
  const TRANSITION_DURATION = 3000; // 3 seconds smooth transition to physics
  let transitionStartTime: number | null = null; // Startet wenn Animation endet
  
  const physicsParams = {
    repulsion: 180,  // moderiert für sanftere Abstoßung
    spring: 0.005,   // sehr schwache Springs für Zusammenhalt
    restLength: 200,
    damping: 0.75,   // erhöhte Dämpfung für smootheres Schweben
    jitter: 0.05,    // deutlich weniger Jitter für glatte Bewegung
    maxSpeed: 2.2,   // etwas höher für freiere Bewegung
    groupAttraction: 3.5, // stärkere Anziehung für schnellere Zusammenführung
    genreAnchorStrength: 2.5 // Starke Anziehung zu Genre-Ankerpunkten für schnelle Gruppierung
  } as const;

  function getSpiralPosition(
    centerX: number,
    centerY: number,
    index: number,
    total: number,
    progress: number // 0 to 1
  ): { x: number; y: number } {
    // Smooth easing for natural motion
    const eased = progress * progress * (3 - 2 * progress); // Smoothstep
    
    // Angle per node in the circle
    const anglePerNode = (Math.PI * 2) / total;
    const baseAngle = index * anglePerNode;
    
    // Vinyl rotation: only rotate, radius stays constant
    const rotations = eased * 3; // 3 full rotations during animation
    const angle = baseAngle + rotations * Math.PI * 2;
    
    // Constant radius (like vinyl record grooves)
    const radius = 300;
    
    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    };
  }

  function resize() {
    if (!canvas) return;
    dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
  }

  function loop() {
    if (!ctx || !canvas) return;
    
    clearExpiredAnimations();
    
    // Physics step (skip if reduced motion or dragging)
    if (!rm && nodes.length > 0 && !isDragging) {
      // Build radii map (mit 0.4 skaliert für kleinere Nodes)
      const radii: Record<string, number> = {};
      for (const n of nodes) radii[n.id] = Math.max(8, n.size) * 0.4;
      // Fetch and mutate positions from store
      const pos = get(positionsStore);
      
      // Handle start animation and smooth transition to physics
      let transitionProgress = 0; // 0 = animation, 1 = full physics
      
      if (startAnimationTime !== null) {
        const elapsed = performance.now() - startAnimationTime;
        const animProgress = Math.min(1, elapsed / START_ANIMATION_DURATION);
        
        if (animProgress < 1) {
          // Still animating: apply spiral motion
          const centerX = 0;
          const centerY = 0;
          
          for (let i = 0; i < nodes.length; i++) {
            const nodeId = nodes[i].id;
            const spiralPos = getSpiralPosition(centerX, centerY, i, nodes.length, animProgress);
            pos[nodeId] = spiralPos;
          }
          // Reset physics state to prevent jerky movement during animation
          physicsState = createPhysicsState(nodes.map(n => n.id));
        } else {
          // Animation complete - start smooth transition
          startAnimationTime = null;
          initialPositions = null;
          transitionStartTime = performance.now();
        }
      } else if (transitionStartTime !== null) {
        // Smooth transition phase: gradually enable physics forces
        const elapsed = performance.now() - transitionStartTime;
        transitionProgress = Math.min(1, elapsed / TRANSITION_DURATION);
        
        if (transitionProgress >= 1) {
          // Transition complete
          transitionStartTime = null;
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
      const groups = uiState.showArtistGroups ? graphState?.groups : undefined;
      
      // Erstelle kategoriebasierte Genre-Ankerpunkte nur wenn Toggle aktiv ist
      // Ansonsten schweben Nodes frei herum (genreAnchors bleibt leer)
      if (uiState.showGenreGrouping && genreAnchors.length === 0 && nodes.length > 0) {
        // Genre-Gruppierung aktiviert: erstelle Ankerpunkte
        genreAnchors = createCategoryBasedGenreAnchors(nodes as any, 350);
      } else if (!uiState.showGenreGrouping && genreAnchors.length > 0) {
        // Genre-Gruppierung deaktiviert: entferne Ankerpunkte
        genreAnchors = [];
      }
      
      // Angepasste Physics-Parameter für sanften Übergang
      // Wenn Genre-Gruppierung aktiv ist: verwende genreAnchorStrength, sonst 0
      const activeGenreAnchorStrength = uiState.showGenreGrouping ? physicsParams.genreAnchorStrength : 0;
      
      const transitionPhysicsParams = {
        ...physicsParams,
        // Erhöhe Damping während Übergang für sanftere Bewegung
        damping: 0.75 + (1 - transitionProgress) * 0.15,
        // Erhöhe genreAnchorStrength graduell während Übergang (nur wenn aktiv)
        genreAnchorStrength: activeGenreAnchorStrength * transitionProgress
      };
      
      stepPhysics(nodes, edges, pos, radii, physicsState, transitionPhysicsParams, 1/60, {
        width: canvas.width / dpr,
        height: canvas.height / dpr
      }, groups, genreAnchors);
      
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
      focusedCategory
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
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Handle dragging - need to convert to world coordinates for node position
    if (draggedNodeId) {
      isDragging = true; // Mark as dragging on first move
      const pos = get(positionsStore);
      // Convert screen to world coordinates (accounting for camera)
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const worldX = ((x - centerX) / cameraZoom + cameraX) * dpr;
      const worldY = ((y - centerY) / cameraZoom + cameraY) * dpr;
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
    
    const id = getNodeUnderMouse(x, y);
    
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
      
      hoverNodeId.set(id);
      hoverPosition.set(id ? { x, y } : null);
      
      if (id) {
        scheduleExpansion(id);
        updateTooltip(id, x + rect.left, y + rect.top);
      } else {
        tooltipData.set(null);
      }
    } else if (id) {
      // Update tooltip position while hovering same node
      updateTooltip(id, x + rect.left, y + rect.top);
    }
  }

  function handleMouseLeave() {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      hoverTimer = null;
    }
    
    // Grace period before hiding
    hideTimer = setTimeout(() => {
      hoverNodeId.set(null);
      hoverPosition.set(null);
      tooltipData.set(null);
    }, CONFIG.hideDelay);
  }

  function handleMouseDown(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const id = getNodeUnderMouse(x, y);
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
        const worldX = ((x - centerX) / cameraZoom + cameraX) * dpr;
        const worldY = ((y - centerY) / cameraZoom + cameraY) * dpr;
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
    cursor: grab;
    outline: none;
    border: none;
  }
  
  .graph-canvas:active {
    cursor: grabbing;
  }
 
</style>
