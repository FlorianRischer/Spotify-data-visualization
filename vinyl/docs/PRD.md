# Product Requirements Document (PRD)
## Spotify Vinyl Data Visualization

**Version:** 1.0.0  
**Erstellt:** 12. Dezember 2025  
**Status:** Draft → MVP  

---

## 1. Vision & Ziele

### 1.1 Vision
Eine immersive, scrollbare Web-Experience, die persönliche Spotify-Hördaten durch die Metapher einer Schallplatte visualisiert. Die Anwendung verbindet Data Storytelling mit haptisch wirkenden 3D-Interaktionen.

### 1.2 Projektziele

| ID | Ziel | Messkriterium |
|----|------|---------------|
| G1 | **Daten erlebbar machen** | User verbringt >60s mit Exploration |
| G2 | **Technische Exzellenz** | 60 FPS bei Interaktion, <100ms Feedback |
| G3 | **Erweiterbarkeit** | Neue Visualisierung in <4h integrierbar |
| G4 | **Portfolio-Qualität** | Deploybar, responsiv, barrierefrei |

### 1.3 Nicht-Ziele (explizit ausgeschlossen)
- Echtzeit-Spotify-API-Anbindung (Daten werden vorverarbeitet)
- Mobile-First (Desktop-First, Mobile als Nice-to-Have)
- User-Login / Multi-User

---

## 2. Zielgruppe & Use Cases

### 2.1 Primäre Zielgruppe
- **Persona:** Florian (Ersteller), Kommilitonen, Prüfer, Portfolio-Besucher
- **Kontext:** Hochschulprojekt, Informatik & Design, 3. Semester

### 2.2 Use Cases

| UC-ID | User Story | Akzeptanz |
|-------|------------|-----------|
| UC-01 | Als Besucher will ich durch Scrollen eine Story erleben | Scroll löst Sektionswechsel aus |
| UC-02 | Als Besucher will ich die Schallplatte drehen können | Drag rotiert, visuelles Feedback |
| UC-03 | Als Besucher will ich sehen, welches Genre gerade "ausgewählt" ist | 3-Uhr-Position = aktiv, Detail sichtbar |
| UC-04 | Als Besucher will ich Details zu einem Genre sehen | Panel zeigt konfigurierte Felder |
| UC-05 | Als Entwickler will ich neue Visualisierungen hinzufügen | Klare Abstraktion, <4h Aufwand |

---

## 3. Scope

### 3.1 MVP (Phase 1)

| Feature | Beschreibung | Priorität |
|---------|--------------|-----------|
| **Scrollytelling Shell** | Startscreen → Scroll → Sektionen | P0 |
| **Vinyl 3D Rendering** | GLB laden, flat auf Page, rotierbar | P0 |
| **Genre Pie Mapping** | Unsichtbare Segmente zur Datenlogik | P0 |
| **Drag-to-Rotate** | Mouse/Touch → Rotation + Inertia | P0 |
| **Selection @ 3 Uhr** | Segment bei 90° = aktiv | P0 |
| **Detail Panel** | Konfigurierbare Felder, rechts | P0 |
| **Data Pipeline** | Observable-Logik → TypeScript | P0 |

### 3.2 Post-MVP (Phase 2+)

| Feature | Beschreibung | Phase |
|---------|--------------|-------|
| Timeline-Visualisierung | Hörverhalten über Zeit | 2 |
| Artist-Network | Verbindungen zwischen Artists | 2 |
| Heatmap Tageszeit | Wann höre ich was | 2 |
| Sound-Integration | Audiofeedback bei Interaktion | 3 |
| Intro-Animation | Vinyl landet auf Plattenspieler | 3 |

---

## 4. User Journey (Scrollytelling)

### 4.1 Sektionsstruktur

