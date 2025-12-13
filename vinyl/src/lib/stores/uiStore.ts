import { writable, derived } from 'svelte/store';
import type { UIState } from '$lib/types';

const initialState: UIState = {
	vinylRotation: 0,
	activeGenreId: null,
	isDragging: false,
	isSnapping: false
};

function createUIStore() {
	const { subscribe, set, update } = writable<UIState>(initialState);

	return {
		subscribe,
		setRotation: (rotation: number) => update((s) => ({ ...s, vinylRotation: rotation })),
		setActiveGenre: (id: string | null) => update((s) => ({ ...s, activeGenreId: id })),
		startDrag: () => update((s) => ({ ...s, isDragging: true })),
		endDrag: () => update((s) => ({ ...s, isDragging: false })),
		startSnap: () => update((s) => ({ ...s, isSnapping: true })),
		endSnap: () => update((s) => ({ ...s, isSnapping: false })),
		reset: () => set(initialState)
	};
}

export const uiStore = createUIStore();

// Derived Stores
export const isInteracting = derived(uiStore, ($ui) => $ui.isDragging || $ui.isSnapping);
