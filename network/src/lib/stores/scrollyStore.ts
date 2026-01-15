import { writable, derived, get } from 'svelte/store';
import type { GenreCategory } from '$lib/graph/genreMapping';

export type ScrollyPhase = 'intro' | 'categorization' | 'zoom' | 'overview' | 'summary';

export interface ScrollyState {
  scrollProgress: number; // 0-1 total scroll progress
  phase: ScrollyPhase;
  focusedCategory: GenreCategory | null;
  focusedCategoryIndex: number;
  cameraZoom: number;
  cameraX: number;
  cameraY: number;
  genreGroupQueue: GenreCategory[];
  categoryNodeCounts: Partial<Record<GenreCategory, number>>;
  categoryPositions: Partial<Record<GenreCategory, { x: number; y: number }>>;
  isAnimatingCamera: boolean;
  introAnimationComplete: boolean;
  categorizationComplete: boolean;
  displayedCategory: GenreCategory | null; // Für Genre-Titel-Animation erst nach Kamera-Zoom
  isInOverview: boolean; // Zeigt an, ob wir im Overview-Modus sind
  navbarAnimationProgress: number; // 0-1 Progress der Navbar-Animation während Kamera-Zoom
  isScrollingDown: boolean; // true = nach unten, false = nach oben
  lastScrollProgress: number; // Zum Tracken der Scroll-Richtung
  wasInOverviewMode: boolean; // Zeigt an, ob wir gerade aus Overview zurückkommen
  overviewUIReady: boolean; // True after nodes have settled in overview mode (2s delay)
}

const initialState: ScrollyState = {
  scrollProgress: 0,
  phase: 'intro',
  focusedCategory: null,
  focusedCategoryIndex: -1,
  cameraZoom: 1,
  cameraX: 0,
  cameraY: 0,
  genreGroupQueue: [],
  categoryNodeCounts: {},
  categoryPositions: {},
  isAnimatingCamera: false,
  introAnimationComplete: false,
  categorizationComplete: false,
  displayedCategory: 'Overview' as GenreCategory,
  isInOverview: false,
  navbarAnimationProgress: 0,
  isScrollingDown: true,
  lastScrollProgress: 0,
  wasInOverviewMode: false,
  overviewUIReady: false
};

export const scrollyStore = writable<ScrollyState>(initialState);

/**
 * Berechnet die aktuelle Phase basierend auf Scroll-Progress
 * Phasen-Grenzen: 0-0.10 intro | 0.10-0.18 categorization | 0.18-0.98 zoom | 0.98-1.0 overview
 * Das letzte Genre bleibt lange in der Zoom-Phase, um automatisches Wechseln zu vermeiden
 */
function calculatePhase(progress: number): ScrollyPhase {
  if (progress < 0.10) return 'intro';
  if (progress < 0.18) return 'categorization';
  if (progress < 0.98) return 'zoom';
  return 'overview';
}

/**
 * Berechnet den fokussierten Kategorie-Index für Zoom-Phase
 * Mit Hysterese um Flackern zu vermeiden
 * Zoom-Phase: 0.18-0.98 (80% des gesamten Scroll-Fortschritts)
 * Das letzte Genre bleibt fokussiert bis man wirklich zur Overview scrollt (0.98-1.0)
 */
function calculateFocusedCategoryIndex(progress: number, totalCategories: number): number {
  if (progress < 0.18 || totalCategories === 0) return -1;  // Vor Zoom-Phase
  if (progress > 0.98) return -1; // Erst in der letzten 2% zur Overview wechseln
  
  // Map 0.18-0.98 to 0-(totalCategories-1)
  const zoomProgress = (progress - 0.18) / 0.80;  // 0.80 = 0.98 - 0.18
  const rawIndex = Math.min(zoomProgress * totalCategories, totalCategories - 1);
  
  // Mit Hysterese: mehr Zeit pro Kategorie für stabiler Fokus
  return Math.min(Math.floor(rawIndex), totalCategories - 1);
}

