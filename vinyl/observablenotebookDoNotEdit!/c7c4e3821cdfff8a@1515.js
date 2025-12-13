function _1(md){return(
md`# Spotify Data-Analysis`
)}

function _2(md){return(
md`## 📦 Dataset Management`
)}

function _showDatasetManager(Inputs){return(
Inputs.toggle({
  label: "Dataset-Übersicht anzeigen",
  value: false
})
)}

function _4(showDatasetManager,md,datasets,html)
{
  if (!showDatasetManager) return md``;
  
  const tableHTML = `
    <style>
      .dataset-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .dataset-table th {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px;
        text-align: left;
        font-weight: 600;
      }
      .dataset-table td {
        padding: 12px 15px;
        border-bottom: 1px solid #f0f0f0;
      }
      .dataset-table tr:last-child td {
        border-bottom: none;
      }
      .dataset-table tr:hover {
        background: #f8f9fa;
      }
      .badge {
        display: inline-block;
        padding: 4px 12px;
        background: #e3f2fd;
        color: #1976d2;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }
      .track-count {
        font-weight: 600;
        color: #667eea;
      }
    </style>
    <table class="dataset-table">
      <thead>
        <tr>
          <th>📂 Dataset Name</th>
          <th>📅 Zeitraum</th>
          <th>🎵 Tracks</th>
          <th>💾 Status</th>
        </tr>
      </thead>
      <tbody>
        ${datasets.map(ds => `
          <tr>
            <td><strong>${ds.name}</strong></td>
            <td>${ds.period}</td>
            <td class="track-count">${ds.data.length.toLocaleString()}</td>
            <td><span class="badge">✓ Geladen</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #667eea;">
      <strong>📊 Gesamt:</strong> ${datasets.length} Datasets · 
      ${datasets.reduce((sum, ds) => sum + ds.data.length, 0).toLocaleString()} Total Tracks
    </div>
  `;
  
  return html`${tableHTML}`;
}


function _5(md){return(
md`# Datawrangling`
)}

function _datasets(streaming_history_audio_20182020_0,streaming_history_audio_20202021_1,streaming_history_audio_2021_2,streaming_history_audio_2021_3,streaming_history_audio_20212022_4,streaming_history_audio_2022_5,streaming_history_audio_20222023_6,streaming_history_audio_2023_7,streaming_history_audio_20232024_8,streaming_history_audio_2024_9,streaming_history_audio_20242025_10,streaming_history_audio_2025_11){return(
[
  { 
    id: "2018_2020_0",
    name: "2018-2020", 
    data: streaming_history_audio_20182020_0,
    period: "Sep 2018 - Dez 2020"
  },
  { 
    id: "2020_2021_1",
    name: "2020-2021", 
    data: streaming_history_audio_20202021_1,
    period: "Jan 2020 - Dez 2021"
  },
  { 
    id: "2021_2",
    name: "2021 (Teil 2)", 
    data: streaming_history_audio_2021_2,
    period: "2021"
  },
  { 
    id: "2021_3",
    name: "2021 (Teil 3)", 
    data: streaming_history_audio_2021_3,
    period: "2021"
  },
  { 
    id: "2021_2022_4",
    name: "2021-2022", 
    data: streaming_history_audio_20212022_4,
    period: "2021 - 2022"
  },
  { 
    id: "2022_5",
    name: "2022 (Teil 5)", 
    data: streaming_history_audio_2022_5,
    period: "2022"
  },
  { 
    id: "2022_2023_6",
    name: "2022-2023", 
    data: streaming_history_audio_20222023_6,
    period: "2022 - 2023"
  },
  { 
    id: "2023_7",
    name: "2023 (Teil 7)", 
    data: streaming_history_audio_2023_7,
    period: "2023"
  },
  { 
    id: "2023_2024_8",
    name: "2023-2024", 
    data: streaming_history_audio_20232024_8,
    period: "2023 - 2024"
  },
  { 
    id: "2024_9",
    name: "2024 (Teil 9)", 
    data: streaming_history_audio_2024_9,
    period: "2024"
  },
  { 
    id: "2024_2025_10",
    name: "2024-2025", 
    data: streaming_history_audio_20242025_10,
    period: "2024 - 2025"
  },
  { 
    id: "2025_11",
    name: "2025 (Aktuell)", 
    data: streaming_history_audio_2025_11,
    period: "2025"
  }
]
)}

function _data(selectedDataset){return(
selectedDataset.data
)}

function _8(md){return(
md`## Artist analysis`
)}

