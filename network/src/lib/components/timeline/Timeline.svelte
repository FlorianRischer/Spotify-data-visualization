<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { fly, fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { 
    timelineStore, 
    navigateToNextYear, 
    navigateToPreviousYear,
    currentYearDiscovery,
    genreDiscoveryData,
    getMonthPositionPercent,
    TIMELINE_CONFIG,
    currentYearlySummary,
    type GenreDiscoveryData
  } from '$lib/stores/timelineStore';
  import { scrollyStore, isTimelinePhase } from '$lib/stores/scrollyStore';
  import { getCategoryColor } from '$lib/graph/categoryColors';

  // Monate für die Anzeige
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Erstes Jahr beginnt erst im August (Index 7), vorher keine Daten
  const FIRST_YEAR_START_MONTH = 7; // August (0-indexed)
  
  // Berechne wo die Timeline-Linie starten soll (kurz vor dem ersten Monat mit Daten)
  function getLineStartPercent(yearIndex: number): number {
    if (yearIndex === 0) {
      return getMonthPositionPercent(FIRST_YEAR_START_MONTH + 1) * 100 - 2;
    }
    return 0;
  }
  
  // Berechne die Position eines Ticks relativ zur Linie
  function getTickPosition(yearIndex: number, monthIndex: number): number {
    const lineStart = getLineStartPercent(yearIndex);
    const absolutePosition = getMonthPositionPercent(monthIndex + 1) * 100;
    
    if (yearIndex === 0) {
      // Relative Position innerhalb der verkürzten Linie
      return ((absolutePosition - lineStart) / (100 - lineStart)) * 100;
    }
    return absolutePosition;
  }
  
  // Funktion um die sichtbaren Monate für ein Jahr zu bekommen
  function getVisibleMonths(yearIndex: number): { month: string; originalIndex: number }[] {
    if (yearIndex === 0) {
      // Erstes Jahr: nur August bis Dezember (Index 7-11)
      return MONTHS.slice(FIRST_YEAR_START_MONTH).map((month, i) => ({
        month,
        originalIndex: FIRST_YEAR_START_MONTH + i
      }));
    }
    // Alle anderen Jahre: alle Monate
    return MONTHS.map((month, i) => ({ month, originalIndex: i }));
  }
  
  // Store subscriptions
  $: isActive = $isTimelinePhase;
  $: currentYearIndex = $timelineStore.currentYearIndex;
  $: availableYears = $timelineStore.availableYears;
  $: isAnimating = $timelineStore.isAnimating;
  $: currentYearNum = availableYears[currentYearIndex] || 2018;
  $: totalYears = availableYears.length;
  
  // Genre Discovery Data
  $: yearDiscovery = $currentYearDiscovery;
  $: allDiscoveries = $genreDiscoveryData;
  
  // Yearly Summary Stats
  $: yearlySummary = $currentYearlySummary;
  
  // Track scroll direction for animations (1 = forward/right, -1 = backward/left)
  let scrollDirection = 1;
  let previousYearIndex = 0;
  
  // Navigation animation state
  let navAnimationDirection: 'left' | 'right' | null = null;
  let navAnimationTimeout: ReturnType<typeof setTimeout> | null = null;
  
  function triggerNavAnimation(direction: 'left' | 'right') {
    // Clear previous timeout
    if (navAnimationTimeout) clearTimeout(navAnimationTimeout);
    
    navAnimationDirection = direction;
    
    // Reset after animation completes
    navAnimationTimeout = setTimeout(() => {
      navAnimationDirection = null;
    }, 300);
  }
  
  // Update scroll direction when year changes
  $: {
    if (currentYearIndex !== previousYearIndex) {
      scrollDirection = currentYearIndex > previousYearIndex ? 1 : -1;
      previousYearIndex = currentYearIndex;
    }
  }
  
  // Genres die in diesem Jahr entdeckt wurden, gruppiert nach Monat
  $: genresByMonth = yearDiscovery?.genresByMonth || new Map();
  $: totalDiscoveredThisYear = yearDiscovery?.totalDiscovered || 0;
  $: cumulativeTotal = yearDiscovery?.cumulativeTotal || 0;
  
  // Hilfsfunktion zum Formatieren der Hörzeit
  function formatListeningTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    if (hours >= 1000) {
      return `${(hours)} h`;
    }
    return `${hours} h`;
  }

  // Viewport und Container-Dimensionen (nutze zentrale Konfiguration)
  let viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const containerPadding = TIMELINE_CONFIG.containerPadding;
  
  // Berechne die Breite eines Jahr-Segments (entspricht der sichtbaren Track-Breite)
  $: yearSegmentWidth = viewportWidth - (containerPadding * 2);
  
  // Gesamtbreite der Timeline (alle Jahre)
  $: totalTimelineWidth = yearSegmentWidth * totalYears;
  
  // Horizontale Verschiebung basierend auf aktuellem Jahr
  $: timelineTranslateX = -currentYearIndex * yearSegmentWidth;

  onMount(() => {
    const handleResize = () => {
      viewportWidth = window.innerWidth;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  // Keyboard navigation for timeline (Links/Rechts für Jahre)
  function handleKeyDown(event: KeyboardEvent) {
    const scrollState = get(scrollyStore);
    if (scrollState.phase !== 'timeline') return;
    
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      triggerNavAnimation('right');
      navigateToNextYear();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      triggerNavAnimation('left');
      navigateToPreviousYear();
    }
  }

  // Horizontal Swipe/Scroll für Touchpad-Navigation
  let scrollAccumulator = 0;
  const SCROLL_THRESHOLD = 50;
  
  function handleWheel(event: WheelEvent) {
    const scrollState = get(scrollyStore);
    const timelineState = get(timelineStore);
    if (scrollState.phase !== 'timeline' || timelineState.isAnimating) return;
    
    const deltaX = event.deltaX;
    
    if (Math.abs(deltaX) < 2) return;
    
    scrollAccumulator += deltaX;
    
    if (scrollAccumulator > SCROLL_THRESHOLD) {
      triggerNavAnimation('right');
      navigateToNextYear();
      scrollAccumulator = 0;
    }
    else if (scrollAccumulator < -SCROLL_THRESHOLD) {
      triggerNavAnimation('left');
      navigateToPreviousYear();
      scrollAccumulator = 0;
    }
    
    if (Math.abs(deltaX) > Math.abs(event.deltaY)) {
      event.preventDefault();
    }
  }

  function getGenresForMonth(month: number): GenreDiscoveryData[] {
    return genresByMonth.get(month) || [];
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  });
</script>

{#if isActive}
  <div 
    class="timeline-container" 
    transition:fade={{ duration: 400 }}
  >
    <!-- Jahr-Anzeige oben rechts (immer sichtbar) -->
    <div class="year-display">
      <span class="year-number">
        {currentYearNum}
      </span>
    </div>

    <!-- Yearly Stats über der Timeline -->
    {#if yearlySummary}
      {#key currentYearIndex}
        <div 
          class="yearly-stats" 
          class:first-year={currentYearIndex === 0}
          in:fly={{ x: 40 * scrollDirection, duration: 400, delay: 150, easing: cubicOut }}
          out:fly={{ x: -40 * scrollDirection, duration: 300, easing: cubicOut }}
        >
          <div class="stat-item">
            <span class="stat-value">{formatListeningTime(yearlySummary.totalMinutes)}</span>
            <span class="stat-label">gehört</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">{yearlySummary.topGenre}</span>
            <span class="stat-label">Top Genre · {formatListeningTime(yearlySummary.topGenreMinutes)}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">{yearlySummary.topArtist}</span>
            <span class="stat-label">Top Artist · {formatListeningTime(yearlySummary.topArtistMinutes)}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">{yearDiscovery?.totalDiscovered || 0}</span>
            <span class="stat-label">Genres Discovered</span>
          </div>
        </div>
      {/key}
    {/if}

    <!-- Timeline-Viewport (sichtbarer Bereich) -->
    <div class="timeline-viewport">
      <!-- Timeline-Track (scrollt horizontal) -->
      <div 
        class="timeline-track"
        style="width: {totalTimelineWidth}px; transform: translateX({timelineTranslateX}px);"
      >
        <!-- Für jedes Jahr ein Segment -->
        {#each availableYears as year, yearIndex}
          <div 
            class="year-segment"
            class:active={yearIndex === currentYearIndex}
            style="width: {yearSegmentWidth}px;"
          >
            <!-- Jahr-Label am Anfang des Segments -->
            <div class="year-segment-label">{year}</div>
            
            <!-- Horizontale Linie mit Ticks -->
            <div class="timeline-line-wrapper">
              <div 
                class="timeline-line"
                style="left: {getLineStartPercent(yearIndex)}%; width: {100 - getLineStartPercent(yearIndex)}%;"
              >
                {#each getVisibleMonths(yearIndex) as { month, originalIndex }}
                  <div 
                    class="month-tick" 
                    style="left: {getTickPosition(yearIndex, originalIndex)}%"
                    class:visible={yearIndex === currentYearIndex}
                  ></div>
                {/each}
              </div>
            </div>
            
            <!-- Monats-Labels unter der Linie -->
            <div class="months-labels">
              {#each getVisibleMonths(yearIndex) as { month, originalIndex }}
                <span 
                  class="month-label" 
                  style="left: {getMonthPositionPercent(originalIndex + 1) * 100}%"
                  class:visible={yearIndex === currentYearIndex}
                >{month}</span>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Navigation Arrows -->
    {#if currentYearIndex > 0}
      <button 
        class="nav-arrow nav-arrow-left" 
        class:nav-animating={navAnimationDirection === 'left'}
        transition:fade={{ duration: 200 }}
        on:click={() => { triggerNavAnimation('left'); navigateToPreviousYear(); }}
        aria-label="Previous year"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    {/if}
    
    {#if currentYearIndex < totalYears - 1}
      <button 
        class="nav-arrow nav-arrow-right" 
        class:nav-animating={navAnimationDirection === 'right'}
        transition:fade={{ duration: 200 }}
        on:click={() => { triggerNavAnimation('right'); navigateToNextYear(); }}
        aria-label="Next year"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    {/if}
  </div>
{/if}

<style>
  .timeline-container {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 140px;
    z-index: 150;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    padding-bottom: 30px;
  }

  .year-display {
    position: fixed;
    top: 20px;
    right: 40px;
    z-index: 151;
    pointer-events: none;
  }

  .year-number {
    font-family: 'Anton', sans-serif;
    font-size: 64px;
    font-weight: 400;
    color: #000;
    line-height: 1;
  }

  /* Yearly Stats - über der Timeline */
  .yearly-stats {
    position: fixed;
    bottom: 120px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 12px 20px;
    background: none;
    backdrop-filter: blur(8px);
    border-radius: 12px;
    
    z-index: 200;
    transition: left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Im ersten Jahr (2018) weiter rechts positionieren, da Timeline erst im August beginnt */
  .yearly-stats.first-year {
    left: 68%;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .stat-value {
    font-family: 'Anton', sans-serif;
    font-size: 18px;
    font-weight: 400;
    color: #000;
    line-height: 1.2;
    text-transform: capitalize;
  }

  .stat-label {
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .stat-divider {
    width: 1px;
    height: 32px;
    background: rgba(0, 0, 0, 0.1);
  }

  /* Timeline Viewport - der sichtbare Bereich */
  .timeline-viewport {
    width: calc(100% - 130px); /* 65px padding auf jeder Seite */
    overflow: hidden;
    position: relative;
  }

  /* Timeline Track - scrollt horizontal */
  .timeline-track {
    display: flex;
    transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Ein Jahr-Segment */
  .year-segment {
    flex-shrink: 0;
    position: relative;
    padding-bottom: 8px;
  }

  .year-segment-label {
    position: absolute;
    left: 0;
    top: -30px;
    font-family: 'Baloo Bhai 2', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.3);
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  .year-segment.active .year-segment-label {
    opacity: 0; /* Versteckt, da wir die große Jahr-Anzeige oben haben */
  }

  .timeline-line-wrapper {
    position: relative;
    width: 100%;
    height: 2px;
  }

  .timeline-line {
    position: absolute;
    height: 2px;
    background: #000;
  }

  .month-tick {
    position: absolute;
    width: 2px;
    height: 12px;
    background: #000;
    top: -5px;
    transform: translateX(-50%) scaleY(0);
    opacity: 0;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease;
  }
  
  .month-tick.visible {
    transform: translateX(-50%) scaleY(1);
    opacity: 1;
  }
  
  /* Staggered animation delays for month ticks */
  .month-tick:nth-child(1).visible { transition-delay: 0.05s; }
  .month-tick:nth-child(2).visible { transition-delay: 0.1s; }
  .month-tick:nth-child(3).visible { transition-delay: 0.15s; }
  .month-tick:nth-child(4).visible { transition-delay: 0.2s; }
  .month-tick:nth-child(5).visible { transition-delay: 0.25s; }
  .month-tick:nth-child(6).visible { transition-delay: 0.3s; }
  .month-tick:nth-child(7).visible { transition-delay: 0.35s; }
  .month-tick:nth-child(8).visible { transition-delay: 0.4s; }
  .month-tick:nth-child(9).visible { transition-delay: 0.45s; }
  .month-tick:nth-child(10).visible { transition-delay: 0.5s; }
  .month-tick:nth-child(11).visible { transition-delay: 0.55s; }
  .month-tick:nth-child(12).visible { transition-delay: 0.6s; }

  .months-labels {
    position: relative;
    width: 100%;
    height: 30px;
    margin-top: 8px;
  }

  .month-label {
    position: absolute;
    transform: translateX(-50%) translateY(8px);
    font-family: 'Baloo Bhai 2', sans-serif;
    font-size: 18px;
    color: #000;
    opacity: 0;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease;
  }
  
  .month-label.visible {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
  
  /* Staggered animation delays for month labels */
  .month-label:nth-child(1).visible { transition-delay: 0.05s; }
  .month-label:nth-child(2).visible { transition-delay: 0.1s; }
  .month-label:nth-child(3).visible { transition-delay: 0.15s; }
  .month-label:nth-child(4).visible { transition-delay: 0.2s; }
  .month-label:nth-child(5).visible { transition-delay: 0.25s; }
  .month-label:nth-child(6).visible { transition-delay: 0.3s; }
  .month-label:nth-child(7).visible { transition-delay: 0.35s; }
  .month-label:nth-child(8).visible { transition-delay: 0.4s; }
  .month-label:nth-child(9).visible { transition-delay: 0.45s; }
  .month-label:nth-child(10).visible { transition-delay: 0.5s; }
  .month-label:nth-child(11).visible { transition-delay: 0.55s; }
  .month-label:nth-child(12).visible { transition-delay: 0.6s; }

  /* Navigation Arrows */
  .nav-arrow {
    position: fixed;
    top: 50%;
    transform: translateY(-50%);
    z-index: 152;
    pointer-events: auto;
    color: rgba(140, 135, 130, 0.4);
    transition: color 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), 
                transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    background: none;
    border: none;
    padding: 12px;
    cursor: pointer;
  }

  .nav-arrow:hover {
    color: rgba(100, 95, 90, 0.85);
  }

  .nav-arrow:active {
    transition: color 0.1s ease, transform 0.1s ease;
  }

  .nav-arrow-left {
    left: 24px;
  }

  .nav-arrow-left:hover {
    transform: translateY(-50%) translateX(-4px);
  }

  .nav-arrow-left:active {
    transform: translateY(-50%) translateX(-8px);
  }

  .nav-arrow-right {
    right: 24px;
  }

  .nav-arrow-right:hover {
    transform: translateY(-50%) translateX(4px);
  }

  .nav-arrow-right:active {
    transform: translateY(-50%) translateX(8px);
  }

  .nav-arrow svg {
    width: 32px;
    height: 32px;
    display: block;
    transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .nav-arrow:hover svg {
    transform: scale(1.08);
  }

  /* Animation when navigating via keyboard/touchpad */
  .nav-arrow-left.nav-animating {
    transform: translateY(-50%) translateX(-8px);
    color: rgba(100, 95, 90, 0.85);
  }

  .nav-arrow-left.nav-animating svg {
    transform: scale(1.1);
  }

  .nav-arrow-right.nav-animating {
    transform: translateY(-50%) translateX(8px);
    color: rgba(100, 95, 90, 0.85);
  }

  .nav-arrow-right.nav-animating svg {
    transform: scale(1.1);
  }

  /* Responsive */
  @media (max-width: 1200px) {
    .timeline-container {
      padding-bottom: 25px;
    }
    
    .timeline-viewport {
      width: calc(100% - 80px);
    }

    .year-number {
      font-size: 48px;
    }

    .month-label {
      font-size: 14px;
    }
  }

  @media (max-width: 900px) {
    .timeline-container {
      height: 120px;
      padding-bottom: 20px;
    }
    
    .timeline-viewport {
      width: calc(100% - 50px);
    }

    .year-number {
      font-size: 40px;
    }

    .month-label {
      font-size: 12px;
    }

    .month-tick {
      height: 10px;
      top: -4px;
    }
  }

  @media (max-width: 600px) {
    .timeline-container {
      height: 100px;
      padding-bottom: 15px;
    }
    
    .timeline-viewport {
      width: calc(100% - 30px);
    }

    .year-number {
      font-size: 28px;
    }

    .month-label {
      font-size: 10px;
    }

    .month-tick {
      height: 8px;
      top: -3px;
    }

    .nav-arrow-left {
      left: 12px;
    }

    .nav-arrow-right {
      right: 12px;
    }

    .nav-arrow svg {
      width: 24px;
      height: 24px;
    }
  }
</style>
