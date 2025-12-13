<!--
  Icon.svelte
  
  Wrapper for icons (emoji, SVG, or icon font).
-->
<script lang="ts">
	/** Icon content (emoji or text) */
	export let icon: string = '';

	/** Size of the icon */
	export let size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';

	/** Custom color */
	export let color: string | undefined = undefined;

	/** Accessible label */
	export let label: string = '';

	const sizeMap = {
		xs: '0.75rem',
		sm: '1rem',
		md: '1.5rem',
		lg: '2rem',
		xl: '3rem'
	};
</script>

<span
	class="icon icon--{size}"
	style="font-size: {sizeMap[size]}; {color ? `color: ${color}` : ''}"
	role={label ? 'img' : 'presentation'}
	aria-label={label || undefined}
	aria-hidden={!label}
>
	{#if $$slots.default}
		<slot />
	{:else}
		{icon}
	{/if}
</span>

<style>
	.icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
		vertical-align: middle;
	}

	.icon :global(svg) {
		width: 1em;
		height: 1em;
		fill: currentColor;
	}
</style>
