<script lang="ts">
  import { scrollyStore } from '$lib/stores/scrollyStore';
  import { timelineStore } from '$lib/stores/timelineStore';
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  $: isTimelinePhase = $scrollyStore.phase === 'timeline';
  $: currentYearIndex = $timelineStore.currentYearIndex;
  $: isFirstYear = currentYearIndex === 0;
</script>

{#if isTimelinePhase && isFirstYear}
  <div class="timeline-title-panel" in:fly={{ x: -100, duration: 500, easing: cubicOut }} out:fly={{ x: -100, duration: 500 }}>
    <div class="rotated-text">
      <p class="timeline-title">TIMELINE</p>
    </div>
  </div>
{/if}

<style>
  .timeline-title-panel {
    position: fixed;
    left: 0;
    top: 0;
    width: 280px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: visible;
    pointer-events: none;
    z-index: 110;
  }

  .rotated-text {
    display: flex;
    align-items: center;
    justify-content: center;
    transform: rotate(270deg);
    transform-origin: center;
    white-space: nowrap;
    width: max-content;
    position: relative;
  }

  .timeline-title {
    font-family: 'Anton', sans-serif;
    font-size: 160px;
    font-weight: 400;
    color: #000;
    margin: 0;
    padding: 0;
    text-transform: capitalize;
    letter-spacing: 2px;
    line-height: 1;
    text-shadow: none;
    white-space: nowrap;
  }

  /* Large Desktop (1440px+) */
  @media (min-width: 1440px) {
    .timeline-title-panel {
      width: 320px;
    }
    
    .timeline-title {
      font-size: 180px;
    }
  }

  /* Desktop (1200px - 1439px) */
  @media (max-width: 1439px) and (min-width: 1201px) {
    .timeline-title-panel {
      width: 260px;
    }
    
    .timeline-title {
      font-size: 140px;
    }
  }

  /* Tablet Landscape (900px - 1200px) */
  @media (max-width: 1200px) and (min-width: 901px) {
    .timeline-title-panel {
      width: 220px;
    }
    
    .timeline-title {
      font-size: 120px;
    }
  }

  /* Tablet Portrait (600px - 900px) */
  @media (max-width: 900px) and (min-width: 601px) {
    .timeline-title-panel {
      width: 180px;
    }
    
    .timeline-title {
      font-size: 90px;
    }
  }

  /* Mobile (600px and below) - Title at top center, not rotated */
  @media (max-width: 600px) {
    .timeline-title-panel {
      width: 100%;
      height: auto;
      top: 20px;
      left: 0;
      justify-content: center;
      align-items: flex-start;
    }
    
    .rotated-text {
      transform: none;
    }
    
    .timeline-title {
      font-size: 48px;
      text-align: center;
    }
  }

  /* Small Mobile (400px and below) */
  @media (max-width: 400px) {
    .timeline-title-panel {
      top: 15px;
    }
    
    .timeline-title {
      font-size: 40px;
    }
  }
</style>
