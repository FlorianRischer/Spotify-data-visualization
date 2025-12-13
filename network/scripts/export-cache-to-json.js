/**
 * Hilfsskript: Exportiert den aktuellen localStorage Cache zu einer JSON-Datei
 * 
 * Anleitung:
 * 1. Öffne die App im Browser
 * 2. Öffne die Browser-Konsole (F12 -> Console)
 * 3. Füge diesen Code ein und führe ihn aus:
 * 
 * -----------------------------------------------
 * 
const cached = localStorage.getItem('spotify_artist_cache');
if (cached) {
  const { data } = JSON.parse(cached);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'artist-cache.json';
  a.click();
  URL.revokeObjectURL(url);
  console.log('✅ Cache exported! Move the file to static/artist-cache.json');
} else {
  console.log('❌ No cache found');
}

 * -----------------------------------------------
 * 
 * 4. Die heruntergeladene Datei nach static/artist-cache.json verschieben
 */

console.log('This is a helper script with instructions.');
console.log('Please read the comments in this file for usage instructions.');
