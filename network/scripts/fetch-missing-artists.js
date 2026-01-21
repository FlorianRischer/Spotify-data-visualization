/**
 * Script to fetch only missing artists from the new streaming data
 * Much faster than the full precompute script
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Spotify Credentials
const SPOTIFY_CLIENT_ID = '0d00211b45094412aa9b8207af9ab2ff';
const SPOTIFY_CLIENT_SECRET = '9c230d9ec1c447ba8f4b72004cb95c2a';

const DELAY_MS = 200; // 200ms between requests

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

async function searchArtist(artistName, token) {
  if (!artistName || artistName.trim() === '') return null;
  
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || 5;
      console.warn(`⚠️ Rate limit, waiting ${retryAfter}s...`);
      await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter) * 1000));
      return searchArtist(artistName, token);
    }
    
    if (!response.ok) return null;
    
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
    console.error(`Error fetching ${artistName}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🎵 Fetching missing artist data...\n');
  
  // Load existing cache
  const cacheFile = path.join(__dirname, '..', 'static', 'artist-cache.json');
  let existingCache = {};
  
  if (fs.existsSync(cacheFile)) {
    existingCache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
    console.log(`📂 Existing cache: ${Object.keys(existingCache).length} artists`);
  }
  
  // Load new streaming file
  const newDataFile = path.join(__dirname, '..', 'static', 'spotify-data', 'StreamingHistory_music_2.json');
  const newData = JSON.parse(fs.readFileSync(newDataFile, 'utf-8'));
  console.log(`📊 New streaming entries: ${newData.length}`);
  
  // Get unique artists from new data
  const newArtists = [...new Set(newData.map(e => e.artistName).filter(Boolean))];
  console.log(`🎤 Unique artists in new data: ${newArtists.length}`);
  
  // Filter to only missing artists
  const missingArtists = newArtists.filter(name => {
    const cached = existingCache[name];
    return !cached || !cached.id || !cached.genres || cached.genres.length === 0;
  });
  console.log(`📡 Missing artists to fetch: ${missingArtists.length}\n`);
  
  if (missingArtists.length === 0) {
    console.log('✅ All artists already cached!');
    return;
  }
  
  // Get token
  const token = await getSpotifyToken();
  console.log('✅ Token obtained\n');
  
  // Fetch missing artists
  let successCount = 0;
  for (let i = 0; i < missingArtists.length; i++) {
    const artistName = missingArtists[i];
    const progress = Math.round(((i + 1) / missingArtists.length) * 100);
    
    process.stdout.write(`\r[${progress}%] ${i + 1}/${missingArtists.length}: ${artistName.substring(0, 35).padEnd(35)}...`);
    
    const artistInfo = await searchArtist(artistName, token);
    
    existingCache[artistName] = {
      originalName: artistName,
      ...artistInfo
    };
    
    if (artistInfo?.genres?.length > 0) successCount++;
    
    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
  }
  
  // Save updated cache
  fs.writeFileSync(cacheFile, JSON.stringify(existingCache, null, 2));
  
  console.log('\n\n✅ Done!');
  console.log(`📊 Fetched: ${missingArtists.length} artists`);
  console.log(`🎵 With genres: ${successCount}`);
  console.log(`📂 Total cache: ${Object.keys(existingCache).length} artists`);
}

main().catch(console.error);
