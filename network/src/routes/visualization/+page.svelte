<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { GraphCanvas, Tooltip, GenreTitle, BottomHeader, SearchBar } from "$lib/components";
  import ScrollyContainer from "$lib/components/ScrollyContainer.svelte";
  import GenreDetail from "$lib/components/GenreDetail.svelte";
  import { LoadingScreen } from "$lib/components/visualization";
  import { graphData, initVisible, setPositions } from "$lib/stores";
  import { uiStore, isStartAnimationRunning } from "$lib/stores/uiStore";
  import { scrollyStore } from "$lib/stores/scrollyStore";
  import { setArtistsData } from "$lib/stores/searchStore";
  import { buildGraph, computeForceLayout, transformSpotifyData, loadStreamingHistory } from "$lib/graph";
  import { getArtistsWithGenres, STREAMING_FILES } from "$lib/services";
  import "../../app.css";
  import "./page.css";

  let isLoading = true;
  let loadingStatus = "Lädt Streaming-Daten...";
  let lastGraphInput: any = null;
  
  // Check if we're in overview mode and if UI should be visible
  $: isInOverviewPhase = $scrollyStore.phase === 'overview' || $scrollyStore.isInOverview || $uiStore.isOverviewModeManual;
  $: overviewUIReady = $scrollyStore.overviewUIReady;
  // Show bottom header when: not during start animation AND (not in overview OR (in overview AND UI ready))
  $: showBottomHeader = !$isStartAnimationRunning && (!isInOverviewPhase || overviewUIReady);

  onMount(async () => {
    try {
      // Load all streaming history JSON files
      loadingStatus = "Lädt Streaming-Daten...";
      const streamingHistory = await loadStreamingHistory(STREAMING_FILES);
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
      // Set artists data for search
      setArtistsData(lastGraphInput.artists.map((a: any) => ({
        artistId: a.artistId,
        name: a.name,
        genres: a.genres
      })));

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
</svelte:head>

<main class="app">
  {#if isLoading}
    <LoadingScreen status={loadingStatus} />
  {:else}
    <ScrollyContainer>
      <div class="layout">
        {#if !$isStartAnimationRunning}
          <div transition:fade={{ duration: 300 }}>
            <GenreTitle />
          </div>
        {/if}

        <section class="graph-container">
          <GraphCanvas />
          <GenreDetail />
        </section>
      </div>
    </ScrollyContainer>
    <SearchBar />
    <Tooltip />
    {#if showBottomHeader}
      <div transition:fade={{ duration: 400 }}>
        <BottomHeader />
      </div>
    {/if}
  {/if}
</main>


