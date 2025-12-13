<!--
  PageShell.svelte
  
  Outer layout wrapper for the page.
  Provides consistent structure and styling.
-->
<script lang="ts">
	import { page } from '$app/stores';

	/** Page title for header (also used in document title if set) */
	export let title: string = '';

	/** Show header */
	export let showHeader: boolean = true;

	/** Show footer */
	export let showFooter: boolean = true;

	/** Dark or light mode */
	export let theme: 'dark' | 'light' = 'dark';
</script>

<svelte:head>
	{#if title}
		<title>{title}</title>
	{/if}
</svelte:head>

<div class="page-shell theme-{theme}">
	{#if showHeader && $$slots.header}
		<slot name="header" />
	{/if}

	<main class="page-content">
		<slot />
	</main>

	{#if showFooter && $$slots.footer}
		<slot name="footer" />
	{/if}
</div>

<style>
	.page-shell {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.theme-dark {
		background: #121212;
		color: #ffffff;
	}

	.theme-light {
		background: #ffffff;
		color: #121212;
	}

	.page-content {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
</style>
