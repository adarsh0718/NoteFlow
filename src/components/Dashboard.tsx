import React from "react";
import { 
  Activity, 
  BarChart2, 
  Clock, 
  Heart, 
  Sparkles, 
  Zap, 
  Flame, 
  Play, 
  Disc,
  Smartphone,
  Award,
  ChevronRight,
  Share2
} from "lucide-react";
import { Song, Playlist, QuizResult } from "../types";
import { motion } from "motion/react";

interface DashboardProps {
  songs: Song[];
  quizResult: QuizResult | null;
  sharedFeed?: Array<{ playlist: Playlist; sharedBy: string; sharedTo: string }>;
  onPlaySong: (song: Song) => void;
  onNavigateToQuiz: () => void;
  onNavigateToExplore: () => void;
}

export default function Dashboard({
  songs,
  quizResult,
  sharedFeed,
  onPlaySong,
  onNavigateToQuiz,
  onNavigateToExplore
}: DashboardProps) {
  
  // Calculate analytics metrics
  const totalListens = songs.reduce((sum, s) => sum + s.listenCount, 0);
  const totalInteractions = songs.reduce((sum, s) => sum + s.interactionsCount, 0);
  
  // Find the single "Most Interactive Song"
  const mostInteractiveSong = [...songs].sort((a, b) => b.interactionsCount - a.interactionsCount)[0];

  // Calculate genre distribution percentages
  const genreCounts: Record<string, number> = {};
  songs.forEach((s) => {
    genreCounts[s.genre] = (genreCounts[s.genre] || 0) + s.listenCount;
  });
  
  const totalGenreWeights = Object.values(genreCounts).reduce((sum, v) => sum + v, 0) || 1;
  const genresArray = Object.entries(genreCounts)
    .map(([name, count]) => ({
      name,
      percentage: Math.round((count / totalGenreWeights) * 100)
    }))
    .sort((a, b) => b.percentage - a.percentage);

  // Engagement rating level
  const getEngagementLevel = (score: number) => {
    if (score > 60) return { title: "Ultra Kinetic Listener", color: "text-amber-400", bg: "bg-amber-500/10", desc: "You don't just listen; you read, save, share, and live the music!" };
    if (score > 30) return { title: "Focused Melodist", color: "text-orange-400", bg: "bg-orange-500/10", desc: "You engage with lyrics and curate your sonic experiences regularly." };
    return { title: "Atmospheric Drifter", color: "text-slate-400", bg: "bg-white/5", desc: "You let music float in the background. Take the Quiz to activate!" };
  };

  const engagement = getEngagementLevel(totalInteractions);

  return (
    <div id="dashboard-container" className="flex flex-col bg-[#14100e] text-white px-6 py-6 pb-24 overflow-y-auto h-full">
      
      {/* Overview Card */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] text-amber-400 font-mono font-bold uppercase tracking-wider">PERSONALIZED ANALYTICS</span>
          <h2 className="text-xl font-bold tracking-tight text-white mt-1">My NoteFlow Dashboard</h2>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/5 rounded-full font-mono text-[10px] text-slate-300">
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          Mobile Engine v1.0
        </div>
      </div>

      {/* Interactive Engagement Meter Section */}
      <div className="mt-6 p-5 bg-gradient-to-br from-[#1a1512] to-[#0d0a09] border border-white/5 rounded-2xl relative overflow-hidden shadow-xl">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-12 -mt-12" />

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">Interactive Music Meter</span>
            </div>
            <h3 className="text-2xl font-black text-white mt-3 font-mono">
              {totalInteractions} <span className="text-xs font-normal text-slate-500 font-sans">activity points</span>
            </h3>
          </div>
          <div className={`px-3 py-1.5 rounded-xl font-mono text-[9px] font-bold ${engagement.bg} ${engagement.color}`}>
            {engagement.title}
          </div>
        </div>

        {/* Progress Bar visual */}
        <div className="h-2 bg-stone-800 rounded-full mt-5 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
            style={{ width: `${Math.min((totalInteractions / 100) * 100, 100)}%` }}
          />
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed mt-4">
          {engagement.desc}
        </p>

        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
          <span>Target Score: 100 pts</span>
          <span className="text-amber-400 flex items-center gap-1">
            +5 pts for every lyric read
          </span>
        </div>
      </div>

      {/* Grid: Most Interactive Song & Taste Profile */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        {/* Most Interactive Song Block */}
        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-mono tracking-wider">
              <Flame className="w-3.5 h-3.5 text-orange-400" /> Most Interactive
            </div>
            <h4 className="text-xs font-bold text-white mt-3.5 line-clamp-1">{mostInteractiveSong?.title || "No Plays Yet"}</h4>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">{mostInteractiveSong?.artist || "Start Listening"}</p>
          </div>
          
          {mostInteractiveSong && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                {mostInteractiveSong.interactionsCount} actions
              </span>
              <button 
                id="play-most-interactive-btn"
                onClick={() => onPlaySong(mostInteractiveSong)} 
                className="p-1.5 bg-amber-500 hover:bg-amber-400 rounded-full text-stone-950 transition-transform active:scale-90"
              >
                <Play className="w-3 h-3 fill-stone-950 text-stone-950 ml-0.5" />
              </button>
            </div>
          )}
        </div>

        {/* Music Taste Profile Block */}
        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-between cursor-pointer hover:border-amber-500/20 transition-all" onClick={onNavigateToQuiz}>
          <div>
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-mono tracking-wider">
              <Award className="w-3.5 h-3.5 text-amber-400" /> Taste Profile
            </div>
            <h4 className="text-xs font-bold text-white mt-3.5 line-clamp-2">
              {quizResult ? quizResult.musicTaste : "Undecoded Taste"}
            </h4>
            <p className="text-[10px] text-slate-400 mt-1">
              {quizResult ? "Profile analysis loaded." : "Decode style in 5 questions."}
            </p>
          </div>

          <span className="text-[9px] font-mono text-amber-400 flex items-center mt-3 gap-0.5 group hover:underline">
            {quizResult ? "View roadmap" : "Take Quiz"} <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>

      {/* Genre Distribution Charts */}
      <div className="mt-6 p-5 bg-white/5 border border-white/5 rounded-2xl">
        <div className="flex items-center gap-1.5 mb-4">
          <BarChart2 className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">My Genre Cloud</span>
        </div>

        {genresArray.length > 0 ? (
          <div className="space-y-3.5">
            {genresArray.map((genre) => (
              <div key={genre.name} className="space-y-1">
                <div className="flex justify-between text-xs text-stone-300">
                  <span>{genre.name}</span>
                  <span className="font-mono text-amber-400 font-semibold">{genre.percentage}%</span>
                </div>
                <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full" 
                    style={{ width: `${genre.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-550 italic text-center py-2">Start playing tracks to map your genre split.</p>
        )}
      </div>

      {/* Listen History & Counts */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">Listening History</span>
          </div>
          <span className="text-[10px] text-stone-500 font-mono">{totalListens} total playbacks</span>
        </div>

        <div className="space-y-2.5">
          {songs.slice(0, 5).map((song) => (
            <div 
              key={song.id} 
              className="p-3 bg-white/5 border border-white/5 hover:border-white/10 rounded-xl flex items-center justify-between gap-3 group cursor-pointer transition-colors"
              onClick={() => onPlaySong(song)}
            >
              <div className="flex items-center gap-3 overflow-hidden flex-1">
                <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={song.coverUrl} alt={song.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">{song.title}</h4>
                  <p className="text-[10px] text-stone-400 truncate mt-0.5">{song.artist}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 font-mono">
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">{song.listenCount} plays</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Community Sharing Circle */}
      {sharedFeed && sharedFeed.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">Social Shares Circle</span>
            </div>
          </div>

          <div className="space-y-3">
            {sharedFeed.map((feedItem, idx) => (
              <div 
                key={idx} 
                className="p-3.5 bg-white/5 border border-white/5 rounded-xl flex flex-col gap-2.5 hover:border-white/10 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-mono text-stone-400 truncate">
                      From: <span className="text-amber-400 font-semibold">{feedItem.sharedBy}</span>
                    </p>
                    <p className="text-[10px] font-mono text-stone-400 truncate mt-0.5">
                      To: <span className="text-stone-300">{feedItem.sharedTo}</span>
                    </p>
                  </div>
                  <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-wider">Shared</span>
                </div>

                <div className="p-2.5 bg-black/30 rounded-lg flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-7 h-7 rounded bg-amber-500/20 flex items-center justify-center text-amber-500 text-xs font-bold font-mono">
                      🎵
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-white truncate">{feedItem.playlist.name}</h4>
                      <p className="text-[9px] text-stone-400 truncate mt-0.5">{feedItem.playlist.songs.length} songs • {feedItem.playlist.description}</p>
                    </div>
                  </div>

                  {feedItem.playlist.songs.length > 0 && (
                    <button 
                      onClick={() => onPlaySong(feedItem.playlist.songs[0])}
                      className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 rounded-lg text-stone-950 font-mono text-[10px] font-bold uppercase tracking-wider"
                    >
                      Listen
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
