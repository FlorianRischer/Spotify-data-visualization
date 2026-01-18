<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { scrollyStore } from '$lib/stores/scrollyStore';
  import { timelineStore } from '$lib/stores/timelineStore';

  // Local state to track if dismissed
  let isDismissed = false;

  $: isTimelinePhase = $scrollyStore.phase === 'timeline';
  $: currentYearIndex = $timelineStore.currentYearIndex;
  $: isFirstYear = currentYearIndex === 0;
  
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
            <span class="instruction-desc">Hover over genres for more detailed information</span>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .timeline-detail {
    position: fixed;
    left: 280px;
    bottom: 240px;
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
    max-width: 520px;
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

  @media (max-width: 1200px) {
    .timeline-detail {
      left: 200px;
      bottom: 230px;
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
  }

  @media (max-width: 900px) {
    .timeline-detail {
      left: 140px;
      bottom: 210px;
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
  }

  @media (max-width: 600px) {
    .timeline-detail {
      left: 20px;
      bottom: 200px;
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
  }
</style>