/**
 * Aktualisiert den Scroll-Progress und triggert Phase-Updates
 * Erkennt die Scroll-Richtung und aktualisiert entsprechend
 * OPTIMIERT: Vermeidet unnötige Updates wenn sich nichts ändert
 */
export function updateScrollProgress(progress: number) {
  scrollyStore.update(state => {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    
    // Skip update wenn Progress sich nicht signifikant geändert hat
    const progressDiff = Math.abs(clampedProgress - state.scrollProgress);
    if (progressDiff < 0.0001) {
      return state; // Keine Änderung
    }
    
    const isScrollingDown = clampedProgress > state.lastScrollProgress;
    const newPhase = calculatePhase(clampedProgress);
    const focusedIndex = calculateFocusedCategoryIndex(clampedProgress, state.genreGroupQueue.length);
    const focusedCategory = focusedIndex >= 0 ? state.genreGroupQueue[focusedIndex] : null;

    // Skip update wenn nur scrollProgress sich ändert aber Phase/Kategorie gleich bleiben
    // Das reduziert Store-Updates drastisch
    if (
      newPhase === state.phase &&
      focusedIndex === state.focusedCategoryIndex &&
      focusedCategory === state.focusedCategory
    ) {
      // Nur scrollProgress updaten, keine anderen Berechnungen
      return {
        ...state,
        scrollProgress: clampedProgress,
        lastScrollProgress: clampedProgress,
        isScrollingDown
      };
    }

    // Erkenne Wechsel von Overview zu Zoom (Rückwärts-Scrolling)
    const wasInOverviewMode = state.isInOverview && !isScrollingDown && newPhase === 'zoom';

    return {
      ...state,
      scrollProgress: clampedProgress,
      phase: newPhase,
      focusedCategoryIndex: focusedIndex,
      focusedCategory,
      isScrollingDown,
      lastScrollProgress: clampedProgress,
      wasInOverviewMode,
      isInOverview: newPhase === 'overview'
    };
  });
}

/**
 * Setzt die Kategorie-Warteschlange sortiert nach Gesamtspielzeit (totalMinutes)
 * Die meistgehörte Kategorie startet oben in der Mitte (12 Uhr)
 * Platziert sie auf einem Kreis im Uhrzeigersinn
 */
