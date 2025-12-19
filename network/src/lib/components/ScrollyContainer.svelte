<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import type { GenreCategory } from '$lib/graph/genreMapping';
  import { 
    scrollyStore, 
    updateScrollProgress, 
    setGenreGroupQueue,
    setIntroComplete,
    setCategorizationComplete,
    setDisplayedCategory,
    activateOverview 
  } from '$lib/stores/scrollyStore';
  import { uiStore } from '$lib/stores/uiStore';
  import { graphData } from '$lib/stores';
  import { cameraController } from '$lib/graph/cameraController';

  let scrollContainer: HTMLDivElement;
  let initialized = false;
  let lastPhase: string = 'intro';
  let lastFocusedCategory: GenreCategory | null = null;
  let lastCameraAnimationTime = 0;
  let lastScrollProgress = 0; // Track Scroll-Richtung
  const MIN_ANIMATION_INTERVAL = 1500; // Mindestabstand zwischen Animationen
  const CAMERA_ANIMATION_DURATION = 1500; // Erhöht auf 1500ms für smoothere Animation
  const TITLE_ANIMATION_DURATION = 500; // Dauer der Titel-Animation
  const TITLE_START_DELAY = CAMERA_ANIMATION_DURATION - TITLE_ANIMATION_DURATION; // Titel startet so, dass beide enden zur gleichen Zeit

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
      const categoryIndex = $scrollyStore.focusedCategoryIndex;
      const totalCategories = $scrollyStore.genreGroupQueue.length;
      const isLastCategory = categoryIndex === totalCategories - 1;
      
      if (position) {
        console.log(`Zoom zu Kategorie: ${focusedCategory}`, position);
        scrollyStore.update(state => ({
          ...state,
          isAnimatingCamera: true
        }));
        
        // Starte Kamera-Animation - displayedCategory bleibt beim bisherigen Titel
        cameraController.animateToCategoryPosition(position.x, position.y, CAMERA_ANIMATION_DURATION, 2.5);
        lastCameraAnimationTime = now;
        lastFocusedCategory = focusedCategory;
        
        // Titel-Animation startet früher, sodass beide Animationen zur gleichen Zeit enden
        setTimeout(() => {
          setDisplayedCategory(focusedCategory);
        }, TITLE_START_DELAY);
        
        // Kamera-Animation abschließen
        setTimeout(() => {
          scrollyStore.update(state => ({
            ...state,
            isAnimatingCamera: false
          }));
          
          // Nach letzter Kategorie (Reggae): Wechsel zu Overview mit gleicher Animation
          if (isLastCategory) {
            // Warte kurz, dann starte Overview-Animation
            setTimeout(() => {
              scrollyStore.update(state => ({
                ...state,
                isAnimatingCamera: true
              }));
              
              // Kamera zur Overview animieren
              cameraController.animateToOverview(CAMERA_ANIMATION_DURATION);
              
              // Titel-Wechsel am Ende der Kamera-Animation (nicht mit Delay davor)
              setTimeout(() => {
                activateOverview();
              }, CAMERA_ANIMATION_DURATION);
              
              // Animation abschließen
              setTimeout(() => {
                scrollyStore.update(state => ({
                  ...state,
                  isAnimatingCamera: false
                }));
              }, CAMERA_ANIMATION_DURATION);
            }, 300); // Kurze Pause nach letzter Kategorie
          }
        }, CAMERA_ANIMATION_DURATION);
      }
    }
  }

  onMount(() => {
    // Initialisiere Kategorie-Queue aus Graph-Daten
    initializeCategoryQueue();
    
    // Animation Loop für Navbar während Kamera-Animation
    let animationStartTime: number | null = null;
    let lastIsAnimating = false;
    
    const animationLoop = () => {
      const currentState = get(scrollyStore);
      
      if (currentState.isAnimatingCamera && !lastIsAnimating) {
        // Animation startet
        animationStartTime = performance.now();
        lastIsAnimating = true;
      } else if (!currentState.isAnimatingCamera && lastIsAnimating) {
        // Animation endet - setze Progress auf 1 um unten fixiert zu bleiben
        animationStartTime = null;
        lastIsAnimating = false;
        scrollyStore.update(state => ({
          ...state,
          navbarAnimationProgress: 1
        }));
      }
      
      if (currentState.isAnimatingCamera && animationStartTime !== null) {
        const elapsed = performance.now() - animationStartTime;
        const progress = Math.min(elapsed / CAMERA_ANIMATION_DURATION, 1);
        
        scrollyStore.update(state => ({
          ...state,
          navbarAnimationProgress: progress
        }));
      }
      
      requestAnimationFrame(animationLoop);
    };
    
    const rafId = requestAnimationFrame(animationLoop);
    
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
      
      // Erkenne Scroll-Richtung
      const isScrollingDown = progress > lastScrollProgress;
      lastScrollProgress = progress;
      
      updateScrollProgress(progress);
      handlePhaseTransitions(progress, isScrollingDown);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial scroll check
    handleScroll();
    initialized = true;

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
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

  function handlePhaseTransitions(progress: number, isScrollingDown: boolean = true) {
    const currentState = get(scrollyStore);
    const newPhase = currentState.phase;

    // Phase-Wechsel erkennen
    if (newPhase !== lastPhase) {
      onPhaseChange(lastPhase, newPhase, isScrollingDown);
      lastPhase = newPhase;
    }

    // Backward Navigation: Overview → Zoom (beim Zurückscroll)
    if (newPhase === 'zoom' && lastPhase === 'overview' && !isScrollingDown) {
      console.log('📍 Zurück von Overview zu Zoom');
      lastFocusedCategory = null; // Reset, damit nächste Kategorie animiert wird
    }

    // Summary-Phase: Zurück zur Übersicht
    if (newPhase === 'summary' && lastPhase === 'zoom') {
      cameraController.animateToOverview(1500);
      lastFocusedCategory = null;
    }
  }

  function onPhaseChange(oldPhase: string, newPhase: string, isScrollingDown: boolean = true) {
    console.log(`📍 Phase: ${oldPhase} → ${newPhase} (${isScrollingDown ? 'down' : 'up'})`);

    // Intro → Categorization: Aktiviere Genre-Gruppierung
    if (oldPhase === 'intro' && newPhase === 'categorization') {
      setIntroComplete();
      uiStore.update(s => ({ ...s, showGenreGrouping: true }));
    }

    // Categorization abgeschlossen
    if (oldPhase === 'categorization' && newPhase === 'zoom') {
      setCategorizationComplete();
    }

    // Zoom → Overview (beim Scrollen zu Reggae / nach letzter Kategorie)
    if (oldPhase === 'zoom' && newPhase === 'overview' && isScrollingDown) {
      console.log('📍 Wechsel zu Overview-Modus nach Reggae');
      // Die GraphCanvas wird automatisch Overview-Ankerpunkte aktivieren
    }

    // Overview → Zoom (Zurückscroll, neue Gruppierung)
    if (oldPhase === 'overview' && newPhase === 'zoom' && !isScrollingDown) {
      console.log('📍 Zurück zu Zoom aus Overview - Gruppierungen werden neu sortiert');
      // Kategorie-Queue neu initialisieren für neue Sortierung
      initializeCategoryQueue();
      lastFocusedCategory = null;
    }

    // Summary: Reset Genre-Gruppierung optional
    if (newPhase === 'summary') {
      cameraController.animateToOverview(CAMERA_ANIMATION_DURATION);
      lastFocusedCategory = null;
    }
    
    // Intro: Reset
    if (newPhase === 'intro') {
      cameraController.animateToOverview(CAMERA_ANIMATION_DURATION);
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
    .sticky-graph {
      height: auto;
    }
  }
</style>
