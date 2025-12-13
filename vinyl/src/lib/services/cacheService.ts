/**
 * Local Cache Service
 * 
 * Handles reading and writing cache files to avoid repeated API calls
 */

import type { ArtistGenreMapping } from '$lib/types';

/**
 * Cache storage interface
 */
interface CacheEntry<T> {
	data: T;
	timestamp: string;
	version: string;
}

/**
 * Load cache from JSON file or localStorage
 */
export async function loadCache<T>(filename: string): Promise<T | null> {
	try {
		// Try to load from static files first (pre-generated cache)
		const response = await fetch(`/cache/${filename}`);
		if (response.ok) {
			const cacheEntry: CacheEntry<T> = await response.json();
			console.log(`Loaded cache from file: ${filename}`);
			return cacheEntry.data;
		}
	} catch (error) {
		console.log(`No cache file found: ${filename}, trying localStorage`);
	}

	// Fallback to localStorage
	try {
		const stored = localStorage.getItem(`spotify-cache:${filename}`);
		if (stored) {
			const cacheEntry: CacheEntry<T> = JSON.parse(stored);
			console.log(`Loaded cache from localStorage: ${filename}`);
			return cacheEntry.data;
		}
	} catch (error) {
		console.error(`Failed to load from localStorage: ${filename}`, error);
	}

	return null;
}

/**
 * Save data to cache (localStorage only, as we can't write to filesystem from browser)
 */
export async function saveCache<T>(filename: string, data: T): Promise<boolean> {
	try {
		const cacheEntry: CacheEntry<T> = {
			data,
			timestamp: new Date().toISOString(),
			version: '1.0.0'
		};

		localStorage.setItem(`spotify-cache:${filename}`, JSON.stringify(cacheEntry));
		console.log(`Saved cache to localStorage: ${filename}`);
		return true;
	} catch (error) {
		console.error(`Failed to save cache: ${filename}`, error);
		return false;
	}
}

/**
 * Clear specific cache
 */
export function clearCache(filename: string): void {
	localStorage.removeItem(`spotify-cache:${filename}`);
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
	const keys = Object.keys(localStorage);
	keys.forEach((key) => {
		if (key.startsWith('spotify-cache:')) {
			localStorage.removeItem(key);
		}
	});
	console.log('Cleared all caches');
}

/**
 * Load artist genre mapping from cache
 */
export async function loadArtistGenreCache(): Promise<ArtistGenreMapping> {
	const cache = await loadCache<ArtistGenreMapping>('artistGenres.json');
	return cache ?? {};
}

/**
 * Save artist genre mapping to cache
 */
export async function saveArtistGenreCache(mapping: ArtistGenreMapping): Promise<boolean> {
	return saveCache('artistGenres.json', mapping);
}
