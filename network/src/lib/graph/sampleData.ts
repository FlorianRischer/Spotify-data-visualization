import type { GraphBuildInput } from "./types";

// Small deterministic sample input for local rendering/dev.
export const sampleInput: GraphBuildInput = {
  genreStats: [
    { id: "indie-rock", label: "Indie Rock", playCount: 1200, totalMinutes: 8400 },
    { id: "alt-pop", label: "Alt Pop", playCount: 950, totalMinutes: 6400 },
    { id: "electronic", label: "Electronic", playCount: 1100, totalMinutes: 7200 },
    { id: "lofi", label: "Lo-Fi", playCount: 500, totalMinutes: 3100 },
    { id: "hiphop", label: "Hip Hop", playCount: 800, totalMinutes: 5200 },
    { id: "jazz", label: "Jazz", playCount: 300, totalMinutes: 1800 }
  ],
  artists: [
    { artistId: "a1", name: "Indie Duo", genres: ["indie-rock", "alt-pop"] },
    { artistId: "a2", name: "Electro Indie", genres: ["indie-rock", "electronic"] },
    { artistId: "a3", name: "Alt Electro", genres: ["alt-pop", "electronic"] },
    { artistId: "a4", name: "LoFi Beat", genres: ["lofi", "electronic"] },
    { artistId: "a5", name: "HipElectro", genres: ["hiphop", "electronic"] },
    { artistId: "a6", name: "HipPop", genres: ["hiphop", "alt-pop"] },
    { artistId: "a7", name: "LoJazz", genres: ["lofi", "jazz"] }
  ],
  collabTracks: [
    { trackId: "t1", title: "IndieCollab", artistIds: ["a1", "a2"] },
    { trackId: "t2", title: "ElectroPop", artistIds: ["a2", "a3"] },
    { trackId: "t3", title: "LoBeat", artistIds: ["a3", "a4"] },
    { trackId: "t4", title: "Hoptron", artistIds: ["a5", "a3"] }
  ]
};
