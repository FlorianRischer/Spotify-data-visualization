// Data Loader — transforms Spotify streaming history into GraphBuildInput
import type { GraphBuildInput, GenreStat, ArtistGenre } from "$lib/graph/types";

export interface SpotifyStreamEntry {
  ts: string;
  master_metadata_track_name: string | null;
  master_metadata_album_artist_name: string | null;
  ms_played: number;
}

export interface ArtistWithGenres {
  originalName: string;
  id?: string;
  name?: string;
  genres?: string[];
  popularity?: number;
  followers?: number;
}

/**
 * Transform Spotify streaming history + artist genres into GraphBuildInput
 */
export function transformSpotifyData(
  streamingHistory: SpotifyStreamEntry[],
  artistsWithGenres: ArtistWithGenres[]
): GraphBuildInput {
  // Build artist-to-genres lookup
  const artistGenreMap = new Map<string, string[]>();
  for (const artist of artistsWithGenres) {
    if (artist.genres && artist.genres.length > 0) {
      artistGenreMap.set(artist.originalName, artist.genres);
    }
  }

  // Aggregate plays and time per genre, AND track top artist per genre
  const genreStats = new Map<string, { playCount: number; totalMinutes: number }>();
  const topArtistPerGenre = new Map<string, { name: string; minutes: number; totalMinutes: number }>();
  const artistTimePerGenre = new Map<string, Map<string, number>>();
  const artistTotalTime = new Map<string, number>(); // Total time per artist (not split)
  const songTimePerGenre = new Map<string, Map<string, number>>(); // Track song time per genre
  
  for (const entry of streamingHistory) {
    const artistName = entry.master_metadata_album_artist_name;
    const trackName = entry.master_metadata_track_name;
    if (!artistName) continue;
    
    const genres = artistGenreMap.get(artistName);
    if (!genres || genres.length === 0) continue;
    
    const minutes = entry.ms_played / 60000;
    
    // Track total artist time (not split)
    artistTotalTime.set(artistName, (artistTotalTime.get(artistName) || 0) + minutes);
    
    // Distribute plays/time across all genres of the artist
    for (const genre of genres) {
      const normalized = normalizeGenreId(genre);
      
      // Update genre stats
      const existing = genreStats.get(normalized) || { playCount: 0, totalMinutes: 0 };
      existing.playCount += 1;
      existing.totalMinutes += minutes / genres.length; // Split time across genres
      genreStats.set(normalized, existing);
      
      // Track artist time per genre
      if (!artistTimePerGenre.has(normalized)) {
        artistTimePerGenre.set(normalized, new Map());
      }
      const artistMap = artistTimePerGenre.get(normalized)!;
      const currentTime = artistMap.get(artistName) || 0;
      artistMap.set(artistName, currentTime + minutes / genres.length);
      
      // Track song time per genre
      if (trackName) {
        if (!songTimePerGenre.has(normalized)) {
          songTimePerGenre.set(normalized, new Map());
        }
        const songMap = songTimePerGenre.get(normalized)!;
        const songKey = `${artistName} - ${trackName}`;
        const currentSongTime = songMap.get(songKey) || 0;
        songMap.set(songKey, currentSongTime + minutes / genres.length);
      }
    }
  }
  
  // Calculate top artist for each genre
  for (const [genreId, artistMap] of artistTimePerGenre.entries()) {
    let topArtist = "";
    let maxMinutes = 0;
    for (const [artist, minutes] of artistMap.entries()) {
      if (minutes > maxMinutes) {
        maxMinutes = minutes;
        topArtist = artist;
      }
    }
    if (topArtist) {
      const totalTime = artistTotalTime.get(topArtist) || maxMinutes;
      topArtistPerGenre.set(genreId, { 
        name: topArtist, 
        minutes: Math.round(maxMinutes),
        totalMinutes: Math.round(totalTime)
      });
    }
  }
  
  // Calculate top song for each genre
  const topSongPerGenre = new Map<string, { song: string; minutes: number }>();
  for (const [genreId, songMap] of songTimePerGenre.entries()) {
    let topSong = "";
    let maxMinutes = 0;
    for (const [song, minutes] of songMap.entries()) {
      if (minutes > maxMinutes) {
        maxMinutes = minutes;
        topSong = song;
      }
    }
    if (topSong) {
      topSongPerGenre.set(genreId, { 
        song: topSong, 
        minutes: Math.round(maxMinutes)
      });
    }
  }

  // Convert to GenreStat array
  const genreStatsArray: GenreStat[] = Array.from(genreStats.entries())
    .filter(([_, stats]) => stats.totalMinutes > 5) // Filter out noise
    .map(([id, stats]) => {
      const topArtistData = topArtistPerGenre.get(id);
      const topSongData = topSongPerGenre.get(id);
      return {
        id,
        label: formatGenreLabel(id),
        playCount: stats.playCount,
        totalMinutes: Math.round(stats.totalMinutes),
        topArtist: topArtistData?.name,
        topArtistMinutes: topArtistData?.minutes,
        topArtistTotalMinutes: topArtistData?.totalMinutes,
        topSong: topSongData?.song,
        topSongMinutes: topSongData?.minutes
      };
    })
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  // Build artists array (only those with 2+ genres for multi-genre edges)
  const artists: ArtistGenre[] = [];
  for (const artist of artistsWithGenres) {
    if (artist.genres && artist.genres.length >= 2) {
      artists.push({
        artistId: artist.id || artist.originalName,
        name: artist.name || artist.originalName,
        genres: artist.genres.map(normalizeGenreId)
      });
    }
  }

  return {
    genreStats: genreStatsArray,
    artists,
    collabTracks: [] // Collab data not available from basic streaming history
  };
}

