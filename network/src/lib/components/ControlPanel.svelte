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
    <div class="stat-group">
      <span class="stat-label">Sichtbar</span>
      <span class="stat-value">{visibleNodeCount}</span>
      <span class="stat-unit">Genres</span>
    </div>
    <div class="divider"></div>
    <div class="stat-group">
      <span class="stat-label">Gesamtdaten</span>
      <span class="stat-value">{nodeCount}</span>
      <span class="stat-unit">Genres</span>
    </div>
    <div class="divider"></div>
    <div class="stat-group">
      <span class="stat-label">Verbindungen</span>
      <span class="stat-value">{edgeCount}</span>
      <span class="stat-unit">Kanten</span>
    </div>
  </div>
  
  <div class="controls">
    <button 
      class="btn btn-control" 
      class:active={showGenreGrouping}
      on:click={toggleGenreGrouping}
      title="Genres nach Kategorie gruppieren"
      aria-label="Genre Kategorien umschalten"
    >
      <span class="btn-label">Kategorien</span>
      {#if showGenreGrouping}
        <span class="btn-indicator">●</span>
      {/if}
    </button>
    <button 
      class="btn btn-control" 
      class:active={showConnections}
      on:click={toggleConnections}
      title="Verbindungen anzeigen"
      aria-label="Verbindungen umschalten"
    >
      <span class="btn-label">Verbindungen</span>
      {#if showConnections}
        <span class="btn-indicator">●</span>
      {/if}
    </button>
  </div>
</div>

<style>
  .control-panel {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 24px;
    background: rgba(13, 17, 23, 0.6);
    gap: 24px;
    flex-wrap: wrap;
    border-bottom: 1px solid rgba(48, 54, 61, 0.2);
  }
  
  .stats {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
  }
  
  .stat-group {
    display: flex;
    align-items: baseline;
    gap: 6px;
    animation: slideInLeft 600ms cubic-bezier(0.4, 0, 0.2, 1) both;
  }
  
  .stat-label {
    color: #8b949e;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  
  .stat-value {
    color: #1db954;
    font-size: 20px;
    font-weight: 700;
    font-family: 'Bitcount Grid Double Ink', monospace;
    letter-spacing: -0.5px;
  }
  
  .stat-unit {
    color: #c9d1d9;
    font-size: 12px;
    font-weight: 500;
  }
  
  .divider {
    width: 1px;
    height: 24px;
    background: rgba(48, 54, 61, 0.3);
  }
  
  .controls {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  
  .btn {
    font-family: inherit;
  }
  
  .btn-control {
    display: flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    color: #c9d1d9;
    border: 1px solid rgba(48, 54, 61, 0.2);
    padding: 6px 12px;
    font-size: 13px;
    cursor: pointer;
    border-radius: 4px;
    font-weight: 500;
    transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
  }
  
  .btn-control:hover {
    color: #e6edf3;
    border-color: rgba(29, 185, 84, 0.4);
    background: rgba(29, 185, 84, 0.05);
  }
  
  .btn-control.active {
    color: #1db954;
    border-color: #1db954;
    background: rgba(29, 185, 84, 0.1);
  }
  
  .btn-control:active {
    transform: scale(0.98);
  }
  
  .btn-label {
    transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .btn-indicator {
    font-size: 6px;
    animation: pulse 2s ease-in-out infinite;
  }
  
  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 0.4;
    }
    50% {
      opacity: 1;
    }
  }
  
  @media (max-width: 768px) {
    .control-panel {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
    }
    
    .stats {
      width: 100%;
      gap: 12px;
    }
    
    .controls {
      width: 100%;
    }
    
    .btn-control {
      flex: 1;
    }
  }
</style>
