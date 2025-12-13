<!--
  Main Page
  
  Scrollytelling experience with vinyl visualization
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { dataStore } from '$lib/stores/dataStore';
	import { uiStore } from '$lib/stores/uiStore';
	import { scrollStore } from '$lib/stores/scrollStore';
	import { runDataPipeline } from '$lib/utils/pipelineOrchestrator';
	import type { GenreData } from '$lib/types';

	// Components - loaded dynamically to avoid SSR issues with Three.js
	let VinylChart: typeof import('$lib/components/vinyl/VinylChart.svelte').default;
	let DetailPanel: typeof import('$lib/components/detail/DetailPanel.svelte').default;

	import { ScrollContainer, Section, ScrollIndicator } from '$lib/components/scroll';
	import { Header, Footer } from '$lib/components/layout';

	// State
	let isLoading = true;
	let loadError: string | null = null;
	let genres: GenreData[] = [];
	let selectedGenre: GenreData | null = null;
	let vinylRotation = 0;
	let showDetailPanel = false;

	// Reactive stores
	$: currentSection = $scrollStore.currentSection;
	$: isVinylSection = currentSection === 1;

	// Load 3D components client-side only
	onMount(async () => {
		if (browser) {
			const vinylModule = await import('$lib/components/vinyl/VinylChart.svelte');
			VinylChart = vinylModule.default;

			const detailModule = await import('$lib/components/detail/DetailPanel.svelte');
			DetailPanel = detailModule.default;
		}

		// Load data
		await loadData();
	});

	async function loadData() {
		try {
			isLoading = true;
			loadError = null;

			// Try to load from existing processed data or run pipeline
			const result = await runDataPipeline({
				genreLimit: 12,
				minPlayTime: 30000
			});

			genres = result.genres;
			dataStore.setSuccess(genres);

			// Auto-select first genre
			if (genres.length > 0) {
				selectedGenre = genres[0];
			}
		} catch (e) {
			loadError = e instanceof Error ? e.message : 'Failed to load data';
			console.error('Data load error:', e);
		} finally {
			isLoading = false;
		}
	}

	function handleRotationChange(rotation: number) {
		vinylRotation = rotation;
		uiStore.setRotation(rotation);
	}

	function handleGenreSelect(genreId: string) {
		const genre = genres.find((g) => g.id === genreId);
		if (genre) {
			selectedGenre = genre;
			uiStore.setActiveGenre(genreId);
			showDetailPanel = true;
		}
	}

	function handleSectionEnter(e: CustomEvent<{ id: string; index: number }>) {
		// Show detail panel only in vinyl section
		if (e.detail.index === 1) {
			showDetailPanel = true;
		} else {
			showDetailPanel = false;
		}
	}
</script>

<svelte:head>
	<title>Spotify Vinyl - Deine Musik visualisiert</title>
	<meta name="description" content="Entdecke deine Spotify-Hörgewohnheiten als interaktive Schallplatte" />
</svelte:head>