/**
 * Normalize genre string to a clean ID
 */
function normalizeGenreId(genre: string): string {
  return genre
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

/**
 * Format genre ID back to readable label
 */
function formatGenreLabel(id: string): string {
  return id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Load streaming history JSON files - OPTIMIZED with parallel loading
 * Supports fallback URLs if primary source fails
 */
export async function loadStreamingHistory(
  fileUrls: string[],
  fallbackUrls?: string[]
): Promise<SpotifyStreamEntry[]> {
  console.log(`📂 Loading streaming history from ${fileUrls.length} files...`);
  
  // Parallel fetch all files at once (much faster than sequential)
  const results = await Promise.allSettled(
    fileUrls.map(async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json() as Promise<SpotifyStreamEntry[]>;
    })
  );
  
  // Flatten successful results
  const all: SpotifyStreamEntry[] = [];
  let successCount = 0;
  
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled') {
      all.push(...result.value);
      successCount++;
    } else {
      console.warn(`Failed to load ${fileUrls[i]}:`, result.reason);
    }
  }
  
  // If no files loaded and fallback URLs provided, try fallback
  if (all.length === 0 && fallbackUrls && fallbackUrls.length > 0) {
    console.log(`⚠️ Primary sources failed, trying fallback URLs...`);
    const fallbackResults = await Promise.allSettled(
      fallbackUrls.map(async (url) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<SpotifyStreamEntry[]>;
      })
    );
    
    for (let i = 0; i < fallbackResults.length; i++) {
      const result = fallbackResults[i];
      if (result.status === 'fulfilled') {
        all.push(...result.value);
        successCount++;
      }
    }
  }
  
  console.log(`✅ Loaded ${all.length} streaming entries from ${successCount} files`);
  return all;
}

/**
 * Create demo data with real-ish looking genre connections
 */
export function createDemoGraphInput(): GraphBuildInput {
  const genreStats: GenreStat[] = [
    { id: "pop", label: "Pop", playCount: 2400, totalMinutes: 14400 },
    { id: "indie", label: "Indie", playCount: 1800, totalMinutes: 10800 },
    { id: "electronic", label: "Electronic", playCount: 1500, totalMinutes: 9000 },
    { id: "rock", label: "Rock", playCount: 1200, totalMinutes: 7200 },
    { id: "hip-hop", label: "Hip Hop", playCount: 1100, totalMinutes: 6600 },
    { id: "r-and-b", label: "R&B", playCount: 900, totalMinutes: 5400 },
    { id: "alternative", label: "Alternative", playCount: 850, totalMinutes: 5100 },
    { id: "dance", label: "Dance", playCount: 800, totalMinutes: 4800 },
    { id: "soul", label: "Soul", playCount: 600, totalMinutes: 3600 },
    { id: "jazz", label: "Jazz", playCount: 400, totalMinutes: 2400 },
    { id: "indie", label: "Indie", playCount: 350, totalMinutes: 2100 },
    { id: "classical", label: "Classical", playCount: 200, totalMinutes: 1200 },
    { id: "metal", label: "Metal", playCount: 300, totalMinutes: 1800 },
    { id: "punk", label: "Punk", playCount: 250, totalMinutes: 1500 },
    { id: "reggae", label: "Reggae", playCount: 180, totalMinutes: 1080 }
  ];

  const artists: ArtistGenre[] = [
    { artistId: "1", name: "Artist 1", genres: ["pop", "indie"] },
    { artistId: "2", name: "Artist 2", genres: ["indie", "rock"] },
    { artistId: "3", name: "Artist 3", genres: ["electronic", "pop"] },
    { artistId: "4", name: "Artist 4", genres: ["electronic", "dance"] },
    { artistId: "5", name: "Artist 5", genres: ["hip-hop", "r-and-b"] },
    { artistId: "6", name: "Artist 6", genres: ["hip-hop", "pop"] },
    { artistId: "7", name: "Artist 7", genres: ["r-and-b", "soul"] },
    { artistId: "8", name: "Artist 8", genres: ["alternative", "indie"] },
    { artistId: "9", name: "Artist 9", genres: ["alternative", "rock"] },
    { artistId: "10", name: "Artist 10", genres: ["jazz", "soul"] },
    { artistId: "11", name: "Artist 11", genres: ["folk", "indie"] },
    { artistId: "12", name: "Artist 12", genres: ["metal", "rock"] },
    { artistId: "13", name: "Artist 13", genres: ["punk", "rock"] },
    { artistId: "14", name: "Artist 14", genres: ["reggae", "soul"] },
    { artistId: "15", name: "Artist 15", genres: ["electronic", "hip-hop"] },
    { artistId: "16", name: "Artist 16", genres: ["dance", "pop"] },
    { artistId: "17", name: "Artist 17", genres: ["classical", "jazz"] },
    { artistId: "18", name: "Artist 18", genres: ["folk", "rock"] }
  ];

  return {
    genreStats,
    artists,
    collabTracks: []
  };
}
