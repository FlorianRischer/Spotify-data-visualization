<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { cubicOut, cubicIn } from 'svelte/easing';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let visible = true;
  
  let isExiting = false;
  let scrollHintVisible = false;
  let exitProgress = 0; // 0 to 1 for smooth exit animation
  
  // Show scroll hint after a delay
  onMount(() => {
    const timer = setTimeout(() => {
      scrollHintVisible = true;
    }, 1500);
    
    // Listen for scroll/wheel events to trigger exit
    const handleScroll = (e: WheelEvent) => {
      if (visible && !isExiting && e.deltaY > 0) {
        triggerExit();
      }
    };
    
    // Touch support
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      const deltaY = touchStartY - e.touches[0].clientY;
      if (visible && !isExiting && deltaY > 50) {
        triggerExit();
      }
    };
    
    // Keyboard support
    const handleKeydown = (e: KeyboardEvent) => {
      if (visible && !isExiting) {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          triggerExit();
        }
      }
    };
    
    window.addEventListener('wheel', handleScroll, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('keydown', handleKeydown);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('wheel', handleScroll);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeydown);
    };
  });
  
  function triggerExit() {
    if (isExiting) return;
    isExiting = true;
    
    // Animate exit progress for smooth fade
    const duration = 800;
    const startTime = performance.now();
    
    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      exitProgress = Math.min(1, elapsed / duration);
      
      if (exitProgress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete - dispatch event
        dispatch('exit');
      }
    }
    
    requestAnimationFrame(animate);
  }
  
  // Compute styles based on exit progress
  $: titleTransform = `translateY(${-exitProgress * 60}px)`;
  $: titleOpacity = 1 - exitProgress;
  $: subtitleTransform = `translateY(${-exitProgress * 40}px)`;
  $: subtitleOpacity = 1 - exitProgress * 1.2; // Fades faster
  $: hintOpacity = Math.max(0, 1 - exitProgress * 2); // Fades first
</script>

{#if visible}
  <div 
    class="landing-hero"
    class:exiting={isExiting}
    style="opacity: {1 - exitProgress * 0.3};"
  >
    <div class="content">
      <!-- Main Title -->
      <h1 
        class="title"
        in:fly={{ y: 80, duration: 1000, delay: 200, easing: cubicOut }}
        style="transform: {titleTransform}; opacity: {titleOpacity};"
      >
        MUSICAL JOURNEY
      </h1>
      
      <!-- Subtitle -->
      <p 
        class="subtitle"
        in:fly={{ y: 40, duration: 800, delay: 500, easing: cubicOut }}
        style="transform: {subtitleTransform}; opacity: {subtitleOpacity};"
      >
        An Information Design Project by Florian Rischer
      </p>
    </div>
    
    <!-- Scroll Hint -->
    {#if scrollHintVisible}
      <div 
        class="scroll-hint"
        in:fade={{ duration: 600, delay: 0 }}
        style="opacity: {hintOpacity};"
      >
        <span class="hint-text">scroll to start exploring</span>
        <span class="hint-arrow">↓</span>
      </div>
    {/if}
  </div>
{/if}

<style>
  .landing-hero {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #FAF1EC;
    z-index: 9998; /* Below loading screen (9999), above everything else */
    transition: background-color 0.8s ease;
  }
  
  .landing-hero.exiting {
    pointer-events: none;
  }
  
  .content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 0 24px;
  }
  
  .title {
    font-family: 'Anton', sans-serif;
    font-size: clamp(48px, 12vw, 128px);
    font-weight: 400;
    color: #000000;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    line-height: 1;
    margin: 0;
    transition: transform 0.1s linear, opacity 0.1s linear;
    will-change: transform, opacity;
  }
  
  .subtitle {
    font-family: 'Baloo Bhai 2', 'Inter', sans-serif;
    font-size: clamp(14px, 2vw, 20px);
    font-weight: 400;
    color: #000000;
    margin: 32px 0 0 0;
    transition: transform 0.1s linear, opacity 0.1s linear;
    will-change: transform, opacity;
  }
  
  .scroll-hint {
    position: absolute;
    bottom: 80px;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    color: #000000;
    transition: opacity 0.1s linear;
    will-change: opacity;
    animation: gentle-bounce 2s ease-in-out infinite;
  }
  
  .hint-text {
    font-family: 'Baloo Bhai 2', 'Inter', sans-serif;
    font-size: 20px;
    font-weight: 400;
  }
  
  .hint-arrow {
    font-size: 16px;
    animation: arrow-bounce 1.5s ease-in-out infinite;
  }
  
  @keyframes gentle-bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(6px);
    }
  }
  
  @keyframes arrow-bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(4px);
    }
  }
  
  /* Responsive adjustments */
  @media (max-width: 1200px) {
    .subtitle {
      margin-top: 28px;
    }
    
    .scroll-hint {
      bottom: 70px;
    }
    
    .hint-text {
      font-size: 18px;
    }
  }

  @media (max-width: 900px) {
    .subtitle {
      margin-top: 26px;
    }
    
    .scroll-hint {
      bottom: 65px;
      gap: 6px;
    }
    
    .hint-text {
      font-size: 17px;
    }
    
    .hint-arrow {
      font-size: 14px;
    }
  }

  @media (max-width: 600px) {
    .content {
      padding: 0 20px;
    }
    
    .subtitle {
      margin-top: 24px;
    }
    
    .scroll-hint {
      bottom: 60px;
    }
    
    .hint-text {
      font-size: 16px;
    }
    
    .hint-arrow {
      font-size: 12px;
    }
  }
</style>
