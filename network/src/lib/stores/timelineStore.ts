import { writable, derived, get } from 'svelte/store';
import type { GenreCategory } from '$lib/graph/genreMapping';
import type { GenreDiscoveryData, GenreTimelineData, GenreTopYear } from '$lib/wrangling/genreDiscovery';

// ============================================
// Timeline Layout Konfiguration (zentral für Graph und UI)
// ============================================
export const TIMELINE_CONFIG = {
  containerPadding: 65,      // Padding links/rechts vom Viewport
  monthStartPercent: 0.05,   // Jan startet bei 5%
  monthEndPercent: 0.95,     // Dec endet bei 95%
  monthRangePercent: 0.90,   // 90% nutzbare Breite für Monate
};

/**
 * Berechnet die relative X-Position (0-1) eines Monats innerhalb eines Jahr-Segments
 * @param month - Monat (1-12)
 * @returns Relative Position (0-1) innerhalb des nutzbaren Bereichs
 */
export function getMonthPositionPercent(month: number): number {
  // month 1 (Jan) -> 0, month 12 (Dec) -> 1
  const monthProgress = (month - 1) / 11;
  // 5% + monthProgress * 90% = 5% bis 95%
  return TIMELINE_CONFIG.monthStartPercent + monthProgress * TIMELINE_CONFIG.monthRangePercent;
}

/**
 * Berechnet die X-Position eines Monats in World-Koordinaten
 * @param month - Monat (1-12)
 * @param year - Jahr
 * @param startYear - Erstes Jahr in der Timeline
 * @param yearWidth - Breite eines Jahres in World-Koordinaten
 * @returns X-Position in World-Koordinaten
 */
export function getMonthWorldPosition(
  month: number, 
  year: number, 
  startYear: number, 
  yearWidth: number
): number {
  const yearOffset = year - startYear;
  const yearCenterX = yearOffset * yearWidth;
  
  // Die Timeline zeigt Monate von 5% bis 95% der Segment-Breite
  // Segment-Breite = yearWidth - 2 * containerPadding
  const segmentWidth = yearWidth - (TIMELINE_CONFIG.containerPadding * 2);
  
  // Monat-Position innerhalb des Segments (0-1 -> 5%-95%)
  const monthPercent = getMonthPositionPercent(month);
  
  // Berechne X relativ zum Jahr-Zentrum
  // Das Segment geht von -segmentWidth/2 bis +segmentWidth/2
  const xWithinSegment = (monthPercent - 0.5) * segmentWidth;
  
  return yearCenterX + xWithinSegment;
}

export interface YearlyGenreData {
  genre: string;
  category: GenreCategory;
  minutes: number;
  plays: number;
}

export interface MonthlyData {
  month: number; // 1-12
  totalMinutes: number;
  genres: YearlyGenreData[];
}

export interface YearData {
  year: number;
  totalMinutes: number;
  months: MonthlyData[];
  topGenres: YearlyGenreData[];
  categoryBreakdown: { category: GenreCategory; minutes: number; percentage: number }[];
}

// Genre-Discovery-Daten für ein Jahr
export interface YearDiscoveryData {
  year: number;
  genresDiscovered: GenreDiscoveryData[];
  genresByMonth: Map<number, GenreDiscoveryData[]>; // month (1-12) -> genres
  totalDiscovered: number;
  cumulativeTotal: number; // Alle Genres bis zu diesem Jahr
}

export interface TimelineState {
  isActive: boolean;
  years: YearData[];
  currentYearIndex: number;
  availableYears: number[];
  isAnimating: boolean;
  // Genre Discovery Data
  discoveryData: GenreTimelineData | null;
  yearDiscoveries: YearDiscoveryData[];
  // Genre Yearly Statistics (for tooltips)
  genreYearlyStats: Map<string, GenreTopYear> | null;
}

const initialState: TimelineState = {
  isActive: false,
  years: [],
  currentYearIndex: 0,
  availableYears: [],
  isAnimating: false,
  discoveryData: null,
  yearDiscoveries: [],
  genreYearlyStats: null
};

