/**
 * Genre-zu-Obergruppen Mapping
 * Organisiert alle Genres in semantisch sinnvolle Oberkategorien
 * für bessere Visualisierung und Navigation im Graph
 */

export type GenreCategory = 
  | "Hip Hop & Rap"
  | "Electronic & Dance"
  | "Rock & Punk"
  | "Pop"
  | "Jazz & Blues"
  | "Soul & R&B"
  | "Reggae & Caribbean"
  | "Folk & Indie"
  | "Classical & Orchestral"
  | "Country & Americana"
  | "Latin & World"
  | "Metal & Hardcore"
  | "Metal"
  | "Experimental & Ambient"
  | "Funk & Groove"
  | "Gospel & Spiritual"
  | "Asian Pop"
  | "Specialty & Other";

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
  { genre: "brazilian phonk", category: "Hip Hop & Rap" },
  { genre: "drift phonk", category: "Hip Hop & Rap" },
  { genre: "phonk", category: "Hip Hop & Rap" },
  { genre: "trap latino", category: "Hip Hop & Rap" },
  { genre: "trap metal", category: "Hip Hop & Rap" },
  { genre: "trap soul", category: "Hip Hop & Rap" },
  { genre: "christian hip hop", category: "Hip Hop & Rap" },
  { genre: "anime rap", category: "Hip Hop & Rap" },
  { genre: "sexy drill", category: "Hip Hop & Rap" },
  { genre: "argentinian trap", category: "Hip Hop & Rap" },
  { genre: "argentine trap", category: "Hip Hop & Rap" },
  { genre: "rap metal", category: "Hip Hop & Rap" },
  { genre: "rap rock", category: "Hip Hop & Rap" },
  { genre: "funk rap", category: "Hip Hop & Rap" },
  { genre: "rap québécois", category: "Hip Hop & Rap" },

  // Electronic & Dance
  { genre: "edm", category: "Electronic & Dance" },
  { genre: "electronic", category: "Electronic & Dance" },
  { genre: "electronica", category: "Electronic & Dance" },
  { genre: "dance", category: "Electronic & Dance" },
  { genre: "house", category: "Electronic & Dance" },
  { genre: "deep house", category: "Electronic & Dance" },
  { genre: "chicago house", category: "Electronic & Dance" },
  { genre: "french house", category: "Electronic & Dance" },
  { genre: "acid house", category: "Electronic & Dance" },
  { genre: "hard house", category: "Electronic & Dance" },
  { genre: "progressive house", category: "Electronic & Dance" },
  { genre: "melodic house", category: "Electronic & Dance" },
  { genre: "techno", category: "Electronic & Dance" },
  { genre: "minimal techno", category: "Electronic & Dance" },
  { genre: "acid techno", category: "Electronic & Dance" },
  { genre: "hard techno", category: "Electronic & Dance" },
  { genre: "melodic techno", category: "Electronic & Dance" },
  { genre: "hardcore techno", category: "Electronic & Dance" },
  { genre: "hypertechno", category: "Electronic & Dance" },
  { genre: "electro", category: "Electronic & Dance" },
  { genre: "electro house", category: "Electronic & Dance" },
  { genre: "electro swing", category: "Electronic & Dance" },
  { genre: "electropop", category: "Electronic & Dance" },
  { genre: "electroclash", category: "Electronic & Dance" },
  { genre: "eurodance", category: "Electronic & Dance" },
  { genre: "europop", category: "Electronic & Dance" },
  { genre: "edm trap", category: "Electronic & Dance" },
  { genre: "future house", category: "Electronic & Dance" },
  { genre: "future bass", category: "Electronic & Dance" },
  { genre: "bass house", category: "Electronic & Dance" },
  { genre: "bassline", category: "Electronic & Dance" },
  { genre: "trance", category: "Electronic & Dance" },
  { genre: "progressive trance", category: "Electronic & Dance" },
  { genre: "psytrance", category: "Electronic & Dance" },
  { genre: "grime", category: "Electronic & Dance" },
  { genre: "uk garage", category: "Electronic & Dance" },
  { genre: "uk funky", category: "Electronic & Dance" },
  { genre: "jersey club", category: "Electronic & Dance" },
  { genre: "breakbeat", category: "Electronic & Dance" },
  { genre: "drum and bass", category: "Electronic & Dance" },
  { genre: "jungle", category: "Electronic & Dance" },
  { genre: "drumstep", category: "Electronic & Dance" },
  { genre: "liquid funk", category: "Electronic & Dance" },
  { genre: "breakcore", category: "Electronic & Dance" },
  { genre: "dubstep", category: "Electronic & Dance" },
  { genre: "dub", category: "Electronic & Dance" },
  { genre: "riddim", category: "Electronic & Dance" },
  { genre: "dubstep", category: "Electronic & Dance" },
  { genre: "riddim", category: "Electronic & Dance" },
  { genre: "moombahton", category: "Electronic & Dance" },
  { genre: "tropical house", category: "Electronic & Dance" },
  { genre: "dancehall", category: "Electronic & Dance" },
  { genre: "new rave", category: "Electronic & Dance" },
  { genre: "gabber", category: "Electronic & Dance" },
  { genre: "hardstyle", category: "Electronic & Dance" },
  { genre: "happy hardcore", category: "Electronic & Dance" },
  { genre: "speedcore", category: "Electronic & Dance" },
  { genre: "hypercore", category: "Electronic & Dance" },
  { genre: "hyperpop", category: "Electronic & Dance" },
  { genre: "tekno", category: "Electronic & Dance" },
  { genre: "glitch", category: "Electronic & Dance" },
  { genre: "slap house", category: "Electronic & Dance" },
  { genre: "stutter house", category: "Electronic & Dance" },
  { genre: "big beat", category: "Electronic & Dance" },
  { genre: "big room", category: "Electronic & Dance" },
  { genre: "italo dance", category: "Electronic & Dance" },
  { genre: "italo disco", category: "Electronic & Dance" },
  { genre: "disco", category: "Electronic & Dance" },
  { genre: "disco house", category: "Electronic & Dance" },
  { genre: "post-disco", category: "Electronic & Dance" },
  { genre: "australia techno", category: "Electronic & Dance" },
  { genre: "melbourne bounce", category: "Electronic & Dance" },
  { genre: "bounce", category: "Electronic & Dance" },
  { genre: "crunk", category: "Electronic & Dance" },
  { genre: "hyphy", category: "Electronic & Dance" },
  { genre: "miami bass", category: "Electronic & Dance" },
  { genre: "new orleans bounce", category: "Electronic & Dance" },
  { genre: "hip house", category: "Electronic & Dance" },
  { genre: "g-house", category: "Electronic & Dance" },
  { genre: "afro house", category: "Electronic & Dance" },
  { genre: "afro tech", category: "Electronic & Dance" },
  { genre: "rally house", category: "Electronic & Dance" },
  { genre: "electro corridos", category: "Electronic & Dance" },
  { genre: "coldwave", category: "Electronic & Dance" },
  { genre: "cold wave", category: "Electronic & Dance" },

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
  { genre: "cold wave", category: "Rock & Punk" },
  { genre: "new wave", category: "Rock & Punk" },
  { genre: "synthwave", category: "Rock & Punk" },
  { genre: "neo-psychedelic", category: "Rock & Punk" },
  { genre: "rockabilly", category: "Rock & Punk" },
  { genre: "blues rock", category: "Rock & Punk" },
  { genre: "funk rock", category: "Rock & Punk" },
  { genre: "reggae rock", category: "Rock & Punk" },
  { genre: "surf rock", category: "Rock & Punk" },
  { genre: "celtic rock", category: "Rock & Punk" },
  { genre: "chinese rock", category: "Rock & Punk" },
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
  { genre: "metalcore", category: "Rock & Punk" },
  { genre: "christian rock", category: "Rock & Punk" },
  { genre: "christian alternative rock", category: "Rock & Punk" },
  { genre: "visual kei", category: "Rock & Punk" },
  { genre: "j-rock", category: "Rock & Punk" },
  { genre: "rock en español", category: "Rock & Punk" },
  { genre: "mexican rock", category: "Rock & Punk" },
  { genre: "glam rock", category: "Rock & Punk" },
  { genre: "glam metal", category: "Rock & Punk" },
  { genre: "aor", category: "Rock & Punk" },
  { genre: "yacht rock", category: "Rock & Punk" },
  { genre: "madchester", category: "Rock & Punk" },
  { genre: "alternative dance", category: "Rock & Punk" },
  { genre: "egg punk", category: "Rock & Punk" },
  { genre: "slowcore", category: "Rock & Punk" },
  { genre: "witch house", category: "Rock & Punk" },

  // Pop
  { genre: "pop", category: "Pop" },
  { genre: "acoustic pop", category: "Pop" },
  { genre: "art pop", category: "Pop" },
  { genre: "bedroom pop", category: "Pop" },
  { genre: "dream pop", category: "Pop" },
  { genre: "electropop", category: "Pop" },
  { genre: "indie pop", category: "Pop" },
  { genre: "baroque pop", category: "Pop" },
  { genre: "pop soul", category: "Pop" },
  { genre: "soft pop", category: "Pop" },
  { genre: "synth pop", category: "Pop" },
  { genre: "synthpop", category: "Pop" },
  { genre: "chillwave", category: "Pop" },
  { genre: "city pop", category: "Pop" },
  { genre: "hyperpop", category: "Pop" },
  { genre: "j-pop", category: "Pop" },
  { genre: "k-pop", category: "Pop" },
  { genre: "mandopop", category: "Pop" },
  { genre: "taiwanese pop", category: "Pop" },
  { genre: "c-pop", category: "Pop" },
  { genre: "swedish pop", category: "Pop" },
  { genre: "deutsch pop", category: "Pop" },
  { genre: "german pop", category: "Pop" },
  { genre: "german indie pop", category: "Pop" },
  { genre: "french pop", category: "Pop" },
  { genre: "french indie pop", category: "Pop" },
  { genre: "dansband", category: "Pop" },
  { genre: "dansk pop", category: "Pop" },
  { genre: "colombian pop", category: "Pop" },
  { genre: "latin pop", category: "Pop" },
  { genre: "schlager", category: "Pop" },
  { genre: "schlagerparty", category: "Pop" },
  { genre: "neue deutsche welle", category: "Pop" },
  { genre: "europop", category: "Pop" },
  { genre: "pop urbaine", category: "Pop" },
  { genre: "variété française", category: "Pop" },
  { genre: "shibuya-kei", category: "Pop" },
  { genre: "vocaloid", category: "Pop" },
  { genre: "nightcore", category: "Pop" },

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
  { genre: "soul jazz", category: "Jazz & Blues" },
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
  { genre: "soul jazz", category: "Soul & R&B" },
  { genre: "gospel r&b", category: "Soul & R&B" },
  { genre: "new jack swing", category: "Soul & R&B" },
  { genre: "motown", category: "Soul & R&B" },
  { genre: "philly soul", category: "Soul & R&B" },
  { genre: "lovers rock", category: "Soul & R&B" },
  { genre: "pop soul", category: "Soul & R&B" },
  { genre: "trap soul", category: "Soul & R&B" },
  { genre: "k-ballad", category: "Soul & R&B" },

  // Reggae & Caribbean
  { genre: "reggae", category: "Reggae & Caribbean" },
  { genre: "roots reggae", category: "Reggae & Caribbean" },
  { genre: "reggae rock", category: "Reggae & Caribbean" },
  { genre: "reggaeton", category: "Reggae & Caribbean" },
  { genre: "dancehall", category: "Reggae & Caribbean" },
  { genre: "ragga", category: "Reggae & Caribbean" },
  { genre: "nz reggae", category: "Reggae & Caribbean" },
  { genre: "azonto", category: "Reggae & Caribbean" },
  { genre: "kuduro", category: "Reggae & Caribbean" },
  { genre: "soca", category: "Reggae & Caribbean" },

  // Folk & Indie
  { genre: "folk", category: "Folk & Indie" },
  { genre: "folk rock", category: "Folk & Indie" },
  { genre: "folk metal", category: "Folk & Indie" },
  { genre: "folk pop", category: "Folk & Indie" },
  { genre: "indie", category: "Folk & Indie" },
  { genre: "indie rock", category: "Folk & Indie" },
  { genre: "indie pop", category: "Folk & Indie" },
  { genre: "indie jazz", category: "Folk & Indie" },
  { genre: "indie soul", category: "Folk & Indie" },
  { genre: "ambient folk", category: "Folk & Indie" },
  { genre: "anti-folk", category: "Folk & Indie" },
  { genre: "singer-songwriter", category: "Folk & Indie" },
  { genre: "christian folk", category: "Folk & Indie" },
  { genre: "german indie", category: "Folk & Indie" },
  { genre: "german indie pop", category: "Folk & Indie" },
  { genre: "french indie pop", category: "Folk & Indie" },
  { genre: "japanese indie", category: "Folk & Indie" },
  { genre: "lo-fi", category: "Folk & Indie" },
  { genre: "lo-fi beats", category: "Folk & Indie" },
  { genre: "lo-fi hip hop", category: "Folk & Indie" },
  { genre: "lo-fi house", category: "Folk & Indie" },
  { genre: "lo-fi indie", category: "Folk & Indie" },
  { genre: "chillhop", category: "Folk & Indie" },
  { genre: "beats", category: "Folk & Indie" },
  { genre: "chillstep", category: "Folk & Indie" },
  { genre: "downtempo", category: "Folk & Indie" },
  { genre: "slowcore", category: "Folk & Indie" },

  // Classical & Orchestral
  { genre: "classical", category: "Classical & Orchestral" },
  { genre: "classical piano", category: "Classical & Orchestral" },
  { genre: "orchestral", category: "Classical & Orchestral" },
  { genre: "chamber music", category: "Classical & Orchestral" },
  { genre: "choral", category: "Classical & Orchestral" },
  { genre: "requiem", category: "Classical & Orchestral" },
  { genre: "neoclassical", category: "Classical & Orchestral" },
  { genre: "medieval", category: "Classical & Orchestral" },
  { genre: "baroque pop", category: "Classical & Orchestral" },
  { genre: "new age", category: "Classical & Orchestral" },
  { genre: "space music", category: "Classical & Orchestral" },
  { genre: "exotica", category: "Classical & Orchestral" },
  { genre: "enka", category: "Classical & Orchestral" },
  { genre: "kayokyoku", category: "Classical & Orchestral" },
  { genre: "bolero", category: "Classical & Orchestral" },

  // Country & Americana
  { genre: "country", category: "Country & Americana" },
  { genre: "classic country", category: "Country & Americana" },
  { genre: "outlaw country", category: "Country & Americana" },
  { genre: "red dirt", category: "Country & Americana" },
  { genre: "texas country", category: "Country & Americana" },
  { genre: "country rock", category: "Country & Americana" },
  { genre: "country hip hop", category: "Country & Americana" },
  { genre: "christian country", category: "Country & Americana" },
  { genre: "bluegrass", category: "Country & Americana" },

  // Latin & World
  { genre: "latin", category: "Latin & World" },
  { genre: "latin pop", category: "Latin & World" },
  { genre: "latin rock", category: "Latin & World" },
  { genre: "latin folk", category: "Latin & World" },
  { genre: "latin jazz", category: "Latin & World" },
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
  { genre: "african gospel", category: "Latin & World" },
  { genre: "maskandi", category: "Latin & World" },
  { genre: "brazilian bass", category: "Latin & World" },
  { genre: "brazilian jazz", category: "Latin & World" },
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

  // Metal & Hardcore
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

  // Experimental & Ambient
  { genre: "ambient", category: "Experimental & Ambient" },
  { genre: "dark ambient", category: "Experimental & Ambient" },
  { genre: "ambient folk", category: "Experimental & Ambient" },
  { genre: "experimental", category: "Experimental & Ambient" },
  { genre: "experimental hip hop", category: "Experimental & Ambient" },
  { genre: "avant-garde", category: "Experimental & Ambient" },
  { genre: "glitch", category: "Experimental & Ambient" },
  { genre: "noise rock", category: "Experimental & Ambient" },
  { genre: "industrial", category: "Experimental & Ambient" },
  { genre: "frenchcore", category: "Experimental & Ambient" },
  { genre: "gabber", category: "Experimental & Ambient" },
  { genre: "hardcore", category: "Experimental & Ambient" },
  { genre: "vaporwave", category: "Experimental & Ambient" },
  { genre: "spoken word", category: "Experimental & Ambient" },
  { genre: "comedy", category: "Experimental & Ambient" },
  { genre: "musicals", category: "Experimental & Ambient" },
  { genre: "soundtrack", category: "Experimental & Ambient" },
  { genre: "children's music", category: "Experimental & Ambient" },
  { genre: "christmas", category: "Experimental & Ambient" },
  { genre: "anime", category: "Experimental & Ambient" },
  { genre: "nightcore", category: "Experimental & Ambient" },
  { genre: "trip hop", category: "Experimental & Ambient" },

  // Funk & Groove
  { genre: "funk", category: "Funk & Groove" },
  { genre: "funk rock", category: "Funk & Groove" },
  { genre: "funk melody", category: "Funk & Groove" },
  { genre: "g-funk", category: "Funk & Groove" },
  { genre: "jazz funk", category: "Funk & Groove" },
  { genre: "liquid funk", category: "Funk & Groove" },
  { genre: "boogie-woogie", category: "Funk & Groove" },
  { genre: "freestyle", category: "Funk & Groove" },

  // Gospel & Spiritual
  { genre: "gospel", category: "Gospel & Spiritual" },
  { genre: "gospel r&b", category: "Gospel & Spiritual" },
  { genre: "pentecostal", category: "Gospel & Spiritual" },
  { genre: "christian", category: "Gospel & Spiritual" },
  { genre: "christian alternative rock", category: "Gospel & Spiritual" },
  { genre: "christian country", category: "Gospel & Spiritual" },
  { genre: "christian folk", category: "Gospel & Spiritual" },
  { genre: "christian hip hop", category: "Gospel & Spiritual" },
  { genre: "christian rock", category: "Gospel & Spiritual" },
  { genre: "african gospel", category: "Gospel & Spiritual" },

  // Asian Pop
  { genre: "j-pop", category: "Asian Pop" },
  { genre: "k-pop", category: "Asian Pop" },
  { genre: "k-rock", category: "Asian Pop" },
  { genre: "k-rap", category: "Asian Pop" },
  { genre: "k-ballad", category: "Asian Pop" },
  { genre: "c-pop", category: "Asian Pop" },
  { genre: "mandopop", category: "Asian Pop" },
  { genre: "taiwanese pop", category: "Asian Pop" },
  { genre: "j-rock", category: "Asian Pop" },
  { genre: "j-rap", category: "Asian Pop" },
  { genre: "j-r&b", category: "Asian Pop" },
  { genre: "japanese indie", category: "Asian Pop" },
  { genre: "visual kei", category: "Asian Pop" },
  { genre: "shibuya-kei", category: "Asian Pop" },
  { genre: "enka", category: "Asian Pop" },
  { genre: "kayokyoku", category: "Asian Pop" },
  { genre: "vocaloid", category: "Asian Pop" },
  { genre: "chinese rock", category: "Asian Pop" },

  // Specialty & Other
  { genre: "adult standards", category: "Specialty & Other" },
  { genre: "opera", category: "Specialty & Other" },
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
  return map.get(normalized) || "Specialty & Other";
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
    "Electronic & Dance",
    "Rock & Punk",
    "Pop",
    "Jazz & Blues",
    "Soul & R&B",
    "Reggae & Caribbean",
    "Folk & Indie",
    "Classical & Orchestral",
    "Country & Americana",
    "Latin & World",
    "Metal",
    "Experimental & Ambient",
    "Funk & Groove",
    "Gospel & Spiritual",
    "Asian Pop",
    "Specialty & Other"
  ];
  return categories;
}
