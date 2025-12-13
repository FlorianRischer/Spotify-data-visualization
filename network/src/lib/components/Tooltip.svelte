<script lang="ts">
  import { tooltipData, type TooltipData } from "$lib/stores/uiStore";
  
  let data: TooltipData | null = null;
  
  tooltipData.subscribe((d) => { data = d; });
  
  function formatMinutes(mins: number): string {
    if (mins < 60) return `${mins.toFixed(0)} min`;
    const hours = Math.floor(mins / 60);
    const remainder = Math.round(mins % 60);
    return `${hours}h ${remainder}m`;
  }
</script>

{#if data}
  <div 
    class="tooltip"
    style="left: {data.x + 12}px; top: {data.y - 10}px;"
  >
    <div class="tooltip-header">{data.label}</div>
    <div class="tooltip-body">
      <div class="stat">
        <span class="stat-label">Plays</span>
        <span class="stat-value">{data.playCount.toLocaleString()}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Time</span>
        <span class="stat-value">{formatMinutes(data.totalMinutes)}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Share</span>
        <span class="stat-value">{data.percentage.toFixed(1)}%</span>
      </div>
      <div class="stat">
        <span class="stat-label">Connections</span>
        <span class="stat-value">{data.degree}</span>
      </div>
      {#if data.topArtist}
        <div class="stat separator">
          <span class="stat-label">Top Artist</span>
          <span class="stat-value">{data.topArtist}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Artist Time</span>
          <span class="stat-value">{formatMinutes(data.topArtistMinutes || 0)}</span>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .tooltip {
    position: fixed;
    z-index: 1000;
    pointer-events: none;
    background: rgba(22, 27, 34, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    padding: 10px 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    min-width: 140px;
    backdrop-filter: blur(8px);
  }
  
  .tooltip-header {
    font-size: 13px;
    font-weight: 600;
    color: #e6edf3;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .tooltip-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .stat {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    gap: 12px;
  }
  
  .stat.separator {
    padding-top: 6px;
    margin-top: 4px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .stat-label {
    color: #8b949e;
  }
  
  .stat-value {
    color: #e6edf3;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }
</style>
