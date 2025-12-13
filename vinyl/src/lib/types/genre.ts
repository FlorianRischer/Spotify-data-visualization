/**
 * Processed Genre Data for Visualization
 */
export interface GenreData {
  readonly id: string;
  name: string;
  trackCount: number;
  totalMinutesListened: number;
  totalHours: number;
  percentage: number;
  color: string;
  topArtists: TopArtist[];
  topTracks: TopTrack[];
  avgMinutesPerTrack: number;
}

export interface TopArtist {
  name: string;
  playCount: number;
  totalHours: number;
}

export interface TopTrack {
  name: string;
  artist: string;
  playCount: number;
  totalMinutes?: number;
}

/**
 * Segment Bounds for Vinyl Visualization
 */
export interface SegmentBounds {
  id: string;
  startAngle: number; // Degrees, 0 = 12 Uhr
  endAngle: number;
  percentage: number;
}

/**
 * Artist to Genre Mapping
 */
export type ArtistGenreMapping = Record<string, string[]>;
