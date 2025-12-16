<script lang="ts">
  import { scrollyStore } from '$lib/stores/scrollyStore';
  import { fade } from 'svelte/transition';

  $: focusedCategory = $scrollyStore.focusedCategory || 'Intro';
</script>

<div class="genre-title-panel" data-node-id="12:41">
  <div class="rotated-text">
    {#key focusedCategory}
      <p class="genre-title" in:fade={{ duration: 300 }} out:fade={{ duration: 200 }}>
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
    font-size: clamp(80px, 15vw, 160px);
    font-weight: 400;
    line-height: 1;
    margin: 0;
    color: #000000;
    white-space: nowrap;
    letter-spacing: -2px;
    text-transform: uppercase;
  }

  @media (max-width: 1024px) {
    .genre-title-panel {
      width: 200px;
    }

    .genre-title {
      font-size: clamp(60px, 12vw, 120px);
    }
  }

  @media (max-width: 768px) {
    .genre-title-panel {
      position: static;
      width: 100%;
      height: auto;
      min-height: 100px;
      padding: 20px;
      background: rgba(22, 27, 34, 0.5);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 20px;
    }

    .rotated-text {
      transform: rotate(0deg);
    }

    .genre-title {
      font-size: clamp(40px, 10vw, 80px);
      letter-spacing: -1px;
    }
  }

  @media (max-width: 480px) {
    .genre-title-panel {
      min-height: 80px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .genre-title {
      font-size: clamp(32px, 8vw, 48px);
      letter-spacing: 0;
    }
  }
</style>
