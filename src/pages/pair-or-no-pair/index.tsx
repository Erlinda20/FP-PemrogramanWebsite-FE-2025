import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/api/axios";
import { useAuthStore } from "@/store/useAuthStore";
import catImage from "./images/cat_image_1765100975047.png";
import dogImage from "./images/dog_image_1765100992258.png";
import appleImage from "./images/apple_image_1765101007846.png";
import bananaImage from "./images/banana_image_1765101026607.png";
import bookImage from "./images/book_image_1765101040471.png";
import cameraImage from "./images/camera_image_1765101057432.png";
import birdImage from "./images/bird_image_1765101071924.png";

import elephantImage from "./images/elephant_image_1765101136986.png";

// --- TIPE DATA ---
interface Item {
  id: string;
  left_content: string;
  right_content: string;
}

interface GridCardData {
  uniqueId: string; // ID unik untuk setiap kartu di grid
  itemId: string; // ID item untuk pencocokan (pasangan punya ID sama)
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
  isShaking?: boolean;
}

//cek gambar
const isImageUrl = (content: string) => {
  if (!content || typeof content !== "string") return false;
  const trimmed = content.trim();
  // Check for http URLs
  if (trimmed.startsWith("http")) return true;
  // Check for local asset paths (Vite dev mode)
  if (
    trimmed.startsWith("/src/") &&
    /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(trimmed)
  )
    return true;
  // Check for data URLs
  if (trimmed.startsWith("data:image/")) return true;
  return false;
};

// --- SOUND EFFECTS HOOK ---
const useSoundEffects = (isSoundOn: boolean) => {
  const introAudioRef = useRef<HTMLAudioElement | null>(null);
  const gameAudioRef = useRef<HTMLAudioElement | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);
  const flipAudioRef = useRef<HTMLAudioElement | null>(null);
  const matchAudioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    try {
      // Intro
      introAudioRef.current = new Audio(
        new URL("./audio/kahoot-lobby.mp3", import.meta.url).href,
      );
      introAudioRef.current.loop = true;
      introAudioRef.current.volume = 0.5;
      introAudioRef.current.preload = "auto";

      // Game BGM
      gameAudioRef.current = new Audio(
        new URL("./audio/happy-day.mp3", import.meta.url).href,
      );
      gameAudioRef.current.loop = true;
      gameAudioRef.current.volume = 0.5;
      gameAudioRef.current.preload = "auto";

      // Win sound
      winAudioRef.current = new Audio(
        "https://www.myinstants.com/media/sounds/final-fantasy-vii-victory-fanfare-1.mp3",
      );
      winAudioRef.current.preload = "auto";

      // SFX
      flipAudioRef.current = new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3",
      ); // Flip sfx
      flipAudioRef.current.preload = "auto";
      
      matchAudioRef.current = new Audio(
        "https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3",
      ); // Ding sfx
      matchAudioRef.current.preload = "auto";

      return () => {
        introAudioRef.current?.pause();
        gameAudioRef.current?.pause();
        winAudioRef.current?.pause();
      };
    } catch (error) {
      console.error("Error initializing audio:", error);
    }
  }, []);

  useEffect(() => {
    if (introAudioRef.current)
      introAudioRef.current.volume = isSoundOn ? 0.3 : 0;
    if (gameAudioRef.current) gameAudioRef.current.volume = isSoundOn ? 0.3 : 0;
    if (winAudioRef.current) winAudioRef.current.volume = isSoundOn ? 0.4 : 0;
  }, [isSoundOn]);

  const playIntroBGM = () => {
    if (!isSoundOn) return;
    gameAudioRef.current?.pause();
    if (introAudioRef.current) {
      introAudioRef.current.currentTime = 0;
      introAudioRef.current.play().catch((err) => {
        console.error("Error playing intro BGM:", err);
        // Try to unlock audio context
        if (err.name === 'NotAllowedError') {
          console.warn("Audio autoplay blocked. User interaction required.");
        }
      });
    }
  };

  const playGameBGM = () => {
    if (!isSoundOn) return;
    introAudioRef.current?.pause();
    if (gameAudioRef.current) {
      gameAudioRef.current.currentTime = 0;
      gameAudioRef.current.play().catch((err) => {
        console.error("Error playing game BGM:", err);
        // Try to unlock audio context
        if (err.name === 'NotAllowedError') {
          console.warn("Audio autoplay blocked. User interaction required.");
        }
      });
    }
  };

  const playWin = () => {
    if (!isSoundOn) return;
    gameAudioRef.current?.pause();
    if (winAudioRef.current) {
      winAudioRef.current.currentTime = 0;
      winAudioRef.current.play().catch((err) => {
        console.error("Error playing win sound:", err);
      });
    }
  };

  const playFlip = () => {
    if (isSoundOn && flipAudioRef.current) {
      flipAudioRef.current.currentTime = 0;
      flipAudioRef.current.play().catch(() => {});
    }
  };

  const playMatch = () => {
    if (isSoundOn && matchAudioRef.current) {
      matchAudioRef.current.currentTime = 0;
      matchAudioRef.current.play().catch(() => {});
    }
  };

  const playMismatch = () => {
    // Simple buzzer
    if (!isSoundOn) return;
    const ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  };

  const unlockAudio = () => {
    const audioElements = [
      introAudioRef.current,
      gameAudioRef.current,
      winAudioRef.current,
    ].filter(Boolean) as HTMLAudioElement[];

    audioElements.forEach((audio) => {
      if (audio) {
        audio.volume = 0.01; 
        audio.play()
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
            if (audio === introAudioRef.current || audio === gameAudioRef.current) {
              audio.volume = isSoundOn ? 0.3 : 0;
            } else if (audio === winAudioRef.current) {
              audio.volume = isSoundOn ? 0.4 : 0;
            }
          })
          .catch((err) => {
            console.log("Audio unlock attempt:", err);
          });
      }
    });
  };

  return {
    playIntroBGM,
    playGameBGM,
    playWin,
    playFlip,
    playMatch,
    playMismatch,
    unlockAudio,
  };
};

