# Copilot Guidelines
## Musical Brain Activity — Neural Network Graph
**Version:** 1.0.0  
**Datum:** 12. Dezember 2025

---

## Coding Rules
- TypeScript strict, keine `any`. Alle Graph-Daten strikt typisieren (siehe `types.ts`).
- Adjacency Map ist Pflicht (`Record<string, AdjacencyEntry[]>`) und muss bei Hover genutzt werden; keine O(n^2)-Scans der gesamten Edge-Liste.
- Determinismus: Fixer RNG-Seed für Layout; sortiere Eingaben stabil (label/id) bei Gleichstand.
- Keine synchrone Layout-Neuberechnung im Hover-Handler; Layout-Work vorziehen (Worker) oder cachen.
- Rendering: Canvas/WebGL bevorzugen; SVG nur für kleine Overlays oder Debug.
- Animations: nutze `requestAnimationFrame`, batch state updates; respektiere reduced-motion Flag.
- Data filtering: filtere `unknown/other/empty` Genres früh; clamp sizes.

## Pre-Flight Check (vor jedem Code)
- Vor Änderungen kurz PRD, IMPLEMENTATION_PLAN, COPILOT_GUIDELINES, BASE_INSTRUCTIONS prüfen.
- Offene Annahmen/Risiken beachten; bei Konflikten zuerst Patch-Vorschlag gemäß Update-System liefern.

## Rendering Best Practices
- Draw edges zuerst, dann Nodes (painter's order). Nutze Alpha/LOD für dichte Bereiche.
- Hit-Testing: separater Quadtree oder Distanzcheck auf sichtbare Nodes; keine Edge-Iteration für Hover.
- Batch Updates: Sammle neue Nodes/Edges pro Frame; kein Re-render pro einzelnem Neighbor.
- Avoid layout thrash: Positions sind gecacht; nur leichte Nudge bei neuen Nodes.

## Interaction Guidelines
- Hover ist debounce-gesteuert (z.B. 120–200 ms). Hide mit Grace-Period (z.B. 150 ms).
- Expansion erfolgt in Batches; limit neighbors pro Tick (z.B. 8) für Responsiveness.
- Pinning optional: wenn aktiv, Nodes/Edges bleiben sichtbar bis Reset/Unpin.
- Reset stellt Top-3 wieder her; löscht Pins und Queues.

## When Adding a New Graph Visualization (Checkliste)
- Definiere Datenschema + Adjacency Map.
- Wähle deterministischen Layout-Seed und caching-Strategie.
- Stelle sicher, dass Hover/Click keine O(n^2) Pfade enthält.
- Performance-Budget festlegen (FPS, max sichtbare Elemente) und messen.
- Accessibility: Fokusreihenfolge, ARIA, Reduced Motion.
- Tests: Graph-Build, deterministische Seeds, Interaktion, Performance-Snapshot.

## When Adding a New Idea (Update-Regeln)
- Erstelle Impact Summary.
- Formuliere PRD-Patch (Abschnitt + Textblöcke, eindeutig platzieren).
- Formuliere Implementation-Plan-Patch (Abschnitt + Textblöcke).
- Liste neue Risiken/Dependencies.
- Definiere Next Steps.

## Changelog
- **12.12.2025:** Initiale Copilot Guidelines für Musical Brain Activity Graph hinzugefügt.
