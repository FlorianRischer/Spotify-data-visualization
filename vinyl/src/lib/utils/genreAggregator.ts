/**
 * Genre Aggregation Logic
 * 
 * Processes Spotify tracks and aggregates by genre
 */

import type { SpotifyTrackRaw, GenreData, ArtistGenreMapping, TopArtist, TopTrack } from '$lib/types';
import { getGenreColor } from '$lib/constants/colors';

interface EnrichedTrack extends SpotifyTrackRaw {
	genres: string[];
	primaryGenre: string | null;
	listenTimeMinutes: number;
}

interface GenreStats {
	genre: string;
	totalMinutes: number;
	trackCount: number;
	tracks: EnrichedTrack[];
}

/**
 * Enrich tracks with genre information
 */
export function enrichTracksWithGenres(
	tracks: SpotifyTrackRaw[],
	artistGenreMap: ArtistGenreMapping
): EnrichedTrack[] {
	return tracks.map((track) => {
		const artistName = track.master_metadata_album_artist_name || '';
		const genres = artistGenreMap[artistName] || [];

		return {
			...track,
			genres,
			primaryGenre: genres[0] || null,
			listenTimeMinutes: track.ms_played / 1000 / 60 // Convert ms to minutes
		};
	});
}

/**
 * Aggregate tracks by genre
 */
export function aggregateByGenre(enrichedTracks: EnrichedTrack[]): Map<string, GenreStats> {
	const genreMap = new Map<string, GenreStats>();

	enrichedTracks.forEach((track) => {
		if (!track.genres || track.genres.length === 0) return;

		track.genres.forEach((genre) => {
			// Filter out invalid genres
			if (
				!genre ||
				genre.toLowerCase() === 'unknown' ||
				genre.toLowerCase() === 'other' ||
				genre.trim().length === 0
			) {
				return;
			}

			const existing = genreMap.get(genre);
			if (existing) {
				existing.totalMinutes += track.listenTimeMinutes;
				existing.trackCount += 1;
				existing.tracks.push(track);
			} else {
				genreMap.set(genre, {
					genre,
					totalMinutes: track.listenTimeMinutes,
					trackCount: 1,
					tracks: [track]
				});
			}
		});
	});

	return genreMap;
}

/**
 * Calculate top artists for a genre
 */
function calculateTopArtists(tracks: EnrichedTrack[], limit: number = 5): TopArtist[] {
	const artistStats = new Map<string, { playCount: number; totalMinutes: number }>();

	tracks.forEach((track) => {
		const artistName = track.master_metadata_album_artist_name;
		if (!artistName) return;

		const existing = artistStats.get(artistName);
		if (existing) {
			existing.playCount += 1;
			existing.totalMinutes += track.listenTimeMinutes;
		} else {
			artistStats.set(artistName, {
				playCount: 1,
				totalMinutes: track.listenTimeMinutes
			});
		}
	});

	return Array.from(artistStats.entries())
		.map(([name, stats]) => ({
			name,
			playCount: stats.playCount,
			totalHours: stats.totalMinutes / 60
		}))
		.sort((a, b) => b.playCount - a.playCount)
		.slice(0, limit);
}

/**
 * Calculate top tracks for a genre
 */
function calculateTopTracks(tracks: EnrichedTrack[], limit: number = 5): TopTrack[] {
	const trackStats = new Map<
		string,
		{ name: string; artist: string; playCount: number }
	>();

	tracks.forEach((track) => {
		const trackName = track.master_metadata_track_name;
		const artistName = track.master_metadata_album_artist_name;
		if (!trackName || !artistName) return;

		const key = `${trackName}|||${artistName}`;
		const existing = trackStats.get(key);

		if (existing) {
			existing.playCount += 1;
		} else {
			trackStats.set(key, {
				name: trackName,
				artist: artistName,
				playCount: 1
			});
		}
	});

	return Array.from(trackStats.values())
		.sort((a, b) => b.playCount - a.playCount)
		.slice(0, limit);
}

/**
 * Convert genre stats to GenreData format
 */
export function convertToGenreData(
	genreStats: Map<string, GenreStats>,
	totalMinutes: number
): GenreData[] {
	return Array.from(genreStats.entries()).map(([genre, stats]) => {
		const totalHours = stats.totalMinutes / 60;
		const percentage = (stats.totalMinutes / totalMinutes) * 100;

		return {
			id: slugify(genre),
			name: genre,
			trackCount: stats.trackCount,
			totalMinutesListened: stats.totalMinutes,
			totalHours,
			percentage,
			color: getGenreColor(genre),
			topArtists: calculateTopArtists(stats.tracks),
			topTracks: calculateTopTracks(stats.tracks),
			avgMinutesPerTrack: stats.totalMinutes / stats.trackCount
		};
	});
}

/**
 * Sort and limit genre data
 */
export function sortAndLimit(genres: GenreData[], limit: number = 15): GenreData[] {
	return genres.sort((a, b) => b.totalHours - a.totalHours).slice(0, limit);
}

/**
 * Helper: Convert genre name to slug
 */
function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_-]+/g, '-')
		.replace(/^-+|-+$/g, '');
}
