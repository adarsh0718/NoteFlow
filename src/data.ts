import { Song, Playlist, QuizQuestion } from "./types";

import echoesCoreImg from "./assets/images/echoes_album_art_1783004468657.jpg";
import lofiStudyImg from "./assets/images/lofi_study_cover_1783004483065.jpg";
import cyberGrooveImg from "./assets/images/cyber_groove_cover_1783004494517.jpg";
import sraadalyLogoImg from "./assets/images/sraadaly_logo_1783036699305.jpg";

// Keep track of our actual generated images to use for playlist and song artwork
export const ASSETS = {
  echoesCore: echoesCoreImg,
  lofiStudy: lofiStudyImg,
  cyberGroove: cyberGrooveImg,
  sraadalyLogo: sraadalyLogoImg
};

export const INITIAL_SONGS: Song[] = [
  {
    id: "s1",
    title: "Vivid Dreaming",
    artist: "Aether Grid",
    genre: "Synthwave",
    duration: "3:42",
    coverUrl: ASSETS.cyberGroove,
    lyrics: [
      "Fading into the neon line",
      "We trace the grid one more time",
      "Glow of cities, starry eyes",
      "Underneath the digital skies",
      "We run, we fly, we don't look back"
    ],
    listenCount: 24,
    interactionsCount: 15, // High interaction (liked, shared, lyrics read)
    isFavorited: true
  },
  {
    id: "s2",
    title: "Raindrops in Kyoto",
    artist: "Sora & Haru",
    genre: "Lo-Fi Beats",
    duration: "2:55",
    coverUrl: ASSETS.lofiStudy,
    lyrics: [
      "Instrumental",
      "[Soft vinyl crackle]",
      "[Rain beating gently on window glass]",
      "[Distant temple bell chime]"
    ],
    listenCount: 42,
    interactionsCount: 18,
    isFavorited: false
  },
  {
    id: "s3",
    title: "Solar Winds",
    artist: "Pulse Sector",
    genre: "Ambient Space",
    duration: "5:10",
    coverUrl: ASSETS.echoesCore,
    lyrics: [
      "Instrumental soundscape",
      "[Deep synthesiser drone]",
      "[Harmonic cosmic chime]"
    ],
    listenCount: 12,
    interactionsCount: 3,
    isFavorited: false
  },
  {
    id: "s4",
    title: "Electric Horizon",
    artist: "Hyperion",
    genre: "Synthwave",
    duration: "4:05",
    coverUrl: ASSETS.cyberGroove,
    lyrics: [
      "Charging up the engine bays",
      "Driving through the cyber haze",
      "Voltage spikes and digital tears",
      "Leaving all our analog fears"
    ],
    listenCount: 18,
    interactionsCount: 9,
    isFavorited: false
  },
  {
    id: "s5",
    title: "Cottage Woods",
    artist: "Fable Folk",
    genre: "Indie Acoustic",
    duration: "3:18",
    coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&auto=format&fit=crop&q=60",
    lyrics: [
      "Leaves turn yellow, copper, gold",
      "Stories that the old trees told",
      "Take my hand and walk with me",
      "Down to where we used to be"
    ],
    listenCount: 31,
    interactionsCount: 21,
    isFavorited: true
  },
  {
    id: "s6",
    title: "Strobe After Midnight",
    artist: "Klub Core",
    genre: "Deep House",
    duration: "6:12",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=60",
    lyrics: [
      "Feel the baseline start to creep",
      "While the rest of the city's asleep",
      "In the pulse, we find our release"
    ],
    listenCount: 15,
    interactionsCount: 14,
    isFavorited: false
  },
  {
    id: "s7",
    title: "Echo Location",
    artist: "The Reverbs",
    genre: "Post-Punk Indie",
    duration: "3:30",
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=60",
    lyrics: [
      "Shadows stretching on the wall",
      "We don't hear the sirens call",
      "In our heads, the drums align",
      "Beating out of sequence, out of time"
    ],
    listenCount: 8,
    interactionsCount: 2,
    isFavorited: false
  },
  {
    id: "s8",
    title: "Sun-Drenched Sand",
    artist: "Sol Groove",
    genre: "Tropical House",
    duration: "4:15",
    coverUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&auto=format&fit=crop&q=60",
    lyrics: [
      "Salty skin and golden spray",
      "Watch the daylight fade away",
      "Dance under the coconut breeze"
    ],
    listenCount: 29,
    interactionsCount: 11,
    isFavorited: false
  }
];

