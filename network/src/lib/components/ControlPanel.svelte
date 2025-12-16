<script lang="ts">
  import { graphData, visibleState, showAllNodes } from '$lib/stores';
  import { uiStore } from '$lib/stores/uiStore';
  
  $: nodeCount = $graphData?.nodes.length ?? 0;
  $: edgeCount = $graphData?.edges.length ?? 0;
  $: visibleNodeCount = $visibleState?.nodes.size ?? 0;
  $: visibleEdgeCount = $visibleState?.edges.size ?? 0;
  $: showConnections = $uiStore.showConnections ?? false;
  $: showGenreGrouping = $uiStore.showGenreGrouping ?? false;
  
  function resetView() {
    // Trigger re-initialization if needed
    window.location.reload();
  }
  
  function toggleConnections() {
    uiStore.update(state => ({
      ...state,
      showConnections: !state.showConnections
    }));
  }
  
  function toggleGenreGrouping() {
    uiStore.update(state => ({
      ...state,
      showGenreGrouping: !state.showGenreGrouping
    }));
  }
  
  function handleShowAll() {
    showAllNodes();
  }
</script>

<div class="control-panel">
  <div class="stats">
    <span class="stat">
      <span class="label">Sichtbar:</span>
      <span class="value">{visibleNodeCount} Genres</span>
    </span>
    <span class="stat">
      <span class="label">Gesamt:</span>
      <span class="value">{nodeCount} Genres, {edgeCount} Verbindungen</span>
    </span>
  </div>
  
  <div class="controls">
    <button 
      class="btn" 
      class:active={showGenreGrouping}
      on:click={toggleGenreGrouping}
      title="Genres nach Kategorie gruppieren"
    >
      Genre Kategorien
    </button>
    <button 
      class="btn" 
      class:active={showConnections}
      on:click={toggleConnections}
      title="Verbindungen anzeigen"
    >
      Verbindungen
    </button>
  </div>
</div>

<style>
  .control-panel {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 10px;
    gap: 16px;
    flex-wrap: wrap;
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
    color: #8b949e;
  }
  
  .value {
    color: #e6edf3;
    font-weight: 500;
  }
  
  .controls {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .btn {
    background: transparent;
    color: #e6edf3;
    border: none;
    padding: 6px 12px;
    font-size: clamp(12px, 2vw, 13px);
    cursor: pointer;
    transition: color 0.2s;
    font-family: inherit;
    border-radius: 4px;
    white-space: nowrap;
  }
  
  .btn:hover {
    color: #1db954;
  }
  
  .btn:active {
    background: rgba(29, 185, 84, 0.1);
  }
  
  .btn.active {
    color: #1db954;
    background: rgba(29, 185, 84, 0.1);
  }
  
  /* Touch Device Optimization */
  @media (hover: none) and (pointer: coarse) {
    .btn {
      min-height: 44px;
      padding: 8px 16px;
      font-size: 14px;
    }
  }
  
  /* Tablets (768px - 1024px) */
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
  }
  
  /* Small Devices (480px - 768px) */
  @media (max-width: 768px) {
    .control-panel {
      flex-direction: column;
      align-items: stretch;
      padding: 8px 12px;
      gap: 10px;
    }
    
    .stats {
      gap: 12px;
      flex-direction: column;
    }
    
    .stat {
      gap: 4px;
      font-size: 11px;
      justify-content: space-between;
    }
    
    .controls {
      gap: 6px;
      justify-content: space-between;
    }
    
    .btn {
      flex: 1;
      font-size: 12px;
      padding: 6px 8px;
    }
  }
  
  /* Very Small Devices (320px - 480px) */
  @media (max-width: 480px) {
    .control-panel {
      padding: 6px 8px;
      gap: 8px;
    }
    
    .stat {
      font-size: 10px;
      gap: 2px;
    }
    
    .label {
      font-size: 9px;
    }
    
    .value {
      font-size: 11px;
    }
  }
</style>
