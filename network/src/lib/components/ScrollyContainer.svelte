<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import type { GenreCategory } from '$lib/graph/genreMapping';
  import { 
    scrollyStore, 
    setGenreGroupQueue,
    setIntroComplete,
    setCategorizationComplete,
    setDisplayedCategory,
    activateOverview,
    navigateToNextStep,
    navigateToPreviousStep,
    type ScrollyState
  } from '$lib/stores/scrollyStore';
  import { uiStore } from '$lib/stores/uiStore';
  import { graphData } from '$lib/stores';
  import { cameraController } from '$lib/graph/cameraController';

  let scrollContainer: HTMLDivElement;
  let initialized = false;
  let lastPhase: string = 'intro';
  let lastFocusedCategory: GenreCategory | null = null;
  let lastCameraAnimationTime = 0;
  const MIN_ANIMATION_INTERVAL = 1200; // Mindestabstand zwischen Animationen (etwas kürzer für Keyboard)
  const CAMERA_ANIMATION_DURATION = 1200; // Animation-Dauer für Kamera
  const TITLE_ANIMATION_DURATION = 400; // Dauer der Titel-Animation
  const TITLE_START_DELAY = CAMERA_ANIMATION_DURATION - TITLE_ANIMATION_DURATION; // Titel startet so, dass beide enden zur gleichen Zeit
  
  // Keyboard Navigation State
  let isNavigating = false; // Verhindert doppelte Navigationen während Animation

  // Genres für Richtungswechsel (basierend auf Kreisposition)
  const DIRECTION_CHANGE_GENRES = {
    // Ab diesen Genres ändert sich die Navigationsrichtung
    rightDownToLeftDown: 'Specialty', // Wechsel von rechts-unten nach links-unten
    leftDownToLeftUp: 'Experimental', // Wechsel von links-unten nach links-oben
    leftUpToRightUp: 'Soul'           // Wechsel von links-oben nach rechts-oben
  };

  // Bestimmt die Navigationsrichtung basierend auf aktuellem Genre
  type NavigationDirection = 'right-down' | 'left-down' | 'left-up' | 'right-up';
  
  function getNavigationDirectionForIndex(index: number, queue: GenreCategory[]): NavigationDirection {
    if (queue.length === 0 || index < 0) return 'right-down';
    
    // Finde die Indizes der Richtungswechsel-Genres
    const specialtyIndex = queue.indexOf(DIRECTION_CHANGE_GENRES.rightDownToLeftDown as GenreCategory);
    const experimentalIndex = queue.indexOf(DIRECTION_CHANGE_GENRES.leftDownToLeftUp as GenreCategory);
    const soulIndex = queue.indexOf(DIRECTION_CHANGE_GENRES.leftUpToRightUp as GenreCategory);
    
    // Bestimme Richtung basierend auf Position
    if (soulIndex !== -1 && index >= soulIndex) {
      return 'right-up';
    }
    if (experimentalIndex !== -1 && index >= experimentalIndex) {
      return 'left-up';
    }
    if (specialtyIndex !== -1 && index >= specialtyIndex) {
      return 'left-down';
    }
    return 'right-down';
  }
  
  function getNavigationDirection(category: GenreCategory | null, queue: GenreCategory[]): NavigationDirection {
    if (!category || queue.length === 0) return 'right-down';
    const currentIndex = queue.indexOf(category);
    return getNavigationDirectionForIndex(currentIndex, queue);
  }
  
  // Prüft ob eine Taste "vorwärts" navigieren soll
  function isForwardKey(key: string, direction: NavigationDirection): boolean {
    switch (direction) {
      case 'right-down':
        return key === 'ArrowRight' || key === 'ArrowDown';
      case 'left-down':
        return key === 'ArrowLeft' || key === 'ArrowDown';
      case 'left-up':
        return key === 'ArrowLeft' || key === 'ArrowUp';
      case 'right-up':
        return key === 'ArrowRight' || key === 'ArrowUp';
    }
  }
  
  // Prüft ob eine Taste "rückwärts" navigieren soll
  function isBackwardKey(key: string, direction: NavigationDirection): boolean {
    switch (direction) {
      case 'right-down':
        return key === 'ArrowLeft' || key === 'ArrowUp';
      case 'left-down':
        return key === 'ArrowRight' || key === 'ArrowUp';
      case 'left-up':
        return key === 'ArrowRight' || key === 'ArrowDown';
      case 'right-up':
        return key === 'ArrowLeft' || key === 'ArrowDown';
    }
  }
  
  // Berechnet die Richtung für den aktuellen Navigationskontext
  // Beim Rückwärts-Navigieren verwenden wir die Richtung des vorherigen Genres
  function getContextualDirection(currentState: ScrollyState, isGoingBackward: boolean): NavigationDirection {
    const { focusedCategory, focusedCategoryIndex, genreGroupQueue, phase } = currentState;
    
    // In intro/categorization Phase: Standard-Richtung
    if (phase === 'intro' || phase === 'categorization') {
      return 'right-down';
    }
    
    // In overview: Richtung des letzten Genres
    if (phase === 'overview') {
      return getNavigationDirectionForIndex(genreGroupQueue.length - 1, genreGroupQueue);
    }
    
    // In zoom Phase
    if (isGoingBackward && focusedCategoryIndex > 0) {
      // Beim Rückwärts: Richtung des vorherigen Genres (zu dem wir navigieren)
      return getNavigationDirectionForIndex(focusedCategoryIndex - 1, genreGroupQueue);
    }
    
    // Standard: Richtung des aktuellen Genres
    return getNavigationDirection(focusedCategory, genreGroupQueue);
  }

  // Reaktive Variablen aus Store
  $: phase = $scrollyStore.phase;
  $: focusedCategory = $scrollyStore.focusedCategory;
  $: scrollProgress = $scrollyStore.scrollProgress;
  $: isAnimatingCamera = $scrollyStore.isAnimatingCamera;

  // Kategorie-Wechsel werden jetzt durch handlePhaseTransitions in handleKeyDown gesteuert

  // Keyboard Navigation Handler
  function handleKeyDown(event: KeyboardEvent) {
    // Ignoriere wenn im Explore-Modus (manuell) oder während Navigation
    const uiState = get(uiStore);
    if (uiState.isScrollLocked || isNavigating || isAnimatingCamera) {
      return;
    }
    
    // Ignoriere wenn Fokus auf Input-Element liegt
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    const now = performance.now();
    if (now - lastCameraAnimationTime < MIN_ANIMATION_INTERVAL) {
      return; // Noch in Cooldown
    }
    
    // Hole aktuelle Richtung basierend auf fokussiertem Genre
    const currentState = get(scrollyStore);
    
    // Bestimme Richtung für Vorwärts-Navigation (aktuelle Position)
    const forwardDirection = getContextualDirection(currentState, false);
    // Bestimme Richtung für Rückwärts-Navigation (vorherige Position)
    const backwardDirection = getContextualDirection(currentState, true);
    
    // Prüfe ob vorwärts oder rückwärts navigiert werden soll
    const isForward = isForwardKey(event.key, forwardDirection);
    const isBackward = isBackwardKey(event.key, backwardDirection);
    
    if (isForward) {
      event.preventDefault();
      isNavigating = true;
      
      if (navigateToNextStep()) {
        lastCameraAnimationTime = now;
        handlePhaseTransitions(true);
      }
      
      setTimeout(() => {
        isNavigating = false;
      }, MIN_ANIMATION_INTERVAL);
    }
    
    if (isBackward) {
      event.preventDefault();
      isNavigating = true;
      
      if (navigateToPreviousStep()) {
        lastCameraAnimationTime = now;
        handlePhaseTransitions(false);
      }
      
      setTimeout(() => {
        isNavigating = false;
      }, MIN_ANIMATION_INTERVAL);
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
    
    // Keyboard Event Listener
    window.addEventListener('keydown', handleKeyDown);
    
    initialized = true;

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
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

  function handlePhaseTransitions(isScrollingDown: boolean = true) {
    const currentState = get(scrollyStore);
    const newPhase = currentState.phase;
    const newFocusedCategory = currentState.focusedCategory;

    // Phase-Wechsel erkennen
    if (newPhase !== lastPhase) {
      onPhaseChange(lastPhase, newPhase, isScrollingDown);
      lastPhase = newPhase;
    }
    
    // Kategorie-Wechsel in Zoom-Phase
    if (newPhase === 'zoom' && newFocusedCategory && newFocusedCategory !== lastFocusedCategory) {
      const position = currentState.categoryPositions[newFocusedCategory];
      
      if (position) {
        console.log(`🎯 Navigation zu Kategorie: ${newFocusedCategory}`, position);
        scrollyStore.update(state => ({
          ...state,
          isAnimatingCamera: true
        }));
        
        // Starte Kamera-Animation
        cameraController.animateToCategoryPosition(position.x, position.y, CAMERA_ANIMATION_DURATION, 2.5);
        
        // Titel-Animation startet später, sodass beide Animationen zur gleichen Zeit enden
        setTimeout(() => {
          setDisplayedCategory(newFocusedCategory);
        }, TITLE_START_DELAY);
        
        // Kamera-Animation abschließen
        setTimeout(() => {
          scrollyStore.update(state => ({
            ...state,
            isAnimatingCamera: false
          }));
        }, CAMERA_ANIMATION_DURATION);
      }
      
      lastFocusedCategory = newFocusedCategory;
    }

    // Backward Navigation: Overview → Zoom
    if (newPhase === 'zoom' && lastPhase === 'overview' && !isScrollingDown) {
      console.log('📍 Zurück von Overview zu Zoom');
    }
  }

  function onPhaseChange(oldPhase: string, newPhase: string, isScrollingDown: boolean = true) {
    console.log(`📍 Phase: ${oldPhase} → ${newPhase} (${isScrollingDown ? 'down' : 'up'})`);

    // Intro → Categorization: Aktiviere Genre-Gruppierung
    if (oldPhase === 'intro' && newPhase === 'categorization') {
      setIntroComplete();
      uiStore.update(s => ({ ...s, showGenreGrouping: true }));
      setDisplayedCategory('Overview' as any);
      
      // Kamera zoomt raus zur Übersicht
      scrollyStore.update(state => ({
        ...state,
        isAnimatingCamera: true
      }));
      cameraController.animateToOverview(CAMERA_ANIMATION_DURATION);
      setTimeout(() => {
        scrollyStore.update(state => ({
          ...state,
          isAnimatingCamera: false
        }));
      }, CAMERA_ANIMATION_DURATION);
    }

    // Categorization abgeschlossen → Zoom zum ersten Genre
    if (oldPhase === 'categorization' && newPhase === 'zoom') {
      setCategorizationComplete();
    }
    
    // Zoom → Categorization (zurück)
    if (oldPhase === 'zoom' && newPhase === 'categorization' && !isScrollingDown) {
      setDisplayedCategory('Overview' as any);
      lastFocusedCategory = null;
      
      // Kamera zurück zur Übersicht
      scrollyStore.update(state => ({
        ...state,
        isAnimatingCamera: true
      }));
      cameraController.animateToOverview(CAMERA_ANIMATION_DURATION);
      setTimeout(() => {
        scrollyStore.update(state => ({
          ...state,
          isAnimatingCamera: false
        }));
      }, CAMERA_ANIMATION_DURATION);
    }

    // Zoom → Overview (nach letzter Kategorie)
    if (oldPhase === 'zoom' && newPhase === 'overview' && isScrollingDown) {
      console.log('📍 Wechsel zu Overview-Modus');
      
      // Starte Kamera-Animation zur Overview
      scrollyStore.update(state => ({
        ...state,
        isAnimatingCamera: true
      }));
      
      // Animiere Kamera zur Overview
      cameraController.animateToOverview(CAMERA_ANIMATION_DURATION);
      
      // Wechsle Titel nach Animation und aktiviere Explore-Modus
      setTimeout(() => {
        activateOverview();
        // Aktiviere automatisch den Explore-Modus
        uiStore.update(s => ({ ...s, isOverviewModeManual: true }));
      }, CAMERA_ANIMATION_DURATION);
      
      // Beende Animation
      setTimeout(() => {
        scrollyStore.update(state => ({
          ...state,
          isAnimatingCamera: false
        }));
      }, CAMERA_ANIMATION_DURATION);
    }

    // Overview → Zoom (zurück zum letzten Genre)
    if (oldPhase === 'overview' && newPhase === 'zoom' && !isScrollingDown) {
      console.log('📍 Zurück zu Zoom aus Overview');
      // lastFocusedCategory wird durch navigateToPreviousStep bereits gesetzt
    }
    
    // Categorization → Intro (zurück)
    if (oldPhase === 'categorization' && newPhase === 'intro' && !isScrollingDown) {
      setDisplayedCategory('Overview' as any);
      uiStore.update(s => ({ ...s, showGenreGrouping: false }));
      
      // Kamera zur Intro-Position
      scrollyStore.update(state => ({
        ...state,
        isAnimatingCamera: true
      }));
      cameraController.animateToOverview(CAMERA_ANIMATION_DURATION);
      setTimeout(() => {
        scrollyStore.update(state => ({
          ...state,
          isAnimatingCamera: false
        }));
      }, CAMERA_ANIMATION_DURATION);
    }
    
    // Intro (von Kategorisierung kommend)
    if (newPhase === 'intro' && !isScrollingDown) {
      lastFocusedCategory = null;
    }
  }
  
  // Reaktiv: Body overflow basierend auf Scroll-Lock Status
  $: if (typeof document !== 'undefined') {
    if ($uiStore.isScrollLocked) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
</script>

<div bind:this={scrollContainer} class="scrolly-container" class:scroll-locked={$uiStore.isScrollLocked}>
  <!-- Graph Container (kein Scrolling mehr nötig) -->
  <div class="graph-container">
    <slot />
  </div>
</div>

<style>
  .scrolly-container {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
  }

  .graph-container {
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
    .graph-container {
      height: 100vh;
    }
  }
</style>
