/**
 * Kategoriebasierte Farbgebung für Genres
 * Jede Obergruppe hat eine eigene Farbpalette
 */

import type { GenreCategory } from "./genreMapping";

export interface CategoryColorScheme {
  category: GenreCategory;
  primary: string; // Hauptfarbe für die Kategorie
  light: string; // Hellere Variante
  dark: string; // Dunklere Variante
}

/**
 * Farben für jede Genre-Kategorie
 * Gewählt für gute visuelle Unterscheidung und Ästhetik
 */
export const CATEGORY_COLORS: Record<GenreCategory, CategoryColorScheme> = {
  "Hip Hop & Rap": {
    category: "Hip Hop & Rap",
    primary: "#FF7744",
    light: "#FF7744",
    dark: "#FF7744"
  },
  "Electronic": {
    category: "Electronic",
    primary: "#44CCFF",
    light: "#44CCFF",
    dark: "#44CCFF"
  },
  "Rock & Punk": {
    category: "Rock & Punk",
    primary: "#FF4466",
    light: "#FF4466",
    dark: "#FF4466"
  },
  "Pop": {
    category: "Pop",
    primary: "#FF5599",
    light: "#FF5599",
    dark: "#FF5599"
  },
  "Jazz & Blues": {
    category: "Jazz & Blues",
    primary: "#BB7744",
    light: "#BB7744",
    dark: "#BB7744"
  },
  "Soul & R&B": {
    category: "Soul & R&B",
    primary: "#AA77CC",
    light: "#AA77CC",
    dark: "#AA77CC"
  },
  "Reggae": {
    category: "Reggae",
    primary: "#FFCC44",
    light: "#FFCC44",
    dark: "#FFCC44"
  },
  "Folk & Indie": {
    category: "Folk & Indie",
    primary: "#55BB88",
    light: "#55BB88",
    dark: "#55BB88"
  },
  "Classical": {
    category: "Classical",
    primary: "#CCAA66",
    light: "#CCAA66",
    dark: "#CCAA66"
  },
  "Country": {
    category: "Country",
    primary: "#BB8855",
    light: "#BB8855",
    dark: "#BB8855"
  },
  "Latin & World": {
    category: "Latin & World",
    primary: "#FF9944",
    light: "#FF9944",
    dark: "#FF9944"
  },
  "Metal": {
    category: "Metal",
    primary: "#667788",
    light: "#667788",
    dark: "#667788"
  },
  "Experimental": {
    category: "Experimental",
    primary: "#8866CC",
    light: "#8866CC",
    dark: "#8866CC"
  },
  "Funk & Groove": {
    category: "Funk & Groove",
    primary: "#FF77EE",
    light: "#FF77EE",
    dark: "#FF77EE"
  },
  "Spiritual": {
    category: "Spiritual",
    primary: "#FF99CC",
    light: "#FF99CC",
    dark: "#FF99CC"
  },
  "Asian Pop": {
    category: "Asian Pop",
    primary: "#FF5588",
    light: "#FF5588",
    dark: "#FF5588"
  },
  "Specialty": {
    category: "Specialty",
    primary: "#999999",
    light: "#999999",
    dark: "#999999"
  }
};

/**
 * Gibt die Farbe einer Kategorie zurück
 */
export function getCategoryColor(category: GenreCategory): string {
  return CATEGORY_COLORS[category]?.primary || CATEGORY_COLORS["Specialty"].primary;
}

/**
 * Gibt die helle Variante zurück
 */
export function getCategoryColorLight(category: GenreCategory): string {
  return CATEGORY_COLORS[category]?.light || CATEGORY_COLORS["Specialty"].light;
}

/**
 * Gibt die dunkle Variante zurück
 */
export function getCategoryColorDark(category: GenreCategory): string {
  return CATEGORY_COLORS[category]?.dark || CATEGORY_COLORS["Specialty"].dark;
}

/**
 * Konvertiert Hex zu RGBA mit Opazität
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Erstellt ein Farbschema für Hintergrund und Text basierend auf Kategorie
 */
export function getCategoryColorScheme(category: GenreCategory) {
  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS["Specialty"];
  return {
    background: hexToRgba(colors.primary, 0.1),
    border: colors.primary,
    text: colors.dark,
    hover: colors.light
  };
}
