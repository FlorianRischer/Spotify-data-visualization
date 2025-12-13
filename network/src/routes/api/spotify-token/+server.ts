import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

// Credentials aus Umgebungsvariablen (empfohlen für Produktion)
// Fallback auf hardcoded Werte für Entwicklung
const SPOTIFY_CLIENT_ID = env.SPOTIFY_CLIENT_ID || '0d00211b45094412aa9b8207af9ab2ff';
const SPOTIFY_CLIENT_SECRET = env.SPOTIFY_CLIENT_SECRET || '9c230d9ec1c447ba8f4b72004cb95c2a';

export const GET: RequestHandler = async () => {
  try {
    // Base64 encode credentials without Buffer (edge-compatible)
    const credentials = btoa(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET);
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + credentials
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Spotify token error:', response.status, errorText);
      return json({ error: `Failed to get token: ${response.status}`, details: errorText }, { status: response.status });
    }

    const data = await response.json();
    return json({ access_token: data.access_token });
  } catch (error) {
    console.error('Error getting Spotify token:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
