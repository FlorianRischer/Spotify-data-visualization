const fs = require('fs');
const path = require('path');

const streamingDir = './static/spotify-data/';
const files = fs.readdirSync(streamingDir).filter(f => f.startsWith('Streaming_History_Audio'));

let totalMs = 0;
let firstDate = null;
let lastDate = null;

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(streamingDir, file), 'utf8'));
  for (const entry of data) {
    if (entry.ts && entry.ms_played) {
      totalMs += entry.ms_played;
      const date = new Date(entry.ts);
      if (!firstDate || date < firstDate) firstDate = date;
      if (!lastDate || date > lastDate) lastDate = date;
    }
  }
}

const totalHours = totalMs / 3600000;
const totalDays = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
const totalYears = totalDays / 365;
const hoursPerDay = totalHours / totalDays;
const hoursPerYear = totalHours / totalYears;

console.log('=== DEINE SPOTIFY STATISTIK ===\n');
console.log('Zeitraum:', firstDate.toLocaleDateString('de-DE'), '-', lastDate.toLocaleDateString('de-DE'));
console.log('Das sind', Math.round(totalDays), 'Tage oder', totalYears.toFixed(1), 'Jahre\n');
console.log('Gesamte Hörzeit:', Math.round(totalHours), 'Stunden');
console.log('');
console.log('Das bedeutet:');
console.log('- Pro Tag:', hoursPerDay.toFixed(1), 'Stunden');
console.log('- Pro Jahr:', Math.round(hoursPerYear), 'Stunden');
console.log('- Pro Monat:', Math.round(hoursPerYear / 12), 'Stunden');
console.log('');
console.log('Zum Vergleich:');
console.log('- Durchschnittlicher Spotify-User: ~2.5 Stunden/Tag');
console.log('- Dein Durchschnitt:', hoursPerDay.toFixed(1), 'Stunden/Tag');
