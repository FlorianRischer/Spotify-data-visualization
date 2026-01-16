<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { scrollyStore } from '$lib/stores/scrollyStore';
  import { isStartAnimationRunning } from '$lib/stores/uiStore';
  import { fade, fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import type { GenreCategory } from '$lib/graph/genreMapping';
  
  // Bestimmt die Navigationsrichtung basierend auf Position im Kreis
  type NavigationDirection = 'right-down' | 'left-down' | 'left-up' | 'right-up';
  
  function getNavigationDirectionForIndex(index: number, queue: GenreCategory[]): NavigationDirection {
    if (queue.length === 0 || index < 0) return 'right-down';
    
    const totalCategories = queue.length;
    const positionPercent = index / totalCategories;
    
    if (positionPercent >= 0.75) return 'right-up';
    if (positionPercent >= 0.5) return 'left-up';
    if (positionPercent >= 0.25) return 'left-down';
    return 'right-down';
  }
  
  // Gibt die Pfeile für die aktuelle Richtung zurück
  function getArrowsForDirection(direction: NavigationDirection): { primary: string; secondary: string } {
    switch (direction) {
      case 'right-down': return { primary: '→', secondary: '↓' };
      case 'left-down': return { primary: '←', secondary: '↓' };
      case 'left-up': return { primary: '←', secondary: '↑' };
      case 'right-up': return { primary: '→', secondary: '↑' };
    }
  }
  
  $: phase = $scrollyStore.phase;
  $: focusedCategoryIndex = $scrollyStore.focusedCategoryIndex;
  $: genreGroupQueue = $scrollyStore.genreGroupQueue;
  $: animationRunning = $isStartAnimationRunning;
  
  // Berechne nächste Richtung
  $: nextIndex = phase === 'categorization' || phase === 'intro' ? 0 : focusedCategoryIndex + 1;
  $: direction = getNavigationDirectionForIndex(nextIndex, genreGroupQueue);
  $: arrows = getArrowsForDirection(direction);
  
  // Verstecke nach 5 Sekunden oder sobald eine Pfeiltaste gedrückt wird
  let hasBeenDismissed = false;
  let visible = false;
  let hideTimeout: ReturnType<typeof setTimeout> | null = null;
  let wasAnimationRunning = true;
  
  function dismiss() {
    visible = false;
    hasBeenDismissed = true;
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
  }
  
  function handleKeyDown(event: KeyboardEvent) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      dismiss();
    }
  }
  
  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
  });
  
  onDestroy(() => {
    window.removeEventListener('keydown', handleKeyDown);
    if (hideTimeout) clearTimeout(hideTimeout);
  });
  
  // Watch für Animation Ende - zeige Hinweis wenn Aufbau-Animation fertig ist
  $: {
    // Wenn Animation gerade von true auf false wechselt (Animation fertig)
    if (wasAnimationRunning && !animationRunning && !hasBeenDismissed) {
      // Verzögerung bevor der Hinweis erscheint (2 Sekunden)
      setTimeout(() => {
        if (!hasBeenDismissed) {
          visible = true;
          // Starte Timer für automatisches Ausblenden nach 8 Sekunden
          if (hideTimeout) clearTimeout(hideTimeout);
          hideTimeout = setTimeout(() => {
            dismiss();
          }, 8000);
        }
      }, 35000);
    }
    wasAnimationRunning = animationRunning;
  }
</script>

{#if visible}
  <div 
    class="navigation-hint" 
    in:fly={{ y: 20, duration: 400, easing: cubicOut, delay: 300 }}
    out:fade={{ duration: 300 }}
  >
    <div class="hint-content">
      <span class="hint-text">Use arrow keys to navigate</span>
    </div>
  </div>
{/if}

<style>
  .navigation-hint {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 90;
    pointer-events: none;
  }
  
  .hint-content {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    padding: 12px 20px;
    border-radius: 30px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .hint-text {
    font-family: 'Baloo Bhai 2', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
    letter-spacing: 0.3px;
  }
  
  @media (max-width: 768px) {
    .hint-content {
      padding: 10px 16px;
      gap: 6px;
    }
    
    .hint-text {
      font-size: 12px;
    }
  }
</style>