// --- KOMPONEN KARTU GRID ---
const GridCard = ({
  card,
  onClick,
}: {
  card: GridCardData;
  onClick: () => void;
}) => {
  const isImage = isImageUrl(card.content);

  return (
    <div
      className={`relative w-full h-full aspect-3/4 max-h-[18vh] cursor-pointer perspective-1000 ${
        card.isShaking ? "animate-shake" : ""
      } ${
        card.isMatched
          ? "pointer-events-none"
          : "hover:scale-[1.02] transition-transform duration-200"
      }`}
      onClick={onClick}
    >
      <div
        className={`relative w-full h-full transition-all duration-500 transform border-2 rounded-xl shadow-md ${
          card.isFlipped ? "rotate-y-180" : ""
        } ${
          card.isMatched
            ? "border-green-400 ring-4 ring-green-300 shadow-[0_0_20px_rgba(74,222,128,0.6)]"
            : "border-slate-300/50"
        }`}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Back of Card (Shown when NOT flipped) - LOGO/PATTERN */}
        <div
          className="absolute inset-0 w-full h-full bg-linear-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center backface-hidden shadow-inner"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="text-white text-4xl font-bold opacity-30 select-none">
            ?
          </div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
        </div>

        {/* Front of Card (Shown when FLIPPED) - CONTENT */}
        <div
          className="absolute inset-0 w-full h-full bg-white rounded-xl flex items-center justify-center backface-hidden rotate-y-180 border-4 border-blue-400 overflow-hidden"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          {isImage ? (
            <img
              src={card.content}
              alt="Content"
              className="w-full h-full object-contain p-2"
            />
          ) : (
            <div className="text-center p-2 font-bold text-slate-800 text-sm sm:text-base md:text-lg wrap-break-word">
              {card.content}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- START SCREEN ---
const IntroScreen = ({ onStart }: { onStart: () => void }) => {
  return (
    <div className="absolute inset-0 z-50 bg-linear-to-br from-slate-900 to-blue-900 flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-teal-400 mb-6 drop-shadow-2xl animate-bounce-slow">
        Matching Pair
      </h1>
      <p className="text-slate-300 text-lg md:text-xl mb-12 max-w-lg">
        Tekan dua kartu untuk memeriksa apakah mereka pasangan yang sesuai atau
        tidak
      </p>
      <button
        onClick={onStart}
        className="px-10 py-4 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-full text-xl shadow-[0_0_20px_rgba(59,130,246,0.6)] transition-all transform hover:scale-105 active:scale-95"
      >
        START GAME
      </button>
    </div>
  );
};

// --- COMPLETED SCREEN ---
const CompletedScreen = ({
  score,
  onRestart,
  gameId,
}: {
  score: number;
  onRestart: () => void;
  gameId?: string;
}) => {
  return (
    <div className="absolute inset-0 z-50 bg-[#0f172a] flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Confetti placeholder or simple particles could go here */}
        <div className="w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <h2 className="text-6xl font-black text-transparent bg-clip-text bg-linear-to-r from-yellow-400 to-orange-500 mb-8 z-10 animate-bounce">
        COMPLETED!
      </h2>

      <div className="bg-slate-800/50 backdrop-blur-md p-8 rounded-2xl border border-slate-700 text-center mb-10 z-10 shadow-2xl">
        <p className="text-slate-400 text-sm uppercase tracking-widest font-bold mb-2">
          Total Score
        </p>
        <p className="text-6xl font-mono font-bold text-white">{score}</p>
      </div>

      <div className="flex gap-4 z-10">
        <button
          onClick={onRestart}
          className="px-8 py-3 bg-green-500 hover:bg-green-400 text-white font-bold rounded-full text-lg shadow-lg transition-all transform hover:scale-105 active:scale-95"
        >
          PLAY AGAIN
        </button>
        {gameId && (
          <Link
            to={`/pair-or-no-pair/leaderboard/${gameId}`}
            className="px-8 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-full text-lg shadow-lg transition-all transform hover:scale-105 active:scale-95"
          >
            🏆 LEADERBOARD
          </Link>
        )}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const PairOrNoPairGame = () => {
  const { gameId } = useParams<{ gameId: string }>();

  // Game State
  const [items, setItems] = useState<Item[]>([]);
  const [cards, setCards] = useState<GridCardData[]>([]);
  const [gameState, setGameState] = useState<"intro" | "playing" | "finished">(
    "intro",
  );
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(0);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [showComboAnimation, setShowComboAnimation] = useState(false);
  const scoreSaved = useRef(false);

  // Audio Hooks
  const {
    playIntroBGM,
    playGameBGM,
    playWin,
    playFlip,
    playMatch,
    playMismatch,
    unlockAudio,
  } = useSoundEffects(isSoundOn);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playCountUpdated = useRef(false);

  // Fetch Data
  useEffect(() => {
    const defaultItems = [
      { id: "1", left_content: "Cat", right_content: catImage },
      { id: "2", left_content: "Dog", right_content: dogImage },
      { id: "3", left_content: "Apple", right_content: appleImage },
      { id: "4", left_content: "Banana", right_content: bananaImage },
      { id: "5", left_content: "Book", right_content: bookImage },
      { id: "6", left_content: "Camera", right_content: cameraImage },
      { id: "7", left_content: "Bird", right_content: birdImage },
      { id: "8", left_content: "Elephant", right_content: elephantImage },
    ];

    const fetchGameData = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/game/game-type/pair-or-no-pair/${gameId}/play/public`,
        );
        const json = await res.json();
        if (json.data?.items?.length) {
          setItems(json.data.items);
        } else {
          setItems(defaultItems);
        }
      } catch {
        setItems(defaultItems);
      }
    };
    fetchGameData();
  }, [gameId]);

  // Unlock audio on first user interaction (click anywhere on page)
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (isSoundOn) {
        unlockAudio();
      }
      // Remove listeners after first interaction
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("touchstart", handleFirstInteraction);
      document.removeEventListener("keydown", handleFirstInteraction);
    };

    document.addEventListener("click", handleFirstInteraction, { once: true });
    document.addEventListener("touchstart", handleFirstInteraction, { once: true });
    document.addEventListener("keydown", handleFirstInteraction, { once: true });

    return () => {
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("touchstart", handleFirstInteraction);
      document.removeEventListener("keydown", handleFirstInteraction);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Audio Logic
  useEffect(() => {
    if (gameState === "intro") {
      // Small delay to ensure audio is ready
      const timer = setTimeout(() => {
        playIntroBGM();
      }, 500);
      return () => clearTimeout(timer);
    } else if (gameState === "playing") {
      const timer = setTimeout(() => {
        playGameBGM();
      }, 500);
      return () => clearTimeout(timer);
    } else if (gameState === "finished") {
      const timer = setTimeout(() => {
        playWin();
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, isSoundOn]);

  // Timer Logic
  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  // Start Game Logic
  const handleStart = () => {
    // Unlock audio context on user interaction (browser autoplay policy)
    // This ensures audio works when user clicks START button
    if (isSoundOn) {
      unlockAudio();
      // Small delay to ensure audio context is unlocked before playing
      setTimeout(() => {
        // Audio will be played by the useEffect when gameState changes
      }, 100);
    }
    
    // Reset play count flag when starting a new game
    playCountUpdated.current = false;

    // 1. Prepare Cards (Max 16 pairs = 32 cards)
    const gameItems = items.slice(0, 16);
    const generatedCards: GridCardData[] = [];

    gameItems.forEach((item, idx) => {
      // Card A (Left Content)
      generatedCards.push({
        uniqueId: `card-${idx}-a`,
        itemId: item.id,
        content: item.left_content,
        isFlipped: false,
        isMatched: false,
        isShaking: false,
      });
      // Card B (Right Content)
      generatedCards.push({
        uniqueId: `card-${idx}-b`,
        itemId: item.id,
        content: item.right_content,
        isFlipped: false,
        isMatched: false,
        isShaking: false,
      });
    });

    // 2. Shuffle
    for (let i = generatedCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [generatedCards[i], generatedCards[j]] = [
        generatedCards[j],
        generatedCards[i],
      ];
    }

    setCards(generatedCards);
    setScore(0);
    setTimer(0);
    setCombo(0);
    setMaxCombo(0);
    setGameState("playing");
    scoreSaved.current = false;
  };

  // Card Click
  const handleCardClick = (index: number) => {
    if (
      isProcessing ||
      cards[index].isFlipped ||
      cards[index].isMatched ||
      gameState !== "playing"
    )
      return;

    playFlip();

    // Flip logic
    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    // Check Match
    if (newFlipped.length === 2) {
      setIsProcessing(true);
      const idx1 = newFlipped[0];
      const idx2 = newFlipped[1];

      if (newCards[idx1].itemId === newCards[idx2].itemId) {
        // MATCH!
        setTimeout(() => {
          playMatch();
          setCards((prev) => {
            const updated = [...prev];
            updated[idx1].isMatched = true;
            updated[idx2].isMatched = true;
            return updated;
          });
          
          // Combo system: increase combo on match
          setCombo((prevCombo) => {
            const newCombo = prevCombo + 1;
            setMaxCombo((prevMax) => Math.max(prevMax, newCombo));
            
            // Show combo animation if combo >= 2
            if (newCombo >= 2) {
              setShowComboAnimation(true);
              setTimeout(() => setShowComboAnimation(false), 1000);
            }
            
            // Calculate score with combo multiplier
            // Base score: 100, multiplied by combo (min 1x)
            const baseScore = 100;
            const comboMultiplier = Math.max(1, newCombo);
            const pointsEarned = baseScore * comboMultiplier;
            
            setScore((s) => s + pointsEarned);
            return newCombo;
          });
          
          setFlippedIndices([]);
          setIsProcessing(false);
        }, 500);
      } else {
        // NO MATCH
        // 1. Shake & Sound
        setTimeout(() => {
          playMismatch();
          setCards((prev) => {
            const updated = [...prev];
            updated[idx1].isShaking = true;
            updated[idx2].isShaking = true;
            return updated;
          });
        }, 300); // Small delay for flip completion

        // 2. Unflip & Reset
        setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            updated[idx1].isFlipped = false;
            updated[idx2].isFlipped = false;
            updated[idx1].isShaking = false;
            updated[idx2].isShaking = false;
            return updated;
          });
          // Reset combo on mismatch
          setCombo(0);
          setFlippedIndices([]);
          setIsProcessing(false);
        }, 1200);
      }
    }
  };

  // Win Condition Check
  useEffect(() => {
    if (gameState === "playing" && cards.length > 0) {
      const allMatched = cards.every((c) => c.isMatched);
      if (allMatched) {
        setTimeout(() => setGameState("finished"), 500);
      }
    }
  }, [cards, gameState]);

  // Update play count when game is finished
  useEffect(() => {
    if (gameState === "finished" && gameId && !playCountUpdated.current) {
      playCountUpdated.current = true;
      api
        .post("/api/game/play-count", {
          game_id: gameId,
        })
        .catch((err) => {
          console.error("Failed to update play count:", err);
          // Don't show error toast as it's not critical
        });
    }
  }, [gameState, gameId]);

  // Save score when game is finished
  useEffect(() => {
    if (gameState === "finished" && gameId && !scoreSaved.current) {
      scoreSaved.current = true;
      const token = useAuthStore.getState().token;
      
      if (token) {
        // Calculate matched pairs
        const matchedPairs = cards.filter((c) => c.isMatched).length / 2;
        const totalPairs = cards.length / 2;
        
        api
          .post("/api/game/score", {
            game_id: gameId,
            score: score,
            max_combo: maxCombo,
            time_taken: timer,
            matched_pairs: matchedPairs,
            total_pairs: totalPairs,
          })
          .catch((err) => {
            console.error("Failed to save score:", err);
            // Don't show error toast as it's not critical
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, gameId]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  return (
    <div className="relative min-h-screen font-sans overflow-hidden bg-[#E0F7FA]">
      {/* Style for Flip Animation & Font */}
      <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&display=swap');
            
            body { font-family: 'Fredoka', sans-serif; }

            .rotate-y-180 { transform: rotateY(180deg); }
            .perspective-1000 { perspective: 1000px; }
            .backface-hidden { backface-visibility: hidden; }
            
            @keyframes bounce-slow {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
            .animate-bounce-slow { animation: bounce-slow 2s infinite ease-in-out; }

            /* Dealing Animation */
            @keyframes deal-in {
              from {
                opacity: 0;
                transform: translateY(20px) scale(0.9);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
            .animate-deal {
              animation: deal-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
            }

            /* Shake Animation */
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              20% { transform: translateX(-8px) rotate(-5deg); }
              40% { transform: translateX(8px) rotate(5deg); }
              60% { transform: translateX(-4px) rotate(-3deg); }
              80% { transform: translateX(4px) rotate(3deg); }
            }
            .animate-shake {
              animation: shake 0.4s ease-in-out;
            }

            /* Custom Background Pattern */
            .bg-pattern {
               background-color: #8BC6EC;
               background-image: linear-gradient(135deg, #8BC6EC 0%, #9599E2 100%);
            }
        `}</style>

      <div
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#fff 2px, transparent 2px)",
          backgroundSize: "30px 30px",
        }}
      ></div>

      {gameState === "intro" && <IntroScreen onStart={handleStart} />}
      {gameState === "finished" && (
        <CompletedScreen score={score} onRestart={handleStart} gameId={gameId} />
      )}

      {gameState === "playing" && (
        <div className="w-full h-screen flex flex-col z-10 relative bg-pattern">
          {/* Header */}
          <div className="bg-white/90 backdrop-blur-sm p-3 shadow-md border-b-4 border-indigo-200 flex justify-between items-center z-20 px-6 mx-4 mt-4 rounded-2xl">
            <div className="font-bold text-indigo-600 text-2xl tracking-wide drop-shadow-sm">
              Matching Pair
            </div>
            <div className="flex gap-6 text-slate-700 font-bold text-xl">
              <div className="bg-indigo-100 px-4 py-1 rounded-full border border-indigo-200 text-indigo-600">
                Time: {formatTime(timer)}
              </div>
              <div className="bg-orange-100 px-4 py-1 rounded-full border border-orange-200 text-orange-600">
                Score: {score}
              </div>
              {combo >= 2 && (
                <div className="bg-linear-to-r from-yellow-400 to-orange-500 px-4 py-1 rounded-full border-2 border-orange-300 text-white shadow-lg animate-pulse">
                  🔥 {combo}x COMBO!
                </div>
              )}
            </div>
            <div className="flex gap-2 items-center">
              {gameId && (
                <Link
                  to={`/pair-or-no-pair/leaderboard/${gameId}`}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-full text-sm shadow-lg transition-all transform hover:scale-105"
                  title="View Leaderboard"
                >
                  🏆
                </Link>
              )}
              <button
                onClick={() => setIsSoundOn(!isSoundOn)}
                className="p-2 rounded-full hover:bg-slate-100 border-2 border-slate-300 transition-colors"
              >
                <span className="text-xl">{isSoundOn ? "🔊" : "🔇"}</span>
              </button>
            </div>
          </div>

          {/* Combo Animation Overlay */}
          {showComboAnimation && combo >= 2 && (
            <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
              <div className="text-8xl font-black text-transparent bg-clip-text bg-linear-to-r from-yellow-400 via-orange-500 to-red-500 animate-bounce drop-shadow-2xl">
                {combo}x COMBO!
              </div>
            </div>
          )}

          {/* Grid Container */}
          <div className="flex-1 overflow-hidden p-4 flex items-center justify-center">
            <div
              className={`grid gap-3 w-full max-w-7xl mx-auto p-4 items-center justify-center content-center h-full ${
                cards.length <= 16
                  ? "grid-cols-4"
                  : cards.length <= 20
                    ? "grid-cols-5"
                    : "grid-cols-8"
              }`}
            >
              {cards.map((card, idx) => (
                <div
                  key={card.uniqueId}
                  className="w-full h-full flex items-center justify-center animate-deal"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <GridCard card={card} onClick={() => handleCardClick(idx)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PairOrNoPairGame;
