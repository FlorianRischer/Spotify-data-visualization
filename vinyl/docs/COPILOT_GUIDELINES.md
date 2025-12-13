# Copilot Guidelines
## Spotify Vinyl Data Visualization

**Version:** 1.0.0  
**Erstellt:** 12. Dezember 2025  
**Für:** AI-gestützte Entwicklung mit GitHub Copilot  

---

## 1. Code Style & Patterns

### 1.1 TypeScript Konventionen

| Regel | Gut ✅ | Schlecht ❌ |
|-------|--------|------------|
| Explizite Typen | `function calc(a: number): number` | `function calc(a)` |
| Interfaces für Objekte | `interface User { name: string }` | `type User = { name: string }` |
| Types für Unions | `type Status = 'loading' \| 'ready'` | `interface Status { ... }` |
| Keine `any` | `data: unknown` | `data: any` |
| Optional Chaining | `user?.profile?.name` | `user && user.profile && user.profile.name` |
| Nullish Coalescing | `value ?? defaultValue` | `value \|\| defaultValue` (wenn 0 valid) |

```typescript
// ✅ Correct Type Pattern
interface GenreData {
  readonly id: string;
  name: string;
  trackCount: number;
}

type GenreId = string;
type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// ❌ Avoid
const data: any = {};
let items = [];  // implicit any[]
```

### 1.2 Svelte Patterns

#### Component Structure
```svelte
<!-- Standard Component Order -->
<script lang="ts">
  // 1. Types/Imports
  import type { GenreData } from '$lib/types';
  import { fly } from 'svelte/transition';
  
  // 2. Props (export let)
  export let genre: GenreData;
  export let visible = true;
  
  // 3. State (let)
  let isExpanded = false;
  
  // 4. Reactive ($:)
  $: formattedHours = formatHours(genre.totalHours);
  
  // 5. Functions
  function handleClick() {
    isExpanded = !isExpanded;
  }
  
  // 6. Lifecycle (onMount, etc.)
  import { onMount } from 'svelte';
  onMount(() => {
    console.log('Mounted');
  });
</script>

<!-- Template -->
<div class="wrapper">
  ...
</div>

<style>
  /* Scoped Styles */
  .wrapper { ... }
</style>
```

#### Reactive Patterns
```svelte
<!-- ✅ Correct Reactivity -->
<script lang="ts">
  // Simple reactive statement
  $: doubled = count * 2;
  
  // Block for side effects
  $: {
    if (active) {
      console.log('Active changed:', active);
    }
  }
  
  // Reactive function call
  $: result = processData(items);
</script>

<!-- ❌ Avoid - Mutation in reactive -->
<script lang="ts">
  $: items.push(newItem);  // BAD - mutates
  $: items = [...items, newItem];  // GOOD - creates new
</script>
```

### 1.3 Store Patterns

```typescript
// ✅ Correct Store Pattern
// src/lib/stores/uiStore.ts

import { writable, derived } from 'svelte/store';
import type { UIState } from '$lib/types';

const initialState: UIState = {
  vinylRotation: 0,
  activeGenreId: null,
  isDragging: false
};

function createUIStore() {
  const { subscribe, set, update } = writable<UIState>(initialState);
  
  return {
    subscribe,
    setRotation: (rotation: number) => 
      update(s => ({ ...s, vinylRotation: rotation })),
    setActiveGenre: (id: string | null) => 
      update(s => ({ ...s, activeGenreId: id })),
    startDrag: () => 
      update(s => ({ ...s, isDragging: true })),
    endDrag: () => 
      update(s => ({ ...s, isDragging: false })),
    reset: () => set(initialState)
  };
}

export const uiStore = createUIStore();

// Derived Store
export const isInteracting = derived(
  uiStore, 
  $ui => $ui.isDragging || $ui.isSnapping
);
```

