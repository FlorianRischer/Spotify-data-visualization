<!--
  ScrollContainer.svelte
  
  Main scrollytelling container.
  Manages scroll position and section visibility.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { scrollStore } from '$lib/stores/scrollStore';

	/** Whether scrolling is enabled */
	export let enabled: boolean = true;

	/** Snap to sections */
	export let snapEnabled: boolean = false;

	let containerEl: HTMLDivElement;
	let scrollTimeout: ReturnType<typeof setTimeout>;

	function handleScroll() {
		if (!enabled || !containerEl) return;

		const scrollTop = containerEl.scrollTop;
		const scrollHeight = containerEl.scrollHeight - containerEl.clientHeight;
		const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;

		scrollStore.setProgress(progress);

		// Detect scroll direction
		clearTimeout(scrollTimeout);
		scrollTimeout = setTimeout(() => {
			scrollStore.setDirection(null);
		}, 150);
	}

	onMount(() => {
		if (containerEl) {
			containerEl.addEventListener('scroll', handleScroll, { passive: true });
		}
	});

	onDestroy(() => {
		if (containerEl) {
			containerEl.removeEventListener('scroll', handleScroll);
		}
		clearTimeout(scrollTimeout);
	});
</script>

<div
	bind:this={containerEl}
	class="scroll-container"
	class:snap-enabled={snapEnabled}
	role="main"
>
	<slot />
</div>

<style>
	.scroll-container {
		width: 100%;
		height: 100vh;
		overflow-y: auto;
		overflow-x: hidden;
		scroll-behavior: smooth;
	}

	.snap-enabled {
		scroll-snap-type: y mandatory;
	}

	/* Hide scrollbar but keep functionality */
	.scroll-container {
		scrollbar-width: thin;
		scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
	}

	.scroll-container::-webkit-scrollbar {
		width: 6px;
	}

	.scroll-container::-webkit-scrollbar-track {
		background: transparent;
	}

	.scroll-container::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.3);
		border-radius: 3px;
	}

	.scroll-container::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.5);
	}
</style>
