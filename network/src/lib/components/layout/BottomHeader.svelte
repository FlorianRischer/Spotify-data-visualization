<script lang="ts">
  import { onMount } from 'svelte';
  import { uiStore, focusedNodeId } from '$lib/stores/uiStore';
  import { cameraController } from '$lib/graph/cameraController';
  import { scrollyStore } from '$lib/stores/scrollyStore';
  import { searchStore } from '$lib/stores/searchStore';
  import { timelineStore } from '$lib/stores/timelineStore';

  let scrollContainer: HTMLElement;
  let isLinksActive = false;
  let isExploreActive = false;  // Explore = SearchBar mode (was isOverviewActive)
  let isOverviewActive = false; // Overview = categorization/zoom phase (Kategorien-Navigation)
  let isTimelineActive = false;

  // Subscribe to uiStore to track links and explore state
  const unsubscribe = uiStore.subscribe(state => {
    isLinksActive = state.showConnections;
    isExploreActive = state.isOverviewModeManual;
  });

  // Subscribe to scrollyStore to track timeline and overview state
  const scrollyUnsubscribe = scrollyStore.subscribe(state => {
    isTimelineActive = state.phase === 'timeline';
    // Overview is active when in categorization or zoom phase (normal navigation state)
    isOverviewActive = (state.phase === 'categorization' || state.phase === 'zoom') && !state.isInOverview;
  });

  onMount(() => {
    // Find the scrolly container
    scrollContainer = document.querySelector('.scrolly-container') as HTMLElement;
    return () => {
      unsubscribe();
      scrollyUnsubscribe();
    };
  });

  function handleGoToOverview() {
    // Go to Overview state (categorization phase with node sorting and category navigation)
    // This deactivates Explore and Timeline modes
    
    // Disable explore mode and show genre grouping for sorting
    uiStore.update(state => ({
      ...state,
      isOverviewModeManual: false,
      showGenreGrouping: true,
      isScrollLocked: false
    }));
    
    // Set to categorization phase to enable category navigation
    scrollyStore.update(s => ({
      ...s,
      phase: 'categorization', // This phase allows category navigation with arrow keys
      focusedCategory: null,
      focusedCategoryIndex: -1,
      displayedCategory: 'Overview' as any,
      isInOverview: false,
      isAnimatingCamera: false
    }));
    
    // Reset timeline if active
    timelineStore.update(s => ({
      ...s,
      isActive: false
    }));
    
    // Animate camera to overview position
    cameraController.animateToOverview(800);
    
    // Clear focused node
    focusedNodeId.set(null);
    
    // Clear search if active
    searchStore.update(s => ({
      ...s,
      searchQuery: '',
      matchedNodeIds: new Set(),
      isSearchActive: false,
      isFocusMode: false
    }));
  }

  function handleExplore() {
    // Activate Explore mode (SearchBar visible, free movement)
    // This deactivates Overview and Timeline modes
    
    // If already in explore mode, do nothing (or could toggle off to overview)
    if (isExploreActive) {
      // Toggle off - go back to overview
      handleGoToOverview();
      return;
    }
    
    // Disable timeline
    timelineStore.update(s => ({
      ...s,
      isActive: false
    }));
    
    // Animate camera to overview position
    cameraController.animateToOverview(1200);
    
    // Reset scrolly store to overview state (explore view)
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
    
    // Enable explore mode
    uiStore.update(state => ({
      ...state,
      isOverviewModeManual: true,
      isScrollLocked: true,
      showConnections: true
    }));
  }

  function handleDisplayLinks() {
    // Toggle display of links using the uiStore
    uiStore.update(state => ({
      ...state,
      showConnections: !state.showConnections
    }));
  }

  function handleTimeline() {
    // Activate Timeline mode
    // This deactivates Overview and Explore modes
    
    // If already in timeline mode, toggle off - go back to overview
    if (isTimelineActive) {
      handleGoToOverview();
      return;
    }
    
    // Navigate directly to Timeline mode
    
    // Disable explore mode
    uiStore.update(state => ({
      ...state,
      isOverviewModeManual: false,
      isScrollLocked: false,
      showConnections: true  // Enable display links in timeline view
    }));
    
    // Clear search if active
    searchStore.update(s => ({
      ...s,
      searchQuery: '',
      matchedNodeIds: new Set(),
      isSearchActive: false,
      isFocusMode: false
    }));
    
    // Reset focused node
    focusedNodeId.set(null);
    
    // Set scrolly store directly to timeline phase
    scrollyStore.update(s => ({
      ...s,
      phase: 'timeline',
      focusedCategory: null,
      focusedCategoryIndex: -1,
      displayedCategory: 'Timeline' as any,
      isInOverview: false,
      isAnimatingCamera: false
    }));
    
    // Activate timeline and reset to first year
    timelineStore.update(s => ({
      ...s,
      isActive: true,
      currentYearIndex: 0
    }));
  }
</script>

<header class="bottom-header" class:timeline-mode={isTimelineActive}>
  <nav class="bottom-nav">
    <button class="nav-button" class:active={isOverviewActive} on:click={handleGoToOverview} title="Zurück zum Overview (Kategorien-Navigation)">
      Overview
    </button>
    <button class="nav-button" class:active={isExploreActive} on:click={handleExplore} title="Explore aktivieren/deaktivieren (Suche)">
      Explore
    </button>
    <button class="nav-button timeline-button" class:active={isTimelineActive} on:click={handleTimeline} title="Timeline aktivieren/deaktivieren">
      Timeline
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
    height: 64px;
    background: none;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .bottom-header.timeline-mode {
    top: 0;
    bottom: auto;
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

  @media (max-width: 900px) {
    .bottom-nav {
      gap: 60px;
      padding: 0 30px;
    }

    .nav-button {
      font-size: 18px;
    }
  }

  @media (max-width: 600px) {
    .bottom-nav {
      gap: 40px;
      padding: 0 20px;
    }

    .nav-button {
      font-size: 16px;
    }
    
    .nav-button::after {
      bottom: 10px;
    }
  }
</style>
