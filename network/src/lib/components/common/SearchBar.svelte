<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
  import { searchStore, updateSearchQuery, clearSearch, setSearchBarPosition, setFocusMode, setSearchInputFocused, getWeightedRandomArtist, getWeightedRandomGenre, getWeightedRandomCategory } from '$lib/stores/searchStore';
  import { scrollyStore } from '$lib/stores/scrollyStore';
  import { uiStore } from '$lib/stores/uiStore';
  import { graphData } from '$lib/stores/graphStore';
  import { get } from 'svelte/store';
  import type { GenreCategory } from '$lib/graph/genreMapping';

  let searchInput: HTMLInputElement;
  let inputValue = '';
  let isVisible = false;
  
  // Suggestion state
  let suggestedArtist: string = '';
  let suggestedGenre: string = '';
  let suggestedCategory: GenreCategory | null = null;
  
  // Subscribe to focus mode state
  $: isFocusMode = $searchStore.isFocusMode;
  $: hasMatches = $searchStore.matchedNodeIds.size > 0;
  $: searchType = $searchStore.searchType;
  $: matchedCategory = $searchStore.matchedCategory;
  
  // Show suggestions only when not in focus mode and no input
  $: showSuggestions = isVisible && !isFocusMode && inputValue.length === 0;

  // Reactive subscription to scrolly store and uiStore for overview mode
  // SearchBar only visible in MANUAL explore mode (button click)
  $: isExploreMode = $uiStore.isOverviewModeManual;
  $: {
    if (isExploreMode && !isVisible) {
      isVisible = true;
      // Update position for physics - center of screen
      setSearchBarPosition(0, 0);
      // Generate initial suggestions
      generateSuggestions();
    } else if (!isExploreMode && isVisible) {
      isVisible = false;
      inputValue = '';
      clearSearch();
    }
  }
  
  function generateSuggestions() {
    const graph = get(graphData);
    const nodes = graph?.nodes || [];
    
    // Get weighted random artist
    const artist = getWeightedRandomArtist(nodes);
    suggestedArtist = artist?.name || '';
    
    // Get weighted random genre
    const genre = getWeightedRandomGenre(nodes);
    suggestedGenre = genre?.label || '';
    
    // Get weighted random category
    suggestedCategory = getWeightedRandomCategory(nodes);
  }
  
  function handleSuggestionClick(suggestion: string) {
    inputValue = suggestion;
    const graph = get(graphData);
    const nodes = graph?.nodes || [];
    updateSearchQuery(suggestion, nodes.map(n => ({ id: n.id, label: n.label })));
    setFocusMode(true);
  }
  
  function refreshSuggestions() {
    generateSuggestions();
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
    generateSuggestions(); // Refresh suggestions when clearing
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
  <div class="search-container" class:focus-mode={isFocusMode && hasMatches} transition:fade={{ duration: 400 }}>
    <div class="search-wrapper">
      <input
        bind:this={searchInput}
        type="text"
        class="search-input"
        placeholder="search genres, artists or categories..."
        value={inputValue}
        on:input={handleInput}
        on:keydown={handleKeyDown}
        on:focus={() => setSearchInputFocused(true)}
        on:blur={() => setSearchInputFocused(false)}
      />
      {#if inputValue.length > 0}
        <button class="clear-btn" on:click={handleClear} aria-label="Clear">×</button>
      {/if}
    </div>
    
    {#if showSuggestions}
      <div class="suggestions" transition:fade={{ duration: 300 }}>
        {#if suggestedCategory}
          <button 
            class="suggestion-btn" 
            on:click={() => handleSuggestionClick(suggestedCategory || '')}
          >
            <span class="suggestion-label">Category</span>
            <span class="suggestion-value">{suggestedCategory}</span>
          </button>
        {/if}
        {#if suggestedArtist}
          <button 
            class="suggestion-btn" 
            on:click={() => handleSuggestionClick(suggestedArtist)}
          >
            <span class="suggestion-label">Artist</span>
            <span class="suggestion-value">{suggestedArtist}</span>
          </button>
        {/if}
        {#if suggestedGenre}
          <button 
            class="suggestion-btn" 
            on:click={() => handleSuggestionClick(suggestedGenre)}
          >
            <span class="suggestion-label">Genre</span>
            <span class="suggestion-value">{suggestedGenre}</span>
          </button>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .search-container {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 20;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    transition: top 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .search-container.focus-mode {
    top: 75%;
  }

  .search-wrapper {
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
    width: 280px;
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
  
  .suggestions {
    display: flex;
    gap: 12px;
    justify-content: center;
  }
  
  .suggestion-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 16px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.25);
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 100px;
    max-width: 160px;
  }
  
  .suggestion-btn:hover {
    background: rgba(255, 255, 255, 0.35);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
  
  .suggestion-label {
    font-family: 'Inter', sans-serif;
    font-size: 10px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.4);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .suggestion-value {
    font-family: 'Baloo Bhai 2', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.7);
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 140px;
  }

  @media (max-width: 1200px) {
    .search-wrapper {
      padding: 8px 18px;
    }
    
    .search-input {
      width: 260px;
    }
    
    .suggestion-btn {
      padding: 7px 14px;
      min-width: 90px;
      max-width: 150px;
    }
    
    .suggestion-value {
      font-size: 12px;
      max-width: 130px;
    }
  }

  @media (max-width: 900px) {
    .search-wrapper {
      padding: 8px 16px;
      gap: 6px;
    }
    
    .search-input {
      font-size: 15px;
      width: 220px;
    }
    
    .suggestions {
      gap: 10px;
    }
    
    .suggestion-btn {
      padding: 6px 12px;
      min-width: 80px;
      max-width: 140px;
    }
    
    .suggestion-label {
      font-size: 9px;
    }
    
    .suggestion-value {
      font-size: 12px;
      max-width: 120px;
    }
  }

  @media (max-width: 600px) {
    .search-wrapper {
      padding: 10px 20px;
    }
    
    .search-input {
      font-size: 16px;
      width: 180px;
    }
    
    .suggestions {
      flex-direction: column;
      gap: 8px;
    }
    
    .suggestion-btn {
      min-width: 140px;
    }
  }
</style>
