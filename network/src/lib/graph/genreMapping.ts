/**
 * Genre-zu-Obergruppen Mapping
 * Organisiert alle Genres in semantisch sinnvolle Oberkategorien
 * für bessere Visualisierung und Navigation im Graph
 */

export type GenreCategory = 
  | "Hip Hop"
  | "Electronic"
  | "Rock"
  | "Pop"
  | "Jazz"
  | "Soul"
  | "Reggae"
  | "Indie"
  | "Classical"
  | "Country"
  | "Latin"
  | "Metal"
  | "Experimental"
  | "Funk"
  | "Spiritual"
  | "Asian Pop"
  | "Specialty";

export interface GenreInfo {
  genre: string;
  category: GenreCategory;
}

/**
 * Vollständiges Mapping aller 395 Genres zu Oberkategorien
 */
export const GENRE_MAPPING: GenreInfo[] = [
  // Hip Hop & Rap (incl. regional variants)
  { genre: "hip hop", category: "Hip Hop" },
  { genre: "rap", category: "Hip Hop" },
  { genre: "trap", category: "Hip Hop" },
  { genre: "cloud rap", category: "Hip Hop" },
  { genre: "conscious hip hop", category: "Hip Hop" },
  { genre: "east coast hip hop", category: "Hip Hop" },
  { genre: "west coast hip hop", category: "Hip Hop" },
  { genre: "southern hip hop", category: "Hip Hop" },
  { genre: "midwest emo", category: "Hip Hop" },
  { genre: "gangsta rap", category: "Hip Hop" },
  { genre: "gangster rap", category: "Hip Hop" },
  { genre: "horrorcore", category: "Hip Hop" },
  { genre: "rage rap", category: "Hip Hop" },
  { genre: "sad rap", category: "Hip Hop" },
  { genre: "melodic rap", category: "Hip Hop" },
  { genre: "emo rap", category: "Hip Hop" },
  { genre: "underground hip hop", category: "Hip Hop" },
  { genre: "old school hip hop", category: "Hip Hop" },
  { genre: "boom bap", category: "Hip Hop" },
  { genre: "hardcore hip hop", category: "Hip Hop" },
  { genre: "experimental hip hop", category: "Hip Hop" },
  { genre: "alternative hip hop", category: "Hip Hop" },
  { genre: "jazz rap", category: "Hip Hop" },
  { genre: "german hip hop", category: "Hip Hop" },
  { genre: "deutschrap", category: "Hip Hop" },
  { genre: "arab hip hop", category: "Hip Hop" },
  { genre: "arabic hip hop", category: "Hip Hop" },
  { genre: "brooklyn drill", category: "Hip Hop" },
  { genre: "chicago drill", category: "Hip Hop" },
  { genre: "new york drill", category: "Hip Hop" },
  { genre: "uk drill", category: "Hip Hop" },
  { genre: "drill", category: "Hip Hop" },
  { genre: "country hip hop", category: "Hip Hop" },
  { genre: "desi hip hop", category: "Hip Hop" },
  { genre: "egyptian hip hop", category: "Hip Hop" },
  { genre: "french rap", category: "Hip Hop" },
  { genre: "norwegian hip hop", category: "Hip Hop" },
  { genre: "pinoy hip hop", category: "Hip Hop" },
  { genre: "turkish hip hop", category: "Hip Hop" },
  { genre: "mexican hip hop", category: "Hip Hop" },
  { genre: "drift phonk", category: "Hip Hop" },
  { genre: "phonk", category: "Hip Hop" },
  { genre: "christian hip hop", category: "Hip Hop" },
  { genre: "anime rap", category: "Hip Hop" },
  { genre: "sexy drill", category: "Hip Hop" },
  { genre: "argentinian trap", category: "Hip Hop" },
  { genre: "argentine trap", category: "Hip Hop" },
  { genre: "rap metal", category: "Hip Hop" },
  { genre: "rap rock", category: "Hip Hop" },
  { genre: "funk rap", category: "Hip Hop" },
  { genre: "rap québécois", category: "Hip Hop" },

  // Electronic
  { genre: "edm", category: "Electronic" },
  { genre: "electronic", category: "Electronic" },
  { genre: "electronica", category: "Electronic" },
  { genre: "dance", category: "Electronic" },
  { genre: "house", category: "Electronic" },
  { genre: "deep house", category: "Electronic" },
  { genre: "chicago house", category: "Electronic" },
  { genre: "french house", category: "Electronic" },
  { genre: "acid house", category: "Electronic" },
  { genre: "hard house", category: "Electronic" },
  { genre: "progressive house", category: "Electronic" },
  { genre: "melodic house", category: "Electronic" },
  { genre: "techno", category: "Electronic" },
  { genre: "minimal techno", category: "Electronic" },
  { genre: "acid techno", category: "Electronic" },
  { genre: "hard techno", category: "Electronic" },
  { genre: "melodic techno", category: "Electronic" },
  { genre: "hardcore techno", category: "Electronic" },
  { genre: "hypertechno", category: "Electronic" },
  { genre: "electro", category: "Electronic" },
  { genre: "electro house", category: "Electronic" },
  { genre: "electro swing", category: "Electronic" },
  { genre: "electropop", category: "Electronic" },
  { genre: "electroclash", category: "Electronic" },
  { genre: "eurodance", category: "Electronic" },
  { genre: "europop", category: "Electronic" },
  { genre: "edm trap", category: "Electronic" },
  { genre: "future house", category: "Electronic" },
  { genre: "future bass", category: "Electronic" },
  { genre: "bass house", category: "Electronic" },
  { genre: "bassline", category: "Electronic" },
  { genre: "trance", category: "Electronic" },
  { genre: "progressive trance", category: "Electronic" },
  { genre: "psytrance", category: "Electronic" },
  { genre: "grime", category: "Electronic" },
  { genre: "uk garage", category: "Electronic" },
  { genre: "uk funky", category: "Electronic" },
  { genre: "jersey club", category: "Electronic" },
  { genre: "breakbeat", category: "Electronic" },
  { genre: "drum and bass", category: "Electronic" },
  { genre: "jungle", category: "Electronic" },
  { genre: "drumstep", category: "Electronic" },
  { genre: "liquid funk", category: "Electronic" },
  { genre: "breakcore", category: "Electronic" },
  { genre: "dubstep", category: "Electronic" },
  { genre: "dub", category: "Electronic" },
  { genre: "riddim", category: "Electronic" },
  { genre: "moombahton", category: "Electronic" },
  { genre: "tropical house", category: "Electronic" },
  { genre: "dancehall", category: "Electronic" },
  { genre: "new rave", category: "Electronic" },
  { genre: "gabber", category: "Electronic" },
  { genre: "hardstyle", category: "Electronic" },
  { genre: "happy hardcore", category: "Electronic" },
  { genre: "speedcore", category: "Electronic" },
  { genre: "hypercore", category: "Electronic" },
  { genre: "tekno", category: "Electronic" },
  { genre: "slap house", category: "Electronic" },
  { genre: "stutter house", category: "Electronic" },
  { genre: "big beat", category: "Electronic" },
  { genre: "big room", category: "Electronic" },
  { genre: "italo dance", category: "Electronic" },
  { genre: "italo disco", category: "Electronic" },
  { genre: "disco", category: "Electronic" },
  { genre: "disco house", category: "Electronic" },
  { genre: "post-disco", category: "Electronic" },
  { genre: "australia techno", category: "Electronic" },
  { genre: "melbourne bounce", category: "Electronic" },
  { genre: "bounce", category: "Electronic" },
  { genre: "crunk", category: "Electronic" },
  { genre: "hyphy", category: "Electronic" },
  { genre: "miami bass", category: "Electronic" },
  { genre: "new orleans bounce", category: "Electronic" },
  { genre: "hip house", category: "Electronic" },
  { genre: "g-house", category: "Electronic" },
  { genre: "afro house", category: "Electronic" },
  { genre: "afro tech", category: "Electronic" },
  { genre: "rally house", category: "Electronic" },
  { genre: "electro corridos", category: "Electronic" },
  { genre: "coldwave", category: "Electronic" },
  { genre: "cold wave", category: "Electronic" },
  { genre: "hardcore", category: "Electronic" },
  { genre: "industrial", category: "Electronic" },
  { genre: "frenchcore", category: "Electronic" },

  // Rock & Punk
  { genre: "rock", category: "Rock" },
  { genre: "rock and roll", category: "Rock" },
  { genre: "alternative rock", category: "Rock" },
  { genre: "soft rock", category: "Rock" },
  { genre: "hard rock", category: "Rock" },
  { genre: "classic rock", category: "Rock" },
  { genre: "art rock", category: "Rock" },
  { genre: "psychedelic rock", category: "Rock" },
  { genre: "garage rock", category: "Rock" },
  { genre: "punk", category: "Rock" },
  { genre: "hardcore punk", category: "Rock" },
  { genre: "post-punk", category: "Rock" },
  { genre: "post-hardcore", category: "Rock" },
  { genre: "pop punk", category: "Rock" },
  { genre: "skate punk", category: "Rock" },
  { genre: "melodic hardcore", category: "Rock" },
  { genre: "grunge", category: "Rock" },
  { genre: "post-grunge", category: "Rock" },
  { genre: "noise rock", category: "Rock" },
  { genre: "shoegaze", category: "Rock" },
  { genre: "jangle pop", category: "Rock" },
  { genre: "indie rock", category: "Rock" },
  { genre: "britpop", category: "Rock" },
  { genre: "gothic rock", category: "Rock" },
  { genre: "darkwave", category: "Rock" },
  { genre: "new wave", category: "Rock" },
  { genre: "synthwave", category: "Rock" },
  { genre: "neo-psychedelic", category: "Rock" },
  { genre: "rockabilly", category: "Rock" },
  { genre: "blues rock", category: "Rock" },
  { genre: "reggae rock", category: "Rock" },
  { genre: "surf rock", category: "Rock" },
  { genre: "celtic rock", category: "Rock" },
  { genre: "folk rock", category: "Rock" },
  { genre: "country rock", category: "Rock" },
  { genre: "southern gothic", category: "Rock" },
  { genre: "southern rock", category: "Rock" },
  { genre: "riot grrrl", category: "Rock" },
  { genre: "riot grrl", category: "Rock" },
  { genre: "screamo", category: "Rock" },
  { genre: "emo", category: "Rock" },
  { genre: "math rock", category: "Rock" },
  { genre: "mathcore", category: "Rock" },
  { genre: "rock en español", category: "Rock" },
  { genre: "glam rock", category: "Rock" },
  { genre: "aor", category: "Rock" },
  { genre: "yacht rock", category: "Rock" },
  { genre: "madchester", category: "Rock" },
  { genre: "alternative dance", category: "Rock" },
  { genre: "egg punk", category: "Rock" },
  { genre: "witch house", category: "Rock" },

  // Pop
  { genre: "pop", category: "Pop" },
  { genre: "acoustic pop", category: "Pop" },
  { genre: "art pop", category: "Pop" },
  { genre: "bedroom pop", category: "Pop" },
  { genre: "dream pop", category: "Pop" },
  { genre: "indie pop", category: "Pop" },
  { genre: "baroque pop", category: "Pop" },
  { genre: "pop soul", category: "Pop" },
  { genre: "soft pop", category: "Pop" },
  { genre: "synth pop", category: "Pop" },
  { genre: "synthpop", category: "Pop" },
  { genre: "chillwave", category: "Pop" },
  { genre: "city pop", category: "Pop" },
  { genre: "hyperpop", category: "Pop" },
  { genre: "taiwanese pop", category: "Pop" },
  { genre: "swedish pop", category: "Pop" },
  { genre: "deutsch pop", category: "Pop" },
  { genre: "german pop", category: "Pop" },
  { genre: "german indie pop", category: "Pop" },
  { genre: "french pop", category: "Pop" },
  { genre: "french indie pop", category: "Pop" },
  { genre: "dansband", category: "Pop" },
  { genre: "dansk pop", category: "Pop" },
  { genre: "schlager", category: "Pop" },
  { genre: "schlagerparty", category: "Pop" },
  { genre: "neue deutsche welle", category: "Pop" },
  { genre: "pop urbaine", category: "Pop" },
  { genre: "variété française", category: "Pop" },

  // Jazz & Blues
  { genre: "jazz", category: "Jazz" },
  { genre: "bebop", category: "Jazz" },
  { genre: "cool jazz", category: "Jazz" },
  { genre: "hard bop", category: "Jazz" },
  { genre: "free jazz", category: "Jazz" },
  { genre: "jazz fusion", category: "Jazz" },
  { genre: "nu jazz", category: "Jazz" },
  { genre: "jazz funk", category: "Jazz" },
  { genre: "jazz blues", category: "Jazz" },
  { genre: "jazz house", category: "Jazz" },
  { genre: "smooth jazz", category: "Jazz" },
  { genre: "vocal jazz", category: "Jazz" },
  { genre: "latin jazz", category: "Jazz" },
  { genre: "brazilian jazz", category: "Jazz" },
  { genre: "french jazz", category: "Jazz" },
  { genre: "acid jazz", category: "Jazz" },
  { genre: "indie jazz", category: "Jazz" },
  { genre: "jazz beats", category: "Jazz" },
  { genre: "big band", category: "Jazz" },
  { genre: "blues", category: "Jazz" },
  { genre: "soul blues", category: "Jazz" },
  { genre: "doo-wop", category: "Jazz" },
  { genre: "ragtime", category: "Jazz" },
  { genre: "boogie-woogie", category: "Jazz" },
  { genre: "swing music", category: "Jazz" },

  // Soul & R&B
  { genre: "r&b", category: "Soul" },
  { genre: "alternative r&b", category: "Soul" },
  { genre: "dark r&b", category: "Soul" },
  { genre: "uk r&b", category: "Soul" },
  { genre: "afro r&b", category: "Soul" },
  { genre: "j-r&b", category: "Soul" },
  { genre: "french r&b", category: "Soul" },
  { genre: "soul", category: "Soul" },
  { genre: "indie soul", category: "Soul" },
  { genre: "neo soul", category: "Soul" },
  { genre: "retro soul", category: "Soul" },
  { genre: "gospel r&b", category: "Soul" },
  { genre: "new jack swing", category: "Soul" },
  { genre: "motown", category: "Soul" },
  { genre: "philly soul", category: "Soul" },
  { genre: "lovers rock", category: "Soul" },
  { genre: "trap soul", category: "Soul" },

  // Reggae
  { genre: "reggae", category: "Reggae" },
  { genre: "roots reggae", category: "Reggae" },
  { genre: "reggaeton", category: "Reggae" },
  { genre: "ragga", category: "Reggae" },
  { genre: "nz reggae", category: "Reggae" },
  { genre: "azonto", category: "Reggae" },
  { genre: "kuduro", category: "Reggae" },
  { genre: "soca", category: "Reggae" },

  // Folk & Indie
  { genre: "folk", category: "Indie" },
  { genre: "folk metal", category: "Indie" },
  { genre: "indie", category: "Indie" },
  { genre: "indie jazz", category: "Indie" },
  { genre: "ambient folk", category: "Indie" },
  { genre: "anti-folk", category: "Indie" },
  { genre: "singer-songwriter", category: "Indie" },
  { genre: "christian folk", category: "Indie" },
  { genre: "german indie", category: "Indie" },
  { genre: "lo-fi", category: "Indie" },
  { genre: "lo-fi beats", category: "Indie" },
  { genre: "lo-fi hip hop", category: "Indie" },
  { genre: "lo-fi house", category: "Indie" },
  { genre: "lo-fi indie", category: "Indie" },
  { genre: "chillhop", category: "Indie" },
  { genre: "beats", category: "Indie" },
  { genre: "chillstep", category: "Indie" },
  { genre: "downtempo", category: "Indie" },
  // Classical
  { genre: "classical", category: "Classical" },
  { genre: "classical piano", category: "Classical" },
  { genre: "orchestral", category: "Classical" },
  { genre: "chamber music", category: "Classical" },
  { genre: "choral", category: "Classical" },
  { genre: "requiem", category: "Classical" },
  { genre: "neoclassical", category: "Classical" },
  { genre: "medieval", category: "Classical" },
  { genre: "new age", category: "Classical" },
  { genre: "space music", category: "Classical" },
  { genre: "exotica", category: "Classical" },
  { genre: "bolero", category: "Classical" },

  // Country
  { genre: "country", category: "Country" },
  { genre: "classic country", category: "Country" },
  { genre: "outlaw country", category: "Country" },
  { genre: "red dirt", category: "Country" },
  { genre: "texas country", category: "Country" },
  { genre: "bluegrass", category: "Country" },

  // Latin & World
  { genre: "latin", category: "Latin" },
  { genre: "latin rock", category: "Latin" },
  { genre: "latin folk", category: "Latin" },
  { genre: "latin hip hop", category: "Latin" },
  { genre: "latin alternative", category: "Latin" },
  { genre: "urbano latino", category: "Latin" },
  { genre: "trap latino", category: "Latin" },
  { genre: "salsa", category: "Latin" },
  { genre: "timba", category: "Latin" },
  { genre: "son cubano", category: "Latin" },
  { genre: "banda", category: "Latin" },
  { genre: "mariachi", category: "Latin" },
  { genre: "corrido", category: "Latin" },
  { genre: "corridos belicos", category: "Latin" },
  { genre: "corridos bélicos", category: "Latin" },
  { genre: "corridos tumbados", category: "Latin" },
  { genre: "sierreño", category: "Latin" },
  { genre: "sad sierreño", category: "Latin" },
  { genre: "música mexicana", category: "Latin" },
  { genre: "mexican rock", category: "Latin" },
  { genre: "mexican hip hop", category: "Latin" },
  { genre: "colombian pop", category: "Latin" },
  { genre: "champeta", category: "Latin" },
  { genre: "afrobeat", category: "Latin" },
  { genre: "afrobeats", category: "Latin" },
  { genre: "afropop", category: "Latin" },
  { genre: "afropiano", category: "Latin" },
  { genre: "afroswing", category: "Latin" },
  { genre: "maskandi", category: "Latin" },
  { genre: "brazilian bass", category: "Latin" },
  { genre: "brazilian phonk", category: "Latin" },
  { genre: "brazilian trap", category: "Latin" },
  { genre: "bossa nova", category: "Latin" },
  { genre: "samba", category: "Latin" },
  { genre: "funk melody", category: "Latin" },
  { genre: "bhangra", category: "Latin" },
  { genre: "punjabi pop", category: "Latin" },
  { genre: "bollywood", category: "Latin" },
  { genre: "flamenco", category: "Latin" },
  { genre: "arabic pop", category: "Latin" },
  { genre: "sea shanties", category: "Latin" },
  { genre: "cha cha cha", category: "Latin" },
  { genre: "mambo", category: "Latin" },

  // Metal
  { genre: "metal", category: "Metal" },
  { genre: "heavy metal", category: "Metal" },
  { genre: "alternative metal", category: "Metal" },
  { genre: "black metal", category: "Metal" },
  { genre: "death metal", category: "Metal" },
  { genre: "melodic death metal", category: "Metal" },
  { genre: "deathcore", category: "Metal" },
  { genre: "grindcore", category: "Metal" },
  { genre: "doom metal", category: "Metal" },
  { genre: "gothic metal", category: "Metal" },
  { genre: "groove metal", category: "Metal" },
  { genre: "symphonic metal", category: "Metal" },
  { genre: "metalcore", category: "Metal" },
  { genre: "glam metal", category: "Metal" },
  { genre: "power metal", category: "Metal" },
  { genre: "medieval metal", category: "Metal" },
  { genre: "speed metal", category: "Metal" },
  { genre: "thrash metal", category: "Metal" },
  { genre: "trap metal", category: "Metal" },
  { genre: "folk metal", category: "Metal" },
  { genre: "nu metal", category: "Metal" },

  // Experimental
  { genre: "ambient", category: "Experimental" },
  { genre: "dark ambient", category: "Experimental" },
  { genre: "experimental", category: "Experimental" },
  { genre: "avant-garde", category: "Experimental" },
  { genre: "vaporwave", category: "Experimental" },
  { genre: "glitch", category: "Experimental" },
  { genre: "nightcore", category: "Experimental" },
  { genre: "spoken word", category: "Experimental" },
  { genre: "comedy", category: "Experimental" },
  { genre: "musicals", category: "Experimental" },
  { genre: "soundtrack", category: "Experimental" },
  { genre: "children's music", category: "Experimental" },
  { genre: "christmas", category: "Experimental" },
  { genre: "anime", category: "Experimental" },
  { genre: "trip hop", category: "Experimental" },

  // Funk & Groove
  { genre: "funk", category: "Funk" },
  { genre: "g-funk", category: "Funk" },
  { genre: "freestyle", category: "Funk" },

  // Spiritual
  { genre: "gospel", category: "Spiritual" },
  { genre: "pentecostal", category: "Spiritual" },
  { genre: "christian", category: "Spiritual" },
  { genre: "christian alternative rock", category: "Spiritual" },
  { genre: "christian country", category: "Spiritual" },
  { genre: "african gospel", category: "Spiritual" },

  // Asian Pop
  { genre: "j-pop", category: "Asian Pop" },
  { genre: "k-pop", category: "Asian Pop" },
  { genre: "k-rock", category: "Asian Pop" },
  { genre: "k-rap", category: "Asian Pop" },
  { genre: "k-ballad", category: "Asian Pop" },
  { genre: "mandopop", category: "Asian Pop" },
  { genre: "c-pop", category: "Asian Pop" },
  { genre: "j-rock", category: "Asian Pop" },
  { genre: "j-rap", category: "Asian Pop" },
  { genre: "j-r&b", category: "Asian Pop" },
  { genre: "japanese indie", category: "Asian Pop" },
  { genre: "visual kei", category: "Asian Pop" },
  { genre: "shibuya-kei", category: "Asian Pop" },
  { genre: "enka", category: "Asian Pop" },
  { genre: "kayokyoku", category: "Asian Pop" },
  { genre: "vocaloid", category: "Asian Pop" },

  // Specialty
  { genre: "adult standards", category: "Specialty" },
  { genre: "opera", category: "Specialty" },
];

