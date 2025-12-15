<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import type { GenreCategory } from '$lib/graph/genreMapping';
  import { 
    scrollyStore, 
    updateScrollProgress, 
    setGenreGroupQueue,
    setIntroComplete,
    setCategorizationComplete 
  } from '$lib/stores/scrollyStore';
  import { uiStore } from '$lib/stores/uiStore';
  import { graphData } from '$lib/stores';
  import { cameraController } from '$lib/graph/cameraController';

  let scrollContainer: HTMLDivElement;
  let initialized = false;
  let lastPhase: string = 'intro';
  let lastFocusedCategory: GenreCategory | null = null;
  let lastCameraAnimationTime = 0;
  const MIN_ANIMATION_INTERVAL = 1500; // Mindestabstand zwischen Animationen

  // Reaktive Variablen aus Store
  $: phase = $scrollyStore.phase;
  $: focusedCategory = $scrollyStore.focusedCategory;
  $: scrollProgress = $scrollyStore.scrollProgress;
  $: isAnimatingCamera = $scrollyStore.isAnimatingCamera;

  // Reagiere auf Kategorie-Wechsel während Zoom-Phase
  $: if (phase === 'zoom' && focusedCategory && focusedCategory !== lastFocusedCategory) {
    const now = performance.now();
    // Nur animieren wenn genug Zeit seit letzter Animation vergangen ist
    if (now - lastCameraAnimationTime >= MIN_ANIMATION_INTERVAL) {
      const position = $scrollyStore.categoryPositions[focusedCategory];
      if (position) {
        console.log(`Zoom zu Kategorie: ${focusedCategory}`, position);
        scrollyStore.update(state => ({
          ...state,
          isAnimatingCamera: true
        }));
        cameraController.animateToCategoryPosition(position.x, position.y, 1200, 2.5);
        lastCameraAnimationTime = now;
        lastFocusedCategory = focusedCategory;
        
        // Animation abschließen nach 1200ms
        setTimeout(() => {
          scrollyStore.update(state => ({
            ...state,
            isAnimatingCamera: false
          }));
        }, 1200);
      }
    }
  }

  onMount(() => {
    // Initialisiere Kategorie-Queue aus Graph-Daten
    initializeCategoryQueue();
    
    // Scroll-Handler
    const handleScroll = () => {
      if (!scrollContainer) return;
      
      // Blockiere Scroll während Animation läuft
      if (isAnimatingCamera) {
        return;
      }
      
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
      
      updateScrollProgress(progress);
      handlePhaseTransitions(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial scroll check
    handleScroll();
    initialized = true;

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cameraController.reset();
    };
  });

  function initializeCategoryQueue() {
    const state = get(graphData);
    if (!state?.nodes) return;

    const categoryCounts: Partial<Record<GenreCategory, number>> = {};
    
    for (const node of state.nodes) {
      const cat = (node.category || 'Specialty & Other') as GenreCategory;
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }

    // Sortiere nach Größe (absteigend)
    const sortedCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => (b || 0) - (a || 0))
      .map(([cat]) => cat as GenreCategory);

    setGenreGroupQueue(sortedCategories, categoryCounts);
  }

  function handlePhaseTransitions(progress: number) {
    const currentState = get(scrollyStore);
    const newPhase = currentState.phase;

    // Phase-Wechsel erkennen
    if (newPhase !== lastPhase) {
      onPhaseChange(lastPhase, newPhase);
      lastPhase = newPhase;
    }

    // Summary-Phase: Zurück zur Übersicht
    if (newPhase === 'summary' && lastPhase === 'zoom') {
      cameraController.animateToOverview(1500);
      lastFocusedCategory = null;
    }
  }

  function onPhaseChange(oldPhase: string, newPhase: string) {
    console.log(`📍 Phase: ${oldPhase} → ${newPhase}`);

    // Intro → Categorization: Aktiviere Genre-Gruppierung
    if (oldPhase === 'intro' && newPhase === 'categorization') {
      setIntroComplete();
      uiStore.update(s => ({ ...s, showGenreGrouping: true }));
    }

    // Categorization abgeschlossen
    if (oldPhase === 'categorization' && newPhase === 'zoom') {
      setCategorizationComplete();
    }

    // Summary: Reset Genre-Gruppierung optional
    if (newPhase === 'summary') {
      cameraController.animateToOverview(1500);
      lastFocusedCategory = null;
    }
    
    // Intro: Reset
    if (newPhase === 'intro') {
      cameraController.animateToOverview(1000);
      lastFocusedCategory = null;
    }
  }
</script>

<div bind:this={scrollContainer} class="scrolly-container">
  <!-- Scroll-Spacer für Scroll-Höhe (keine visuellen Elemente) -->
  <div class="scroll-spacer">
  </div>

  <!-- Sticky Graph Container -->
  <div class="sticky-graph">
    <slot />
  </div>
</div>

<style>
  .scrolly-container {
    position: relative;
    width: 100%;
    background: 
      color(rgba(247, 234, 201, 0.03) 0%),
  }

  .scroll-spacer {
    position: relative;
    min-height: 500vh;
    pointer-events: none;
  }

  .sticky-graph {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    z-index: 1;
    pointer-events: auto;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .section-content h1 {
      font-size: 1.5rem;
    }

    .section-content h2 {
      font-size: 1.2rem;
    }

    .section-content p {
      font-size: 1rem;
    }
  }
</style>