```
┌─────────────────────────────────────────────────────────────┐
│ SEKTION 0: Hero / Startscreen                               │
│ - Titel, kurze Intro-Animation                              │
│ - Scroll-Indikator                                          │
├─────────────────────────────────────────────────────────────┤
│ SEKTION 1: Vinyl Genre Chart (MVP)                          │
│ - Schallplatte erscheint                                    │
│ - User kann drehen                                          │
│ - Rechts: Detail-Panel                                      │
├─────────────────────────────────────────────────────────────┤
│ SEKTION 2: Timeline (Post-MVP)                              │
│ - Hörverhalten über Monate/Jahre                            │
├─────────────────────────────────────────────────────────────┤
│ SEKTION 3: Deep Dive (Post-MVP)                             │
│ - Artist-Netzwerk / Heatmap                                 │
├─────────────────────────────────────────────────────────────┤
│ SEKTION N: Outro                                            │
│ - Zusammenfassung, Credits                                  │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Scroll-Verhalten

| Trigger | Aktion |
|---------|--------|
| Scroll Down | Nächste Sektion (smooth snap optional) |
| Scroll Up | Vorherige Sektion |
| In Sektion | Content-spezifische Animationen |

---

## 5. Functional Requirements

### 5.1 Data Pipeline

| FR-ID | Requirement | Akzeptanz |
|-------|-------------|-----------|
| FR-D01 | System lädt Spotify JSON Files | ≥1 File ladbar |
| FR-D02 | System kombiniert mehrere Datasets | Deduplizierung, Sortierung |
| FR-D03 | System aggregiert nach Genre | Via artistsWithGenres Mapping |
| FR-D04 | System berechnet: trackCount, totalMinutes, topArtists, topTracks | Korrekt vs. Observable |
| FR-D05 | Datenstruktur ist typisiert (TypeScript) | Keine `any` Types |

### 5.2 Vinyl Visualization

| FR-ID | Requirement | Akzeptanz |
|-------|-------------|-----------|
| FR-V01 | GLB Modell wird geladen und gerendert | Sichtbar, korrekte Skalierung |
| FR-V02 | Pie-Chart-Segmente sind programmatisch definiert | Winkel = Prozent |
| FR-V03 | Segmente dienen als Hit-Test-Zonen | Raycast oder Winkel-Berechnung |
| FR-V04 | Schallplatte liegt flach (XZ-Ebene) | Kamera schaut von oben/schräg |

### 5.3 Interaktion

| FR-ID | Requirement | Akzeptanz |
|-------|-------------|-----------|
| FR-I01 | Drag startet bei mousedown/touchstart auf Vinyl | isDragging = true |
| FR-I02 | Drag bewegt Vinyl in Drag-Richtung | deltaX → Rotation |
| FR-I03 | Drag endet bei mouseup/touchend | Momentum-Phase startet |
| FR-I04 | Momentum bremst mit Friction ab | velocity *= 0.95 |
| FR-I05 | Nach Momentum: Snap zu nächstem Segment-Center | Smooth Animation |
| FR-I06 | Aktives Segment = das bei 90° (3 Uhr) | Berechnung korrekt |

### 5.4 Detail Panel

| FR-ID | Requirement | Akzeptanz |
|-------|-------------|-----------|
| FR-P01 | Panel zeigt aktives Genre | Update bei Segment-Wechsel |
| FR-P02 | Angezeigte Felder sind konfigurierbar | Config-Objekt steuert Anzeige |
| FR-P03 | Felder: Genre-Name, Trackcount, Playtime, Top Artists, Top Tracks | Alle verfügbar |
| FR-P04 | Panel hat Animations bei Wechsel | Fade/Slide Transition |

### 5.5 Konfigurierbarkeit Detail Panel

```typescript
// Beispiel Config-Schema
interface DetailPanelConfig {
  sections: {
    id: string;
    label: string;
    type: 'stat' | 'list' | 'chart';
    dataKey: keyof GenreData;
    visible: boolean;
    order: number;
  }[];
}
```

---

## 6. Non-Functional Requirements

### 6.1 Performance

| NFR-ID | Requirement | Target |
|--------|-------------|--------|
| NFR-P01 | Frame Rate bei Interaktion | ≥60 FPS |
| NFR-P02 | Time to Interactive | <3s |
| NFR-P03 | Interaktions-Feedback Latenz | <100ms |
| NFR-P04 | Bundle Size (initial) | <500KB gzipped |
| NFR-P05 | 3D Asset Loading | <2s für GLB |

### 6.2 Accessibility

| NFR-ID | Requirement |
|--------|-------------|
| NFR-A01 | Keyboard-Navigation für Vinyl (Pfeiltasten) |
| NFR-A02 | ARIA Labels für Segmente |
| NFR-A03 | Reduced Motion Support |
| NFR-A04 | Kontrastverhältnis ≥4.5:1 |

### 6.3 Responsiveness

| NFR-ID | Breakpoint | Verhalten |
|--------|------------|-----------|
| NFR-R01 | Desktop (≥1024px) | Vinyl links, Panel rechts |
| NFR-R02 | Tablet (768-1023px) | Vinyl oben, Panel unten |
| NFR-R03 | Mobile (<768px) | Vereinfachte Ansicht |

### 6.4 Maintainability

| NFR-ID | Requirement |
|--------|-------------|
| NFR-M01 | TypeScript strict mode |
| NFR-M02 | Komponenten <200 LOC |
| NFR-M03 | Testabdeckung ≥70% für Utils |
| NFR-M04 | Dokumentierte Public APIs |

---

## 7. Datenanforderungen

### 7.1 Datenquellen

| Quelle | Format | Beschreibung |
|--------|--------|--------------|
| Spotify Extended Streaming History | JSON | Rohdaten (lokal, Export aus Spotify) |
| Spotify Web API | REST JSON | Metadaten: Genres, Artist-Details, Track-Features |
| Lokaler Cache | JSON | Zwischengespeicherte API-Responses |

### 7.2 Spotify API für Metadaten

**Wichtig:** Die Spotify Streaming History enthält **keine Genre-Informationen**. Diese müssen über die Spotify Web API abgerufen werden:

| Datentyp | API Endpoint | Beschreibung |
|----------|--------------|---------------|
| Artist Genres | `GET /artists/{id}` | Genres pro Artist |
| Audio Features | `GET /audio-features/{id}` | Tempo, Energy, Danceability etc. |
| Artist Images | `GET /artists/{id}` | Profilbilder |
| Track Details | `GET /tracks/{id}` | Album Art, Popularity |

### 7.3 Caching-Strategie

Um wiederholte API-Calls zu vermeiden, werden abgerufene Daten lokal zwischengespeichert:

```
┌─────────────────────────────────────────────────────────────────┐
│                    CACHING WORKFLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Request für Artist/Track]                                     │
│         ↓                                                       │
│  Cache vorhanden?                                               │
│    ├── JA  → Lade aus lokalem Cache (JSON)                      │
│    └── NEIN → API Call → Speichere in Cache → Return            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Cache-Datei | Inhalt | Update-Strategie |
|-------------|--------|------------------|
| `artistGenreMap.json` | Artist ID → Genres | Bei neuen Artists |
| `artistDetails.json` | Artist ID → { name, genres, images, popularity } | Selten (statisch) |
| `trackFeatures.json` | Track ID → Audio Features | Bei neuen Tracks |

