<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { isStartAnimationRunning, uiStore } from '$lib/stores/uiStore';
  import { scrollyStore } from '$lib/stores/scrollyStore';

  // Local state to track if dismissed
  let isDismissed = false;
  let wasAnimationRunning = true;
  let showDetail = false;
  let hasAnimationCompleted = false; // Track if animation has ever completed

  // Reactive states
  $: animationRunning = $isStartAnimationRunning;
  $: isExploreMode = $uiStore.isOverviewModeManual;
  $: phase = $scrollyStore.phase;
  $: focusedCategory = $scrollyStore.focusedCategory;
  $: isInTimelineMode = phase === 'timeline';
  
  // Show only in Overview mode (not explore, not timeline, not zoomed into category)
  $: isInOverviewMode = !isExploreMode && !isInTimelineMode && focusedCategory === null;
  
  // Watch for animation end - only trigger once when animation completes
  $: {
    if (wasAnimationRunning && !animationRunning && !hasAnimationCompleted) {
      hasAnimationCompleted = true;
      // Small delay after animation ends
      setTimeout(() => {
        if (!isDismissed && isInOverviewMode) {
          showDetail = true;
        }
      }, 500);
    }
    wasAnimationRunning = animationRunning;
  }
  
  // Hide when leaving overview mode
  $: if (!isInOverviewMode) {
    showDetail = false;
  }
  
  // Reset when entering overview mode again (but only after animation completed and not dismissed)
  $: if (isInOverviewMode && hasAnimationCompleted && !isDismissed && !showDetail) {
    showDetail = true;
  }
  
  $: isVisible = showDetail && isInOverviewMode && !isDismissed;
  
  function handleClose() {
    isDismissed = true;
    showDetail = false;
  }
</script>

{#if isVisible}
  <div 
    class="overview-detail"
    in:fly={{ x: 50, duration: 400, delay: 200, easing: cubicOut }}
    out:fade={{ duration: 200 }}
  >
    <div class="detail-card">
      <!-- Close Button -->
      <button class="close-btn" on:click={handleClose} aria-label="Close">×</button>
      
      <!-- Header -->
      <div class="detail-header">
        <span class="result-type">VIEW</span>
        <h2 class="result-name large">Overview</h2>
      </div>

      <!-- Instructions -->
      <div class="instructions">
        <div class="instruction-item">
          <div class="instruction-text">
            <span class="instruction-title">Nodes</span>
            <span class="instruction-desc">Each node represents a genre I've listened to. Size indicates listening time.</span>
          </div>
        </div>

        <div class="instruction-item">
          <div class="instruction-text">
            <span class="instruction-title">Categories</span>
            <span class="instruction-desc">Genres are grouped by color into categories like Pop, Rock, Electronic, etc.</span>
          </div>
        </div>

        <div class="instruction-item">
          <div class="instruction-text">
            <span class="instruction-title">Connections</span>
            <span class="instruction-desc">Lines connect related genres that share similar artists.</span>
          </div>
        </div>

        <div class="instruction-item">
          <div class="instruction-text">
            <span class="instruction-title">Navigate</span>
            <span class="instruction-desc">Use the arrow keys to explore categories.</span>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .overview-detail {
    position: fixed;
    right: 80px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 100;
    pointer-events: none;
  }

  .detail-card {
    position: relative;
    background: none;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 16px;
    padding: 36px;
    min-width: 320px;
    max-width: 320px;
    pointer-events: auto;
  }
  
  .close-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 28px;
    height: 28px;
    border: none;
    background: none;
    font-size: 18px;
    font-weight: 300;
    color: rgba(0, 0, 0, 0.4);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s ease;
    line-height: 1;
    padding: 0;
  }
  
  .close-btn:hover {
    color: rgba(0, 0, 0, 0.7);
  }

  .detail-header {
    margin-bottom: 24px;
  }

  .result-type {
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(0, 0, 0, 0.4);
  }

  .result-name {
    font-family: 'Baloo Bhai 2', sans-serif;
    font-weight: 600;
    color: #1a1a1a;
    margin: 4px 0 0 0;
    line-height: 1.1;
  }

  .result-name.large {
    font-size: 36px;
  }

  .instructions {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .instruction-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .instruction-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .instruction-title {
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: #1a1a1a;
  }

  .instruction-desc {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 400;
    color: rgba(0, 0, 0, 0.5);
    line-height: 1.4;
  }

  @media (max-width: 1200px) {
    .overview-detail {
      right: 60px;
    }
    
    .detail-card {
      min-width: 280px;
      max-width: 280px;
      padding: 28px;
    }

    .result-name.large {
      font-size: 28px;
    }

    .instruction-title {
      font-size: 13px;
    }
  }

  @media (max-width: 900px) {
    .overview-detail {
      right: 20px;
      bottom: 200px;
      top: auto;
      transform: none;
    }

    .detail-card {
      min-width: 240px;
      max-width: 240px;
      padding: 22px;
    }

    .result-name.large {
      font-size: 24px;
    }

    .instruction-title {
      font-size: 12px;
    }

    .instruction-desc {
      font-size: 11px;
    }
  }

  @media (max-width: 600px) {
    .overview-detail {
      right: 12px;
      bottom: 180px;
    }

    .detail-card {
      min-width: 200px;
      max-width: 200px;
      padding: 18px;
    }

    .result-name.large {
      font-size: 20px;
    }

    .instructions {
      gap: 10px;
    }

    .instruction-title {
      font-size: 11px;
    }

    .instruction-desc {
      font-size: 10px;
    }
  }
</style>
