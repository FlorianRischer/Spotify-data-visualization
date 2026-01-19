<script lang="ts">
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { scrollyStore } from '$lib/stores/scrollyStore';
  import { graphData } from '$lib/stores';

  let previousCategory: string | null = null;
  let scrollDirection: 'down' | 'up' = 'down';

  // Animation distance
  const flyDistance = 150;
  
  // Reactive animation params based on scroll direction (X-Achse)
  $: inX = scrollDirection === 'down' ? -flyDistance : flyDistance;
  $: outX = scrollDirection === 'down' ? flyDistance : -flyDistance;

  // Verwende displayedCategory
  $: displayedCategory = $scrollyStore.displayedCategory;
  
  // Prüfe ob es eine echte Kategorie ist (nicht Overview/Explore/Intro)
  $: isRealCategory = displayedCategory && 
    displayedCategory !== ('Overview' as any) && 
    displayedCategory !== ('Explore' as any) && 
    displayedCategory !== ('Intro' as any) &&
    $graphData?.nodes?.some(n => n.category === displayedCategory);
  
  // Nur sichtbar in zoom Phase und wenn echte Kategorie
  $: phase = $scrollyStore.phase;
  $: isVisible = !!(isRealCategory && phase === 'zoom');
  
  // Track scroll direction based on category changes - gleich wie GenreTitle
  $: {
    if (previousCategory !== null && displayedCategory !== previousCategory) {
      const prevIndex = $scrollyStore.genreGroupQueue.indexOf(previousCategory as any);
      const currIndex = $scrollyStore.genreGroupQueue.indexOf(displayedCategory as any);
      
      if (currIndex > prevIndex || (prevIndex === -1 && currIndex >= 0)) {
        scrollDirection = 'down';
      } else if (currIndex < prevIndex || (currIndex === -1 && prevIndex >= 0)) {
        scrollDirection = 'up';
      }
    }
    previousCategory = displayedCategory;
  }

  interface DetailStats {
    percentage: string;
    totalHours: number;
    topGenre: string;
    topGenrePercent: string;
    topArtist: string;
    topArtistHours: string;
    genreCount: number;
  }

  let stats: DetailStats | null = null;

  // Berechne Stats basierend auf displayedCategory
  $: if (isRealCategory && $graphData?.nodes) {
    stats = calculateStats(displayedCategory!, $graphData.nodes);
  } else {
    stats = null;
  }

  function calculateStats(category: string, nodes: any[]): DetailStats {
    const categoryNodes = nodes.filter(n => n.category === category);
    const allNodes = nodes;
    
    // Total minutes für diese Kategorie
    const categoryMinutes = categoryNodes.reduce((sum, n) => sum + (n.totalMinutes || 0), 0);
    const totalMinutes = allNodes.reduce((sum, n) => sum + (n.totalMinutes || 0), 0);
    
    // Prozent vom Gesamten
    const percentage = totalMinutes > 0 
      ? ((categoryMinutes / totalMinutes) * 100).toFixed(1)
      : '0';
    
    // Stunden
    const totalHours = Math.round(categoryMinutes / 60);
    
    // Top Genre (Subgenre mit meisten Minuten)
    const sortedByMinutes = [...categoryNodes].sort((a, b) => 
      (b.totalMinutes || 0) - (a.totalMinutes || 0)
    );
    const topNode = sortedByMinutes[0];
    const topGenre = topNode?.label || '—';
    const topGenrePercent = categoryMinutes > 0 && topNode?.totalMinutes
      ? ((topNode.totalMinutes / categoryMinutes) * 100).toFixed(0)
      : '0';
    
    // Top Artist (über alle Genres dieser Kategorie - basierend auf gesamter Artist-Zeit)
    let topArtist = '—';
    let topArtistTotalMinutes = 0;
    
    for (const node of categoryNodes) {
      const artistTotal = node.topArtistTotalMinutes || node.topArtistMinutes || 0;
      if (artistTotal > topArtistTotalMinutes) {
        topArtistTotalMinutes = artistTotal;
        topArtist = node.topArtist || '—';
      }
    }
    
    const topArtistHours = topArtistTotalMinutes > 0 
      ? `${Math.round(topArtistTotalMinutes / 60)}h`
      : '—';
    
    return {
      percentage,
      totalHours,
      topGenre,
      topGenrePercent,
      topArtist,
      topArtistHours,
      genreCount: categoryNodes.length
    };
  }