```svelte
<!-- ✅ Correct Store Usage in Component -->
<script lang="ts">
  import { uiStore, isInteracting } from '$lib/stores/uiStore';
  
  // Auto-subscribe with $
  $: rotation = $uiStore.vinylRotation;
  $: isActive = !$isInteracting;
  
  function handleDragStart() {
    uiStore.startDrag();
  }
</script>
```

### 1.4 Naming Conventions

| Element | Pattern | Beispiel |
|---------|---------|----------|
| Components | PascalCase | `VinylChart.svelte` |
| Component Folders | lowercase | `src/lib/components/vinyl/` |
| Stores | camelCase + Store suffix | `uiStore.ts` |
| Utils | camelCase | `dataProcessor.ts` |
| Types | PascalCase | `interface GenreData` |
| Constants | UPPER_SNAKE | `const MAX_GENRES = 12` |
| Functions | camelCase, verb prefix | `processData()`, `handleClick()` |
| Booleans | is/has/should prefix | `isLoading`, `hasData` |
| Event Handlers | handle prefix | `handlePointerDown()` |

---

## 2. Performance Regeln

### 2.1 Muss-Regeln

| Regel | Grund | Lösung |
|-------|-------|--------|
| Kein Re-render in RAF | Frame Budget | Batch updates |
| Keine DOM Reads in RAF | Forced Reflow | Cache values |
| Große Arrays: keyed each | Reconciliation | `{#each items as item (item.id)}` |
| Threlte: useMemo für Geometries | GC Pressure | Außerhalb Loop definieren |

### 2.2 3D-spezifische Regeln

```typescript
// ✅ Correct - Reuse Geometry/Material
const geometry = new THREE.CircleGeometry(1, 32);
const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });

segments.forEach(segment => {
  const mesh = new THREE.Mesh(geometry, material.clone());
  // ...
});

// ❌ Wrong - Creates GC pressure
segments.forEach(segment => {
  const geo = new THREE.CircleGeometry(1, 32);  // New each time!
  // ...
});
```

### 2.3 Event Handler Performance

```typescript
// ✅ Correct - Throttle expensive operations
import { throttle } from '$lib/utils/throttle';

const handleMouseMove = throttle((e: MouseEvent) => {
  updatePosition(e.clientX, e.clientY);
}, 16);  // ~60fps

// ✅ Correct - Debounce search/filter
import { debounce } from '$lib/utils/debounce';

const handleSearch = debounce((query: string) => {
  filterGenres(query);
}, 300);
```

### 2.4 Bundle Size

| Check | Threshold | Tool |
|-------|-----------|------|
| Total JS | <200KB | `vite-bundle-visualizer` |
| Initial Load | <100KB | Lighthouse |
| Per-Route | <50KB | Code split |

```typescript
// ✅ Correct - Dynamic Import for heavy modules
const { gsap } = await import('gsap');

// ✅ Correct - Tree-shakeable imports
import { fly, fade } from 'svelte/transition';
// Not: import * as transitions from 'svelte/transition';
```

---

## 3. Spotify API & Caching

### 3.1 API-Datenabhängigkeiten

**Wichtig:** Genres und andere Metadaten sind **nicht** in der Spotify Streaming History enthalten!

| Daten | Quelle | Cache-Datei |
|-------|--------|-------------|
| Hörhistorie | Lokale JSON Exports | Nicht gecached (Quelldaten) |
| **Artist Genres** | Spotify API `/artists/{id}` | `artistGenres.json` |
| Audio Features | Spotify API `/audio-features/{id}` | `trackFeatures.json` |
| Artist Details | Spotify API `/artists/{id}` | `artistDetails.json` |

### 3.2 Cache-First Pattern

