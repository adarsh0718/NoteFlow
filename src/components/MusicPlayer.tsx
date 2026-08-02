import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Heart, 
  Share2, 
  ListMusic, 
  Volume2, 
  Repeat, 
  Shuffle,
  ChevronDown,
  FileText,
  Sparkles,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Song } from "../types";

interface MusicPlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onInteraction: (songId: string, actionType: "play" | "lyrics" | "heart" | "share") => void;
  onShare: (song: Song) => void;
}

export default function MusicPlayer({
  currentSong,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  onInteraction,
  onShare
}: MusicPlayerProps) {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(80);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);
  const [showLyrics, setShowLyrics] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [hasHearted, setHasHearted] = useState<boolean>(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync hearted state with current song
  useEffect(() => {
    if (currentSong) {
      setHasHearted(!!currentSong.isFavorited);
      setCurrentTime(0);
    }
  }, [currentSong]);

  // Convert string duration (e.g., "3:42") to seconds
  const getDurationInSeconds = (durationStr: string): number => {
    const parts = durationStr.split(":");
    if (parts.length === 2) {
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    return 180; // default
  };

  const durationSeconds = currentSong ? getDurationInSeconds(currentSong.duration) : 180;

  // Track progress timing
  useEffect(() => {
    if (isPlaying && currentSong) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= durationSeconds) {
            onNext();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, currentSong, durationSeconds]);

  if (!currentSong) return null;

  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(parseInt(e.target.value, 10));
  };

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasHearted(!hasHearted);
    onInteraction(currentSong.id, "heart");
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare(currentSong);
    onInteraction(currentSong.id, "share");
  };

  const handleLyricsClick = () => {
    setShowLyrics(!showLyrics);
    if (!showLyrics) {
      onInteraction(currentSong.id, "lyrics");
    }
  };

  return (
    <>
      {/* Expanded full screen overlay (mobile focus style) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            id="expanded-music-player"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 180 }}
            className="fixed inset-0 md:inset-auto md:bottom-28 md:right-8 md:w-96 md:h-[650px] z-50 flex flex-col bg-[#0d0a09] text-white max-w-md mx-auto md:mx-0 rounded-t-3xl md:rounded-2xl border-t md:border border-white/10 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <button 
                id="collapse-player-btn"
                onClick={() => setIsExpanded(false)} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <ChevronDown className="w-6 h-6 text-stone-400" />
              </button>
              <div className="text-center">
                <span className="text-xs uppercase tracking-wider font-semibold text-amber-400 font-mono">NOW PLAYING</span>
                <p className="text-xs text-stone-500 mt-0.5">{currentSong.genre}</p>
              </div>
              <button 
                id="view-lyrics-toggle"
                onClick={handleLyricsClick} 
                className={`p-2 rounded-full transition-colors ${showLyrics ? "bg-amber-500/20 text-amber-400" : "hover:bg-white/10 text-slate-400"}`}
              >
                <FileText className="w-5 h-5" />
              </button>
            </div>

            {/* Main Area: Cover Art / Lyrics */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 py-4 overflow-y-auto">
              {!showLyrics ? (
                <div className="relative flex flex-col items-center justify-center">
                  {/* Rotating Vinyl Record / Cover Art */}
                  <motion.div 
                    animate={{ rotate: isPlaying ? 360 : 0 }}
                    transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                    className="relative w-64 h-64 md:w-52 md:h-52 rounded-full shadow-2xl shadow-amber-500/10 border-4 border-[#14100e] overflow-hidden flex items-center justify-center group"
                  >
                    <img 
                       src={currentSong.coverUrl} 
                      alt={currentSong.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-full"
                    />
                    {/* Vinyl Record Center Hole */}
                    <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-stone-950 border-4 border-stone-900 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    </div>
                  </motion.div>

                  {/* Sound Wave Equalizer animation when playing */}
                  <div className="flex items-center justify-center gap-1.5 h-8 mt-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((bar) => (
                      <motion.div
                        key={bar}
                        animate={{ height: isPlaying ? [8, 28, 12, 32, 8][bar % 5] : 6 }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.8 + (bar * 0.1),
                          ease: "easeInOut"
                        }}
                        className="w-1 rounded-full bg-gradient-to-t from-amber-500 to-orange-500"
                      />
                    ))}
                  </div>
                </div>
              ) : (
                /* Lyrics View */
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full h-full flex flex-col justify-start py-6 scrollbar-none"
                >
                  <h3 className="text-amber-400 font-mono text-xs uppercase tracking-wider mb-4 border-b border-white/5 pb-2">LYRICS & MEANING</h3>
                  <div className="space-y-4 text-center overflow-y-auto max-h-[300px] py-4 px-2">
                    {currentSong.lyrics && currentSong.lyrics.length > 0 ? (
                      currentSong.lyrics.map((line, idx) => (
                        <p 
                          key={idx} 
                          className={`text-lg transition-all duration-300 ${
                            idx === Math.floor((currentTime / durationSeconds) * (currentSong.lyrics?.length || 1))
                              ? "text-amber-400 font-bold scale-105 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" 
                              : "text-stone-400"
                          }`}
                        >
                          {line}
                        </p>
                      ))
                    ) : (
                      <p className="text-stone-500 italic text-sm">Instrumental Track. Savor the acoustic flow.</p>
                    )}
                  </div>
                  <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-stone-300 leading-relaxed">
                      Reading lyrics boosts your <span className="text-amber-400 font-semibold">Interactive Listening Score</span>! Try sing-along tracks to uncover deeper musical nuances.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Info and Progress Area */}
            <div className="px-8 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">{currentSong.title}</h2>
                  <p className="text-sm text-stone-400 mt-1">{currentSong.artist}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    id="expanded-heart-btn"
                    onClick={handleHeartClick} 
                    className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors group"
                  >
                    <Heart className={`w-5 h-5 transition-transform group-active:scale-125 ${hasHearted ? "fill-amber-500 text-amber-500" : "text-stone-400"}`} />
                  </button>
                  <button 
                    id="expanded-share-btn"
                    onClick={handleShareClick} 
                    className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <Share2 className="w-5 h-5 text-stone-400 hover:text-amber-400" />
                  </button>
                </div>
              </div>

              {/* Progress Slider */}
              <div className="mt-6">
                <input
                  type="range"
                  min="0"
                  max={durationSeconds}
                  value={currentTime}
                  onChange={handleProgressChange}
                  className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-xs font-mono text-stone-550 mt-2">
                  <span>{formatTime(currentTime)}</span>
                  <span>{currentSong.duration}</span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="px-8 pb-8 pt-2 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <button 
                  id="shuffle-toggle"
                  onClick={() => setIsShuffle(!isShuffle)} 
                  className={`p-2 transition-colors ${isShuffle ? "text-amber-400" : "text-stone-500 hover:text-white"}`}
                >
                  <Shuffle className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-6">
                  <button 
                    id="prev-track-btn"
                    onClick={onPrev} 
                    className="p-2 text-stone-400 hover:text-white transition-colors"
                  >
                    <SkipBack className="w-7 h-7" />
                  </button>

                  <button 
                    id="play-pause-expanded-btn"
                    onClick={onTogglePlay} 
                    className="p-4 bg-amber-500 hover:bg-amber-400 rounded-full text-stone-950 transition-all transform hover:scale-105 shadow-lg shadow-amber-500/25 active:scale-95"
                  >
                    {isPlaying ? <Pause className="w-8 h-8 fill-stone-950 text-stone-950" /> : <Play className="w-8 h-8 fill-stone-950 text-stone-950 ml-1" />}
                  </button>

                  <button 
                    id="next-track-btn"
                    onClick={onNext} 
                    className="p-2 text-stone-400 hover:text-white transition-colors"
                  >
                    <SkipForward className="w-7 h-7" />
                  </button>
                </div>

                <button 
                  id="repeat-toggle"
                  onClick={() => setIsRepeat(!isRepeat)} 
                  className={`p-2 transition-colors ${isRepeat ? "text-amber-400" : "text-stone-500 hover:text-white"}`}
                >
                  <Repeat className="w-5 h-5" />
                </button>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-3 bg-[#14100e]/50 px-4 py-2.5 rounded-full border border-white/5">
                <button onClick={() => setIsMuted(!isMuted)} className="text-stone-400 hover:text-white">
                  <Volume2 className={`w-4 h-4 ${isMuted ? "text-red-400 line-through" : ""}`} />
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseInt(e.target.value, 10))}
                  className="flex-1 h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Mini Player (Standard Spotify bottom bar on mobile, elegant bottom-right float on laptops/computers) */}
      <div 
        id="mini-music-player"
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-16 left-4 right-4 md:bottom-8 md:right-8 md:left-auto md:w-96 md:max-w-none z-40 bg-[#14100e]/95 backdrop-blur-md text-white rounded-2xl border border-white/10 shadow-xl px-4 py-3 flex items-center justify-between cursor-pointer group hover:bg-white/5 transition-colors max-w-md mx-auto"
      >
        <div className="flex items-center gap-3 overflow-hidden flex-1">
          {/* Mini rotating cover art */}
          <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
            <img 
              src={currentSong.coverUrl} 
              alt={currentSong.title} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="overflow-hidden flex-1">
            <h4 className="text-xs font-semibold truncate group-hover:text-amber-400 transition-colors">{currentSong.title}</h4>
            <p className="text-[10px] text-stone-400 truncate mt-0.5">{currentSong.artist}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button 
            id="mini-heart-btn"
            onClick={handleHeartClick} 
            className="p-1.5 text-stone-400 hover:text-amber-400 transition-colors"
          >
            <Heart className={`w-4.5 h-4.5 ${hasHearted ? "fill-amber-500 text-amber-500" : ""}`} />
          </button>
          
          <button 
            id="mini-play-pause-btn"
            onClick={onTogglePlay} 
            className="p-1.5 bg-amber-500 rounded-full text-stone-950 hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-md shadow-amber-500/10"
          >
            {isPlaying ? <Pause className="w-4.5 h-4.5 fill-stone-950 text-stone-950" /> : <Play className="w-4.5 h-4.5 fill-stone-950 text-stone-950 ml-0.5" />}
          </button>

          <button 
            id="mini-next-btn"
            onClick={onNext} 
            className="p-1.5 text-stone-400 hover:text-white transition-colors"
          >
            <SkipForward className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Small horizontal progress bar at very bottom of mini card */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-800 rounded-b-2xl overflow-hidden">
          <div 
            className="h-full bg-amber-500" 
            style={{ width: `${(currentTime / durationSeconds) * 100}%` }}
          />
        </div>
      </div>
    </>
  );
}
