import type {
  AdjacencyEntry,
  ArtistGenre,
  CollabTrack,
  EdgeKind,
  GenreEdge,
  GenreNode,
  GenreStat,
  GraphBuildInput,
  GraphBuildOptions,
  GraphData
} from "./types";

const DEFAULT_OPTIONS: Required<Pick<GraphBuildOptions, "topK" | "sizeScale" | "minSize" | "maxSize">> = {
  topK: 3,
  sizeScale: 1.0,
  minSize: 6,
  maxSize: 42
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}__${b}` : `${b}__${a}`;
}

function normalizeGenres(genreStats: GenreStat[]): GenreStat[] {
  return genreStats
    .filter((g) => g.totalMinutes > 0)
    .map((g) => ({ ...g, label: g.label || g.id }))
    .sort((a, b) => {
      if (b.totalMinutes === a.totalMinutes) return a.label.localeCompare(b.label);
      return b.totalMinutes - a.totalMinutes;
    });
}

function buildNodes(genreStats: GenreStat[], opts: Required<typeof DEFAULT_OPTIONS>): GenreNode[] {
  return genreStats.map((g) => {
    const base = Math.sqrt(g.totalMinutes) * opts.sizeScale;
    const size = clamp(base, opts.minSize, opts.maxSize);
    return {
      id: g.id,
      label: g.label,
      playCount: g.playCount,
      totalMinutes: g.totalMinutes,
      size,
      degree: 0,
      color: g.color,
      topArtist: g.topArtist,
      topArtistMinutes: g.topArtistMinutes
    };
  });
}

function addEdgeWeight(
  map: Map<string, { weight: number; kind: EdgeKind; examples: Set<string> }>,
  source: string,
  target: string,
  kind: EdgeKind,
  exampleId?: string
) {
  const key = pairKey(source, target);
  const existing = map.get(key);
  if (!existing) {
    const examples = new Set<string>();
    if (exampleId) examples.add(exampleId);
    map.set(key, { weight: 1, kind, examples });
    return;
  }
  existing.weight += 1;
  if (exampleId) existing.examples.add(exampleId);
  if (existing.kind !== kind) {
    existing.kind = "mixed";
  }
}

function edgesFromArtists(artists: ArtistGenre[]): Map<string, { weight: number; kind: EdgeKind; examples: Set<string> }> {
  const edgeMap = new Map<string, { weight: number; kind: EdgeKind; examples: Set<string> }>();
  for (const artist of artists) {
    if (!artist.genres || artist.genres.length < 2) continue;
    // generate all pairs deterministically
    const genres = [...new Set(artist.genres)].sort();
    for (let i = 0; i < genres.length; i += 1) {
      for (let j = i + 1; j < genres.length; j += 1) {
        addEdgeWeight(edgeMap, genres[i], genres[j], "multi-genre", artist.artistId);
      }
    }
  }
  return edgeMap;
}

function edgesFromCollabs(
  collabs: CollabTrack[] | undefined,
  artistGenres: Map<string, string[]>
): Map<string, { weight: number; kind: EdgeKind; examples: Set<string> }> {
  const edgeMap = new Map<string, { weight: number; kind: EdgeKind; examples: Set<string> }>();
  if (!collabs) return edgeMap;

  for (const track of collabs) {
    if (!track.artistIds || track.artistIds.length < 2) continue;
    const genres = new Set<string>();
    for (const artistId of track.artistIds) {
      const g = artistGenres.get(artistId);
      if (g && g.length) g.forEach((x) => genres.add(x));
    }
    const genreList = Array.from(genres).sort();
    for (let i = 0; i < genreList.length; i += 1) {
      for (let j = i + 1; j < genreList.length; j += 1) {
        addEdgeWeight(edgeMap, genreList[i], genreList[j], "collab", track.trackId);
      }
    }
  }
  return edgeMap;
}

function mergeEdges(
  a: Map<string, { weight: number; kind: EdgeKind; examples: Set<string> }>,
  b: Map<string, { weight: number; kind: EdgeKind; examples: Set<string> }>
): Map<string, { weight: number; kind: EdgeKind; examples: Set<string> }> {
  const out = new Map(a);
  for (const [key, val] of b.entries()) {
    if (!out.has(key)) {
      out.set(key, val);
      continue;
    }
    const existing = out.get(key)!;
    existing.weight += val.weight;
    if (existing.kind !== val.kind) existing.kind = "mixed";
    val.examples.forEach((ex) => existing.examples.add(ex));
  }
  return out;
}

function edgeMapToArray(edgeMap: Map<string, { weight: number; kind: EdgeKind; examples: Set<string> }>): GenreEdge[] {
  return Array.from(edgeMap.entries())
    .map(([key, value]) => {
      const [a, b] = key.split("__");
      return {
        id: key,
        source: a,
        target: b,
        weight: value.weight,
        kind: value.kind,
        examples: value.examples.size ? Array.from(value.examples) : undefined
      } satisfies GenreEdge;
    })
    .sort((x, y) => {
      if (y.weight === x.weight) return `${x.source}-${x.target}`.localeCompare(`${y.source}-${y.target}`);
      return y.weight - x.weight;
    });
}

function buildAdjacency(edges: GenreEdge[]): Record<string, AdjacencyEntry[]> {
  const adj: Record<string, AdjacencyEntry[]> = {};
  for (const edge of edges) {
    if (!adj[edge.source]) adj[edge.source] = [];
    if (!adj[edge.target]) adj[edge.target] = [];
    adj[edge.source].push({ neighborId: edge.target, weight: edge.weight, kind: edge.kind });
    adj[edge.target].push({ neighborId: edge.source, weight: edge.weight, kind: edge.kind });
  }
  for (const key of Object.keys(adj)) {
    adj[key].sort((a, b) => {
      if (b.weight === a.weight) return a.neighborId.localeCompare(b.neighborId);
      return b.weight - a.weight;
    });
  }
  return adj;
}

function applyDegrees(nodes: GenreNode[], adj: Record<string, AdjacencyEntry[]>): GenreNode[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  for (const [id, neighbors] of Object.entries(adj)) {
    const node = nodeMap.get(id);
    if (node) node.degree = neighbors.length;
  }
  return Array.from(nodeMap.values()).sort((a, b) => a.label.localeCompare(b.label));
}

// Apply size based on degree (number of connections) instead of totalMinutes
function applySizeByDegree(
  nodes: GenreNode[], 
  opts: Required<typeof DEFAULT_OPTIONS>
): GenreNode[] {
  if (nodes.length === 0) return nodes;
  
  // Find min/max degree for normalization
  const degrees = nodes.map(n => n.degree);
  const minDegree = Math.min(...degrees);
  const maxDegree = Math.max(...degrees);
  const degreeRange = maxDegree - minDegree || 1;
  
  return nodes.map(node => {
    // Normalize degree to 0-1 range, then apply to size range
    const normalized = (node.degree - minDegree) / degreeRange;
    const size = opts.minSize + normalized * (opts.maxSize - opts.minSize);
    
    return {
      ...node,
      size: clamp(size, opts.minSize, opts.maxSize)
    };
  });
}

export function rankTopGenres(nodes: GenreNode[], k: number): string[] {
  const sorted = [...nodes].sort((a, b) => {
    if (b.totalMinutes === a.totalMinutes) return a.label.localeCompare(b.label);
    return b.totalMinutes - a.totalMinutes;
  });
  return sorted.slice(0, k).map((n) => n.id);
}

// Selects diverse genres with minimal overlap for initial display
// This ensures different genre clusters are represented
function selectDiverseGenres(
  nodes: GenreNode[],
  edges: GenreEdge[],
  adjacency: Record<string, AdjacencyEntry[]>,
  k: number
): string[] {
  if (nodes.length <= k) return nodes.map(n => n.id);
  
  // Build edge weight map for quick lookup
  const edgeWeights = new Map<string, number>();
  edges.forEach(e => {
    const key = e.source < e.target ? `${e.source}__${e.target}` : `${e.target}__${e.source}`;
    edgeWeights.set(key, e.weight);
  });
  
  const selected: string[] = [];
  const candidates = [...nodes].sort((a, b) => b.totalMinutes - a.totalMinutes);
  
  // Always start with the most popular genre
  selected.push(candidates[0].id);
  
  // Greedily select genres with minimal connection to already selected ones
  while (selected.length < k && candidates.length > 0) {
    let bestCandidate: string | null = null;
    let minConnection = Infinity;
    
    for (const candidate of candidates) {
      if (selected.includes(candidate.id)) continue;
      
      // Calculate total connection weight to already selected genres
      let totalConnection = 0;
      for (const selectedId of selected) {
        const key = candidate.id < selectedId 
          ? `${candidate.id}__${selectedId}` 
          : `${selectedId}__${candidate.id}`;
        totalConnection += edgeWeights.get(key) || 0;
      }
      
      // Prefer genres with less connection (more diverse)
      // But still consider popularity (use totalMinutes as tiebreaker)
      const score = totalConnection - (candidate.totalMinutes * 0.001);
      
      if (score < minConnection) {
        minConnection = score;
        bestCandidate = candidate.id;
      }
    }
    
    if (bestCandidate) {
      selected.push(bestCandidate);
    } else {
      break;
    }
  }
  
  return selected;
}

export function buildGraph(input: GraphBuildInput, options?: GraphBuildOptions): GraphData {
  const opts = { ...DEFAULT_OPTIONS, ...options } as Required<typeof DEFAULT_OPTIONS>;

  const normalizedGenres = normalizeGenres(input.genreStats);
  const nodes = buildNodes(normalizedGenres, opts);

  const artistGenreMap = new Map<string, string[]>();
  input.artists.forEach((a) => {
    const genres = (a.genres || []).filter(Boolean);
    if (genres.length) artistGenreMap.set(a.artistId, genres);
  });

  const artistEdges = edgesFromArtists(input.artists);
  const collabEdges = edgesFromCollabs(input.collabTracks, artistGenreMap);
  const mergedEdgeMap = mergeEdges(artistEdges, collabEdges);
  const edges = edgeMapToArray(mergedEdgeMap);

  const adjacency = buildAdjacency(edges);
  const nodesWithDegree = applyDegrees(nodes, adjacency);
  
  // Apply size based on degree (connections) instead of totalMinutes
  const nodesWithSize = applySizeByDegree(nodesWithDegree, opts);
  
  // Use diverse selection instead of just top-K by popularity
  const topK = selectDiverseGenres(nodesWithSize, edges, adjacency, opts.topK);

  return {
    nodes: nodesWithSize,
    edges,
    adjacency,
    topK
  };
}
