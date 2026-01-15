<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  export let mounted = false;
</script>

{#if mounted}
  <header class="hero" in:fade={{ duration: 800, delay: 200 }}>
    <h1 class="title" in:fly={{ y: 50, duration: 800, delay: 400, easing: cubicOut }}>
      Musical Brain Activity
    </h1>
    <p class="subtitle" in:fly={{ y: 30, duration: 800, delay: 600, easing: cubicOut }}>
      Visualisiere deine Spotify-Hörgewohnheiten
    </p>
  </header>
{/if}

<style>
  .hero {
    text-align: center;
    padding: 60px 0;
  }

  .title {
    font-family: 'Anton', sans-serif;
    font-size: clamp(48px, 10vw, 120px);
    font-weight: 400;
    color: #1a1a1a;
    text-transform: uppercase;
    letter-spacing: -2px;
    line-height: 1;
    margin: 0 0 24px 0;
  }

  .subtitle {
    font-family: 'Inter', sans-serif;
    font-size: clamp(16px, 2vw, 24px);
    color: #666;
    font-weight: 300;
    margin: 0;
  }
</style>
