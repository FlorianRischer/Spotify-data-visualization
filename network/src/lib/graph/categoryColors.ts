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
    primary: "#FF6B35", // Warmes Orange/Rot
    light: "#FFB347",
    dark: "#CC4422"
  },
  "Electronic & Dance": {
    category: "Electronic & Dance",
    primary: "#00D9FF", // Cyber-Cyan
    light: "#66E6FF",
    dark: "#00A8CC"
  },
  "Rock & Punk": {
    category: "Rock & Punk",
    primary: "#8B0000", // Dunkelrot
    light: "#DC143C",
    dark: "#660000"
  },
  "Pop": {
    category: "Pop",
    primary: "#FF1493", // Deep Pink
    light: "#FF69B4",
    dark: "#C20F6F"
  },
  "Jazz & Blues": {
    category: "Jazz & Blues",
    primary: "#6B4423", // Warmes Braun
    light: "#8B6F47",
    dark: "#4A2C17"
  },
  "Soul & R&B": {
    category: "Soul & R&B",
    primary: "#9932CC", // Dunkle Orchidee
    light: "#DA70D6",
    dark: "#6A0DAD"
  },
  "Reggae & Caribbean": {
    category: "Reggae & Caribbean",
    primary: "#FFD700", // Gold
    light: "#FFED4E",
    dark: "#DAA520"
  },
  "Folk & Indie": {
    category: "Folk & Indie",
    primary: "#228B22", // Forest Green
    light: "#32CD32",
    dark: "#1a6b1a"
  },
  "Classical & Orchestral": {
    category: "Classical & Orchestral",
    primary: "#D4AF37", // Gold/Brass
    light: "#FFD700",
    dark: "#B8860B"
  },
  "Country & Americana": {
    category: "Country & Americana",
    primary: "#8B4513", // Saddle Brown
    light: "#CD853F",
    dark: "#654321"
  },
  "Latin & World": {
    category: "Latin & World",
    primary: "#FF8C00", // Dark Orange
    light: "#FFA500",
    dark: "#CC6600"
  },
  "Metal & Hardcore": {
    category: "Metal & Hardcore",
    primary: "#2F4F4F", // Dark Slate Gray
    light: "#556B6D",
    dark: "#1a2f2f"
  },
  "Metal": {
    category: "Metal",
    primary: "#2F4F4F", // Dark Slate Gray
    light: "#556B6D",
    dark: "#1a2f2f"
  },
  "Experimental & Ambient": {
    category: "Experimental & Ambient",
    primary: "#4B0082", // Indigo
    light: "#6A5ACD",
    dark: "#2D0052"
  },
  "Funk & Groove": {
    category: "Funk & Groove",
    primary: "#EE82EE", // Violet
    light: "#DDA0DD",
    dark: "#BB66BB"
  },
  "Gospel & Spiritual": {
    category: "Gospel & Spiritual",
    primary: "#FFB6C1", // Light Pink
    light: "#FFC0CB",
    dark: "#FF69B4"
  },
  "Asian Pop": {
    category: "Asian Pop",
    primary: "#DC143C", // Crimson (Cherry Blossom inspired)
    light: "#FF6B9D",
    dark: "#A0123E"
  },
  "Specialty & Other": {
    category: "Specialty & Other",
    primary: "#808080", // Gray
    light: "#A9A9A9",
    dark: "#696969"
  }
};

/**
 * Gibt die Farbe einer Kategorie zurück
 */
export function getCategoryColor(category: GenreCategory): string {
  return CATEGORY_COLORS[category]?.primary || CATEGORY_COLORS["Specialty & Other"].primary;
}

/**
 * Gibt die helle Variante zurück
 */
export function getCategoryColorLight(category: GenreCategory): string {
  return CATEGORY_COLORS[category]?.light || CATEGORY_COLORS["Specialty & Other"].light;
}

/**
 * Gibt die dunkle Variante zurück
 */
export function getCategoryColorDark(category: GenreCategory): string {
  return CATEGORY_COLORS[category]?.dark || CATEGORY_COLORS["Specialty & Other"].dark;
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
  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS["Specialty & Other"];
  return {
    background: hexToRgba(colors.primary, 0.1),
    border: colors.primary,
    text: colors.dark,
    hover: colors.light
  };
}
