# Implementation Plan
## Spotify Vinyl Data Visualization

**Version:** 1.0.0  
**Erstellt:** 12. Dezember 2025  
**Status:** In Progress  

---

## 1. Architektur-Entscheidungen

### 1.1 Übersicht

```
┌─────────────────────────────────────────────────────────────────────┐
│                         APPLICATION SHELL                           │
│                        (SvelteKit Routes)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │   SCROLL    │  │    VIZ      │  │ INTERACTION │  │    DATA    │  │
│  │   LAYER     │  │   LAYER     │  │    LAYER    │  │   LAYER    │  │
│  │             │  │             │  │             │  │            │  │
│  │ Section     │  │ VinylChart  │  │ DragHandler │  │ Stores     │  │
│  │ Manager     │  │ PieOverlay  │  │ SnapLogic   │  │ Processors │  │
│  │ Transitions │  │ DetailPanel │  │ HitTest     │  │ Types      │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                         3D RUNTIME                                  │
│                    (Threlte / Three.js)                             │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Entscheidungen

| Entscheidung | Wahl | Begründung | Alternativen |
|--------------|------|------------|--------------|
| Framework | SvelteKit | Vorgabe, reaktiv, SSR-fähig | Next.js, Astro |
| 3D Library | Threlte | Svelte-native Three.js Wrapper | react-three-fiber, vanilla Three |
| State | Svelte Stores | Built-in, performant | Zustand, Jotai |
| Scrollytelling | Custom + Intersection Observer | Kontrolle, kein Overhead | Scrollama, GSAP ScrollTrigger |
| Animation | Svelte Transitions + GSAP | Komplexe 3D-Animationen | Framer Motion, anime.js |
| Types | Zod für Runtime Validation | Annahme: Optional, nur wenn nötig | Valibot, io-ts |

### 1.3 Rendering-Strategie

```
┌─────────────────────────────────────────────────────┐
│                    RENDERING                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  SSR: +page.svelte Shell, Meta, Critical CSS        │
│       ↓                                             │
│  CSR: 3D Canvas (Threlte), Interaktionen            │
│       ↓                                             │
│  Lazy: Zusätzliche Visualisierungen (Code Split)    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Wichtig:** Three.js/Threlte ist Client-only (`browser` check oder `onMount`).

---

## 2. Modul-/Ordnerstruktur

