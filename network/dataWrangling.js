/**
 * Spotify Data Wrangling Functions
 * Extrahiert aus dem Observable Notebook für Website-Nutzung
 */

// ============================================
// SPOTIFY API FUNKTIONEN
// ============================================

/**
 * Holt einen neuen Spotify Access Token
 * @returns {Promise<string>} Bearer Token
 */
async function getSpotifyToken() {
  const clientId = '0d00211b45094412aa9b8207af9ab2ff';
  const clientSecret = '9c230d9ec1c447ba8f4b72004cb95c2a';
  
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
    },
    body: 'grant_type=client_credentials'
  });
  
  const data = await response.json();
  return `Bearer ${data.access_token}`;
}

/**
 * Sucht einen Artist in der Spotify API
 * @param {string} artistName - Name des Artists
 * @param {string} spotifyToken - Bearer Token
 * @returns {Promise<Object|null>} Artist Infos oder null
 */
async function searchArtist(artistName, spotifyToken) {
  if (!artistName || artistName.trim() === '') return null;
  
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`, 
      {
        headers: {
          'Authorization': spotifyToken
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.artists && data.artists.items && data.artists.items.length > 0) {
      const artist = data.artists.items[0];
      return {
        id: artist.id,
        name: artist.name,
        genres: artist.genres,
        popularity: artist.popularity,
        followers: artist.followers.total,
        external_urls: artist.external_urls
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error searching for artist "${artistName}":`, error);
    return null;
  }
}

/**
 * Holt Artist IDs und Genres für alle unique Artists
 * @param {string[]} uniqueArtists - Array von Artist-Namen
 * @param {string} spotifyToken - Bearer Token
 * @returns {Promise<Object[]>} Artists mit IDs und Genres
 */
