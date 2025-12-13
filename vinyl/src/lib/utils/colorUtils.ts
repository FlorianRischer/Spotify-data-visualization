/**
 * Color Utilities
 * 
 * Functions for working with genre colors
 */

import { GENRE_COLORS, DEFAULT_COLOR } from '$lib/constants/colors';

/**
 * Get color for a genre by name
 * Falls back to default color if not found
 */
export function getGenreColor(genre: string): string {
	const normalized = genre.toLowerCase().trim();
	return GENRE_COLORS[normalized] ?? DEFAULT_COLOR;
}

/**
 * Get color with opacity
 */
export function getGenreColorWithAlpha(genre: string, alpha: number): string {
	const hex = getGenreColor(genre);
	const rgb = hexToRgb(hex);
	if (!rgb) return `rgba(150, 150, 150, ${alpha})`;
	return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * Convert hex color to RGB object
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16)
			}
		: null;
}

/**
 * Convert RGB to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
	return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Lighten a hex color
 */
export function lightenColor(hex: string, percent: number): string {
	const rgb = hexToRgb(hex);
	if (!rgb) return hex;

	const factor = percent / 100;
	const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * factor));
	const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * factor));
	const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * factor));

	return rgbToHex(r, g, b);
}

/**
 * Darken a hex color
 */
export function darkenColor(hex: string, percent: number): string {
	const rgb = hexToRgb(hex);
	if (!rgb) return hex;

	const factor = 1 - percent / 100;
	const r = Math.round(rgb.r * factor);
	const g = Math.round(rgb.g * factor);
	const b = Math.round(rgb.b * factor);

	return rgbToHex(r, g, b);
}

/**
 * Get contrasting text color (black or white) for a background
 */
export function getContrastColor(hex: string): string {
	const rgb = hexToRgb(hex);
	if (!rgb) return '#ffffff';

	// Calculate relative luminance
	const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

	return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Generate gradient stops for a genre
 */
export function getGenreGradient(genre: string, direction: string = 'to right'): string {
	const baseColor = getGenreColor(genre);
	const lightColor = lightenColor(baseColor, 20);
	const darkColor = darkenColor(baseColor, 20);

	return `linear-gradient(${direction}, ${darkColor}, ${baseColor}, ${lightColor})`;
}

/**
 * Interpolate between two colors
 */
export function interpolateColor(color1: string, color2: string, factor: number): string {
	const rgb1 = hexToRgb(color1);
	const rgb2 = hexToRgb(color2);

	if (!rgb1 || !rgb2) return color1;

	const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor);
	const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor);
	const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor);

	return rgbToHex(r, g, b);
}

/**
 * Create a color palette from a base color
 */
export function createPalette(baseColor: string): {
	lightest: string;
	light: string;
	base: string;
	dark: string;
	darkest: string;
} {
	return {
		lightest: lightenColor(baseColor, 40),
		light: lightenColor(baseColor, 20),
		base: baseColor,
		dark: darkenColor(baseColor, 20),
		darkest: darkenColor(baseColor, 40)
	};
}
