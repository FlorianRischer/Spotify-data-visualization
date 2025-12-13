<!--
  Header.svelte
  
  Site header with logo and optional navigation.
-->
<script lang="ts">
	import { fade } from 'svelte/transition';

	/** Whether header is visible */
	export let show: boolean = true;

	/** Whether header has transparent background */
	export let transparent: boolean = false;

	/** Whether header is fixed to top */
	export let fixed: boolean = true;
</script>

{#if show}
	<header
		class="header"
		class:header--transparent={transparent}
		class:header--fixed={fixed}
		transition:fade={{ duration: 200 }}
	>
		<div class="header__content">
			<div class="header__logo">
				<slot name="logo">
					<span class="logo-text">Spotify Vinyl</span>
				</slot>
			</div>

			{#if $$slots.nav}
				<nav class="header__nav">
					<slot name="nav" />
				</nav>
			{/if}

			{#if $$slots.actions}
				<div class="header__actions">
					<slot name="actions" />
				</div>
			{/if}
		</div>
	</header>
{/if}

<style>
	.header {
		width: 100%;
		padding: 16px 24px;
		z-index: 100;
		background: rgba(18, 18, 18, 0.8);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.header--fixed {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
	}

	.header--transparent {
		background: transparent;
		backdrop-filter: none;
		border-bottom: none;
	}

	.header__content {
		max-width: 1400px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
	}

	.header__logo {
		flex-shrink: 0;
	}

	.logo-text {
		font-size: 1.25rem;
		font-weight: 700;
		color: #1db954;
		letter-spacing: -0.02em;
	}

	.header__nav {
		display: flex;
		align-items: center;
		gap: 24px;
	}

	.header__actions {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	@media (max-width: 768px) {
		.header {
			padding: 12px 16px;
		}

		.header__nav {
			display: none;
		}
	}
</style>
