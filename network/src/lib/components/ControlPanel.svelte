<script lang="ts">
  import { graphData, visibleState, showAllNodes } from '$lib/stores';
  import { uiStore } from '$lib/stores/uiStore';
  
  $: nodeCount = $graphData?.nodes.length ?? 0;
  $: edgeCount = $graphData?.edges.length ?? 0;
  $: visibleNodeCount = $visibleState?.nodes.size ?? 0;
  $: visibleEdgeCount = $visibleState?.edges.size ?? 0;
  $: showArtistGroups = $uiStore.showArtistGroups ?? false;
  $: showConnections = $uiStore.showConnections ?? false;
  
  function resetView() {
    // Trigger re-initialization if needed
    window.location.reload();
  }
  
  function toggleArtistGroups() {
    uiStore.update(state => ({
      ...state,
      showArtistGroups: !state.showArtistGroups
    }));
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
      class:active={showArtistGroups}
      on:click={toggleArtistGroups}
      title="Genre-Gruppen anzeigen"
    >
      🎵 Genre-Gruppen
    </button>
    <button 
      class="btn" 
      class:active={showConnections}
      on:click={toggleConnections}
      title="Verbindungen anzeigen"
    >
      🔗 Verbindungen
    </button>
    <button class="btn" on:click={handleShowAll} title="Alle Genres anzeigen">
      🌐 Alle anzeigen
    </button>
    <button class="btn" on:click={resetView}>
      🔄 Neu laden
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
    background: rgba(29, 185, 84, 0.1);
    color: #1db954;
    border: 1px solid rgba(29, 185, 84, 0.3);
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn:hover {
    background: rgba(29, 185, 84, 0.2);
    border-color: rgba(29, 185, 84, 0.5);
  }
  
  .btn.active {
    background: rgba(29, 185, 84, 0.3);
    border-color: rgba(29, 185, 84, 0.7);
    color: #1db954;
  }
</style>
