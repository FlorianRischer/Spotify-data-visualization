# Projekt-Writeup: Musical Brain Activity
## Spotify Hördaten-Visualisierung als interaktiver Genre-Netzwerk-Graph

---

# 1. Projektüberblick

## 1.1 Projektbeschreibung (Formulierungsvorschlag)

> **Musical Brain Activity** ist eine interaktive Datenvisualisierung, die persönliche Spotify-Hördaten über einen Zeitraum von ~7 Jahren (2018-2025) als lebendigen, neuronalen Netzwerk-Graph darstellt. Die Visualisierung macht Genre-Beziehungen sichtbar, die durch Multi-Genre-Künstler entstehen, und ermöglicht es, die eigene musikalische Entwicklung chronologisch nachzuvollziehen.

## 1.2 Verwendete Datenquellen

### Primärdaten: Spotify Extended Streaming History
- **Format:** JSON-Dateien (12 Dateien, ca. 400.000+ Einträge insgesamt)
- **Zeitraum:** August 2018 - Januar 2025
- **Quelle:** Spotify DSGVO-Datenexport (persönliche Anfrage über Spotify Account)
- **Datenpunkte pro Eintrag:**
  - `ts` - Timestamp des Abspielens
  - `ms_played` - Abspieldauer in Millisekunden
  - `master_metadata_track_name` - Songname
  - `master_metadata_album_artist_name` - Künstlername
  - `spotify_track_uri` - Spotify Track ID
  - Weitere Metadaten (Platform, Country, Shuffle, etc.)

### Sekundärdaten: Artist-Genre-Mapping
- **Quelle:** Spotify Web API (Artist Endpoint)
- **Caching:** Vorberechneter JSON-Cache (`artist-cache-2025-12-13.json`) mit ~2.500 Künstlern
- **Grund für Caching:** API-Rate-Limits, Offline-Nutzung, Performance

## 1.3 Data Wrangling Prozess

### Schritt 1: Streaming History laden
```
12 JSON-Dateien → Kombiniert zu einem Array → ~400.000 Streaming-Einträge
```

### Schritt 2: Unique Artists extrahieren
```
Streaming-Einträge → Filter (nur mit Artist-Name) → Set → ~2.500 unique Artists
```

### Schritt 3: Genre-Mapping (Spotify API / Cache)
```
Artist-Namen → Spotify Search API → Artist ID → Artist Details → Genres Array
Ergebnis: { artistName: "Radiohead", genres: ["alternative rock", "art rock", "permanent wave"] }
```

### Schritt 4: Genre-Statistiken berechnen
```typescript
// Pro Genre aggregieren:
- playCount: Anzahl Plays
- totalMinutes: Gesamte Hörzeit
- topArtist: Meistgehörter Künstler des Genres
```

### Schritt 5: Graph-Struktur aufbauen
```
Nodes = Genres (Größe = √totalMinutes)
Edges = Verbindungen zwischen Genres (wenn ein Artist mehrere Genres hat)
Edge Weight = Anzahl gemeinsamer Artists
```

### Schritt 6: Genre Discovery Timeline
```
Für jedes Genre: Finde erstes Abspielen → Chronologische Reihenfolge
Ergebnis: Wann wurde welches Genre "entdeckt"?
```

## 1.4 Verwendete Technologien & Libraries

| Kategorie | Technologie | Version | Verwendungszweck |
|-----------|-------------|---------|------------------|
| **Framework** | SvelteKit | 2.x | Web-Framework mit SSR |
| **Sprache** | TypeScript | 5.4 | Typsicherheit |
| **Rendering** | HTML5 Canvas | - | 2D Graph-Rendering |
| **Build** | Vite | 6.x | Bundling & Dev Server |
| **Styling** | CSS | - | Custom Styling (keine UI-Library) |
| **State** | Svelte Stores | - | Reaktives State Management |

### Keine externen Visualisierungs-Libraries!
Die gesamte Graph-Visualisierung wurde **from scratch** implementiert:
- Custom Physics Engine (Kraft-basierte Simulation)
- Custom Canvas Renderer
- Custom Kamera-Controller (Zoom/Pan)
- Custom Animationen (Easing, Transitions)

---

# 2. KI-Tools Verwendung