</script>

{#if isVisible && stats}
  <div class="genre-detail">
    {#key displayedCategory}
      <div
        class="detail-card"
        in:fly={{ x: inX, duration: 500, easing: cubicOut }}
        out:fly={{ x: outX, duration: 500, easing: cubicOut }}
      >
        <!-- Percentage Header -->
        <div class="stat-hero">
          <span class="hero-value">{stats.percentage}%</span>
          <span class="hero-label">of my listening</span>
        </div>
        
        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-value">{stats.totalHours}h</span>
            <span class="stat-label">Total Time</span>
          </div>
          
          <div class="stat-item">
            <span class="stat-value">{stats.genreCount}</span>
            <span class="stat-label">Subgenres</span>
          </div>
        </div>
        
        <!-- Top Genre -->
        <div class="stat-section">
          <span class="section-label">Top Subgenre</span>
          <span class="section-value">{stats.topGenre}</span>
          <span class="section-sub">{stats.topGenrePercent}% of category</span>
        </div>
        
        <!-- Top Artist -->
        <div class="stat-section">
          <span class="section-label">Most Played Artist</span>
          <span class="section-value">{stats.topArtist}</span>
          <span class="section-sub">{stats.topArtistHours} listened</span>
        </div>
      </div>
    {/key}
  </div>
{/if}

<style>
  .genre-detail {
    position: fixed;
    right: 100px;
    top: 50%;
    z-index: 10;
    pointer-events: none;
  }

  .detail-card {
    position: absolute;
    top: 0;
    right: 0;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    padding: 40px;
    min-width: 340px;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .stat-hero {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    padding-bottom: 28px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  .hero-value {
    font-family: 'Anton', sans-serif;
    font-size: 88px;
    font-weight: 400;
    color: #1a1a1a;
    line-height: 1;
    letter-spacing: -3px;
  }

  .hero-label {
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    font-weight: 400;
    color: rgba(0, 0, 0, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 28px;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .stat-value {
    font-family: 'Anton', sans-serif;
    font-size: 48px;
    font-weight: 400;
    color: #1a1a1a;
    line-height: 1;
  }

  .stat-label {
    font-family: 'Inter', sans-serif;
    font-size: 14px;
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
    font-size: 13px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.4);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .section-value {
    font-family: 'Baloo Bhai 2', sans-serif;
    font-size: 26px;
    font-weight: 500;
    color: #1a1a1a;
    line-height: 1.2;
    word-break: break-word;
  }

  .section-sub {
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 400;
    color: rgba(0, 0, 0, 0.4);
  }

  @media (max-width: 1200px) {
    .genre-detail {
      right: 80px;
    }
    
    .detail-card {
      padding: 32px;
      min-width: 300px;
      max-width: 340px;
      gap: 28px;
    }
    
    .hero-value {
      font-size: 72px;
    }
    
    .stat-value {
      font-size: 40px;
    }
    
    .section-value {
      font-size: 22px;
    }
  }

  @media (max-width: 900px) {
    .genre-detail {
      right: 40px;
    }
    
    .detail-card {
      padding: 28px;
      min-width: 260px;
      max-width: 300px;
      gap: 24px;
    }
    
    .hero-value {
      font-size: 60px;
    }
    
    .stat-value {
      font-size: 36px;
    }
    
    .section-value {
      font-size: 20px;
    }
    
    .hero-label {
      font-size: 14px;
    }
    
    .stats-grid {
      gap: 24px;
    }
  }

  @media (max-width: 600px) {
    .genre-detail {
      right: 24px;
      top: auto;
      bottom: 100px;
      transform: none;
    }
    
    .detail-card {
      padding: 24px;
      min-width: 240px;
      max-width: 280px;
      gap: 20px;
    }
    
    .hero-value {
      font-size: 56px;
    }
    
    .stat-value {
      font-size: 32px;
    }
    
    .section-value {
      font-size: 18px;
    }
    
    .hero-label {
      font-size: 13px;
    }
    
    .stats-grid {
      gap: 20px;
    }
    
    .stat-label, .section-label {
      font-size: 10px;
    }
  }
</style>
