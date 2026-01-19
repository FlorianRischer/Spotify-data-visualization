// Search Store — manages search state for Overview mode
import { writable, derived } from "svelte/store";
import { getAllCategories, getGenresByCategory, getGenreCategory, type GenreCategory } from "$lib/graph/genreMapping";

export type SearchType = 'genre' | 'artist' | 'category';

export interface ArtistSearchData {
  artistId: string;
  name: string;
  genres: string[]; // genre IDs this artist is associated with
  totalMinutes?: number; // total listening time for this artist
  topSong?: string; // most listened song by this artist
  topSongMinutes?: number; // listening time for the top song
}

export interface SearchState {
  query: string;
  isSearchActive: boolean;
  isInputFocused: boolean; // True when search input is focused
  matchedNodeIds: Set<string>;
  matchedArtists: ArtistSearchData[]; // Artists that match the query
  matchedCategory: GenreCategory | null; // Category that matches the query
  searchType: SearchType; // What type of match was found
  centerPosition: { x: number; y: number }; // Position of search bar for physics
  isFocusMode: boolean; // True when search has been idle for 10 seconds
}

const initialState: SearchState = {
  query: "",
  isSearchActive: false,
  isInputFocused: false,
  matchedNodeIds: new Set(),
  matchedArtists: [],
  matchedCategory: null,
  searchType: 'genre',
  centerPosition: { x: 0, y: 0 },
  isFocusMode: false
};

export const searchStore = writable<SearchState>(initialState);

// Artist data storage (set once when graph loads)
let artistsData: ArtistSearchData[] = [];

/**
 * Sets the artist data for search (called when graph loads)
 */
export function setArtistsData(artists: ArtistSearchData[]) {
  artistsData = artists;
}

/**
 * Sets whether the search input is focused
 */
export function setSearchInputFocused(focused: boolean) {
  searchStore.update(s => ({ ...s, isInputFocused: focused }));
}

/**
 * Updates the search query and finds matching nodes (genres, artists, and categories)
 */
export function updateSearchQuery(query: string, nodes: Array<{ id: string; label: string }>) {
  const trimmedQuery = query.trim().toLowerCase();
  
  if (trimmedQuery.length === 0) {
    searchStore.update(state => ({
      ...state,
      query: "",
      isSearchActive: false,
      matchedNodeIds: new Set(),
      matchedArtists: [],
      matchedCategory: null,
      searchType: 'genre',
      isFocusMode: false
    }));
    return;
  }

  // Check for EXACT category matches only (case-insensitive)
  const allCategories = getAllCategories();
  let matchedCategory: GenreCategory | null = null;
  const categoryGenreIds = new Set<string>();
  
  for (const category of allCategories) {
    // Only match if the query is EXACTLY the category name (case-insensitive)
    if (category.toLowerCase() === trimmedQuery) {
      matchedCategory = category;
      // Get all genres in this category and find their node IDs
      const genresInCategory = getGenresByCategory(category);
      for (const node of nodes) {
        const nodeCategory = getGenreCategory(node.label);
        if (nodeCategory === category) {
          categoryGenreIds.add(node.id);
        }
      }
      break; // Use first match
    }
  }

  // Find matching genres (direct name match)
  const matchedGenreIds = new Set<string>();
  for (const node of nodes) {
    if (node.label.toLowerCase().includes(trimmedQuery)) {
      matchedGenreIds.add(node.id);
    }
  }

  // Find matching artists and their associated genres
  const matchedArtists: ArtistSearchData[] = [];
  const artistGenreIds = new Set<string>();
  
  for (const artist of artistsData) {
    if (artist.name.toLowerCase().includes(trimmedQuery)) {
      // Check if at least one of the artist's genres exists in nodes
      const hasVisibleGenre = artist.genres.some(genreId => nodes.some(n => n.id === genreId));
      
      if (hasVisibleGenre) {
        matchedArtists.push(artist);
        // Add all genres this artist is associated with (that exist in nodes)
        for (const genreId of artist.genres) {
          if (nodes.some(n => n.id === genreId)) {
            artistGenreIds.add(genreId);
          }
        }
      }
    }
  }

  // Determine search type and combine matches based on priority
  let searchType: SearchType = 'genre';
  let allMatchedIds: Set<string>;
  
  // Priority: Category > Artist > Genre (if category matches, show all category genres)
  if (matchedCategory && categoryGenreIds.size > 0) {
    searchType = 'category';
    allMatchedIds = categoryGenreIds;
  } else if (matchedArtists.length > 0 && matchedGenreIds.size === 0) {
    searchType = 'artist';
    allMatchedIds = artistGenreIds;
  } else if (matchedArtists.length > 0 && matchedGenreIds.size > 0) {
    // Both matched - prioritize artist if artist match is more specific
    searchType = matchedArtists.length <= matchedGenreIds.size ? 'artist' : 'genre';
    allMatchedIds = new Set([...matchedGenreIds, ...artistGenreIds]);
  } else {
    allMatchedIds = new Set([...matchedGenreIds, ...artistGenreIds]);
  }

  searchStore.update(state => ({
    ...state,
    query: trimmedQuery,
    isSearchActive: true,
    matchedNodeIds: allMatchedIds,
    matchedArtists,
    matchedCategory,
    searchType,
    isFocusMode: false // Reset focus mode when query changes
  }));
}

