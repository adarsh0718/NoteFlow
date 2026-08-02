import React, { useState } from "react";
import { 
  Sparkles, 
  HelpCircle, 
  ChevronRight, 
  ChevronLeft, 
  Music, 
  Disc, 
  Play, 
  Layers, 
  Compass, 
  CheckCircle,
  Share2,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { QuizQuestion, QuizResult, Song } from "../types";
import { QUIZ_QUESTIONS, ASSETS } from "../data";

interface MusicQuizProps {
  onQuizComplete: (result: QuizResult) => void;
  onPlaySong: (song: Song) => void;
  savedResult: QuizResult | null;
}

export default function MusicQuiz({ onQuizComplete, onPlaySong, savedResult }: MusicQuizProps) {
  const [currentStep, setCurrentStep] = useState<number>(-1); // -1: Intro, 0-4: Questions, 5: Loading
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, { question: string, answer: string }>>({});
  const [loadingText, setLoadingText] = useState<string>("Analyzing your rhythmic answers...");
  const [result, setResult] = useState<QuizResult | null>(savedResult);
  const [isSharing, setIsSharing] = useState<boolean>(false);

  const startQuiz = () => {
    setSelectedAnswers({});
    setResult(null);
    setCurrentStep(0);
  };

  const handleSelectOption = (questionId: number, questionText: string, value: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: { question: questionText, answer: value }
    }));

    // Auto advance with slight delay for delightful click feedback
    setTimeout(() => {
      if (currentStep < QUIZ_QUESTIONS.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        handleSubmitQuiz();
      }
    }, 350);
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    setCurrentStep(5); // Loading screen
    
    // Cycle beautiful loader phrases for reassurances during processing
    const loaderPhrases = [
      "Analyzing your rhythmic answers...",
      "Decoding your mental aesthetic space...",
      "Sieving through frequencies...",
      "Consulting the Gemini music engine...",
      "Generating your personalized musical roadmap..."
    ];
    let phraseIdx = 0;
    const phraseInterval = setInterval(() => {
      if (phraseIdx < loaderPhrases.length - 1) {
        phraseIdx++;
        setLoadingText(loaderPhrases[phraseIdx]);
      }
    }, 1500);

    const answersPayload = Object.entries(selectedAnswers).map(([id, val]) => {
      const data = val as { question: string; answer: string };
      return {
        questionId: parseInt(id),
        question: data.question,
        answer: data.answer
      };
    });

    try {
      const response = await fetch("/api/quiz/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answersPayload }),
      });

      if (!response.ok) {
        throw new Error("Evaluation request failed");
      }

      const data = await response.json();
      
      // Turn raw suggested song objects into Song structures
      const formattedSongs: Song[] = data.suggestedSongs.map((song: any, index: number) => ({
        id: `quiz-s-${index}-${Date.now()}`,
        title: song.title,
        artist: song.artist,
        genre: song.genre,
        duration: song.tempo === "Chill" ? "3:15" : "4:02",
        coverUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&auto=format&fit=crop&q=60",
        whyForYou: song.whyForYou,
        listenCount: 0,
        interactionsCount: 0,
        lyrics: [`Why we recommend this: ${song.whyForYou}`]
      }));

      const finalResult: QuizResult = {
        musicTaste: data.musicTaste,
        description: data.description,
        recommendedGenres: data.recommendedGenres,
        listeningGuide: data.listeningGuide,
        suggestedSongs: formattedSongs
      };

      clearInterval(phraseInterval);
      setResult(finalResult);
      onQuizComplete(finalResult);
      setCurrentStep(6); // Show result
    } catch (err) {
      console.error("Quiz evaluation failed", err);
      clearInterval(phraseInterval);
      // Fallback local results
      const fallbackResult: QuizResult = {
        musicTaste: "Eco Acoustic Voyager",
        description: "You thrive on raw, authentic acoustic vibes and ambient forest soundscapes. You appreciate organic storytellers and calm instrumental flows to focus.",
        recommendedGenres: ["Neo-Folk", "Forest Ambient", "Cinematic Acoustic"],
        listeningGuide: "### How to Go Ahead exploring:\n\n1. **Deepen with Indie Folk**: Explore artists like Gregory Alan Isakov or Iron & Wine.\n2. **Transition to Cinematic Ambient**: Slow down with artists like Hammock or Sigur Rós to find deep peace.\n3. **Modern Instrumental**: Discover Kaki King or Tommy Emmanuel for intricate acoustic structures.",
        suggestedSongs: [
          {
            id: `fallback-1`,
            title: "Stable Song",
            artist: "Gregory Alan Isakov",
            genre: "Indie Folk",
            duration: "3:40",
            coverUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&auto=format&fit=crop&q=60",
            whyForYou: "Matches your deep desire for warm coffee, sunlight, and raw organic vocals.",
            listenCount: 0,
            interactionsCount: 0,
            lyrics: ["Organic storytelling meets dusty roads."]
          }
        ]
      };
      setResult(fallbackResult);
      onQuizComplete(fallbackResult);
      setCurrentStep(6);
    }
  };

  const handleShareResult = () => {
    setIsSharing(true);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `I just took the NoteFlow Music Quiz! My style is "${result?.musicTaste}". Let's listen together!`
      );
    }
    setTimeout(() => setIsSharing(false), 2000);
  };

  return (
    <div id="quiz-container" className="flex flex-col h-full bg-[#14100e] text-white select-none pb-20">
      
      {/* INTRO SCREEN */}
      {currentStep === -1 && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col justify-center items-center text-center px-6 py-8"
        >
          <img 
            src={ASSETS.sraadalyLogo} 
            alt="NoteFlow Logo" 
            className="w-20 h-20 rounded-2xl object-cover shadow-xl shadow-amber-500/10 border-2 border-white/10 mb-6"
            referrerPolicy="no-referrer"
          />
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-stone-400 bg-clip-text text-transparent">
            Aesthetic Taste Quiz
          </h2>
          <p className="text-stone-400 text-sm mt-3 leading-relaxed max-w-xs">
            Answer 5 deep sensory questions to decode your musical archetype. We'll map out a customized listening roadmap and curate songs to expand your comfort zones.
          </p>

          <button 
            id="start-quiz-btn"
            onClick={startQuiz}
            className="mt-8 w-full max-w-xs bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold py-3.5 px-6 rounded-full transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <Music className="w-4.5 h-4.5 fill-stone-950 text-stone-950" />
            Start Music Discovery
          </button>

          {result && (
            <button
              id="view-saved-profile-btn"
              onClick={() => setCurrentStep(6)}
              className="mt-4 text-xs font-semibold text-amber-400 hover:underline flex items-center gap-1.5"
            >
              <Compass className="w-4 h-4" /> View existing musical profile
            </button>
          )}
        </motion.div>
      )}

      {/* QUIZ QUESTION STEP */}
      {currentStep >= 0 && currentStep <= 4 && (
        <div className="flex-1 flex flex-col justify-between px-6 py-6">
          {/* Header Progress */}
          <div>
            <div className="flex items-center justify-between">
              <button 
                id="quiz-back-btn"
                onClick={handlePrev} 
                disabled={currentStep === 0}
                className="p-1.5 hover:bg-white/5 rounded-full text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
                STEP {currentStep + 1} OF 5
              </span>
              <div className="w-5 h-5" /> {/* Spacer */}
            </div>
            
            {/* Visual Progress Bar */}
            <div className="h-1 bg-stone-850 rounded-full mt-4 overflow-hidden">
              <motion.div 
                className="h-full bg-amber-500" 
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Text */}
          <div className="my-auto py-4">
            <h3 className="text-xl font-bold tracking-tight text-white leading-snug">
              {QUIZ_QUESTIONS[currentStep].text}
            </h3>

            {/* Answer Options */}
            <div className="mt-8 space-y-3.5">
              {QUIZ_QUESTIONS[currentStep].options.map((opt, i) => {
                const questionText = QUIZ_QUESTIONS[currentStep].text;
                const isSelected = selectedAnswers[currentStep]?.answer === opt.value;

                return (
                  <motion.button
                    key={opt.value}
                    id={`quiz-option-${currentStep}-${opt.value}`}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectOption(currentStep, questionText, opt.value)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col ${
                      isSelected 
                        ? "bg-amber-500/10 border-amber-500 text-white" 
                        : "bg-white/5 border-white/5 hover:border-white/10 text-stone-300"
                    }`}
                  >
                    <span className="font-semibold text-sm">{opt.text}</span>
                    {opt.description && (
                      <span className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                        {opt.description}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* LOADING EVALUATION */}
      {currentStep === 5 && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col justify-center items-center text-center px-6 py-8"
        >
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="mb-8"
          >
            <Disc className="w-14 h-14 text-amber-500 animate-pulse" />
          </motion.div>
          
          <h3 className="text-lg font-bold text-white tracking-tight">AI Curating Music Taste</h3>
          <p className="text-xs text-gray-400 max-w-xs mt-3 leading-relaxed animate-pulse">
            {loadingText}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">This will only take a few seconds.</p>
        </motion.div>
      )}

      {/* RESULTS DISPLAY */}
      {currentStep === 6 && result && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col overflow-y-auto px-6 py-6"
        >
          {/* Header banner */}
          <div className="flex flex-col items-center text-center py-6 border-b border-white/5">
            <div className="px-3.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] uppercase font-bold tracking-widest rounded-full font-mono">
              YOUR SONIC PROFILE
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white mt-3 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              {result.musicTaste}
            </h2>
            <p className="text-xs text-stone-400 mt-3 leading-relaxed italic max-w-sm">
              "{result.description}"
            </p>

            {/* Curated Genres Tags */}
            <div className="flex flex-wrap gap-1.5 justify-center mt-4">
              {result.recommendedGenres.map((g) => (
                <span 
                  key={g} 
                  className="px-2.5 py-1 bg-white/5 border border-white/5 text-[10px] font-mono text-stone-300 rounded-md"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* Core Go Ahead listening advice section */}
          <div className="mt-6 p-5 bg-gradient-to-b from-[#1a1512] to-[#0d0a09] rounded-2xl border border-white/5 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <Compass className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm tracking-tight text-white">How You Should Go Ahead Listening</h3>
            </div>
            
            {/* Guide Text */}
            <div className="text-xs text-stone-300 leading-relaxed space-y-3 prose prose-invert font-sans">
              {result.listeningGuide.split("\n\n").map((para, i) => {
                if (para.startsWith("###")) {
                  return <h4 key={i} className="text-xs font-bold text-white uppercase tracking-wider mt-4">{para.replace("###", "").trim()}</h4>;
                }
                if (para.startsWith("1.") || para.startsWith("2.") || para.startsWith("3.")) {
                  return <p key={i} className="pl-3 border-l-2 border-amber-500/30 text-stone-300 py-0.5">{para}</p>;
                }
                return <p key={i}>{para}</p>;
              })}
            </div>
          </div>

          {/* Curated gateway tracks for this taste */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <Music className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm tracking-tight text-white">Curated Gateway Songs for You</h3>
            </div>

            <div className="space-y-2.5">
              {result.suggestedSongs.map((song, i) => (
                <div 
                  key={song.id || i}
                  className="p-3 bg-white/5 border border-white/5 hover:border-amber-500/20 rounded-xl flex items-center justify-between gap-3 group transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <span className="text-xs font-mono text-amber-400/80 font-bold w-4">#{i+1}</span>
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">{song.title}</h4>
                      <p className="text-[10px] text-stone-400 truncate mt-0.5">{song.artist} • <span className="font-mono text-amber-400/70">{song.genre}</span></p>
                      {song.whyForYou && (
                        <p className="text-[9px] text-stone-550 italic mt-1 line-clamp-1">{song.whyForYou}</p>
                      )}
                    </div>
                  </div>
                  
                  <button
                    id={`play-quiz-song-${i}`}
                    onClick={() => onPlaySong(song)}
                    className="p-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-full flex-shrink-0 transition-transform active:scale-95 flex items-center justify-center shadow-lg shadow-amber-500/5"
                  >
                    <Play className="w-3.5 h-3.5 fill-stone-950 text-stone-950 ml-0.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Retake and Share controls */}
          <div className="mt-8 flex gap-3.5 pb-6">
            <button
              id="share-quiz-result-btn"
              onClick={handleShareResult}
              className="flex-1 bg-white/10 hover:bg-white/15 border border-white/5 text-white py-3 px-4 rounded-full font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              {isSharing ? <CheckCircle className="w-4 h-4 text-amber-400" /> : <Share2 className="w-4 h-4" />}
              {isSharing ? "Profile Copied!" : "Share Profile"}
            </button>
            <button
              id="retake-quiz-btn"
              onClick={startQuiz}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-stone-950 py-3 px-4 rounded-full font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/10 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Retake Quiz
            </button>
          </div>
        </motion.div>
      )}

    </div>
  );
}
