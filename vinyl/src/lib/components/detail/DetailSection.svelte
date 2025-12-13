<!--
  DetailSection.svelte
  
  Renders a single section of the detail panel based on config.
-->
<script lang="ts">
	import StatCard from './StatCard.svelte';
	import ArtistList from './ArtistList.svelte';
	import TrackList from './TrackList.svelte';
	import type { GenreData } from '$lib/types';
	import type { DetailPanelSection } from '$lib/types/config';
	import { formatNumber, formatHours, formatPercent } from '$lib/utils/formatters';

	/** Section configuration */
	export let config: DetailPanelSection;

	/** Genre data */
	export let data: GenreData;

	// Get value from data using dataKey
	function getValue(key: string): unknown {
		if (key.includes('.')) {
			// Handle nested paths like "stats.avgDuration"
			return key.split('.').reduce((obj: Record<string, unknown>, k) => {
				return obj?.[k] as Record<string, unknown>;
			}, data as unknown as Record<string, unknown>);
		}
		return data[key as keyof GenreData];
	}

	// Format value based on type
	function formatValue(value: unknown): string {
		if (value === undefined || value === null) return '–';

		if (typeof value === 'number') {
			// Auto-format based on dataKey
			if (config.dataKey === 'totalHours') return formatHours(value);
			if (config.dataKey === 'percentage') return formatPercent(value);
			return formatNumber(value);
		}
		return String(value);
	}

	$: value = getValue(config.dataKey as string);
	$: formattedValue = formatValue(value);
</script>

<div class="detail-section detail-section--{config.type}">
	{#if config.type === 'stat'}
		<StatCard
			label={config.label ?? ''}
			value={formattedValue}
			color={data.color}
		/>
	{:else if config.type === 'list'}
		{#if config.dataKey === 'topArtists'}
			<ArtistList
				title={config.label ?? 'Top Artists'}
				artists={data.topArtists}
				maxItems={5}
				color={data.color}
			/>
		{:else if config.dataKey === 'topTracks'}
			<TrackList
				title={config.label ?? 'Top Tracks'}
				tracks={data.topTracks}
				maxItems={5}
				color={data.color}
			/>
		{/if}
	{:else if config.type === 'chart'}
		<div class="chart-placeholder">
			<span>Chart: {config.label}</span>
		</div>
	{/if}
</div>

<style>
	.detail-section {
		width: 100%;
	}

	.section-header {
		font-size: 2rem;
		font-weight: 700;
		margin: 0;
		text-transform: capitalize;
		line-height: 1.2;
	}

	.stat-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
	}

	.progress-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.progress-label {
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.progress-bar {
		height: 8px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		border-radius: 4px;
		transition: width 0.5s ease-out;
	}

	.progress-value {
		font-size: 0.875rem;
		font-weight: 600;
		color: white;
	}
</style>
