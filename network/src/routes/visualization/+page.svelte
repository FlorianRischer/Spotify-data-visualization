<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { GraphCanvas, ControlPanel, Tooltip, GenreTitle } from "$lib/components";
  import ScrollyContainer from "$lib/components/ScrollyContainer.svelte";
  import ProgressIndicator from "$lib/components/ProgressIndicator.svelte";
  import GenreDetail from "$lib/components/GenreDetail.svelte";
  import { graphData, initVisible, setPositions } from "$lib/stores";
  import { uiStore, isStartAnimationRunning } from "$lib/stores/uiStore";
  import { buildGraph, computeForceLayout, transformSpotifyData, loadStreamingHistory } from "$lib/graph";
  import "../../app.css";
  import "./page.css";

  let isLoading = true;
  let loadingStatus = "Lädt Streaming-Daten...";
  let lastGraphInput: any = null; // store original graph input for rebuilding

  // ===================================================================
  // DATEN-STRATEGIE (gemäß PRD & IMPLEMENTATION_PLAN):
  // 1. Zuerst: Precomputed JSON laden (keine API-Calls nötig)
  // 2. Fallback: localStorage Cache (lokale Kopie)
  // 3. Letzter Ausweg: Live API mit Rate-Limit-Schutz
  // ===================================================================

  const CACHE_KEY = "spotify_artist_cache";
  const CACHE_VERSION = "v1"; // Keep v1 to preserve existing user cache!
  const CACHE_VERSION_LEGACY = ["v1", "v2"]; // Accept both versions
  const MIN_ARTISTS_NEEDED = 50; // Minimum für den Graph
  const FETCH_MORE_ARTISTS = false; // Wenn true, werden API calls gemacht um mehr Artists zu holen
  const MAX_API_CALLS_PER_SESSION = 5000; // Maximale API calls pro Session

  // -----------------------
  // Normalisierung (WICHTIG!)
  // -----------------------
  function normKey(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, " ");
  }

  /**
   * Lädt vorberechnete Artist-Genre-Daten aus /static/ (erste Wahl: die exportierte Datei)
   * Fallback zu standard artist-cache.json
   * Dies ist die bevorzugte Methode laut PRD ("Vorberechnung")
   */
  async function loadPrecomputedCache(): Promise<Map<string, any>> {
    // Try /artist-cache-2025-12-13.json first (main exported cache)
    const dataSources = [
      "/artist-cache-2025-12-13.json",
      "/artist-cache.json" // fallback to old cache
    ];

    for (const source of dataSources) {
      try {
        const response = await fetch(source);
        if (response.ok) {
          const data = await response.json();

          // Filter out placeholder entries
          const validEntries = Object.entries(data).filter(
            ([key, val]: [string, any]) => key !== "_info" && val && typeof val === "object" && val.id
          );

          if (validEntries.length > 0) {
            // Normalize keys
            const normalizedEntries: Array<[string, any]> = validEntries.map(([key, val]) => [normKey(key), val]);
            console.log(`📂 Loaded precomputed cache from ${source} with`, normalizedEntries.length, "artists");
            return new Map(normalizedEntries);
          }
        }
      } catch (e) {
        console.log(`📂 Source ${source} not available`);
      }
    }

    console.log("📂 No precomputed cache available from any source");
    return new Map();
  }

  /**
   * Lädt localStorage Cache als Fallback - unterstützt alte und neue Versionen
   */
  function loadLocalCache(): Map<string, any> {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { version, data, timestamp } = JSON.parse(cached);
        // Accept any known version, cache valid for 30 days
        if (CACHE_VERSION_LEGACY.includes(version) && Date.now() - timestamp < 30 * 24 * 60 * 60 * 1000) {
          const validEntries = Object.entries(data).filter(([_, val]: [string, any]) => {
            // accept genre hits OR negative caching
            if (!val || typeof val !== "object") return false;
            if (val.notFound) return true;
            return val.id && val.genres && val.genres.length > 0;
          });

          // Normalize keys
          const normalizedEntries: Array<[string, any]> = validEntries.map(([key, val]) => [normKey(key), val]);

          console.log("💾 Loaded", normalizedEntries.length, "artists from localStorage");
          return new Map(normalizedEntries);
        }
      }
    } catch (e) {
      console.warn("Failed to load localStorage cache:", e);
    }
    return new Map();
  }

  function saveLocalCache(cache: Map<string, any>) {
    try {
      const data = Object.fromEntries(cache);
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          version: CACHE_VERSION,
          data,
          timestamp: Date.now()
        })
      );
      console.log("💾 Saved", cache.size, "artists to localStorage");
    } catch (e) {
      console.warn("Failed to save cache:", e);
    }
  }

  /**
   * Exportiert den lokalen Cache als artist-cache.json zum Download
   * Kann dann in /static/artist-cache.json kopiert werden
   */
  function exportCacheToJSON() {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) {
        console.warn("❌ No cache found to export");
        alert("Kein Cache zum Exportieren vorhanden. Lade erst Genres.");
        return;
      }

      const { data } = JSON.parse(cached);
      
      // Add metadata
      const exportData = {
        _info: {
          exportDate: new Date().toISOString(),
          artistCount: Object.keys(data).length,
          instructions: "Copy this file to /static/artist-cache.json to use as precomputed cache"
        },
        ...data
      };

      // Create blob and download
      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `artist-cache-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log(`✅ Downloaded cache with ${exportData._info.artistCount} artists`);
      alert(`✅ Cache mit ${exportData._info.artistCount} Artists heruntergeladen!\n\nDie Datei in /static/artist-cache.json kopieren um API-Calls zu sparen.`);
    } catch (e) {
      console.error("Failed to export cache:", e);
      alert(`❌ Export fehlgeschlagen: ${e}`);
    }
  }

  /**
   * Kombiniert alle Cache-Quellen (precomputed + localStorage)
   */
  async function loadAllCaches(): Promise<Map<string, any>> {
    const precomputed = await loadPrecomputedCache();
    const local = loadLocalCache();

    // Merge: localStorage überschreibt precomputed (für neuere Daten)
    const merged = new Map([...precomputed, ...local]);
    console.log(`📊 Combined cache: ${merged.size} artists total`);
    return merged;
  }

  /**
   * Server-seitiger Spotify Lookup:
   * Erwartet: GET /api/spotify-search?artist=<name>&token=<token>
   * Antwort: { id, name, genres, popularity?, followers? }
   * Rate-limit: 429 mit Retry-After Header
   */
  async function searchArtist(artistName: string, token: string): Promise<any> {
    if (!artistName || artistName.trim() === "") return null;

    try {
      const response = await fetch(`/api/spotify-search?artist=${encodeURIComponent(artistName)}&token=${encodeURIComponent(token)}`);

      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        return { rateLimited: true, retryAfter: retryAfter ? parseInt(retryAfter) : 30 };
      }

      if (response.status === 404 || !response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ Error searching for "${artistName}":`, error);
      return null;
    }
  }

  /**
   * Hauptfunktion: Versucht Daten aus Cache zu laden,
   * nur bei Bedarf Live-API mit strengem Rate-Limit-Schutz
   */
  async function getArtistsWithGenres(uniqueArtists: string[]): Promise<any[]> {
    // Schritt 1: Alle verfügbaren Cache-Daten laden (Keys sind normalisiert!)
    const cache = await loadAllCaches();

    const artistsWithGenres: any[] = [];
    let successCount = 0;

    // 1) Cache Treffer
    for (const rawName of uniqueArtists) {
      const key = normKey(rawName);
      const cached = cache.get(key);

      if (cached?.id && Array.isArray(cached.genres) && cached.genres.length > 0) {
        artistsWithGenres.push({ originalName: rawName, ...cached });
        successCount++;
      }
    }

    console.log(`📊 Found ${successCount}/${uniqueArtists.length} artists with genres in cache`);

    // ✅ API-Calls sind vollständig deaktiviert - nur gecachte Daten verwenden
    console.log(`✅ Using cached data only. No API calls. Found ${artistsWithGenres.length} artists with genres.`);
    saveLocalCache(cache);
    return artistsWithGenres;
  }

  onMount(async () => {
    try {
      // Load all streaming history JSON files
      loadingStatus = "Lädt Streaming-Daten...";
      const streamingFiles = [
        "/spotify-data/Streaming_History_Audio_2018-2020_0.json",
        "/spotify-data/Streaming_History_Audio_2020-2021_1.json",
        "/spotify-data/Streaming_History_Audio_2021_2.json",
        "/spotify-data/Streaming_History_Audio_2021_3.json",
        "/spotify-data/Streaming_History_Audio_2021-2022_4.json",
        "/spotify-data/Streaming_History_Audio_2022_5.json",
        "/spotify-data/Streaming_History_Audio_2022-2023_6.json",
        "/spotify-data/Streaming_History_Audio_2023_7.json",
        "/spotify-data/Streaming_History_Audio_2023-2024_8.json",
        "/spotify-data/Streaming_History_Audio_2024_9.json",
        "/spotify-data/Streaming_History_Audio_2024-2025_10.json",
        "/spotify-data/Streaming_History_Audio_2025_11.json"
      ];

      const streamingHistory = await loadStreamingHistory(streamingFiles);
      console.log(`Loaded ${streamingHistory.length} streaming entries`);

      // Extract unique artists
      loadingStatus = "Extrahiere Artists...";
      const uniqueArtists = Array.from(
        new Set(
          streamingHistory
            .map((d) => d.master_metadata_album_artist_name)
            .filter((name): name is string => Boolean(name))
        )
      );
      console.log(`Found ${uniqueArtists.length} unique artists`);

      // Load artists with genres (from cache first, then API)
      loadingStatus = "Lade Artist-Genres...";
      const artistsWithGenres = await getArtistsWithGenres(uniqueArtists);
      console.log(`Found genres for ${artistsWithGenres.length} artists`);

      // Fallback auf Demo-Daten wenn keine Genres gefunden wurden
      if (artistsWithGenres.length === 0) {
        console.warn("No genres found, falling back to demo data");
        loadingStatus = "Keine Genres gefunden, verwende Demo-Daten...";

        const { createDemoGraphInput } = await import("$lib/graph");
        lastGraphInput = createDemoGraphInput();

        const built = buildGraph(lastGraphInput, {
          topK: 10,
          sizeScale: 1.0,
          minSize: 10,
          maxSize: 45,
          groupByArtist: false
        });

        graphData.set(built);

        loadingStatus = "Berechne Layout...";
        const layoutResult = computeForceLayout(built.nodes, built.edges, {
          seed: Math.floor(Math.random() * 10000),
          iterations: 150,
          chargeStrength: -150,
          linkDistance: 200,
          linkStrength: 0.05
        });

        setPositions(layoutResult.positions);
        initVisible();
        isLoading = false;
        return;
      }

      // Transform data to graph input
      loadingStatus = "Erstelle Graph...";
      lastGraphInput = transformSpotifyData(streamingHistory, artistsWithGenres);
      console.log(`Created graph with ${lastGraphInput.genreStats.length} genres and ${lastGraphInput.artists.length} artists`);

      const built = buildGraph(lastGraphInput, {
        topK: 10,
        sizeScale: 1.0,
        minSize: 10,
        maxSize: 45,
        groupByArtist: false
      });

      graphData.set(built);

      // Compute force layout
      loadingStatus = "Berechne Layout...";
      const layoutResult = computeForceLayout(built.nodes, built.edges, {
        seed: Math.floor(Math.random() * 10000),
        iterations: 150,
        chargeStrength: -150,
        linkDistance: 200,
        linkStrength: 0.05
      });

      setPositions(layoutResult.positions);
      initVisible();
      isLoading = false;
    } catch (error) {
      console.error("Error loading data:", error);
      loadingStatus = `Fehler: ${error instanceof Error ? error.message : String(error)}. Verwende Demo-Daten...`;

      try {
        const { createDemoGraphInput } = await import("$lib/graph");
        lastGraphInput = createDemoGraphInput();

        const built = buildGraph(lastGraphInput, {
          topK: 10,
          sizeScale: 1.0,
          minSize: 10,
          maxSize: 45,
          groupByArtist: false
        });

        graphData.set(built);

        const layoutResult = computeForceLayout(built.nodes, built.edges, {
          seed: Math.floor(Math.random() * 10000),
          iterations: 150,
          chargeStrength: -150,
          linkDistance: 200,
          linkStrength: 0.05
        });

        setPositions(layoutResult.positions);
        initVisible();
        isLoading = false;
      } catch (fallbackError) {
        loadingStatus = `Kritischer Fehler: ${fallbackError}`;
        console.error("Fallback failed:", fallbackError);
      }
    }
  });

  // Subscribe to UI state changes for artist grouping toggle
  uiStore.subscribe((state) => {
    if (lastGraphInput && isLoading === false) {
      const rebuilt = buildGraph(lastGraphInput, {
        topK: 10,
        sizeScale: 1.0,
        minSize: 10,
        maxSize: 45,
        groupByArtist: state.showArtistGroups
      });
      graphData.set(rebuilt);
    }
  });
</script>

<svelte:head>
  <title>Musical Brain Activity</title>
  <meta name="description" content="Neural Network Graph visualizing your music genre preferences" />
</svelte:head>

<main class="app">
  {#if isLoading}
    <div class="loading-screen">
      <div class="loading-content">
        <div class="spinner"></div>
        <p class="loading-text">{loadingStatus}</p>
      </div>
    </div>
  {:else}
    <ScrollyContainer>
      <div class="layout">
        {#if !$isStartAnimationRunning}
          <div transition:fade={{ duration: 300 }}>
            <GenreTitle />
          </div>
        {/if}

        {#if !$isStartAnimationRunning}
          <div class="control-panel-wrapper" transition:fade={{ duration: 300 }}>
            <ControlPanel />
          </div>
        {/if}

        <section class="graph-container">
          <GraphCanvas />
          <GenreDetail />
        </section>
      </div>
    </ScrollyContainer>
    <Tooltip />
  {/if}
</main>