```
src/
├── lib/
│   ├── components/
│   │   ├── vinyl/
│   │   │   ├── VinylChart.svelte           # Canvas Container
│   │   │   ├── VinylScene.svelte           # 3D Scene, Lighting, Camera
│   │   │   ├── VinylModel.svelte           # GLB Loader
│   │   │   ├── PieSegments.svelte          # Genre Segments (3D oder Overlay)
│   │   │   └── VinylInteraction.svelte     # Drag Handler (kann in Scene)
│   │   │
│   │   ├── detail/
│   │   │   ├── DetailPanel.svelte          # Container
│   │   │   ├── DetailSection.svelte        # Einzelne Sektion
│   │   │   ├── StatCard.svelte             # Stat-Anzeige
│   │   │   ├── ArtistList.svelte           # Top Artists
│   │   │   └── TrackList.svelte            # Top Tracks
│   │   │
│   │   ├── scroll/
│   │   │   ├── ScrollContainer.svelte      # Scroll Wrapper
│   │   │   ├── Section.svelte              # Einzelne Sektion
│   │   │   ├── SectionManager.svelte       # Intersection Observer Logic
│   │   │   └── ScrollIndicator.svelte      # UI Hint
│   │   │
│   │   ├── layout/
│   │   │   ├── PageShell.svelte            # Outer Layout
│   │   │   ├── Header.svelte               # Optional
│   │   │   └── Footer.svelte               # Credits
│   │   │
│   │   └── shared/
│   │       ├── AnimatedNumber.svelte       # Tweened Numbers
│   │       ├── ProgressRing.svelte         # Circular Progress
│   │       └── Icon.svelte                 # Icon Wrapper
│   │
│   ├── stores/
│   │   ├── dataStore.ts                    # Genre Data
│   │   ├── uiStore.ts                      # UI State (rotation, active)
│   │   ├── scrollStore.ts                  # Scroll Position, Active Section
│   │   └── configStore.ts                  # Detail Panel Config
│   │
│   ├── data/
│   │   ├── raw/                            # Spotify JSON Files (gitignored)
│   │   │   └── .gitkeep
│   │   ├── processed/
│   │   │   ├── genres.json                 # Pre-processed Genres
│   │   │   └── artistGenreMap.json         # Artist → Genres Mapping
│   │   ├── cache/                          # Spotify API Response Cache
│   │   │   ├── artistGenres.json           # Artist ID → Genres (via API)
│   │   │   ├── artistDetails.json          # Artist ID → Full Details
│   │   │   └── trackFeatures.json          # Track ID → Audio Features
│   │   └── loaders/
│   │       └── dataLoader.ts               # Dynamic Import Logic
│   │
│   ├── services/
│   │   ├── spotifyApi.ts                   # Spotify Web API Client
│   │   ├── cacheService.ts                 # Local Cache Read/Write
│   │   └── dataEnrichmentService.ts        # Combine Cache + API Logic
│   │
│   ├── utils/
│   │   ├── dataProcessor.ts                # Main Processing Pipeline
│   │   ├── genreAggregator.ts              # Genre-spezifische Logik
│   │   ├── formatters.ts                   # Number/Time Formatters
│   │   ├── mathUtils.ts                    # Polar Coords, Angle Calc
│   │   ├── dragPhysics.ts                  # Drag, Momentum, Snap
│   │   └── colorUtils.ts                   # Genre Colors
│   │
│   ├── types/
│   │   ├── index.ts                        # Re-exports
│   │   ├── spotify.ts                      # Raw Spotify Types
│   │   ├── genre.ts                        # Processed Genre Types
│   │   ├── ui.ts                           # UI State Types
│   │   └── config.ts                       # Configuration Types
│   │
│   ├── constants/
│   │   ├── colors.ts                       # Genre Color Palette
│   │   ├── physics.ts                      # Drag/Snap Constants
│   │   └── breakpoints.ts                  # Responsive Breakpoints
│   │
│   └── actions/
│       ├── drag.ts                         # Svelte Action: use:drag
│       ├── intersect.ts                    # Svelte Action: use:intersect
│       └── tooltip.ts                      # Svelte Action: use:tooltip
│
├── routes/
│   ├── +layout.svelte                      # Global Layout
│   ├── +layout.ts                          # Load Global Data
│   ├── +page.svelte                        # Main Page
│   └── +page.ts                            # Page-specific Load
│
├── app.html                                # HTML Shell
├── app.css                                 # Global CSS + Variables
└── app.d.ts                                # Global Type Declarations

static/
├── models/
│   └── vinyl.glb                           # 3D Modell
├── fonts/                                  # Custom Fonts
└── og-image.png                            # Social Preview
```

---

## 3. Datenpipeline

### 3.1 Pipeline-Übersicht

```
┌──────────────────────────────────────────────────────────────────┐
│                      DATA PIPELINE                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Spotify JSONs]  ──┬──→  combineDatasets()                      │
│       ×12          │           ↓                                 │
│                    │      Deduplizierung                         │
│                    │           ↓                                 │
│                    │      Sortierung (chronologisch)             │
│                    │           ↓                                 │
│                    │      extractUniqueArtists()                 │
│                    │           ↓                                 │
│  ┌─────────────────────────────────────────────────────┐         │
│  │           SPOTIFY API CACHING LAYER                 │         │
│  ├─────────────────────────────────────────────────────┤         │
│  │  Cache Check → Hit?                                 │         │
│  │    ├── JA  → Load from artistGenreMap.json          │         │
│  │    └── NEIN → fetchFromSpotifyAPI()                 │         │
│  │               → saveToCache()                       │         │
│  └─────────────────────────────────────────────────────┘         │
│                              ↓                                   │
│  [artistGenreMap]  ──────→  enrichWithGenres()                   │
│                              ↓                                   │
│                         aggregateByGenre()                       │
│                              ↓                                   │
│                         calculateStats()                         │
│                              ↓                                   │
│                         sortAndLimit()                           │
│                              ↓                                   │
│                         [GenreData[]]                            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Wichtig:** Genre-Daten sind **nicht** in der Spotify Streaming History enthalten!
Sie müssen über die Spotify Web API abgerufen werden. Um wiederholte API-Calls
zu vermeiden, werden die Daten lokal gecached.

### 3.2 Transformationsschritte (aus Observable)

| # | Observable Code | TypeScript Funktion | Input | Output |
|---|-----------------|---------------------|-------|--------|
| 1 | `datasets` Array mit 12 Files | `combineDatasets(files: SpotifyTrack[][])` | 12 Arrays | 1 Array |
| 2 | Implicit dedup via Set | `deduplicateTracks(tracks)` | Tracks[] | Tracks[] (unique) |
| 3 | `artistsWithGenres` (API call) | `loadArtistGenreMap()` | JSON File | Map<string, string[]> |
| 4 | `genreAnalysis.artistGenreMap` | `buildGenreMap(artistsWithGenres)` | ArtistWithGenres[] | Map |
| 5 | `genrePlotData` | `aggregateByGenre(tracks, genreMap)` | Tracks, Map | GenreStats[] |
| 6 | Sorting + slice | `sortAndLimit(genres, limit)` | GenreStats[] | GenreData[] |

### 3.3 TypeScript Implementierung

```typescript
// src/lib/utils/dataProcessor.ts

