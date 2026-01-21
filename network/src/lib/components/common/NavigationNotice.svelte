<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
  import { isStartAnimationRunning } from '$lib/stores/uiStore';
  import { get } from 'svelte/store';
  
  let visible = false;
  let hasNavigated = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let animationWasRunning = true;
  let mounted = false;
  
  // Only count arrow key navigation
  function handleKeydown(e: KeyboardEvent) {
    if (!mounted) return;
    // Only arrow keys count as navigation
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      if (!hasNavigated) {
        hasNavigated = true;
        visible = false;
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      }
    }
  }
  
  function startNoticeTimer() {
    if (hasNavigated || timeoutId) return;
    
    timeoutId = setTimeout(() => {
      if (!hasNavigated) {
        visible = true;
        // Auto-hide after 8 seconds
        setTimeout(() => {
          visible = false;
        }, 8000);
      }
    }, 15000); // 15 seconds after animation ends
  }
  
  onMount(() => {
    // Delay to ignore initial interactions
    setTimeout(() => {
      mounted = true;
      window.addEventListener('keydown', handleKeydown);
    }, 2000);
    
    animationWasRunning = get(isStartAnimationRunning);
    
    const unsubscribe = isStartAnimationRunning.subscribe((isRunning) => {
      if (animationWasRunning && !isRunning && !hasNavigated) {
        startNoticeTimer();
      }
      animationWasRunning = isRunning;
    });
    
    return () => unsubscribe();
  });
  
  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown);
    if (timeoutId) clearTimeout(timeoutId);
  });
</script>

{#if visible}
  <div class="navigation-notice" transition:fade={{ duration: 400 }}>
    <div class="arrow-icons">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M18 15L12 9L6 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <span class="notice-text">use arrow keys to navigate</span>
  </div>
{/if}

<style>
  
  
  .navigation-notice {
    position: fixed;
    bottom: 50%;
    left: 50%;
    transform: translate(-50%, 50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    z-index: 1000;
    pointer-events: none;
  }
  
  .arrow-icons {
    display: flex;
    gap: 4px;
    color: rgba(140, 135, 130, 0.6);
  }
  
  .arrow-icons svg {
    width: 24px;
    height: 24px;
  }
  
  .notice-text {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 14px;
    font-weight: 400;
    color: rgba(140, 135, 130, 0.6);
    letter-spacing: 0.02em;
  }
</style>
