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
    max-width: 90vw;
    backdrop-filter: blur(8px);
  }
  
  .tooltip-header {
    font-size: clamp(12px, 2vw, 13px);
    font-weight: 600;
    color: #e6edf3;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    word-break: break-word;
  }
  
  .tooltip-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .stat {
    display: flex;
    justify-content: space-between;
    font-size: clamp(10px, 1.8vw, 11px);
    gap: 12px;
  }
  
  .stat.separator {
    padding-top: 6px;
    margin-top: 4px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .stat-label {
    color: #8b949e;
    flex-shrink: 0;
  }
  
  .stat-value {
    color: #e6edf3;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    text-align: right;
    word-break: break-word;
  }
  
  /* Tablets (768px - 1024px) */
  @media (max-width: 1024px) {
    .tooltip {
      min-width: 130px;
      padding: 8px 10px;
    }
    
    .stat {
      gap: 10px;
    }
  }
  
  /* Small Devices (480px - 768px) */
  @media (max-width: 768px) {
    .tooltip {
      min-width: 120px;
      max-width: 85vw;
      padding: 8px 10px;
    }
    
    .tooltip-header {
      margin-bottom: 6px;
      font-size: 12px;
    }
    
    .stat {
      font-size: 10px;
      gap: 8px;
    }
  }
  
  /* Very Small Devices (320px - 480px) */
  @media (max-width: 480px) {
    .tooltip {
      min-width: 110px;
      max-width: 80vw;
      padding: 6px 8px;
    }
    
    .tooltip-header {
      margin-bottom: 4px;
      font-size: 11px;
    }
    
    .tooltip-body {
      gap: 2px;
    }
    
    .stat {
      font-size: 9px;
      gap: 6px;
    }
  }
</style>
