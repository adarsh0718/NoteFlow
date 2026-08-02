import React, { useState, useEffect, useRef } from "react";
import { 
  Home, 
  HelpCircle, 
  Award, 
  Sparkles, 
  Compass, 
  Music, 
  Share2, 
  Heart, 
  Plus, 
  User, 
  Layers, 
  ChevronRight, 
  Smartphone,
  CheckCircle2,
  Mail,
  Copy,
  FolderHeart,
  LogOut,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Song, Playlist, QuizResult } from "./types";
import { INITIAL_SONGS, INITIAL_PLAYLISTS, ASSETS } from "./data";

// Firebase and Firestore imports
import { 
  db, 
  auth, 
  initAuth, 
  googleSignIn, 
  logout, 
  handleFirestoreError, 
  OperationType, 
  sendGmailEmail 
} from "./firebase";
import { 
  collection, 
  query, 
  where, 
  setDoc, 
  doc, 
  deleteDoc, 
  onSnapshot, 
  getDocFromServer 
} from "firebase/firestore";

// Components
import MusicPlayer from "./components/MusicPlayer";
import MusicQuiz from "./components/MusicQuiz";
import Dashboard from "./components/Dashboard";
import AICoach from "./components/AICoach";


// --- Web Audio API Synth Backdrop Fallback ---
interface SynthInstance {
  audioCtx: AudioContext;
  oscillators: OscillatorNode[];
  gainNodes: GainNode[];
  filterNode: BiquadFilterNode;
  masterGain: GainNode;
  intervalId?: any;
}

let activeSynth: SynthInstance | null = null;

const stopSynth = () => {
  if (activeSynth) {
    try {
      activeSynth.oscillators.forEach(osc => {
        try { osc.stop(); } catch(e) {}
      });
      if (activeSynth.intervalId) clearInterval(activeSynth.intervalId);
      activeSynth.audioCtx.close();
    } catch (e) {
      console.warn("Error stopping synth", e);
    }
    activeSynth = null;
  }
};

const startSynth = (genre: string, masterVolume: number) => {
  stopSynth();
  
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();
    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime((masterVolume / 100) * 0.12, audioCtx.currentTime);

    const filterNode = audioCtx.createBiquadFilter();
    filterNode.type = "lowpass";
    filterNode.frequency.setValueAtTime(320, audioCtx.currentTime);
    filterNode.Q.setValueAtTime(2.5, audioCtx.currentTime);

    let freqs = [130.81, 196.00, 261.63, 329.63]; // C3, G3, C4, E4 (Cmaj7)
    
    const lowerGenre = (genre || "").toLowerCase();
    if (lowerGenre.includes("synth") || lowerGenre.includes("retro") || lowerGenre.includes("dance") || lowerGenre.includes("pop")) {
      freqs = [110.00, 164.81, 220.00, 261.63]; // A minor
    } else if (lowerGenre.includes("ambient") || lowerGenre.includes("chill") || lowerGenre.includes("lo-fi") || lowerGenre.includes("lofi")) {
      freqs = [155.56, 233.08, 311.13, 392.00]; // Eb major
    } else if (lowerGenre.includes("jazz")) {
      freqs = [98.00, 146.83, 174.61, 233.08]; // G minor
    }

    const oscillators: OscillatorNode[] = [];
    const gainNodes: GainNode[] = [];

    freqs.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.detune.setValueAtTime((idx - 1.5) * 5, audioCtx.currentTime);
      osc.type = "triangle";

      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 1.5 + idx * 0.5);
      
      osc.connect(gainNode);
      gainNode.connect(filterNode);

      osc.start();
      oscillators.push(osc);
      gainNodes.push(gainNode);
    });

    filterNode.connect(masterGain);
    masterGain.connect(audioCtx.destination);

    let goingUp = true;
    let currentCutoff = 320;
    const intervalId = setInterval(() => {
      if (!audioCtx || audioCtx.state === "closed") return;
      if (goingUp) {
        currentCutoff += 6;
        if (currentCutoff >= 550) goingUp = false;
      } else {
        currentCutoff -= 6;
        if (currentCutoff <= 220) goingUp = true;
      }
      try {
        filterNode.frequency.setValueAtTime(currentCutoff, audioCtx.currentTime);
      } catch (err) {}
    }, 120);

    activeSynth = {
      audioCtx,
      oscillators,
      gainNodes,
      filterNode,
      masterGain,
      intervalId
    };

  } catch (error) {
    console.error("Failed to start synthesizer backdrop:", error);
  }
};

