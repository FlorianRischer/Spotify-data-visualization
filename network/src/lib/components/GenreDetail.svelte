<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { scrollyStore } from '$lib/stores/scrollyStore';
  import { graphData } from '$lib/stores';

  let isVisible = false;
  let displayedText = '';
  let typewriterActive = false;
  let typingAnimationId: number | null = null;
  let prefersReducedMotion = false;
  let isHovering = false;
  let displayedLines: Array<{ text: string; isLabel: boolean }> = [];
  
  // Gleiche Logik wie GenreTitle
  let previousCategory: string | null = null;
  let scrollDirection: 'down' | 'up' = 'down';

  // Animation distance - gleich wie GenreTitle
  const flyDistance = 150;
  
  // Reactive animation params based on scroll direction - für X-Achse (horizontal) - gespiegelt
  $: inX = scrollDirection === 'down' ? -flyDistance : flyDistance;
  $: outX = scrollDirection === 'down' ? flyDistance : -flyDistance;

  // Verwende displayedCategory statt focusedCategory - wird nur nach Kamera-Zoom gesetzt (wie GenreTitle)
  $: displayedCategory = $scrollyStore.displayedCategory;
  
  // Nur sichtbar in zoom und detail Phasen, nicht in overview/summary
  $: phase = $scrollyStore.phase;
  $: isVisible = displayedCategory && (phase === 'zoom' || phase === 'detail');
  
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

  interface DetailContent {
    playcount: string;
    timeListened: string;
    topArtist: string;
    artists: string;
  }

  let detailContent: DetailContent = {
    playcount: '',
    timeListened: '',
    topArtist: '',
    artists: ''
  };

  // Berechne Detail-Infos basierend auf displayedCategory (wie GenreTitle)
  $: if (displayedCategory && $graphData?.nodes) {
    updateDetailContent(displayedCategory, $graphData.nodes);
    displayFullText();
  } else {
    isVisible = false;
    displayedText = '';
    typewriterActive = false;
  }

  function updateDetailContent(category: string, nodes: any[]) {
    const categoryNodes = nodes.filter(n => n.category === category);
    
    if (categoryNodes.length === 0) {
      detailContent = {
        playcount: 'No data available',
        timeListened: '—',
        topArtist: '—',
        artists: '—'
      };
      return;
    }

    // Berechne Playcount Statistiken
    const totalPlaycount = categoryNodes.reduce((sum, n) => sum + (n.size || 0), 0);
    const overallTotal = nodes.reduce((sum, n) => sum + (n.size || 0), 0);
    const percentage = ((totalPlaycount / overallTotal) * 100).toFixed(1);
    
    // Berechne echte Minuten aus den Nodes
    // Versuche verschiedene Feldnamen für Zeit-Informationen
    const totalMinutes = categoryNodes.reduce((sum, n) => {
      // Versuche verschiedene mögliche Felder
      const minutes = n.totalMinutes || n.duration_minutes || n.ms_played_minutes || 0;
      return sum + minutes;
    }, 0);

    // Falls keine echten Minuten vorhanden, nutze size als Fallback (normalisiert)
    const effectiveMinutes = totalMinutes > 0 ? totalMinutes : totalPlaycount * 10;
    
    // Top Sub-Kategorien (gruppiert nach label)
    const subCategories = new Map<string, number>();
    categoryNodes.forEach(n => {
      const key = n.label || 'Unknown';
      subCategories.set(key, (subCategories.get(key) || 0) + (n.size || 0));
    });
    
    const topSubs = Array.from(subCategories.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([label, count]) => {
        const pct = ((count / totalPlaycount) * 100).toFixed(0);
        return `${pct}% ${label}`;
      })
      .join(', ');

    // TimeListened berechnung basierend auf echten Minuten
    const timeListened = formatTimeListened(effectiveMinutes);

    // Top Artists nach Time Listened (nicht nach Playcount)
    // Finde den Genre mit den meisten Minuten
    const topNodeByTime = categoryNodes.reduce((max, n) => {
      const nodeMinutes = n.totalMinutes || n.duration_minutes || n.ms_played_minutes || 0;
      const maxMinutes = max.totalMinutes || max.duration_minutes || max.ms_played_minutes || 0;
      return nodeMinutes > maxMinutes ? n : max;
    });
    const topArtist = topNodeByTime?.topArtist || topNodeByTime?.label || '—';

    // Genres Liste (alle Sub-Genre-Labels)
    const artistsList = Array.from(subCategories.keys())
      .join(', ') || '—';

    detailContent = {
      playcount: `${percentage}% of all listening\n(${topSubs})`,
      timeListened,
      topArtist,
      artists: artistsList
    };

    isVisible = true;
  }

  function formatTimeListened(minutes: number): string {
    if (minutes <= 0) return '—';
    
    const hours = Math.round(minutes / 60);
    const days = Math.round(minutes / 1440);
    const weeks = Math.round(minutes / 10080);
    
    // Wähle beste Einheit basierend auf Größe
    if (weeks >= 2) {
      return `${hours} Stunden, Krass das sind ${weeks} Wochen`;
    } else if (days >= 2) {
      return `${hours} Stunden, Krass das sind ${days} Tage`;
    } else {
      return `${hours} Stunden, Krass das sind ${days} Tag`;
    }
  }

  function displayFullText() {
    if (typingAnimationId !== null) {
      if (typeof typingAnimationId === 'number' && typingAnimationId > 100000) {
        cancelAnimationFrame(typingAnimationId as unknown as number);
      } else {
        clearTimeout(typingAnimationId);
      }
    }

    displayedLines = buildFullText();
    typewriterActive = false;
    typingAnimationId = null;
  }

  function buildFullText(): Array<{ text: string; isLabel: boolean }> {
    return [
      { text: 'Playcount:', isLabel: true },
      { text: detailContent.playcount, isLabel: false },
      { text: '', isLabel: true }, // empty line
      { text: 'Timelistened:', isLabel: true },
      { text: detailContent.timeListened, isLabel: false },
      { text: '', isLabel: true }, // empty line
      { text: 'TopArtist:', isLabel: true },
      { text: detailContent.topArtist, isLabel: false },
      { text: '', isLabel: true }, // empty line
      { text: 'Genres:', isLabel: true },
      { text: detailContent.artists, isLabel: false }
    ];
  }

  onMount(() => {
    // Check für reduced motion preference
    prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Listen für changes in reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  });

  onDestroy(() => {
    if (typingAnimationId !== null) {
      if (typeof typingAnimationId === 'number' && typingAnimationId > 100000) {
        cancelAnimationFrame(typingAnimationId as unknown as number);
      } else {
        clearTimeout(typingAnimationId);
      }
    }
  });

  function handleMouseEnter() {
    isHovering = true;
  }

  function handleMouseLeave() {
    isHovering = false;
  }

  function handleWheel(e: WheelEvent) {
    // Scrolle manuell den detail-content
    const target = e.currentTarget as HTMLElement;
    const scrollContainer = target.querySelector('.detail-content') as HTMLElement;
    if (scrollContainer) {
      scrollContainer.scrollTop += e.deltaY;
    }
  }
