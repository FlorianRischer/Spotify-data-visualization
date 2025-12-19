<script lang="ts">
  import { graphData, visibleState, showAllNodes } from '$lib/stores';
  import { uiStore } from '$lib/stores/uiStore';
  import { scrollyStore } from '$lib/stores/scrollyStore';
  
  // Navbar Position: 'center' oder 'bottom'
  let navbarAtBottom = false;
  
  $: nodeCount = $graphData?.nodes.length ?? 0;
  $: edgeCount = $graphData?.edges.length ?? 0;
  $: visibleNodeCount = $visibleState?.nodes.size ?? 0;
  $: visibleEdgeCount = $visibleState?.edges.size ?? 0;
  $: showConnections = $uiStore.showConnections ?? false;
  
  // Navbar Slide Down: Beim ersten Kamera-Zoom nach unten fahren und dort bleiben
  // Triggert sobald isAnimatingCamera true wird (erster Kamera-Zoom startet)
  $: {
    console.log('🔍 scrollyStore update:', {
      isAnimatingCamera: $scrollyStore.isAnimatingCamera,
      phase: $scrollyStore.phase,
      navbarAtBottom
    });
    if ($scrollyStore.isAnimatingCamera && !navbarAtBottom) {
      console.log('🎯 Navbar Slide Down triggered!');
      navbarAtBottom = true;
    }
  }
  
  function toggleConnections() {
    uiStore.update(state => ({
      ...state,
      showConnections: !state.showConnections
    }));
  }
  
  function handleShowAll() {
    showAllNodes();
  }
</script>

<div class="control-panel" class:at-bottom={navbarAtBottom}>
  <div class="stats">
    <span class="stat">
      <span class="label">Gesamt:</span>
      <span class="value">{nodeCount} Genres, {edgeCount} Links</span>
    </span>
  </div>
  
  <div class="controls">
    <button 
      class="btn" 
      class:active={showConnections}
      on:click={toggleConnections}
      title="Display Links"
    >
      Display Links
    </button>
  </div>
</div>

<style>
  .control-panel {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    background: rgba(239, 83, 80, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 50px;
    gap: 16px;
    flex-wrap: wrap;
    width: auto;
    min-width: 360px;
    max-width: 90vw;
    transition: top 2300ms cubic-bezier(0.25, 1, 0.5, 1);
    z-index: 1000;
    pointer-events: auto;
    opacity: 0;
    animation: blobAppear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    animation-delay: 14s;
  }

  /* Navbar Slide Down - fixiert unten nach erstem Kamera-Zoom */
  .control-panel.at-bottom {
    top: 94%;
  }

  @keyframes blobAppear {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0);
    }
    100% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }
  
  .stats {
    display: flex;
    gap: 24px;
  }
  
  .stat {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
  }
  
  .label {
    color: #ffffff;
    font-weight: 700;
  }
  
  .value {
    color: #ffffff;
    font-weight: 700;
  }
  
  .controls {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .btn {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    border: none;
    padding: 6px 12px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
    border-radius: 50px;
    white-space: nowrap;
    font-weight: 500;
  }
  
  .btn:hover {
    color: rgb(255, 255, 255);
    background: rgba(239, 83, 80, 0.7);
    font-weight: 700;
  }
  
  .btn:active {
    background: rgba(29, 185, 84, 0.15);
  }
  
  .btn.active {
    color: rgba(239, 83, 80, 1);
    background: rgb(255, 255, 255);
  }
  
  /* Compact Desktop (< 1024px) */
  @media (max-width: 1024px) {
    .control-panel {
      padding: 10px 12px;
      gap: 12px;
    }
    
    .stats {
      gap: 16px;
    }
    
    .stat {
      gap: 4px;
      font-size: 12px;
    }
    
    .btn {
      font-size: 12px;
      padding: 5px 10px;
    }
  }
</style>