**Vorteile:**
- Keine API-Rate-Limits bei Wiederverwendung
- Schnellere Ladezeiten (kein Netzwerk)
- Offline-Entwicklung möglich
- Reduzierte API-Quota-Nutzung

### 7.4 Datenschema (Input)

### 7.2 Datenschema (Input)

```typescript
interface SpotifyTrackRaw {
  ts: string;                                    // ISO Timestamp
  master_metadata_track_name: string | null;
  master_metadata_album_artist_name: string | null;
  master_metadata_album_album_name: string | null;
  ms_played: number;
  spotify_track_uri: string | null;
  reason_start: string | null;
  reason_end: string | null;
  shuffle: boolean | null;
  skipped: boolean | null;
}
```

### 7.3 Datenschema (Output/Visualisierung)

```typescript
interface GenreData {
  id: string;
  name: string;
  trackCount: number;
  totalMinutesListened: number;
  totalHours: number;
  percentage: number;
  color: string;
  topArtists: { name: string; playCount: number; totalHours: number }[];
  topTracks: { name: string; artist: string; playCount: number }[];
  avgMinutesPerTrack: number;
}
```

### 7.4 Transformationslogik (aus Observable)

| Schritt | Observable Funktion | TS Äquivalent |
|---------|---------------------|---------------|
| 1 | `datasets` Array | `combineSpotifyData()` |
| 2 | `artistsWithGenres` | External JSON / API |
| 3 | `genreAnalysis` | `buildGenreMap()` |
| 4 | `genrePlotData` | `processSpotifyData()` |
| 5 | Sorting/Limiting | `sortAndLimit()` |

