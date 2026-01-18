<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { searchStore } from '$lib/stores/searchStore';
  import { graphData } from '$lib/stores';
  import { uiStore } from '$lib/stores/uiStore';
  import { getGenreCategory, type GenreCategory } from '$lib/graph/genreMapping';

  // Nur sichtbar wenn Search aktiv ist und im Explore Mode
  $: isExploreMode = $uiStore.isOverviewModeManual;
  $: isSearchActive = $searchStore.isSearchActive;
  $: searchType = $searchStore.searchType;
  $: matchedNodeIds = $searchStore.matchedNodeIds;
  $: matchedArtists = $searchStore.matchedArtists;
  $: matchedCategory = $searchStore.matchedCategory;
  $: query = $searchStore.query;
  
  $: isVisible = isExploreMode && isSearchActive && matchedNodeIds.size > 0;

  // Genre Stats Interface
  interface GenreStats {
    genreName: string;
    percentage: string;
    totalHours: number;
    topArtist: string;
    topArtistHours: string;
    category: string;
    relatedGenres: string[];
  }

  // Artist Stats Interface
  interface ArtistStats {
    artistName: string;
    genreCount: number;
    topGenre: string;
    topGenreHours: string;
    totalHours: number;
    genres: string[];
  }

  // Category Stats Interface
  interface CategoryStats {
    categoryName: string;
    percentage: string;
    totalHours: number;
    genreCount: number;
    topGenre: string;
    topGenrePercent: string;
    topArtist: string;
    topArtistHours: string;
  }

  let genreStats: GenreStats | null = null;
  let artistStats: ArtistStats | null = null;
  let categoryStats: CategoryStats | null = null;

  // Calculate stats based on search type
  $: if (isVisible && $graphData?.nodes) {
    if (searchType === 'category' && matchedCategory) {
      categoryStats = calculateCategoryStats(matchedCategory, $graphData.nodes);
      genreStats = null;
      artistStats = null;
    } else if (searchType === 'artist' && matchedArtists.length > 0) {
      artistStats = calculateArtistStats(matchedArtists[0], $graphData.nodes);
      genreStats = null;
      categoryStats = null;
    } else if (matchedNodeIds.size > 0) {
      // Genre search - get the first matched genre
      const firstMatchedId = Array.from(matchedNodeIds)[0];
      const matchedNode = $graphData.nodes.find(n => n.id === firstMatchedId);
      if (matchedNode) {
        genreStats = calculateGenreStats(matchedNode, $graphData.nodes);
      }
      artistStats = null;
      categoryStats = null;
    }
  } else {
    genreStats = null;
    artistStats = null;
    categoryStats = null;
  }

  function calculateGenreStats(node: any, allNodes: any[]): GenreStats {
    const totalMinutes = allNodes.reduce((sum, n) => sum + (n.totalMinutes || 0), 0);
    const percentage = totalMinutes > 0 
      ? ((node.totalMinutes / totalMinutes) * 100).toFixed(1)
      : '0';
    
    const totalHours = Math.round((node.totalMinutes || 0) / 60);
    const category = node.category || getGenreCategory(node.label) || 'Unknown';
    
    // Find related genres (same category, sorted by minutes)
    const relatedGenres = allNodes
      .filter(n => n.category === category && n.id !== node.id)
      .sort((a, b) => (b.totalMinutes || 0) - (a.totalMinutes || 0))
      .slice(0, 3)
      .map(n => n.label);
    
    return {
      genreName: node.label,
      percentage,
      totalHours,
      topArtist: node.topArtist || '—',
      topArtistHours: node.topArtistMinutes 
        ? `${Math.round(node.topArtistMinutes / 60)}h`
        : '—',
      category,
      relatedGenres
    };
  }

  function calculateArtistStats(artist: any, allNodes: any[]): ArtistStats {
    // Get all genres for this artist
    const artistGenreNodes = allNodes.filter(n => artist.genres.includes(n.id));
    
    // Use the totalMinutes directly from the artist object (from artistPlaytime)
    const totalMinutes = artist.totalMinutes || 0;
    
    // Sort genres by total listening time for that genre
    const sortedGenres = [...artistGenreNodes]
      .sort((a, b) => (b.totalMinutes || 0) - (a.totalMinutes || 0));
    
    const topGenreNode = sortedGenres[0];
    
    // Calculate time spent in top genre (approximate: totalTime / genreCount)
    const timePerGenre = artistGenreNodes.length > 0 
      ? Math.round(totalMinutes / artistGenreNodes.length) 
      : 0;
    
    return {
      artistName: artist.name,
      genreCount: artist.genres.length,
      topGenre: topGenreNode?.label || '—',
      topGenreHours: timePerGenre > 0 
        ? `${Math.round(timePerGenre / 60)}h`
        : '—',
      totalHours: Math.round(totalMinutes / 60),
      genres: artistGenreNodes.slice(0, 4).map(n => n.label)
    };
  }

  function calculateCategoryStats(category: GenreCategory, allNodes: any[]): CategoryStats {
    const categoryNodes = allNodes.filter(n => n.category === category);
    const totalMinutes = allNodes.reduce((sum, n) => sum + (n.totalMinutes || 0), 0);
    const categoryMinutes = categoryNodes.reduce((sum, n) => sum + (n.totalMinutes || 0), 0);
    
    const percentage = totalMinutes > 0 
      ? ((categoryMinutes / totalMinutes) * 100).toFixed(1)
      : '0';
    
    const totalHours = Math.round(categoryMinutes / 60);
    
    // Top genre in category
    const sortedByMinutes = [...categoryNodes].sort((a, b) => 
      (b.totalMinutes || 0) - (a.totalMinutes || 0)
    );
    const topNode = sortedByMinutes[0];
    const topGenre = topNode?.label || '—';
    const topGenrePercent = categoryMinutes > 0 && topNode?.totalMinutes
      ? ((topNode.totalMinutes / categoryMinutes) * 100).toFixed(0)
      : '0';
    
    // Top artist in category (based on total artist listening time, not per-genre time)
    let topArtist = '—';
    let topArtistTotalMinutes = 0;
    for (const node of categoryNodes) {
      const artistTotal = node.topArtistTotalMinutes || node.topArtistMinutes || 0;
      if (artistTotal > topArtistTotalMinutes) {
        topArtistTotalMinutes = artistTotal;
        topArtist = node.topArtist || '—';
      }
    }
    
    return {
      categoryName: category,
      percentage,
      totalHours,
      genreCount: categoryNodes.length,
      topGenre,
      topGenrePercent,
      topArtist,
      topArtistHours: topArtistTotalMinutes > 0 
        ? `${Math.round(topArtistTotalMinutes / 60)}h`
        : '—'
    };
  }
