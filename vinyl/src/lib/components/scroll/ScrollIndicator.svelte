<!--
  ScrollIndicator.svelte
  
  Visual indicator showing scroll progress or hint to scroll.
-->
<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { scrollStore } from '$lib/stores/scrollStore';

	/** Type of indicator */
	export let type: 'progress' | 'hint' | 'dots' = 'hint';

	/** Number of sections (for dots) */
	export let sectionCount: number = 1;

	/** Whether to show the indicator */
	export let show: boolean = true;

	/** Custom label for hint */
	export let hintText: string = 'Scroll to explore';

	$: progress = $scrollStore.scrollProgress;
	$: currentSection = $scrollStore.currentSection;
</script>

{#if show}
	<div class="scroll-indicator scroll-indicator--{type}" transition:fade={{ duration: 200 }}>
		{#if type === 'progress'}
			<div class="progress-track">
				<div class="progress-fill" style="height: {progress * 100}%"></div>
			</div>
		{:else if type === 'hint'}
			<div class="hint" transition:fly={{ y: 10, duration: 300 }}>
				<span class="hint-text">{hintText}</span>
				<div class="hint-arrow">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M12 5v14M5 12l7 7 7-7" />
					</svg>
				</div>
			</div>
		{:else if type === 'dots'}
			<div class="dots">
				{#each Array(sectionCount) as _, i}
					<button
						class="dot"
						class:active={currentSection === i}
						aria-label="Go to section {i + 1}"
						aria-current={currentSection === i ? 'step' : undefined}
					></button>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	.scroll-indicator {
		position: fixed;
		z-index: 50;
		pointer-events: none;
	}

	/* Progress bar */
	.scroll-indicator--progress {
		top: 0;
		right: 16px;
		bottom: 0;
		width: 4px;
		display: flex;
		align-items: stretch;
	}

	.progress-track {
		width: 100%;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
	}

	.progress-fill {
		width: 100%;
		background: #1db954;
		border-radius: 2px;
		transition: height 0.1s ease-out;
	}

	/* Scroll hint */
	.scroll-indicator--hint {
		bottom: 40px;
		left: 50%;
		transform: translateX(-50%);
	}

	.hint {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		color: rgba(255, 255, 255, 0.6);
	}

	.hint-text {
		font-size: 0.875rem;
		letter-spacing: 0.05em;
	}

	.hint-arrow {
		animation: bounce 2s ease-in-out infinite;
	}

	@keyframes bounce {
		0%, 100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(8px);
		}
	}

	/* Dots navigation */
	.scroll-indicator--dots {
		right: 24px;
		top: 50%;
		transform: translateY(-50%);
		pointer-events: auto;
	}

	.dots {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.3);
		border: none;
		padding: 0;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.dot:hover {
		background: rgba(255, 255, 255, 0.5);
		transform: scale(1.2);
	}

	.dot.active {
		background: #1db954;
		transform: scale(1.3);
	}
</style>
