<script lang="ts">
  import { graphData, visibleState, showAllNodes } from '$lib/stores';
  import { uiStore } from '$lib/stores/uiStore';
  import { scrollyStore } from '$lib/stores/scrollyStore';
  
  let navPosition = 'calc(50% - 20px)';
  
  $: nodeCount = $graphData?.nodes.length ?? 0;
  $: edgeCount = $graphData?.edges.length ?? 0;
  $: visibleNodeCount = $visibleState?.nodes.size ?? 0;
  $: visibleEdgeCount = $visibleState?.edges.size ?? 0;
  $: showConnections = $uiStore.showConnections ?? false;
  
  // Berechne die vertikale Position basierend auf Phase und Navbar-Animation-Progress
  $: {
    if ($scrollyStore.phase === 'intro') {
      // In Intro: zentriert
      navPosition = 'calc(50vh - 20px)';
    } else if ($scrollyStore.isAnimatingCamera) {
      // Während Kamera-Animation: fahre nach unten basierend auf Progress
      const animProgress = $scrollyStore.navbarAnimationProgress;
      // Von Mitte (50vh) zu unten (92vh)
      const startPos = 50; // vh
      const endPos = 92; // vh
      const currentPos = startPos + (endPos - startPos) * animProgress;
      navPosition = `calc(${currentPos}vh - 20px)`;
    } else {
      // Nach Animation: unten fixiert
      navPosition = 'calc(100vh - 60px)';
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

<div class="control-panel" style="--nav-position: {navPosition}">
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
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: rgba(239, 83, 80, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 50px;
    gap: 16px;
    flex-wrap: wrap;
    width: fit-content;
    white-space: nowrap;
    opacity: 0;
    transform: scale(0);
    animation: blobAppear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    animation-delay: 14s;
  }

  @keyframes blobAppear {
    0% {
      opacity: 0;
      transform: scale(0);
    }
    100% {
      opacity: 1;
      transform: scale(1);
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
