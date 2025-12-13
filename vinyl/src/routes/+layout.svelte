<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>Spotify Vinyl Data Visualization</title>
	<meta name="description" content="Interactive 3D visualization of Spotify listening history" />
</svelte:head>

{@render children()}
