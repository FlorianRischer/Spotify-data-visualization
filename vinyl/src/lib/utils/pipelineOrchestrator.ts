/**
 * Pipeline Orchestrator
 * 
 * Main orchestration for the complete data pipeline
 */

import { loadAllSpotifyData } from '$lib/data/loaders/dataLoader';
import { combineDatasets, deduplicateTracks, processSpotifyData } from '$lib/utils/dataProcessor';
import { extractUniqueArtists, getArtistGenres, getEnrichmentStats } from '$lib/services/dataEnrichmentService';
import type { GenreData } from '$lib/types';

export interface PipelineOptions {
	spotifyAccessToken?: string;
	genreLimit?: number;
	minPlayTime?: number;
	useCache?: boolean;
}

export interface PipelineResult {
	genres: GenreData[];
	stats: {
		totalTracks: number;
		validTracks: number;
		uniqueArtists: number;
		artistsWithGenres: number;
		genreCoverage: number;
		processingTime: number;
	};
}

/**
 * Run the complete data pipeline
 */
export async function runDataPipeline(
	options: PipelineOptions = {}
): Promise<PipelineResult> {
	const startTime = Date.now();
	
	const {
		spotifyAccessToken,
		genreLimit = 15,
		minPlayTime = 30000,
		useCache = true
	} = options;

	console.log('🚀 Starting data pipeline...');

	// Step 1: Load all Spotify data
	console.log('📂 Step 1: Loading Spotify data files...');
	const rawTracks = await loadAllSpotifyData();
	console.log(`   Loaded ${rawTracks.length} tracks`);

	// Step 2: Deduplicate
	console.log('🔄 Step 2: Deduplicating tracks...');
	const uniqueTracks = deduplicateTracks(rawTracks);
	console.log(`   ${uniqueTracks.length} unique tracks (removed ${rawTracks.length - uniqueTracks.length} duplicates)`);

	// Step 3: Extract unique artists
	console.log('👥 Step 3: Extracting unique artists...');
	const uniqueArtists = extractUniqueArtists(uniqueTracks);
	console.log(`   Found ${uniqueArtists.length} unique artists`);

	// Step 4: Get artist genres (cache-first)
	console.log('🎵 Step 4: Fetching artist genres...');
	const artistGenreMapping = await getArtistGenres(
		uniqueArtists,
		spotifyAccessToken
	);

	const enrichmentStats = getEnrichmentStats(uniqueArtists, artistGenreMapping);
	console.log(`   Genre coverage: ${enrichmentStats.coverage.toFixed(1)}% (${enrichmentStats.withGenres}/${enrichmentStats.total})`);

	// Step 5: Process into genre data
	console.log('⚙️  Step 5: Processing genre data...');
	const genres = processSpotifyData(uniqueTracks, artistGenreMapping, {
		limit: genreLimit,
		minPlayTime
	});
	console.log(`   Generated ${genres.length} genre visualizations`);

	const processingTime = Date.now() - startTime;
	console.log(`✅ Pipeline complete in ${(processingTime / 1000).toFixed(2)}s`);

	return {
		genres,
		stats: {
			totalTracks: rawTracks.length,
			validTracks: uniqueTracks.length,
			uniqueArtists: uniqueArtists.length,
			artistsWithGenres: enrichmentStats.withGenres,
			genreCoverage: enrichmentStats.coverage,
			processingTime
		}
	};
}