export const timelineStore = writable<TimelineState>(initialState);

/**
 * Aktiviert die Timeline-Ansicht
 */
export function activateTimeline() {
  timelineStore.update(state => ({
    ...state,
    isActive: true
  }));
}

/**
 * Deaktiviert die Timeline-Ansicht
 */
export function deactivateTimeline() {
  timelineStore.update(state => ({
    ...state,
    isActive: false
  }));
}

/**
 * Setzt die Genre-Discovery-Daten
 */
export function setGenreDiscoveryData(data: GenreTimelineData) {
  // Bereite YearDiscoveryData für jedes Jahr vor
  const yearDiscoveries: YearDiscoveryData[] = [];
  let cumulativeTotal = 0;
  
  for (let year = data.startYear; year <= data.endYear; year++) {
    const genresInYear = data.genres.filter(g => g.year === year);
    const genresByMonth = new Map<number, GenreDiscoveryData[]>();
    
    // Gruppiere nach Monat
    for (let month = 1; month <= 12; month++) {
      const genresInMonth = genresInYear.filter(g => g.month === month);
      if (genresInMonth.length > 0) {
        genresByMonth.set(month, genresInMonth);
      }
    }
    
    cumulativeTotal += genresInYear.length;
    
    yearDiscoveries.push({
      year,
      genresDiscovered: genresInYear,
      genresByMonth,
      totalDiscovered: genresInYear.length,
      cumulativeTotal
    });
  }
  
  // Aktualisiere auch availableYears basierend auf Discovery-Daten
  const availableYears = yearDiscoveries.map(y => y.year);
  
  timelineStore.update(state => ({
    ...state,
    discoveryData: data,
    yearDiscoveries,
    availableYears,
    currentYearIndex: 0
  }));
}

/**
 * Setzt die Genre Yearly Statistics (für Tooltip-Anzeige)
 */
export function setGenreYearlyStats(stats: Map<string, GenreTopYear>) {
  timelineStore.update(state => ({
    ...state,
    genreYearlyStats: stats
  }));
}

/**
 * Setzt die Timeline-Daten
 */
export function setTimelineData(years: YearData[]) {
  const sortedYears = [...years].sort((a, b) => a.year - b.year);
  const availableYears = sortedYears.map(y => y.year);
  
  timelineStore.update(state => ({
    ...state,
    years: sortedYears,
    availableYears,
    currentYearIndex: 0
  }));
}

/**
 * Navigiert zum nächsten Jahr
 */
export function navigateToNextYear(): boolean {
  const state = get(timelineStore);
  
  if (state.currentYearIndex < state.availableYears.length - 1 && !state.isAnimating) {
    timelineStore.update(s => ({
      ...s,
      currentYearIndex: s.currentYearIndex + 1,
      isAnimating: true
    }));
    
    // Animation Ende nach 600ms
    setTimeout(() => {
      timelineStore.update(s => ({ ...s, isAnimating: false }));
    }, 600);
    
    return true;
  }
  return false;
}

/**
 * Navigiert zum vorherigen Jahr
 */
export function navigateToPreviousYear(): boolean {
  const state = get(timelineStore);
  
  if (state.currentYearIndex > 0 && !state.isAnimating) {
    timelineStore.update(s => ({
      ...s,
      currentYearIndex: s.currentYearIndex - 1,
      isAnimating: true
    }));
    
    // Animation Ende nach 600ms
    setTimeout(() => {
      timelineStore.update(s => ({ ...s, isAnimating: false }));
    }, 600);
    
    return true;
  }
  return false;
}

/**
 * Navigiert direkt zu einem bestimmten Jahr-Index
 */
export function navigateToYear(yearIndex: number): boolean {
  const state = get(timelineStore);
  
  if (yearIndex >= 0 && yearIndex < state.availableYears.length && !state.isAnimating && yearIndex !== state.currentYearIndex) {
    timelineStore.update(s => ({
      ...s,
      currentYearIndex: yearIndex,
      isAnimating: true
    }));
    
    // Animation Ende nach 600ms
    setTimeout(() => {
      timelineStore.update(s => ({ ...s, isAnimating: false }));
    }, 600);
    
    return true;
  }
  return false;
}