```typescript
// src/lib/services/cacheService.ts

import type { ArtistGenreCache } from '$lib/types';

const CACHE_PATH = '$lib/data/cache';

export async function getArtistGenres(
  artistIds: string[]
): Promise<Map<string, string[]>> {
  // 1. Load existing cache
  const cache = await loadCache<ArtistGenreCache>('artistGenres.json');
  
  // 2. Find missing IDs
  const missingIds = artistIds.filter(id => !cache.has(id));
  
  // 3. Fetch only missing from API (if any)
  if (missingIds.length > 0) {
    const newData = await fetchArtistGenresFromAPI(missingIds);
    
    // 4. Update cache
    newData.forEach((genres, id) => cache.set(id, genres));
    await saveCache('artistGenres.json', cache);
  }
  
  // 5. Return combined result
  return new Map(
    artistIds.map(id => [id, cache.get(id) ?? []])
  );
}
```

### 3.3 Cache-Struktur

```typescript
// Cache File Format
interface ArtistGenreCache {
  [artistId: string]: {
    genres: string[];
    fetchedAt: string;  // ISO timestamp
  };
}

interface TrackFeatureCache {
  [trackId: string]: {
    tempo: number;
    energy: number;
    danceability: number;
    fetchedAt: string;
  };
}
```

### 3.4 API Service Pattern

```typescript
// src/lib/services/spotifyApi.ts

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

// Batch requests (max 50 IDs per request)
export async function fetchArtistGenresFromAPI(
  artistIds: string[],
  accessToken: string
): Promise<Map<string, string[]>> {
  const batches = chunk(artistIds, 50);
  const results = new Map<string, string[]>();
  
  for (const batch of batches) {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/artists?ids=${batch.join(',')}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    
    const data = await response.json();
    data.artists.forEach((artist: SpotifyArtist) => {
      results.set(artist.id, artist.genres);
    });
  }
  
  return results;
}
```

### 3.5 Wann API-Calls nötig sind

| Szenario | Aktion |
|----------|--------|
| Erster Run / leerer Cache | API-Calls für alle Artists |
| Neue Artists in History | Nur neue IDs fetchen |
| Cache vorhanden | Keine API-Calls nötig |
| Cache-Refresh gewünscht | Manueller Trigger |

---

## 4. Daten-Verträge

### 4.1 Input Validation

```typescript
// src/lib/utils/validation.ts

import type { SpotifyTrack } from '$lib/types';

export function isValidSpotifyTrack(data: unknown): data is SpotifyTrack {
  if (typeof data !== 'object' || data === null) return false;
  
  const track = data as Record<string, unknown>;
  return (
    typeof track.ts === 'string' &&
    typeof track.master_metadata_track_name === 'string' &&
    typeof track.ms_played === 'number'
  );
}

export function validateSpotifyData(data: unknown[]): SpotifyTrack[] {
  return data.filter(isValidSpotifyTrack);
}
```

### 3.2 Store Contracts

| Store | Input | Output | Side Effects |
|-------|-------|--------|--------------|
| `dataStore` | `GenreData[]` | `DataState` | None |
| `uiStore` | Actions | `UIState` | None |
| `scrollStore` | Scroll events | `ScrollState` | None |

### 3.3 Component Contracts

```typescript
// Jede Komponente hat klare Props
interface VinylChartProps {
  genres: GenreData[];           // Required
  rotation?: number;             // Optional, default 0
  onRotationChange?: Callback;   // Optional
  onGenreSelect?: Callback;      // Optional
}

// Event Callbacks haben definierte Signaturen
type RotationCallback = (rotation: number) => void;
type GenreSelectCallback = (genreId: string) => void;
```

---

## 4. Testing Regeln

### 4.1 Test Struktur

```
src/
├── lib/
│   ├── utils/
│   │   ├── dataProcessor.ts
│   │   └── dataProcessor.test.ts    # Co-located tests
│   └── components/
│       └── vinyl/
│           ├── VinylChart.svelte
│           └── VinylChart.test.ts
└── tests/
    └── e2e/
        └── vinyl.spec.ts            # E2E tests separate
```

### 4.2 Unit Test Pattern

