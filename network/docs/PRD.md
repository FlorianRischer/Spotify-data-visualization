# Product Requirements Document (PRD)
## Musical Brain Activity — Neural Network Graph
**Version:** 1.0.0  
**Datum:** 12. Dezember 2025  
**Status:** Draft → MVP

---

## 1. Vision & Ziele
- **Vision:** Ein explorativer, lebendiger Graph, der Genre-Beziehungen wie neuronale Aktivität sichtbar macht. Top-Genres feuern stark, benachbarte Genres blitzen auf, wenn Nutzer sie hovern.
- **Ziele:**
  - Genre-Zusammenhänge intuitiv erfahrbar machen (multi-genre Artists, Kollaborationen).
  - Überraschungen aufdecken (unerwartete Genre-Nachbarn) bei minimaler kognitiver Last.
  - Stabile, performante Interaktion mit deterministischer Struktur und kontrollierter Expansion.

## 2. User Stories / Use Cases
- **Exploration:** Als Nutzer möchte ich von den Top-3 Genres starten und das Netzwerk schrittweise durch Hover erweitern, um benachbarte Genres zu entdecken.
- **Verständnis von Genre-Übergängen:** Als Nutzer möchte ich sehen, welche Genres durch multi-genre Artists oder Kollabos verbunden sind.
- **Überraschungsfunde:** Als Nutzer möchte ich seltene oder unerwartete Genre-Verbindungen sichtbar machen, ohne von zu vielen Knoten überfordert zu werden.
- **Reset/Navigation:** Als Nutzer möchte ich jederzeit zum Startzustand zurückkehren oder schrittweise zurückspringen.
- **Performance:** Als Nutzer möchte ich keine spürbaren Ruckler beim Hover/Expand haben (<100 ms Input-to-Visual Feedback Ziel).

## 3. Functional Requirements
### 3.1 Daten- und Knoten-/Kantendefinition
- **Nodes = Genres.** Pflichtfelder pro Node: `id (slug)`, `label`, `playCount`, `totalMinutes`, `size` (derived), `degree`, optional `color`.
- **Edges = Beziehungen zwischen Genres.**
  - **Multi-Genre Artist:** Ein Artist ist mehreren Genres zugeordnet → Edge zwischen allen Paaren seiner Genres.
  - **Track Kollaboration:** Ein Track mit Artists unterschiedlicher Genres → Edges zwischen den Genres der beteiligten Artists.
  - Edge-Felder: `source`, `target`, `weight` (default: count of connections), `kind` ("multi-genre" | "collab" | "mixed"), optional `examples` (artist/track ids) für Tooltip.
- **Node Size Encoding:** Proportional zu Playcount oder Gesamthörzeit des Genres. Normalisierung: `size = sqrt(playCount) * k` mit Min/Max-Clamp.
- **Edge Weight (optional):** Wenn sinnvoll, Gewicht = Anzahl gemeinsamer Artists/Kollabos; sichtbar via opacity/width.

### 3.2 Initialzustand
- Zeige nur die **Top-3 Genres** (nach Playcount oder totalMinutes). Kanten nur zwischen diesen, falls vorhanden.

### 3.3 Hover-basierte Expansion
- Hover über einen sichtbaren Node zeigt dessen 1-Hop Nachbarn (Genres mit Edge zum Node).
- Hover über neu eingeblendete Nodes expandiert rekursiv (gleiche Regel) solange Nutzer weiter hovert.
- Expansion erfolgt inkrementell (batch), keine komplette Graph-Explosion.
- Optional: Hover-Delay (z.B. 120–200 ms) gegen Flackern; Debounce beim Verlassen (z.B. 150 ms), damit Nodes nicht sofort verschwinden.

### 3.4 Sichtbarkeits- und State-Regeln
- **Visible Set:** Start = Top-3. Beim Hover: füge 1-Hop Nachbarn hinzu; entferne sie erst, wenn Hover-Context verlassen und Debounce abgelaufen.
- **Pinning:** Click auf Node pinnt ihn (bleibt sichtbar, Edges bleiben). Unpin durch zweiten Click oder Reset. Hover-Expansion zeigt auch Nachbarn von gepinnten Nodes.
- **Reset:** Button/Shortcut stellt Startzustand (Top-3) wieder her; pinned Nodes werden entfernt.
- **Determinismus:** Gleiche Daten → gleiche Layout-Positionen (fixes Seed, stabilisierte Force-Sim, gecachte Positionen pro Seed/Filter).

