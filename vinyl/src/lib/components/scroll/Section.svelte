<!--
  Section.svelte
  
  Individual scrollytelling section with intersection observer.
-->
<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { scrollStore } from '$lib/stores/scrollStore';
	import { intersect } from '$lib/actions';

	/** Unique identifier for this section */
	export let id: string;

	/** Section index (0-based) */
	export let index: number = 0;

	/** Minimum height of the section */
	export let minHeight: string = '100vh';

	/** Whether to snap to this section */
	export let snapAlign: 'start' | 'center' | 'end' | 'none' = 'start';

	/** Background color */
	export let background: string = 'transparent';

	const dispatch = createEventDispatcher<{
		enter: { id: string; index: number };
		leave: { id: string; index: number };
	}>();

	let isVisible = false;

	function handleEnter() {
		isVisible = true;
		scrollStore.setSection(index);
		dispatch('enter', { id, index });
	}

	function handleLeave() {
		isVisible = false;
		dispatch('leave', { id, index });
	}
</script>

<section
	{id}
	class="scroll-section"
	class:is-visible={isVisible}
	style="min-height: {minHeight}; background: {background}; scroll-snap-align: {snapAlign === 'none' ? 'unset' : snapAlign};"
	use:intersect={{
		onEnter: handleEnter,
		onLeave: handleLeave,
		threshold: 0.5
	}}
>
	<div class="section-content">
		<slot {isVisible} />
	</div>
</section>

<style>
	.scroll-section {
		position: relative;
		width: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

	.section-content {
		width: 100%;
		max-width: 1400px;
		margin: 0 auto;
		padding: 40px 24px;
	}

	@media (max-width: 768px) {
		.section-content {
			padding: 24px 16px;
		}
	}
</style>