</script>

{#if isVisible}
  <div class="search-detail" in:fade={{ duration: 300 }} out:fade={{ duration: 200 }}>
    {#key query}
      <div
        class="detail-card"
        in:fly={{ x: 100, duration: 400, easing: cubicOut }}
        out:fly={{ x: 50, duration: 200, easing: cubicOut }}
      >
        {#if searchType === 'genre' && genreStats}
          <!-- Genre Stats -->
          <div class="stat-hero">
            <span class="hero-value">{genreStats.percentage}%</span>
            <span class="hero-label">of your listening</span>
          </div>
          
          <div class="title-section">
            <span class="result-type">Genre</span>
            <span class="result-name">{genreStats.genreName}</span>
          </div>
          
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-value">{genreStats.totalHours}h</span>
              <span class="stat-label">Total Time</span>
            </div>
            
            <div class="stat-item">
              <span class="stat-value-text">{genreStats.category}</span>
              <span class="stat-label">Category</span>
            </div>
          </div>
          
          <div class="stat-section">
            <span class="section-label">Top Artist</span>
            <span class="section-value">{genreStats.topArtist}</span>
            <span class="section-sub">{genreStats.topArtistHours} listened</span>
          </div>
          
          {#if genreStats.relatedGenres.length > 0}
            <div class="stat-section">
              <span class="section-label">Related Genres</span>
              <div class="tags">
                {#each genreStats.relatedGenres as genre}
                  <span class="tag">{genre}</span>
                {/each}
              </div>
            </div>
          {/if}
          
        {:else if searchType === 'artist' && artistStats}
          <!-- Artist Stats -->
          <div class="title-section hero">
            <span class="result-type">Artist</span>
            <span class="result-name large">{artistStats.artistName}</span>
          </div>
          
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-value">{artistStats.genreCount}</span>
              <span class="stat-label">Genres</span>
            </div>
            
            <div class="stat-item">
              <span class="stat-value">{artistStats.totalHours}h</span>
              <span class="stat-label">Listened</span>
            </div>
          </div>
          
          <div class="stat-section">
            <span class="section-label">Top Genre</span>
            <span class="section-value">{artistStats.topGenre}</span>
            <span class="section-sub">{artistStats.topGenreHours} in this genre</span>
          </div>
          
          {#if artistStats.genres.length > 0}
            <div class="stat-section">
              <span class="section-label">Associated Genres</span>
              <div class="tags">
                {#each artistStats.genres as genre}
                  <span class="tag">{genre}</span>
                {/each}
              </div>
            </div>
          {/if}
          
        {:else if searchType === 'category' && categoryStats}
          <!-- Category Stats -->
          <div class="stat-hero">
            <span class="hero-value">{categoryStats.percentage}%</span>
            <span class="hero-label">of your listening</span>
          </div>
          
          <div class="title-section">
            <span class="result-type">Category</span>
            <span class="result-name">{categoryStats.categoryName}</span>
          </div>
          
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-value">{categoryStats.totalHours}h</span>
              <span class="stat-label">Total Time</span>
            </div>
            
            <div class="stat-item">
              <span class="stat-value">{categoryStats.genreCount}</span>
              <span class="stat-label">Subgenres</span>
            </div>
          </div>
          
          <div class="stat-section">
            <span class="section-label">Top Subgenre</span>
            <span class="section-value">{categoryStats.topGenre}</span>
            <span class="section-sub">{categoryStats.topGenrePercent}% of category</span>
          </div>
          
          <div class="stat-section">
            <span class="section-label">Most Played Artist</span>
            <span class="section-value">{categoryStats.topArtist}</span>
            <span class="section-sub">{categoryStats.topArtistHours} listened</span>
          </div>
        {/if}
      </div>
    {/key}
  </div>
{/if}

<style>
  .search-detail {
    position: fixed;
    right: 100px;
    top: 50%;
    z-index: 100;
    pointer-events: none;
  }

  .detail-card {
    position: absolute;
    top: 0;
    right: 0;
    transform: translateY(-50%);
    background: none;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: none;
    padding: 36px;
    min-width: 320px;
    max-width: 380px;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .stat-hero {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  .hero-value {
    font-family: 'Anton', sans-serif;
    font-size: 72px;
    font-weight: 400;
    color: #1a1a1a;
    line-height: 1;
    letter-spacing: -2px;
  }

  .hero-label {
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 400;
    color: rgba(0, 0, 0, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .title-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .title-section.hero {
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  .result-type {
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.4);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .result-name {
    font-family: 'Baloo Bhai 2', sans-serif;
    font-size: 24px;
    font-weight: 500;
    color: #1a1a1a;
    line-height: 1.2;
    word-break: break-word;
  }

  .result-name.large {
    font-size: 32px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .stat-value {
    font-family: 'Anton', sans-serif;
    font-size: 40px;
    font-weight: 400;
    color: #1a1a1a;
    line-height: 1;
  }

  .stat-value-text {
    font-family: 'Baloo Bhai 2', sans-serif;
    font-size: 20px;
    font-weight: 500;
    color: #1a1a1a;
    line-height: 1.2;
  }

  .stat-label {
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 400;
    color: rgba(0, 0, 0, 0.45);
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .stat-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .section-label {
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.4);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .section-value {
    font-family: 'Baloo Bhai 2', sans-serif;
    font-size: 22px;
    font-weight: 500;
    color: #1a1a1a;
    line-height: 1.2;
    word-break: break-word;
  }

  .section-sub {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 400;
    color: rgba(0, 0, 0, 0.4);
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 4px;
  }

  .tag {
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.7);
    background: rgba(0, 0, 0, 0.06);
    padding: 6px 12px;
    border-radius: 20px;
  }

  @media (max-width: 1200px) {
    .search-detail {
      right: 80px;
    }
    
    .detail-card {
      padding: 28px;
      min-width: 280px;
      max-width: 320px;
      gap: 24px;
    }
    
    .hero-value {
      font-size: 60px;
    }
    
    .stat-value {
      font-size: 32px;
    }
    
    .result-name {
      font-size: 20px;
    }
    
    .result-name.large {
      font-size: 26px;
    }
    
    .section-value {
      font-size: 18px;
    }
  }

  @media (max-width: 900px) {
    .search-detail {
      right: 24px;
      top: auto;
      bottom: 120px;
      transform: none;
    }
    
    .detail-card {
      transform: none;
      padding: 24px;
      min-width: 240px;
      max-width: 280px;
      gap: 20px;
    }
    
    .hero-value {
      font-size: 48px;
    }
    
    .stat-value {
      font-size: 28px;
    }
    
    .result-name {
      font-size: 18px;
    }
    
    .result-name.large {
      font-size: 22px;
    }
    
    .section-value {
      font-size: 16px;
    }
    
    .stats-grid {
      gap: 16px;
    }
    
    .tag {
      font-size: 11px;
      padding: 5px 10px;
    }
  }
</style>