export const INITIAL_PLAYLISTS: Playlist[] = [
  {
    id: "p1",
    name: "Cosmic Glow Up",
    description: "Futuristic driving synth tunes and retro energy to spark absolute creative hyperfocus.",
    coverUrl: ASSETS.cyberGroove,
    songs: [
      INITIAL_SONGS[0], // Vivid Dreaming
      INITIAL_SONGS[3], // Electric Horizon
      INITIAL_SONGS[5]  // Strobe After Midnight
    ],
    creator: "NoteFlow Curators"
  },
  {
    id: "p2",
    name: "Rainy Day Sanctuary",
    description: "Chill beats, vinyl crackles, and delicate acoustic picks to keep your heart warm.",
    coverUrl: ASSETS.lofiStudy,
    songs: [
      INITIAL_SONGS[1], // Raindrops in Kyoto
      INITIAL_SONGS[4], // Cottage Woods
      INITIAL_SONGS[2]  // Solar Winds
    ],
    creator: "Sora & Haru"
  },
  {
    id: "p3",
    name: "Interactive Pulse Weekly",
    description: "The most engaging, high-activity tracks currently trending in your listening history.",
    coverUrl: ASSETS.echoesCore,
    songs: [
      INITIAL_SONGS[4], // Cottage Woods (21 interaction score)
      INITIAL_SONGS[1], // Raindrops in Kyoto (18 interaction score)
      INITIAL_SONGS[0]  // Vivid Dreaming (15 interaction score)
    ],
    creator: "AI Engine"
  }
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    text: "How do you prefer to start your morning?",
    options: [
      {
        value: "energy",
        text: "Pulsing bass & high-energy beats",
        description: "To kickstart the adrenaline and conquer the day immediately."
      },
      {
        value: "calm",
        text: "Soft ambient strings & distant nature notes",
        description: "To transition slowly and peacefully into consciousness."
      },
      {
        value: "organic",
        text: "Cozy acoustic guitar and warm, direct vocals",
        description: "Feels like a warm cup of coffee and morning sunlight."
      },
      {
        value: "retro",
        text: "Sleek 80s synthesizers & retro driving wave",
        description: "Feels like starting the day inside an immersive retro movie."
      }
    ]
  },
  {
    id: 2,
    text: "If your current mental headspace was a weather condition, what would it be?",
    options: [
      {
        value: "energy",
        text: "An electric lightning storm",
        description: "High voltage, dynamic thoughts, super charged with ideas."
      },
      {
        value: "calm",
        text: "A misty, foggy forest clearing",
        description: "Quiet, calm, meditative, slightly mysterious but soothing."
      },
      {
        value: "organic",
        text: "A breezy warm golden afternoon",
        description: "Grounded, nostalgic, comfortable, and deeply peaceful."
      },
      {
        value: "retro",
        text: "A cool neon-lit rainy urban night",
        description: "Reflective, moody, high-contrast, stylized, cinematic."
      }
    ]
  },
  {
    id: 3,
    text: "Select the physical environment you are most productive in:",
    options: [
      {
        value: "energy",
        text: "A bustling metropolitan coffee house",
        description: "Thriving on surrounding white noise and energetic vibrations."
      },
      {
        value: "calm",
        text: "A soundproof library room with isolated silence",
        description: "Needing complete sonic stillness to focus the mind."
      },
      {
        value: "organic",
        text: "A sunny outdoor bench or backyard under a tree",
        description: "Inspired by natural rustles, wind, and open space."
      },
      {
        value: "retro",
        text: "A darkened room illuminated only by neon LED panels",
        description: "Locked in behind a glowing display terminal, fully immersed."
      }
    ]
  },
  {
    id: 4,
    text: "How do you engage with music on your deepest level?",
    options: [
      {
        value: "energy",
        text: "Nodding along, dancing, and physically feeling the beat",
        description: "Music is a kinesthetic, body-first experience for you."
      },
      {
        value: "calm",
        text: "Sinking into lush arrangements as background focus",
        description: "Music is an atmospheric companion that sets a cognitive mood."
      },
      {
        value: "organic",
        text: "Analyzing lyrics, vocal nuances, and acoustic instruments",
        description: "Music is an intimate story, a human-to-human transmission."
      },
      {
        value: "retro",
        text: "Crafting specific playlists, organizing styles, looking for rare grooves",
        description: "Music is a curated museum of vibes and design aesthetics."
      }
    ]
  },
  {
    id: 5,
    text: "Pick a visual color palette that speaks to your soul today:",
    options: [
      {
        value: "energy",
        text: "Electric Crimson & Cyber Yellow",
        description: "High contrast, highly intense, passionate and bold."
      },
      {
        value: "calm",
        text: "Slate Blue, Sage, and Moss Green",
        description: "Earth-toned, relaxing, organic, and peaceful."
      },
      {
        value: "organic",
        text: "Amber Gold & Warm Terracotta",
        description: "Nostalgic, comforting, sun-kissed, and friendly."
      },
      {
        value: "retro",
        text: "Deep Night Purple & Neon Emerald",
        description: "Futuristic, stylish, nocturnal, and highly interactive."
      }
    ]
  }
];