async function getArtistIds(uniqueArtists, spotifyToken) {
  const artistsWithIds = [];
  const batchSize = 5;
  
  for (let i = 0; i < uniqueArtists.length; i += batchSize) { 
    const batch = uniqueArtists.slice(i, i + batchSize);
    
    const promises = batch.map(async (artistName) => {
      const artistInfo = await searchArtist(artistName, spotifyToken);
      return {
        originalName: artistName,
        ...artistInfo
      };
    });
    
    const results = await Promise.all(promises);
    artistsWithIds.push(...results);
    
    // Pause zwischen Batches um Rate Limiting zu vermeiden
    if (i + batchSize < uniqueArtists.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return artistsWithIds.filter(artist => artist.id);
}

// ============================================
// ARTIST ANALYSE FUNKTIONEN
// ============================================

/**
 * Extrahiert alle Artists mit ihren Songs aus den Daten
 * @param {Object[]} data - Spotify Streaming History
 * @returns {Object[]} Array von Artists mit Songs
 */
function getArtists(data) {
  return Array.from(
    data.reduce((acc, d) => {
      const artist = d.master_metadata_album_artist_name;
      const song = d.master_metadata_track_name;
      const date = d.ts;
      if (!artist || !song) return acc;
      if (!acc.has(artist)) acc.set(artist, []);
      acc.get(artist).push({ title: song, date });
      return acc;
    }, new Map()),
    ([artist, songs]) => ({ artist, songs })
  );
}

/**
 * Extrahiert unique Artist-Namen aus den Daten
 * @param {Object[]} data - Spotify Streaming History
 * @returns {string[]} Array von unique Artist-Namen
 */
function getUniqueArtists(data) {
  return Array.from(
    data.reduce((set, d) => {
      const artist = d?.master_metadata_album_artist_name?.trim();
      const track = d?.master_metadata_track_name?.trim();
      if (!artist || !track) return set;
      set.add(artist);
      return set;
    }, new Set())
  );
}

/**
 * Analysiert Songs pro Artist
 * @param {Object[]} artists - Array von Artist-Objekten
 * @param {Object[]} data - Spotify Streaming History
 * @returns {Object[]} Artist Song Analyse
 */
function getArtistSongsAnalysis(artists, data) {
  return artists.map(artistObj => {
    const artistName = artistObj.artist;
    const artistTracks = data.filter(track => 
      track.master_metadata_album_artist_name === artistName
    );
    const songStats = {};
    
    artistTracks.forEach(track => {
      const songTitle = track.master_metadata_track_name;
      if (!songStats[songTitle]) {
        songStats[songTitle] = {
          title: songTitle,
          playCount: 0,
          totalListenTime: 0,
          dates: []
        };
      }
      songStats[songTitle].playCount += 1;
      songStats[songTitle].totalListenTime += track.ms_played / 1000 / 60;
      songStats[songTitle].dates.push(new Date(track.ts));
    });
    
    const topSongs = Object.values(songStats)
      .sort((a, b) => b.playCount - a.playCount);
    
    return {
      artist: artistName,
      totalSongs: topSongs.length,
      totalPlays: artistTracks.length,
      topSongs: topSongs
    };
  }).sort((a, b) => b.totalPlays - a.totalPlays);
}

// ============================================
// GENRE ANALYSE FUNKTIONEN
// ============================================

/**
 * Analysiert Genres basierend auf Artists mit Genres
 * @param {Object[]} artistsWithGenres - Artists mit Genre-Informationen
 * @returns {Object} Genre Analyse Objekt
 */
function getGenreAnalysis(artistsWithGenres) {
  const genreCounts = {};
  const artistGenreMap = {};
  
  artistsWithGenres.forEach(artist => {
    if (artist && artist.genres && artist.genres.length > 0) {
      artistGenreMap[artist.originalName] = artist.genres;
      artist.genres.forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    }
  });
  
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([genre, count]) => ({
      genre, 
      count,
      percentage: ((count / artistsWithGenres.length) * 100).toFixed(1)
    }));
  
  return { 
    genreCounts, 
    artistGenreMap, 
    topGenres, 
    totalArtists: artistsWithGenres.length, 
    totalGenres: Object.keys(genreCounts).length 
  };
}

/**
 * Erstellt Plot-Daten für Genres mit Hörzeit
 * @param {Object[]} data - Spotify Streaming History
 * @param {Object} genreAnalysis - Genre Analyse Objekt
 * @returns {Object[]} Genre Plot Daten
 */
function getGenrePlotData(data, genreAnalysis) {
  const enrichedData = data.map(track => {
    const artistName = track.master_metadata_album_artist_name;
    const genres = genreAnalysis.artistGenreMap[artistName] || [];
    
    return {
      ...track,
      genres: genres,
      primaryGenre: genres[0] || null,
      listenTime: track.ms_played / 1000 / 60
    };
  });
  
  const genreListenTime = {};
  const genreTrackCount = {};
  
  enrichedData.forEach(track => {
    if (track.genres && track.genres.length > 0) {
      track.genres.forEach(genre => {
        if (genre && 
            genre.toLowerCase() !== 'unknown' && 
            genre.toLowerCase() !== 'other' &&
            genre.toLowerCase() !== '' &&
            genre.trim().length > 0) {
          genreListenTime[genre] = (genreListenTime[genre] || 0) + track.listenTime;
          genreTrackCount[genre] = (genreTrackCount[genre] || 0) + 1;
        }
      });
    }
  });
  
  return Object.entries(genreListenTime)
    .map(([genre, totalMinutes]) => ({
      genre,
      totalHours: totalMinutes / 60,
      trackCount: genreTrackCount[genre],
      avgMinutesPerTrack: totalMinutes / genreTrackCount[genre]
    }))
    .sort((a, b) => b.totalHours - a.totalHours)
    .slice(0, 15);
}

/**
 * Erstellt Artist-Genre Tabelle mit Stats
 * @param {Object[]} data - Spotify Streaming History
 * @param {Object[]} artistsWithGenres - Artists mit Genre-Informationen
 * @returns {Object[]} Artist Genre Tabelle
 */
function getArtistGenreTable(data, artistsWithGenres) {
  const artistStats = {};
  
  // Berechne Stats pro Künstler
  data.forEach(track => {
    const artistName = track.master_metadata_album_artist_name;
    if (!artistStats[artistName]) {
      artistStats[artistName] = { totalTracks: 0, totalListenTime: 0 };
    }
    artistStats[artistName].totalTracks += 1;
    artistStats[artistName].totalListenTime += track.ms_played / 1000 / 60;
  });
  
  // Kombiniere mit Genre-Daten
  return artistsWithGenres
    .filter(artist => artist.genres && artist.genres.length > 0)
    .map(artist => ({
      name: artist.originalName,
      genres: artist.genres,
      primaryGenre: artist.genres[0],
      genreCount: artist.genres.length,
      popularity: artist.popularity || 0,
      followers: artist.followers || 0,
      totalTracks: artistStats[artist.originalName]?.totalTracks || 0,
      totalHours: (artistStats[artist.originalName]?.totalListenTime || 0) / 60
    }))
    .sort((a, b) => b.totalHours - a.totalHours);
}

/**
 * Berechnet Genre-Verbindungen für Arc-Diagramme
 * @param {Object[]} data - Spotify Streaming History
 * @param {Object[]} artistsWithGenres - Artists mit Genre-Informationen
 * @returns {Object} Genre Connections mit links, nodes und aggregated
 */
function getGenreConnections(data, artistsWithGenres) {
  const connections = [];
  const genreSet = new Set();
  
  // Berechne Track-Count pro Artist
  const artistTrackCount = {};
  data.forEach(track => {
    const artist = track.master_metadata_album_artist_name;
    artistTrackCount[artist] = (artistTrackCount[artist] || 0) + 1;
  });
  
  // Für jeden Artist mit mehreren Genres
  artistsWithGenres.forEach(artist => {
    if (artist && artist.genres && artist.genres.length >= 2) {
      const genres = artist.genres;
      const artistName = artist.originalName || artist.name;
      const trackCount = artistTrackCount[artistName] || 0;
      
      // Erstelle alle Genre-Paare für diesen Artist
      for (let i = 0; i < genres.length; i++) {
        for (let j = i + 1; j < genres.length; j++) {
          const genre1 = genres[i];
          const genre2 = genres[j];
          
          // Sortiere die Genres alphabetisch für konsistente Verbindungen
          const [source, target] = [genre1, genre2].sort();
          
          genreSet.add(source);
          genreSet.add(target);
          
          connections.push({
            source,
            target,
            artist: artistName,
            popularity: artist.popularity || 0,
            trackCount: trackCount,
            allGenres: genres.join(", ")
          });
        }
      }
    }
  });
  
  // Zähle Verbindungen zwischen Genre-Paaren
  const connectionCounts = {};
  connections.forEach(conn => {
    const key = `${conn.source}|${conn.target}`;
    if (!connectionCounts[key]) {
      connectionCounts[key] = {
        source: conn.source,
        target: conn.target,
        count: 0,
        artists: []
      };
    }
    connectionCounts[key].count++;
    connectionCounts[key].artists.push(conn.artist);
  });
  
  return {
    links: connections,
    nodes: Array.from(genreSet).map(genre => ({ id: genre })),
    aggregated: Object.values(connectionCounts)
  };
}

/**
 * Holt die Top Genres nach Anzahl der Verbindungen
 * @param {Object} genreConnections - Genre Connections Objekt
 * @param {number} limit - Anzahl der Top Genres (default: 30)
 * @returns {string[]} Array der Top Genre-Namen
 */
function getTopGenres(genreConnections, limit = 30) {
  return Array.from(new Set([
    ...genreConnections.links.map(l => l.source),
    ...genreConnections.links.map(l => l.target)
  ]))
    .map(genre => ({
      genre,
      connectionCount: genreConnections.links.filter(l => 
        l.source === genre || l.target === genre
      ).length
    }))
    .sort((a, b) => b.connectionCount - a.connectionCount)
    .slice(0, limit)
    .map(d => d.genre);
}

/**
 * Filtert Connections auf Top Genres
 * @param {Object} genreConnections - Genre Connections Objekt
 * @param {string[]} topGenres - Array der Top Genre-Namen
 * @returns {Object[]} Gefilterte Connections
 */
function getFilteredConnections(genreConnections, topGenres) {
  return genreConnections.links.filter(link => 
    topGenres.includes(link.source) && topGenres.includes(link.target)
  );
}

/**
 * Erstellt Genre Nodes für Visualisierungen
 * @param {string[]} topGenres - Array der Top Genre-Namen
 * @returns {Object[]} Genre Nodes mit id und index
 */
function getGenreNodes(topGenres) {
  return topGenres.map((genre, index) => ({
    id: genre,
    index: index
  }));
}

// ============================================
// ZEIT ANALYSE FUNKTIONEN
// ============================================

/**
 * Analysiert Hörverhalten nach Tageszeit (24h)
 * @param {Object[]} data - Spotify Streaming History
 * @returns {Object[]} Stündliche Analyse
 */
function getTimeAnalysis(data) {
  const hourlyData = Array.from({length: 24}, (_, hour) => ({
    hour: hour,
    hourLabel: `${hour.toString().padStart(2, '0')}:00`,
    trackCount: 0,
    totalMinutes: 0,
    uniqueSongs: new Set()
  }));
  
  data.forEach(track => {
    const date = new Date(track.ts);
    const hour = date.getHours();
    
    hourlyData[hour].trackCount += 1;
    hourlyData[hour].totalMinutes += track.ms_played / 1000 / 60;
    hourlyData[hour].uniqueSongs.add(track.master_metadata_track_name);
  });
  
  return hourlyData.map(h => ({
    ...h,
    uniqueSongs: h.uniqueSongs.size,
    avgMinutesPerTrack: h.trackCount > 0 ? h.totalMinutes / h.trackCount : 0,
    intensity: h.totalMinutes
  }));
}

/**
 * Analysiert Hörverhalten nach Tag und Monat
 * @param {Object[]} data - Spotify Streaming History
 * @returns {Object} Jahr Analyse mit daily, monthly Arrays und Stats
 */
function getYearAnalysis(data) {
  const dailyData = new Map();
  const monthlyData = new Map();
  
  data.forEach(track => {
    const date = new Date(track.ts);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const monthStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`; // YYYY-MM
    
    // Tägliche Daten
    if (!dailyData.has(dateStr)) {
      dailyData.set(dateStr, {
        date: date,
        dateStr: dateStr,
        trackCount: 0,
        totalMinutes: 0,
        uniqueSongs: new Set(),
        uniqueArtists: new Set(),
        dayOfWeek: date.getDay(),
        dayName: date.toLocaleDateString('de-DE', { weekday: 'short' }),
        month: date.getMonth() + 1,
        monthName: date.toLocaleDateString('de-DE', { month: 'short' }),
        dayOfYear: Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000)
      });
    }
    
    const dayData = dailyData.get(dateStr);
    dayData.trackCount += 1;
    dayData.totalMinutes += track.ms_played / 1000 / 60;
    dayData.uniqueSongs.add(track.master_metadata_track_name);
    dayData.uniqueArtists.add(track.master_metadata_album_artist_name);
    
    // Monatliche Daten
    if (!monthlyData.has(monthStr)) {
      monthlyData.set(monthStr, {
        month: date.getMonth() + 1,
        monthName: date.toLocaleDateString('de-DE', { month: 'long' }),
        year: date.getFullYear(),
        monthStr: monthStr,
        trackCount: 0,
        totalMinutes: 0,
        uniqueSongs: new Set(),
        uniqueArtists: new Set(),
        daysActive: new Set()
      });
    }
    
    const monthData = monthlyData.get(monthStr);
    monthData.trackCount += 1;
    monthData.totalMinutes += track.ms_played / 1000 / 60;
    monthData.uniqueSongs.add(track.master_metadata_track_name);
    monthData.uniqueArtists.add(track.master_metadata_album_artist_name);
    monthData.daysActive.add(dateStr);
  });
  
  // Konvertiere Maps zu Arrays und berechne zusätzliche Metriken
  const dailyArray = Array.from(dailyData.values()).map(d => ({
    ...d,
    uniqueSongs: d.uniqueSongs.size,
    uniqueArtists: d.uniqueArtists.size,
    avgMinutesPerTrack: d.trackCount > 0 ? d.totalMinutes / d.trackCount : 0,
    intensity: d.totalMinutes
  })).sort((a, b) => a.date - b.date);
  
  const monthlyArray = Array.from(monthlyData.values()).map(d => ({
    ...d,
    uniqueSongs: d.uniqueSongs.size,
    uniqueArtists: d.uniqueArtists.size,
    daysActive: d.daysActive.size,
    avgMinutesPerDay: d.totalMinutes / d.daysActive.size,
    avgTracksPerDay: d.trackCount / d.daysActive.size,
    intensity: d.totalMinutes
  })).sort((a, b) => `${a.year}-${a.month}`.localeCompare(`${b.year}-${b.month}`));
  
  return {
    daily: dailyArray,
    monthly: monthlyArray,
    totalDays: dailyArray.length,
    dateRange: {
      start: dailyArray[0]?.date,
      end: dailyArray[dailyArray.length - 1]?.date
    },
    stats: {
      avgTracksPerDay: dailyArray.reduce((sum, d) => sum + d.trackCount, 0) / dailyArray.length,
      maxTracksDay: dailyArray.reduce((max, d) => d.trackCount > max.trackCount ? d : max, dailyArray[0]),
      avgMinutesPerDay: dailyArray.reduce((sum, d) => sum + d.totalMinutes, 0) / dailyArray.length
    }
  };
}

/**
 * Filtert tägliche Daten nach Anzahl der Tage
 * @param {Object[]} dailyAnalysis - Tägliche Analyse Daten
 * @param {number} numDays - Anzahl der Tage
 * @returns {Object[]} Gefilterte tägliche Daten
 */
function getFilteredDailyData(dailyAnalysis, numDays) {
  return dailyAnalysis
    .slice(0, Math.min(numDays, dailyAnalysis.length))
    .sort((a, b) => new Date(a.dateStr) - new Date(b.dateStr));
}

// ============================================
// DATEN LADEN FUNKTIONEN
// ============================================

/**
 * Lädt alle JSON Dateien und kombiniert sie
 * @param {string[]} filePaths - Array von Dateipfaden zu den JSON Files
 * @returns {Promise<Object[]>} Kombinierte Streaming History
 */
async function loadAllData(filePaths) {
  const allData = [];
  
  for (const filePath of filePaths) {
    try {
      const response = await fetch(filePath);
      const data = await response.json();
      allData.push(...data);
    } catch (error) {
      console.error(`Error loading ${filePath}:`, error);
    }
  }
  
  return allData;
}

/**
 * Erstellt Dataset-Objekte aus den geladenen Daten
 * @param {Object} dataFiles - Objekt mit Dateinamen als Keys und Daten als Values
 * @returns {Object[]} Array von Dataset-Objekten
 */
function createDatasets(dataFiles) {
  const datasetConfigs = [
    { id: "2018_2020_0", name: "2018-2020", key: "streaming_history_audio_20182020_0", period: "Sep 2018 - Dez 2020" },
    { id: "2020_2021_1", name: "2020-2021", key: "streaming_history_audio_20202021_1", period: "Jan 2020 - Dez 2021" },
    { id: "2021_2", name: "2021 (Teil 2)", key: "streaming_history_audio_2021_2", period: "2021" },
    { id: "2021_3", name: "2021 (Teil 3)", key: "streaming_history_audio_2021_3", period: "2021" },
    { id: "2021_2022_4", name: "2021-2022", key: "streaming_history_audio_20212022_4", period: "2021 - 2022" },
    { id: "2022_5", name: "2022 (Teil 5)", key: "streaming_history_audio_2022_5", period: "2022" },
    { id: "2022_2023_6", name: "2022-2023", key: "streaming_history_audio_20222023_6", period: "2022 - 2023" },
    { id: "2023_7", name: "2023 (Teil 7)", key: "streaming_history_audio_2023_7", period: "2023" },
    { id: "2023_2024_8", name: "2023-2024", key: "streaming_history_audio_20232024_8", period: "2023 - 2024" },
    { id: "2024_9", name: "2024 (Teil 9)", key: "streaming_history_audio_2024_9", period: "2024" },
    { id: "2024_2025_10", name: "2024-2025", key: "streaming_history_audio_20242025_10", period: "2024 - 2025" },
    { id: "2025_11", name: "2025 (Aktuell)", key: "streaming_history_audio_2025_11", period: "2025" }
  ];
  
  return datasetConfigs
    .filter(config => dataFiles[config.key])
    .map(config => ({
      id: config.id,
      name: config.name,
      data: dataFiles[config.key],
      period: config.period
    }));
}

// ============================================
// EXPORT FÜR WEBSITE
// ============================================

export {
  // Spotify API
  getSpotifyToken,
  searchArtist,
  getArtistIds,
  
  // Artist Analyse
  getArtists,
  getUniqueArtists,
  getArtistSongsAnalysis,
  
  // Genre Analyse
  getGenreAnalysis,
  getGenrePlotData,
  getArtistGenreTable,
  getGenreConnections,
  getTopGenres,
  getFilteredConnections,
  getGenreNodes,
  
  // Zeit Analyse
  getTimeAnalysis,
  getYearAnalysis,
  getFilteredDailyData,
  
  // Daten Laden
  loadAllData,
  createDatasets
};
