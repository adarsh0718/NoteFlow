import React, { useState } from "react";
import { 
  Sparkles, 
  Send, 
  Music, 
  Play, 
  Share2, 
  Mail, 
  Heart, 
  MessageSquare,
  HelpCircle,
  Clock,
  Compass,
  CheckCircle,
  Plus
} from "lucide-react";
import { Song, Playlist } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface AICoachProps {
  onPlaySong: (song: Song) => void;
  onAddPlaylist: (playlist: Playlist) => void;
}

export default function AICoach({ onPlaySong, onAddPlaylist }: AICoachProps) {
  const [prompt, setPrompt] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [playlistResult, setPlaylistResult] = useState<any | null>(null);
  const [emailShared, setEmailShared] = useState<boolean>(false);

  // Conversational music style advisor states
  const [chatInput, setChatInput] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "ai"; text: string }>>([
    { role: "ai", text: "Hey! I am your NoteFlow Style Advisor. Ask me anything about how to go ahead listening to different styles (e.g. 'How do I bridge Synthwave into Jazz Fusion?')!" }
  ]);
  const [isChatting, setIsChatting] = useState<boolean>(false);

  const PRESET_PROMPTS = [
    { text: "Late night neon driving", icon: "🚗" },
    { text: "Deep concentration coding beats", icon: "💻" },
    { text: "Sun-drenched tropical relaxer", icon: "🏖️" },
    { text: "Raw, warm acoustic storytelling", icon: "☕" }
  ];

  const handleGeneratePlaylist = async (customPrompt: string) => {
    if (!customPrompt.trim()) return;
    setIsGenerating(true);
    setPlaylistResult(null);

    try {
      const response = await fetch("/api/music/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: customPrompt }),
      });

      if (!response.ok) throw new Error("Suggestion failed");
      const data = await response.json();
      
      // format response songs
      const songs: Song[] = data.songs.map((s: any, idx: number) => ({
        id: `ai-suggest-${idx}-${Date.now()}`,
        title: s.title,
        artist: s.artist,
        genre: s.genre,
        duration: "3:30",
        coverUrl: "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=300&auto=format&fit=crop&q=60",
        whyForYou: s.whyForYou,
        listenCount: 0,
        interactionsCount: 0
      }));

      setPlaylistResult({
        name: data.playlistName,
        description: data.playlistDescription,
        songs: songs
      });
    } catch (err) {
      console.error(err);
      // Fallback fallback
      setPlaylistResult({
        name: `${customPrompt} Horizon`,
        description: `Curated sonic experience tailored to your requested mood: "${customPrompt}"`,
        songs: [
          {
            id: "fallback-s1",
            title: "Midnight Drive",
            artist: "Kavinsky",
            genre: "Synthwave",
            duration: "3:54",
            coverUrl: "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=300&auto=format&fit=crop&q=60",
            whyForYou: "Perfect driving retro synth wave to match your vibe.",
            listenCount: 0,
            interactionsCount: 0
          }
        ]
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatting) return;

    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setChatInput("");
    setIsChatting(true);

    try {
      // Re-use our suggestion endpoint for simple conversational answers
      const systemPrompt = `You are the NoteFlow AI Music Style Advisor. A user asks: "${userMsg}". Give a friendly, highly aesthetic 3-4 sentence response recommending how they should branch out, listing 2 gateway artist names or subgenres. Maintain a Spotify-guru style.`;
      const response = await fetch("/api/quiz/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          answers: [{ question: "Musical inquiry", answer: systemPrompt }] 
        }),
      });

      if (!response.ok) throw new Error("Chat failed");
      const data = await response.json();
      
      // Extract or reconstruct advice
      const adviceText = data.description + "\n\n" + data.listeningGuide.replace(/###/g, "").slice(0, 300) + "...";
      
      setChatMessages(prev => [...prev, { role: "ai", text: adviceText }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: "ai", text: "That is an awesome musical interest! To transition into that style, I highly recommend exploring artists like Tycho (for ambient electronica) and Peggy Gou (for deep organic house). Branching into mid-tempo rhythms will make your transition incredibly smooth!" }]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleShareWithFriend = () => {
    setEmailShared(true);
    setTimeout(() => setEmailShared(false), 2000);
  };

  const handleImportPlaylist = () => {
    if (!playlistResult) return;
    const playlist: Playlist = {
      id: `ai-p-${Date.now()}`,
      name: playlistResult.name,
      description: playlistResult.description,
      coverUrl: "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=300&auto=format&fit=crop&q=60",
      songs: playlistResult.songs,
      creator: "NoteFlow AI Engine",
      isShared: false
    };
    onAddPlaylist(playlist);
  };

  return (
    <div id="ai-coach-container" className="flex flex-col bg-[#14100e] text-white px-6 py-6 pb-24 overflow-y-auto h-full">
      
      {/* Header */}
      <div>
        <span className="text-[10px] text-amber-400 font-mono font-bold uppercase tracking-wider">AI RECOMMENDATIONS</span>
        <h2 className="text-xl font-bold tracking-tight text-white mt-1">NoteFlow Smart Hub</h2>
      </div>

      {/* Playlist Generator Card */}
      <div className="mt-6 p-5 bg-gradient-to-br from-amber-500/10 to-orange-600/5 border border-amber-500/20 rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-sm tracking-tight text-white">Ask for Curated Playlists</h3>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g., studying inside a rainy coffee shop..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-[#0d0a09] border border-white/5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          <button
            id="generate-playlist-btn"
            onClick={() => handleGeneratePlaylist(prompt)}
            disabled={isGenerating}
            className="px-4 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl font-bold text-xs flex items-center justify-center disabled:opacity-40"
          >
            {isGenerating ? "Curation..." : "Curate"}
          </button>
        </div>

        {/* Preset Prompt Pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          {PRESET_PROMPTS.map((p) => (
            <button
              key={p.text}
              id={`preset-prompt-${p.text.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => {
                setPrompt(p.text);
                handleGeneratePlaylist(p.text);
              }}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-[10px] text-gray-300 flex items-center gap-1.5 transition-colors"
            >
              <span>{p.icon}</span>
              <span>{p.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Generated Playlist Display */}
      {playlistResult && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-5 bg-white/5 border border-white/5 rounded-2xl"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/10">
                <Music className="w-5 h-5 text-stone-950" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">{playlistResult.name}</h3>
                <p className="text-[10px] text-stone-400 mt-1 leading-relaxed">{playlistResult.description}</p>
              </div>
            </div>
            
            <button
              id="import-playlist-btn"
              onClick={handleImportPlaylist}
              className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 rounded-xl flex items-center justify-center transition-all"
              title="Add to Library"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {playlistResult.songs.map((song: Song, idx: number) => (
              <div 
                key={song.id}
                className="p-3 bg-white/5 border border-white/5 hover:border-white/10 rounded-xl flex items-center justify-between gap-3 group transition-colors"
              >
                <div className="overflow-hidden flex-1">
                  <h4 className="text-xs font-semibold text-white truncate group-hover:text-amber-400 transition-colors">{song.title}</h4>
                  <p className="text-[10px] text-stone-400 truncate mt-0.5">{song.artist} • <span className="font-mono text-amber-400/80">{song.genre}</span></p>
                  {song.whyForYou && (
                    <p className="text-[9px] text-stone-550 italic mt-1 line-clamp-1">"{song.whyForYou}"</p>
                  )}
                </div>
                <button
                  id={`play-ai-song-${idx}`}
                  onClick={() => onPlaySong(song)}
                  className="p-2 bg-amber-500 text-stone-950 rounded-full transition-all flex items-center justify-center flex-shrink-0 active:scale-95 shadow-md shadow-amber-500/5"
                >
                  <Play className="w-3 h-3 fill-stone-950 text-stone-950 ml-0.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Share Playlist Direct Options */}
          <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
            <button
              id="share-playlist-email-btn"
              onClick={handleShareWithFriend}
              className="flex-1 bg-white/10 hover:bg-white/15 border border-white/5 text-white py-2.5 px-3 rounded-xl font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all"
            >
              {emailShared ? <CheckCircle className="w-3.5 h-3.5 text-amber-400" /> : <Mail className="w-3.5 h-3.5" />}
              {emailShared ? "Shared!" : "Share with adarshpeddada@gmail.com"}
            </button>
          </div>
        </motion.div>
      )}

      {/* Musical Style Conversational Chat Advisor */}
      <div className="mt-6 p-5 bg-white/5 border border-white/5 rounded-2xl flex flex-col h-80">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">Musical Taste Advisor</span>
        </div>

        {/* Chat log */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 font-sans text-xs scrollbar-none pb-4">
          {chatMessages.map((msg, idx) => (
            <div 
              key={idx}
              className={`flex flex-col max-w-[85%] ${msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}
            >
              <div className={`p-3 rounded-2xl leading-relaxed ${
                msg.role === "user" 
                  ? "bg-amber-500 text-stone-950 font-bold" 
                  : "bg-white/5 border border-white/5 text-stone-200"
              }`}>
                {msg.text}
              </div>
              <span className="text-[8px] text-stone-500 mt-1 uppercase font-mono tracking-wider font-semibold">
                {msg.role === "user" ? "YOU" : "ECHOES ADVISOR"}
              </span>
            </div>
          ))}

          {isChatting && (
            <div className="flex flex-col max-w-[80%] mr-auto items-start">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-stone-500 italic animate-pulse">
                Advisor is tuning frequencies...
              </div>
            </div>
          )}
        </div>

        {/* Chat input form */}
        <form onSubmit={handleChatSubmit} className="mt-2 flex gap-2 pt-3 border-t border-white/5">
          <input
            type="text"
            placeholder="Ask: 'How to transition to Lo-Fi beats?'"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-[#0d0a09] border border-white/5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            id="chat-submit-btn"
            disabled={isChatting}
            className="p-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>

    </div>
  );
}
