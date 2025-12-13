<script lang="ts">
  import { scrollyStore, jumpToCategory } from '$lib/stores/scrollyStore';
  import { getCategoryColor } from '$lib/graph/categoryColors';
  import type { GenreCategory } from '$lib/graph/genreMapping';
  import { cameraController } from '$lib/graph/cameraController';

  let hoveredCategory: GenreCategory | null = null;

  $: genreGroupQueue = $scrollyStore.genreGroupQueue;
  $: focusedCategory = $scrollyStore.focusedCategory;
  $: focusedIndex = $scrollyStore.focusedCategoryIndex;
  $: categoryNodeCounts = $scrollyStore.categoryNodeCounts;
  $: categoryPositions = $scrollyStore.categoryPositions;

  function handleCategoryClick(category: GenreCategory) {
    const position = categoryPositions[category];
    if (position) {
      jumpToCategory(category);
      cameraController.animateToCategoryPosition(position.x, position.y, 1500);
    }
  }

  function handleKeyDown(event: KeyboardEvent, category: GenreCategory) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCategoryClick(category);
    }
  }

  function getOpacity(index: number): number {
    if (focusedIndex === -1) return 0.6;
    if (index === focusedIndex) return 1;
    return 0.3;
  }
</script>

{#if genreGroupQueue.length > 0}
  <nav class="progress-indicator" aria-label="Genre-Kategorien Navigation">
    {#each genreGroupQueue as category, idx}
      {@const isActive = category === focusedCategory}
      {@const isHovered = category === hoveredCategory}
      {@const color = getCategoryColor(category)}
      {@const count = categoryNodeCounts[category] || 0}
      <button
        class="progress-dot"
        class:active={isActive}
        class:hovered={isHovered}
        style="--dot-color: {color}; --opacity: {getOpacity(idx)}"
        title="{category} ({count} Genres)"
        aria-label="{category} - {count} Genres"
        aria-current={isActive ? 'true' : undefined}
        on:mouseenter={() => (hoveredCategory = category)}
        on:mouseleave={() => (hoveredCategory = null)}
        on:click={() => handleCategoryClick(category)}
        on:keydown={(e) => handleKeyDown(e, category)}
        type="button"
      >
        {#if isHovered || isActive}
          <div class="tooltip" style="--tooltip-color: {color}">
            <span class="tooltip-title">{category}</span>
            <span class="tooltip-count">{count} Genres</span>
          </div>
        {/if}
      </button>
    {/each}
  </nav>
{/if}

<style>
  .progress-indicator {
    position: fixed;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 12px;
    z-index: 1000;
    padding: 15px 10px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 20px;
    backdrop-filter: blur(10px);
  }

  .progress-dot {
    position: relative;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--dot-color, #666);
    opacity: var(--opacity, 0.6);
    border: none;
    padding: 0;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    transform-origin: center;
  }

  .progress-dot:hover,
  .progress-dot.hovered {
    transform: scale(1.4);
    opacity: 0.9;
  }

  .progress-dot.active {
    transform: scale(1.6);
    opacity: 1;
    box-shadow: 0 0 15px var(--dot-color, #00d9ff),
                0 0 30px var(--dot-color, #00d9ff);
  }

  .progress-dot:focus-visible {
    outline: 2px solid var(--dot-color, #00d9ff);
    outline-offset: 3px;
  }

  .tooltip {
    position: absolute;
    right: 25px;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(13, 17, 23, 0.95);
    border: 1px solid var(--tooltip-color, #00d9ff);
    border-radius: 8px;
    padding: 8px 12px;
    white-space: nowrap;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    gap: 2px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  }

  .tooltip-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--tooltip-color, #00d9ff);
  }

  .tooltip-count {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.7);
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .progress-indicator {
      right: 10px;
      gap: 10px;
      padding: 12px 8px;
    }

    .progress-dot {
      width: 12px;
      height: 12px;
    }
  }

  @media (max-width: 768px) {
    .progress-indicator {
      position: fixed;
      right: auto;
      left: 50%;
      top: auto;
      bottom: 20px;
      transform: translateX(-50%);
      flex-direction: row;
      gap: 8px;
      padding: 10px 15px;
      max-width: 90vw;
      overflow-x: auto;
    }

    .progress-dot {
      width: 10px;
      height: 10px;
      flex-shrink: 0;
    }

    .tooltip {
      bottom: 30px;
      top: auto;
      right: 50%;
      transform: translateX(50%);
    }
  }
</style>
