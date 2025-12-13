# Base Instructions
## Arbeitsweise & Update-System für Musical Brain Activity Graph
**Version:** 1.0.0  
**Datum:** 12. Dezember 2025

---

## Update-System (Pflichtantwort bei neuen Ideen)
Wenn eine neue Idee/Anforderung kommt, antworte mit:
1. **Impact Summary** (kurz: Was ändert sich, warum relevant).
2. **PRD Patch**: Konkrete Einfügeorte + Textblöcke (Markdown), keine Diff-Syntax.
3. **Implementation Plan Patch**: Gleicher Stil, mit Abschnittsverweisen.
4. **Risks/Dependencies**: Neue Risiken oder Abhängigkeiten.
5. **Next Steps**: 3–8 konkrete nächste Aktionen.

## Pre-Flight (immer zuerst lesen)
- Vor jeder Umsetzung: PRD, IMPLEMENTATION_PLAN, COPILOT_GUIDELINES und diese BASE_INSTRUCTIONS querlesen.
- Prüfe offene Annahmen/Risiken und ob neue Arbeit sie berührt.
- Falls Konflikt entdeckt: erst Patch-Vorschlag posten (siehe Update-System), dann implementieren.

## Idea Intake Template
- **Idee:**
- **Betroffene Module:** (graphBuilder, layoutEngine, interaction, renderer, UI, data pipeline, tests)
- **Neue/Geänderte Requirements:**
- **UI/UX Auswirkungen:**
- **Daten/Performance Auswirkungen:**
- **Akzeptanzkriterien:**
- **Tasks + Testfälle:**

## Ableiten von Datenlogik aus Snippets
- Wenn Notebook-/Code-Snippets geschickt werden, extrahiere: Datenschema, Felder, Beispielwerte, Filterregeln.
- Dokumentiere Annahmen explizit als "Annahme: ..." und integriere sie in PRD/Plan, falls relevant.
- Prüfe Konsistenz zu bestehenden Schemas; schlage Normalisierung/Mapping vor (Genres, Artists, Tracks, Kollabos).

## Umgang mit Konflikten zwischen Requirements
- Identifiziere Konflikt (Performance vs. Detailtiefe, Determinismus vs. Live-Layout, etc.).
- Schlage 1–2 Auflösungsoptionen mit Trade-offs vor; empfehle eine präferierte Option.
- Passe PRD/Plan per Patch-Vorschlag an.

## Annahmen dokumentieren
- Jede neue Annahme klar kennzeichnen: "Annahme: ...".
- Falls Daten fehlen, definiere Fallback (z.B. nur multi-genre Edges, keine Kollabo-Kanten).

## Konsistenzregeln für die vier Dokumente
- PRD = Was/Warum; Implementation Plan = Wie/Womit; Copilot Guidelines = Coding/Process Guardrails; Base Instructions = Update-Prozess.
- Halte Changelogs synchron (Datum, Änderung).

## Changelog
- **12.12.2025:** Initiale Base Instructions inkl. Update-System und Idea Intake Template hinzugefügt.
