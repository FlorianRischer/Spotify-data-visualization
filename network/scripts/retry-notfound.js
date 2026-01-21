/**
 * Script to retry fetching artists that were previously marked as notFound or null
 * This gives them another chance to be found via Spotify API
 * 
 * Usage: node scripts/retry-notfound.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Spotify Credentials
const SPOTIFY_CLIENT_ID = '0d00211b45094412aa9b8207af9ab2ff';
const SPOTIFY_CLIENT_SECRET = '9c230d9ec1c447ba8f4b72004cb95c2a';

// Rate limiting config
const DELAY_MS = 600;
const MAX_RETRIES = 3;
const MIN_SIMILARITY_THRESHOLD = 0.75;

function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

function calculateSimilarity(str1, str2) {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) {
    const shorter = Math.min(s1.length, s2.length);
    const longer = Math.max(s1.length, s2.length);
    return shorter / longer;
  }
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  return 1 - (distance / maxLength);
}

function isValidMatch(searchedName, foundName) {
  return calculateSimilarity(searchedName, foundName) >= MIN_SIMILARITY_THRESHOLD;
}

async function getSpotifyToken() {
  const credentials = Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64');
  
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`
    },
    body: 'grant_type=client_credentials'
  });
  
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
        console.warn(`\n⚠️ Rate limit hit, waiting ${Math.round(waitTime/1000)}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      if (!response.ok) return null;
      
      const data = await response.json();
      
      if (data.artists?.items?.length > 0) {
        const artist = data.artists.items[0];
        const similarity = calculateSimilarity(artistName, artist.name);
        
        if (!isValidMatch(artistName, artist.name)) {
          return { notFound: true, searchedFor: artistName, foundInstead: artist.name, similarity };
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

async function main() {
  console.log('🔄 Retrying notFound artists...\n');
  
  // Load existing cache
  const cacheFile = path.join(__dirname, '..', 'static', 'artist-cache-2025-12-13.json');
  const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
  
  // Find artists to retry (null or notFound)
  const artistsToRetry = [];
  for (const [name, data] of Object.entries(cache)) {
    if (name === '_info') continue;
    if (data === null || data?.notFound === true) {
      artistsToRetry.push(name);
    }
  }
  
  console.log(`📡 Found ${artistsToRetry.length} artists to retry\n`);
  
  if (artistsToRetry.length === 0) {
    console.log('✅ No artists to retry!');
    return;
  }
  
  // Get Spotify token
  console.log('🔑 Getting Spotify token...');
  const token = await getSpotifyToken();
  console.log('✅ Token obtained\n');
  
  let successCount = 0;
  let stillNotFound = 0;
  let processedCount = 0;
  
  for (const artistName of artistsToRetry) {
    processedCount++;
    const progress = Math.round((processedCount / artistsToRetry.length) * 100);
    
    process.stdout.write(`\r[${progress}%] Processing ${processedCount}/${artistsToRetry.length}: ${artistName.substring(0, 30).padEnd(30)}...`);
    
    const artistInfo = await searchArtist(artistName, token);
    
    if (artistInfo?.notFound) {
      cache[artistName] = null;
      stillNotFound++;
    } else if (artistInfo) {
      cache[artistName] = {
        originalName: artistName,
        ...artistInfo
      };
      if (artistInfo.genres?.length > 0) {
        successCount++;
        console.log(`\n✅ Found: ${artistName} → ${artistInfo.name} (${artistInfo.genres.slice(0, 3).join(', ')})`);
      }
    } else {
      cache[artistName] = null;
      stillNotFound++;
    }
    
    // Save periodically
    if (processedCount % 100 === 0) {
      fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
      console.log(`\n💾 Saved checkpoint`);
    }
    
    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
  }
  
  // Final save
  fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
  
  console.log('\n\n✅ Retry complete!');
  console.log(`🎵 Newly found with genres: ${successCount}`);
  console.log(`❌ Still not found: ${stillNotFound}`);
  console.log(`📂 Cache saved to: ${cacheFile}`);
}

main().catch(console.error);