function _artistSongsAnalysis(artists,data)
{
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


function _10(md){return(
md`Hier werden jetzt die einzelnen artists auf die von mir gehörten top songs, total songs und total plays analysiert.`
)}

function _artists(data){return(
Array.from(
  data.reduce((acc, d) => {
    const artist = d.master_metadata_album_artist_name
    const song = d.master_metadata_track_name
    const date = d.ts
    if (!artist || !song) return acc
    if (!acc.has(artist)) acc.set(artist, [])
    acc.get(artist).push({ title: song, date })
    return acc
  }, new Map()),
  ([artist, songs]) => ({ artist, songs })
)
)}

function _12(md){return(
md`Hier erstelle ich ein Array, welches alle Artists als Objekte speichert. Das Objekt enthält dann ein weiters Array, worin sich die gehörten Songs und Zeitpunkt des Hörens befinden.
Der nächste schritt ist jetzt die Artist IDs herauszufinden, um dann, mithilfe der Spotify Api, die Artists nach genre zu sortieren.`
)}

function _uniqueArtists(data){return(
Array.from(
  data.reduce((set, d) => {
    const artist = d?.master_metadata_album_artist_name?.trim()
    const track = d?.master_metadata_track_name?.trim()
    if (!artist || !track) return set 
    set.add(artist)
    return set
  }, new Set()),
)
)}

function _14(md){return(
md`Hier habe ich für darauf folgende funktionen ein Array aus den unique Artists erstellt.
Darauf folgt jetzt die einbindung der spotify Api. Ich verwende sie, da die eingespeisten daten von Spotify, wichtige infos wie Artist ID und Genres, nicht enthalten.
Ich hatte zu erst gedacht dass ich in observable mit der Api nicht weit komme, aber es hat alles super funktioniert.`
)}

function _15(md){return(
md`## Spotify Api`
)}

async function _spotifyToken(refreshTokenButton)
{
  refreshTokenButton; // Trigger re-execution when button is clicked
  
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


function _refreshTokenButton(Inputs,html)
{
  const button = Inputs.button("🔄 Spotify Token erneuern");
  
  const container = html`<div style="
    margin: 20px 0;
    padding: 20px;
    background: linear-gradient(135deg, #1DB954 0%, #1ed760 100%);
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(29, 185, 84, 0.3);
  ">
    <style>
      .token-refresh button {
        background: white !important;
        color: #1DB954 !important;
        border: none !important;
        padding: 12px 24px !important;
        border-radius: 24px !important;
        font-weight: 600 !important;
        font-size: 16px !important;
        cursor: pointer !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
        transition: all 0.2s !important;
      }
      
      .token-refresh button:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25) !important;
      }
      
      .token-info {
        color: white;
        margin-bottom: 12px;
        font-size: 14px;
      }
    </style>
    
    <div class="token-refresh">
      <div class="token-info">
        💡 Token läuft nach 1 Stunde ab. Klicke auf den Button um einen neuen zu generieren.
      </div>
      ${button}
    </div>
  </div>`;
  
  return container;
}


function _18(md){return(
md`Hier wird der Spotify Token automatisch generiert, da man sonst stündlich den Token ändern müsste.`
)}

function _searchArtist(spotifyToken){return(
async function(artistName) {
  if (!artistName || artistName.trim() === '') return null;
  
  try {
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`, {
      headers: {
        'Authorization': spotifyToken
      }
    });
    
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
)}

function _getArtistIds(uniqueArtists,searchArtist){return(
async function() {
  const artistsWithIds = [];
  const batchSize = 5; // Kleinere Batches für Observable
  
  for (let i = 0; i < Math.min(uniqueArtists.length); i += batchSize) { 
    const batch = uniqueArtists.slice(i, i + batchSize);
    
    const promises = batch.map(async (artistName) => {
      const artistInfo = await searchArtist(artistName);
      return {
        originalName: artistName,
        ...artistInfo
      };
    });
    
    const results = await Promise.all(promises);
    artistsWithIds.push(...results);
    
    // Pause zwischen Batches
    if (i + batchSize < uniqueArtists.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return artistsWithIds.filter(artist => artist.id);
}
)}

function _21(md){return(
md`Mithilfe dieser 2 funktionen wird das unten erstellte Array mit Artist Infos gefüllt.
-> gewünschte infos wie id und genres werden durch die spotify Api bezogen.
Einziges "problem": nicht jeder artist hat ein genre angegeben also kann es passieren, dass das Genre Array leer ist.
Witzig zu sehen wie viele Artists kein Genre angegeben haben`
)}

function _22(md){return(
md`## Genre analysis`
)}

async function _artistsWithGenres(getArtistIds){return(
await getArtistIds()
)}

function _genreAnalysis(artistsWithGenres)
{
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
      genre, count,
      percentage: ((count / artistsWithGenres.length) * 100).toFixed(1)
    }));
  
  return { genreCounts, artistGenreMap, topGenres, 
          totalArtists: artistsWithGenres.length, 
          totalGenres: Object.keys(genreCounts).length };
}


function _25(md){return(
md`Hier ertselle ich eine genre analyse die es mir später zb ermöglicht die anzahl an songs pro Genre anzuzeigen.`
)}

function _genrePlotData(data,genreAnalysis)
{
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


function _artistGenreTable(data,artistsWithGenres)
{
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


function _genreConnections(data,artistsWithGenres)
{
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


function _topGenres(genreConnections){return(
Array.from(new Set([
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
  .slice(0, 30)
  .map(d => d.genre)
)}

function _filteredConnections(genreConnections,topGenres){return(
genreConnections.links.filter(link => 
  topGenres.includes(link.source) && topGenres.includes(link.target)
)
)}

function _genreNodes(topGenres){return(
topGenres.map((genre, index) => ({
  id: genre,
  index: index
}))
)}

function _32(md){return(
md`## Time analysis`
)}

function _timeAnalysis(data)
{
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


function _yearAnalysis(data)
{
  // Analysiere Tracks nach Datum - täglich und monatlich
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


function _daily_analysis(yearAnalysis){return(
yearAnalysis.daily
)}

function _filteredDailyData(daily_analysis,daySlider){return(
daily_analysis
  .slice(0, Math.min(daySlider, daily_analysis.length))
  .sort((a, b) => new Date(a.dateStr) - new Date(b.dateStr))
)}

function _selectedDataset(Inputs,datasets){return(
Inputs.select(
  datasets,
  {
    label: "Aktives Dataset",
    format: d => `${d.name} (${d.data.length.toLocaleString()} Tracks)`,
    value: datasets[datasets.length - 1] // Letztes Dataset als Default
  }
)
)}

function _38(selectedDataset,data,md){return(
md`<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; color: white; margin: 20px 0;">
  <h3 style="margin: 0 0 10px 0;">📊 Aktives Dataset</h3>
  <p style="margin: 0; font-size: 16px; opacity: 0.9;">
    <strong>${selectedDataset.name}</strong> · ${data.length.toLocaleString()} Tracks
  </p>
</div>\``
)}

function _39(md){return(
md`# Visualisierungen`
)}

function _40(md){return(
md`## 🎭 Arc-Diagramm: Genre-Verbindungen

Dieses Arc-Diagramm zeigt Verbindungen zwischen Genres. Wenn ein Artist mehrere Genres hat, entsteht eine Verbindung. 
Bewege die Maus über die Bögen um zu sehen, welcher Artist diese Genres verbindet!`
)}

function _41(Plot,width,filteredConnections,genreNodes){return(
Plot.plot({
  width,
  height: 1400,
  marginLeft: 180,
  marginRight: 100,
  marginTop: 40,
  marginBottom: 40,
  axis: null,
  x: { domain: [0, 1] },
  color: {
    type: "log",
    scheme: "YlGn",
    legend: true,
    label: "Track Count"
  },
  marks: [
    // Arc-Verbindungen (zuerst, damit sie im Hintergrund sind)
    Plot.arrow(filteredConnections, {
      x: 0,
      y1: d => genreNodes.find(n => n.id === d.source)?.index,
      y2: d => genreNodes.find(n => n.id === d.target)?.index,
      sweep: "-y",
      bend: 90,
      headLength: 0,
      stroke: "trackCount",
      strokeOpacity: 0.6,
      strokeWidth: d => Math.max(1, Math.min(4, d.trackCount / 50)),
      title: d => `Artist: ${d.artist}\nTracks: ${d.trackCount}\n${d.source} ↔ ${d.target}\n\nAlle Genres: ${d.allGenres}`
    }),
    
    // Genre-Punkte auf der linken Seite
    Plot.dot(genreNodes, {
      x: 0,
      y: "index",
      r: 6,
      fill: "steelblue"
    }),
    
    // Genre-Labels
    Plot.text(genreNodes, {
      x: 0,
      y: "index",
      text: "id",
      textAnchor: "end",
      dx: -12,
      fontSize: 11,
      fill: "black"
    })
  ]
})
)}

function _42(md){return(
md`### 📊 Total Trackcount per Genre

Dieser Chart zeigt die **Gesamtanzahl** der gespielten Tracks pro Genre. Je höher der Balken, desto mehr einzelne Songs wurden in diesem Genre gehört. Hovere über die Balken um die genaue Anzahl zu sehen!`
)}

function _43(Plot,width,genrePlotData){return(
Plot.plot({
  color: {scheme: "YlGnBu"},
  height: 600,
  x: {label: "Genre", tickRotate: -45},
  width,
  marginLeft: 60,
  marginBottom: 100,
  title: "Total Trackcount per Genre",
  marks: [
    Plot.barY(genrePlotData, {
      x: "genre",
      y: "trackCount",
      fill: "trackCount",
      tip: true
    })
  ]
})
)}

function _44(md){return(
md`## 🎭 Genre-Analyse

Diese Charts zeigen deine musikalischen Vorlieben nach Genres. `
)}

function _45(Plot,genrePlotData){return(
Plot.plot({
  title: "Top Genres nach Hörzeit",
  x: { label: "Genre",tickRotate: -45 },
  y: { label: "Hörzeit (Stunden)"},
  marginBottom: 100,
  marginTop: 80,
  width: 1000,
  height: 700,
  marks: [
    Plot.barY(genrePlotData, {
      x: "genre", 
      y: "totalHours", 
      fill: "genre",
      tip: true
    }),
    Plot.text(genrePlotData, {
      x: "genre",
      y: "totalHours", 
      text: d => d.totalHours.toFixed(0) + "h",
      dy: -5
    })
  ]
})
)}

function _46(md){return(
md`## 🎵 Meistgespielte Songs

Dieses Diagramm zeigt die Top 3 Songs der 5 meistgehörten Artists. Die Größe der Punkte entspricht der Anzahl der Wiedergaben - je größer der Punkt, desto öfter wurde der Song gespielt!

**Legende:**
- 🎨 Farbe = Artist
- 📏 Größe = Anzahl Wiedergaben
- 📊 Y-Achse = Play Count`
)}

function _47(Plot,artistSongsAnalysis){return(
Plot.plot({
  width: 1000,
  height: 1000,
  marginBottom: 200,
  marginTop: 40,
  x: { label: "Songs", tickRotate: -45 },
  y: { label: "Wiedergaben" },
  marks: [
    Plot.dot(
      artistSongsAnalysis.slice(0, 5).flatMap(artist => 
        artist.topSongs.slice(0, 3).map(song => ({
          songLabel: `${artist.artist} - ${song.title}`,
          playCount: song.playCount,
          artist: artist.artist
        }))
      ), 
      {
        x: "songLabel",
        y: "playCount", 
        fill: "artist",
        r: "playCount",
        tip: true
      }
    )
  ],
  r: { range: [0, 20] },
})
)}

function _48(md){return(
md`Diese Funktion lässt mich den Trackcount über 24 std ermitteln.`
)}

function _49(md){return(
md`## ⏰ Trackcount über 24 Stunden

Diese Visualisierung zeigt dein Hörverhalten im Tagesverlauf. Wann hörst du die meiste Musik? 

**Interaktiv:** Bewege die Maus über die weißen Punkte um detaillierte Infos zu jeder Stunde zu sehen:
- 🎵 Anzahl gespielter Tracks
- ⏱️ Gesamte Hörzeit in Minuten
- 🎼 Anzahl verschiedener Songs

`
)}

function _50(Plot,timeAnalysis){return(
Plot.plot({
  title: "Trackcount über 24 std",
  color: {scheme: "RdPu"},
  marks: [
    Plot.rect(timeAnalysis, {
      x1: d => d.hour - 0.3,
      x2: d => d.hour + 0.3,
      y1: 0,
      y2: "trackCount",
      fill: "hour",
      rx: 5 // Abgerundete Ecken
    }),
    Plot.dot(timeAnalysis, {
      x: "hour",
      y: d => d.trackCount + 0.5,
      r: 4,
      fill: "white",
      stroke: "black",
      title: d => `🕐 ${d.hourLabel}\n🎵 ${d.trackCount} Tracks\n⏱️ ${d.totalMinutes.toFixed(0)} Minuten\n🎼 ${d.uniqueSongs} verschiedene Songs`
    })
  ]
})
)}

function _51(md){return(
md`## Interaktive Tages-Ansicht
Bewege den Slider um die Musik-Statistiken für jeden einzelnen Tag zu sehen.\``
)}

function _daySlider(Inputs,daily_analysis,html)
{
  const slider = Inputs.range([1, daily_analysis.length], {
    step: 1,
    value: 30
  });
  
  const container = html`<div style="
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 30px;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  ">
    <style>
      .vinyl-slider input[type="range"] {
        -webkit-appearance: none;
        width: 100%;
        height: 8px;
        border-radius: 5px;
        background: rgba(255,255,255,0.3);
        outline: none;
        margin: 20px 0;
      }
      
      .vinyl-slider input[type="range"]::-webkit-slider-runnable-track {
        background: rgba(255,255,255,0.3);
        height: 8px;
        border-radius: 5px;
      }
      
      .vinyl-slider input[type="range"]::-moz-range-track {
        background: rgba(255,255,255,0.3);
        height: 8px;
        border-radius: 5px;
      }
      
      .vinyl-slider input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: 
          radial-gradient(circle at center, #000 20%, transparent 20%),
          repeating-radial-gradient(circle at center, #1a1a1a 0px, #1a1a1a 2px, #000 2px, #000 4px);
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4), inset 0 0 10px rgba(255,255,255,0.1);
        border: 3px solid #333;
        transition: transform 0.2s;
      }
      
      .vinyl-slider input[type="range"]::-webkit-slider-thumb:hover {
        transform: scale(1.1) rotate(45deg);
      }
      
      .vinyl-slider input[type="range"]::-moz-range-thumb {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: 
          radial-gradient(circle at center, #000 20%, transparent 20%),
          repeating-radial-gradient(circle at center, #1a1a1a 0px, #1a1a1a 2px, #000 2px, #000 4px);
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4), inset 0 0 10px rgba(255,255,255,0.1);
        border: 3px solid #333;
        transition: transform 0.2s;
      }
      
      .vinyl-slider input[type="range"]::-moz-range-thumb:hover {
        transform: scale(1.1) rotate(45deg);
      }
      
      .slider-label {
        color: white;
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .slider-value {
        background: rgba(255,255,255,0.2);
        padding: 8px 16px;
        border-radius: 20px;
        backdrop-filter: blur(10px);
        font-size: 16px;
        color: white;
        display: inline-block;
        margin-top: 10px;
      }
    </style>
    
    <div class="vinyl-slider">
      <div class="slider-label">
        🎵 Anzahl Tage anzeigen
      </div>
      ${slider}
      <div class="slider-value">
        📅 ${slider.value} / ${daily_analysis.length} Tage
      </div>
    </div>
  </div>`;
  
  // Update value display on input
  slider.addEventListener('input', () => {
    container.querySelector('.slider-value').textContent = `📅 ${slider.value} / ${daily_analysis.length} Tage`;
  });
  
  container.value = slider.value;
  container.oninput = () => container.value = slider.value;
  Object.defineProperty(container, 'value', {
    get: () => slider.value,
    set: (v) => slider.value = v
  });
  
  return container;
}


function _53(Plot,daySlider,htl,filteredDailyData){return(
Plot.plot({
  title: `Musik over Time - Erste ${daySlider} Tage`,
  width: 1200,
  height: 500,
  marginBottom: 20,
  marginTop: 40,
  x: { 
    label: "Datum",
    ticks: [],
    tickFormat: () => ""
  },
  y: { 
    label: "Track Count",
    grid: true
  },
  marks: [
    () => htl.svg`<defs>
      <linearGradient id="gradient" gradientTransform="rotate(90)">
        <stop offset="15%" stop-color="green" />
        <stop offset="75%" stop-color="orange" />
        <stop offset="100%" stop-color="yellow" />
      </linearGradient>
    </defs>`,
    Plot.barY(filteredDailyData, {
      x: "dateStr",
      y: "trackCount",
      fill: "url(#gradient)",
      tip: true
    })
  ]
})
)}

function _54(filteredDailyData,md){return(
md`**Statistik:**
- Angezeigte Tage: ${filteredDailyData.length}
- Total Tracks: ${filteredDailyData.reduce((sum, d) => sum + d.trackCount, 0)}
- Durchschnitt pro Tag: ${(filteredDailyData.reduce((sum, d) => sum + d.trackCount, 0) / filteredDailyData.length).toFixed(1)} Tracks`
)}

function _55(Plot,daySlider,htl,filteredDailyData){return(
Plot.plot({
  title: `Musik over Time - Erste ${daySlider} Tage`,
  width: 1200,
  height: 500,
  marginBottom: 20,
  marginTop: 40,
  x: { 
    label: "Datum",
    ticks: [],
    tickFormat: () => ""
  },
  y: { 
    label: "Minutes listened",
    grid: true
  },
  marks: [
    () => htl.svg`<defs>
      <linearGradient id="gradient2" gradientTransform="rotate(90)">
        <stop offset="15%" stop-color="blue" />
        <stop offset="75%" stop-color="cyan" />
        <stop offset="100%" stop-color="white" />
      </linearGradient>
    </defs>`,
    Plot.barY(filteredDailyData, {
      x: "dateStr",
      y: "totalMinutes",
      fill: "url(#gradient2)",
      tip: true
    })
  ]
})
)}

function _56(filteredDailyData,md){return(
md`**Statistik:**
- Angezeigte Tage: ${filteredDailyData.length}
- Gesamt Zeit: ${filteredDailyData.reduce((sum, d) => sum + d.totalMinutes, 0).toFixed(0)} Minuten oder, ${(filteredDailyData.reduce((sum, d) => sum + d.totalMinutes, 0) / 60).toFixed(1)} Stunden
- Durchschnitt pro Tag: ${(filteredDailyData.reduce((sum, d) => sum + d.totalMinutes, 0) / filteredDailyData.length).toFixed(1)} Minuten oder, ${((filteredDailyData.reduce((sum, d) => sum + d.totalMinutes, 0) / filteredDailyData.length) / 60).toFixed(1)} Stunden`
)}

function _57(md){return(
md`## Eingebundene Datensets`
)}

function _streaming_history_audio_20182020_0(FileAttachment){return(
FileAttachment("Streaming_History_Audio_2018-2020_0.json").json()
)}

function _streaming_history_audio_20202021_1(FileAttachment){return(
FileAttachment("Streaming_History_Audio_2020-2021_1.json").json()
)}

function _streaming_history_audio_20212022_4(FileAttachment){return(
FileAttachment("Streaming_History_Audio_2021-2022_4.json").json()
)}

function _streaming_history_audio_2021_2(FileAttachment){return(
FileAttachment("Streaming_History_Audio_2021_2.json").json()
)}

function _streaming_history_audio_2021_3(FileAttachment){return(
FileAttachment("Streaming_History_Audio_2021_3.json").json()
)}

function _streaming_history_audio_20222023_6(FileAttachment){return(
FileAttachment("Streaming_History_Audio_2022-2023_6.json").json()
)}

function _streaming_history_audio_2022_5(FileAttachment){return(
FileAttachment("Streaming_History_Audio_2022_5.json").json()
)}

function _streaming_history_audio_20232024_8(FileAttachment){return(
FileAttachment("Streaming_History_Audio_2023-2024_8.json").json()
)}

function _streaming_history_audio_2023_7(FileAttachment){return(
FileAttachment("Streaming_History_Audio_2023_7.json").json()
)}

function _streaming_history_audio_20242025_10(FileAttachment){return(
FileAttachment("Streaming_History_Audio_2024-2025_10.json").json()
)}

function _streaming_history_audio_2024_9(FileAttachment){return(
FileAttachment("Streaming_History_Audio_2024_9.json").json()
)}

function _streaming_history_audio_2025_11(FileAttachment){return(
FileAttachment("Streaming_History_Audio_2025_11.json").json()
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["Streaming_History_Audio_2025_11.json", {url: new URL("./files/01eefe96ff45d51c049686f4197ff853e8e4802a6b90505099814f385a3024f2110aced5b4a4ce2e7451509cffc42e17c19696fa0a1bf7a6b3e9889a8983edc8.json", import.meta.url), mimeType: "application/json", toString}],
    ["Streaming_History_Audio_2021-2022_4.json", {url: new URL("./files/16c3c83f0a27c590554cce90f8e1543bdaa4278d5f366258394eef49f37d3eb3bfa7ae73a442e91342cf6cebc373e3a23915863843e4c8929bb9084e330a67d8.json", import.meta.url), mimeType: "application/json", toString}],
    ["Streaming_History_Audio_2024-2025_10.json", {url: new URL("./files/32132f88bb73b47cb3ded7a051dd9086f669d61a9f692b1996839048628305dbec8b5d3fb7378077d36e28de6ad4033be1f7707c49209728e55a184555291523.json", import.meta.url), mimeType: "application/json", toString}],
    ["Streaming_History_Audio_2021_3.json", {url: new URL("./files/4e6616b42503d3d1883aabc315e9b51d98234b5bcde50084f3112a1a3b96cb964e8227c437f70f0af8911ce5a64c1a6d97de097579d335e345acce41674087bc.json", import.meta.url), mimeType: "application/json", toString}],
    ["Streaming_History_Audio_2022_5.json", {url: new URL("./files/0cec3ebc818dc6d5b586c97b9aa5b666be59d74606781c6e6b1fc70e34117c318bdc95d76a222aff5520e1dd282f08d41a0ad7e3e887cd14ae33951b8d8982b0.json", import.meta.url), mimeType: "application/json", toString}],
    ["Streaming_History_Audio_2024_9.json", {url: new URL("./files/3be162cd7f5877e6fd0fd7228c01948d2ec488002bfb0368c46f7b746c117994024cbfcd5a981e0d671c4752559f274adc30359a0e2b6aaabc14e1d2e000d677.json", import.meta.url), mimeType: "application/json", toString}],
    ["Streaming_History_Audio_2023-2024_8.json", {url: new URL("./files/f4c84108a48537b0a30c458084bfd7c36bad229ad12489e20628d82614e6b28b27dfd1953a9eabf32b5eeccfeec7c50e9759747dc14f3c721806b6d8cc52d8f8.json", import.meta.url), mimeType: "application/json", toString}],
    ["Streaming_History_Audio_2021_2.json", {url: new URL("./files/ff8fb9276454a66f4e206c37dc815f20a588c87fc116b431123e7c87b8a2008d13e1a017f5b10e33effc54e89119ae0717ecc7f3300e9d5cba9d501daf38700d.json", import.meta.url), mimeType: "application/json", toString}],
    ["Streaming_History_Audio_2022-2023_6.json", {url: new URL("./files/15a83250a9cba71e446b0bb60ece2f6bddecea28ce43d18c60489377593c9a03615c062e76cd23a0cec588cc0c3f4e46f9b825aa9c029327720d97d947cbb3d8.json", import.meta.url), mimeType: "application/json", toString}],
    ["Streaming_History_Audio_2020-2021_1.json", {url: new URL("./files/c6417926a2554163c05aff281474e6c9447f5a2208a4b51a7ac3cd33df419c472b56a02956854879a64f9ce0c7756ca2c018d833ebe22ebf0162375e15eff0d9.json", import.meta.url), mimeType: "application/json", toString}],
    ["Streaming_History_Audio_2018-2020_0.json", {url: new URL("./files/1dc7f036a5adaf40f4948a67b126affe0718819e57c94e61d3fcfd996d688ba67c5d884e0f11fc0d4b508b2a1cb47a641eab62a35f959a11b9ac3082965f773c.json", import.meta.url), mimeType: "application/json", toString}],
    ["Streaming_History_Audio_2023_7.json", {url: new URL("./files/c68add5614367f4b2458c845008012ef5b641f99a973cee9bd7ab762cecda9ea3d99afffb7535bfb339d6f268fa0c951f3c5b80af4781880829c8564871158ff.json", import.meta.url), mimeType: "application/json", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["md"], _2);
  main.variable(observer("viewof showDatasetManager")).define("viewof showDatasetManager", ["Inputs"], _showDatasetManager);
  main.variable(observer("showDatasetManager")).define("showDatasetManager", ["Generators", "viewof showDatasetManager"], (G, _) => G.input(_));
  main.variable(observer()).define(["showDatasetManager","md","datasets","html"], _4);
  main.variable(observer()).define(["md"], _5);
  main.variable(observer("datasets")).define("datasets", ["streaming_history_audio_20182020_0","streaming_history_audio_20202021_1","streaming_history_audio_2021_2","streaming_history_audio_2021_3","streaming_history_audio_20212022_4","streaming_history_audio_2022_5","streaming_history_audio_20222023_6","streaming_history_audio_2023_7","streaming_history_audio_20232024_8","streaming_history_audio_2024_9","streaming_history_audio_20242025_10","streaming_history_audio_2025_11"], _datasets);
  main.variable(observer("data")).define("data", ["selectedDataset"], _data);
  main.variable(observer()).define(["md"], _8);
  main.variable(observer("artistSongsAnalysis")).define("artistSongsAnalysis", ["artists","data"], _artistSongsAnalysis);
  main.variable(observer()).define(["md"], _10);
  main.variable(observer("artists")).define("artists", ["data"], _artists);
  main.variable(observer()).define(["md"], _12);
  main.variable(observer("uniqueArtists")).define("uniqueArtists", ["data"], _uniqueArtists);
  main.variable(observer()).define(["md"], _14);
  main.variable(observer()).define(["md"], _15);
  main.variable(observer("spotifyToken")).define("spotifyToken", ["refreshTokenButton"], _spotifyToken);
  main.variable(observer("viewof refreshTokenButton")).define("viewof refreshTokenButton", ["Inputs","html"], _refreshTokenButton);
  main.variable(observer("refreshTokenButton")).define("refreshTokenButton", ["Generators", "viewof refreshTokenButton"], (G, _) => G.input(_));
  main.variable(observer()).define(["md"], _18);
  main.variable(observer("searchArtist")).define("searchArtist", ["spotifyToken"], _searchArtist);
  main.variable(observer("getArtistIds")).define("getArtistIds", ["uniqueArtists","searchArtist"], _getArtistIds);
  main.variable(observer()).define(["md"], _21);
  main.variable(observer()).define(["md"], _22);
  main.variable(observer("artistsWithGenres")).define("artistsWithGenres", ["getArtistIds"], _artistsWithGenres);
  main.variable(observer("genreAnalysis")).define("genreAnalysis", ["artistsWithGenres"], _genreAnalysis);
  main.variable(observer()).define(["md"], _25);
  main.variable(observer("genrePlotData")).define("genrePlotData", ["data","genreAnalysis"], _genrePlotData);
  main.variable(observer("artistGenreTable")).define("artistGenreTable", ["data","artistsWithGenres"], _artistGenreTable);
  main.variable(observer("genreConnections")).define("genreConnections", ["data","artistsWithGenres"], _genreConnections);
  main.variable(observer("topGenres")).define("topGenres", ["genreConnections"], _topGenres);
  main.variable(observer("filteredConnections")).define("filteredConnections", ["genreConnections","topGenres"], _filteredConnections);
  main.variable(observer("genreNodes")).define("genreNodes", ["topGenres"], _genreNodes);
  main.variable(observer()).define(["md"], _32);
  main.variable(observer("timeAnalysis")).define("timeAnalysis", ["data"], _timeAnalysis);
  main.variable(observer("yearAnalysis")).define("yearAnalysis", ["data"], _yearAnalysis);
  main.variable(observer("daily_analysis")).define("daily_analysis", ["yearAnalysis"], _daily_analysis);
  main.variable(observer("filteredDailyData")).define("filteredDailyData", ["daily_analysis","daySlider"], _filteredDailyData);
  main.variable(observer("viewof selectedDataset")).define("viewof selectedDataset", ["Inputs","datasets"], _selectedDataset);
  main.variable(observer("selectedDataset")).define("selectedDataset", ["Generators", "viewof selectedDataset"], (G, _) => G.input(_));
  main.variable(observer()).define(["selectedDataset","data","md"], _38);
  main.variable(observer()).define(["md"], _39);
  main.variable(observer()).define(["md"], _40);
  main.variable(observer()).define(["Plot","width","filteredConnections","genreNodes"], _41);
  main.variable(observer()).define(["md"], _42);
  main.variable(observer()).define(["Plot","width","genrePlotData"], _43);
  main.variable(observer()).define(["md"], _44);
  main.variable(observer()).define(["Plot","genrePlotData"], _45);
  main.variable(observer()).define(["md"], _46);
  main.variable(observer()).define(["Plot","artistSongsAnalysis"], _47);
  main.variable(observer()).define(["md"], _48);
  main.variable(observer()).define(["md"], _49);
  main.variable(observer()).define(["Plot","timeAnalysis"], _50);
  main.variable(observer()).define(["md"], _51);
  main.variable(observer("viewof daySlider")).define("viewof daySlider", ["Inputs","daily_analysis","html"], _daySlider);
  main.variable(observer("daySlider")).define("daySlider", ["Generators", "viewof daySlider"], (G, _) => G.input(_));
  main.variable(observer()).define(["Plot","daySlider","htl","filteredDailyData"], _53);
  main.variable(observer()).define(["filteredDailyData","md"], _54);
  main.variable(observer()).define(["Plot","daySlider","htl","filteredDailyData"], _55);
  main.variable(observer()).define(["filteredDailyData","md"], _56);
  main.variable(observer()).define(["md"], _57);
  main.variable(observer("streaming_history_audio_20182020_0")).define("streaming_history_audio_20182020_0", ["FileAttachment"], _streaming_history_audio_20182020_0);
  main.variable(observer("streaming_history_audio_20202021_1")).define("streaming_history_audio_20202021_1", ["FileAttachment"], _streaming_history_audio_20202021_1);
  main.variable(observer("streaming_history_audio_20212022_4")).define("streaming_history_audio_20212022_4", ["FileAttachment"], _streaming_history_audio_20212022_4);
  main.variable(observer("streaming_history_audio_2021_2")).define("streaming_history_audio_2021_2", ["FileAttachment"], _streaming_history_audio_2021_2);
  main.variable(observer("streaming_history_audio_2021_3")).define("streaming_history_audio_2021_3", ["FileAttachment"], _streaming_history_audio_2021_3);
  main.variable(observer("streaming_history_audio_20222023_6")).define("streaming_history_audio_20222023_6", ["FileAttachment"], _streaming_history_audio_20222023_6);
  main.variable(observer("streaming_history_audio_2022_5")).define("streaming_history_audio_2022_5", ["FileAttachment"], _streaming_history_audio_2022_5);
  main.variable(observer("streaming_history_audio_20232024_8")).define("streaming_history_audio_20232024_8", ["FileAttachment"], _streaming_history_audio_20232024_8);
  main.variable(observer("streaming_history_audio_2023_7")).define("streaming_history_audio_2023_7", ["FileAttachment"], _streaming_history_audio_2023_7);
  main.variable(observer("streaming_history_audio_20242025_10")).define("streaming_history_audio_20242025_10", ["FileAttachment"], _streaming_history_audio_20242025_10);
  main.variable(observer("streaming_history_audio_2024_9")).define("streaming_history_audio_2024_9", ["FileAttachment"], _streaming_history_audio_2024_9);
  main.variable(observer("streaming_history_audio_2025_11")).define("streaming_history_audio_2025_11", ["FileAttachment"], _streaming_history_audio_2025_11);
  return main;
}
