import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  const artistName = url.searchParams.get('artist');
  const token = url.searchParams.get('token');

  if (!artistName || !token) {
    return json({ error: 'Missing artist or token parameter' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    // Pass through rate limit headers
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const limit = response.headers.get('X-RateLimit-Limit');
    const retryAfter = response.headers.get('Retry-After');

    if (response.status === 429) {
      return json(
        { error: 'Rate limit exceeded', retryAfter: retryAfter || '30' },
        { 
          status: 429,
          headers: retryAfter ? { 'Retry-After': retryAfter } : {}
        }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      return json({ error: `Spotify API error: ${response.status}`, details: errorText }, { status: response.status });
    }

    const data = await response.json();
    
    if (data.artists && data.artists.items && data.artists.items.length > 0) {
      const artist = data.artists.items[0];
      return json({
        id: artist.id,
        name: artist.name,
        genres: artist.genres || [],
        popularity: artist.popularity,
        followers: artist.followers?.total || 0
      });
    }

    return json({ error: 'Artist not found' }, { status: 404 });
  } catch (error) {
    console.error('Error searching artist:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
