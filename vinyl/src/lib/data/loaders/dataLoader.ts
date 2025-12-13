/**
 * Data Loader
 * 
 * Handles loading Spotify JSON files from various sources
 */

import type { SpotifyTrackRaw } from '$lib/types';

/**
 * Load a single Spotify JSON file
 */
export async function loadSpotifyFile(filePath: string): Promise<SpotifyTrackRaw[]> {
	try {
		const response = await fetch(filePath);
		if (!response.ok) {
			throw new Error(`Failed to load ${filePath}: ${response.statusText}`);
		}
		const data = await response.json();
		return Array.isArray(data) ? data : [];
	} catch (error) {
		console.error(`Error loading ${filePath}:`, error);
		return [];
	}
}

/**
 * Load multiple Spotify JSON files
 */
export async function loadSpotifyFiles(filePaths: string[]): Promise<SpotifyTrackRaw[][]> {
	const promises = filePaths.map((path) => loadSpotifyFile(path));
	return Promise.all(promises);
}

/**
 * Auto-discover and load all Spotify files from a directory
 * This is a helper for development - in production, files should be specified explicitly
 */
export async function loadAllSpotifyData(): Promise<SpotifyTrackRaw[]> {
	// In SvelteKit, we'll need to either:
	// 1. Import files explicitly at build time
	// 2. Use a server endpoint to list files
	// 3. Hardcode the file list

	// For now, we'll use a hardcoded list based on the actual files
	const fileNames = [
		'Streaming_History_Audio_2018-2020_0.json',
		'Streaming_History_Audio_2020-2021_1.json',
		'Streaming_History_Audio_2021_2.json',
		'Streaming_History_Audio_2021_3.json',
		'Streaming_History_Audio_2021-2022_4.json',
		'Streaming_History_Audio_2022_5.json',
		'Streaming_History_Audio_2022-2023_6.json',
		'Streaming_History_Audio_2023_7.json',
		'Streaming_History_Audio_2023-2024_8.json',
		'Streaming_History_Audio_2024_9.json',
		'Streaming_History_Audio_2024-2025_10.json',
		'Streaming_History_Audio_2025_11.json'
	];

	// Try to load from the spotify-data directory
	const basePath = '/spotify-data';
	const filePaths = fileNames.map((name) => `${basePath}/${name}`);

	console.log('Loading Spotify data files...');
	const datasets = await loadSpotifyFiles(filePaths);

	// Flatten all datasets
	const allTracks = datasets.flat();
	console.log(`Loaded ${allTracks.length} total tracks from ${datasets.length} files`);

	return allTracks;
}

/**
 * Validate that data matches expected schema
 */
export function validateSpotifyTrack(data: unknown): data is SpotifyTrackRaw {
	if (typeof data !== 'object' || data === null) return false;

	const track = data as Record<string, unknown>;

	return (
		typeof track.ts === 'string' &&
		typeof track.ms_played === 'number' &&
		(track.master_metadata_track_name === null ||
			typeof track.master_metadata_track_name === 'string') &&
		(track.master_metadata_album_artist_name === null ||
			typeof track.master_metadata_album_artist_name === 'string')
	);
}

/**
 * Validate and filter array of tracks
 */
export function validateSpotifyData(data: unknown[]): SpotifyTrackRaw[] {
	return data.filter(validateSpotifyTrack);
}