### 7.5 Caching-Strategie

| Daten | Caching |
|-------|---------|
| Processed Genres | Svelte Store (Memory) |
| Raw Spotify Data | Static Import / Lazy Load |
| Artist-Genre-Map | Pre-computed JSON |

---

## 8. Risiken & Annahmen

### 8.1 Annahmen

| ID | Annahme |
|----|---------|
| A1 | Spotify Rohdaten liegen bereits vor (Export gemacht) |
| A2 | artistsWithGenres wurde in Observable bereits berechnet |
| A3 | GLB-Modell ist korrekt exportiert und Web-optimiert |
| A4 | User nutzt modernen Browser (Chrome/Firefox/Safari, letzte 2 Versionen) |

### 8.2 Risiken

| ID | Risiko | Impact | Mitigation |
|----|--------|--------|------------|
| R1 | GLB zu groß für Web | Hoch | Draco-Kompression, LOD |
| R2 | Genre-Mapping unvollständig | Mittel | "Other" Fallback-Kategorie |
| R3 | 3D-Performance auf Low-End | Mittel | Canvas-Fallback, Reduced Quality |
| R4 | Scrollytelling + 3D = komplex | Hoch | Klare Layer-Trennung |

---

## 9. Akzeptanzkriterien / Definition of Done

### 9.1 MVP Done-Kriterien

- [ ] Daten werden korrekt geladen und transformiert
- [ ] Schallplatte rendert und ist drehbar
- [ ] Drag-Rotation funktioniert smooth (60 FPS)
- [ ] Snap-to-Segment funktioniert mit Easing
- [ ] Detail-Panel zeigt korrektes Genre
- [ ] Scrollytelling-Shell navigiert zwischen Sektionen
- [ ] Responsive für Desktop (1024px+)
- [ ] Keine TypeScript Errors
- [ ] Lighthouse Performance ≥80

### 9.2 Feature-Level DoD

Jedes Feature ist "done" wenn:
1. Code implementiert
2. Types vollständig
3. Unit Tests grün
4. Visuell geprüft
5. Performance geprüft (<16ms Frame Time)
6. Accessibility geprüft
7. Code Review (Self-Review Checklist)

---

## 10. Offene Fragen

| ID | Frage | Blocker? | Status |
|----|-------|----------|--------|
| Q1 | Soll Snap-to-Segment optional abschaltbar sein? | Nein | Offen |
| Q2 | Wieviele Genres maximal anzeigen? | Nein | Annahme: 12 |
| Q3 | Soll Sound bei Interaktion? | Nein | Post-MVP |

---

## Changelog

| Datum | Version | Änderung |
|-------|---------|----------|
| 2025-12-12 | 1.0.0 | Initial Draft |
