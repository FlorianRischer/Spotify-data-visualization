<!--
  AnimatedNumber.svelte
  
  Displays a number with tweening animation.
-->
<script lang="ts">
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { formatNumber } from '$lib/utils/formatters';

	/** Target value */
	export let value: number = 0;

	/** Duration of animation in ms */
	export let duration: number = 400;

	/** Number of decimal places */
	export let decimals: number = 0;

	/** Format function override */
	export let format: ((n: number) => string) | undefined = undefined;

	/** Prefix string */
	export let prefix: string = '';

	/** Suffix string */
	export let suffix: string = '';

	const displayValue = tweened(0, {
		duration,
		easing: cubicOut
	});

	$: displayValue.set(value);

	function formatDisplay(n: number): string {
		if (format) return format(n);
		if (decimals > 0) return n.toFixed(decimals);
		return formatNumber(Math.round(n));
	}
</script>

<span class="animated-number">
	{prefix}{formatDisplay($displayValue)}{suffix}
</span>

<style>
	.animated-number {
		font-variant-numeric: tabular-nums;
	}
</style>