## 2.1 Verwendete Tools

| Tool | Verwendungszweck |
|------|------------------|
| **GitHub Copilot (Claude)** | Code-Generierung, Architektur-Beratung, Debugging |
| **VS Code Copilot Chat** | Inline-Unterstützung während Entwicklung |

## 2.2 Wofür KI verwendet wurde

### Architektur & Planning
- PRD (Product Requirements Document) erstellen
- Modulare Code-Struktur planen
- TypeScript Interfaces definieren

### Code-Generierung
- Physics Engine Implementation
- Canvas Rendering Pipeline
- Svelte Store Architektur
- CSS Responsive Design

### Debugging & Optimierung
- Performance-Bottlenecks identifizieren
- Canvas Rendering optimieren
- Physics-Parameter tunen

### Dokumentation
- Code-Kommentare
- README Dateien
- Diese Writeup-Vorlage

## 2.3 Beispiel-Prompts (Anhang)

### Prompt 1: Physics Engine Konzept
```
Ich baue einen Force-Directed Graph für Genre-Visualisierung. Die Nodes sollen:
1. Sich gegenseitig abstoßen (Repulsion)
2. Über Edges verbunden sein (Spring Force)
3. Zu Kategorie-Ankerpunkten hingezogen werden
4. Smooth animieren ohne zu zittern

Implementiere eine Physics Engine in TypeScript mit:
- stepPhysics() Funktion
- Konfigurierbare Parameter (repulsion, spring, damping)
- Velocity-basierte Simulation
- Boundary constraints
```

### Prompt 2: Canvas Renderer
```
Erstelle einen Canvas Renderer für den Graph mit:
- Nodes als Kreise (Größe = playCount)
- Edges als Linien (Opacity = weight)
- Hover-Effekte (Glow, Scale)
- Camera Zoom/Pan Support
- 60fps Performance bei 200+ Nodes
```

### Prompt 3: Scrollytelling Architecture
```
Ich möchte eine Scrollytelling-Experience bauen:
1. Start: Spiral Animation der Nodes
2. Overview: Alle Genres nach Kategorie gruppiert
3. Zoom: In einzelne Kategorien zoomen
4. Timeline: Horizontale Zeitachse mit Genre-Entdeckungen

Plane die State-Architektur mit Svelte Stores.
```

### Prompt 4: Responsive Design
```
Mein Canvas soll auf verschiedenen Bildschirmgrößen gleich aussehen.
Berechne einen scaleFactor basierend auf einer Baseline von 1200x800.
Alle Physics-Parameter und Node-Größen sollen proportional skalieren.
```

---

# 3. Visualisierungsentscheidungen

## 3.1 Force-Directed Network Graph

### Visualisierungstyp
**Interaktiver Force-Directed Graph** mit physik-basierter Simulation

### Warum diese Visualisierung?

#### Genre-Beziehungen sichtbar machen
> Ein Netzwerk-Graph ist ideal, um **nicht-hierarchische Beziehungen** darzustellen. Genres sind nicht in einer klaren Hierarchie organisiert – ein Artist kann gleichzeitig "indie rock", "dream pop" und "shoegaze" sein. Diese Multi-Genre-Verbindungen erzeugen ein organisches **Cluster-Muster**: Verwandte Genres gravitieren zueinander.

#### Muster & Insights
- **Cluster-Bildung:** Genres der gleichen "Musik-Familie" bilden natürliche Gruppen (z.B. elektronische Genres, Rock-Varianten)
- **Bridge-Genres:** Einzelne Genres verbinden verschiedene Cluster (z.B. "art rock" verbindet Indie und Progressive)
- **Isolierte Genres:** Genres mit wenigen Verbindungen sind "musikalische Ausreißer" im persönlichen Geschmack
- **Dichte:** Bereiche mit vielen Verbindungen zeigen, wo sich der musikalische Geschmack konzentriert

#### Warum NICHT andere Visualisierungen?
| Alternative | Problem |
|-------------|---------|
| Treemap | Zeigt nur Hierarchie, keine Beziehungen |
| Pie Chart | Zeigt Proportionen, aber keine Verbindungen |
| Bar Chart | Keine räumliche Nähe/Ähnlichkeit |
| Chord Diagram | Zu komplex bei 150+ Genres |

