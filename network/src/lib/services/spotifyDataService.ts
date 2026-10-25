/**
 * Spotify Data Service
 * Handles loading and caching of artist/genre data
 * 
 * Data is loaded from Cloudflare R2 bucket for cross-device access
 */

const CACHE_KEY = "spotify_artist_cache";
const CACHE_VERSION = "v1";
const CACHE_VERSION_LEGACY = ["v1", "v2"];

export interface ArtistCacheEntry {
  id?: string;
  name?: string;
  genres?: string[];
  popularity?: number;
  followers?: number;
  notFound?: boolean;
}

/**
 * Cloudflare R2 Public Bucket URL
 * Set this to your R2 bucket's public URL after enabling public access
 */
const R2_BUCKET_URL = "https://pub-db07bac972eb49449af4dd8101d40e57.r2.dev";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isValidArtistCacheEntry(value: unknown): value is ArtistCacheEntry {
  if (!isRecord(value)) return false;
  if (value.notFound === true) return true;
  if (typeof value.id !== "string") return false;
  return Array.isArray(value.genres) && value.genres.every((genre) => typeof genre === "string");
}

function safeReadStorage(key: string): string | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWriteStorage(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalizes artist name for cache key lookup
 */
export function normKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Loads precomputed artist-genre data from R2 bucket or local fallback
 */
export async function loadPrecomputedCache(): Promise<Map<string, ArtistCacheEntry>> {
  const dataSources = [
    `${R2_BUCKET_URL}/artist-cache.json`,
    "/artist-cache-2025-12-13.json",
    "/artist-cache.json"
  ];

  for (const source of dataSources) {
    try {
      const response = await fetch(source);
      if (!response.ok) continue;

      const data = await response.json();
      if (!isRecord(data)) continue;

      const validEntries = Object.entries(data).reduce<Array<[string, ArtistCacheEntry]>>((result, [key, value]) => {
        if (key === "_info" || !isValidArtistCacheEntry(value)) return result;
        result.push([normKey(key), value]);
        return result;
      }, []);

      if (validEntries.length > 0) {
        return new Map(validEntries);
      }
    } catch {
      // Source not available, try next
    }
  }

  return new Map();
}

export type ArtistCacheLookup = ArtistCacheEntry & { originalName: string };

/**
 * Loads localStorage cache as fallback
 */
export function loadLocalCache(): Map<string, ArtistCacheEntry> {
  try {
    const cached = safeReadStorage(CACHE_KEY);
    if (!cached) return new Map();

    const parsed = JSON.parse(cached) as unknown;
    if (!isRecord(parsed)) return new Map();

    const { version, data, timestamp } = parsed;
    if (
      !CACHE_VERSION_LEGACY.includes(String(version)) ||
      typeof timestamp !== "number" ||
      Date.now() - timestamp > 30 * 24 * 60 * 60 * 1000 ||
      !isRecord(data)
    ) {
      return new Map();
    }

    const validEntries = Object.entries(data).reduce<Array<[string, ArtistCacheEntry]>>((result, [key, value]) => {
      if (!isValidArtistCacheEntry(value)) return result;
      result.push([normKey(key), value]);
      return result;
    }, []);

    return new Map(validEntries);
  } catch {
    return new Map();
  }
}

/**
 * Saves cache to localStorage
 */
export function saveLocalCache(cache: Map<string, ArtistCacheEntry>) {
  const data = Array.from(cache.entries()).reduce<Record<string, ArtistCacheEntry>>((result, [key, value]) => {
    if (isValidArtistCacheEntry(value)) {
      result[key] = value;
    }
    return result;
  }, {});

  const payload = JSON.stringify({
    version: CACHE_VERSION,
    data,
    timestamp: Date.now()
  });

  safeWriteStorage(CACHE_KEY, payload);
}

/**
 * Combines all cache sources
 */
export async function loadAllCaches(): Promise<Map<string, ArtistCacheEntry>> {
  const precomputed = await loadPrecomputedCache();
  const local = loadLocalCache();
  return new Map([...precomputed, ...local]);
}

/**
 * Exports local cache as JSON for download
 */
export function exportCacheToJSON() {
  try {
    const cached = safeReadStorage(CACHE_KEY);
    if (!cached) {
      console.warn("❌ No cache found to export");
      alert("Kein Cache zum Exportieren vorhanden. Lade erst Genres.");
      return;
    }

    const parsed = JSON.parse(cached) as unknown;
    if (!isRecord(parsed) || !isRecord(parsed.data)) {
      throw new Error("Invalid cache payload");
    }

    const { data } = parsed;
    const exportData = {
      _info: {
        exportDate: new Date().toISOString(),
        artistCount: Object.keys(data).length,
        instructions: "Copy this file to /static/artist-cache.json to use as precomputed cache"
      },
      ...data
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `artist-cache-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(`✅ Cache mit ${exportData._info.artistCount} Artists heruntergeladen!\n\nDie Datei in /static/artist-cache.json kopieren um API-Calls zu sparen.`);
  } catch (e) {
    console.error("Failed to export cache:", e);
    alert(`❌ Export fehlgeschlagen: ${e}`);
  }
}

/**
 * Main function: Gets artists with genres from cache
 */
export async function getArtistsWithGenres(uniqueArtists: string[]): Promise<ArtistCacheLookup[]> {
  const cache = await loadAllCaches();
  const artistsWithGenres: ArtistCacheLookup[] = [];

  for (const rawName of uniqueArtists) {
    const key = normKey(rawName);
    const cached = cache.get(key);

    if (cached?.id && Array.isArray(cached.genres) && cached.genres.length > 0) {
      artistsWithGenres.push({ originalName: rawName, ...cached });
    }
  }

  saveLocalCache(cache);
  return artistsWithGenres;
}

/**
 * Streaming history file paths - loaded from R2 bucket
 */
const STREAMING_FILE_NAMES = [
  "Streaming_History_Audio_2018-2020_0.json",
  "Streaming_History_Audio_2020-2021_1.json",
  "Streaming_History_Audio_2021_2.json",
  "Streaming_History_Audio_2021_3.json",
  "Streaming_History_Audio_2021-2022_4.json",
  "Streaming_History_Audio_2022_5.json",
  "Streaming_History_Audio_2022-2023_6.json",
  "Streaming_History_Audio_2023_7.json",
  "Streaming_History_Audio_2023-2024_8.json",
  "Streaming_History_Audio_2024_9.json",
  "Streaming_History_Audio_2024-2025_10.json",
  "Streaming_History_Audio_2025_11.json"
];

/**
 * Get streaming file URLs - tries R2 bucket first, then local fallback
 */
export const STREAMING_FILES = STREAMING_FILE_NAMES.map(name => 
  `${R2_BUCKET_URL}/spotify-data/${name}`
);

/**
 * Fallback to local files if R2 fails
 */
export const STREAMING_FILES_LOCAL = STREAMING_FILE_NAMES.map(name => 
  `/spotify-data/${name}`
);
