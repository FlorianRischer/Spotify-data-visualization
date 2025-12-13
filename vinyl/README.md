# Spotify Vinyl Data Visualization

> Eine immersive 3D-Datenvisualisierung persönlicher Spotify-Hördaten mit Schallplatten-Metapher

## 🎯 Projekt

Hochschulprojekt (Informatik & Design, 3. Semester) zur Visualisierung von Spotify Streaming History als interaktive, scrollbare Web-Experience mit 3D-Schallplatte.

## 🛠 Tech Stack

- **Framework:** SvelteKit + TypeScript
- **3D:** Threlte (Three.js für Svelte)
- **Styling:** CSS (TBD: Tailwind/SCSS)
- **Data:** Spotify Extended Streaming History + Web API

## 📁 Projekt-Struktur

```
src/
├── lib/
│   ├── components/      # Svelte Components
│   │   ├── vinyl/       # 3D Vinyl Visualisierung
│   │   ├── detail/      # Detail Panel
│   │   ├── scroll/      # Scrollytelling
│   │   ├── layout/      # Layout Components
│   │   └── shared/      # Shared Components
│   ├── stores/          # Svelte Stores (State)
│   ├── services/        # API & Cache Services
│   ├── utils/           # Helper Functions
│   ├── types/           # TypeScript Types
│   ├── constants/       # Constants (Colors, Physics)
│   ├── data/
│   │   ├── raw/         # Rohe Spotify JSONs (gitignored)
│   │   ├── cache/       # API Response Cache (gitignored)
│   │   └── processed/   # Vorverarbeitete Daten (committed)
│   └── actions/         # Svelte Actions
└── routes/              # SvelteKit Routes

static/
├── models/              # 3D Modelle (vinyl.glb)
└── fonts/               # Custom Fonts
```

## 🚀 Setup

```bash
# Dependencies installieren
npm install

# Dev Server starten
npm run dev

# Build für Production
npm run build
```

## 📊 Datenquellen

1. **Spotify Streaming History** (lokal)
   - Extended Streaming History als JSON Export
   - Platziere Dateien in `src/lib/data/raw/`

2. **Spotify Web API** (für Metadaten)
   - Genres (nicht in History enthalten!)
   - Audio Features, Artist Details
   - Benötigt Access Token

3. **Cache** (automatisch generiert)
   - API-Responses werden in `src/lib/data/cache/` gecached
   - Verhindert wiederholte API-Calls

## 📚 Dokumentation

Siehe `/docs` Ordner:
- `BASE_INSTRUCTIONS.md` - Arbeitsanweisungen für AI-Assistant
- `PRD.md` - Product Requirements
- `IMPLEMENTATION_PLAN.md` - Technische Implementierung
- `COPILOT_GUIDELINES.md` - Code-Patterns & Guidelines

## 🎨 Features (geplant)

- [x] Projekt-Setup
- [ ] Daten-Pipeline (Observable → TypeScript)
- [ ] 3D Vinyl-Chart (Genre-Segmente)
- [ ] Drag-to-Rotate Interaktion
- [ ] Detail Panel (Genre-Stats)
- [ ] Scrollytelling Shell
- [ ] Timeline-Visualisierung
- [ ] Artist-Network

## 📄 Lizenz

Hochschulprojekt - Nicht für kommerzielle Nutzung