### Encoding (visuelle Variablen)
| Datenpunkt | Visuelles Encoding | Begründung |
|------------|-------------------|------------|
| Genre Hörzeit | Node-Größe (√minutes) | Flächenwahrnehmung ist logarithmisch |
| Genre-Kategorie | Node-Farbe | Schnelle Kategorisierung |
| Multi-Genre Artists | Edge (Verbindungslinie) | Zeigt Beziehung |
| Verbindungsstärke | Edge Opacity | Subtile Gewichtung |

## 3.2 Timeline-Visualisierung

### Visualisierungstyp
**Horizontale Timeline** mit Monats-Granularität

### Warum diese Visualisierung?

#### Chronologische Genre-Entdeckung
> Die Timeline beantwortet: "Wann habe ich welche Genres entdeckt?" Eine horizontale Zeitachse ist die **natürlichste Metapher** für zeitliche Abfolgen. Westliche Leserichtung (links→rechts) entspricht der Zeitrichtung (früher→später).

#### Muster & Insights
- **Entdeckungs-Phasen:** Zeiträume mit vielen neuen Genres vs. "Konsolidierungs-Phasen"
- **Saisonale Muster:** Werden bestimmte Genres zu bestimmten Jahreszeiten entdeckt?
- **Genre-Entwicklung:** Wie hat sich der Geschmack über 7 Jahre verändert?

### Design-Entscheidungen
- **Jahrweise Navigation:** User navigiert Jahr für Jahr (nicht kontinuierliches Scrollen)
- **Monats-Ticks:** Präzise zeitliche Einordnung
- **Node-Positionierung:** Genres erscheinen im Graph an ihrer "Entdeckungs-Position"

## 3.3 Kategorie-Übersicht (Overview Mode)

### Visualisierungstyp
**Gruppierte Cluster-Ansicht** mit Kategorie-Labels

### Warum diese Visualisierung?

#### High-Level Overview
> Die Übersicht gruppiert ~150 Genres in ~12 Hauptkategorien. Dies reduziert die **kognitive Last** und ermöglicht einen schnellen Überblick über die Genre-Landschaft.

#### Muster & Insights
- **Dominante Kategorien:** Welche Musik-Richtungen dominieren?
- **Kategorie-Balance:** Ist der Geschmack breit gestreut oder fokussiert?
- **Räumliche Anordnung:** Verwandte Kategorien sind näher beieinander

## 3.4 Interaktivität

### Hover-Effekte
| Interaktion | Reaktion | Begründung |
|-------------|----------|------------|
| Node Hover | Scale + Glow | Fokussiert Aufmerksamkeit |
| Node Hover | Tooltip mit Details | Details-on-Demand |
| Edge Highlight | Verbundene Nodes hervorheben | Beziehungen erkunden |

### Keyboard Navigation
- **Pfeiltasten:** Navigation durch Kategorien
- **Tab:** Focus durch Nodes
- **Enter:** Node auswählen

### Suchfunktion (Explore Mode)
- **Echtzeit-Filter:** Nodes matchen während der Eingabe
- **Focus Mode:** Nicht-Matches werden ausgeblendet
- **Artist-Suche:** Finde Genres über Künstlernamen

---

# 4. Besondere Achievements

## 4.1 Custom Physics Engine (from scratch)

> Die komplette Force-Directed Simulation wurde ohne D3.js oder andere Libraries implementiert. Dies ermöglichte:
- **Volle Kontrolle** über Animation & Timing
- **Custom Forces:** Kategorie-Anker, Cursor-Attraktion, Search-Repulsion
- **Performance-Optimierung:** Tailored für diesen Use Case

### Technische Details
```typescript
// Kräfte pro Simulation-Step:
1. Node-Node Repulsion (Inverse Square Law)
2. Edge Spring Force (Hooke's Law)
3. Category Anchor Attraction
4. Cursor Attraction (Explore Mode)
5. Search Bar Repulsion
6. Velocity Damping
7. Boundary Constraints
```

## 4.2 Responsive Design (Proportionales Scaling)

> Die Visualisierung skaliert **mathematisch korrekt** auf alle Bildschirmgrößen. Ein `scaleFactor` wird aus der Canvas-Größe berechnet und auf **alle** Parameter angewendet:
- Node-Größen
- Physics-Kräfte
- Abstände
- Animation-Radien

