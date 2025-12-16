import { writable, derived, get } from 'svelte/store';
import type { GenreCategory } from '$lib/graph/genreMapping';

export type ScrollyPhase = 'intro' | 'categorization' | 'zoom' | 'summary';

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
  displayedCategory: 'Intro' as GenreCategory
};

export const scrollyStore = writable<ScrollyState>(initialState);

/**
 * Berechnet die aktuelle Phase basierend auf Scroll-Progress
 */
function calculatePhase(progress: number): ScrollyPhase {
  if (progress < 0.25) return 'intro';
  if (progress < 0.45) return 'categorization';
  if (progress < 0.95) return 'zoom';
  return 'summary';
}

/**
 * Berechnet den fokussierten Kategorie-Index für Zoom-Phase
 * Mit Hysterese um Flackern zu vermeiden
 */
function calculateFocusedCategoryIndex(progress: number, totalCategories: number): number {
  if (progress < 0.45 || totalCategories === 0) return -1;
  if (progress >= 0.95) return -1; // Summary phase
  
  // Map 0.45-0.95 to 0-(totalCategories-1)
  // Verwende Math.ceil statt Math.floor für bessere Übergänge
  const zoomProgress = (progress - 0.45) / 0.5;
  const rawIndex = zoomProgress * totalCategories;
  
  // Mit Hysterese: mehr Zeit pro Kategorie für stabiler Fokus
  return Math.min(Math.floor(rawIndex), totalCategories - 1);
}

/**
 * Aktualisiert den Scroll-Progress und triggert Phase-Updates
 */
export function updateScrollProgress(progress: number) {
  scrollyStore.update(state => {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const newPhase = calculatePhase(clampedProgress);
    const focusedIndex = calculateFocusedCategoryIndex(clampedProgress, state.genreGroupQueue.length);
    const focusedCategory = focusedIndex >= 0 ? state.genreGroupQueue[focusedIndex] : null;

    return {
      ...state,
      scrollProgress: clampedProgress,
      phase: newPhase,
      focusedCategoryIndex: focusedIndex,
      focusedCategory
    };
  });
}

/**
 * Setzt die Kategorie-Warteschlange sortiert nach Größe (absteigend)
 * Platziert sie auf einem Kreis beginnend mit 12 Uhr im Uhrzeigersinn
 */
export function setGenreGroupQueue(
  queue: GenreCategory[], 
  nodeCounts: Partial<Record<GenreCategory, number>>
) {
  // Sortiere Queue nach Anzahl der Genres (absteigend) - größte zuerst
  const sortedQueue = [...queue].sort((a, b) => {
    const countA = nodeCounts[a] || 0;
    const countB = nodeCounts[b] || 0;
    return countB - countA;
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
    categoryNodeCounts: nodeCounts,
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
    // Zoom-Phase: 0.45-0.95 (50% des gesamt Scrolls)
    // Teile die Zoom-Phase gleichmäßig auf alle Kategorien auf
    const totalCategories = state.genreGroupQueue.length;
    const zoomRangeStart = 0.45;
    const zoomRangeEnd = 0.95;
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

// Derived Stores
export const currentPhase = derived(scrollyStore, $s => $s.phase);
export const focusedCategory = derived(scrollyStore, $s => $s.focusedCategory);
export const scrollProgress = derived(scrollyStore, $s => $s.scrollProgress);

export const phaseDescription = derived(scrollyStore, $s => {
  const descriptions: Record<ScrollyPhase, string> = {
    intro: '🌀 Genres erscheinen...',
    categorization: '📊 Gruppierung nach Kategorie...',
    zoom: $s.focusedCategory ? `🔍 ${$s.focusedCategory}` : '🔍 Detailansicht...',
    summary: '✨ Übersicht'
  };
  return descriptions[$s.phase];
});
