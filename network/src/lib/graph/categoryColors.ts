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
    primary: "#FF7744", // Warmes Pastell-Orange
    light: "#FF9966",
    dark: "#CC5533"
  },
  "Electronic": {
    category: "Electronic",
    primary: "#44CCFF", // Pastell-Cyan
    light: "#77DDFF",
    dark: "#22BBFF"
  },
  "Rock & Punk": {
    category: "Rock & Punk",
    primary: "#FF4466", // Pastell-Rot/Magenta
    light: "#FF7799",
    dark: "#DD1144"
  },
  "Pop": {
    category: "Pop",
    primary: "#FF5599", // Pastell-Pink
    light: "#FF88CC",
    dark: "#DD2277"
  },
  "Jazz & Blues": {
    category: "Jazz & Blues",
    primary: "#BB7744", // Pastell-Braun
    light: "#CC9966",
    dark: "#995533"
  },
  "Soul & R&B": {
    category: "Soul & R&B",
    primary: "#AA77CC", // Pastell-Lila
    light: "#CC99EE",
    dark: "#8855BB"
  },
  "Reggae": {
    category: "Reggae",
    primary: "#FFCC44", // Pastell-Gold
    light: "#FFDD77",
    dark: "#FFBB11"
  },
  "Folk & Indie": {
    category: "Folk & Indie",
    primary: "#55BB88", // Pastell-Grün
    light: "#77CC99",
    dark: "#22AA66"
  },
  "Classical": {
    category: "Classical",
    primary: "#CCAA66", // Pastell-Bronze
    light: "#DDBB88",
    dark: "#BB8833"
  },
  "Country": {
    category: "Country",
    primary: "#BB8855", // Pastell-Tan
    light: "#CC9966",
    dark: "#AA6633"
  },
  "Latin & World": {
    category: "Latin & World",
    primary: "#FF9944", // Pastell-Orange
    light: "#FFBB77",
    dark: "#FF7722"
  },
  "Metal": {
    category: "Metal",
    primary: "#667788", // Pastell-Grau-Blau
    light: "#8899AA",
    dark: "#445566"
  },
  "Experimental": {
    category: "Experimental",
    primary: "#8866CC", // Pastell-Indigo
    light: "#AA99DD",
    dark: "#6644BB"
  },
  "Funk & Groove": {
    category: "Funk & Groove",
    primary: "#FF77EE", // Pastell-Magenta
    light: "#FF99FF",
    dark: "#DD44CC"
  },
  "Spiritual": {
    category: "Spiritual",
    primary: "#FF99CC", // Pastell-Rosa
    light: "#FFBBDD",
    dark: "#FF6699"
  },
  "Asian Pop": {
    category: "Asian Pop",
    primary: "#FF5588", // Pastell-Rot-Pink
    light: "#FF7799",
    dark: "#DD2255"
  },
  "Specialty": {
    category: "Specialty",
    primary: "#999999", // Pastell-Grau
    light: "#BBBBBB",
    dark: "#777777"
  }
};

/**
 * Gibt die Farbe einer Kategorie zurück
 */
export function getCategoryColor(category: GenreCategory | string): string {
  const colorScheme = CATEGORY_COLORS[category as GenreCategory];
  return colorScheme?.primary || CATEGORY_COLORS["Specialty"]?.primary || "#999999";
}

/**
 * Gibt die helle Variante zurück
 */
export function getCategoryColorLight(category: GenreCategory | string): string {
  const colorScheme = CATEGORY_COLORS[category as GenreCategory];
  return colorScheme?.light || CATEGORY_COLORS["Specialty"]?.light || "#BBBBBB";
}

/**
 * Gibt die dunkle Variante zurück
 */
export function getCategoryColorDark(category: GenreCategory | string): string {
  const colorScheme = CATEGORY_COLORS[category as GenreCategory];
  return colorScheme?.dark || CATEGORY_COLORS["Specialty"]?.dark || "#777777";
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