**Ergebnis:** Identisches visuelles Verhalten auf 1024px Laptop und 4K Monitor.

## 4.3 Smooth Animations (60fps)

- **Spiral Start Animation:** 10 Sekunden, gestaffelt pro Node
- **Easing Functions:** Cubic ease-out für natürliche Bewegung
- **Hover Scale:** Elastische "Water-Droplet" Animation
- **Camera Transitions:** Smooth Zoom zwischen Views

## 4.4 7 Jahre persönliche Daten

> Die Visualisierung basiert auf **echten, persönlichen Spotify-Daten** über einen Zeitraum von fast 7 Jahren. Dies macht die Analyse besonders aussagekräftig und persönlich relevant.

## 4.5 Scrollytelling Experience

> Die Seite führt den User durch eine **narrative Struktur**:
1. **Intro:** Dramatische Spiral-Animation
2. **Overview:** Alle Genres im Überblick
3. **Zoom:** Kategorie-Details erkunden
4. **Timeline:** Chronologische Reise
5. **Explore:** Freie Erkundung mit Suche

## 4.6 Keyboard Accessibility

- Komplette Navigation mit Tastatur möglich
- Respektiert `prefers-reduced-motion`
- Tab-Navigation durch Nodes

---

# 5. Technische Highlights (für Anhang)

## 5.1 Code-Architektur

```
src/
├── lib/
│   ├── components/       # Svelte UI Components
│   │   ├── graph/        # GraphCanvas, Tooltip, etc.
│   │   ├── timeline/     # Timeline-Komponente
│   │   └── scrolly/      # Scrollytelling-Controller
│   ├── graph/            # Core Graph Logic
│   │   ├── physics.ts    # Force Simulation
│   │   ├── renderer.ts   # Canvas Rendering
│   │   └── graphBuilder.ts # Data → Graph
│   ├── stores/           # Svelte Stores (State)
│   └── wrangling/        # Data Transformation
└── routes/               # SvelteKit Pages
```

## 5.2 Performance-Optimierungen

- **Canvas statt SVG:** Bessere Performance bei vielen Elementen
- **Spatial Hashing:** Schnellere Kollisionserkennung (geplant)
- **Frame Rate Limiting:** Konstante 60fps
- **Lazy Loading:** Genre-Details nur bei Bedarf

## 5.3 State Management

```typescript
// Zentrale Stores:
- graphStore: Nodes, Edges, Visibility
- scrollyStore: Phase, Category Focus, Camera
- uiStore: Hover, Animation State
- searchStore: Search Query, Matches
- timelineStore: Year, Genre Discoveries
```

---

# Checkliste für Writeup

- [ ] **Überblick:** Datenquellen genannt ✓
- [ ] **Überblick:** Data Wrangling beschrieben ✓
- [ ] **Überblick:** Libraries/Software aufgelistet ✓
- [ ] **KI-Tools:** Welche Tools genutzt ✓
- [ ] **KI-Tools:** Wofür genutzt ✓
- [ ] **KI-Tools:** Prompts angegeben ✓
- [ ] **Visualisierung:** Welche Typen genutzt ✓
- [ ] **Visualisierung:** Warum diese Entscheidungen ✓
- [ ] **Visualisierung:** Welche Muster/Insights sichtbar ✓
- [ ] **Visualisierung:** Interaktivität beschrieben ✓
- [ ] **Achievements:** Custom Physics Engine ✓
- [ ] **Achievements:** Responsive Design ✓
- [ ] **Achievements:** 7 Jahre persönliche Daten ✓
- [ ] **Achievements:** Scrollytelling ✓
- [ ] **Achievements:** Accessibility ✓

---

# Empfohlene Seitenaufteilung (2-3 Seiten)

| Seite | Inhalt |
|-------|--------|
| **S. 1** | Projektüberblick, Datenquellen, Data Wrangling, Technologien |
| **S. 2** | Visualisierungsentscheidungen (Network Graph, Timeline, Interaktivität) |
| **S. 3** | Besondere Achievements, Fazit |
| **Anhang** | KI-Prompts, Code-Beispiele, Screenshots |
