/**
 * Export Utilities
 * 
 * Helper functions to export processed data
 */

import type { GenreData } from '$lib/types';

/**
 * Export genre data as JSON
 */
export function exportAsJSON(data: GenreData[], filename: string = 'genres.json'): void {
	const json = JSON.stringify(data, null, 2);
	downloadFile(json, filename, 'application/json');
}

/**
 * Export genre data as CSV
 */
export function exportAsCSV(data: GenreData[], filename: string = 'genres.csv'): void {
	const headers = [
		'Genre',
		'Track Count',
		'Total Hours',
		'Percentage',
		'Avg Minutes Per Track',
		'Top Artist',
		'Top Track'
	];

	const rows = data.map((genre) => [
		genre.name,
		genre.trackCount.toString(),
		genre.totalHours.toFixed(2),
		genre.percentage.toFixed(2),
		genre.avgMinutesPerTrack.toFixed(2),
		genre.topArtists[0]?.name || '',
		`${genre.topTracks[0]?.name || ''} - ${genre.topTracks[0]?.artist || ''}`
	]);

	const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
	downloadFile(csv, filename, 'text/csv');
}

/**
 * Download file to browser
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Copy data to clipboard
 */
export async function copyToClipboard(data: GenreData[]): Promise<boolean> {
	try {
		const json = JSON.stringify(data, null, 2);
		await navigator.clipboard.writeText(json);
		return true;
	} catch (error) {
		console.error('Failed to copy to clipboard:', error);
		return false;
	}
}
