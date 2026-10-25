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
    NavigationNotice
  } from "$lib/components";
  import { graphData, initVisible, setPositions } from "$lib/stores";
  import { uiStore, isStartAnimationRunning } from "$lib/stores/uiStore";
  import { scrollyStore } from "$lib/stores/scrollyStore";
  import { setArtistsData } from "$lib/stores/searchStore";
  import { setGenreDiscoveryData, setGenreYearlyStats, setGlobalStats, setYearlySummary } from "$lib/stores/timelineStore";
  import { buildGraph, computeForceLayout, transformSpotifyData, loadStreamingHistory } from "$lib/graph";
  import { getArtistsWithGenres, STREAMING_FILES, STREAMING_FILES_LOCAL } from "$lib/services";
  import { computeGenreDiscovery, computeGenreYearlyStats, computeYearlySummary } from "$lib/wrangling/genreDiscovery";
  import "../app.css";
  import "./page.css";

  type ArtistSearchEntry = {
    artistId: string;
    name: string;
    genres: string[];
    totalMinutes: number;
    topSong?: string;
    topSongMinutes?: number;
  };

  function extractUniqueArtists(streamingHistory: Array<{ master_metadata_album_artist_name?: string | null }>): string[] {
    return Array.from(
      new Set(
        streamingHistory
          .map((entry) => entry.master_metadata_album_artist_name)
          .filter((name): name is string => Boolean(name))
      )
    );
  }

  function buildArtistSearchRows(
    artistsWithGenres: Array<{ originalName: string; id?: string; name?: string; genres?: string[] }>,
    artistBestSong: Map<string, { song: string; minutes: number }>,
    artistPlaytime: Map<string, number>
  ): ArtistSearchEntry[] {
    return artistsWithGenres
      .filter((artist) => artist.genres && artist.genres.length > 0)
      .map((artist) => {
        const topSongData = artistBestSong.get(artist.originalName);
        return {
          artistId: artist.id || artist.originalName,
          name: artist.name || artist.originalName,
          genres: artist.genres!.map((genre: string) => genre.toLowerCase().replace(/\s+/g, '-')),
          totalMinutes: Math.round(artistPlaytime.get(artist.originalName) || 0),
          topSong: topSongData?.song,
          topSongMinutes: topSongData ? Math.round(topSongData.minutes) : undefined
        };
      })
      .filter((artist) => artist.totalMinutes > 0);
  }

  function buildArtistMetrics(streamingHistory: Array<{ master_metadata_album_artist_name?: string | null; master_metadata_track_name?: string | null; ms_played: number }>) {
    const artistPlaytime = new Map<string, number>();
    const artistTopSong = new Map<string, { song: string; minutes: number }>();

    for (const entry of streamingHistory) {
      const artistName = entry.master_metadata_album_artist_name;
      const trackName = entry.master_metadata_track_name;
      if (!artistName) continue;

      const minutes = entry.ms_played / 60000;
      artistPlaytime.set(artistName, (artistPlaytime.get(artistName) || 0) + minutes);

      if (trackName) {
        const key = `${artistName}|||${trackName}`;
        const current = artistTopSong.get(key) || { song: trackName, minutes: 0 };
        current.minutes += minutes;
        artistTopSong.set(key, current);
      }
    }

    const artistBestSong = new Map<string, { song: string; minutes: number }>();
    for (const [key, data] of artistTopSong.entries()) {
      const artistName = key.split('|||')[0];
      const existing = artistBestSong.get(artistName);
      if (!existing || data.minutes > existing.minutes) {
        artistBestSong.set(artistName, { song: data.song, minutes: data.minutes });
      }
    }

    return { artistPlaytime, artistTopSong, artistBestSong };
  }

  function computeGlobalStats(streamingHistory: Array<{ ts?: string; ms_played: number }>, artistPlaytime: Map<string, number>, artistTopSong: Map<string, { song: string; minutes: number }>) {
    const totalPlaytimeMinutes = Array.from(artistPlaytime.values()).reduce((sum, minutes) => sum + minutes, 0);

    let topArtist = '';
    let topArtistMinutes = 0;
    for (const [artist, minutes] of artistPlaytime.entries()) {
      if (minutes > topArtistMinutes) {
        topArtist = artist;
        topArtistMinutes = minutes;
      }
    }

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

    const timestamps = streamingHistory
      .filter((entry) => entry.ts)
      .map((entry) => new Date(entry.ts!).getTime());

    let firstStream = Infinity;
    let lastStream = -Infinity;
    for (const timestamp of timestamps) {
      if (timestamp < firstStream) firstStream = timestamp;
      if (timestamp > lastStream) lastStream = timestamp;
    }

    const totalDays = Math.max(1, Math.ceil((lastStream - firstStream) / (1000 * 60 * 60 * 24)));
    const avgMinutesPerDay = totalPlaytimeMinutes / totalDays;

    return {
      totalPlaytimeMinutes: Math.round(totalPlaytimeMinutes),
      topArtist,
      topArtistMinutes: Math.round(topArtistMinutes),
      topSong,
      topSongArtist,
      topSongMinutes: Math.round(topSongMinutes),
      avgMinutesPerDay: Math.round(avgMinutesPerDay),
      totalDays
    };
  }

  function buildGraphForInput(input: any) {
    return buildGraph(input, {
      topK: 10,
      sizeScale: 1.0,
      minSize: 10,
      maxSize: 45,
      groupByArtist: false
    });
  }

  async function applyGraphLayout(built: ReturnType<typeof buildGraph>) {
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
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    isLoading = false;
  }

  async function loadDemoGraphFallback() {
    const { createDemoGraphInput } = await import("$lib/graph");
    lastGraphInput = createDemoGraphInput();

    const built = buildGraphForInput(lastGraphInput);
    graphData.set(built);
    setArtistsData(
      lastGraphInput.artists.map((artist: any) => ({
        artistId: artist.artistId,
        name: artist.name,
        genres: artist.genres
      }))
    );

    await applyGraphLayout(built);
  }

  let isLoading = true;
  let loadingStatus = "Lädt Streaming-Daten...";
  let lastGraphInput: any = null;
  
  // Check if we're in explore mode (SearchBar visible) or overview mode
  $: isInExploreMode = $uiStore.isOverviewModeManual;
  $: isInOverviewPhase = $scrollyStore.phase === 'overview' || $scrollyStore.isInOverview;
  $: isInTimelinePhase = $scrollyStore.phase === 'timeline';
  $: overviewUIReady = $scrollyStore.overviewUIReady;
  // Show bottom header when: not during start animation AND (not in overview phase OR (in overview AND UI ready) OR in explore mode)
  $: showBottomHeader = !$isStartAnimationRunning && (!isInOverviewPhase || overviewUIReady || isInExploreMode);

  onMount(async () => {
    try {
      loadingStatus = "Lädt Streaming-Daten...";
      const streamingHistory = await loadStreamingHistory(STREAMING_FILES, STREAMING_FILES_LOCAL);

      loadingStatus = "Extrahiere Artists...";
      const uniqueArtists = extractUniqueArtists(streamingHistory);

      loadingStatus = "Lade Artist-Genres...";
      const artistsWithGenres = await getArtistsWithGenres(uniqueArtists);

      if (artistsWithGenres.length === 0) {
        console.warn("No genres found, falling back to demo data");
        loadingStatus = "Keine Genres gefunden, verwende Demo-Daten...";
        await loadDemoGraphFallback();
        return;
      }

      loadingStatus = "Erstelle Graph...";
      lastGraphInput = transformSpotifyData(streamingHistory, artistsWithGenres);

      const built = buildGraphForInput(lastGraphInput);
      graphData.set(built);

      const { artistPlaytime, artistTopSong, artistBestSong } = buildArtistMetrics(streamingHistory);
      const artistsForSearch = buildArtistSearchRows(artistsWithGenres, artistBestSong, artistPlaytime);
      setArtistsData(artistsForSearch);

      loadingStatus = "Analysiere Genre-Entdeckungen...";
      const discoveryData = computeGenreDiscovery(streamingHistory, artistsWithGenres);
      setGenreDiscoveryData(discoveryData);

      loadingStatus = "Berechne Jahresstatistiken...";
      const yearlyStats = computeGenreYearlyStats(streamingHistory, artistsWithGenres, discoveryData);
      setGenreYearlyStats(yearlyStats);

      loadingStatus = "Berechne Jahres-Zusammenfassungen...";
      const yearlySummary = computeYearlySummary(streamingHistory, artistsWithGenres);
      setYearlySummary(yearlySummary);

      loadingStatus = "Berechne globale Statistiken...";
      setGlobalStats(computeGlobalStats(streamingHistory, artistPlaytime, artistTopSong));

      await applyGraphLayout(built);
    } catch (error) {
      console.error("Error loading data:", error);
      loadingStatus = `Fehler: ${error instanceof Error ? error.message : String(error)}. Verwende Demo-Daten...`;

      try {
        await loadDemoGraphFallback();
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
  <title>My Musical Journey</title>
  <meta name="description" content="Visualize your musical journey through an interactive network graph of your favorite artists and genres" />
</svelte:head>

<main class="app">
  {#if isLoading}
    <LoadingScreen status={loadingStatus} />
  {:else}
    <!-- Graph is always mounted -->
    <div class="visualization-layer">
      <ScrollyContainer>
        <div class="layout">
          {#if !$isStartAnimationRunning && !isInTimelinePhase}
            <div transition:fade={{ duration: 300 }}>
              <GenreTitle />
            </div>
          {/if}

          <section class="graph-container">
            <GraphCanvas startAnimation={true} />
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
      <NavigationNotice />
      {#if showBottomHeader}
        <div transition:fade={{ duration: 400 }}>
          <BottomHeader />
        </div>
      {/if}
    </div>
  {/if}
</main>