```typescript
// dataProcessor.test.ts
import { describe, it, expect } from 'vitest';
import { aggregateByGenre } from './dataProcessor';
import { createMockTracks } from '../__fixtures__/tracks';

describe('aggregateByGenre', () => {
  it('should group tracks by genre', () => {
    // Arrange
    const tracks = createMockTracks([
      { genre: 'Rock' },
      { genre: 'Rock' },
      { genre: 'Pop' }
    ]);
    
    // Act
    const result = aggregateByGenre(tracks);
    
    // Assert
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Rock');
    expect(result[0].trackCount).toBe(2);
  });
  
  it('should handle empty input', () => {
    expect(aggregateByGenre([])).toEqual([]);
  });
});
```

### 4.3 Component Test Pattern

```typescript
// VinylChart.test.ts
import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import VinylChart from './VinylChart.svelte';
import { createMockGenres } from '../__fixtures__/genres';

describe('VinylChart', () => {
  it('should render with genres', () => {
    const genres = createMockGenres(5);
    const { container } = render(VinylChart, { props: { genres } });
    
    expect(container.querySelector('canvas')).toBeTruthy();
  });
  
  it('should call onGenreSelect when segment clicked', async () => {
    const onGenreSelect = vi.fn();
    const genres = createMockGenres(5);
    
    const { component } = render(VinylChart, { 
      props: { genres, onGenreSelect } 
    });
    
    // Simulate selection
    component.$set({ rotation: 45 });
    
    expect(onGenreSelect).toHaveBeenCalledWith('genre-1');
  });
});
```

### 4.4 Test Coverage Requirements

| Kategorie | Minimum | Ziel |
|-----------|---------|------|
| Utils | 90% | 100% |
| Stores | 80% | 95% |
| Components | 70% | 85% |
| E2E | Key flows | All happy paths |

---

## 5. Git & PR Konventionen

### 5.1 Branch Naming

```
<type>/<ticket>-<short-description>

feat/VV-42-drag-rotation
fix/VV-55-snap-animation
refactor/VV-60-store-cleanup
docs/VV-70-readme-update
```

### 5.2 Commit Messages

```
<type>(<scope>): <subject>

<body>

<footer>
```

| Type | Verwendung |
|------|------------|
| `feat` | Neues Feature |
| `fix` | Bug Fix |
| `refactor` | Code Restructure |
| `style` | Formatting |
| `test` | Tests hinzufügen/ändern |
| `docs` | Dokumentation |
| `chore` | Tooling, Dependencies |
| `perf` | Performance |

```
feat(vinyl): add drag-to-rotate interaction

- Implement pointer event handlers
- Add momentum physics
- Connect to uiStore

Closes #42
```

### 5.3 PR Template

```markdown
## Beschreibung
<!-- Was wurde geändert und warum? -->

## Typ
- [ ] Feature
- [ ] Bug Fix
- [ ] Refactor
- [ ] Docs

## Screenshots
<!-- Falls UI-Änderungen -->

## Checklist
- [ ] Types sind vollständig
- [ ] Tests geschrieben
- [ ] Keine TypeScript Errors
- [ ] Responsive getestet
- [ ] Performance geprüft (60fps drag)
```

---

## 6. Checklisten

### 6.1 Neue Komponente erstellen

```markdown
## Component Checklist

- [ ] TypeScript: Props Interface definiert
- [ ] TypeScript: Event Callbacks typisiert
- [ ] Props: Default values für optionale Props
- [ ] Slots: Falls Content projiziert werden soll
- [ ] Styles: Scoped, keine globalen Leaks
- [ ] A11y: ARIA labels wo nötig
- [ ] A11y: Keyboard Navigation falls interaktiv
- [ ] Responsive: Mobile-first Styles
- [ ] Test: Unit Test für Logik
- [ ] Test: Render Test für Output
- [ ] Docs: Props dokumentiert in JSDoc
```

### 6.2 Neue Visualisierung erstellen

