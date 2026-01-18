<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { uiStore } from '$lib/stores/uiStore';
  import { searchStore } from '$lib/stores/searchStore';

  // Local state to track if dismissed
  let isDismissed = false;

  // Sichtbar wenn Explore Mode aktiv ist aber keine Suche läuft
  $: isExploreMode = $uiStore.isOverviewModeManual;
  $: isInputFocused = $searchStore.isInputFocused;
  $: hasSearchResults = $searchStore.matchedNodeIds.size > 0;
  
  // Dismiss when input is focused
  $: if (isInputFocused) {
    isDismissed = true;
  }
  
  // Reset dismissed state when leaving explore mode
  $: if (!isExploreMode) {
    isDismissed = false;
  }
  
  // Nur anzeigen wenn Explore aktiv, nicht dismissed, und keine aktive Suche mit Ergebnissen
  $: isVisible = isExploreMode && !isDismissed && !hasSearchResults;
  
  function handleClose() {
    isDismissed = true;
  }
</script>

{#if isVisible}
  <div 
    class="explore-detail"
    in:fly={{ x: 50, duration: 400, delay: 200, easing: cubicOut }}
    out:fade={{ duration: 200 }}
  >
    <div class="detail-card">
      <!-- Close Button -->
      <button class="close-btn" on:click={handleClose} aria-label="Close">×</button>
      
      <!-- Header -->
      <div class="detail-header">
        <span class="result-type">MODE</span>
        <h2 class="result-name large">Explore</h2>
      </div>

      <!-- Instructions -->
      <div class="instructions">
        <div class="instruction-item">
          <div class="instruction-text">
            <span class="instruction-title">Search</span>
            <span class="instruction-desc">Type in the search bar to find genres, artists, or categories</span>
          </div>
        </div>

        <div class="instruction-item">
          <div class="instruction-text">
            <span class="instruction-title">Drag</span>
            <span class="instruction-desc">Click and drag nodes to move them</span>
          </div>
        </div>

        <div class="instruction-item">
          <div class="instruction-text">
            <span class="instruction-title">Hover</span>
            <span class="instruction-desc">Hover over a node for details</span>
          </div>
        </div>

        <div class="instruction-item">
          <div class="instruction-text">
            <span class="instruction-title">Links</span>
            <span class="instruction-desc">Connections show genre relationships</span>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .explore-detail {
    position: fixed;
    right: 120px;
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
    padding: 32px;
    min-width: 300px;
    max-width: 300px;
    backdrop-filter: blur(12px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    gap: 28px;
    pointer-events: auto;
  }

  .close-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 28px;
    height: 28px;
    border: none;
    background: rgba(0, 0, 0, 0.06);
    border-radius: 50%;
    font-size: 18px;
    line-height: 1;
    color: rgba(0, 0, 0, 0.4);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    background: rgba(0, 0, 0, 0.12);
    color: rgba(0, 0, 0, 0.7);
  }

  .detail-header {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .result-type {
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.4);
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }

  .result-name {
    font-family: 'Baloo Bhai 2', sans-serif;
    font-size: 24px;
    font-weight: 600;
    color: #1a1a1a;
    line-height: 1.1;
  }

  .result-name.large {
    font-size: 32px;
  }

  .instructions {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .instruction-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
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
    .explore-detail {
      right: 80px;
    }
    
    .detail-card {
      padding: 28px;
      min-width: 280px;
      max-width: 320px;
      gap: 24px;
    }
    
    .result-name.large {
      font-size: 28px;
    }
  }

  @media (max-width: 900px) {
    .explore-detail {
      right: 24px;
      top: auto;
      bottom: 120px;
      transform: none;
    }
    
    .detail-card {
      padding: 24px;
      min-width: 240px;
      max-width: 280px;
      gap: 20px;
    }
    
    .result-name.large {
      font-size: 24px;
    }
    
    .instruction-desc {
      font-size: 12px;
    }
  }
</style>
