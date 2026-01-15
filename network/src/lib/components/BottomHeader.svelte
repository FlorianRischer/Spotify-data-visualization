<script lang="ts">
  import { onMount } from 'svelte';
  import { uiStore, focusedNodeId } from '$lib/stores/uiStore';
  import { cameraController } from '$lib/graph/cameraController';
  import { scrollyStore } from '$lib/stores/scrollyStore';
  import { searchStore } from '$lib/stores/searchStore';

  let scrollContainer: HTMLElement;
  let isLinksActive = false;
  let isOverviewActive = false;
  let showHelpPopup = false;

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
      
      // When entering overview mode, reset everything to overview state
      if (newOverviewState) {
        // Show help popup when entering explore mode
        showHelpPopup = true;
        
        // Animate camera to overview position
        cameraController.animateToOverview(1200);
        
        // Reset scrolly store to overview state
        scrollyStore.update(s => ({
          ...s,
          phase: 'overview',
          focusedCategory: null,
          focusedCategoryIndex: -1,
          displayedCategory: 'Explore' as any,
          isInOverview: true,
          isAnimatingCamera: false
        }));
        
        // Reset focused node
        focusedNodeId.set(null);
        
        // Clear search if active
        searchStore.update(s => ({
          ...s,
          searchQuery: '',
          matchedNodeIds: new Set(),
          isSearchActive: false,
          isFocusMode: false
        }));
      } else {
        // Leaving explore mode - restore scrolly telling state
        showHelpPopup = false;
        
        // Reset scrolly store to allow normal scroll-based navigation
        // Reset phase based on current scroll position
        scrollyStore.update(s => ({
          ...s,
          phase: 'zoom', // Reset to zoom phase so nodes re-sort
          isInOverview: false,
          displayedCategory: 'Overview' as any // Reset to intro title
        }));
        
        // Clear search if active
        searchStore.update(s => ({
          ...s,
          searchQuery: '',
          matchedNodeIds: new Set(),
          isSearchActive: false,
          isFocusMode: false
        }));
      }
      
      return {
        ...state,
        isOverviewModeManual: newOverviewState,
        // Lock scrolling when entering manual overview mode
        isScrollLocked: newOverviewState,
        // Automatically show connections when entering overview
        showConnections: newOverviewState ? true : state.showConnections
      };
    });
  }
  
  function closeHelpPopup() {
    showHelpPopup = false;
  }

  function handleDisplayLinks() {
    // Toggle display of links using the uiStore
    uiStore.update(state => ({
      ...state,
      showConnections: !state.showConnections
    }));
  }
</script>

<!-- Help Popup -->
{#if showHelpPopup}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions a11y_interactive_supports_focus -->
  <div class="help-popup-overlay" role="dialog" aria-modal="true" on:click={closeHelpPopup}>
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div class="help-popup" role="document" on:click|stopPropagation>
      <button class="close-button" on:click={closeHelpPopup}>×</button>
      <h3>Explore Mode</h3>
      <div class="help-content">
        <p><strong>🔍 Suche:</strong> Tippe in die Suchleiste um Genres zu finden</p>
        <p><strong>🖱️ Ziehen:</strong> Klicke und ziehe Nodes um sie zu bewegen</p>
        <p><strong>👆 Hover:</strong> Fahre über einen Node für Details</p>
        <p><strong>🔗 Links:</strong> Verbindungen zeigen Genre-Verwandtschaften</p>
        <p><strong>⬅️ Zurück:</strong> Klicke erneut auf "Explore" um fortzufahren</p>
      </div>
    </div>
  </div>
{/if}

<header class="bottom-header">
  <nav class="bottom-nav">
    <button class="nav-button" on:click={handleMainMenu} title="Zurück zum Hauptmenü">
      Main Menu
    </button>
    <button class="nav-button" class:active={isOverviewActive} on:click={handleOverview} title="Explore aktivieren/deaktivieren">
      Explore
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

  /* Help Popup Styles */
  .help-popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 200;
    padding-bottom: 80px;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(20px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }

  .help-popup {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 16px;
    padding: 20px 24px;
    max-width: 380px;
    width: 90%;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    position: relative;
    animation: slideUp 0.3s ease-out;
  }

  .help-popup h3 {
    font-family: 'Baloo Bhai 2', sans-serif;
    font-size: 20px;
    font-weight: 600;
    color: #000;
    margin: 0 0 12px 0;
    padding-right: 30px;
  }

  .help-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .help-content p {
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 14px;
    color: #333;
    margin: 0;
    line-height: 1.4;
  }

  .help-content p strong {
    color: #000;
  }

  .close-button {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 28px;
    height: 28px;
    border: none;
    background: rgba(0, 0, 0, 0.08);
    border-radius: 50%;
    font-size: 20px;
    line-height: 1;
    color: #666;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .close-button:hover {
    background: rgba(0, 0, 0, 0.15);
    color: #000;
  }

  @media (max-width: 768px) {
    .help-popup {
      max-width: 320px;
      padding: 16px 20px;
    }

    .help-popup h3 {
      font-size: 18px;
    }

    .help-content p {
      font-size: 13px;
    }
  }
</style>
