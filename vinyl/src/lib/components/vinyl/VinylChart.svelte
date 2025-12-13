<!--
  VinylChart.svelte
  
  Main container component for the 3D vinyl visualization.
  Wraps the Threlte canvas and handles data binding.
-->
<script lang="ts">
	import { Canvas } from '@threlte/core';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import VinylScene from './VinylScene.svelte';
	import type { GenreData } from '$lib/types';

	/** Genre data for pie segments */
	export let genres: GenreData[] = [];

	/** Current rotation in degrees */
	export let rotation: number = 0;

	/** Called when rotation changes */
	export let onRotationChange: ((rotation: number) => void) | undefined = undefined;

	/** Called when a genre is selected */
	export let onGenreSelect: ((genreId: string) => void) | undefined = undefined;

	/** Whether drag interaction is enabled */
	export let interactive: boolean = true;

	/** Size of the canvas */
	export let size: 'small' | 'medium' | 'large' | 'full' = 'large';

	let containerEl: HTMLDivElement;
	let isClient = false;

	onMount(() => {
		isClient = true;
	});

	// Size mappings
	const sizeMap = {
		small: 'w-64 h-64',
		medium: 'w-96 h-96',
		large: 'w-[500px] h-[500px]',
		full: 'w-full h-full min-h-[400px]'
	};

	function handleRotationChange(newRotation: number) {
		rotation = newRotation;
		onRotationChange?.(newRotation);
	}

	function handleGenreSelect(genreId: string) {
		onGenreSelect?.(genreId);
	}
</script>

<div
	bind:this={containerEl}
	class="vinyl-chart relative {sizeMap[size]}"
	role="img"
	aria-label="Interactive vinyl record showing music genre distribution"
>
	{#if browser && isClient}
		<Canvas>
			<VinylScene
				{genres}
				{rotation}
				{interactive}
				on:rotationChange={(e) => handleRotationChange(e.detail)}
				on:genreSelect={(e) => handleGenreSelect(e.detail)}
			/>
		</Canvas>
	{:else}
		<!-- Loading placeholder -->
		<div class="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-full">
			<div class="animate-spin w-12 h-12 border-4 border-gray-700 border-t-green-500 rounded-full"></div>
		</div>
	{/if}
</div>

<style>
	.vinyl-chart {
		/* Ensure canvas fills container */
		:global(canvas) {
			width: 100% !important;
			height: 100% !important;
		}
	}
</style>
