/**
 * Genre Color Palette
 * Systematische Farben für Genre-Visualisierungen
 */

export const DEFAULT_COLOR = '#6C757D';

export const GENRE_COLORS: Record<string, string> = {
	// Rock & Alternative
	rock: '#E63946',
	'alternative rock': '#F77F00',
	'indie rock': '#FCBF49',
	'punk rock': '#D62828',

	// Pop & Dance
	pop: '#FF006E',
	'dance pop': '#FB5607',
	'synth pop': '#FF006E',
	'k-pop': '#F72585',

	// Electronic
	edm: '#3A86FF',
	techno: '#4361EE',
	house: '#4895EF',
	'drum and bass': '#4CC9F0',

	// Hip Hop & R&B
	'hip hop': '#7209B7',
	rap: '#560BAD',
	'r&b': '#B5179E',
	trap: '#480CA8',

	// Jazz & Blues
	jazz: '#2A9D8F',
	blues: '#264653',
	soul: '#287271',

	// Metal
	metal: '#212529',
	'death metal': '#343A40',
	'black metal': '#495057',

	// Default fallback
	default: '#6C757D'
};

/**
 * Get color for a genre (with fallback)
 */
export function getGenreColor(genre: string): string {
	const normalized = genre.toLowerCase();
	return GENRE_COLORS[normalized] ?? GENRE_COLORS.default;
}
