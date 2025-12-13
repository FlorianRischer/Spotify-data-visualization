<!--
  DetailPanel.svelte
  
  Container for displaying genre details.
  Configurable sections with animations.
-->
<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { configStore } from '$lib/stores/configStore';
	import DetailSection from './DetailSection.svelte';
	import type { GenreData } from '$lib/types';

	/** Genre data to display */
	export let genre: GenreData | null = null;

	/** Whether the panel is visible */
	export let show: boolean = true;

	/** Position of the panel */
	export let position: 'right' | 'bottom' | 'overlay' = 'right';

	// Sort sections by order
	$: sortedSections = $configStore.sections
		.filter((s) => s.visible)
		.sort((a, b) => a.order - b.order);

	// Animation config based on position
	$: flyParams =
		position === 'right'
			? { x: 300, duration: 300 }
			: position === 'bottom'
				? { y: 200, duration: 300 }
				: { y: 20, duration: 200 };
</script>

{#if show && genre}
	<aside
		class="detail-panel detail-panel--{position}"
		transition:fly={flyParams}
		aria-label="Genre details"
	>
		<div class="detail-panel__content">
			{#each sortedSections as section (section.id)}
				<DetailSection config={section} data={genre} />
			{/each}
		</div>
	</aside>
{/if}

<style>
	.detail-panel {
		background: rgba(18, 18, 18, 0.95);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: white;
		overflow-y: auto;
		z-index: 100;
	}

	.detail-panel--right {
		position: fixed;
		top: 0;
		right: 0;
		width: 360px;
		height: 100vh;
		border-left: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0;
	}

	.detail-panel--bottom {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		max-height: 50vh;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 24px 24px 0 0;
	}

	.detail-panel--overlay {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 90%;
		max-width: 400px;
		max-height: 80vh;
		border-radius: 16px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
	}

	.detail-panel__content {
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	@media (max-width: 768px) {
		.detail-panel--right {
			width: 100%;
			height: auto;
			max-height: 60vh;
			top: auto;
			bottom: 0;
			border-radius: 24px 24px 0 0;
			border-left: none;
			border-top: 1px solid rgba(255, 255, 255, 0.1);
		}
	}
</style>
