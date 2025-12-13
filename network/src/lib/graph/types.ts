// Graph core types for Musical Brain Activity visualization
// Keep strict typing and deterministic structures.

export type EdgeKind = "multi-genre" | "collab" | "mixed";

export interface GenreStat {
  id: string; // stable slug
  label: string;
  playCount: number;
  totalMinutes: number;
  color?: string;
  topArtist?: string; // Name of artist with most time played in this genre
  topArtistMinutes?: number; // Minutes of the top artist
}

export interface ArtistGenre {
  artistId: string;
  name: string;
  genres: string[]; // ordered list, first is primary
}

export interface CollabTrack {
  trackId: string;
  artistIds: string[]; // track is counted once per unique genre pair across these artists
  title?: string;
}

export interface GenreNode {
  id: string;
  label: string;
  playCount: number;
  totalMinutes: number;
  size: number;
  degree: number;
  color?: string;
  pinned?: boolean;
  topArtist?: string; // Name of artist with most time played in this genre
  topArtistMinutes?: number; // Minutes of the top artist
}

export interface GenreEdge {
  id: string; // `${source}__${target}` sorted
  source: string;
  target: string;
  weight: number;
  kind: EdgeKind;
  examples?: string[]; // optional artistIds or trackIds
}

export interface AdjacencyEntry {
  neighborId: string;
  weight: number;
  kind: EdgeKind;
}

export interface GraphData {
  nodes: GenreNode[];
  edges: GenreEdge[];
  adjacency: Record<string, AdjacencyEntry[]>;
  topK: string[]; // ordered list of top genres by metric
}

export interface GraphBuildInput {
  genreStats: GenreStat[];
  artists: ArtistGenre[];
  collabTracks?: CollabTrack[];
}

export interface GraphBuildOptions {
  topK?: number; // default 3 for initial state
  sizeScale?: number; // multiplier on sqrt(totalMinutes)
  minSize?: number;
  maxSize?: number;
}
