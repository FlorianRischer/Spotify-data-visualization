<script lang="ts">
	import { onMount } from 'svelte';
	import { runDataPipeline, type PipelineResult } from '$lib/utils/pipelineOrchestrator';
	import { exportAsJSON, exportAsCSV, copyToClipboard } from '$lib/utils/exportUtils';
	import { dataStore } from '$lib/stores/dataStore';

	let isProcessing = false;
	let result: PipelineResult | null = null;
	let error: string | null = null;
	let accessToken = '';

	async function runPipeline() {
		isProcessing = true;
		error = null;
		result = null;

		try {
			dataStore.setLoading();

			const pipelineResult = await runDataPipeline({
				spotifyAccessToken: accessToken || undefined,
				genreLimit: 15,
				minPlayTime: 30000
			});

			result = pipelineResult;
			dataStore.setSuccess(pipelineResult.genres);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Unknown error';
			dataStore.setError(new Error(error));
		} finally {
			isProcessing = false;
		}
	}

	function handleExportJSON() {
		if (result) {
			exportAsJSON(result.genres);
		}
	}

	function handleExportCSV() {
		if (result) {
			exportAsCSV(result.genres);
		}
	}

	async function handleCopyToClipboard() {
		if (result) {
			const success = await copyToClipboard(result.genres);
			if (success) {
				alert('Copied to clipboard!');
			}
		}
	}
</script>

<main>
	<h1>🔧 Data Pipeline Test</h1>
	<p>Test the Spotify data processing pipeline</p>

	<section class="controls">
		<h2>Configuration</h2>

		<div class="form-group">
			<label for="token">
				Spotify Access Token (optional)
				<small>Leave empty to use cached data only</small>
			</label>
			<input
				id="token"
				type="password"
				bind:value={accessToken}
				placeholder="Optional: Spotify API token"
				disabled={isProcessing}
			/>
		</div>

		<button onclick={runPipeline} disabled={isProcessing}>
			{isProcessing ? '⏳ Processing...' : '▶️ Run Pipeline'}
		</button>
	</section>

	{#if error}
		<section class="error">
			<h2>❌ Error</h2>
			<pre>{error}</pre>
		</section>
	{/if}

	{#if result}
		<section class="results">
			<h2>✅ Results</h2>

			<div class="stats">
				<div class="stat">
					<strong>{result.stats.totalTracks.toLocaleString()}</strong>
					<span>Total Tracks</span>
				</div>
				<div class="stat">
					<strong>{result.stats.validTracks.toLocaleString()}</strong>
					<span>Valid Tracks</span>
				</div>
				<div class="stat">
					<strong>{result.stats.uniqueArtists.toLocaleString()}</strong>
					<span>Unique Artists</span>
				</div>
				<div class="stat">
					<strong>{result.stats.genreCoverage.toFixed(1)}%</strong>
					<span>Genre Coverage</span>
				</div>
				<div class="stat">
					<strong>{(result.stats.processingTime / 1000).toFixed(2)}s</strong>
					<span>Processing Time</span>
				</div>
			</div>

			<div class="actions">
				<button onclick={handleExportJSON}>💾 Export JSON</button>
				<button onclick={handleExportCSV}>📊 Export CSV</button>
				<button onclick={handleCopyToClipboard}>📋 Copy to Clipboard</button>
			</div>

			<h3>Top {result.genres.length} Genres</h3>
			<div class="genres">
				{#each result.genres as genre}
					<div class="genre-card">
						<div class="genre-header" style="border-left: 4px solid {genre.color}">
							<h4>{genre.name}</h4>
							<span class="percentage">{genre.percentage.toFixed(1)}%</span>
						</div>
						<div class="genre-stats">
							<div>
								<strong>{genre.trackCount}</strong> tracks
							</div>
							<div>
								<strong>{genre.totalHours.toFixed(1)}h</strong> listened
							</div>
							<div>
								<strong>{genre.avgMinutesPerTrack.toFixed(1)} min</strong> avg per track
							</div>
						</div>
						<div class="genre-lists">
							<div>
								<strong>Top Artists:</strong>
								<ul>
									{#each genre.topArtists.slice(0, 3) as artist}
										<li>{artist.name} ({artist.playCount})</li>
									{/each}
								</ul>
							</div>
							<div>
								<strong>Top Tracks:</strong>
								<ul>
									{#each genre.topTracks.slice(0, 3) as track}
										<li>{track.name} - {track.artist}</li>
									{/each}
								</ul>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}
</main>

<style>
	main {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	h1 {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
	}

	section {
		margin: 2rem 0;
		padding: 2rem;
		border-radius: 12px;
		background: var(--color-surface);
	}

	.controls {
		background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
	}

	small {
		display: block;
		color: var(--color-text-muted);
		font-weight: normal;
		margin-top: 0.25rem;
	}

	input {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #ddd;
		border-radius: 8px;
		font-size: 1rem;
		font-family: var(--font-family-mono);
	}

	button {
		padding: 0.75rem 1.5rem;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	button:hover:not(:disabled) {
		background: var(--color-secondary);
		transform: translateY(-2px);
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.error {
		background: #fee;
		border-left: 4px solid #c00;
	}

	.error pre {
		color: #c00;
		overflow-x: auto;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.stat {
		padding: 1rem;
		background: white;
		border-radius: 8px;
		text-align: center;
	}

	.stat strong {
		display: block;
		font-size: 2rem;
		color: var(--color-primary);
		margin-bottom: 0.5rem;
	}

	.stat span {
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}

	.actions {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}

	.genres {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 1.5rem;
		margin-top: 1rem;
	}

	.genre-card {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: var(--shadow-md);
		transition: transform var(--transition-fast);
	}

	.genre-card:hover {
		transform: translateY(-4px);
	}

	.genre-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-left: 1rem;
		margin-bottom: 1rem;
	}

	.genre-header h4 {
		margin: 0;
		font-size: 1.25rem;
	}

	.percentage {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-primary);
	}

	.genre-stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		padding: 1rem 0;
		border-top: 1px solid #eee;
		border-bottom: 1px solid #eee;
		margin-bottom: 1rem;
		text-align: center;
		font-size: 0.875rem;
	}

	.genre-lists {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		font-size: 0.875rem;
	}

	.genre-lists ul {
		margin: 0.5rem 0 0 0;
		padding-left: 1.25rem;
	}

	.genre-lists li {
		margin: 0.25rem 0;
		color: var(--color-text-muted);
	}
</style>
