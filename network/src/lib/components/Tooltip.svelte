<script lang="ts">
  import { tooltipData, type TooltipData } from "$lib/stores/uiStore";
  
  let data: TooltipData | null = null;
  let tooltipEl: HTMLDivElement | null = null;
  let showOnLeft = false;
  
  // Tooltip-Breite (feste Breite für konsistentes Layout)
  const TOOLTIP_WIDTH = 220;
  const TOOLTIP_OFFSET = 12;
  
  tooltipData.subscribe((d) => { 
    data = d;
    if (d) {
      // Prüfe ob der Tooltip über den rechten Bildschirmrand hinausgeht
      const rightEdge = d.x + TOOLTIP_OFFSET + TOOLTIP_WIDTH;
      showOnLeft = rightEdge > window.innerWidth;
    }
  });
  
  function formatMinutes(mins: number): string {
    if (mins < 60) return `${mins.toFixed(0)} min`;
    const hours = Math.floor(mins / 60);
    const remainder = Math.round(mins % 60);
    return `${hours}h ${remainder}m`;
  }

  function formatMonthYear(month?: number, year?: number): string {
    if (!month || !year) return '';
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[month - 1]} ${year}`;
  }
  
  // Berechne die X-Position des Tooltips
  function getTooltipX(x: number): number {
    if (showOnLeft) {
      // Links vom Cursor anzeigen
      return x - TOOLTIP_OFFSET - TOOLTIP_WIDTH;
    }
    // Rechts vom Cursor anzeigen (Standard)
    return x + TOOLTIP_OFFSET;
  }
</script>

{#if data}
  <div 
    class="tooltip"
    class:left-side={showOnLeft}
    bind:this={tooltipEl}
    style="left: {getTooltipX(data.x)}px; top: {data.y - 10}px;"
  >
    <div class="tooltip-header">{data.label}</div>
    <div class="tooltip-body">
      {#if data.isTimelineMode}
        <!-- Timeline Mode: Show discovery info and top year -->
        {#if data.firstSong}
          <div class="stat">
            <span class="stat-label">First Song</span>
            <span class="stat-value">{data.firstSong}</span>
          </div>
        {/if}
        {#if data.firstArtist}
          <div class="stat">
            <span class="stat-label">First Artist</span>
            <span class="stat-value">{data.firstArtist}</span>
          </div>
        {/if}
        {#if data.discoveredYear}
          <div class="stat separator">
            <span class="stat-label">Discovered</span>
            <span class="stat-value">{formatMonthYear(data.discoveredMonth, data.discoveredYear)}</span>
          </div>
          {#if data.discoveredYearMinutes}
            <div class="stat">
              <span class="stat-label">Disc. Year Time</span>
              <span class="stat-value">{formatMinutes(data.discoveredYearMinutes)}</span>
            </div>
          {/if}
        {/if}
        {#if data.topYear}
          <div class="stat">
            <span class="stat-label">Top Year</span>
            <span class="stat-value">{data.topYear}</span>
          </div>
          {#if data.topYearMinutes}
            <div class="stat">
              <span class="stat-label">Top Year Time</span>
              <span class="stat-value">{formatMinutes(data.topYearMinutes)}</span>
            </div>
          {/if}
        {/if}
      {:else}
        <!-- Normal Mode: Show standard stats -->
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
      {/if}
    </div>
  </div>
{/if}

<style>
  .tooltip {
    position: fixed;
    z-index: 1000;
    pointer-events: none;
    background: rgba(250, 241, 236, 0.95);
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 8px;
    padding: 12px 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    min-width: 140px;
    max-width: 220px;
    width: 220px;
    backdrop-filter: blur(8px);
  }
  
  .tooltip-header {
    font-size: 13px;
    font-weight: 600;
    color: #000;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    word-break: break-word;
    overflow-wrap: break-word;
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
    border-top: 1px solid rgba(0, 0, 0, 0.1);
  }
  
  .stat-label {
    color: #666;
    flex-shrink: 0;
  }
  
  .stat-value {
    color: #000;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    text-align: right;
    word-break: break-word;
    overflow-wrap: break-word;
    max-width: 120px;
  }
  
  /* Compact Desktop (< 1024px) */
  @media (max-width: 1024px) {
    .tooltip {
      min-width: 130px;
      padding: 8px 10px;
    }
    
    .stat {
      gap: 10px;
      font-size: 10px;
    }
  }
</style>
