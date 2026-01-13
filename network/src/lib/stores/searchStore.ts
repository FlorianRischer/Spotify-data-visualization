// Search Store — manages search state for Overview mode
import { writable, derived } from "svelte/store";

export interface SearchState {
  query: string;
  isSearchActive: boolean;
  matchedNodeIds: Set<string>;
  centerPosition: { x: number; y: number }; // Position of search bar for physics
  isFocusMode: boolean; // True when search has been idle for 10 seconds
}

const initialState: SearchState = {
  query: "",
  isSearchActive: false,
  matchedNodeIds: new Set(),
  centerPosition: { x: 0, y: 0 },
  isFocusMode: false
};

export const searchStore = writable<SearchState>(initialState);

/**
 * Updates the search query and finds matching nodes
 */
export function updateSearchQuery(query: string, nodes: Array<{ id: string; label: string }>) {
  const trimmedQuery = query.trim().toLowerCase();
  
  if (trimmedQuery.length === 0) {
    searchStore.update(state => ({
      ...state,
      query: "",
      isSearchActive: false,
      matchedNodeIds: new Set(),
      isFocusMode: false
    }));
    return;
  }

  // Find matching nodes - match if label contains query
  const matchedIds = new Set<string>();
  for (const node of nodes) {
    if (node.label.toLowerCase().includes(trimmedQuery)) {
      matchedIds.add(node.id);
    }
  }

  searchStore.update(state => ({
    ...state,
    query: trimmedQuery,
    isSearchActive: true,
    matchedNodeIds: matchedIds,
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
