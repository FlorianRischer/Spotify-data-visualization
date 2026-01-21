const fs = require('fs');

// Load both files
const cache = JSON.parse(fs.readFileSync('static/artist-cache.json', 'utf8'));
const data = JSON.parse(fs.readFileSync('data/artist-data-2025-12-13.json', 'utf8'));

// Count stats
let added = 0;
let skipped = 0;

// Merge: add entries from cache that don't exist in data
for (const [key, value] of Object.entries(cache)) {
  if (key === '_info') continue; // Skip metadata
  
  if (!(key in data)) {
    data[key] = value;
    added++;
  } else {
    skipped++;
  }
}

// Update metadata
if (data._info) {
  data._info.mergedDate = new Date().toISOString();
  data._info.artistCount = Object.keys(data).filter(k => k !== '_info').length;
}

// Write merged data
fs.writeFileSync('data/artist-data-2025-12-13.json', JSON.stringify(data, null, 2));

console.log('Merge complete:');
console.log('- Added new artists:', added);
console.log('- Skipped duplicates:', skipped);
console.log('- Total artists now:', Object.keys(data).filter(k => k !== '_info').length);
