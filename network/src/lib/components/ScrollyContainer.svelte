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
  <!-- Scroll-Spacer für Scroll-Höhe -->
  <div class="scroll-spacer">
    <!-- Phase 1: Intro -->
    <section class="scrolly-section intro" class:active={phase === 'intro'}>
      <div class="section-content">
        <h1>Genre Universe</h1>
        <p>Erkunde deine Spotify-Genres in einem interaktiven Universum</p>
        <div class="scroll-hint">↓ Scroll zum Starten</div>
      </div>
    </section>

    <!-- Phase 2: Kategorisierung -->
    <section class="scrolly-section categorization" class:active={phase === 'categorization'}>
      <div class="section-content">
        <h2>Genre-Kategorien</h2>
        <p>Genres werden nach ihrer Kategorie gruppiert</p>
      </div>
    </section>

    <!-- Phase 3: Zoom-Fokus -->
    <section class="scrolly-section zoom" class:active={phase === 'zoom'}>
      <div class="section-content">
        {#if focusedCategory}
          <h2>{focusedCategory}</h2>
          <p>{$scrollyStore.categoryNodeCounts[focusedCategory] || 0} Genres in dieser Kategorie</p>
        {:else}
          <h2>Detailansichten</h2>
          <p>Nähere Betrachtung jeder Genre-Kategorie</p>
        {/if}
      </div>
    </section>

    <!-- Phase 4: Summary -->
    <section class="scrolly-section summary" class:active={phase === 'summary'}>
      <div class="section-content">
        <h2>Dein Genre-Universum</h2>
        <p>{$scrollyStore.genreGroupQueue.length} Kategorien mit einzigartigen Genres</p>
      </div>
    </section>
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
      radial-gradient(ellipse at 50% 0%, rgba(29, 185, 84, 0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 100%, rgba(0, 217, 255, 0.1) 0%, transparent 50%),
      linear-gradient(180deg, rgba(13, 17, 23, 1) 0%, rgba(22, 27, 34, 1) 100%);
  }

  .scroll-spacer {
    position: relative;
    min-height: 500vh;
    pointer-events: none;
  }

  .scrolly-section {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 40px;
    padding-left: 60px;
    opacity: 0.3;
    transition: opacity 0.5s ease;
  }

  .scrolly-section.active {
    opacity: 1;
  }

  .section-content {
    text-align: left;
    color: rgba(255, 255, 255, 0.95);
    max-width: 350px;
    padding: 30px;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 12px;
    backdrop-filter: blur(10px);
    pointer-events: auto;
    z-index: 10;
  }

  .section-content h1 {
    font-size: 2rem;
    margin: 0 0 15px 0;
    font-weight: 700;
    background: linear-gradient(135deg, #1db954, #00d9ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .section-content h2 {
    font-size: 1.5rem;
    margin: 0 0 12px 0;
    font-weight: 600;
    color: #00d9ff;
  }

  .section-content p {
    font-size: 0.9rem;
    margin: 0;
    opacity: 0.8;
    line-height: 1.5;
  }

  .scroll-hint {
    margin-top: 20px;
    font-size: 0.85rem;
    opacity: 0.6;
    animation: bounce 2s infinite;
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(10px); }
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
