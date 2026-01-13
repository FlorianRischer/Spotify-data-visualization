<script lang="ts">
  import { onMount } from 'svelte';
  import { uiStore } from '$lib/stores/uiStore';

  let scrollContainer: HTMLElement;
  let isLinksActive = false;
  let isOverviewActive = false;

  // Subscribe to uiStore to track links and overview state
  const unsubscribe = uiStore.subscribe(state => {
    isLinksActive = state.showConnections;
    isOverviewActive = state.isOverviewModeManual;
  });

  onMount(() => {
    // Find the scrolly container
    scrollContainer = document.querySelector('.scrolly-container') as HTMLElement;
    return unsubscribe;
  });

  function handleMainMenu() {
    // Navigate back to main menu
    window.location.href = '/';
  }

  function handleOverview() {
    // Toggle overview mode manually
    uiStore.update(state => {
      const newOverviewState = !state.isOverviewModeManual;
      return {
        ...state,
        isOverviewModeManual: newOverviewState,
        // Automatically show connections when entering overview
        showConnections: newOverviewState ? true : state.showConnections
      };
    });
  }

  function handleDisplayLinks() {
    // Toggle display of links using the uiStore
    uiStore.update(state => ({
      ...state,
      showConnections: !state.showConnections
    }));
  }
</script>

<header class="bottom-header">
  <nav class="bottom-nav">
    <button class="nav-button" on:click={handleMainMenu} title="Zurück zum Hauptmenü">
      Main Menu
    </button>
    <button class="nav-button" class:active={isOverviewActive} on:click={handleOverview} title="Overview aktivieren/deaktivieren">
      Overview
    </button>
    <button class="nav-button" class:active={isLinksActive} on:click={handleDisplayLinks} title="Links anzeigen/verbergen">
      Display Links
    </button>
  </nav>
</header>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Baloo+Bhai+2:wght@400..800&display=swap');

  .bottom-header {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 57px;
    background: none;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .bottom-nav {
    display: flex;
    gap: 120px;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    padding: 0 40px;
  }

  .nav-button {
    background: none;
    border: none;
    font-family: 'Baloo Bhai 2', sans-serif;
    font-size: 24px;
    font-weight: 400;
    color: #000;
    cursor: pointer;
    padding: 8px 0;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    white-space: nowrap;
    position: relative;
  }

  .nav-button::after {
    content: '';
    position: absolute;
    bottom: 12px;
    left: 0;
    width: 0;
    height: 2px;
    background: #000;
    transition: width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .nav-button:hover {
    opacity: 1;
    transform: translateY(-2px);
  }

  .nav-button:hover::after {
    width: 100%;
  }

  .nav-button.active {
    opacity: 1;
    transform: translateY(-2px);
  }

  .nav-button.active::after {
    width: 100%;
  }

  .nav-button:active {
    opacity: 0.8;
    transform: translateY(0px);
  }

  /* Responsive adjustments */
  @media (max-width: 1200px) {
    .bottom-nav {
      gap: 80px;
    }

    .nav-button {
      font-size: 20px;
    }
  }

  @media (max-width: 768px) {
    .bottom-nav {
      gap: 40px;
      padding: 0 20px;
    }

    .nav-button {
      font-size: 16px;
    }
  }
</style>