export default function App() {
  const [songs, setSongs] = useState<Song[]>(INITIAL_SONGS);
  const [playlists, setPlaylists] = useState<Playlist[]>(INITIAL_PLAYLISTS);
  const [currentSong, setCurrentSong] = useState<Song | null>(songs[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"home" | "quiz" | "ai" | "dashboard">("home");
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  
  // State for user's taste quiz result
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  // --- Firebase & Auth States ---
  const [user, setUser] = useState<any>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isGmailSending, setIsGmailSending] = useState<boolean>(false);
  const [gmailError, setGmailError] = useState<string | null>(null);

  // Sharing states
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [sharingPlaylist, setSharingPlaylist] = useState<Playlist | null>(null);
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);
  const [directSharedEmail, setDirectSharedEmail] = useState<string>("");
  const [customEmail, setCustomEmail] = useState<string>("");
  const [sharedFeed, setSharedFeed] = useState<Array<{ playlist: Playlist; sharedBy: string; sharedTo: string }>>([]);

  // Google Sign-In helper
  const handleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setUserToken(result.accessToken);
      }
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  // Logout helper
  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setUserToken(null);
      setQuizResult(null);
      setSongs(INITIAL_SONGS);
      setPlaylists(INITIAL_PLAYLISTS);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setUserToken(token);
        setIsAuthLoading(false);
      },
      () => {
        setUser(null);
        setUserToken(null);
        setIsAuthLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Synchronize favorites, quiz results, user profiles, and shared playlists from Firestore in real-time
  useEffect(() => {
    if (!user) return;

    // Check & Create user profile
    const syncProfile = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const profileSnap = await getDocFromServer(userDocRef).catch(() => null);
        if (!profileSnap || !profileSnap.exists()) {
          await setDoc(userDocRef, {
            userId: user.uid,
            email: user.email || "",
            musicTaste: quizResult?.musicTaste || "Aesthetic Explorer",
            minutesListened: 0,
            updatedAt: new Date().toISOString()
          }).catch(err => handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`));
        }
      } catch (e) {
        console.error("Error syncing profile:", e);
      }
    };
    syncProfile();

    // Sync Favorites
    const favoritesRef = collection(db, "favorites");
    const favQuery = query(favoritesRef, where("userId", "==", user.uid));
    const unsubFavs = onSnapshot(favQuery, (snapshot) => {
      const favSongIds = snapshot.docs.map(d => d.data().songId);
      setSongs(prevSongs => 
        prevSongs.map(s => ({
          ...s,
          isFavorited: favSongIds.includes(s.id)
        }))
      );
    }, (err) => {
      console.error("Failed syncing favorites:", err);
    });

    // Sync Quiz Results
    const quizRef = collection(db, "quiz_results");
    const quizQuery = query(quizRef, where("userId", "==", user.uid));
    const unsubQuiz = onSnapshot(quizQuery, (snapshot) => {
      if (!snapshot.empty) {
        const sorted = snapshot.docs.map(d => d.data()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        const latest = sorted[0];
        setQuizResult({
          musicTaste: latest.musicTaste,
          description: latest.description || "Your custom taste description.",
          recommendedGenres: latest.matches || [],
          listeningGuide: latest.listeningGuide || "",
          suggestedSongs: latest.suggestedSongs || []
        });
      }
    }, (err) => {
      console.error("Failed syncing quiz results:", err);
    });

    // Sync Shared Playlists (Real-time community music feed)
    const sharedRef = collection(db, "shared_playlists");
    const userEmail = user.email || "";
    const unsubShared = onSnapshot(sharedRef, (snapshot) => {
      const sharesList = snapshot.docs.map(d => d.data())
        .filter(data => 
          data.sharedTo === userEmail || 
          data.sharedBy === userEmail || 
          data.sharedTo === user.uid || 
          data.sharedBy === user.uid
        )
        .map(data => ({
          playlist: {
            id: data.playlistId,
            name: data.name,
            description: data.description || "",
            coverUrl: data.coverUrl || "",
            songs: data.songs || [],
            creator: data.sharedBy
          },
          sharedBy: data.sharedBy,
          sharedTo: data.sharedTo
        }));
      setSharedFeed(sharesList);
    }, (err) => {
      console.error("Failed syncing shared playlists:", err);
    });

    return () => {
      unsubFavs();
      unsubQuiz();
      unsubShared();
    };
  }, [user]);


  // Filter state for home tab genres
  const [selectedGenreFilter, setSelectedGenreFilter] = useState<string | null>(null);

  // --- Lyria 3 & Synth Background Sound states ---
  const [bgAudioStatus, setBgAudioStatus] = useState<"idle" | "loading" | "playing_lyria" | "playing_synth" | "error" | "muted">("idle");
  const [bgVolume, setBgVolume] = useState<number>(30); // default low volume
  const [isBgMuted, setIsBgMuted] = useState<boolean>(false);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);

  // Set up audio ref once
  useEffect(() => {
    bgAudioRef.current = new Audio();
    bgAudioRef.current.loop = true;
    
    return () => {
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
        bgAudioRef.current = null;
      }
      stopSynth();
    };
  }, []);

  // Update volume and mute state
  useEffect(() => {
    if (bgAudioRef.current) {
      bgAudioRef.current.volume = isBgMuted ? 0 : bgVolume / 100;
    }
    if (activeSynth) {
      const targetGain = isBgMuted ? 0 : (bgVolume / 100) * 0.12;
      try {
        activeSynth.masterGain.gain.setValueAtTime(targetGain, activeSynth.audioCtx.currentTime);
      } catch (e) {}
    }
  }, [bgVolume, isBgMuted]);

  // Main backdrop manager
  const manageBackdropTrack = async (song: Song) => {
    if (isBgMuted) {
      stopSynth();
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
      }
      return;
    }

    setBgAudioStatus("loading");
    stopSynth();
    if (bgAudioRef.current) {
      bgAudioRef.current.pause();
      bgAudioRef.current.src = "";
    }

    try {
      console.log(`Starting backdrop generation with Lyria 3 model for: "${song.title}"`);
      const response = await fetch("/api/music/background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: song.title,
          artist: song.artist,
          genre: song.genre
        })
      });

      if (!response.ok) {
        throw new Error("Lyria 3 API returned failure");
      }

      const data = await response.json();
      if (data.audioData) {
        console.log("Lyria 3 music generated successfully!");
        
        // Decode base64 into Blob URL
        const binaryString = window.atob(data.audioData);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: data.mimeType || "audio/wav" });
        const blobUrl = URL.createObjectURL(blob);

        if (bgAudioRef.current) {
          bgAudioRef.current.src = blobUrl;
          bgAudioRef.current.volume = isBgMuted ? 0 : bgVolume / 100;
          await bgAudioRef.current.play();
          setBgAudioStatus("playing_lyria");
        } else {
          throw new Error("HTML5 Audio reference missing");
        }
      } else {
        throw new Error("Empty audio output");
      }
    } catch (err) {
      console.warn("Lyria 3 generation bypassed or failed. Activating Generative AI Synth backdrop instead:", err);
      // Fallback directly to detuned sweep synth
      startSynth(song.genre, bgVolume);
      setBgAudioStatus("playing_synth");
    }
  };

  // Sync backdrop track with main music player play/pause or selection changes
  useEffect(() => {
    if (isPlaying && currentSong) {
      manageBackdropTrack(currentSong);
    } else {
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
      }
      stopSynth();
    }
  }, [currentSong, isPlaying, isBgMuted]);

  // Set initial selected song if missing
  useEffect(() => {
    if (songs.length > 0 && !currentSong) {
      setCurrentSong(songs[0]);
    }
  }, [songs, currentSong]);

  // Play a song directly
  const handlePlaySong = (song: Song) => {
    // Add to state if it doesn't exist (e.g. dynamic quiz or AI recommended songs)
    setSongs((prev) => {
      const exists = prev.some((s) => s.title === song.title && s.artist === song.artist);
      if (!exists) {
        return [song, ...prev];
      }
      return prev;
    });

    setCurrentSong(song);
    setIsPlaying(true);
    
    // Register play interaction
    handleSongInteraction(song.id, "play");
  };

  // Skip tracks forward
  const handleNextTrack = () => {
    if (!currentSong) return;
    const activeSongs = selectedPlaylist ? selectedPlaylist.songs : songs;
    const idx = activeSongs.findIndex((s) => s.id === currentSong.id);
    if (idx !== -1 && idx < activeSongs.length - 1) {
      setCurrentSong(activeSongs[idx + 1]);
    } else {
      setCurrentSong(activeSongs[0]); // loop back
    }
    setIsPlaying(true);
  };

  // Skip tracks backward
  const handlePrevTrack = () => {
    if (!currentSong) return;
    const activeSongs = selectedPlaylist ? selectedPlaylist.songs : songs;
    const idx = activeSongs.findIndex((s) => s.id === currentSong.id);
    if (idx > 0) {
      setCurrentSong(activeSongs[idx - 1]);
    } else {
      setCurrentSong(activeSongs[activeSongs.length - 1]);
    }
    setIsPlaying(true);
  };

  // Toggle active playback state
  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  // Unified interactive feedback tracker with Firestore persistence
  const handleSongInteraction = (songId: string, actionType: "play" | "lyrics" | "heart" | "share") => {
    setSongs((prevSongs) => 
      prevSongs.map((song) => {
        if (song.id === songId) {
          let extraScore = 0;
          let extraListen = 0;
          let favorited = song.isFavorited;

          switch (actionType) {
            case "play":
              extraScore = 1;
              extraListen = 1;
              break;
            case "lyrics":
              extraScore = 5;
              break;
            case "heart":
              extraScore = 8;
              favorited = !song.isFavorited;
              break;
            case "share":
              extraScore = 10;
              break;
          }

          // If logged in and toggled favorite, write or delete from Firestore
          if (user && actionType === "heart") {
            const isNowFavoriting = !song.isFavorited;
            const favId = `${user.uid}_${songId}`;
            const favDocRef = doc(db, "favorites", favId);

            if (isNowFavoriting) {
              setDoc(favDocRef, {
                id: favId,
                userId: user.uid,
                songId: songId,
                createdAt: new Date().toISOString()
              }).catch(err => handleFirestoreError(err, OperationType.CREATE, `favorites/${favId}`));
            } else {
              deleteDoc(favDocRef).catch(err => handleFirestoreError(err, OperationType.DELETE, `favorites/${favId}`));
            }
          }

          return {
            ...song,
            listenCount: song.listenCount + extraListen,
            interactionsCount: song.interactionsCount + extraScore,
            isFavorited: favorited
          };
        }
        return song;
      })
    );

    // Sync currentSong reference if it is active
    if (currentSong && currentSong.id === songId) {
      setCurrentSong((prev) => {
        if (!prev) return null;
        let favorited = prev.isFavorited;
        if (actionType === "heart") favorited = !prev.isFavorited;
        return {
          ...prev,
          listenCount: prev.listenCount + (actionType === "play" ? 1 : 0),
          interactionsCount: prev.interactionsCount + (actionType === "play" ? 1 : actionType === "lyrics" ? 5 : actionType === "heart" ? 8 : 10),
          isFavorited: favorited
        };
      });
    }
  };

  // Triggered when a quiz is successfully completed
  const handleQuizComplete = (result: QuizResult) => {
    setQuizResult(result);

    // Save quiz result to Firestore if user is authenticated
    if (user) {
      const resultId = `${user.uid}_${Date.now()}`;
      const resultDocRef = doc(db, "quiz_results", resultId);
      setDoc(resultDocRef, {
        userId: user.uid,
        musicTaste: result.musicTaste,
        description: result.description,
        matches: result.recommendedGenres,
        answers: [],
        listeningGuide: result.listeningGuide,
        suggestedSongs: result.suggestedSongs,
        createdAt: new Date().toISOString()
      }).catch(err => handleFirestoreError(err, OperationType.CREATE, `quiz_results/${resultId}`));
    }

    // Add suggested gateway songs to the songs list
    result.suggestedSongs.forEach((song) => {
      setSongs((prev) => {
        const exists = prev.some((s) => s.title === song.title);
        if (!exists) return [song, ...prev];
        return prev;
      });
    });

    // Create a special custom playlist from quiz results!
    const quizPlaylist: Playlist = {
      id: `quiz-playlist-${Date.now()}`,
      name: `${result.musicTaste} Gateways`,
      description: `Gemini-curated music styles custom built to branch out your soundscapes.`,
      coverUrl: "/src/assets/images/echoes_album_art_1783004468657.jpg",
      songs: result.suggestedSongs,
      creator: "NoteFlow Taste AI"
    };

    setPlaylists(prev => {
      const exists = prev.some((p) => p.name === quizPlaylist.name);
      if (!exists) return [quizPlaylist, ...prev];
      return prev;
    });
  };

  // Handles adding new playlists curated via AI suggestions
  const handleAddPlaylist = (newPlaylist: Playlist) => {
    setPlaylists((prev) => [newPlaylist, ...prev]);
    // Also include songs in core library listing
    newPlaylist.songs.forEach((song) => {
      setSongs((prev) => {
        const exists = prev.some((s) => s.title === song.title);
        if (!exists) return [song, ...prev];
        return prev;
      });
    });
    setSelectedPlaylist(newPlaylist);
    setActiveTab("home");
  };

  // Launches playlist share overlay
  const handleOpenShare = (playlist: Playlist) => {
    setSharingPlaylist(playlist);
    setIsShareModalOpen(true);
    setShareSuccess(false);
    setDirectSharedEmail("");
    setCustomEmail("");
  };

  // Launches song share overlay
  const handleOpenShareSong = (song: Song) => {
    const songPlaylist: Playlist = {
      id: `song-share-${song.id}`,
      name: song.title,
      description: `Track by ${song.artist}`,
      coverUrl: song.coverUrl,
      songs: [song],
      creator: "Shared Song"
    };
    handleOpenShare(songPlaylist);
  };

  const handleShareSubmit = async (email: string) => {
    if (!sharingPlaylist) return;
    setDirectSharedEmail(email);
    setGmailError(null);

    const shareId = `${user?.uid || "guest"}_${Date.now()}`;

    // 1. If signed in, sync the shared playlist item in Firestore
    if (user) {
      const shareDocRef = doc(db, "shared_playlists", shareId);
      await setDoc(shareDocRef, {
        id: shareId,
        playlistId: sharingPlaylist.id,
        name: sharingPlaylist.name,
        description: sharingPlaylist.description || "",
        coverUrl: sharingPlaylist.coverUrl || "",
        songs: sharingPlaylist.songs,
        sharedBy: user.email || user.uid,
        sharedTo: email,
        createdAt: new Date().toISOString()
      }).catch(err => handleFirestoreError(err, OperationType.CREATE, `shared_playlists/${shareId}`));
    }

    // 2. If email address is provided and Gmail OAuth token exists, send a REAL email via Gmail API!
    if (user && userToken && email && email !== "public-link" && email.includes("@")) {
      setIsGmailSending(true);
      try {
        const emailSubject = `🎵 NoteFlow: ${user.displayName || "Someone"} shared a playlist with you!`;
        const songsListHtml = sharingPlaylist.songs.map((song, i) => `
          <div style="font-size: 13px; margin-bottom: 8px; color: #e7e5e4;">
            <span style="font-family: monospace; color: #f59e0b; font-weight: bold; margin-right: 6px;">0${i+1}</span>
            <strong style="color: #ffffff;">${song.title}</strong> - <span style="color: #a8a29e;">${song.artist}</span> <span style="font-size: 11px; background: rgba(245, 158, 11, 0.1); color: #f59e0b; padding: 2px 6px; border-radius: 4px; font-family: monospace; margin-left: 6px;">${song.genre}</span>
          </div>
        `).join('');

        const emailHtml = `
          <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #0d0a09; color: #ffffff; padding: 32px; border-radius: 20px; max-width: 520px; border: 1px solid rgba(255,255,255,0.05);">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
              <h2 style="color: #f59e0b; font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin: 0;">NoteFlow</h2>
            </div>
            <p style="font-size: 15px; color: #e7e5e4; line-height: 1.6; margin-top: 0; margin-bottom: 20px;">
              Hey there! <strong style="color: #f59e0b;">${user.email}</strong> is exploring music on NoteFlow and shared an interactive playlist with you:
            </p>
            <div style="background-color: #14100e; border-radius: 16px; padding: 24px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.05);">
              <h3 style="font-size: 18px; font-weight: 800; color: #ffffff; margin: 0 0 8px 0;">${sharingPlaylist.name}</h3>
              <p style="font-size: 12px; color: #a8a29e; line-height: 1.5; margin: 0 0 20px 0;">${sharingPlaylist.description}</p>
              <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px;">
                ${songsListHtml}
              </div>
            </div>
            <p style="font-size: 11px; color: #a8a29e; line-height: 1.5; margin: 0; text-align: center;">
              You can listen to this playlist directly inside NoteFlow. Click "Listen" in the shared social feed tab under your NoteFlow dashboard!
            </p>
            <div style="border-top: 1px solid rgba(255,255,255,0.05); margin-top: 24px; padding-top: 16px; text-align: center;">
              <span style="font-size: 10px; color: #78716c;">Sent with user authorization via Google Gmail API integration.</span>
            </div>
          </div>
        `;

        await sendGmailEmail(userToken, email, emailSubject, emailHtml);
        console.log("Successfully sent playlist share email via Gmail API to:", email);
      } catch (err: any) {
        console.error("Failed to send Gmail share:", err);
        setGmailError(err.message || "Could not send email. Please check Gmail permissions.");
      } finally {
        setIsGmailSending(false);
      }
    }

    setShareSuccess(true);
    
    // Add to the local interactive feed if unauthenticated (otherwise real-time onSnapshot handles it)
    if (!user) {
      setSharedFeed(prev => [
        {
          playlist: sharingPlaylist,
          sharedBy: "Guest",
          sharedTo: email || "Guest"
        },
        ...prev
      ]);
    }

    // Track share interaction score on the songs of this playlist!
    sharingPlaylist.songs.forEach((s) => {
      handleSongInteraction(s.id, "share");
    });

    setTimeout(() => {
      setIsShareModalOpen(false);
      setShareSuccess(false);
      setGmailError(null);
    }, 2800);
  };

  // Get distinct genres listed in current library for filtering
  const genresList = Array.from(new Set(songs.map((s) => s.genre))) as string[];

  // Filter songs by selected genre if filter exists
  const displayedSongs = selectedGenreFilter 
    ? songs.filter((s) => s.genre === selectedGenreFilter)
    : songs;

  return (
    <div className="min-h-screen bg-[#0d0a09] flex flex-col items-center justify-center font-sans antialiased py-6 px-4 md:py-10">
      
      {/* Container - adapts from smartphone style to high-fidelity desktop widescreen app on laptops/computers */}
      <div className="w-full max-w-md md:max-w-6xl h-[840px] md:h-[860px] bg-[#14100e] rounded-[40px] md:rounded-3xl border-[10px] md:border-4 border-stone-850/60 shadow-2xl relative overflow-hidden flex flex-col md:flex-row">
        
        {/* Desktop Sidebar (hidden on mobile, beautiful left panel on computers/laptops) */}
        <div className="hidden md:flex flex-col w-64 bg-[#0d0a09] border-r border-white/5 p-6 justify-between flex-shrink-0">
          <div className="space-y-8">
            {/* Logo */}
            <div className="flex items-center gap-3 px-1">
              <img 
                src={ASSETS.sraadalyLogo} 
                alt="NoteFlow Logo" 
                className="w-8 h-8 rounded-lg object-cover shadow-lg shadow-amber-500/20 border border-white/10"
                referrerPolicy="no-referrer"
              />
              <h1 className="font-black text-base uppercase tracking-[0.15em] text-amber-500">NoteFlow</h1>
            </div>

            {/* Navigation tabs */}
            <div className="space-y-1.5">
              <button
                id="sidebar-tab-home"
                onClick={() => setActiveTab("home")}
                className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider font-mono transition-all ${
                  activeTab === "home" 
                    ? "bg-amber-500 text-stone-950 font-bold shadow-lg shadow-amber-500/10" 
                    : "text-stone-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Explore</span>
              </button>
              
              <button
                id="sidebar-tab-quiz"
                onClick={() => setActiveTab("quiz")}
                className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider font-mono transition-all ${
                  activeTab === "quiz" 
                    ? "bg-amber-500 text-stone-950 font-bold shadow-lg shadow-amber-500/10" 
                    : "text-stone-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Taste Quiz</span>
              </button>

              <button
                id="sidebar-tab-ai"
                onClick={() => setActiveTab("ai")}
                className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider font-mono transition-all ${
                  activeTab === "ai" 
                    ? "bg-amber-500 text-stone-950 font-bold shadow-lg shadow-amber-500/10" 
                    : "text-stone-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Smart AI Hub</span>
              </button>

              <button
                id="sidebar-tab-dashboard"
                onClick={() => setActiveTab("dashboard")}
                className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider font-mono transition-all ${
                  activeTab === "dashboard" 
                    ? "bg-amber-500 text-stone-950 font-bold shadow-lg shadow-amber-500/10" 
                    : "text-stone-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
            </div>

            {/* Quick stats panel */}
            <div className="pt-4 border-t border-white/5">
              <span className="text-[10px] font-mono text-stone-550 uppercase tracking-widest block px-1 mb-2">Available Genres</span>
              <div className="flex flex-col gap-1 max-h-[180px] overflow-y-auto scrollbar-none">
                {genresList.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => {
                      setSelectedGenreFilter(selectedGenreFilter === genre ? null : genre);
                      setActiveTab("home");
                    }}
                    className={`text-left px-3 py-1.5 rounded-lg text-[11px] truncate transition-colors ${
                      selectedGenreFilter === genre 
                        ? "text-amber-400 bg-amber-500/5 font-semibold" 
                        : "text-stone-400 hover:text-stone-200 hover:bg-white/5"
                    }`}
                  >
                    • {genre}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active profile card */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col gap-2">
            {isAuthLoading ? (
              <div className="flex items-center gap-2 py-1 justify-center text-stone-500 font-mono text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                <span>Checking...</span>
              </div>
            ) : user ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt="Profile" 
                        className="w-7 h-7 rounded-full object-cover border border-white/10" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-stone-800 flex items-center justify-center text-stone-300">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <p className="text-[11px] text-white font-bold truncate max-w-[130px]" title={user.email}>{user.displayName || user.email}</p>
                      <p className="text-[9px] text-amber-500 font-mono">Taste Explorer</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-1 hover:bg-white/10 rounded-lg text-stone-400 hover:text-white transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
                {quizResult && (
                  <div className="mt-1 pt-2 border-t border-white/5 text-[10px] text-stone-400 leading-relaxed">
                    Taste: <span className="text-amber-400 font-bold">{quizResult.musicTaste}</span>.
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-[10px] text-stone-400 leading-relaxed text-center">
                  Sign in to store your taste profile, favorites, and share playlists via Gmail!
                </p>
                <button
                  onClick={handleLogin}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono font-semibold text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In with Google</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main interactive screen container (adapted to take remaining row space on wide screens) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">

          {/* Notch / Speaker bar for smartphone style (hidden on computers/laptops) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-white/5 rounded-b-2xl z-50 flex items-center justify-center md:hidden">
            <div className="w-12 h-1 bg-[#0d0a09] rounded-full mb-1" />
          </div>

          {/* Header App Banner (hidden on computers/laptops) */}
          <div className="pt-8 pb-3 px-6 border-b border-white/5 flex items-center justify-between bg-[#14100e]/85 backdrop-blur md:hidden">
            <div className="flex items-center gap-2">
              <img 
                src={ASSETS.sraadalyLogo} 
                alt="NoteFlow Logo" 
                className="w-6 h-6 rounded-md object-cover shadow-lg shadow-amber-500/20 border border-white/10"
                referrerPolicy="no-referrer"
              />
              <h1 className="font-black text-sm uppercase tracking-[0.15em] text-amber-500">NoteFlow</h1>
            </div>
            
            <button 
              id="profile-info-btn"
              className="p-1.5 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
              title="User Profile"
            >
              <User className="w-4 h-4" />
            </button>
          </div>

        {/* Lyria 3 Background Sound Control Bar */}
        <div className="px-6 py-2.5 bg-gradient-to-r from-[#1a1412] to-[#14100e] border-b border-white/5 flex flex-col gap-1.5 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                bgAudioStatus === "loading" 
                  ? "bg-amber-500/20 text-amber-400 animate-pulse" 
                  : bgAudioStatus.startsWith("playing") 
                    ? "bg-amber-500/15 text-amber-400 animate-bounce" 
                    : "bg-white/5 text-stone-500"
              }`}>
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  Lyria 3 Backdrop
                  {bgAudioStatus === "playing_lyria" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                  )}
                </span>
                <span className="text-[10px] text-stone-300 font-semibold truncate max-w-[170px]">
                  {bgAudioStatus === "loading" && "Tuning Lyria soundscape..."}
                  {bgAudioStatus === "playing_lyria" && `Lyria 3: ${currentSong?.title}`}
                  {bgAudioStatus === "playing_synth" && `AI Synth: ${currentSong?.genre}`}
                  {bgAudioStatus === "idle" && "Ready to play backing track"}
                  {isBgMuted && "Backdrop Muted"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="toggle-bg-mute-btn"
                onClick={() => setIsBgMuted(!isBgMuted)}
                className={`px-2 py-1 rounded-lg border text-[10px] font-bold transition-all active:scale-95 ${
                  isBgMuted 
                    ? "bg-red-500/10 border-red-500/20 text-red-400" 
                    : bgAudioStatus.startsWith("playing")
                      ? "bg-amber-500/15 border-amber-500/20 text-amber-400 hover:bg-amber-500/25"
                      : "bg-white/5 border-white/10 text-stone-400 hover:text-white"
                }`}
                title={isBgMuted ? "Unmute Backdrop" : "Mute Backdrop"}
              >
                {isBgMuted ? "Muted" : bgAudioStatus === "loading" ? "Loading" : "Active"}
              </button>
            </div>
          </div>

          {/* Simple compact volume slider */}
          {!isBgMuted && (bgAudioStatus.startsWith("playing") || bgAudioStatus === "loading") && (
            <div className="flex items-center gap-2 text-[9px] text-stone-500 font-mono mt-0.5">
              <span>Vol</span>
              <input
                type="range"
                min="0"
                max="100"
                value={bgVolume}
                onChange={(e) => setBgVolume(parseInt(e.target.value, 10))}
                className="flex-1 h-0.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <span className="w-6 text-right text-stone-400">{bgVolume}%</span>
            </div>
          )}
        </div>

        {/* Central screen content container */}
        <div className="flex-1 overflow-y-auto scrollbar-none pb-32">
          
          {/* HOME / EXPLORE TAB */}
          {activeTab === "home" && (
            <div className="px-6 py-6 space-y-7">
              
              {/* Introduction Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-tr from-amber-500/10 to-orange-600/5 border border-amber-500/20 relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Decode Your Taste
                </h3>
                <p className="text-[11px] text-stone-300 mt-2 leading-relaxed">
                  Take the aesthetic quiz to map out a custom listening roadmap and unlock Gemini curated styles!
                </p>
                <button
                  id="home-start-quiz-btn"
                  onClick={() => setActiveTab("quiz")}
                  className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[10px] rounded-full transition-colors flex items-center gap-1 shadow-lg shadow-amber-500/20 active:scale-95"
                >
                  <Compass className="w-3.5 h-3.5" /> Start Taste Quiz
                </button>
              </div>

              {/* Curated Playlists section */}
              <div>
                <h3 className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider mb-4">Recommended Playlists</h3>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                  {playlists.map((playlist) => (
                    <div 
                      key={playlist.id}
                      id={`playlist-card-${playlist.id}`}
                      onClick={() => setSelectedPlaylist(playlist)}
                      className="w-32 flex-shrink-0 cursor-pointer group"
                    >
                      <div className="relative aspect-square rounded-xl overflow-hidden border border-white/5 bg-[#0d0a09]">
                        <img 
                          src={playlist.coverUrl} 
                          alt={playlist.name} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button className="p-2.5 bg-amber-500 rounded-full text-stone-950 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all">
                            <Music className="w-4 h-4 fill-stone-950 text-stone-950" />
                          </button>
                        </div>
                      </div>
                      <h4 className="text-xs font-bold text-white mt-2.5 truncate group-hover:text-amber-400 transition-colors">{playlist.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">{playlist.creator}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Playlist details overlay if selected */}
              {selectedPlaylist && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 bg-white/5 border border-white/5 rounded-2xl relative"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] text-amber-400 font-mono font-bold uppercase">PLAYLIST VIEWER</span>
                      <h3 className="text-sm font-bold text-white mt-1">{selectedPlaylist.name}</h3>
                      <p className="text-[10px] text-stone-300 mt-1 leading-relaxed">{selectedPlaylist.description}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        id="share-playlist-icon-btn"
                        onClick={() => handleOpenShare(selectedPlaylist)}
                        className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-amber-400 rounded-full transition-colors"
                        title="Share Playlist"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setSelectedPlaylist(null)} 
                        className="text-xs text-slate-400 hover:text-white font-semibold"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {selectedPlaylist.songs.map((song, i) => (
                      <div 
                        key={song.id}
                        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-between gap-2 group transition-colors cursor-pointer"
                        onClick={() => handlePlaySong(song)}
                      >
                        <div className="flex items-center gap-2 overflow-hidden flex-1">
                          <span className="text-[10px] font-mono text-slate-500 font-semibold">0{i+1}</span>
                          <span className="text-xs font-semibold text-white truncate group-hover:text-amber-400 transition-colors">{song.title}</span>
                          <span className="text-[10px] text-slate-500">•</span>
                          <span className="text-[10px] text-slate-400 truncate">{song.artist}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">{song.duration}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Shared Playlists Feed Section */}
              {sharedFeed.length > 0 && (
                <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-2xl">
                  <h3 className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                    <FolderHeart className="w-4 h-4" /> Shared with you / Shared by you
                  </h3>
                  <div className="mt-3 space-y-2.5">
                    {sharedFeed.map((item, idx) => (
                      <div key={idx} className="p-3 bg-[#0d0a09] border border-white/5 rounded-xl flex items-center justify-between gap-3 text-xs">
                        <div className="overflow-hidden flex-1">
                          <p className="text-slate-300 font-medium">Shared <span className="text-amber-400">"{item.playlist.name}"</span></p>
                          <p className="text-[9px] text-slate-500 mt-1">To: {item.sharedTo} • By: {item.sharedBy}</p>
                        </div>
                        <button
                          id={`listen-shared-playlist-${idx}`}
                          onClick={() => {
                            setSelectedPlaylist(item.playlist);
                            if (item.playlist.songs.length > 0) {
                              handlePlaySong(item.playlist.songs[0]);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-amber-500 text-stone-950 font-bold text-[9px] rounded-full transition-transform active:scale-95"
                        >
                          Listen
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggest Genres section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">Suggest Genres</h3>
                  {selectedGenreFilter && (
                    <button 
                      onClick={() => setSelectedGenreFilter(null)} 
                      className="text-[10px] text-amber-400 hover:underline"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {genresList.map((genre) => {
                    const isActive = selectedGenreFilter === genre;
                    return (
                      <button
                        key={genre}
                        id={`genre-pill-${genre.toLowerCase().replace(/\s+/g, "-")}`}
                        onClick={() => setSelectedGenreFilter(isActive ? null : genre)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-all ${
                          isActive 
                            ? "bg-amber-500 text-stone-950 font-bold shadow-lg shadow-amber-500/20" 
                            : "bg-white/5 hover:bg-white/10 border border-white/5 text-stone-300"
                        }`}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Music catalog listing */}
              <div>
                <h3 className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider mb-4">All Tracks</h3>
                <div className="space-y-3">
                  {displayedSongs.map((song) => (
                    <div
                      key={song.id}
                      id={`song-row-${song.id}`}
                      onClick={() => handlePlaySong(song)}
                      className="p-3 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-between gap-3 group cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3 overflow-hidden flex-1">
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-white/5">
                          <img src={song.coverUrl} alt={song.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">{song.title}</h4>
                          <p className="text-[10px] text-stone-400 truncate mt-0.5">{song.artist} • <span className="font-mono text-amber-400/80">{song.genre}</span></p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {song.isFavorited && (
                          <Heart className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        )}
                        <span className="text-[10px] font-mono text-stone-400">{song.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* MUSIC QUIZ TAB */}
          {activeTab === "quiz" && (
            <MusicQuiz 
              onQuizComplete={handleQuizComplete} 
              onPlaySong={handlePlaySong}
              savedResult={quizResult}
            />
          )}

          {/* SMART AI HUB TAB */}
          {activeTab === "ai" && (
            <AICoach 
              onPlaySong={handlePlaySong}
              onAddPlaylist={handleAddPlaylist}
            />
          )}

          {/* DATA DASHBOARD TAB */}
          {activeTab === "dashboard" && (
            <Dashboard 
              songs={songs} 
              quizResult={quizResult}
              sharedFeed={sharedFeed}
              onPlaySong={handlePlaySong}
              onNavigateToQuiz={() => setActiveTab("quiz")}
              onNavigateToExplore={() => setActiveTab("home")}
            />
          )}

        </div>

        {/* Global Floating Player bottom container */}
        <MusicPlayer 
          currentSong={currentSong}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onNext={handleNextTrack}
          onPrev={handlePrevTrack}
          onInteraction={handleSongInteraction}
          onShare={handleOpenShareSong}
        />

        {/* Bottom tab bar navigation */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#14100e]/95 backdrop-blur-md border-t border-white/5 flex items-center justify-around px-2 z-30 md:hidden">
          <button 
            id="nav-tab-home"
            onClick={() => setActiveTab("home")} 
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${activeTab === "home" ? "text-amber-400" : "text-stone-500 hover:text-white"}`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[9px] font-semibold tracking-wider uppercase font-mono">Explore</span>
          </button>
          
          <button 
            id="nav-tab-quiz"
            onClick={() => setActiveTab("quiz")} 
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${activeTab === "quiz" ? "text-amber-400" : "text-stone-500 hover:text-white"}`}
          >
            <HelpCircle className="w-5 h-5" />
            <span className="text-[9px] font-semibold tracking-wider uppercase font-mono">Quiz</span>
          </button>

          <button 
            id="nav-tab-ai"
            onClick={() => setActiveTab("ai")} 
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${activeTab === "ai" ? "text-amber-400" : "text-stone-500 hover:text-white"}`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[9px] font-semibold tracking-wider uppercase font-mono">AI Hub</span>
          </button>

          <button 
            id="nav-tab-dashboard"
            onClick={() => setActiveTab("dashboard")} 
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${activeTab === "dashboard" ? "text-amber-400" : "text-stone-500 hover:text-white"}`}
          >
            <Award className="w-5 h-5" />
            <span className="text-[9px] font-semibold tracking-wider uppercase font-mono">Me</span>
          </button>
        </div>

        {/* Shared playlist global modal */}
        <AnimatePresence>
          {isShareModalOpen && sharingPlaylist && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 text-white flex flex-col gap-4 shadow-2xl"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] text-amber-400 font-mono font-bold uppercase tracking-wider">SHARE PLAYLIST</span>
                    <h3 className="text-sm font-bold mt-1 text-white">Share "{sharingPlaylist.name}"</h3>
                  </div>
                  <button 
                    onClick={() => setIsShareModalOpen(false)}
                    className="text-xs text-stone-400 hover:text-white font-semibold"
                  >
                    Cancel
                  </button>
                </div>

                <p className="text-[11px] text-stone-300 leading-relaxed">
                  Send this playlist directly to other users. You can quick-share with the app creator at <span className="text-amber-400">adarshpeddada@gmail.com</span>!
                </p>

                {shareSuccess ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-amber-400 text-xs"
                  >
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-bold">Successfully Shared!</span>
                      <span className="text-[10px] text-stone-400">
                        {gmailError ? `Saved to shared feed. (Gmail error: ${gmailError})` : `Sent to ${directSharedEmail || "feed"}`}
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {/* User email input */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">Recipient Email</label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          placeholder="friend@example.com"
                          className="flex-1 bg-stone-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 transition-colors"
                          value={customEmail}
                          onChange={(e) => setCustomEmail(e.target.value)}
                        />
                        <button
                          id="send-custom-email-btn"
                          disabled={isGmailSending || !customEmail.includes("@")}
                          onClick={() => handleShareSubmit(customEmail)}
                          className="px-4 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-800 disabled:text-stone-500 text-stone-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                        >
                          {isGmailSending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            "Send"
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="text-[10px] text-stone-500 text-center font-mono my-1">— OR —</div>

                    <div className="flex flex-col gap-2">
                      <button
                        id="direct-share-user-email-btn"
                        disabled={isGmailSending}
                        onClick={() => handleShareSubmit("adarshpeddada@gmail.com")}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                      >
                        <Mail className="w-4 h-4 fill-stone-950" />
                        Send to adarshpeddada@gmail.com
                      </button>
                      <button
                        id="copy-playlist-link-btn"
                        disabled={isGmailSending}
                        onClick={() => handleShareSubmit("public-link")}
                        className="w-full bg-white/5 hover:bg-white/10 border border-white/5 text-white py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Shareable Link
                      </button>
                    </div>

                    {!user && (
                      <div className="mt-2 text-center p-2.5 bg-amber-500/5 rounded-xl border border-amber-500/10">
                        <p className="text-[10px] text-stone-400 leading-relaxed mb-1.5">
                          Want to send a real email from your account?
                        </p>
                        <button
                          onClick={() => {
                            setIsShareModalOpen(false);
                            handleLogin();
                          }}
                          className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 underline"
                        >
                          Sign in with Google
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        </div> {/* End of main interactive screen container */}

      </div>
    </div>
  );
}
