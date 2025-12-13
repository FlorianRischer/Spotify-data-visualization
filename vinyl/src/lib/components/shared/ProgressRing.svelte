<!--
  ProgressRing.svelte
  
  Circular progress indicator.
-->
<script lang="ts">
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	/** Progress value (0-100) */
	export let value: number = 0;

	/** Size of the ring in pixels */
	export let size: number = 100;

	/** Stroke width */
	export let strokeWidth: number = 8;

	/** Progress color */
	export let color: string = '#1DB954';

	/** Track color */
	export let trackColor: string = 'rgba(255, 255, 255, 0.1)';

	/** Show percentage text */
	export let showValue: boolean = true;

	/** Animation duration */
	export let duration: number = 500;

	const progress = tweened(0, {
		duration,
		easing: cubicOut
	});

	$: progress.set(Math.min(100, Math.max(0, value)));

	$: radius = (size - strokeWidth) / 2;
	$: circumference = 2 * Math.PI * radius;
	$: offset = circumference - ($progress / 100) * circumference;
</script>

<div class="progress-ring" style="width: {size}px; height: {size}px;">
	<svg
		width={size}
		height={size}
		viewBox="0 0 {size} {size}"
		class="ring-svg"
	>
		<!-- Background track -->
		<circle
			cx={size / 2}
			cy={size / 2}
			r={radius}
			fill="none"
			stroke={trackColor}
			stroke-width={strokeWidth}
		/>

		<!-- Progress arc -->
		<circle
			cx={size / 2}
			cy={size / 2}
			r={radius}
			fill="none"
			stroke={color}
			stroke-width={strokeWidth}
			stroke-linecap="round"
			stroke-dasharray={circumference}
			stroke-dashoffset={offset}
			class="progress-circle"
		/>
	</svg>

	{#if showValue}
		<div class="ring-content">
			<slot>
				<span class="ring-value" style="color: {color}">
					{Math.round($progress)}%
				</span>
			</slot>
		</div>
	{/if}
</div>

<style>
	.progress-ring {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.ring-svg {
		transform: rotate(-90deg);
	}

	.progress-circle {
		transition: stroke 0.3s ease;
	}

	.ring-content {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.ring-value {
		font-size: 1.25rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
</style>