### 3.5 Interaktion & Feedback
- Hover Highlight: Node glow + Edge emphasis + Tooltip (Name, Plays, % Anteil, Degree, Beispiel-Artists/Tracks wenn verfügbar).
- Neue Nodes/Edges faden/scale-in (200–400 ms) mit kurzer Delay-Queue, um Flooding zu vermeiden.
- Keine unendlichen Oszillationen: Debounce/Grace-Period auf Hide, Rate-Limit für neue Batches.

### 3.6 Accessibility & Responsiveness
- Tastaturfokus: Fokusierbare Nodes (Tab), Enter = Pin/Expand, Esc = Reset/Unpin-All.
- Reduced Motion Default: OS `prefers-reduced-motion` wird respektiert; zusätzlich Toggle in UI (override möglich). Bei aktiv: keine Scale-In, nur leichte Opacity-Fades oder instant render.
- Responsive: Layout skaliert auf Desktop/Laptop; Mobile als Light-Version (optional: limitierte Expansion, kleiner Render-Bereich).

## 4. Non-Functional Requirements
- **Performance Budgets:**
  - FPS Ziel: >= 50 FPS bei Hover/Expand bis 300 sichtbare Nodes/Edges.
  - Input-to-Visual Latency: < 100 ms bei Hover; < 200 ms bei Batch-Expand.
  - Max sichtbare Elemente ohne Degradation: ca. 400 Nodes / 800 Edges (bei Canvas/WebGL). Falls mehr: progressive render + LOD.
- **Determinismus:** Fester RNG-Seed für Force-Sim; gleiche Sortierung/Filter.
- **Maintainability:** Typisiert (TypeScript strict), modulare Services (graph builder, layout, interaction state, rendering).
- **Reliability:** Graceful Degradation bei fehlenden Kollabo-Daten (nur multi-genre Edges).
- **Accessibility:** Fokusreihenfolge, ARIA Labels für Nodes/Controls, Reduced-Motion-Schalter.
- **Responsiveness:** Breakpoints für Panel/Chart; min 320px Breite, bei sehr kleinen Screens limitierte Expansion.

## 5. Data Requirements
- **Minimales Schema:**
  - Genre: `{ id, label, playCount, totalMinutes }`
  - Artist: `{ id, name, genres[] }`
  - Track: `{ id, title, artistIds[], isCollab: bool }`
  - Collab Mapping (derived): `{ trackId, genresInvolved[] }`
- **Transformationslogik:**
  1) Aggregate Playcounts/Hörzeit pro Genre → Node size.
  2) Baue Edge-Liste:
     - Für jeden Artist mit >=2 Genres: Erzeuge alle Genre-Paare (combinations) → weight++ per artist.
     - Für jeden Kollabo-Track mit Artists unterschiedlicher Genres: Erzeuge Paare der beteiligten Genres → weight++ per track.
  3) Merge Edges gleicher Paare, summiere Gewicht, setze `kind` (mixed wenn sowohl multi-genre als auch collab beiträgt).
  4) Berechne Degree, sortiere Top-3 Genres nach playCount.
  5) Erzeuge Adjacency Map für O(1) Nachbarsuche.
- **Determinismus:** stabile Sortierung (id/label) bei Gleichstand.

## 6. Akzeptanzkriterien / Definition of Done
- Start zeigt exakt Top-3 Genres (richtig sortiert), deterministisches Layout.
- Hover über Top-3 zeigt 1-Hop Nachbarn konsistent binnen 200 ms; neue Nodes/Edges animieren in.
- Debounce/Grace verhindert Flackern beim Verlassen; Reset stellt Startzustand wieder her.
- Node-Größe skaliert sichtbar mit Playcount; Edge-Opacity/Width skaliert mit Gewicht (falls Edge-Weight aktiviert).
- Adjacency Map vorhanden; keine O(n^2) Operationen in der Hover-Loop.
- Performance-Smoke-Test (300 sichtbare Nodes) erreicht >= 50 FPS auf Referenzgerät.
- Tastaturbedienung (Tab/Enter/Esc) funktioniert; Reduced-Motion Toggle wirkt.

## 7. Risiken / Annahmen
- **Annahme:** Genre-Mapping aus Spotify ist unvollständig oder uneinheitlich → Fallback: "unknown" wird gefiltert.
- **Annahme:** Kollabo-Daten sind als Artist-Liste pro Track verfügbar; falls nicht, nur multi-genre Edges.
- **Risiko:** Sehr dichte Genre-Knoten erzeugen Overdraw → brauchen LOD/opacity cap.
- **Risiko:** API-Rate-Limits beim Live-Nachladen von Genres → Nutzung von Cache / Vorberechnung.
- **Risiko:** Hover-Flattern bei schnellen Mausbewegungen → Debounce/Pinning muss greifen.

## 8. Changelog
- **12.12.2025:** Initiales PRD für "Musical Brain Activity" Neural Network Graph erstellt.
