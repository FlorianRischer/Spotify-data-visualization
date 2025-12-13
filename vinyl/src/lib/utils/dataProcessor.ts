/**
 * Data Processing Pipeline
 * 
 * Main entry point for processing Spotify data.
 */

import type { SpotifyTrackRaw, GenreData, ArtistGenreMapping } from '$lib/types';
import {
	enrichTracksWithGenres,
	aggregateByGenre,
	convertToGenreData,
	sortAndLimit
} from './genreAggregator';

/**
 * Process raw Spotify data into Genre visualization data
 * 
 * @param rawTracks - Raw Spotify streaming history
 * @param artistGenreMap - Artist to genres mapping from cache/API
 * @param options - Processing options
 * @returns Processed genre data for visualization
 */
export function processSpotifyData(
	rawTracks: SpotifyTrackRaw[],
	artistGenreMap: ArtistGenreMapping,
	options: {
		limit?: number;
		minPlayTime?: number; // Filter tracks with less than X ms
	} = {}
): GenreData[] {
	const { limit = 15, minPlayTime = 30000 } = options; // Default 30s minimum

	// Step 1: Filter valid tracks
	const validTracks = filterValidTracks(rawTracks, minPlayTime);
	console.log(`Filtered ${validTracks.length} valid tracks from ${rawTracks.length} total`);

	// Step 2: Enrich tracks with genre info
	const enrichedTracks = enrichTracksWithGenres(validTracks, artistGenreMap);

	// Step 3: Aggregate by genre
	const genreStats = aggregateByGenre(enrichedTracks);
	console.log(`Found ${genreStats.size} unique genres`);

	// Step 4: Calculate total listening time
	const totalMinutes = Array.from(genreStats.values()).reduce(
		(sum, stats) => sum + stats.totalMinutes,
		0
	);

	// Step 5: Convert to GenreData format
	const genreData = convertToGenreData(genreStats, totalMinutes);

	// Step 6: Sort and limit
	const result = sortAndLimit(genreData, limit);

	console.log(
		`Processed ${result.length} genres, total listening time: ${(totalMinutes / 60).toFixed(1)}h`
	);

	return result;
}

/**
 * Filter out invalid tracks
 */
function filterValidTracks(
	tracks: SpotifyTrackRaw[],
	minPlayTime: number
): SpotifyTrackRaw[] {
	return tracks.filter((track) => {
		// Must have minimum play time
		if (track.ms_played < minPlayTime) return false;

		// Must have artist name
		if (!track.master_metadata_album_artist_name) return false;

		// Must have track name
		if (!track.master_metadata_track_name) return false;

		return true;
	});
}

/**
 * Combine multiple datasets (from different JSON files)
 */
export function combineDatasets(datasets: SpotifyTrackRaw[][]): SpotifyTrackRaw[] {
	const combined = datasets.flat();

	// Sort by timestamp
	combined.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

	return combined;
}

/**
 * Deduplicate tracks (same track, artist, timestamp)
 */
export function deduplicateTracks(tracks: SpotifyTrackRaw[]): SpotifyTrackRaw[] {
	const seen = new Set<string>();
	return tracks.filter((track) => {
		const key = `${track.ts}|${track.master_metadata_track_name}|${track.master_metadata_album_artist_name}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}
