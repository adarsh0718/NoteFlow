export interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string;
  duration: string;
  coverUrl: string;
  audioUrl?: string;
  lyrics?: string[];
  listenCount: number;
  interactionsCount: number; // For "interactive music" tracker
  isFavorited?: boolean;
  whyForYou?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  songs: Song[];
  creator: string;
  isShared?: boolean;
}

export interface QuizQuestion {
  id: number;
  text: string;
  options: {
    value: string;
    text: string;
    description?: string;
  }[];
}

export interface QuizResult {
  musicTaste: string;
  description: string;
  recommendedGenres: string[];
  listeningGuide: string;
  suggestedSongs: Song[];
}
