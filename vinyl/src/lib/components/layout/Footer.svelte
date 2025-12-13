<!--
  Footer.svelte
  
  Site footer with credits and links.
-->
<script lang="ts">
	/** Year for copyright */
	export let year: number = new Date().getFullYear();

	/** Author name */
	export let author: string = '';

	/** Show Spotify attribution */
	export let showSpotifyAttribution: boolean = true;
</script>

<footer class="footer">
	<div class="footer__content">
		<div class="footer__left">
			<slot name="left">
				{#if author}
					<p class="footer__credit">
						Created by <strong>{author}</strong> · {year}
					</p>
				{/if}
			</slot>
		</div>

		<div class="footer__center">
			<slot name="center" />
		</div>

		<div class="footer__right">
			<slot name="right">
				{#if showSpotifyAttribution}
					<p class="footer__attribution">
						Data from
						<a href="https://www.spotify.com" target="_blank" rel="noopener noreferrer">
							<svg class="spotify-logo" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
								<path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
							</svg>
							Spotify
						</a>
					</p>
				{/if}
			</slot>
		</div>
	</div>
</footer>

<style>
	.footer {
		width: 100%;
		padding: 24px;
		background: rgba(0, 0, 0, 0.4);
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.footer__content {
		max-width: 1400px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		flex-wrap: wrap;
	}

	.footer__left,
	.footer__center,
	.footer__right {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.footer__credit,
	.footer__attribution {
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.5);
		margin: 0;
	}

	.footer__attribution a {
		color: #1db954;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: 4px;
		transition: color 0.2s ease;
	}

	.footer__attribution a:hover {
		color: #1ed760;
	}

	.spotify-logo {
		vertical-align: middle;
	}

	@media (max-width: 768px) {
		.footer__content {
			flex-direction: column;
			text-align: center;
		}
	}
</style>
