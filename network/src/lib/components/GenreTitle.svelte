<script lang="ts">
  import { scrollyStore } from '$lib/stores/scrollyStore';
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  let previousCategory: string | null = null;
  let scrollDirection: 'down' | 'up' = 'down';

  $: focusedCategory = $scrollyStore.focusedCategory || 'Intro';
  
  // Track scroll direction based on category changes
  $: {
    if (previousCategory !== null && focusedCategory !== previousCategory) {
      // Determine direction based on category index change
      const prevIndex = $scrollyStore.genreGroupQueue.indexOf(previousCategory as any);
      const currIndex = $scrollyStore.genreGroupQueue.indexOf(focusedCategory as any);
      
      if (currIndex > prevIndex || (prevIndex === -1 && currIndex >= 0)) {
        scrollDirection = 'down';
      } else if (currIndex < prevIndex || (currIndex === -1 && prevIndex >= 0)) {
        scrollDirection = 'up';
      }
    }
    previousCategory = focusedCategory;
  }

  // Animation distance
  const flyDistance = 150;
  
  // Reactive animation params based on scroll direction
  $: inY = scrollDirection === 'down' ? flyDistance : -flyDistance;
  $: outY = scrollDirection === 'down' ? -flyDistance : flyDistance;
</script>

<div class="genre-title-panel" data-node-id="12:41">
  <div class="rotated-text">
    {#key focusedCategory}
      <p class="genre-title" 
         in:fly={{ y: inY, duration: 500, easing: cubicOut }} 
         out:fly={{ y: outY, duration: 500, easing: cubicOut }}>
        {focusedCategory}
      </p>
    {/key}
  </div>
</div>

<style>
  .genre-title-panel {
    position: absolute;
    left: 0;
    top: 0;
    width: 280px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: visible;
    pointer-events: none;
    z-index: 10;
  }

  .rotated-text {
    display: flex;
    align-items: center;
    justify-content: center;
    transform: rotate(270deg);
    transform-origin: center;
    position: relative;
    width: 100%;
    height: 100%;
  }

  .genre-title {
    font-family: 'Anton', sans-serif;
    font-size: 160px;
    font-weight: 400;
    line-height: 1;
    margin: 0;
    color: #000000;
    white-space: nowrap;
    letter-spacing: -2px;
    text-transform: uppercase;
    position: absolute;
    will-change: transform, opacity;
  }

  @media (max-width: 1024px) {
    .genre-title-panel {
      width: 200px;
    }

    .genre-title {
      font-size: 120px;
    }
  }
</style>
