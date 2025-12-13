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
    CONFIG
  } from "$lib/stores/uiStore";
  import { renderGraph, hitTest, type RenderNode, type RenderEdge } from "./renderer";
  import { stepPhysics, createPhysicsState } from "$lib/graph/physics";
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
  
  // Drag state
  let draggedNodeId: string | null = null;
  let dragOffset = { x: 0, y: 0 };
  let isDragging = false;
  
  const physicsParams = {
    repulsion: 150,  // erhöht von 100 um Überschneidungen zu vermeiden
    spring: 0.005,   // sehr schwache Springs für Zusammenhalt
    restLength: 200,
    damping: 0.6,    // hohe Dämpfung für fließende Bewegung
    jitter: 0.3,     // mehr Jitter für natürliche Wasser-Bewegung
    maxSpeed: 1.5    // langsame, sanfte Bewegung
  } as const;

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
      // Ensure physics state has all ids
      if (Object.keys(physicsState.vx).length !== nodes.length) {
        physicsState = createPhysicsState(nodes.map(n => n.id));
      }
      // Reset velocity of dragged node to prevent physics interference
      if (draggedNodeId) {
        physicsState.vx[draggedNodeId] = 0;
        physicsState.vy[draggedNodeId] = 0;
      }
      stepPhysics(nodes, edges, pos, radii, physicsState, physicsParams, 1/60, {
        width: canvas.width / dpr,
        height: canvas.height / dpr
      });
      // Persist positions back to store so derived edges update
      positionsStore.set(pos);
    }
    
    renderGraph(ctx, canvas, nodes, edges, {
      hoveredId,
      focusedId,
      animatingNodes: animMap,
      reducedMotion: rm,
      dpr,
      now: performance.now()
    });
    
    frameId = requestAnimationFrame(loop);
  }

  function getNodeUnderMouse(x: number, y: number): string | null {
    return hitTest(nodes, x, y, canvas.width, canvas.height, dpr);
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
    
    // Handle dragging
    if (draggedNodeId) {
      isDragging = true; // Mark as dragging on first move
      const pos = get(positionsStore);
      const centerX = (x - width / 2 / dpr) * dpr;
      const centerY = (y - height / 2 / dpr) * dpr;
      pos[draggedNodeId] = {
        x: centerX - dragOffset.x,
        y: centerY - dragOffset.y
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
        const centerX = (x - width / 2 / dpr) * dpr;
        const centerY = (y - height / 2 / dpr) * dpr;
        dragOffset = {
          x: centerX - nodePos.x,
          y: centerY - nodePos.y
        };
      }
    }
  }
  
  function handleMouseUp(event: MouseEvent) {
    // If we didn't actually drag, treat as click (pin toggle)
    if (draggedNodeId && !isDragging) {
      togglePin(draggedNodeId);
    }
    draggedNodeId = null;
    isDragging = false;
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
    unsubs.push(visibleNodes.subscribe((n) => { nodes = n as RenderNode[]; }));
    unsubs.push(visibleEdges.subscribe((e) => { edges = e as RenderEdge[]; }));
    unsubs.push(hoverNodeId.subscribe((id) => { hoveredId = id; }));
    unsubs.push(focusedNodeId.subscribe((id) => { focusedId = id; }));
    unsubs.push(reducedMotion.subscribe((v) => { rm = v; }));
    unsubs.push(animatingNodes.subscribe((m) => { animMap = m; }));
    
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

<style>
  .graph-canvas {
    width: 100%;
    height: 100%;
    min-height: 500px;
    display: block;
    background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
    border-radius: 12px;
    cursor: grab;
    outline: none;
    border: 1px solid rgba(255, 255, 255, 0.06);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
  }
  
  .graph-canvas:active {
    cursor: grabbing;
  }
  
  .graph-canvas:focus {
    box-shadow: 0 0 0 3px rgba(29, 185, 84, 0.4), 0 12px 30px rgba(0, 0, 0, 0.35);
  }
</style>
