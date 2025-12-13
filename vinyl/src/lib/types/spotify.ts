/**
 * Raw Spotify Track Types (from Streaming History JSON)
 */
export interface SpotifyTrackRaw {
  ts: string; // ISO Timestamp
  master_metadata_track_name: string | null;
  master_metadata_album_artist_name: string | null;
  master_metadata_album_album_name: string | null;
  ms_played: number;
  spotify_track_uri: string | null;
  reason_start: string | null;
  reason_end: string | null;
  shuffle: boolean | null;
  skipped: boolean | null;
}

/**
 * Artist with Genres (from Spotify API)
 */
export interface ArtistWithGenres {
  id: string;
  name: string;
  originalName: string;
  genres: string[];
  popularity?: number;
  images?: SpotifyImage[];
}

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

/**
 * Audio Features (from Spotify API)
 */
export interface AudioFeatures {
  id: string;
  tempo: number;
  energy: number;
  danceability: number;
  valence: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  speechiness: number;
}
