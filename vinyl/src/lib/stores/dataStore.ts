import { writable } from 'svelte/store';
import type { GenreData, DataState } from '$lib/types';

const initialState: DataState<GenreData[]> = {
	data: null,
	status: 'idle',
	error: null
};

function createDataStore() {
	const { subscribe, set, update } = writable<DataState<GenreData[]>>(initialState);

	return {
		subscribe,
		setLoading: () => update((s) => ({ ...s, status: 'loading', error: null })),
		setSuccess: (data: GenreData[]) => set({ data, status: 'success', error: null }),
		setError: (error: Error) => update((s) => ({ ...s, status: 'error', error })),
		reset: () => set(initialState)
	};
}

export const dataStore = createDataStore();