/**
 * Clears the search
 */
export function clearSearch() {
  searchStore.set(initialState);
}

/**
 * Sets focus mode (after 10 seconds of inactivity)
 */
export function setFocusMode(enabled: boolean) {
  searchStore.update(state => ({
    ...state,
    isFocusMode: enabled
  }));
}

/**
 * Updates the search bar center position for physics calculations
 */
export function setSearchBarPosition(x: number, y: number) {
  searchStore.update(state => ({
    ...state,
    centerPosition: { x, y }
  }));
}

/**
 * Derived store to check if a specific node matches the search
 */
export function isNodeMatched(nodeId: string): boolean {
  let matched = false;
  searchStore.subscribe(state => {
    matched = state.matchedNodeIds.has(nodeId);
  })();
  return matched;
}

/**
 * Gets a weighted random artist based on total minutes listened
 * Artists with more listening time have higher probability of being selected
 */
export function getRandomArtist(nodes: Array<{ id: string; label: string; totalMinutes?: number }>): ArtistSearchData | null {
  if (artistsData.length === 0) return null;
  
  // Filter artists that have totalMinutes data and sort by playtime
  const artistsWithPlaytime = artistsData.filter(a => (a.totalMinutes || 0) > 0);
  
  if (artistsWithPlaytime.length === 0) {
    // Fallback to random if no playtime data
    return artistsData[Math.floor(Math.random() * artistsData.length)];
  }
  
  // Weighted random selection based on totalMinutes
  const totalWeight = artistsWithPlaytime.reduce((sum, a) => sum + (a.totalMinutes || 0), 0);
  let random = Math.random() * totalWeight;
  
  for (const artist of artistsWithPlaytime) {
    random -= (artist.totalMinutes || 0);
    if (random <= 0) {
      return artist;
    }
  }
  
  return artistsWithPlaytime[artistsWithPlaytime.length - 1];
}

/**
 * Gets a weighted random genre - genres with higher playtime are more likely to be selected
 */
export function getRandomGenre(nodes: Array<{ id: string; label: string; totalMinutes?: number }>): { id: string; label: string } | null {
  if (nodes.length === 0) return null;
  
  // Calculate total playtime for weighting
  const totalPlaytime = nodes.reduce((sum, n) => sum + (n.totalMinutes || 1), 0);
  
  // Weighted random selection based on playtime
  let random = Math.random() * totalPlaytime;
  for (const node of nodes) {
    random -= (node.totalMinutes || 1);
    if (random <= 0) {
      return { id: node.id, label: node.label };
    }
  }
  
  // Fallback to last node (should rarely happen due to floating point)
  const lastNode = nodes[nodes.length - 1];
  return { id: lastNode.id, label: lastNode.label };
}

/**
 * Gets a completely random category that has at least one genre
 */
export function getRandomCategory(nodes: Array<{ id: string; label: string; totalMinutes?: number }>): GenreCategory | null {
  if (nodes.length === 0) return null;
  
  const allCategories = getAllCategories();
  
  // Filter categories that have at least one genre in the nodes
  const categoriesWithGenres = allCategories.filter(cat => 
    nodes.some(n => getGenreCategory(n.label) === cat)
  );
  
  if (categoriesWithGenres.length === 0) return null;
  
  // Pure random selection
  const randomIndex = Math.floor(Math.random() * categoriesWithGenres.length);
  return categoriesWithGenres[randomIndex];
}

// Keep old functions as aliases for backwards compatibility
export const getWeightedRandomArtist = getRandomArtist;
export const getWeightedRandomGenre = getRandomGenre;
export const getWeightedRandomCategory = getRandomCategory;