<div class="app">
	<Header transparent={currentSection === 0} fixed>
		<svelte:fragment slot="logo">
			<span class="logo">🎵 Spotify Vinyl</span>
		</svelte:fragment>
	</Header>

	<ScrollContainer>
		<!-- Hero Section -->
		<Section id="hero" index={0} minHeight="100vh" background="linear-gradient(180deg, #121212 0%, #1a1a2e 100%)">
			<div class="hero">
				<h1 class="hero__title">
					Deine Musik.<br />
					<span class="gradient-text">Visualisiert.</span>
				</h1>
				<p class="hero__subtitle">
					Entdecke deine Spotify-Hörgewohnheiten als interaktive Schallplatte
				</p>
				<div class="hero__cta">
					<span class="scroll-hint">↓ Scroll to explore</span>
				</div>
			</div>
		</Section>

		<!-- Vinyl Section -->
		<Section 
			id="vinyl" 
			index={1} 
			minHeight="100vh" 
			background="#121212"
			on:enter={handleSectionEnter}
		>
			<div class="vinyl-section">
				{#if isLoading}
					<div class="loading">
						<div class="spinner"></div>
						<p>Lade deine Musik-Daten...</p>
					</div>
				{:else if loadError}
					<div class="error">
						<p>⚠️ {loadError}</p>
						<button on:click={loadData}>Erneut versuchen</button>
					</div>
				{:else if browser && VinylChart}
					<div class="vinyl-container">
						<svelte:component
							this={VinylChart}
							{genres}
							rotation={vinylRotation}
							onRotationChange={handleRotationChange}
							onGenreSelect={handleGenreSelect}
							size="large"
							interactive
						/>
					</div>

					{#if selectedGenre}
						<div class="genre-label">
							<span class="genre-name" style="color: {selectedGenre.color}">
								{selectedGenre.name}
							</span>
							<span class="genre-stats">
								{selectedGenre.percentage.toFixed(1)}% · {selectedGenre.trackCount} Tracks
							</span>
						</div>
					{/if}
				{/if}
			</div>
		</Section>

		<!-- Stats Section -->
		<Section id="stats" index={2} minHeight="100vh" background="#0a0a0a">
			<div class="stats-section">
				<h2>Deine Statistiken</h2>
				
				{#if genres.length > 0}
					<div class="stats-grid">
						<div class="stat-card">
							<span class="stat-value">{genres.length}</span>
							<span class="stat-label">Genres</span>
						</div>
						<div class="stat-card">
							<span class="stat-value">
								{genres.reduce((sum, g) => sum + g.trackCount, 0).toLocaleString()}
							</span>
							<span class="stat-label">Tracks</span>
						</div>
						<div class="stat-card">
							<span class="stat-value">
								{Math.round(genres.reduce((sum, g) => sum + g.totalHours, 0))}h
							</span>
							<span class="stat-label">Gehört</span>
						</div>
					</div>

					<div class="top-genres">
						<h3>Top Genres</h3>
						<div class="genre-bars">
							{#each genres.slice(0, 5) as genre, i}
								<div class="genre-bar">
									<span class="genre-rank">{i + 1}</span>
									<span class="bar-genre-name">{genre.name}</span>
									<div class="bar-track">
										<div 
											class="bar-fill" 
											style="width: {genre.percentage}%; background: {genre.color}"
										></div>
									</div>
									<span class="genre-percent">{genre.percentage.toFixed(1)}%</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</Section>

		<!-- Outro Section -->
		<Section id="outro" index={3} minHeight="50vh" background="#121212">
			<div class="outro">
				<p>Erstellt mit ❤️ und Spotify-Daten</p>
				<a href="/test" class="dev-link">🛠 Developer Tools</a>
			</div>
		</Section>
	</ScrollContainer>

	<!-- Detail Panel -->
	{#if browser && DetailPanel && showDetailPanel}
		<svelte:component
			this={DetailPanel}
			genre={selectedGenre}
			show={showDetailPanel && isVinylSection}
			position="right"
		/>
	{/if}

	<!-- Scroll Indicator -->
	<ScrollIndicator type="dots" sectionCount={4} show={true} />

	<Footer author="Spotify Vinyl" showSpotifyAttribution />
</div>

<style>
	.app {
		min-height: 100vh;
		background: #121212;
		color: white;
	}

	.logo {
		font-size: 1.25rem;
		font-weight: 700;
		color: #1db954;
	}

	/* Hero */
	.hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		min-height: 80vh;
		padding: 2rem;
	}

	.hero__title {
		font-size: clamp(2.5rem, 8vw, 5rem);
		font-weight: 800;
		line-height: 1.1;
		margin: 0;
	}

	.gradient-text {
		background: linear-gradient(135deg, #1db954 0%, #1ed760 50%, #169c46 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.hero__subtitle {
		font-size: 1.25rem;
		color: rgba(255, 255, 255, 0.7);
		margin-top: 1.5rem;
		max-width: 500px;
	}

	.hero__cta {
		margin-top: 3rem;
	}

	.scroll-hint {
		color: rgba(255, 255, 255, 0.5);
		font-size: 0.875rem;
		animation: bounce 2s ease-in-out infinite;
	}

	@keyframes bounce {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(10px); }
	}

	/* Vinyl Section */
	.vinyl-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 80vh;
		padding: 2rem;
	}

	.vinyl-container {
		width: 100%;
		max-width: 500px;
		aspect-ratio: 1;
	}

	.genre-label {
		margin-top: 2rem;
		text-align: center;
	}

	.genre-label .genre-name {
		display: block;
		font-size: 2rem;
		font-weight: 700;
		text-transform: capitalize;
	}

	.genre-label .genre-stats {
		font-size: 1rem;
		color: rgba(255, 255, 255, 0.6);
	}

	/* Loading & Error */
	.loading, .error {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.spinner {
		width: 48px;
		height: 48px;
		border: 4px solid rgba(255, 255, 255, 0.1);
		border-top-color: #1db954;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.error button {
		padding: 0.75rem 1.5rem;
		background: #1db954;
		color: white;
		border: none;
		border-radius: 24px;
		cursor: pointer;
		font-weight: 600;
	}

	/* Stats Section */
	.stats-section {
		padding: 4rem 2rem;
		max-width: 800px;
		margin: 0 auto;
	}

	.stats-section h2 {
		font-size: 2rem;
		margin-bottom: 2rem;
		text-align: center;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;
		margin-bottom: 3rem;
	}

	.stat-card {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 16px;
		padding: 1.5rem;
		text-align: center;
	}

	.stat-value {
		display: block;
		font-size: 2.5rem;
		font-weight: 700;
		color: #1db954;
	}

	.stat-label {
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.top-genres h3 {
		margin-bottom: 1rem;
	}

	.genre-bars {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.genre-bar {
		display: grid;
		grid-template-columns: 24px 120px 1fr 60px;
		gap: 1rem;
		align-items: center;
	}

	.genre-rank {
		font-weight: 700;
		color: rgba(255, 255, 255, 0.4);
	}

	.bar-genre-name {
		font-weight: 500;
		text-transform: capitalize;
	}

	.bar-track {
		height: 8px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		border-radius: 4px;
		transition: width 0.5s ease;
	}

	.genre-percent {
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.6);
		text-align: right;
	}

	/* Outro */
	.outro {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		min-height: 40vh;
		gap: 1rem;
		color: rgba(255, 255, 255, 0.6);
	}

	.dev-link {
		color: #1db954;
		text-decoration: none;
		padding: 0.5rem 1rem;
		border: 1px solid currentColor;
		border-radius: 24px;
		transition: all 0.2s ease;
	}

	.dev-link:hover {
		background: #1db954;
		color: white;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.stats-grid {
			grid-template-columns: 1fr;
		}

		.genre-bar {
			grid-template-columns: 24px 1fr 40px;
		}

		.bar-genre-name {
			display: none;
		}
	}
</style>
