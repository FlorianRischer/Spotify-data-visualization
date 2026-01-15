<script lang="ts">
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  export let href: string | null = null;
  export let title: string;
  export let description: string;
  export let comingSoon = false;
  export let delay = 0;

  // Icon slot wird verwendet
</script>

{#if href && !comingSoon}
  <a 
    {href}
    class="vis-card"
    in:fly={{ y: 50, duration: 600, delay, easing: cubicOut }}
  >
    <div class="card-icon">
      <slot name="icon" />
    </div>
    <div class="card-content">
      <h3 class="card-title">{title}</h3>
      <p class="card-description">{description}</p>
    </div>
    <div class="card-arrow">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </div>
  </a>
{:else}
  <div 
    class="vis-card coming-soon"
    in:fly={{ y: 50, duration: 600, delay, easing: cubicOut }}
  >
    <div class="card-icon">
      <slot name="icon" />
    </div>
    <div class="card-content">
      <h3 class="card-title">{title}</h3>
      <p class="card-description">{description}</p>
      {#if comingSoon}
        <span class="coming-soon-badge">Coming Soon</span>
      {/if}
    </div>
  </div>
{/if}

<style>
  .vis-card {
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 16px;
    padding: 32px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    text-decoration: none;
    color: inherit;
    transition: all 0.3s ease;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .vis-card:not(.coming-soon):hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    border-color: rgba(0, 0, 0, 0.15);
  }

  .vis-card:not(.coming-soon):hover .card-arrow {
    transform: translateX(4px);
    opacity: 1;
  }

  .vis-card.coming-soon {
    cursor: default;
    opacity: 0.7;
  }

  .card-icon {
    width: 80px;
    height: 80px;
    color: #1a1a1a;
  }

  .card-icon :global(svg) {
    width: 100%;
    height: 100%;
  }

  .card-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }

  .card-title {
    font-family: 'Anton', sans-serif;
    font-size: 24px;
    font-weight: 400;
    color: #1a1a1a;
    text-transform: uppercase;
    margin: 0;
  }

  .card-description {
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: #666;
    line-height: 1.6;
    margin: 0;
  }

  .card-arrow {
    position: absolute;
    right: 32px;
    top: 50%;
    transform: translateY(-50%);
    width: 24px;
    height: 24px;
    color: #1a1a1a;
    opacity: 0.5;
    transition: all 0.3s ease;
  }

  .coming-soon-badge {
    display: inline-block;
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #888;
    background: rgba(0, 0, 0, 0.05);
    padding: 4px 12px;
    border-radius: 100px;
    margin-top: 8px;
    width: fit-content;
  }

  @media (max-width: 768px) {
    .card-arrow {
      display: none;
    }
  }
</style>
