<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import "../app.css";
  import { 
    HeroSection, 
    VisualizationCard, 
    NetworkIcon, 
    TimelineIcon, 
    StatsIcon 
  } from '$lib/components/landing';

  let mounted = false;

  onMount(() => {
    setTimeout(() => {
      mounted = true;
    }, 100);
  });
</script>

<svelte:head>
  <title>Musical Brain Activity</title>
  <meta name="description" content="Explore your Spotify listening history through interactive visualizations" />
</svelte:head>

<main class="landing">
  <div class="landing-content">
    <HeroSection {mounted} />

    {#if mounted}
      <section class="visualizations" in:fade={{ duration: 800, delay: 800 }}>
        <h2 class="section-title" in:fly={{ y: 30, duration: 600, delay: 900, easing: cubicOut }}>
          Visualisierungen
        </h2>

        <div class="card-grid">
          <VisualizationCard
            href="/visualization"
            title="Genre Exploration"
            description="Explore my whole Spotify listening history through an interactive genre network"
            delay={1000}
          >
            <NetworkIcon slot="icon" />
          </VisualizationCard>

          <VisualizationCard
            title="Timeline View"
            description="See how my musical tastes have evolved over time"
            comingSoon={true}
            delay={1100}
          >
            <TimelineIcon slot="icon" />
          </VisualizationCard>

          <VisualizationCard
            title="Project Info"
            description="Learn more about the project and its creator"
            comingSoon={true}
            delay={1200}
          >
            <StatsIcon slot="icon" />
          </VisualizationCard>
        </div>
      </section>
    {/if}
  </div>
</main>

<style>
  .landing {
    min-height: 100vh;
    background: #FAF1EC;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 60px 24px;
  }

  .landing-content {
    max-width: 1200px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 80px;
  }

  .visualizations {
    display: flex;
    flex-direction: column;
    gap: 40px;
  }

  .section-title {
    font-family: 'Anton', sans-serif;
    font-size: 32px;
    font-weight: 400;
    color: #1a1a1a;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin: 0;
  }

  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 24px;
  }

  @media (max-width: 768px) {
    .landing {
      padding: 40px 16px;
    }

    .landing-content {
      gap: 60px;
    }

    .card-grid {
      grid-template-columns: 1fr;
    }
  }
</style>


