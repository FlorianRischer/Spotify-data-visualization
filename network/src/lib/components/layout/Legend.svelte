<script lang="ts">
  import { visibleNodeIds, pinnedNodeIds, graphData } from "$lib/stores/graphStore";
  
  let visibleCount = 0;
  let pinnedCount = 0;
  let totalCount = 0;
  
  visibleNodeIds.subscribe((ids) => { visibleCount = ids.length; });
  pinnedNodeIds.subscribe((ids) => { pinnedCount = ids.length; });
  graphData.subscribe((g) => { totalCount = g?.nodes.length ?? 0; });
</script>

<div class="legend">
  <div class="legend-title">Musical Brain Activity</div>
  
  <div class="legend-stats">
    <div class="stat-row">
      <div class="stat-indicator visible"></div>
      <span class="stat-label">Visible</span>
      <span class="stat-value">{visibleCount}</span>
    </div>
    <div class="stat-row">
      <div class="stat-indicator pinned"></div>
      <span class="stat-label">Pinned</span>
      <span class="stat-value">{pinnedCount}</span>
    </div>
    <div class="stat-row">
      <div class="stat-indicator total"></div>
      <span class="stat-label">Total Genres</span>
      <span class="stat-value">{totalCount}</span>
    </div>
  </div>
  
  <div class="legend-help">
    <div class="help-item">
      <kbd>Hover</kbd> Explore neighbors
    </div>
    <div class="help-item">
      <kbd>Click</kbd> Pin/unpin genre
    </div>
    <div class="help-item">
      <kbd>Tab</kbd> Navigate nodes
    </div>
    <div class="help-item">
      <kbd>Enter</kbd> Select focused
    </div>
    <div class="help-item">
      <kbd>Esc</kbd> Exit keyboard mode
    </div>
  </div>
</div>

<style>
  .legend {
    background: rgba(22, 27, 34, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 14px;
    min-width: 180px;
    backdrop-filter: blur(8px);
  }
  
  .legend-title {
    font-size: 14px;
    font-weight: 600;
    color: #e6edf3;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .legend-stats {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 14px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  
  .stat-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  }
  
  .stat-indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
  
  .stat-indicator.visible {
    background: #1db954;
  }
  
  .stat-indicator.pinned {
    background: #ffd666;
  }
  
  .stat-indicator.total {
    background: #8b949e;
  }
  
  .stat-label {
    color: #8b949e;
    flex: 1;
  }
  
  .stat-value {
    color: #e6edf3;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  
  .legend-help {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .help-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    color: #8b949e;
  }
  
  kbd {
    display: inline-block;
    padding: 2px 6px;
    font-size: 10px;
    font-family: inherit;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    color: #e6edf3;
    min-width: 40px;
    text-align: center;
  }
</style>
