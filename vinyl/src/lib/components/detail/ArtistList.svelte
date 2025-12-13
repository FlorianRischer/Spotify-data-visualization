<!--
  ArtistList.svelte
  
  Displays a list of top artists for a genre.
-->
<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { TopArtist } from '$lib/types';
	import { formatNumber, formatHours } from '$lib/utils/formatters';

	/** Section title */
	export let title: string = 'Top Artists';

	/** List of artists to display */
	export let artists: TopArtist[] = [];

	/** Maximum items to show */
	export let maxItems: number = 5;

	/** Accent color */
	export let color: string = '#1DB954';

	$: displayedArtists = artists.slice(0, maxItems);
</script>

<div class="artist-list">
	<h3 class="list-title">{title}</h3>

	{#if displayedArtists.length > 0}
		<ol class="list">
			{#each displayedArtists as artist, i (artist.name)}
				<li class="list-item" transition:slide={{ duration: 200, delay: i * 50 }}>
					<span class="rank" style="color: {color}">{i + 1}</span>
					<div class="artist-info">
						<span class="artist-name">{artist.name}</span>
						<span class="artist-stats">
							{formatNumber(artist.playCount)} plays · {formatHours(artist.totalHours)}
						</span>
					</div>
				</li>
			{/each}
		</ol>
	{:else}
		<p class="empty-state">No artist data available</p>
	{/if}
</div>

<style>
	.artist-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.list-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.7);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0;
	}

	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.list-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 12px;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 8px;
		transition: background 0.2s ease;
	}

	.list-item:hover {
		background: rgba(255, 255, 255, 0.08);
	}

	.rank {
		font-size: 1rem;
		font-weight: 700;
		width: 24px;
		text-align: center;
		flex-shrink: 0;
	}

	.artist-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.artist-name {
		font-size: 0.9375rem;
		font-weight: 500;
		color: white;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.artist-stats {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.empty-state {
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.4);
		text-align: center;
		padding: 20px;
		margin: 0;
	}
</style>
