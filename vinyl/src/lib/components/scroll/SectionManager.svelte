<!--
  SectionManager.svelte
  
  Manages multiple sections and tracks which is active.
-->
<script lang="ts">
	import { scrollStore } from '$lib/stores/scrollStore';
	import Section from './Section.svelte';

	/** Section definitions */
	export let sections: Array<{
		id: string;
		minHeight?: string;
		background?: string;
	}> = [];

	/** Whether snap is enabled */
	export let snapEnabled: boolean = false;

	$: currentSection = $scrollStore.currentSection;
</script>

<div class="section-manager">
	{#each sections as section, index (section.id)}
		<Section
			id={section.id}
			{index}
			minHeight={section.minHeight ?? '100vh'}
			background={section.background ?? 'transparent'}
			snapAlign={snapEnabled ? 'start' : 'none'}
			on:enter
			on:leave
		>
			<slot {section} {index} isActive={currentSection === index} />
		</Section>
	{/each}
</div>

<style>
	.section-manager {
		width: 100%;
	}
</style>