import type { SpotifyTrack, GenreData, ArtistGenreMapping } from '$lib/types';

export function processSpotifyData(
  rawTracks: SpotifyTrack[],
  artistGenreMap: ArtistGenreMapping
): GenreData[] {
  // Step 1: Enrich tracks with genre info
  const enrichedTracks = enrichWithGenres(rawTracks, artistGenreMap);
  
  // Step 2: Aggregate by genre
  const genreStats = aggregateByGenre(enrichedTracks);
  
  // Step 3: Calculate percentages and sort
  const totalMinutes = calculateTotalMinutes(genreStats);
  const withPercentages = addPercentages(genreStats, totalMinutes);
  
  // Step 4: Sort and limit
  return sortAndLimit(withPercentages, 12);
}

// Weitere Funktionen...
```

### 3.4 Validierung & Tests

| Test | Beschreibung | Fixture |
|------|--------------|---------|
| `combineDatasets.test.ts` | Kombiniert 2 Mini-Datasets | 10 Tracks |
| `deduplicateTracks.test.ts` | Entfernt Duplikate | 5 Tracks, 2 dupe |
| `aggregateByGenre.test.ts` | Korrekte Aggregation | 20 Tracks, 3 Genres |
| `sortAndLimit.test.ts` | Sortierung und Limit | 10 Genres → 5 |

### 3.5 Performance-Strategien

| Strategie | Wo | Warum |
|-----------|-----|-------|
| **Pre-Processing** | Build Time | Große Datasets vorverarbeiten |
| **Memoization** | `derived` Stores | Berechnungen cachen |
| **Lazy Loading** | Zusätzliche Viz | Code-Split |
| **Web Worker** | Optional | Falls >100k Tracks |

---

## 4. Visualisierung Schallplatte

### 4.1 GLB Loading

```typescript
// src/lib/components/vinyl/VinylModel.svelte
<script lang="ts">
  import { GLTF } from '@threlte/extras';
  
  export let url = '/models/vinyl.glb';
  export let rotation = 0; // In Radians
</script>

<GLTF 
  {url}
  rotation.y={rotation}
  castShadow
  receiveShadow
/>
```

**Annahme:** GLB enthält Vinyl als einzelnes Mesh oder Group. Keine separaten Materials für Segmente.

### 4.2 Segment-Mapping Strategien

| Strategie | Beschreibung | Pro | Contra |
|-----------|--------------|-----|--------|
| **A: Angle-Based** | Berechne Winkel der Maus relativ zum Center | Einfach, performant | Kein visuelles Segment-Highlight |
| **B: Overlay Meshes** | Erstelle Three.js Meshes als Overlay | Raycast möglich | Komplexer, Z-Fighting |
| **C: UV-Based** | Map Genres auf UV, Textur-Lookup | Präzise | Requires UV unwrap |
| **D: Canvas 2D Overlay** | HTML Canvas über 3D | Einfach zu stylen | Sync mit 3D schwierig |

**Entscheidung:** Strategie A (Angle-Based) für MVP, da:
- Keine Raycast-Komplexität
- Performance ist maximal
- Segmente müssen nicht visuell hervorgehoben werden (nur Detail-Panel)

### 4.3 Winkel-Berechnung für Segmente

```typescript
// src/lib/utils/mathUtils.ts

export interface SegmentBounds {
  id: string;
  startAngle: number;  // Degrees, 0 = 12 Uhr
  endAngle: number;
  percentage: number;
}

export function calculateSegmentBounds(genres: GenreData[]): SegmentBounds[] {
  let currentAngle = 0;
  
  return genres.map(genre => {
    const segmentAngle = (genre.percentage / 100) * 360;
    const bounds = {
      id: genre.id,
      startAngle: currentAngle,
      endAngle: currentAngle + segmentAngle,
      percentage: genre.percentage
    };
    currentAngle += segmentAngle;
    return bounds;
  });
}

