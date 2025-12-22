<script lang="ts">
  import { onMount } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import "../app.css";

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
    {#if mounted}
      <header class="hero" in:fade={{ duration: 800, delay: 200 }}>
        <h1 class="title" in:fly={{ y: 50, duration: 800, delay: 400, easing: cubicOut }}>
          Musical Brain Activity
        </h1>
        <p class="subtitle" in:fly={{ y: 30, duration: 800, delay: 600, easing: cubicOut }}>
          Visualisiere deine Spotify-Hörgewohnheiten
        </p>
      </header>

      <section class="visualizations" in:fade={{ duration: 800, delay: 800 }}>
        <h2 class="section-title" in:fly={{ y: 30, duration: 600, delay: 900, easing: cubicOut }}>
          Visualisierungen
        </h2>

        <div class="card-grid">
          <a 
            href="/visualization" 
            class="vis-card"
            in:fly={{ y: 50, duration: 600, delay: 1000, easing: cubicOut }}
          >
            <div class="card-icon">
              <svg viewBox="0 0 100 100" class="network-icon">
                <circle cx="50" cy="30" r="8" fill="currentColor" />
                <circle cx="25" cy="60" r="6" fill="currentColor" />
                <circle cx="75" cy="60" r="6" fill="currentColor" />
                <circle cx="40" cy="80" r="5" fill="currentColor" />
                <circle cx="60" cy="80" r="5" fill="currentColor" />
                <line x1="50" y1="30" x2="25" y2="60" stroke="currentColor" stroke-width="2" />
                <line x1="50" y1="30" x2="75" y2="60" stroke="currentColor" stroke-width="2" />
                <line x1="25" y1="60" x2="40" y2="80" stroke="currentColor" stroke-width="2" />
                <line x1="75" y1="60" x2="60" y2="80" stroke="currentColor" stroke-width="2" />
                <line x1="40" y1="80" x2="60" y2="80" stroke="currentColor" stroke-width="2" />
              </svg>
            </div>
            <div class="card-content">
              <h3 class="card-title">Genre Network</h3>
              <p class="card-description">
                Entdecke die Verbindungen zwischen deinen gehörten Genres in einem interaktiven Netzwerk-Graphen
              </p>
            </div>
            <div class="card-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </a>

          <!-- Placeholder für zukünftige Visualisierungen -->
          <div class="vis-card coming-soon" in:fly={{ y: 50, duration: 600, delay: 1100, easing: cubicOut }}>
            <div class="card-icon">
              <svg viewBox="0 0 100 100" class="timeline-icon">
                <rect x="10" y="60" width="15" height="30" fill="currentColor" opacity="0.4" />
                <rect x="30" y="40" width="15" height="50" fill="currentColor" opacity="0.6" />
                <rect x="50" y="25" width="15" height="65" fill="currentColor" opacity="0.8" />
                <rect x="70" y="35" width="15" height="55" fill="currentColor" />
              </svg>
            </div>
            <div class="card-content">
              <h3 class="card-title">Timeline View</h3>
              <p class="card-description">
                Verfolge deine musikalische Entwicklung über die Zeit
              </p>
              <span class="coming-soon-badge">Coming Soon</span>
            </div>
          </div>

          <div class="vis-card coming-soon" in:fly={{ y: 50, duration: 600, delay: 1200, easing: cubicOut }}>
            <div class="card-icon">
              <svg viewBox="0 0 100 100" class="stats-icon">
                <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" stroke-width="8" stroke-dasharray="70 30" />
                <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" stroke-width="6" stroke-dasharray="50 50" opacity="0.6" />
                <circle cx="50" cy="50" r="15" fill="currentColor" opacity="0.4" />
              </svg>
            </div>
            <div class="card-content">
              <h3 class="card-title">Statistics</h3>
              <p class="card-description">
                Detaillierte Statistiken zu deinen Hörgewohnheiten
              </p>
              <span class="coming-soon-badge">Coming Soon</span>
            </div>
          </div>
        </div>
      </section>

      <footer class="landing-footer" in:fade={{ duration: 600, delay: 1400 }}>
        <p>Infodesign Semester Projekt 2025</p>
      </footer>
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

  /* Hero Section */
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

  /* Visualizations Section */
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

  /* Visualization Card */
  .vis-card {
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 16px;
    padding: 32px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    text-decoration: none;
    color: inherit;
    transition: all 0.3s ease;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .vis-card:not(.coming-soon):hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    border-color: rgba(0, 0, 0, 0.15);
  }

  .vis-card:not(.coming-soon):hover .card-arrow {
    transform: translateX(4px);
    opacity: 1;
  }

  .vis-card.coming-soon {
    cursor: default;
    opacity: 0.7;
  }

  .card-icon {
    width: 80px;
    height: 80px;
    color: #1a1a1a;
  }

  .card-icon svg {
    width: 100%;
    height: 100%;
  }

  .card-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }

  .card-title {
    font-family: 'Anton', sans-serif;
    font-size: 24px;
    font-weight: 400;
    color: #1a1a1a;
    text-transform: uppercase;
    margin: 0;
  }

  .card-description {
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: #666;
    line-height: 1.6;
    margin: 0;
  }

  .card-arrow {
    position: absolute;
    right: 32px;
    top: 50%;
    transform: translateY(-50%);
    width: 24px;
    height: 24px;
    color: #1a1a1a;
    opacity: 0.5;
    transition: all 0.3s ease;
  }

  .coming-soon-badge {
    display: inline-block;
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #888;
    background: rgba(0, 0, 0, 0.05);
    padding: 4px 12px;
    border-radius: 100px;
    margin-top: 8px;
    width: fit-content;
  }

  /* Footer */
  .landing-footer {
    text-align: center;
    padding: 40px 0;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
  }

  .landing-footer p {
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: #999;
    margin: 0;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .landing {
      padding: 40px 16px;
    }

    .landing-content {
      gap: 60px;
    }

    .hero {
      padding: 40px 0;
    }

    .card-grid {
      grid-template-columns: 1fr;
    }

    .card-arrow {
      display: none;
    }
  }
</style>


