/**
 * Genre-zu-Obergruppen Mapping
 * Organisiert alle Genres in semantisch sinnvolle Oberkategorien
 * für bessere Visualisierung und Navigation im Graph
 */

export type GenreCategory = 
  | "Hip Hop & Rap"
  | "Electronic"
  | "Rock & Punk"
  | "Pop"
  | "Jazz & Blues"
  | "Soul & R&B"
  | "Reggae"
  | "Folk & Indie"
  | "Classical"
  | "Country"
  | "Latin & World"
  | "Metal"
  | "Experimental"
  | "Funk & Groove"
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
  { genre: "hip hop", category: "Hip Hop & Rap" },
  { genre: "rap", category: "Hip Hop & Rap" },
  { genre: "trap", category: "Hip Hop & Rap" },
  { genre: "cloud rap", category: "Hip Hop & Rap" },
  { genre: "conscious hip hop", category: "Hip Hop & Rap" },
  { genre: "east coast hip hop", category: "Hip Hop & Rap" },
  { genre: "west coast hip hop", category: "Hip Hop & Rap" },
  { genre: "southern hip hop", category: "Hip Hop & Rap" },
  { genre: "midwest emo", category: "Hip Hop & Rap" },
  { genre: "gangsta rap", category: "Hip Hop & Rap" },
  { genre: "gangster rap", category: "Hip Hop & Rap" },
  { genre: "horrorcore", category: "Hip Hop & Rap" },
  { genre: "rage rap", category: "Hip Hop & Rap" },
  { genre: "sad rap", category: "Hip Hop & Rap" },
  { genre: "melodic rap", category: "Hip Hop & Rap" },
  { genre: "emo rap", category: "Hip Hop & Rap" },
  { genre: "underground hip hop", category: "Hip Hop & Rap" },
  { genre: "old school hip hop", category: "Hip Hop & Rap" },
  { genre: "boom bap", category: "Hip Hop & Rap" },
  { genre: "hardcore hip hop", category: "Hip Hop & Rap" },
  { genre: "experimental hip hop", category: "Hip Hop & Rap" },
  { genre: "alternative hip hop", category: "Hip Hop & Rap" },
  { genre: "jazz rap", category: "Hip Hop & Rap" },
  { genre: "german hip hop", category: "Hip Hop & Rap" },
  { genre: "deutschrap", category: "Hip Hop & Rap" },
  { genre: "arab hip hop", category: "Hip Hop & Rap" },
  { genre: "arabic hip hop", category: "Hip Hop & Rap" },
  { genre: "brooklyn drill", category: "Hip Hop & Rap" },
  { genre: "chicago drill", category: "Hip Hop & Rap" },
  { genre: "new york drill", category: "Hip Hop & Rap" },
  { genre: "uk drill", category: "Hip Hop & Rap" },
  { genre: "drill", category: "Hip Hop & Rap" },
  { genre: "country hip hop", category: "Hip Hop & Rap" },
  { genre: "desi hip hop", category: "Hip Hop & Rap" },
  { genre: "egyptian hip hop", category: "Hip Hop & Rap" },
  { genre: "french rap", category: "Hip Hop & Rap" },
  { genre: "norwegian hip hop", category: "Hip Hop & Rap" },
  { genre: "pinoy hip hop", category: "Hip Hop & Rap" },
  { genre: "turkish hip hop", category: "Hip Hop & Rap" },
  { genre: "mexican hip hop", category: "Hip Hop & Rap" },
  { genre: "drift phonk", category: "Hip Hop & Rap" },
  { genre: "phonk", category: "Hip Hop & Rap" },
  { genre: "christian hip hop", category: "Hip Hop & Rap" },
  { genre: "anime rap", category: "Hip Hop & Rap" },
  { genre: "sexy drill", category: "Hip Hop & Rap" },
  { genre: "argentinian trap", category: "Hip Hop & Rap" },
  { genre: "argentine trap", category: "Hip Hop & Rap" },
  { genre: "rap metal", category: "Hip Hop & Rap" },
  { genre: "rap rock", category: "Hip Hop & Rap" },
  { genre: "funk rap", category: "Hip Hop & Rap" },
  { genre: "rap québécois", category: "Hip Hop & Rap" },

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
  { genre: "rock", category: "Rock & Punk" },
  { genre: "rock and roll", category: "Rock & Punk" },
  { genre: "alternative rock", category: "Rock & Punk" },
  { genre: "soft rock", category: "Rock & Punk" },
  { genre: "hard rock", category: "Rock & Punk" },
  { genre: "classic rock", category: "Rock & Punk" },
  { genre: "art rock", category: "Rock & Punk" },
  { genre: "psychedelic rock", category: "Rock & Punk" },
  { genre: "garage rock", category: "Rock & Punk" },
  { genre: "punk", category: "Rock & Punk" },
  { genre: "hardcore punk", category: "Rock & Punk" },
  { genre: "post-punk", category: "Rock & Punk" },
  { genre: "post-hardcore", category: "Rock & Punk" },
  { genre: "pop punk", category: "Rock & Punk" },
  { genre: "skate punk", category: "Rock & Punk" },
  { genre: "melodic hardcore", category: "Rock & Punk" },
  { genre: "grunge", category: "Rock & Punk" },
  { genre: "post-grunge", category: "Rock & Punk" },
  { genre: "noise rock", category: "Rock & Punk" },
  { genre: "shoegaze", category: "Rock & Punk" },
  { genre: "jangle pop", category: "Rock & Punk" },
  { genre: "indie rock", category: "Rock & Punk" },
  { genre: "britpop", category: "Rock & Punk" },
  { genre: "gothic rock", category: "Rock & Punk" },
  { genre: "darkwave", category: "Rock & Punk" },
  { genre: "new wave", category: "Rock & Punk" },
  { genre: "synthwave", category: "Rock & Punk" },
  { genre: "neo-psychedelic", category: "Rock & Punk" },
  { genre: "rockabilly", category: "Rock & Punk" },
  { genre: "blues rock", category: "Rock & Punk" },
  { genre: "reggae rock", category: "Rock & Punk" },
  { genre: "surf rock", category: "Rock & Punk" },
  { genre: "celtic rock", category: "Rock & Punk" },
  { genre: "folk rock", category: "Rock & Punk" },
  { genre: "country rock", category: "Rock & Punk" },
  { genre: "southern gothic", category: "Rock & Punk" },
  { genre: "southern rock", category: "Rock & Punk" },
  { genre: "riot grrrl", category: "Rock & Punk" },
  { genre: "riot grrl", category: "Rock & Punk" },
  { genre: "screamo", category: "Rock & Punk" },
  { genre: "emo", category: "Rock & Punk" },
  { genre: "math rock", category: "Rock & Punk" },
  { genre: "mathcore", category: "Rock & Punk" },
  { genre: "rock en español", category: "Rock & Punk" },
  { genre: "glam rock", category: "Rock & Punk" },
  { genre: "aor", category: "Rock & Punk" },
  { genre: "yacht rock", category: "Rock & Punk" },
  { genre: "madchester", category: "Rock & Punk" },
  { genre: "alternative dance", category: "Rock & Punk" },
  { genre: "egg punk", category: "Rock & Punk" },
  { genre: "witch house", category: "Rock & Punk" },

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
  { genre: "jazz", category: "Jazz & Blues" },
  { genre: "bebop", category: "Jazz & Blues" },
  { genre: "cool jazz", category: "Jazz & Blues" },
  { genre: "hard bop", category: "Jazz & Blues" },
  { genre: "free jazz", category: "Jazz & Blues" },
  { genre: "jazz fusion", category: "Jazz & Blues" },
  { genre: "nu jazz", category: "Jazz & Blues" },
  { genre: "jazz funk", category: "Jazz & Blues" },
  { genre: "jazz blues", category: "Jazz & Blues" },
  { genre: "jazz house", category: "Jazz & Blues" },
  { genre: "smooth jazz", category: "Jazz & Blues" },
  { genre: "vocal jazz", category: "Jazz & Blues" },
  { genre: "latin jazz", category: "Jazz & Blues" },
  { genre: "brazilian jazz", category: "Jazz & Blues" },
  { genre: "french jazz", category: "Jazz & Blues" },
  { genre: "acid jazz", category: "Jazz & Blues" },
  { genre: "indie jazz", category: "Jazz & Blues" },
  { genre: "jazz beats", category: "Jazz & Blues" },
  { genre: "big band", category: "Jazz & Blues" },
  { genre: "blues", category: "Jazz & Blues" },
  { genre: "soul blues", category: "Jazz & Blues" },
  { genre: "doo-wop", category: "Jazz & Blues" },
  { genre: "ragtime", category: "Jazz & Blues" },
  { genre: "boogie-woogie", category: "Jazz & Blues" },
  { genre: "swing music", category: "Jazz & Blues" },

  // Soul & R&B
  { genre: "r&b", category: "Soul & R&B" },
  { genre: "alternative r&b", category: "Soul & R&B" },
  { genre: "dark r&b", category: "Soul & R&B" },
  { genre: "uk r&b", category: "Soul & R&B" },
  { genre: "afro r&b", category: "Soul & R&B" },
  { genre: "j-r&b", category: "Soul & R&B" },
  { genre: "french r&b", category: "Soul & R&B" },
  { genre: "soul", category: "Soul & R&B" },
  { genre: "indie soul", category: "Soul & R&B" },
  { genre: "neo soul", category: "Soul & R&B" },
  { genre: "retro soul", category: "Soul & R&B" },
  { genre: "gospel r&b", category: "Soul & R&B" },
  { genre: "new jack swing", category: "Soul & R&B" },
  { genre: "motown", category: "Soul & R&B" },
  { genre: "philly soul", category: "Soul & R&B" },
  { genre: "lovers rock", category: "Soul & R&B" },
  { genre: "trap soul", category: "Soul & R&B" },

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
  { genre: "folk", category: "Folk & Indie" },
  { genre: "folk metal", category: "Folk & Indie" },
  { genre: "indie", category: "Folk & Indie" },
  { genre: "indie jazz", category: "Folk & Indie" },
  { genre: "ambient folk", category: "Folk & Indie" },
  { genre: "anti-folk", category: "Folk & Indie" },
  { genre: "singer-songwriter", category: "Folk & Indie" },
  { genre: "christian folk", category: "Folk & Indie" },
  { genre: "german indie", category: "Folk & Indie" },
  { genre: "lo-fi", category: "Folk & Indie" },
  { genre: "lo-fi beats", category: "Folk & Indie" },
  { genre: "lo-fi hip hop", category: "Folk & Indie" },
  { genre: "lo-fi house", category: "Folk & Indie" },
  { genre: "lo-fi indie", category: "Folk & Indie" },
  { genre: "chillhop", category: "Folk & Indie" },
  { genre: "beats", category: "Folk & Indie" },
  { genre: "chillstep", category: "Folk & Indie" },
  { genre: "downtempo", category: "Folk & Indie" },

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
  { genre: "latin", category: "Latin & World" },
  { genre: "latin rock", category: "Latin & World" },
  { genre: "latin folk", category: "Latin & World" },
  { genre: "latin hip hop", category: "Latin & World" },
  { genre: "latin alternative", category: "Latin & World" },
  { genre: "urbano latino", category: "Latin & World" },
  { genre: "trap latino", category: "Latin & World" },
  { genre: "salsa", category: "Latin & World" },
  { genre: "timba", category: "Latin & World" },
  { genre: "son cubano", category: "Latin & World" },
  { genre: "banda", category: "Latin & World" },
  { genre: "mariachi", category: "Latin & World" },
  { genre: "corrido", category: "Latin & World" },
  { genre: "corridos belicos", category: "Latin & World" },
  { genre: "corridos bélicos", category: "Latin & World" },
  { genre: "corridos tumbados", category: "Latin & World" },
  { genre: "sierreño", category: "Latin & World" },
  { genre: "sad sierreño", category: "Latin & World" },
  { genre: "música mexicana", category: "Latin & World" },
  { genre: "mexican rock", category: "Latin & World" },
  { genre: "mexican hip hop", category: "Latin & World" },
  { genre: "colombian pop", category: "Latin & World" },
  { genre: "champeta", category: "Latin & World" },
  { genre: "afrobeat", category: "Latin & World" },
  { genre: "afrobeats", category: "Latin & World" },
  { genre: "afropop", category: "Latin & World" },
  { genre: "afropiano", category: "Latin & World" },
  { genre: "afroswing", category: "Latin & World" },
  { genre: "maskandi", category: "Latin & World" },
  { genre: "brazilian bass", category: "Latin & World" },
  { genre: "brazilian phonk", category: "Latin & World" },
  { genre: "brazilian trap", category: "Latin & World" },
  { genre: "bossa nova", category: "Latin & World" },
  { genre: "samba", category: "Latin & World" },
  { genre: "funk melody", category: "Latin & World" },
  { genre: "bhangra", category: "Latin & World" },
  { genre: "punjabi pop", category: "Latin & World" },
  { genre: "bollywood", category: "Latin & World" },
  { genre: "flamenco", category: "Latin & World" },
  { genre: "arabic pop", category: "Latin & World" },
  { genre: "sea shanties", category: "Latin & World" },
  { genre: "cha cha cha", category: "Latin & World" },
  { genre: "mambo", category: "Latin & World" },

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
  { genre: "funk", category: "Funk & Groove" },
  { genre: "g-funk", category: "Funk & Groove" },
  { genre: "freestyle", category: "Funk & Groove" },

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
    "Hip Hop & Rap",
    "Electronic",
    "Rock & Punk",
    "Pop",
    "Jazz & Blues",
    "Soul & R&B",
    "Reggae",
    "Folk & Indie",
    "Classical",
    "Country",
    "Latin & World",
    "Metal",
    "Experimental",
    "Funk & Groove",
    "Spiritual",
    "Asian Pop",
    "Specialty"
  ];
  return categories;
}
