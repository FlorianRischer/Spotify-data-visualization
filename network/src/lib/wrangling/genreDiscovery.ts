/**
 * Genre Discovery Data Wrangling
 * 
 * Analysiert die Streaming-History, um herauszufinden, wann jedes Genre
 * zum ersten Mal gehört wurde. Diese Daten werden für die Timeline verwendet,
 * um Nodes basierend auf ihrem Entdeckungsdatum zu positionieren.
 */

import type { SpotifyStreamEntry, ArtistWithGenres } from '$lib/graph/dataLoader';
import type { GenreCategory } from '$lib/graph/genreMapping';
import { getGenreCategory } from '$lib/graph/genreMapping';

export interface GenreDiscoveryData {
  genreId: string;
  genreName: string;
  category: GenreCategory;
  firstPlayedDate: Date;
  firstPlayedTimestamp: string;
  firstTrack: string;
  firstArtist: string;
  monthIndex: number; // 0-based index from start of data (for timeline positioning)
  year: number;
  month: number; // 1-12
}

export interface TimelineMonthData {
  year: number;
  month: number; // 1-12
  monthLabel: string;
  genresDiscovered: GenreDiscoveryData[];
  cumulativeGenres: number; // Total genres discovered up to this point
}

export interface GenreTimelineData {
  startYear: number;
  endYear: number;
  totalMonths: number;
  genres: GenreDiscoveryData[];
  monthlyData: TimelineMonthData[];
  genresByCategory: Map<GenreCategory, GenreDiscoveryData[]>;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Normalisiert einen Genre-Namen zu einer ID
 * WICHTIG: Muss mit dataLoader.ts normalizeGenreId identisch sein!
 */
function normalizeGenreId(genre: string): string {
  return genre
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

/**
 * Analysiert die Streaming-History und findet das erste Abspielen jedes Genres
 */
export function computeGenreDiscovery(
  streamingHistory: SpotifyStreamEntry[],
  artistsWithGenres: ArtistWithGenres[]
): GenreTimelineData {
  // Build artist-to-genres lookup
  const artistGenreMap = new Map<string, string[]>();
  for (const artist of artistsWithGenres) {
    if (artist.genres && artist.genres.length > 0) {
      artistGenreMap.set(artist.originalName, artist.genres);
    }
  }

  // Map to track first play of each genre
  const genreFirstPlay = new Map<string, {
    date: Date;
    timestamp: string;
    track: string;
    artist: string;
    genreName: string;
  }>();

  // Sort streaming history by timestamp (oldest first)
  const sortedHistory = [...streamingHistory].sort((a, b) => 
    new Date(a.ts).getTime() - new Date(b.ts).getTime()
  );

  // Find first play for each genre
  for (const entry of sortedHistory) {
    const artistName = entry.master_metadata_album_artist_name;
    const trackName = entry.master_metadata_track_name;
    
    if (!artistName || !trackName) continue;
    
    // Akzeptiere auch kürzere Plays für die Discovery
    // (vorher: 30 Sekunden Minimum - zu streng, manche Genres wurden verpasst)
    if (entry.ms_played < 5000) continue; // Weniger als 5 Sekunden überspringen
    
    const genres = artistGenreMap.get(artistName);
    if (!genres || genres.length === 0) continue;

    const playDate = new Date(entry.ts);

    for (const genre of genres) {
      const genreId = normalizeGenreId(genre);
      
      // Only record if this is the first time we've seen this genre
      if (!genreFirstPlay.has(genreId)) {
        genreFirstPlay.set(genreId, {
          date: playDate,
          timestamp: entry.ts,
          track: trackName,
          artist: artistName,
          genreName: genre
        });
      }
    }
  }

  // Convert to array and sort by date
  const genreDiscoveries: GenreDiscoveryData[] = [];
  
  // Find date range
  let minDate = new Date();
  let maxDate = new Date(0);
  
  for (const [genreId, data] of genreFirstPlay.entries()) {
    if (data.date < minDate) minDate = data.date;
    if (data.date > maxDate) maxDate = data.date;
  }

  const startYear = minDate.getFullYear();
  const endYear = maxDate.getFullYear();
  const startMonth = minDate.getMonth();

  // Calculate month index for each genre
  for (const [genreId, data] of genreFirstPlay.entries()) {
    const year = data.date.getFullYear();
    const month = data.date.getMonth() + 1; // 1-12
    const monthIndex = (year - startYear) * 12 + (data.date.getMonth() - startMonth);
    
    genreDiscoveries.push({
      genreId,
      genreName: data.genreName,
      category: getGenreCategory(data.genreName),
      firstPlayedDate: data.date,
      firstPlayedTimestamp: data.timestamp,
      firstTrack: data.track,
      firstArtist: data.artist,
      monthIndex,
      year,
      month
    });
  }

  // Sort by first played date
  genreDiscoveries.sort((a, b) => a.firstPlayedDate.getTime() - b.firstPlayedDate.getTime());

  // Group by month for timeline
  const monthlyDataMap = new Map<string, TimelineMonthData>();
  const totalMonths = (endYear - startYear) * 12 + (maxDate.getMonth() - startMonth) + 1;

  // Initialize all months
  for (let i = 0; i < totalMonths; i++) {
    const monthOffset = startMonth + i;
    const year = startYear + Math.floor(monthOffset / 12);
    const month = (monthOffset % 12) + 1;
    const key = `${year}-${month.toString().padStart(2, '0')}`;
    
    monthlyDataMap.set(key, {
      year,
      month,
      monthLabel: MONTH_LABELS[month - 1],
      genresDiscovered: [],
      cumulativeGenres: 0
    });
  }

  // Populate with discovered genres
  for (const genre of genreDiscoveries) {
    const key = `${genre.year}-${genre.month.toString().padStart(2, '0')}`;
    const monthData = monthlyDataMap.get(key);
    if (monthData) {
      monthData.genresDiscovered.push(genre);
    }
  }

  // Calculate cumulative genres
  const monthlyData = Array.from(monthlyDataMap.values()).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  let cumulative = 0;
  for (const month of monthlyData) {
    cumulative += month.genresDiscovered.length;
    month.cumulativeGenres = cumulative;
  }

  // Group by category
  const genresByCategory = new Map<GenreCategory, GenreDiscoveryData[]>();
  for (const genre of genreDiscoveries) {
    if (!genresByCategory.has(genre.category)) {
      genresByCategory.set(genre.category, []);
    }
    genresByCategory.get(genre.category)!.push(genre);
  }

  return {
    startYear,
    endYear,
    totalMonths,
    genres: genreDiscoveries,
    monthlyData,
    genresByCategory
  };
}

/**
 * Berechnet die X-Position eines Genres auf der Timeline (0-1)
 * basierend auf seinem Entdeckungsdatum
 */
export function getGenreTimelinePosition(
  genre: GenreDiscoveryData,
  timelineData: GenreTimelineData,
  currentYear: number
): number {
  // Wenn das Genre vor dem aktuellen Jahr entdeckt wurde, ist es bei 0
  if (genre.year < currentYear) return 0;
  // Wenn das Genre nach dem aktuellen Jahr entdeckt wurde, ist es bei 1
  if (genre.year > currentYear) return 1;
  
  // Ansonsten berechne Position basierend auf Monat (1-12 → 0-1)
  return (genre.month - 0.5) / 12;
}

/**
 * Filtert Genres, die in einem bestimmten Jahr entdeckt wurden
 */
export function getGenresDiscoveredInYear(
  timelineData: GenreTimelineData,
  year: number
): GenreDiscoveryData[] {
  return timelineData.genres.filter(g => g.year === year);
}

/**
 * Gibt alle Jahre zurück, in denen Genres entdeckt wurden
 */
export function getDiscoveryYears(timelineData: GenreTimelineData): number[] {
  const years = new Set<number>();
  for (const genre of timelineData.genres) {
    years.add(genre.year);
  }
  return Array.from(years).sort((a, b) => a - b);
}

/**
 * Berechnet Statistiken für die Timeline-Anzeige
 */
export function getTimelineStats(timelineData: GenreTimelineData) {
  const yearStats = new Map<number, {
    totalDiscovered: number;
    byCategory: Map<GenreCategory, number>;
    topGenres: GenreDiscoveryData[];
  }>();

  for (let year = timelineData.startYear; year <= timelineData.endYear; year++) {
    const genresInYear = timelineData.genres.filter(g => g.year === year);
    const byCategory = new Map<GenreCategory, number>();
    
    for (const genre of genresInYear) {
      byCategory.set(genre.category, (byCategory.get(genre.category) || 0) + 1);
    }

    yearStats.set(year, {
      totalDiscovered: genresInYear.length,
      byCategory,
      topGenres: genresInYear.slice(0, 5) // Top 5 genres discovered
    });
  }

  return yearStats;
}
/**
 * Interface für Genre-Jahres-Statistiken
 */
export interface GenreYearlyStats {
  genreId: string;
  genreName: string;
  year: number;
  totalMinutes: number;
  playCount: number;
}

/**
 * Interface für Top-Year eines Genres
 */
export interface GenreTopYear {
  genreId: string;
  genreName: string;
  topYear: number;
  topYearMinutes: number;
  topYearPlayCount: number;
  discoveredYear: number;
  discoveredYearMinutes: number;
  yearlyStats: GenreYearlyStats[];
}

/**
 * Berechnet für jedes Genre die Hörzeit pro Jahr
 * Gibt eine Map zurück: genreId -> {topYear, topYearMinutes, yearlyStats[]}
 */
export function computeGenreYearlyStats(
  streamingHistory: SpotifyStreamEntry[],
  artistsWithGenres: ArtistWithGenres[],
  discoveryData: GenreTimelineData
): Map<string, GenreTopYear> {
  // Build artist-to-genres lookup
  const artistGenreMap = new Map<string, string[]>();
  const artistGenreNameMap = new Map<string, Map<string, string>>(); // artist -> {genreId -> genreName}
  
  for (const artist of artistsWithGenres) {
    if (artist.genres && artist.genres.length > 0) {
      artistGenreMap.set(artist.originalName, artist.genres.map(g => normalizeGenreId(g)));
      
      const genreNames = new Map<string, string>();
      for (const genre of artist.genres) {
        genreNames.set(normalizeGenreId(genre), genre);
      }
      artistGenreNameMap.set(artist.originalName, genreNames);
    }
  }

  // Map für jedes Genre: Jahr -> {totalMinutes, playCount}
  const genreYearlyData = new Map<string, Map<number, {totalMinutes: number; playCount: number}>>();
  
  // Initialize with all genres from discovery data
  for (const genre of discoveryData.genres) {
    if (!genreYearlyData.has(genre.genreId)) {
      genreYearlyData.set(genre.genreId, new Map());
    }
  }

  // Process each streaming entry
  for (const entry of streamingHistory) {
    const artistName = entry.master_metadata_album_artist_name;
    if (!artistName) continue;

    const genreIds = artistGenreMap.get(artistName);
    if (!genreIds || genreIds.length === 0) continue;

    // Extract year from timestamp
    const entryDate = new Date(entry.ts);
    const year = entryDate.getFullYear();
    const minutesPlayed = entry.ms_played / (1000 * 60);

    // Get genre names
    const genreNames = artistGenreNameMap.get(artistName);
    if (!genreNames) continue;

    // Add to stats for each genre
    for (const genreId of genreIds) {
      if (!genreYearlyData.has(genreId)) {
        genreYearlyData.set(genreId, new Map());
      }

      const yearStats = genreYearlyData.get(genreId)!;
      if (!yearStats.has(year)) {
        yearStats.set(year, {totalMinutes: 0, playCount: 0});
      }

      const stats = yearStats.get(year)!;
      stats.totalMinutes += minutesPlayed;
      stats.playCount += 1;
    }
  }

  // Build result map with top years
  const result = new Map<string, GenreTopYear>();
  
  for (const [genreId, yearlyMap] of genreYearlyData) {
    // Find top year
    let topYear = 2018;
    let topYearMinutes = 0;
    let topYearPlayCount = 0;
    
    // Find discovered year
    const genreDiscovery = discoveryData.genres.find(g => g.genreId === genreId);
    const discoveredYear = genreDiscovery?.year || 2018;
    let discoveredYearMinutes = 0;

    const yearlyStats: GenreYearlyStats[] = [];

    for (const [year, stats] of yearlyMap) {
      yearlyStats.push({
        genreId,
        genreName: discoveryData.genres.find(g => g.genreId === genreId)?.genreName || genreId,
        year,
        totalMinutes: stats.totalMinutes,
        playCount: stats.playCount
      });

      if (stats.totalMinutes > topYearMinutes) {
        topYearMinutes = stats.totalMinutes;
        topYearPlayCount = stats.playCount;
        topYear = year;
      }
      
      // Track minutes in discovered year
      if (year === discoveredYear) {
        discoveredYearMinutes = stats.totalMinutes;
      }
    }

    // Sort yearly stats by year
    yearlyStats.sort((a, b) => a.year - b.year);

    result.set(genreId, {
      genreId,
      genreName: discoveryData.genres.find(g => g.genreId === genreId)?.genreName || genreId,
      topYear,
      topYearMinutes,
      topYearPlayCount,
      discoveredYear,
      discoveredYearMinutes,
      yearlyStats
    });
  }

  return result;
}