export function findSegmentAtAngle(
  angle: number, 
  segments: SegmentBounds[]
): SegmentBounds | null {
  const normalized = ((angle % 360) + 360) % 360;
  
  return segments.find(seg => 
    normalized >= seg.startAngle && normalized < seg.endAngle
  ) ?? null;
}
```

### 4.4 Aktive Position (3 Uhr = 90°)

```typescript
// Position die "ausgewählt" ist
const ACTIVE_ANGLE = 90; // 3 Uhr

export function getActiveSegment(
  rotation: number,  // Aktuelle Rotation der Vinyl
  segments: SegmentBounds[]
): SegmentBounds | null {
  // Was ist bei 90° unter Berücksichtigung der Rotation?
  const effectiveAngle = (ACTIVE_ANGLE - rotation + 360) % 360;
  return findSegmentAtAngle(effectiveAngle, segments);
}
```

---

## 5. Interaktion

### 5.1 Drag-to-Rotate

```typescript
// src/lib/utils/dragPhysics.ts

import { PHYSICS } from '$lib/constants/physics';

interface DragState {
  isDragging: boolean;
  startX: number;
  currentRotation: number;
  velocity: number;
}

export function createDragHandler(options: {
  onRotate: (rotation: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onSnapComplete?: (segmentId: string) => void;
  getSegments: () => SegmentBounds[];
}) {
  let state: DragState = {
    isDragging: false,
    startX: 0,
    currentRotation: 0,
    velocity: 0
  };
  
  let rafId: number | null = null;
  
  function handlePointerDown(e: PointerEvent) {
    state.isDragging = true;
    state.startX = e.clientX;
    state.velocity = 0;
    options.onDragStart?.();
  }
  
  function handlePointerMove(e: PointerEvent) {
    if (!state.isDragging) return;
    
    const deltaX = e.clientX - state.startX;
    state.velocity = deltaX * PHYSICS.DRAG_SENSITIVITY;
    state.currentRotation += state.velocity;
    state.startX = e.clientX;
    
    options.onRotate(state.currentRotation);
  }
  
  function handlePointerUp() {
    if (!state.isDragging) return;
    state.isDragging = false;
    options.onDragEnd?.();
    startMomentum();
  }
  
  function startMomentum() {
    function tick() {
      if (Math.abs(state.velocity) < PHYSICS.MIN_VELOCITY) {
        snapToNearest();
        return;
      }
      
      state.velocity *= PHYSICS.FRICTION;
      state.currentRotation += state.velocity;
      options.onRotate(state.currentRotation);
      
      rafId = requestAnimationFrame(tick);
    }
    tick();
  }
  
  function snapToNearest() {
    const segments = options.getSegments();
    const target = calculateSnapTarget(state.currentRotation, segments);
    animateSnapTo(target, options.onRotate, () => {
      const active = getActiveSegment(target, segments);
      if (active) options.onSnapComplete?.(active.id);
    });
  }
  
  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    destroy: () => { if (rafId) cancelAnimationFrame(rafId); }
  };
}
```

### 5.2 Snap-Animation

```typescript
// Ease-out-back für natürliches Feeling
export function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

export function animateSnapTo(
  targetRotation: number,
  onUpdate: (rotation: number) => void,
  onComplete: () => void,
  duration = 400
) {
  const startRotation = currentRotation;
  const delta = targetRotation - startRotation;
  const startTime = performance.now();
  
  function tick(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutBack(progress);
    
    onUpdate(startRotation + delta * eased);
    
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      onComplete();
    }
  }
  
  requestAnimationFrame(tick);
}
```

### 5.3 Physics Constants

```typescript
// src/lib/constants/physics.ts

export const PHYSICS = {
  DRAG_SENSITIVITY: 0.3,    // Pixel → Grad
  FRICTION: 0.95,           // Momentum Abbremsung
  MIN_VELOCITY: 0.5,        // Unter diesem Wert → Snap
  SNAP_DURATION: 400,       // ms
  ACTIVE_ANGLE: 90          // 3 Uhr Position
} as const;
```

---

## 6. Detail Panel

### 6.1 Konfigurationsschema

```typescript
// src/lib/types/config.ts

