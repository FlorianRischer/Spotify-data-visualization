<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { scrollyStore } from '$lib/stores/scrollyStore';
  import { timelineStore, globalStatsData } from '$lib/stores/timelineStore';

  // Local state to track if dismissed
  let isDismissed = false;

  $: isTimelinePhase = $scrollyStore.phase === 'timeline';
  $: currentYearIndex = $timelineStore.currentYearIndex;
  $: isFirstYear = currentYearIndex === 0;
  $: stats = $globalStatsData;
  
  // Format hours nicely
  function formatHours(minutes: number): string {
    const hours = minutes / 60;
    if (hours >= 1000) {
      return `${(hours)}`;
    }
    return hours.toFixed(0);
  }
  
  // Reset dismissed state when leaving timeline
  $: if (!isTimelinePhase) {
    isDismissed = false;
  }
  
  // Only visible on first year and not dismissed
  $: isVisible = isTimelinePhase && isFirstYear && !isDismissed;
  
  function handleClose() {
    isDismissed = true;
  }
</script>

{#if isVisible}
  <div 
    class="timeline-detail"
    in:fly={{ y: 30, duration: 400, delay: 300, easing: cubicOut }}
    out:fade={{ duration: 200 }}
  >
    <div class="detail-card">
      <!-- Header -->
      <div class="detail-header">
        <span class="result-type">VIEW</span>
        <h2 class="result-name">Genre Timeline</h2>
      </div>

      <!-- Instructions -->
      <div class="instructions">
        <div class="instruction-item">
          <div class="instruction-text">
            <span class="instruction-title">Discover</span>
            <span class="instruction-desc">See the time I first discovered each genre since 2018</span>
          </div>
        </div>

        <div class="instruction-item">
          <div class="instruction-text">
            <span class="instruction-title">Navigate</span>
            <span class="instruction-desc">Use the arrow keys to browse through the years</span>
          </div>
        </div>

        <div class="instruction-item">
          <div class="instruction-text">
            <span class="instruction-title">Hover</span>
            <span class="instruction-desc">Hover over genres for more detailed information about each Genre</span>
          </div>
        </div>
      </div>

      <!-- Global Stats -->
      {#if stats}
        <div class="stats-section">
          <div class="stat-item">
            <span class="stat-label">Total Playtime</span>
            <span class="stat-value">{formatHours(stats.totalPlaytimeMinutes)}h</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Most Listened Artist</span>
            <span class="stat-value">{stats.topArtist}</span>
            <span class="stat-subvalue">{formatHours(stats.topArtistMinutes)}h</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Most Listened Song</span>
            <span class="stat-value">{stats.topSong}</span>
            <span class="stat-subvalue">{stats.topSongArtist} · {formatHours(stats.topSongMinutes)}h</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Average per Day</span>
            <span class="stat-value">{(stats.avgMinutesPerDay / 60).toFixed(1)}h</span>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .timeline-detail {
    position: fixed;
    left: 280px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 105;
    pointer-events: none;
  }

  .detail-card {
    position: relative;
    background: none;
    border: none;
    border-radius: 0;
    padding: 32px 36px;
    min-width: 320px;
    max-width: 400px;
    backdrop-filter: none;
    box-shadow: none;
    display: flex;
    flex-direction: column;
    gap: 24px;
    pointer-events: auto;
  }

  .detail-header {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .result-type {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.4);
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }

  .result-name {
    font-family: 'Baloo Bhai 2', sans-serif;
    font-size: 32px;
    font-weight: 600;
    color: #1a1a1a;
    line-height: 1.1;
    margin: 0;
  }

  .instructions {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .instruction-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .instruction-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .instruction-title {
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
  }

  .instruction-desc {
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 400;
    color: rgba(0, 0, 0, 0.5);
    line-height: 1.4;
  }

  .stats-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-top: 16px;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .stat-label {
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.4);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .stat-value {
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
  }

  .stat-subvalue {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 400;
    color: rgba(0, 0, 0, 0.5);
  }

  @media (max-width: 1200px) {
    .timeline-detail {
      left: 200px;
    }
    
    .detail-card {
      padding: 28px 32px;
      min-width: 280px;
      max-width: 400px;
    }
    
    .result-name {
      font-size: 28px;
    }
    
    .instruction-title {
      font-size: 15px;
    }
    
    .instruction-desc {
      font-size: 13px;
    }

    .stat-value {
      font-size: 15px;
    }

    .stat-subvalue {
      font-size: 12px;
    }
  }

  @media (max-width: 900px) {
    .timeline-detail {
      left: 140px;
    }
    
    .detail-card {
      padding: 24px 28px;
      min-width: 260px;
      max-width: 320px;
      gap: 20px;
    }
    
    .result-name {
      font-size: 24px;
    }
    
    .instruction-title {
      font-size: 14px;
    }
    
    .instruction-desc {
      font-size: 12px;
    }

    .stats-section {
      gap: 10px;
      padding-top: 14px;
    }

    .stat-label {
      font-size: 11px;
    }

    .stat-value {
      font-size: 14px;
    }

    .stat-subvalue {
      font-size: 11px;
    }
  }

  @media (max-width: 600px) {
    .timeline-detail {
      left: 20px;
    }
    
    .detail-card {
      padding: 20px 24px;
      min-width: 220px;
      max-width: 280px;
      gap: 16px;
    }
    
    .result-name {
      font-size: 22px;
    }
    
    .instruction-title {
      font-size: 13px;
    }
    
    .instruction-desc {
      font-size: 11px;
    }

    .stats-section {
      gap: 8px;
      padding-top: 12px;
    }

    .stat-label {
      font-size: 10px;
    }

    .stat-value {
      font-size: 13px;
    }

    .stat-subvalue {
      font-size: 10px;
    }
  }
</style>