export function setGenreGroupQueue(
  queue: GenreCategory[], 
  categoryMinutes: Partial<Record<GenreCategory, number>>
) {
  // Sortiere Queue nach Gesamtspielzeit (absteigend) - meistgehört zuerst
  let sortedQueue = [...queue].sort((a, b) => {
    const minutesA = categoryMinutes[a] || 0;
    const minutesB = categoryMinutes[b] || 0;
    return minutesB - minutesA;
  });

  // Berechne Positionen auf einem Kreis
  // 12 Uhr = -π/2, dann im Uhrzeigersinn
  const categoryPositions: Partial<Record<GenreCategory, { x: number; y: number }>> = {};
  const radius = 400;
  const angleStep = (2 * Math.PI) / sortedQueue.length;

  sortedQueue.forEach((category, index) => {
    // Start bei 12 Uhr (-π/2) und gehe im Uhrzeigersinn
    const angle = -Math.PI / 2 + index * angleStep;
    categoryPositions[category] = {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  });

  scrollyStore.update(state => ({
    ...state,
    genreGroupQueue: sortedQueue,
    categoryNodeCounts: categoryMinutes,
    categoryPositions
  }));
}

/**
 * Setzt Kamera-Position (für Zoom-Animationen)
 */
export function setCameraPosition(zoom: number, x: number, y: number, isAnimating = false) {
  scrollyStore.update(state => ({
    ...state,
    cameraZoom: zoom,
    cameraX: x,
    cameraY: y,
    isAnimatingCamera: isAnimating
  }));
}

/**
 * Aktualisiert die angezeigte Kategorie (wird nach Kamera-Zoom angezeigt)
 */
export function setDisplayedCategory(category: GenreCategory | null) {
  scrollyStore.update(state => ({
    ...state,
    displayedCategory: category
  }));
}

/**
 * Markiert Intro-Animation als abgeschlossen
 */
export function setIntroComplete() {
  scrollyStore.update(state => ({
    ...state,
    introAnimationComplete: true
  }));
}

/**
 * Markiert Kategorisierung als abgeschlossen
 */
export function setCategorizationComplete() {
  scrollyStore.update(state => ({
    ...state,
    categorizationComplete: true
  }));
}

/**
 * Springt direkt zu einer Kategorie (für Progress-Indicator Klicks)
 */
export function jumpToCategory(category: GenreCategory) {
  scrollyStore.update(state => {
    const index = state.genreGroupQueue.indexOf(category);
    if (index === -1) return state;

    const position = state.categoryPositions[category];
    
    // Berechne die Scroll-Position basierend auf Kategorie-Index
    // Zoom-Phase: 0.35-0.98 (63% des gesamten Scrolls)
    // Teile die Zoom-Phase gleichmäßig auf alle Kategorien auf
    const totalCategories = state.genreGroupQueue.length;
    const zoomRangeStart = 0.35;
    const zoomRangeEnd = 0.98;
    const zoomRange = zoomRangeEnd - zoomRangeStart;
    
    // Berechne den Progress für diese Kategorie (in der Mitte ihrer Range)
    const progressPerCategory = zoomRange / totalCategories;
    const targetProgress = zoomRangeStart + (index + 0.5) * progressPerCategory;
    
    // Konvertiere Progress zu tatsächlicher Scroll-Position
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const targetScrollPosition = targetProgress * scrollHeight;
    
    // Führe sanftes Scrolling durch
    window.scrollTo({
      top: targetScrollPosition,
      behavior: 'smooth'
    });
    
    return {
      ...state,
      phase: 'zoom',
      focusedCategory: category,
      focusedCategoryIndex: index,
      cameraX: position?.x || 0,
      cameraY: position?.y || 0,
      cameraZoom: 1.5,
      isAnimatingCamera: true
    };
  });
}

/**
 * Reset zur Übersicht
 */
export function resetToOverview() {
  scrollyStore.update(state => ({
    ...state,
    cameraZoom: 1,
    cameraX: 0,
    cameraY: 0,
    focusedCategory: null,
    focusedCategoryIndex: -1,
    isAnimatingCamera: true
  }));
}

/**
 * Aktiviert Overview-Modus (nach letzter Kategorie)
 */
export function activateOverview() {
  scrollyStore.update(state => ({
    ...state,
    phase: 'overview',
    cameraZoom: 1,
    cameraX: 0,
    cameraY: 0,
    focusedCategory: null,
    focusedCategoryIndex: -1,
    displayedCategory: 'Explore' as any, // Spezial-String für Explore-Modus
    isAnimatingCamera: false, // Kamera ist bereits von animateToOverview animiert
    isInOverview: true
  }));
}

/**
 * Navigiert zum nächsten Step (Pfeiltaste runter)
 * Intro/Kategorisierung → Genre 1 → Genre 2 → ... → Overview
 */
export function navigateToNextStep(): boolean {
  const state = get(scrollyStore);
  const totalCategories = state.genreGroupQueue.length;
  
  // Intro oder Kategorisierung → Direkt zum ersten Genre
  if (state.phase === 'intro' || state.phase === 'categorization') {
    const firstCategory = state.genreGroupQueue[0];
    if (firstCategory) {
      scrollyStore.update(s => ({
        ...s,
        phase: 'zoom',
        focusedCategoryIndex: 0,
        focusedCategory: firstCategory,
        isScrollingDown: true,
        introAnimationComplete: true
      }));
    }
    return true;
  }
  
  // Zoom: Nächste Kategorie oder zu Overview
  if (state.phase === 'zoom') {
    const nextIndex = state.focusedCategoryIndex + 1;
    
    if (nextIndex < totalCategories) {
      // Nächste Kategorie
      const nextCategory = state.genreGroupQueue[nextIndex];
      scrollyStore.update(s => ({
        ...s,
        focusedCategoryIndex: nextIndex,
        focusedCategory: nextCategory,
        isScrollingDown: true
      }));
      return true;
    } else {
      // Alle Kategorien durch → Overview
      scrollyStore.update(s => ({
        ...s,
        phase: 'overview',
        isScrollingDown: true,
        isInOverview: true
      }));
      return true;
    }
  }
  
  return false;
}

/**
 * Navigiert zum vorherigen Step (Pfeiltaste hoch)
 * Overview → letztes Genre → ... → Genre 1 → Kategorisierung → Intro
 */
export function navigateToPreviousStep(): boolean {
  const state = get(scrollyStore);
  const totalCategories = state.genreGroupQueue.length;
  
  // Overview → Letztes Genre
  if (state.phase === 'overview') {
    const lastCategory = state.genreGroupQueue[totalCategories - 1];
    if (lastCategory) {
      scrollyStore.update(s => ({
        ...s,
        phase: 'zoom',
        focusedCategoryIndex: totalCategories - 1,
        focusedCategory: lastCategory,
        isScrollingDown: false,
        isInOverview: false,
        wasInOverviewMode: true
      }));
    }
    return true;
  }
  
  // Zoom: Vorherige Kategorie oder zurück zur Kategorisierung/Übersicht
  if (state.phase === 'zoom') {
    const prevIndex = state.focusedCategoryIndex - 1;
    
    if (prevIndex >= 0) {
      // Vorherige Kategorie
      const prevCategory = state.genreGroupQueue[prevIndex];
      scrollyStore.update(s => ({
        ...s,
        focusedCategoryIndex: prevIndex,
        focusedCategory: prevCategory,
        isScrollingDown: false
      }));
      return true;
    } else {
      // Beim ersten Genre: Zurück zur Kategorisierungsübersicht
      scrollyStore.update(s => ({
        ...s,
        phase: 'categorization',
        focusedCategoryIndex: -1,
        focusedCategory: null,
        isScrollingDown: false
      }));
      return true;
    }
  }
  
  // Kategorisierung: Bleibt hier (kein weiteres Zurück zu intro)
  if (state.phase === 'categorization') {
    // Keine weitere Rückwärts-Navigation - wir bleiben in der Kategorisierung
    return false;
  }
  
  return false;
}

/**
 * Gibt den aktuellen Step-Index zurück (für Progress-Anzeige)
 * -1 = intro, 0 = categorization, 1-n = genres, n+1 = overview
 */
export function getCurrentStepIndex(): number {
  const state = get(scrollyStore);
  
  if (state.phase === 'intro') return -1;
  if (state.phase === 'categorization') return 0;
  if (state.phase === 'zoom') return state.focusedCategoryIndex + 1;
  if (state.phase === 'overview') return state.genreGroupQueue.length + 1;
  return -1;
}

/**
 * Gibt die Gesamtanzahl der Steps zurück
 * intro + categorization + genres + overview
 */
export function getTotalSteps(): number {
  const state = get(scrollyStore);
  return state.genreGroupQueue.length + 2; // +2 für categorization und overview
}

// Derived Stores
export const currentPhase = derived(scrollyStore, $s => $s.phase);
export const focusedCategory = derived(scrollyStore, $s => $s.focusedCategory);
export const scrollProgress = derived(scrollyStore, $s => $s.scrollProgress);

export const phaseDescription = derived(scrollyStore, $s => {
  const descriptions: Record<ScrollyPhase, string> = {
    intro: '🌀 Genres erscheinen...',
    categorization: '📊 Gruppierung nach Kategorie...',
    zoom: $s.focusedCategory ? `🔍 ${$s.focusedCategory}` : '🔍 Detailansicht...',
    overview: '👀 Übersicht aller Kategorien',
    summary: '✨ Ende'
  };
  return descriptions[$s.phase];
});
