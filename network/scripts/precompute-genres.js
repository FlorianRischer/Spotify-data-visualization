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

// Minimum similarity threshold (0-1) for artist name matching
const MIN_SIMILARITY_THRESHOLD = 0.75; // 75% similarity required

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  
  // Create matrix
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  // Initialize first column and row
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  // Fill the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        );
      }
    }
  }
  
  return dp[m][n];
}

/**
 * Calculate similarity score (0-1) between two strings
 * 1 = identical, 0 = completely different
 */
function calculateSimilarity(str1, str2) {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return 1;
  
  // Check if one contains the other (common for "Artist" vs "Artist feat. X")
  if (s1.includes(s2) || s2.includes(s1)) {
    const shorter = Math.min(s1.length, s2.length);
    const longer = Math.max(s1.length, s2.length);
    return shorter / longer;
  }
  
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  
  return 1 - (distance / maxLength);
}

/**
 * Check if found artist name is similar enough to the searched name
 */
function isValidMatch(searchedName, foundName) {
  const similarity = calculateSimilarity(searchedName, foundName);
  return similarity >= MIN_SIMILARITY_THRESHOLD;
}

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
        
        // Check if the found artist name is similar enough to the searched name
        const similarity = calculateSimilarity(artistName, artist.name);
        if (!isValidMatch(artistName, artist.name)) {
          console.warn(`\n⚠️ Name mismatch: searched "${artistName}" but found "${artist.name}" (similarity: ${(similarity * 100).toFixed(0)}%) - marking as notFound`);
          return { notFound: true, searchedFor: artistName, foundInstead: artist.name, similarity: similarity };
        }
        
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
  const dataDir = path.join(__dirname, '..', 'static', 'spotify-data');
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json') && f.includes('Audio'));
  
  let allEntries = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(dataDir, file), 'utf-8');
    const entries = JSON.parse(content);
    allEntries = allEntries.concat(entries);
  }
  
  return allEntries;
}

async function main() {
  console.log('🎵 Pre-computing artist-genre mappings...\n');
  
  // Load existing cache if available
  const cacheFile = path.join(__dirname, '..', 'static', 'artist-cache.json');
  let existingCache = {};
  
  if (fs.existsSync(cacheFile)) {
    const content = fs.readFileSync(cacheFile, 'utf-8');
    existingCache = JSON.parse(content);
    console.log(`📂 Loaded existing cache with ${Object.keys(existingCache).length} artists`);
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
  
  // Filter out already cached artists
  const uncachedArtists = uniqueArtists.filter(name => !existingCache[name]);
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
    
    // Handle different result types
    if (artistInfo?.notFound) {
      // Name mismatch - store as null so we don't retry but also don't use wrong data
      cache[artistName] = null;
    } else if (artistInfo) {
      cache[artistName] = {
        originalName: artistName,
        ...artistInfo
      };
      if (artistInfo.genres?.length > 0) {
        successCount++;
      }
    } else {
      // No result found
      cache[artistName] = null;
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
