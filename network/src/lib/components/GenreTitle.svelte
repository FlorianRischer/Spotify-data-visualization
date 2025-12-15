<script lang="ts">
  import { scrollyStore } from '$lib/stores/scrollyStore';

  $: focusedCategory = $scrollyStore.focusedCategory || 'Intro';
</script>

<div class="genre-title-panel" data-node-id="12:41">
  <div class="rotated-text">
    <p class="genre-title">{focusedCategory}</p>
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
  }

  @media (max-width: 768px) {
    .genre-title-panel {
      width: 100%;
      height: auto;
      min-height: 120px;
    }

    .rotated-text {
      transform: rotate(0deg);
    }

    .genre-title {
      font-size: 80px;
    }
  }
</style>
