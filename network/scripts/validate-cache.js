/**
 * Script to find mismatched artists in the cache
 * Uses the same similarity logic as precompute-genres.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Load cache
const cacheFile = path.join(__dirname, '..', 'static', 'artist-cache-2025-12-13.json');
const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));

console.log('🔍 Checking cache for mismatched artist names...\n');

const mismatches = [];

for (const [searchedName, data] of Object.entries(cache)) {
  // Skip special entries and null/notFound entries
  if (searchedName === '_info' || !data || data.notFound || !data.name) continue;
  
  // Use originalName if available, otherwise use the key
  const originalSearched = data.originalName || searchedName;
  const similarity = calculateSimilarity(originalSearched, data.name);
  
  if (similarity < MIN_SIMILARITY_THRESHOLD) {
    mismatches.push({
      searched: searchedName,
      found: data.name,
      similarity: (similarity * 100).toFixed(1) + '%',
      genres: data.genres
    });
  }
}

console.log(`Found ${mismatches.length} mismatches below ${MIN_SIMILARITY_THRESHOLD * 100}% threshold:\n`);

mismatches.sort((a, b) => parseFloat(a.similarity) - parseFloat(b.similarity));

mismatches.forEach(m => {
  console.log(`❌ "${m.searched}" → "${m.found}" (${m.similarity})`);
  console.log(`   Genres: ${m.genres.join(', ') || 'none'}`);
  console.log('');
});

// Save list of artists to re-fetch
const artistsToRefetch = mismatches.map(m => m.searched);
console.log(`\n📝 Artists to re-fetch: ${artistsToRefetch.length}`);

// Optionally remove mismatches from cache
if (process.argv.includes('--fix')) {
  console.log('\n🔧 Removing mismatches from cache...');
  for (const name of artistsToRefetch) {
    delete cache[name];
  }
  fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
  console.log('✅ Cache cleaned. Run precompute-genres.js to re-fetch these artists.');
}