/**
 * Normalisiert einen Genre-Namen für konsistentes Matching
 * Konvertiert sowohl Bindestriche als auch Leerzeichen
 */
function normalizeForMatching(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[-\s]+/g, " "); // Alle Bindestriche und Leerzeichen zu einzelnem Leerzeichen
}

/**
 * Erstellt eine schnelle Lookup-Map für Genre-zu-Kategorie-Mapping
 */
let genreCategoryMapCache: Map<string, GenreCategory> | null = null;

export function createGenreCategoryMap(): Map<string, GenreCategory> {
  if (genreCategoryMapCache) return genreCategoryMapCache;
  
  const map = new Map<string, GenreCategory>();
  for (const { genre, category } of GENRE_MAPPING) {
    // Speichere mit normalisiertem Key für flexibles Matching
    const normalizedKey = normalizeForMatching(genre);
    map.set(normalizedKey, category);
  }
  genreCategoryMapCache = map;
  return map;
}

/**
 * Gibt die Obergruppe für ein bestimmtes Genre zurück
 * Behandelt unterschiedliche Schreibweisen (lo-fi vs lo fi)
 */
export function getGenreCategory(genreName: string): GenreCategory {
  const map = createGenreCategoryMap();
  const normalized = normalizeForMatching(genreName);
  return map.get(normalized) || "Specialty";
}

/**
 * Gibt alle Genres einer bestimmten Kategorie zurück
 */
export function getGenresByCategory(category: GenreCategory): string[] {
  return GENRE_MAPPING.filter(g => g.category === category).map(g => g.genre);
}

/**
 * Gibt alle verfügbaren Kategorien in Ordnung zurück
 */
export function getAllCategories(): GenreCategory[] {
  const categories: GenreCategory[] = [
    "Hip Hop",
    "Electronic",
    "Rock",
    "Pop",
    "Jazz",
    "Soul",
    "Reggae",
    "Indie",
    "Classical",
    "Country",
    "Latin",
    "Metal",
    "Experimental",
    "Funk",
    "Spiritual",
    "Asian Pop",
    "Specialty"
  ];
  return categories;
}
