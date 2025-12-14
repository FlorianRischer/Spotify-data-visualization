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
  }
  
  .btn {
    background: transparent;
    color: #e6edf3;
    border: none;
    padding: 0;
    font-size: 13px;
    cursor: pointer;
    transition: color 0.2s;
    font-family: inherit;
  }
  
  .btn:hover {
    color: #1db954;
  }
  
  .btn.active {
    color: #1db954;
  }
</style>