</script>

<div
  class="genre-detail"
  class:visible={isVisible}
  class:hovering={isHovering}
  role="region"
  aria-labelledby="genre-detail-title"
  aria-live="polite"
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  on:wheel|stopPropagation|preventDefault={handleWheel}
>
  {#key displayedCategory}
    <div
      class="detail-content"
      in:fly={{ x: inX, duration: 500, easing: cubicOut }}
      out:fly={{ x: outX, duration: 500, easing: cubicOut }}
    >
      <div class="detail-text">
        {#each displayedLines as line (line)}
          {#if line.isLabel}
            <div class="label">{line.text}</div>
          {:else}
            <div class="data-value">{line.text}</div>
          {/if}
        {/each}
      </div>
    </div>
  {/key}
</div>

<style>
  .genre-detail {
    position: fixed;
    right: 120px;
    top: 20%;
    transform: translateY(-50%);
    max-width: 300px;
    z-index: 8;
    opacity: 0;
    transition: opacity 0.5s ease-in-out;
    pointer-events: none;
    width: 100%;
    height: auto;
  }

  .genre-detail.visible {
    opacity: 1;
    pointer-events: auto;
  }

  .genre-detail.hovering {
    z-index: 100;
  }

  .detail-content {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(4px);
    border-radius: 8px;
    padding: 20px 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    max-height: 600px;
    overflow-y: auto;
    scroll-behavior: smooth;
    scrollbar-width: none;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    will-change: transform, opacity;
    mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%);
  }

  .detail-content::-webkit-scrollbar {
    display: none;
  }

  .detail-text {
    font-size: 24px;
    line-height: 1.6;
    color: #1a1a1a;
    font-weight: 400;
    margin: 0;
    font-family: 'Anton', sans-serif;
    white-space: pre-wrap;
    word-break: break-word;
    text-transform: uppercase;
    letter-spacing: -0.5px;
    --label-font-size: 24px;
    --label-font-weight: 400;
    --data-font-size: 18px;
    --data-font-weight: 300;
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .label {
    font-size: var(--label-font-size);
    font-weight: var(--label-font-weight);
    margin-bottom: 4px;
  }

  .data-value {
    font-size: var(--data-font-size);
    font-weight: var(--data-font-weight);
  }

  .cursor {
    display: inline-block;
    width: 2px;
    height: 1em;
    background: #1a1a1a;
    margin-left: 2px;
    animation: blink 0.8s infinite;
  }

  @keyframes blink {
    0%,
    49% {
      opacity: 1;
    }
    50%,
    100% {
      opacity: 0;
    }
  }

  @media (max-width: 1024px) {
    .genre-detail {
      right: 120px;
      max-width: 250px;
    }

    .detail-content {
      padding: 16px 12px;
      max-height: 500px;
    }

    .detail-text {
      font-size: 16px;      --label-font-size: 18px;
      --data-font-size: 14px;    }
  }

  @media (prefers-reduced-motion: reduce) {
    .cursor {
      animation: none;
      opacity: 0;
    }
  }
</style>