export interface DetailSectionConfig {
  id: string;
  type: 'header' | 'stat' | 'stat-grid' | 'list' | 'progress';
  label?: string;
  dataKey: keyof GenreData | string;  // string für nested paths
  visible: boolean;
  order: number;
  options?: {
    icon?: string;
    format?: 'number' | 'hours' | 'percent';
    maxItems?: number;  // für lists
  };
}

export interface DetailPanelConfig {
  sections: DetailSectionConfig[];
  animation: 'fade' | 'slide' | 'none';
  position: 'right' | 'bottom' | 'overlay';
}

// Default Config
export const DEFAULT_DETAIL_CONFIG: DetailPanelConfig = {
  sections: [
    { id: 'name', type: 'header', dataKey: 'name', visible: true, order: 0 },
    { id: 'percentage', type: 'stat', label: 'Anteil', dataKey: 'percentage', visible: true, order: 1, options: { format: 'percent' } },
    { id: 'trackCount', type: 'stat', label: 'Tracks', dataKey: 'trackCount', visible: true, order: 2, options: { icon: '🎵', format: 'number' } },
    { id: 'totalHours', type: 'stat', label: 'Gehört', dataKey: 'totalHours', visible: true, order: 3, options: { icon: '⏱️', format: 'hours' } },
    { id: 'topArtists', type: 'list', label: 'Top Artists', dataKey: 'topArtists', visible: true, order: 4, options: { maxItems: 5 } },
    { id: 'topTracks', type: 'list', label: 'Top Tracks', dataKey: 'topTracks', visible: true, order: 5, options: { maxItems: 5 } }
  ],
  animation: 'slide',
  position: 'right'
};
```

### 6.2 Komponenten-Architektur

```svelte
<!-- DetailPanel.svelte -->
<script lang="ts">
  import { configStore } from '$lib/stores/configStore';
  import DetailSection from './DetailSection.svelte';
  import type { GenreData } from '$lib/types';
  
  export let genre: GenreData | null;
  export let show: boolean;
  
  $: sortedSections = $configStore.sections
    .filter(s => s.visible)
    .sort((a, b) => a.order - b.order);
</script>

