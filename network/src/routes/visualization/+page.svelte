<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { 
    GraphCanvas, 
    Tooltip, 
    GenreTitle, 
    BottomHeader, 
    SearchBar, 
    ScrollyContainer,
    GenreDetail,
    SearchDetail,
    ExploreDetail,
    OverviewDetail,
    Timeline,
    TimelineTitle,
    TimelineDetail,
    LoadingScreen,
    LandingHero
  } from "$lib/components";
  import { graphData, initVisible, setPositions } from "$lib/stores";
  import { uiStore, isStartAnimationRunning } from "$lib/stores/uiStore";
  import { scrollyStore } from "$lib/stores/scrollyStore";
  import { setArtistsData } from "$lib/stores/searchStore";
  import { setGenreDiscoveryData, setGenreYearlyStats, setGlobalStats } from "$lib/stores/timelineStore";
  import { buildGraph, computeForceLayout, transformSpotifyData, loadStreamingHistory } from "$lib/graph";
  import { getArtistsWithGenres, STREAMING_FILES } from "$lib/services";
  import { computeGenreDiscovery, computeGenreYearlyStats } from "$lib/wrangling/genreDiscovery";
  import "../../app.css";
  import "./page.css";

  let isLoading = true;
  let showLandingHero = true; // Show landing hero after loading
  let loadingStatus = "Lädt Streaming-Daten...";
  let lastGraphInput: any = null;
  let streamingHistoryRef: any[] = []; // Speichere für Timeline-Berechnung
  let artistsWithGenresRef: any[] = []; // Speichere für Timeline-Berechnung
  
  // Check if we're in explore mode (SearchBar visible) or overview mode
  $: isInExploreMode = $uiStore.isOverviewModeManual;
  $: isInOverviewPhase = $scrollyStore.phase === 'overview' || $scrollyStore.isInOverview;
  $: isInTimelinePhase = $scrollyStore.phase === 'timeline';
  $: overviewUIReady = $scrollyStore.overviewUIReady;
  // Show bottom header when: not during start animation AND (not in overview phase OR (in overview AND UI ready) OR in explore mode)
  $: showBottomHeader = !$isStartAnimationRunning && (!isInOverviewPhase || overviewUIReady || isInExploreMode);

  onMount(async () => {
    try {
      // Load all streaming history JSON files
      loadingStatus = "Lädt Streaming-Daten...";
      const streamingHistory = await loadStreamingHistory(STREAMING_FILES);
      streamingHistoryRef = streamingHistory;
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

      // Load artists with genres (from cache)
      loadingStatus = "Lade Artist-Genres...";
      const artistsWithGenres = await getArtistsWithGenres(uniqueArtists);
      artistsWithGenresRef = artistsWithGenres;
      console.log(`Found genres for ${artistsWithGenres.length} artists`);

      // Fallback to demo data if no genres found
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
      
      // Calculate total minutes per artist from streaming history
      const artistPlaytime = new Map<string, number>();
      // Calculate top song per artist (by total listening time)
      const artistTopSong = new Map<string, { song: string; minutes: number }>();
      
      for (const entry of streamingHistory) {
        const artistName = entry.master_metadata_album_artist_name;
        const trackName = entry.master_metadata_track_name;
        if (!artistName) continue;
        const minutes = entry.ms_played / 60000;
        artistPlaytime.set(artistName, (artistPlaytime.get(artistName) || 0) + minutes);
        
        // Track top song per artist
        if (trackName) {
          const key = `${artistName}|||${trackName}`;
          const current = artistTopSong.get(key) || { song: trackName, minutes: 0 };
          current.minutes += minutes;
          artistTopSong.set(key, current);
        }
      }
      
      // Find the actual top song for each artist (with minutes)
      const artistBestSong = new Map<string, { song: string; minutes: number }>();
      for (const [key, data] of artistTopSong.entries()) {
        const artistName = key.split('|||')[0];
        const existing = artistBestSong.get(artistName);
        if (!existing || data.minutes > existing.minutes) {
          artistBestSong.set(artistName, { song: data.song, minutes: data.minutes });
        }
      }
      
      // Set artists data for search - include ALL artists with genres (not just 2+)
      const artistGenreMap = new Map<string, string[]>();
      for (const artist of artistsWithGenres) {
        if (artist.genres && artist.genres.length > 0) {
          artistGenreMap.set(artist.originalName, artist.genres);
        }
      }
      
      // Create artist data with playtime for weighted random selection
      const artistsForSearch = artistsWithGenres
        .filter(a => a.genres && a.genres.length > 0)
        .map((a: any) => {
          const topSongData = artistBestSong.get(a.originalName);
          return {
            artistId: a.id || a.originalName,
            name: a.name || a.originalName,
            genres: a.genres.map((g: string) => g.toLowerCase().replace(/\s+/g, '-')),
            totalMinutes: Math.round(artistPlaytime.get(a.originalName) || 0),
            topSong: topSongData?.song,
            topSongMinutes: topSongData ? Math.round(topSongData.minutes) : undefined
          };
        })
        .filter(a => a.totalMinutes > 0); // Only include artists with listening time
      
      setArtistsData(artistsForSearch);
      console.log(`Set ${artistsForSearch.length} artists for search with playtime data`);

      // Berechne Genre-Discovery-Daten für Timeline
      loadingStatus = "Analysiere Genre-Entdeckungen...";
      const discoveryData = computeGenreDiscovery(streamingHistory, artistsWithGenres);
      setGenreDiscoveryData(discoveryData);
      console.log(`Discovered ${discoveryData.genres.length} genres from ${discoveryData.startYear} to ${discoveryData.endYear}`);

      // Berechne Genre-Yearly-Stats für Timeline-Tooltip
      loadingStatus = "Berechne Jahresstatistiken...";
      const yearlyStats = computeGenreYearlyStats(streamingHistory, artistsWithGenres, discoveryData);
      setGenreYearlyStats(yearlyStats);
      console.log(`Computed yearly stats for ${yearlyStats.size} genres`);

      // Berechne globale Statistiken für Timeline
      loadingStatus = "Berechne globale Statistiken...";
      const totalPlaytimeMinutes = Array.from(artistPlaytime.values()).reduce((sum, m) => sum + m, 0);
      
      // Find top artist
      let topArtist = '';
      let topArtistMinutes = 0;
      for (const [artist, minutes] of artistPlaytime.entries()) {
        if (minutes > topArtistMinutes) {
          topArtist = artist;
          topArtistMinutes = minutes;
        }
      }
      
      // Find top song overall
      let topSong = '';
      let topSongArtist = '';
      let topSongMinutes = 0;
      for (const [key, data] of artistTopSong.entries()) {
        if (data.minutes > topSongMinutes) {
          const [artist] = key.split('|||');
          topSong = data.song;
          topSongArtist = artist;
          topSongMinutes = data.minutes;
        }
      }
      
      // Calculate total days from first to last stream
      const timestamps = streamingHistory
        .filter(e => e.ts)
        .map(e => new Date(e.ts).getTime());
      const firstStream = Math.min(...timestamps);
      const lastStream = Math.max(...timestamps);
      const totalDays = Math.max(1, Math.ceil((lastStream - firstStream) / (1000 * 60 * 60 * 24)));
      const avgMinutesPerDay = totalPlaytimeMinutes / totalDays;
      
      setGlobalStats({
        totalPlaytimeMinutes: Math.round(totalPlaytimeMinutes),
        topArtist,
        topArtistMinutes: Math.round(topArtistMinutes),
        topSong,
        topSongArtist,
        topSongMinutes: Math.round(topSongMinutes),
        avgMinutesPerDay: Math.round(avgMinutesPerDay),
        totalDays
      });
      console.log(`Global stats: ${Math.round(totalPlaytimeMinutes / 60)}h total, ${topArtist} top artist, ${topSong} top song`);

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
        // Set artists data for search
        setArtistsData(lastGraphInput.artists.map((a: any) => ({
          artistId: a.artistId,
          name: a.name,
          genres: a.genres
        })));

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
  <!-- Preload fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
  <link href="https://fonts.googleapis.com/css2?family=Baloo+Bhai+2:wght@400;500&display=swap" rel="stylesheet">
</svelte:head>

<main class="app">
  {#if isLoading}
    <LoadingScreen status={loadingStatus} />
  {:else}
    <!-- Graph is always mounted but hidden behind Landing Hero -->
    <div class="visualization-layer" class:hidden={showLandingHero}>
      <ScrollyContainer>
        <div class="layout">
          {#if !$isStartAnimationRunning && !isInTimelinePhase}
            <div transition:fade={{ duration: 300 }}>
              <GenreTitle />
            </div>
          {/if}

          <section class="graph-container">
            <GraphCanvas startAnimation={!showLandingHero} />
            <GenreDetail />
          </section>
        </div>
      </ScrollyContainer>
      
      <!-- Timeline View -->
      <Timeline />
      <TimelineTitle />
      <TimelineDetail />
      
      <!-- Search & Explore -->
      <SearchBar />
      <SearchDetail />
      <ExploreDetail />
      <OverviewDetail />
      <Tooltip />
      {#if showBottomHeader}
        <div transition:fade={{ duration: 400 }}>
          <BottomHeader />
        </div>
      {/if}
    </div>
    
    <!-- Landing Hero overlay -->
    {#if showLandingHero}
      <LandingHero 
        visible={showLandingHero} 
        on:exit={() => {
          showLandingHero = false;
        }} 
      />
    {/if}
  {/if}
</main>


