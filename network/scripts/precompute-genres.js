/**
 * Script to pre-compute artist-genre mappings from Spotify API
 * Run this script once to generate the artist cache JSON file
 * 
 * Usage: node --experimental-json-modules scripts/precompute-genres.js
 * 
 * This follows the PRD recommendation:
 * "API-Rate-Limits beim Live-Nachladen von Genres → Nutzung von Cache / Vorberechnung"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Spotify Credentials - same as in the app
const SPOTIFY_CLIENT_ID = '0d00211b45094412aa9b8207af9ab2ff';
const SPOTIFY_CLIENT_SECRET = '9c230d9ec1c447ba8f4b72004cb95c2a';

// Rate limiting config
const BATCH_SIZE = 1;
const DELAY_MS = 600; // 600ms between requests to stay well under rate limits
const MAX_RETRIES = 3;

async function getSpotifyToken() {
  const credentials = Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64');
  
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + credentials
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error(`Failed to get token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function searchArtist(artistName, token, retries = MAX_RETRIES) {
  if (!artistName || artistName.trim() === '') return null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt + 2) * 1000;
        console.warn(`⚠️ Rate limit hit, waiting ${Math.round(waitTime/1000)}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      
      if (data.artists?.items?.length > 0) {
        const artist = data.artists.items[0];
        return {
          id: artist.id,
          name: artist.name,
          genres: artist.genres || [],
          popularity: artist.popularity,
          followers: artist.followers?.total || 0
        };
      }
      
      return null;
    } catch (error) {
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      return null;
    }
  }
  
  return null;
}

async function loadStreamingHistory() {
  // Load extended format files (spotify-data) - Audio files
  const dataDir = path.join(__dirname, '..', 'static', 'spotify-data');
  const audioFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.json') && f.includes('Audio'));
  
  let allEntries = [];
  for (const file of audioFiles) {
    const content = fs.readFileSync(path.join(dataDir, file), 'utf-8');
    const entries = JSON.parse(content);
    allEntries = allEntries.concat(entries);
  }
  
  // Load simple format files (music files in spotify-data folder)
  const musicFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.json') && f.includes('music'));
  for (const file of musicFiles) {
    const content = fs.readFileSync(path.join(dataDir, file), 'utf-8');
    const entries = JSON.parse(content);
    // Normalize simple format to extended format
    const normalized = entries.map(e => ({
      ts: e.endTime ? e.endTime.replace(' ', 'T') + ':00Z' : e.ts,
      master_metadata_album_artist_name: e.artistName || e.master_metadata_album_artist_name,
      master_metadata_track_name: e.trackName || e.master_metadata_track_name,
      ms_played: e.msPlayed || e.ms_played
    }));
    allEntries = allEntries.concat(normalized);
  }
  
  // Also check spotify-data-2 folder if it exists
  const dataDir2 = path.join(__dirname, '..', 'static', 'spotify-data-2');
  if (fs.existsSync(dataDir2)) {
    const files2 = fs.readdirSync(dataDir2).filter(f => f.endsWith('.json') && f.includes('music'));
    for (const file of files2) {
      const content = fs.readFileSync(path.join(dataDir2, file), 'utf-8');
      const entries = JSON.parse(content);
      // Normalize simple format to extended format
      const normalized = entries.map(e => ({
        ts: e.endTime ? e.endTime.replace(' ', 'T') + ':00Z' : e.ts,
        master_metadata_album_artist_name: e.artistName || e.master_metadata_album_artist_name,
        master_metadata_track_name: e.trackName || e.master_metadata_track_name,
        ms_played: e.msPlayed || e.ms_played
      }));
      allEntries = allEntries.concat(normalized);
    }
  }
  
  return allEntries;
}

async function main() {
  console.log('🎵 Pre-computing artist-genre mappings...\n');
  
  // Load existing cache if available
  const cacheFile = path.join(__dirname, '..', 'static', 'artist-cache.json');
  const precomputedFile = path.join(__dirname, '..', 'data', 'artist-data-2025-12-13.json');
  let existingCache = {};
  
  // First load the precomputed artist data as base cache
  if (fs.existsSync(precomputedFile)) {
    const content = fs.readFileSync(precomputedFile, 'utf-8');
    const precomputed = JSON.parse(content);
    // Convert keys to lowercase for consistent lookup
    for (const [key, value] of Object.entries(precomputed)) {
      if (key !== '_info') {
        existingCache[key.toLowerCase()] = value;
      }
    }
    console.log(`📂 Loaded precomputed data with ${Object.keys(existingCache).length} artists`);
  }
  
  // Then merge any additional cache entries
  if (fs.existsSync(cacheFile)) {
    const content = fs.readFileSync(cacheFile, 'utf-8');
    const cache = JSON.parse(content);
    let newEntries = 0;
    for (const [key, value] of Object.entries(cache)) {
      const lowerKey = key.toLowerCase();
      if (!existingCache[lowerKey]) {
        existingCache[lowerKey] = value;
        newEntries++;
      }
    }
    if (newEntries > 0) {
      console.log(`📂 Added ${newEntries} additional entries from artist-cache.json`);
    }
  }
  
  // Load streaming history and extract unique artists
  const streamingHistory = await loadStreamingHistory();
  console.log(`📊 Loaded ${streamingHistory.length} streaming entries`);
  
  const uniqueArtists = [...new Set(
    streamingHistory
      .map(d => d.master_metadata_album_artist_name)
      .filter(Boolean)
  )];
  console.log(`🎤 Found ${uniqueArtists.length} unique artists`);
  
  // Filter out already cached artists (case-insensitive)
  const uncachedArtists = uniqueArtists.filter(name => !existingCache[name.toLowerCase()]);
  console.log(`📡 Need to fetch ${uncachedArtists.length} new artists\n`);
  
  if (uncachedArtists.length === 0) {
    console.log('✅ All artists already cached!');
    return;
  }
  
  // Get Spotify token
  console.log('🔑 Getting Spotify token...');
  const token = await getSpotifyToken();
  console.log('✅ Token obtained\n');
  
  // Fetch artists
  const cache = { ...existingCache };
  let successCount = Object.values(existingCache).filter(a => a?.genres?.length > 0).length;
  let processedCount = 0;
  
  for (const artistName of uncachedArtists) {
    processedCount++;
    const progress = Math.round((processedCount / uncachedArtists.length) * 100);
    
    process.stdout.write(`\r[${progress}%] Processing ${processedCount}/${uncachedArtists.length}: ${artistName.substring(0, 30).padEnd(30)}...`);
    
    const artistInfo = await searchArtist(artistName, token);
    
    cache[artistName] = {
      originalName: artistName,
      ...artistInfo
    };
    
    if (artistInfo?.genres?.length > 0) {
      successCount++;
    }
    
    // Save periodically
    if (processedCount % 100 === 0) {
      fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
      console.log(`\n💾 Saved checkpoint (${successCount} artists with genres)`);
    }
    
    // Delay between requests
    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
  }
  
  // Final save
  fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
  
  console.log('\n\n✅ Pre-computation complete!');
  console.log(`📊 Total artists: ${Object.keys(cache).length}`);
  console.log(`🎵 Artists with genres: ${successCount}`);
  console.log(`📂 Cache saved to: ${cacheFile}`);
}

main().catch(console.error);
