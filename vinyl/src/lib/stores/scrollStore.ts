import { writable } from 'svelte/store';
import type { ScrollState } from '$lib/types';

const initialState: ScrollState & { scrollProgress: number } = {
	currentSection: 0,
	progress: 0,
	scrollProgress: 0, // Alias for progress
	direction: null
};

function createScrollStore() {
	const { subscribe, set, update } = writable<ScrollState>(initialState);

	return {
		subscribe,
		setSection: (section: number) => update((s) => ({ ...s, currentSection: section })),
		setProgress: (progress: number) => update((s) => ({ ...s, progress })),
		setDirection: (direction: 'up' | 'down' | null) => update((s) => ({ ...s, direction })),
		reset: () => set(initialState)
	};
}

export const scrollStore = createScrollStore();
