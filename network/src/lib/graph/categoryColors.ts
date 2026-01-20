/**
 * Kategoriebasierte Farbgebung für Genres
 * Jede Obergruppe hat eine eigene Farbpalette
 * UNIFIED SATURATION: Verschiedene Farbtöne mit gleicher Sättigung (~45%) und Helligkeit (~55%)
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
 * Verschiedene Hues (Farbtöne) mit einheitlicher Sättigung und Helligkeit
 * HSL: Hue variiert, Saturation ~45%, Lightness ~55%
 */
export const CATEGORY_COLORS: Record<GenreCategory, CategoryColorScheme> = {
  "Hip Hop": {
    category: "Hip Hop",
    primary: "#6B7AC9", // Blau-Indigo (Hue: 230°)
    light: "#8E9AD9",
    dark: "#4E5CA6"
  },
  "Electronic": {
    category: "Electronic",
    primary: "#6BADC9", // Cyan (Hue: 195°)
    light: "#8EC3D9",
    dark: "#4E8AA6"
  },
  "Rock": {
    category: "Rock",
    primary: "#C96B6B", // Rot (Hue: 0°)
    light: "#D98E8E",
    dark: "#A64E4E"
  },
  "Pop": {
    category: "Pop",
    primary: "#C96BB0", // Magenta-Pink (Hue: 315°)
    light: "#D98EC7",
    dark: "#A64E8D"
  },
  "Jazz": {
    category: "Jazz",
    primary: "#8B6BC9", // Violett (Hue: 260°)
    light: "#A88ED9",
    dark: "#6E4EA6"
  },
  "Soul": {
    category: "Soul",
    primary: "#C9A16B", // Gold/Amber (Hue: 40°)
    light: "#D9BA8E",
    dark: "#A6814E"
  },
  "Reggae": {
    category: "Reggae",
    primary: "#7DC96B", // Grün (Hue: 110°)
    light: "#9DD98E",
    dark: "#5FA64E"
  },
  "Indie": {
    category: "Indie",
    primary: "#6BC9B8", // Türkis (Hue: 170°)
    light: "#8ED9CD",
    dark: "#4EA695"
  },
  "Classical": {
    category: "Classical",
    primary: "#C9C16B", // Gelb-Gold (Hue: 55°)
    light: "#D9D38E",
    dark: "#A69E4E"
  },
  "Country": {
    category: "Country",
    primary: "#C97E6B", // Terracotta (Hue: 15°)
    light: "#D99E8E",
    dark: "#A65F4E"
  },
  "Latin": {
    category: "Latin",
    primary: "#C9886B", // Orange (Hue: 25°)
    light: "#D9A68E",
    dark: "#A66B4E"
  },
  "Metal": {
    category: "Metal",
    primary: "#C98B6B", // Orange-Braun (Hue: 20°)
    light: "#D9A88E",
    dark: "#A66E4E"
  },
  "Experimental": {
    category: "Experimental",
    primary: "#6B6BC9", // Blau-Violett (Hue: 240°)
    light: "#8E8ED9",
    dark: "#4E4EA6"
  },
  "Funk": {
    category: "Funk",
    primary: "#C96B8B", // Pink-Rot (Hue: 340°)
    light: "#D98EA8",
    dark: "#A64E6E"
  },
  "Spiritual": {
    category: "Spiritual",
    primary: "#A86BC9", // Lila (Hue: 280°)
    light: "#C08ED9",
    dark: "#864EA6"
  },
  "Asian Pop": {
    category: "Asian Pop",
    primary: "#C96B9C", // Rosa-Magenta (Hue: 330°)
    light: "#D98EB8",
    dark: "#A64E7C"
  },
  "Specialty": {
    category: "Specialty",
    primary: "#8B8B8B", // Neutral-Grau (achromatic)
    light: "#A8A8A8",
    dark: "#6E6E6E"
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
