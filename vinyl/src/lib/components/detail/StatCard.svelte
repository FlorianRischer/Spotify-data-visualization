<!--
  StatCard.svelte
  
  Displays a single statistic with label, value, and optional icon.
-->
<script lang="ts">
	import { fade } from 'svelte/transition';

	/** Label for the stat */
	export let label: string;

	/** Formatted value to display */
	export let value: string;

	/** Optional emoji or icon */
	export let icon: string | undefined = undefined;

	/** Accent color */
	export let color: string = '#1DB954';

	/** Size variant */
	export let size: 'small' | 'medium' | 'large' = 'medium';
</script>

<div class="stat-card stat-card--{size}" transition:fade={{ duration: 200 }}>
	{#if icon}
		<span class="stat-icon">{icon}</span>
	{/if}
	<div class="stat-content">
		<span class="stat-label">{label}</span>
		<span class="stat-value" style="color: {color}">{value}</span>
	</div>
</div>

<style>
	.stat-card {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		transition: all 0.2s ease;
	}

	.stat-card:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.12);
	}

	.stat-card--small {
		padding: 12px;
	}

	.stat-card--large {
		padding: 20px;
	}

	.stat-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.stat-card--small .stat-icon {
		font-size: 1.25rem;
	}

	.stat-card--large .stat-icon {
		font-size: 2rem;
	}

	.stat-content {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}

	.stat-label {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.6);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		line-height: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.stat-card--small .stat-value {
		font-size: 1.25rem;
	}

	.stat-card--large .stat-value {
		font-size: 2rem;
	}
</style>
