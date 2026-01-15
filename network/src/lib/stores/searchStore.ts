// Search Store — manages search state for Overview mode
import { writable, derived } from "svelte/store";

export type SearchType = 'genre' | 'artist';

export interface ArtistSearchData {
  artistId: string;
  name: string;
  genres: string[]; // genre IDs this artist is associated with
}

export interface SearchState {
  query: string;
  isSearchActive: boolean;
  matchedNodeIds: Set<string>;
  matchedArtists: ArtistSearchData[]; // Artists that match the query
  searchType: SearchType; // What type of match was found
  centerPosition: { x: number; y: number }; // Position of search bar for physics
  isFocusMode: boolean; // True when search has been idle for 10 seconds
}

const initialState: SearchState = {
  query: "",
  isSearchActive: false,
  matchedNodeIds: new Set(),
  matchedArtists: [],
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
 * Updates the search query and finds matching nodes (genres and artists)
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
      searchType: 'genre',
      isFocusMode: false
    }));
    return;
  }

  // Find matching genres
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
      matchedArtists.push(artist);
      // Add all genres this artist is associated with
      for (const genreId of artist.genres) {
        // Only add if the genre exists in nodes
        if (nodes.some(n => n.id === genreId)) {
          artistGenreIds.add(genreId);
        }
      }
    }
  }

  // Combine genre matches and artist-genre matches
  const allMatchedIds = new Set([...matchedGenreIds, ...artistGenreIds]);
  
  // Determine search type based on what matched
  let searchType: SearchType = 'genre';
  if (matchedArtists.length > 0 && matchedGenreIds.size === 0) {
    searchType = 'artist';
  } else if (matchedArtists.length > 0 && matchedGenreIds.size > 0) {
    // Both matched - prioritize artist if artist match is more specific
    searchType = matchedArtists.length <= matchedGenreIds.size ? 'artist' : 'genre';
  }

  searchStore.update(state => ({
    ...state,
    query: trimmedQuery,
    isSearchActive: true,
    matchedNodeIds: allMatchedIds,
    matchedArtists,
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
export function getWeightedRandomArtist(nodes: Array<{ id: string; label: string; totalMinutes?: number }>): ArtistSearchData | null {
  if (artistsData.length === 0) return null;
  
  // Build a map of genre -> totalMinutes
  const genreMinutes = new Map<string, number>();
  for (const node of nodes) {
    genreMinutes.set(node.id, node.totalMinutes || 0);
  }
  
  // Calculate weight for each artist based on their associated genres' minutes
  const artistWeights: { artist: ArtistSearchData; weight: number }[] = [];
  
  for (const artist of artistsData) {
    let weight = 0;
    for (const genreId of artist.genres) {
      weight += genreMinutes.get(genreId) || 0;
    }
    if (weight > 0) {
      artistWeights.push({ artist, weight });
    }
  }
  
  if (artistWeights.length === 0) return null;
  
  // Weighted random selection
  const totalWeight = artistWeights.reduce((sum, aw) => sum + aw.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const { artist, weight } of artistWeights) {
    random -= weight;
    if (random <= 0) {
      return artist;
    }
  }
  
  return artistWeights[artistWeights.length - 1].artist;
}

/**
 * Gets a weighted random genre based on total minutes listened
 * Genres with more listening time have higher probability of being selected
 */
export function getWeightedRandomGenre(nodes: Array<{ id: string; label: string; totalMinutes?: number }>): { id: string; label: string } | null {
  if (nodes.length === 0) return null;
  
  // Filter nodes with valid minutes
  const weightedNodes = nodes.filter(n => (n.totalMinutes || 0) > 0);
  if (weightedNodes.length === 0) return nodes[Math.floor(Math.random() * nodes.length)];
  
  // Weighted random selection
  const totalWeight = weightedNodes.reduce((sum, n) => sum + (n.totalMinutes || 0), 0);
  let random = Math.random() * totalWeight;
  
  for (const node of weightedNodes) {
    random -= (node.totalMinutes || 0);
    if (random <= 0) {
      return { id: node.id, label: node.label };
    }
  }
  
  return weightedNodes[weightedNodes.length - 1];
}