{#if show && genre}
  <aside class="detail-panel" transition:fly={{ x: 300 }}>
    {#each sortedSections as section (section.id)}
      <DetailSection config={section} data={genre} />
    {/each}
  </aside>
{/if}
```

---

## 7. Scrollytelling

### 7.1 Section Manager

```typescript
// src/lib/stores/scrollStore.ts

import { writable, derived } from 'svelte/store';

interface ScrollState {
  currentSection: number;
  scrollProgress: number;  // 0-1 innerhalb Sektion
  direction: 'up' | 'down' | null;
}

export const scrollStore = writable<ScrollState>({
  currentSection: 0,
  scrollProgress: 0,
  direction: null
});

// Derived: Ist Vinyl-Sektion aktiv?
export const isVinylActive = derived(scrollStore, $s => $s.currentSection === 1);
```

### 7.2 Intersection Observer Action

```typescript
// src/lib/actions/intersect.ts

export function intersect(node: HTMLElement, options: {
  onEnter?: () => void;
  onLeave?: () => void;
  threshold?: number;
}) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        options.onEnter?.();
      } else {
        options.onLeave?.();
      }
    });
  }, { threshold: options.threshold ?? 0.5 });
  
  observer.observe(node);
  
  return {
    destroy() {
      observer.disconnect();
    }
  };
}
```

### 7.3 Animationsstrategie

| Sektion | Enter Animation | Exit Animation |
|---------|-----------------|----------------|
| Hero | Fade In | Fade Out Up |
| Vinyl | Scale In + Rotate | Scale Out |
| Timeline | Slide In Left | Slide Out Right |
| Outro | Fade In | - |

---

## 8. Meilensteine

### 8.1 MVP Iterationen

| Iteration | Scope | Deliverable | Dauer |
|-----------|-------|-------------|-------|
| **M0** | Setup | Projekt, Struktur, Tooling | 1 Tag |
| **M1** | Data | Pipeline funktioniert, Tests grün | 2 Tage |
| **M2** | 3D Basic | GLB lädt, rendert, ist statisch sichtbar | 1 Tag |
| **M3** | Rotation | Drag funktioniert, Momentum, kein Snap | 1 Tag |
| **M4** | Selection | Snap, Active Segment, Event emittiert | 1 Tag |
| **M5** | Detail Panel | Panel zeigt Daten, Config funktioniert | 1 Tag |
| **M6** | Scroll Shell | 2 Sektionen, Transition | 1 Tag |
| **M7** | Polish | Responsive, A11y, Performance | 2 Tage |

**Gesamt MVP: ~10 Tage**

### 8.2 Task Breakdown M1 (Data)

| Task | Datei | Stunden |
|------|-------|---------|
| Types definieren | `src/lib/types/*.ts` | 2h |
| `combineDatasets()` | `dataProcessor.ts` | 1h |
| `enrichWithGenres()` | `dataProcessor.ts` | 1h |
| `aggregateByGenre()` | `genreAggregator.ts` | 2h |
| Tests schreiben | `*.test.ts` | 2h |
| Sample Data erstellen | `data/processed/` | 1h |
| Store Setup | `stores/dataStore.ts` | 1h |

---

## 9. Testplan

### 9.1 Unit Tests

| Modul | Testfälle |
|-------|-----------|
| `dataProcessor` | combine, dedupe, enrich, aggregate |
| `mathUtils` | angle calculation, segment finding |
| `dragPhysics` | velocity, friction, snap target |
| `formatters` | numbers, hours, percent |

### 9.2 Integration Tests

| Szenario | Beschreibung |
|----------|--------------|
| Data → Store | Processed data in Store korrekt |
| Drag → Rotation | User Drag aktualisiert Rotation |
| Rotation → Active | Rotation Change triggert Active Segment |
| Active → Panel | Active Segment aktualisiert Panel |

### 9.3 E2E Tests (Playwright)

| Test | Beschreibung |
|------|--------------|
| `vinyl-interaction.spec.ts` | Drag, rotate, snap |
| `scroll-navigation.spec.ts` | Section wechseln |
| `detail-panel.spec.ts` | Panel zeigt korrekten Content |

### 9.4 Performance Budgets

| Metrik | Budget |
|--------|--------|
| LCP | <2.5s |
| FID | <100ms |
| CLS | <0.1 |
| Frame Time (Drag) | <16ms |
| Bundle Size (JS) | <200KB |

---

## 10. Schnittstellen & Typen

### 10.1 Core Types

```typescript
// src/lib/types/genre.ts

export interface GenreData {
  id: string;
  name: string;
  trackCount: number;
  totalMinutesListened: number;
  totalHours: number;
  percentage: number;
  color: string;
  topArtists: ArtistStat[];
  topTracks: TrackStat[];
  avgMinutesPerTrack: number;
}

export interface ArtistStat {
  name: string;
  playCount: number;
  totalHours: number;
}

export interface TrackStat {
  name: string;
  artist: string;
  playCount: number;
  totalMinutesPlayed: number;
}
```

### 10.2 Store Contracts

```typescript
// DataStore
interface DataStoreValue {
  genres: GenreData[];
  totalTracks: number;
  totalHours: number;
  isLoaded: boolean;
}

// UIStore
interface UIStoreValue {
  vinylRotation: number;
  activeGenreId: string | null;
  isDragging: boolean;
  isSnapping: boolean;
}

// ScrollStore
interface ScrollStoreValue {
  currentSection: number;
  scrollProgress: number;
}
```

### 10.3 Component Props

```typescript
// VinylChart Props
interface VinylChartProps {
  genres: GenreData[];
  rotation?: number;
  onRotationChange?: (rotation: number) => void;
  onGenreSelect?: (genreId: string) => void;
}

// DetailPanel Props
interface DetailPanelProps {
  genre: GenreData | null;
  config?: DetailPanelConfig;
  show?: boolean;
}
```

---

## 11. Entscheidungspunkte & Alternativen

### 11.1 Offene Entscheidungen

| ID | Frage | Optionen | Empfehlung | Deadline |
|----|-------|----------|------------|----------|
| D1 | Segment visuell hervorheben? | Nein / Glow / Color shift | Nein (MVP) | M4 |
| D2 | Scroll-Snap verwenden? | Native CSS / Custom / Keins | Custom | M6 |
| D3 | Daten pre-processed oder on-demand? | Pre / On-demand | Pre (Build) | M1 |

### 11.2 Trade-off Dokumentation

| Trade-off | Gewählt | Grund |
|-----------|---------|-------|
| Threlte vs Vanilla Three | Threlte | Svelte Integration, weniger Boilerplate |
| Angle-based vs Raycast | Angle | Performanter, ausreichend für Use Case |
| Stores vs Context | Stores | Global access, simpler |

---

## Changelog

| Datum | Version | Änderung |
|-------|---------|----------|
| 2025-12-12 | 1.0.0 | Initial Draft |