/**
 * Springt direkt zu einem bestimmten Jahr
 */
export function jumpToYear(year: number) {
  const state = get(timelineStore);
  const index = state.availableYears.indexOf(year);
  
  if (index !== -1) {
    timelineStore.update(s => ({
      ...s,
      currentYearIndex: index,
      isAnimating: true
    }));
    
    setTimeout(() => {
      timelineStore.update(s => ({ ...s, isAnimating: false }));
    }, 600);
  }
}

/**
 * Gibt das aktuell ausgewählte Jahr zurück
 */
export function getCurrentYear(): YearData | null {
  const state = get(timelineStore);
  return state.years[state.currentYearIndex] || null;
}

// Breite eines Jahres in Canvas-Koordinaten (Pixel)
// Jedes Jahr ist ein "Screen" breit - beim Swipen scrollt man zum nächsten Jahr
export const YEAR_WIDTH = 1680; // Entspricht der Canvas-Baseline-Breite

/**
 * Berechnet die Kamera-X-Position für ein bestimmtes Jahr
 * Jahr 0 (erstes Jahr) = cameraX 0, Jahr 1 = cameraX YEAR_WIDTH, etc.
 */
export function getCameraXForYearIndex(yearIndex: number): number {
  return yearIndex * YEAR_WIDTH;
}

/**
 * Berechnet den Jahr-Index aus einer Kamera-X-Position
 */
export function getYearIndexFromCameraX(cameraX: number): number {
  return Math.round(cameraX / YEAR_WIDTH);
}

// Derived Stores
export const currentYear = derived(timelineStore, $s => $s.years[$s.currentYearIndex] || null);
export const currentYearNumber = derived(timelineStore, $s => $s.availableYears[$s.currentYearIndex] || null);
export const isTimelineActive = derived(timelineStore, $s => $s.isActive);
export const timelineYears = derived(timelineStore, $s => $s.availableYears);

// Kamera-X-Position basierend auf aktuellem Jahr
export const timelineCameraX = derived(timelineStore, $s => getCameraXForYearIndex($s.currentYearIndex));

// Genre Discovery Derived Stores
export const currentYearDiscovery = derived(timelineStore, $s => 
  $s.yearDiscoveries[$s.currentYearIndex] || null
);
export const genreDiscoveryData = derived(timelineStore, $s => $s.discoveryData);
export const genreYearlyStatsData = derived(timelineStore, $s => $s.genreYearlyStats);
export const allDiscoveredGenres = derived(timelineStore, $s => 
  $s.discoveryData?.genres || []
);

/**
 * Gibt die Genres zurück, die bis zum aktuellen Jahr entdeckt wurden
 */
export const genresDiscoveredByCurrentYear = derived(timelineStore, $s => {
  if (!$s.discoveryData) return [];
  const currentYear = $s.availableYears[$s.currentYearIndex];
  if (!currentYear) return [];
  return $s.discoveryData.genres.filter(g => g.year <= currentYear);
});

/**
 * Gibt die Position eines Genres auf der Timeline zurück (0-1)
 * basierend auf dem Monat im aktuellen Jahr
 */
export function getGenrePositionInYear(genreId: string): number {
  const state = get(timelineStore);
  if (!state.discoveryData) return 0.5;
  
  const currentYear = state.availableYears[state.currentYearIndex];
  const genre = state.discoveryData.genres.find(g => g.genreId === genreId);
  
  if (!genre) return 0.5;
  if (genre.year < currentYear) return 0; // Links (früher entdeckt)
  if (genre.year > currentYear) return 1; // Rechts (später entdeckt)
  
  // Im aktuellen Jahr: Position basierend auf Monat
  return (genre.month - 0.5) / 12;
}

// Re-export types
export type { GenreDiscoveryData, GenreTimelineData } from '$lib/wrangling/genreDiscovery';
