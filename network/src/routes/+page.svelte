<script lang="ts">
  import { onMount } from "svelte";
  import { GraphCanvas, ControlPanel, Tooltip } from "$lib/components";
  import { graphData, initVisible, setPositions } from "$lib/stores";
  import { buildGraph, computeForceLayout, transformSpotifyData, loadStreamingHistory } from "$lib/graph";

  let isLoading = true;
  let loadingStatus = "Lädt Streaming-Daten...";

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
  const FETCH_MORE_ARTISTS = true; // Wenn true, werden API calls gemacht um mehr Artists zu holen
  const MAX_API_CALLS_PER_SESSION = 200; // Maximale API calls pro Session

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
   * Eingebaute Genre-Mappings für häufige Artists als Fallback
   * Wird verwendet wenn API nicht verfügbar ist
   */
  const BUILTIN_GENRE_MAP: Record<string, string[]> = {
    // ... (dein riesiger BUILTIN_GENRE_MAP bleibt unverändert)
    "Lil Peep": ["emo rap", "cloud rap", "sad rap"],
    "Mac Miller": ["hip hop", "alternative hip hop", "conscious hip hop"]
    // (gekürzt in diesem Snippet – bitte deinen kompletten Map-Block 그대로 hier lassen)
  };

  /**
   * Heuristische Genre-Zuordnung basierend auf Artist-Namen
   */
  function guessGenresFromName(artistName: string): string[] | null {
    // Check builtin map first (case-insensitive)
    const mapEntry = Object.entries(BUILTIN_GENRE_MAP).find(([key]) => key.toLowerCase() === artistName.toLowerCase());
    if (mapEntry) return mapEntry[1];

    const lowerName = artistName.toLowerCase();

    // German rap indicators
    if (
      lowerName.includes("187") ||
      lowerName.includes("bonez") ||
      lowerName.includes("gzuz") ||
      lowerName.includes("raf ") ||
      lowerName.includes("capital") ||
      lowerName.includes("bushido") ||
      lowerName.includes("kollegah") ||
      lowerName.includes("farid") ||
      lowerName.includes("haftbefehl")
    ) {
      return ["german hip hop", "deutschrap", "gangsta rap"];
    }

    // Cloud rap / Emo rap indicators
    if (
      lowerName.includes("$uicide") ||
      lowerName.includes("peep") ||
      lowerName.includes("tracy") ||
      lowerName.includes("gothboy") ||
      lowerName.includes("yunggoth") ||
      lowerName.includes("cold hart")
    ) {
      return ["emo rap", "cloud rap", "sad rap"];
    }

    // DJ/EDM indicators
    if (
      lowerName.startsWith("dj ") ||
      lowerName.includes("tiesto") ||
      lowerName.includes("garrix") ||
      lowerName.includes("hardwell") ||
      lowerName.includes("guetta")
    ) {
      return ["edm", "electronic", "dance"];
    }

    // Lo-fi indicators
    if (
      lowerName.includes("lofi") ||
      lowerName.includes("lo-fi") ||
      lowerName.includes("chillhop") ||
      lowerName.includes("beats") ||
      lowerName.includes("chill")
    ) {
      return ["lo-fi hip hop", "chillhop", "beats"];
    }

    // Lil = often rap
    if (lowerName.startsWith("lil ") || lowerName.startsWith("lil'")) {
      return ["hip hop", "rap", "trap"];
    }

    // Young = often rap
    if (lowerName.startsWith("young ") || lowerName.startsWith("yung ")) {
      return ["hip hop", "trap", "rap"];
    }

    return null;
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

    // 2) Builtin mappings für fehlende
    console.log("🔍 Trying builtin genre mappings...");
    for (const rawName of uniqueArtists) {
      const key = normKey(rawName);
      if (cache.has(key)) continue;

      const guessedGenres = guessGenresFromName(rawName);
      if (guessedGenres) {
        const artistData = {
          originalName: rawName,
          id: `builtin-${key.replace(/\s+/g, "-")}`,
          name: rawName,
          genres: guessedGenres
        };
        artistsWithGenres.push(artistData);
        cache.set(key, artistData);
        successCount++;
      }
    }

    console.log(`📊 After builtin mappings: ${successCount} artists with genres`);

    // 3) Prüfe ob ALLE fehlenden Artists in der precomputed Cache sind
    const missing = uniqueArtists.filter((rawName) => !cache.has(normKey(rawName)));

    // Wenn alle gefunden sind oder keine API-Calls gewünscht: FERTIG
    if (missing.length === 0 || !FETCH_MORE_ARTISTS) {
      console.log(`✅ All ${artistsWithGenres.length} artists have genres! No API calls needed.`);
      saveLocalCache(cache);
      return artistsWithGenres;
    }

    console.log(`⚠️ Missing ${missing.length} artists: ${missing.join(", ")}`);

    // 4) Nur falls nötig: API-Calls für fehlende Artists
    // Hole Token für API-Calls
    let token: string | null = null;
    try {
      const tokenResponse = await fetch('/api/spotify-token');
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        token = tokenData.access_token;
        console.log('✅ Spotify token obtained for API calls');
      }
    } catch (e) {
      console.warn('❌ Could not get Spotify token, skipping API calls');
    }

    if (!token) {
      console.log("⚠️ No token available, cannot fetch from API");
      saveLocalCache(cache);
      return artistsWithGenres;
    }

    const limit = Math.min(missing.length, MAX_API_CALLS_PER_SESSION);
    console.log(`📡 Fetching ${missing.length} missing artists via API (max ${limit})...`);

    const DELAY_MS = 450;
    let apiCalls = 0;
    let rateLimitHits = 0;

    for (const rawName of missing) {
      if (apiCalls >= limit) {
        console.log(`🛑 Reached max API calls (${limit})`);
        break;
      }

      const progress = Math.round((apiCalls / limit) * 100);
      loadingStatus = `Lade fehlende Genres von Spotify... ${apiCalls}/${limit} (${progress}%)`;

      const result = await searchArtist(rawName, token);
      apiCalls++;

      if (result?.rateLimited) {
        rateLimitHits++;

        const waitMs = (result.retryAfter || 30) * 1000;
        console.warn(`⚠️ Rate limited (${rateLimitHits}), waiting ${Math.round(waitMs / 1000)}s...`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        // versuche danach weiter (kein notFound speichern!)
        continue;
      } else {
        rateLimitHits = 0;
      }

      const key = normKey(rawName);

      if (result?.id && Array.isArray(result.genres) && result.genres.length > 0) {
        const artistData = { originalName: rawName, ...result };
        artistsWithGenres.push(artistData);
        cache.set(key, artistData);
        successCount++;
      } else {
        // Negative caching
        cache.set(key, { originalName: rawName, notFound: true });
      }

      // Periodisch speichern
      if (apiCalls % 50 === 0) {
        saveLocalCache(cache);
        console.log(`💾 Checkpoint: ${successCount} artists with genres`);
      }

      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }

    // Final cache save
    saveLocalCache(cache);

    console.log(`✅ Final result: ${artistsWithGenres.length} artists with genres (apiCalls=${apiCalls})`);
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
        const input = createDemoGraphInput();

        const built = buildGraph(input, {
          topK: 10,
          sizeScale: 1.0,
          minSize: 10,
          maxSize: 45
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
      const input = transformSpotifyData(streamingHistory, artistsWithGenres);
      console.log(`Created graph with ${input.genreStats.length} genres and ${input.artists.length} artists`);

      const built = buildGraph(input, {
        topK: 10,
        sizeScale: 1.0,
        minSize: 10,
        maxSize: 45
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
        const input = createDemoGraphInput();

        const built = buildGraph(input, {
          topK: 10,
          sizeScale: 1.0,
          minSize: 10,
          maxSize: 45
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
</script>

<svelte:head>
  <title>Musical Brain Activity</title>
  <meta name="description" content="Neural Network Graph visualizing your music genre preferences" />
</svelte:head>

<main class="app">
  <header class="header">
    <div class="header-top">
      <div>
        <h1 class="title">Musical Brain Activity</h1>
        <p class="subtitle">Explore your genre connections. Hover to reveal neighbors, click to pin genres.</p>
      </div>
      {#if !isLoading}
        <button class="export-btn" on:click={exportCacheToJSON} title="Download artist cache to replace /static/artist-cache.json">
          💾 Cache exportieren
        </button>
      {/if}
    </div>
  </header>

  {#if isLoading}
    <div class="loading-screen">
      <div class="loading-content">
        <div class="spinner"></div>
        <p class="loading-text">{loadingStatus}</p>
      </div>
    </div>
  {:else}
    <div class="layout">
      <div class="controls">
        <ControlPanel />
      </div>

      <section class="graph-container">
        <GraphCanvas />
      </section>
    </div>

    <Tooltip />
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background: #0d1117;
    color: #e6edf3;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .app {
    min-height: 100vh;
    padding: 24px;
    background: radial-gradient(ellipse at 20% 10%, #1b2838 0%, #0d1117 50%);
  }

  .header {
    margin-bottom: 24px;
    max-width: 1400px;
    margin-left: auto;
    margin-right: auto;
  }

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
  }

  .export-btn {
    background: rgba(29, 185, 84, 0.15);
    border: 1.5px solid #1db954;
    color: #1db954;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 200ms ease;
    white-space: nowrap;
  }

  .export-btn:hover {
    background: rgba(29, 185, 84, 0.25);
    transform: translateY(-2px);
  }

  .export-btn:active {
    transform: translateY(0);
    background: rgba(29, 185, 84, 0.3);
  }

  .title {
    font-size: 2.2rem;
    font-weight: 700;
    color: #1db954;
    margin: 0 0 8px 0;
    letter-spacing: -0.02em;
  }

  .subtitle {
    color: #8b949e;
    margin: 0;
    font-size: 15px;
    max-width: 600px;
  }

  .layout {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 100%;
    margin: 0 auto;
    height: calc(100vh - 160px);
  }

  .controls {
    flex-shrink: 0;
  }

  .graph-container {
    flex: 1;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 14px;
    padding: 0;
    overflow: hidden;
    min-height: 600px;
  }

  .loading-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
  }

  .loading-content {
    text-align: center;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid rgba(29, 185, 84, 0.1);
    border-top-color: #1db954;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 16px;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .loading-text {
    color: #8b949e;
    font-size: 14px;
    margin: 0;
  }
</style>