```markdown
## Visualization Checklist

- [ ] Data Contract: Input Type definiert
- [ ] Data Contract: Output Type definiert
- [ ] Performance: Canvas/WebGL falls >1000 Elemente
- [ ] Performance: RequestAnimationFrame für Animationen
- [ ] Performance: Throttle für Mouse Events
- [ ] Interaction: Touch Events (nicht nur Mouse)
- [ ] Interaction: Keyboard Alternative falls möglich
- [ ] Responsive: Funktioniert in Container aller Größen
- [ ] Responsive: Nicht fixed Dimensionen
- [ ] A11y: Screen Reader Description
- [ ] A11y: Reduce Motion Support
- [ ] Error: Fallback bei fehlenden Daten
- [ ] Error: Loading State
- [ ] Test: Render Test
- [ ] Test: Interaction Test
```

### 6.3 Store Änderung

```markdown
## Store Checklist

- [ ] Type: State Interface aktualisiert
- [ ] Initial: Initial State korrekt
- [ ] Actions: Alle Actions typisiert
- [ ] Actions: Keine Mutations, nur Updates
- [ ] Derived: Falls abgeleiteter State nötig
- [ ] Test: Action Tests
- [ ] Test: Derived Store Tests
- [ ] Migration: Falls Breaking Change, Migration Guide
```

### 6.4 Release Checklist

```markdown
## Release Checklist

- [ ] Alle Tests grün
- [ ] TypeScript: `npm run check` ohne Errors
- [ ] Lint: `npm run lint` ohne Errors
- [ ] Build: `npm run build` erfolgreich
- [ ] Preview: `npm run preview` getestet
- [ ] Bundle Size: Unter Budget
- [ ] Lighthouse: Scores > 90
- [ ] Changelog: Updated
- [ ] Version: package.json aktualisiert
```

---

## 7. Häufige Fehler & Lösungen

### 7.1 Svelte Fehler

| Fehler | Ursache | Lösung |
|--------|---------|--------|
| `$store` undefined | Store nicht importiert | Import prüfen |
| Reactivity nicht triggered | Array mutiert | Spread: `items = [...items, new]` |
| Memory Leak | Event Listener nicht entfernt | `onDestroy` verwenden |
| SSR Error mit Three.js | Browser API auf Server | `if (browser)` Check |

### 7.2 TypeScript Fehler

| Fehler | Ursache | Lösung |
|--------|---------|--------|
| `Type X not assignable` | Falscher Type | Type prüfen oder `as Type` |
| `Property does not exist` | Fehlende Property | Optional Chaining `?.` |
| `Cannot find module` | Path Alias | `$lib/` richtig konfiguriert? |
| `any` implicit | Fehlende Annotation | Explicit Type hinzufügen |

### 7.3 Performance Fehler

| Symptom | Ursache | Lösung |
|---------|---------|--------|
| Janky Animation | Layout Thrashing | Nur Transform/Opacity animieren |
| Hoher Memory | Ungenutzte References | WeakMap, Cleanup in onDestroy |
| Langsamer Initial Load | Bundle zu groß | Code Splitting, Dynamic Import |
| Scroll Lag | Teure Berechnungen | Throttle, Web Worker |

---

## 8. Referenzen

### 8.1 Projekt-Spezifisch

- [PRD.md](./PRD.md) - Product Requirements
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - Technische Details
- [BASE_INSTRUCTIONS.md](./BASE_INSTRUCTIONS.md) - Arbeitsweise

### 8.2 Extern

- [Svelte Docs](https://svelte.dev/docs)
- [SvelteKit Docs](https://kit.svelte.dev/docs)
- [Threlte Docs](https://threlte.xyz/)
- [Three.js Docs](https://threejs.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [Vitest Docs](https://vitest.dev/)

---

## Changelog

| Datum | Version | Änderung |
|-------|---------|----------|
| 2025-12-12 | 1.0.0 | Initial Draft |
