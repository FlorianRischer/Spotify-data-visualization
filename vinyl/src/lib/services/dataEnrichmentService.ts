/**
 * Data Enrichment Service
 * 
 * Combines cache and API to enrich Spotify data with metadata
 */

import { loadArtistGenreCache, saveArtistGenreCache } from './cacheService';
import { fetchArtistGenres, searchArtist } from './spotifyApi';
import type { ArtistGenreMapping, SpotifyTrackRaw } from '$lib/types';

/**
 * Extract unique artist names from tracks
 */
export function extractUniqueArtists(tracks: SpotifyTrackRaw[]): string[] {
	const uniqueArtists = new Set<string>();

	tracks.forEach((track) => {
		const artistName = track.master_metadata_album_artist_name;
		if (artistName) {
			uniqueArtists.add(artistName);
		}
	});

	return Array.from(uniqueArtists);
}

/**
 * Get artist genres with cache-first strategy
 * 
 * @param artistNames - List of artist names from tracks
 * @param accessToken - Optional Spotify API token for missing data
 * @returns Mapping of artist name to genres
 */
export async function getArtistGenres(
	artistNames: string[],
	accessToken?: string
): Promise<ArtistGenreMapping> {
	// 1. Load existing cache (by artist name)
	const cache = await loadArtistGenreCache();

	// 2. Find missing artist names
	const missingNames = artistNames.filter((name) => !cache[name]);

	// 3. Fetch missing from API if token provided
	if (missingNames.length > 0 && accessToken) {
		console.log(`Fetching ${missingNames.length} missing artist genres from API`);

		// We need to convert artist names to IDs first
		const nameToIdMap = new Map<string, string>();

		// Search for artist IDs (with rate limiting)
		for (let i = 0; i < missingNames.length; i++) {
			const artistName = missingNames[i];
			const artistId = await searchArtist(artistName, accessToken);

			if (artistId) {
				nameToIdMap.set(artistName, artistId);
			}

			// Progress logging
			if ((i + 1) % 10 === 0) {
				console.log(`Searched ${i + 1}/${missingNames.length} artists`);
			}
		}

		// Fetch genres for found IDs
		const artistIds = Array.from(nameToIdMap.values());
		if (artistIds.length > 0) {
			const genreData = await fetchArtistGenres(artistIds, accessToken);

			// Map back to artist names
			nameToIdMap.forEach((id, name) => {
				const genres = genreData.get(id);
				if (genres && genres.length > 0) {
					cache[name] = genres;
				}
			});

			// Save updated cache
			await saveArtistGenreCache(cache);
			console.log(`Updated cache with ${Object.keys(cache).length} artists`);
		}
	} else if (missingNames.length > 0) {
		console.warn(
			`${missingNames.length} artist genres missing from cache, no API token provided`
		);
	}

	// 5. Return combined result
	return cache;
}

/**
 * Get enrichment statistics
 */
export function getEnrichmentStats(
	artistNames: string[],
	mapping: ArtistGenreMapping
): {
	total: number;
	withGenres: number;
	withoutGenres: number;
	coverage: number;
} {
	const total = artistNames.length;
	const withGenres = artistNames.filter((name) => mapping[name]?.length > 0).length;
	const withoutGenres = total - withGenres;
	const coverage = total > 0 ? (withGenres / total) * 100 : 0;

	return {
		total,
		withGenres,
		withoutGenres,
		coverage
	};
}
