/**
 * Spotify Data Service
 * Handles loading and caching of artist/genre data
 */

const CACHE_KEY = "spotify_artist_cache";
const CACHE_VERSION = "v1";
const CACHE_VERSION_LEGACY = ["v1", "v2"];

/**
 * Normalizes artist name for cache key lookup
 */
export function normKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Loads precomputed artist-genre data from /static/
 */
export async function loadPrecomputedCache(): Promise<Map<string, any>> {
  const dataSources = [
    "/artist-cache-2025-12-13.json",
    "/artist-cache.json"
  ];

  for (const source of dataSources) {
    try {
      const response = await fetch(source);
      if (response.ok) {
        const data = await response.json();

        const validEntries = Object.entries(data).filter(
          ([key, val]: [string, any]) => key !== "_info" && val && typeof val === "object" && val.id
        );

        if (validEntries.length > 0) {
          const normalizedEntries: Array<[string, any]> = validEntries.map(([key, val]) => [normKey(key), val]);
          console.log(`📂 Loaded precomputed cache from ${source} with`, normalizedEntries.length, "artists");
          return new Map(normalizedEntries);
        }
      }
    } catch (e) {
      console.log(`📂 Source ${source} not available`);
    }
  }

  console.log("📂 No precomputed cache available from any source");
  return new Map();
}

/**
 * Loads localStorage cache as fallback
 */
export function loadLocalCache(): Map<string, any> {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { version, data, timestamp } = JSON.parse(cached);
      if (CACHE_VERSION_LEGACY.includes(version) && Date.now() - timestamp < 30 * 24 * 60 * 60 * 1000) {
        const validEntries = Object.entries(data).filter(([_, val]: [string, any]) => {
          if (!val || typeof val !== "object") return false;
          if (val.notFound) return true;
          return val.id && val.genres && val.genres.length > 0;
        });

        const normalizedEntries: Array<[string, any]> = validEntries.map(([key, val]) => [normKey(key), val]);
        console.log("💾 Loaded", normalizedEntries.length, "artists from localStorage");
        return new Map(normalizedEntries);
      }
    }
  } catch (e) {
    console.warn("Failed to load localStorage cache:", e);
  }
  return new Map();
}

/**
 * Saves cache to localStorage
 */
export function saveLocalCache(cache: Map<string, any>) {
  try {
    const data = Object.fromEntries(cache);
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        version: CACHE_VERSION,
        data,
        timestamp: Date.now()
      })
    );
    console.log("💾 Saved", cache.size, "artists to localStorage");
  } catch (e) {
    console.warn("Failed to save cache:", e);
  }
}

/**
 * Combines all cache sources
 */
export async function loadAllCaches(): Promise<Map<string, any>> {
  const precomputed = await loadPrecomputedCache();
  const local = loadLocalCache();
  const merged = new Map([...precomputed, ...local]);
  console.log(`📊 Combined cache: ${merged.size} artists total`);
  return merged;
}

/**
 * Exports local cache as JSON for download
 */
export function exportCacheToJSON() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) {
      console.warn("❌ No cache found to export");
      alert("Kein Cache zum Exportieren vorhanden. Lade erst Genres.");
      return;
    }

    const { data } = JSON.parse(cached);
    
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

    console.log(`✅ Downloaded cache with ${exportData._info.artistCount} artists`);
    alert(`✅ Cache mit ${exportData._info.artistCount} Artists heruntergeladen!\n\nDie Datei in /static/artist-cache.json kopieren um API-Calls zu sparen.`);
  } catch (e) {
    console.error("Failed to export cache:", e);
    alert(`❌ Export fehlgeschlagen: ${e}`);
  }
}

/**
 * Main function: Gets artists with genres from cache
 */
export async function getArtistsWithGenres(uniqueArtists: string[]): Promise<any[]> {
  const cache = await loadAllCaches();

  const artistsWithGenres: any[] = [];
  let successCount = 0;

  for (const rawName of uniqueArtists) {
    const key = normKey(rawName);
    const cached = cache.get(key);

    if (cached?.id && Array.isArray(cached.genres) && cached.genres.length > 0) {
      artistsWithGenres.push({ originalName: rawName, ...cached });
      successCount++;
    }
  }

  console.log(`📊 Found ${successCount}/${uniqueArtists.length} artists with genres in cache`);
  console.log(`✅ Using cached data only. No API calls. Found ${artistsWithGenres.length} artists with genres.`);
  saveLocalCache(cache);
  return artistsWithGenres;
}

/**
 * Streaming history file paths
 */
export const STREAMING_FILES = [
  "/spotify-data/Streaming_History_Audio_2018-2020_0.json",
  "/spotify-data/Streaming_History_Audio_2020-2021_1.json",
  "/spotify-data/Streaming_History_Audio_2021_2.json",
  "/spotify-data/Streaming_History_Audio_2021_3.json",
  "/spotify-data/Streaming_History_Audio_2021-2022_4.json",
  "/spotify-data/Streaming_History_Audio_2022_5.json",
  "/spotify-data/Streaming_History_Audio_2022-2023_6.json",
  "/spotify-data/Streaming_History_Audio_2023_7.json",
  "/spotify-data/Streaming_History_Audio_2023-2024_8.json",
  "/spotify-data/Streaming_History_Audio_2024_9.json",
  "/spotify-data/Streaming_History_Audio_2024-2025_10.json",
  "/spotify-data/Streaming_History_Audio_2025_11.json"
];
