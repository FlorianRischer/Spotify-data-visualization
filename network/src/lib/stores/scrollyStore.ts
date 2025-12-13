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
  categorizationComplete: false
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
 */
function calculateFocusedCategoryIndex(progress: number, totalCategories: number): number {
  if (progress < 0.45 || totalCategories === 0) return -1;
  if (progress >= 0.95) return -1; // Summary phase
  
  // Map 0.45-0.95 to 0-(totalCategories-1)
  const zoomProgress = (progress - 0.45) / 0.5;
  return Math.min(Math.floor(zoomProgress * totalCategories), totalCategories - 1);
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
 * Setzt die Kategorie-Warteschlange (sortiert nach Größe)
 */
export function setGenreGroupQueue(
  queue: GenreCategory[], 
  nodeCounts: Partial<Record<GenreCategory, number>>
) {
  // Berechne Positionen auf einem Kreis
  const categoryPositions: Partial<Record<GenreCategory, { x: number; y: number }>> = {};
  const radius = 400;
  const angleStep = (2 * Math.PI) / queue.length;

  queue.forEach((category, index) => {
    const angle = index * angleStep - Math.PI / 2; // Start at top
    categoryPositions[category] = {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  });

  scrollyStore.update(state => ({
    ...state,
    genreGroupQueue: queue,
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
