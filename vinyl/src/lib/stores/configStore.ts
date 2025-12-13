import { writable } from 'svelte/store';
import type { DetailPanelConfig } from '$lib/types';

const defaultConfig: DetailPanelConfig = {
	sections: [
		{
			id: 'genre-name',
			label: 'Genre',
			type: 'stat',
			dataKey: 'name',
			visible: true,
			order: 0
		},
		{
			id: 'track-count',
			label: 'Tracks',
			type: 'stat',
			dataKey: 'trackCount',
			visible: true,
			order: 1
		},
		{
			id: 'total-hours',
			label: 'Hörzeit',
			type: 'stat',
			dataKey: 'totalHours',
			visible: true,
			order: 2
		},
		{
			id: 'top-artists',
			label: 'Top Artists',
			type: 'list',
			dataKey: 'topArtists',
			visible: true,
			order: 3
		},
		{
			id: 'top-tracks',
			label: 'Top Tracks',
			type: 'list',
			dataKey: 'topTracks',
			visible: true,
			order: 4
		}
	]
};

export const configStore = writable<DetailPanelConfig>(defaultConfig);
