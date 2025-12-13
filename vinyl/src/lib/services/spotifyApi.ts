/**
 * Spotify Web API Service
 * 
 * Handles API calls to Spotify for metadata (genres, audio features, etc.)
 */

import type { AudioFeatures } from '$lib/types';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const BATCH_SIZE = 50; // Spotify API limit
const RATE_LIMIT_DELAY = 100; // ms between batches

interface SpotifyArtist {
	id: string;
	name: string;
	genres: string[];
	popularity: number;
	images: Array<{ url: string; height: number; width: number }>;
}

/**
 * Fetch artist genres from Spotify API
 * Batches requests (max 50 IDs per request)
 */
export async function fetchArtistGenres(
	artistIds: string[],
	accessToken: string
): Promise<Map<string, string[]>> {
	const results = new Map<string, string[]>();
	const batches = chunk(artistIds, BATCH_SIZE);

	console.log(`Fetching ${artistIds.length} artists in ${batches.length} batches`);

	for (let i = 0; i < batches.length; i++) {
		const batch = batches[i];

		try {
			const response = await fetch(
				`${SPOTIFY_API_BASE}/artists?ids=${batch.join(',')}`,
				{
					headers: {
						Authorization: `Bearer ${accessToken}`
					}
				}
			);

			if (!response.ok) {
				throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
			}

			const data = await response.json();

			if (data.artists) {
				data.artists.forEach((artist: SpotifyArtist | null) => {
					if (artist) {
						results.set(artist.id, artist.genres);
					}
				});
			}

			// Rate limiting
			if (i < batches.length - 1) {
				await delay(RATE_LIMIT_DELAY);
			}
		} catch (error) {
			console.error(`Failed to fetch batch ${i + 1}/${batches.length}:`, error);
		}
	}

	console.log(`Fetched genres for ${results.size} artists`);
	return results;
}

/**
 * Fetch audio features for tracks
 * Batches requests (max 100 IDs per request for audio features)
 */
export async function fetchAudioFeatures(
	trackIds: string[],
	accessToken: string
): Promise<Map<string, AudioFeatures>> {
	const results = new Map<string, AudioFeatures>();
	const batches = chunk(trackIds, 100); // Audio features endpoint allows 100

	console.log(`Fetching audio features for ${trackIds.length} tracks in ${batches.length} batches`);

	for (let i = 0; i < batches.length; i++) {
		const batch = batches[i];

		try {
			const response = await fetch(
				`${SPOTIFY_API_BASE}/audio-features?ids=${batch.join(',')}`,
				{
					headers: {
						Authorization: `Bearer ${accessToken}`
					}
				}
			);

			if (!response.ok) {
				throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
			}

			const data = await response.json();

			if (data.audio_features) {
				data.audio_features.forEach((features: AudioFeatures | null) => {
					if (features) {
						results.set(features.id, features);
					}
				});
			}

			// Rate limiting
			if (i < batches.length - 1) {
				await delay(RATE_LIMIT_DELAY);
			}
		} catch (error) {
			console.error(`Failed to fetch audio features batch ${i + 1}/${batches.length}:`, error);
		}
	}

	console.log(`Fetched audio features for ${results.size} tracks`);
	return results;
}

/**
 * Search for artist by name and get ID
 */
export async function searchArtist(
	artistName: string,
	accessToken: string
): Promise<string | null> {
	try {
		const query = encodeURIComponent(artistName);
		const response = await fetch(
			`${SPOTIFY_API_BASE}/search?q=${query}&type=artist&limit=1`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`
				}
			}
		);

		if (!response.ok) return null;

		const data = await response.json();
		if (data.artists?.items?.length > 0) {
			return data.artists.items[0].id;
		}

		return null;
	} catch (error) {
		console.error(`Failed to search for artist: ${artistName}`, error);
		return null;
	}
}

/**
 * Helper: Split array into chunks
 */
function chunk<T>(array: T[], size: number): T[][] {
	const chunks: T[][] = [];
	for (let i = 0; i < array.length; i += size) {
		chunks.push(array.slice(i, i + size));
	}
	return chunks;
}

/**
 * Helper: Delay for rate limiting
 */
function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
