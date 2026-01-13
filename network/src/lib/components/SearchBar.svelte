<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
  import { searchStore, updateSearchQuery, clearSearch, setSearchBarPosition, setFocusMode } from '$lib/stores/searchStore';
  import { scrollyStore } from '$lib/stores/scrollyStore';
  import { uiStore } from '$lib/stores/uiStore';
  import { graphData } from '$lib/stores/graphStore';
  import { get } from 'svelte/store';

  let searchInput: HTMLInputElement;
  let inputValue = '';
  let isVisible = false;
  
  // Subscribe to focus mode state
  $: isFocusMode = $searchStore.isFocusMode;
  $: hasMatches = $searchStore.matchedNodeIds.size > 0;

  // Reactive subscription to scrolly store and uiStore for overview mode
  // Overview can be triggered by scroll OR manual button
  $: isOverviewMode = $scrollyStore.phase === 'overview' || $scrollyStore.isInOverview || $uiStore.isOverviewModeManual;
  $: {
    if (isOverviewMode && !isVisible) {
      isVisible = true;
      // Update position for physics - center of screen
      setSearchBarPosition(0, 0);
    } else if (!isOverviewMode && isVisible) {
      isVisible = false;
      inputValue = '';
      clearSearch();
    }
  }

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    inputValue = target.value;
    
    const graph = get(graphData);
    const nodes = graph?.nodes || [];
    
    updateSearchQuery(inputValue, nodes.map(n => ({ id: n.id, label: n.label })));
    
    // Reset focus mode when typing
    if ($searchStore.isFocusMode) {
      setFocusMode(false);
    }
  }

  function handleClear() {
    inputValue = '';
    clearSearch();
    setFocusMode(false);
    if (searchInput) {
      searchInput.focus();
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleClear();
    } else if (event.key === 'Enter') {
      // Activate focus mode when Enter is pressed and there are matches
      const state = get(searchStore);
      if (state.matchedNodeIds.size > 0) {
        setFocusMode(true);
        // Blur input to hide keyboard on mobile
        searchInput?.blur();
      }
    }
  }
</script>

{#if isVisible}
  <div class="search-wrapper" class:focus-mode={isFocusMode && hasMatches} transition:fade={{ duration: 400 }}>
    <input
      bind:this={searchInput}
      type="text"
      class="search-input"
      placeholder="search..."
      value={inputValue}
      on:input={handleInput}
      on:keydown={handleKeyDown}
    />
    {#if inputValue.length > 0}
      <button class="clear-btn" on:click={handleClear} aria-label="Clear">×</button>
    {/if}
  </div>
{/if}

<style>
  .search-wrapper {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 20px;
    border-radius: 30px;
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.3);
    transition: top 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .search-wrapper.focus-mode {
    top: 75%;
  }

  .search-input {
    background: transparent;
    border: none;
    font-family: 'Baloo Bhai 2', sans-serif;
    font-size: 16px;
    font-weight: 400;
    color: rgba(0, 0, 0, 0.7);
    outline: none;
    padding: 2px 8px;
    width: 200px;
    text-align: center;
  }

  .search-input::placeholder {
    color: rgba(0, 0, 0, 0.35);
  }

  .search-input:focus {
    color: rgba(0, 0, 0, 0.9);
  }

  .clear-btn {
    background: none;
    border: none;
    font-size: 20px;
    color: rgba(0, 0, 0, 0.4);
    cursor: pointer;
    padding: 0;
    line-height: 1;
    transition: color 0.2s ease;
  }

  .clear-btn:hover {
    color: rgba(0, 0, 0, 0.7);
  }

  @media (max-width: 600px) {
    .search-wrapper {
      padding: 10px 20px;
    }
    
    .search-input {
      font-size: 16px;
      width: 180px;
    }
  }
</style>
