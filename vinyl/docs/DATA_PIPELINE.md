# Data Pipeline Documentation

## Übersicht

Die Daten-Pipeline verarbeitet Spotify Streaming History und reichert sie mit Genre-Informationen über die Spotify Web API an.

## Pipeline-Schritte

```
┌──────────────────────────────────────────────────────────────┐
│                    DATA PIPELINE FLOW                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Load Spotify JSON Files                                 │
│     ↓                                                        │
│  2. Combine & Deduplicate                                   │
│     ↓                                                        │
│  3. Extract Unique Artists                                  │
│     ↓                                                        │
│  4. Get Artist Genres (Cache + API)                         │
│     ↓                                                        │
│  5. Enrich Tracks with Genres                               │
│     ↓                                                        │
│  6. Aggregate by Genre                                      │
│     ↓                                                        │
│  7. Calculate Stats (top artists, tracks, etc.)             │
│     ↓                                                        │
│  8. Sort & Limit (Top 15 genres)                            │
│     ↓                                                        │
│  [GenreData[]]                                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Verwendung

### Basic Usage

```typescript
import { runDataPipeline } from '$lib/utils/pipelineOrchestrator';

const result = await runDataPipeline({
	genreLimit: 15,
	minPlayTime: 30000 // 30s minimum
});

console.log(result.genres); // Top 15 genres
console.log(result.stats); // Pipeline statistics
```

### Mit Spotify API Token

```typescript
const result = await runDataPipeline({
	spotifyAccessToken: 'YOUR_TOKEN_HERE',
	genreLimit: 15
});
```

## Komponenten

### 1. Data Loader (`dataLoader.ts`)
- Lädt Spotify JSON Files
- Validiert Datenstruktur
- Kombiniert mehrere Datasets

### 2. Data Processor (`dataProcessor.ts`)
- Haupteinstiegspunkt
- Kombiniert & dedupliziert Tracks
- Filtert ungültige Einträge

### 3. Genre Aggregator (`genreAggregator.ts`)
- Reichert Tracks mit Genres an
- Aggregiert nach Genre
- Berechnet Top Artists & Tracks

### 4. Spotify API Service (`spotifyApi.ts`)
- Fetcht Artist Genres
- Batching (50 Artists pro Request)
- Rate Limiting

### 5. Cache Service (`cacheService.ts`)
- localStorage für Browser
- Static files für pre-generated Cache
- Cache-First Strategie

### 6. Enrichment Service (`dataEnrichmentService.ts`)
- Kombiniert Cache + API
- Artist Name → Spotify ID Mapping
- Coverage Statistics

## Caching

### Cache-Dateien

- `static/cache/artistGenres.json` - Pre-generated Artist-Genre Mapping
- `localStorage: spotify-cache:artistGenres.json` - Runtime Cache

### Cache-First Flow

```
Request Artist Genres
    ↓
Check Static Cache (/cache/artistGenres.json)
    ↓ (if not found)
Check localStorage
    ↓ (if not found)
Fetch from Spotify API
    ↓
Save to localStorage
    ↓
Return Result
```

## Output Format

```typescript
interface GenreData {
  id: string;                    // Slugified genre name
  name: string;                  // Genre name
  trackCount: number;            // Number of tracks
  totalMinutesListened: number;  // Total listening time
  totalHours: number;            // Total hours
  percentage: number;            // Percentage of total
  color: string;                 // Visualization color
  topArtists: TopArtist[];       // Top 5 artists
  topTracks: TopTrack[];         // Top 5 tracks
  avgMinutesPerTrack: number;    // Average track length
}
```

## Test Interface

Besuche `/test` um die Pipeline zu testen:
- Load Spotify data
- Process with/without API token
- View results
- Export as JSON/CSV

## Performance

- **Ohne API**: ~1-2s (nur Cache)
- **Mit API**: Variable (abhängig von Artist-Anzahl)
  - Rate Limit: 100ms zwischen Batches
  - Batch Size: 50 Artists pro Request

## Nächste Schritte

1. Pre-generate artist genre cache
2. Implement incremental updates
3. Add Web Worker for processing
4. Add progress callbacks
