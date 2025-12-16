<script lang="ts">
  import { scrollyStore, jumpToCategory } from '$lib/stores/scrollyStore';
  import type { GenreCategory } from '$lib/graph/genreMapping';

  let hoveredCategory: GenreCategory | null = null;

  $: genreGroupQueue = $scrollyStore.genreGroupQueue;
  $: focusedCategory = $scrollyStore.focusedCategory;
  $: focusedIndex = $scrollyStore.focusedCategoryIndex;
  $: categoryNodeCounts = $scrollyStore.categoryNodeCounts;

  function handleCategoryClick(category: GenreCategory) {
    jumpToCategory(category);
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
      {@const count = categoryNodeCounts[category] || 0}
      <button
        class="progress-dot"
        class:active={isActive}
        class:hovered={isHovered}
        style="--opacity: {getOpacity(idx)}"
        title="{category} ({count} Genres)"
        aria-label="{category} - {count} Genres"
        aria-current={isActive ? 'true' : undefined}
        on:mouseenter={() => (hoveredCategory = category)}
        on:mouseleave={() => (hoveredCategory = null)}
        on:click={() => handleCategoryClick(category)}
        type="button"
      >
        {#if isHovered || isActive}
          <div class="tooltip">
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
    padding: 0;
    background: transparent;
    border-radius: 0;
    backdrop-filter: none;
  }

  .progress-dot {
    position: relative;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #8b949e;
    opacity: var(--opacity, 0.4);
    border: none;
    padding: 0;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    transform-origin: center;
  }

  .progress-dot:hover,
  .progress-dot.hovered {
    transform: scale(1.2);
    opacity: 0.8;
  }

  .progress-dot.active {
    transform: scale(1.3);
    opacity: 1;
    box-shadow: none;
  }

  .progress-dot:focus-visible {
    outline: 2px solid #8b949e;
    outline-offset: 3px;
  }

  .tooltip {
    position: absolute;
    right: 25px;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(13, 17, 23, 0.95);
    border: 1px solid #8b949e;
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
    color: #8b949e;
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
      padding: 0;
    }

    .progress-dot {
      width: 9px;
      height: 9px;
    }

    .tooltip {
      right: 20px;
      font-size: 0.8rem;
    }
  }
</style>
