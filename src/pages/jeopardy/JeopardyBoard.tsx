import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { jeopardyApi } from "@/api/jeopardy";
import {
  type JeopardyGameData,
  type JeopardyClue,
  type Team,
} from "./types/jeopardy-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Helper to get image URL
const getImageUrl = (path: string | null | undefined) => {
  if (!path) return null;
  return `${import.meta.env.VITE_API_URL}/${path}`;
};

export default function JeopardyBoard() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // --- State ---
  const [gameData, setGameData] = useState<JeopardyGameData | null>(null);
  const [teams, setTeams] = useState<Team[]>(location.state?.teams || []);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);

  // Gameplay State
  const [playedClues, setPlayedClues] = useState<Set<string>>(new Set());
  const [activeClue, setActiveClue] = useState<JeopardyClue | null>(null);

  // Modal States
  const [modalPhase, setModalPhase] = useState<"WAGER" | "QUESTION" | "ANSWER">(
    "QUESTION",
  );
  const [wagerAmount, setWagerAmount] = useState<number>(0);
  const [tempWager, setTempWager] = useState<string>("");

  // 1. Initialize & Validation
  useEffect(() => {
    if (!id) return;
    // Redirect if no teams set up (Middleware-ish)
    if (!location.state?.teams || location.state.teams.length === 0) {
      navigate(`/jeopardy/play/${id}/setup`, { replace: true });
      return;
    }

    const fetchGame = async () => {
      try {
        const res = await jeopardyApi.play(id);
        // Ensure we handle both structure possibilities (some APIs wrap in data.data)
        const rawData = res.data.data || res.data;

        // Backend returns snake_case, ensure our Types match or we map here.
        // Since we updated Types to snake_case, we can use directly.
        setGameData(rawData);

        // Set initial teams score if defined in settings
        if (rawData.settings.starting_score > 0) {
          setTeams((prev) =>
            prev.map((t) => ({ ...t, score: rawData.settings.starting_score })),
          );
        }
      } catch (error) {
        console.error("Failed to load game", error);
      }
    };
    fetchGame();
  }, [id, navigate, location.state]);

  // --- Logic Helpers ---

  const currentRound = gameData?.rounds[currentRoundIndex];

  // Calculate value based on Round Type (Double Jeopardy)
  const getClueValue = (clueValue: number) => {
    if (!gameData || !currentRound) return clueValue;

    // Check if this round is a "Double" round
    if (currentRound.type === "double") {
      return clueValue * gameData.settings.double_jeopardy_multiplier;
    }
    return clueValue;
  };

  const handleClueClick = (clue: JeopardyClue) => {
    if (playedClues.has(clue.id)) return;

    setActiveClue(clue);
    setPlayedClues((prev) => new Set(prev).add(clue.id));

    // Daily Double Logic
    if (clue.is_daily_double && gameData?.settings.allow_daily_double) {
      setModalPhase("WAGER");
      setTempWager("0");
    } else {
      setModalPhase("QUESTION");
    }
  };

  const submitWager = () => {
    const val = parseInt(tempWager);
    // Find highest score to set max wager limit (Standard Rules: Max(Highest Score, 1000))

    if (isNaN(val) || val < 5) {
      alert("Minimum wager is $5");
      return;
    }
    // Optional: Enforce max wager
    // if (val > maxWager) { alert(`Max wager is $${maxWager}`); return; }

    setWagerAmount(val);
    setModalPhase("QUESTION");
  };

  const handleScoreUpdate = (teamId: number, action: "add" | "subtract") => {
    if (!activeClue) return;

    // Value depends on if it was a Wager or Standard Clue
    let points = 0;
    if (activeClue.is_daily_double) {
      points = wagerAmount;
    } else {
      points = getClueValue(activeClue.value);
    }

    setTeams((prev) =>
      prev.map((team) => {
        if (team.id !== teamId) return team;
        return {
          ...team,
          score: action === "add" ? team.score + points : team.score - points,
        };
      }),
    );
  };

  const closeActiveClue = () => {
    setActiveClue(null);
    setModalPhase("QUESTION");
    setWagerAmount(0);
  };

  // --- Render ---

  if (!gameData || !currentRound)
    return (
      <div className="h-screen bg-blue-950 flex items-center justify-center text-white text-2xl">
        Loading Board...
      </div>
    );

  return (
    <div className="h-screen bg-blue-950 flex flex-col overflow-hidden font-sans">
      {/* HEADER */}
      <div className="bg-blue-900 border-b-4 border-black p-3 flex justify-between items-center shadow-lg z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black text-yellow-400 uppercase tracking-widest drop-shadow-md">
            {currentRound.name}
          </h1>
          {currentRound.type === "double" && (
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">
              DOUBLE JEOPARDY ({gameData.settings.double_jeopardy_multiplier}x)
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {/* Round Navigation */}
          <div className="flex gap-1 mr-4">
            {gameData.rounds.map((_, idx) => (
              <div
                key={idx}
                className={`w-3 h-3 rounded-full ${idx === currentRoundIndex ? "bg-yellow-400" : "bg-blue-700"}`}
              />
            ))}
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={async () => {
              if (currentRoundIndex < gameData.rounds.length - 1) {
                setCurrentRoundIndex((prev) => prev + 1);
              } else {
                if (confirm("End game and see results?")) {
                  try {
                    // 1. Tell Backend to increment play count
                    await jeopardyApi.endGame(id!);
                  } catch (err) {
                    console.error("Failed to record game end", err);
                  }

                  // 2. Navigate to Results
                  navigate(`/jeopardy/play/${id}/end`, {
                    state: { teams },
                  });
                }
              }
            }}
          >
            {currentRoundIndex < gameData.rounds.length - 1
              ? "Next Round"
              : "Finish Game"}
          </Button>
        </div>
      </div>

      {/* GAME BOARD GRID */}
      <div className="flex-1 p-2 md:p-6 flex items-center justify-center overflow-auto">
        <div
          className="grid gap-2 w-full max-w-7xl h-full max-h-full"
          style={{
            gridTemplateColumns: `repeat(${currentRound.categories.length}, 1fr)`,
          }}
        >
          {currentRound.categories.map((cat) => (
            <div key={cat.id} className="flex flex-col gap-2 h-full">
              {/* Category Header */}
              <div className="bg-blue-800 text-white p-2 flex items-center justify-center text-center font-bold text-sm md:text-xl border-2 border-black shadow-[inset_0_0_15px_rgba(0,0,0,0.6)] h-24 uppercase wrap-break-word">
                {cat.title}
              </div>

              {/* Clues */}
              <div className="flex-1 flex flex-col gap-2">
                {cat.clues.map((clue) => {
                  const isPlayed = playedClues.has(clue.id);
                  const displayValue = getClueValue(clue.value);

                  return (
                    <button
                      key={clue.id}
                      disabled={isPlayed}
                      onClick={() => handleClueClick(clue)}
                      className={`
                                        flex-1 w-full flex items-center justify-center text-2xl md:text-4xl font-black border-2 border-black transition-all duration-300
                                        ${
                                          isPlayed
                                            ? "bg-blue-900/50 text-blue-900/0 cursor-default"
                                            : "bg-blue-700 text-yellow-400 hover:bg-yellow-400 hover:text-blue-900 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] hover:scale-[1.02]"
                                        }
                                    `}
                    >
                      ${displayValue}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER: SCOREBOARD */}
      <div className="bg-black p-4 border-t-4 border-white flex gap-4 overflow-x-auto justify-center">
        {teams.map((team) => (
          <div
            key={team.id}
            className="bg-blue-800 border-2 border-yellow-400 min-w-40 p-2 relative group"
          >
            <div className="text-white text-center font-bold truncate px-2">
              {team.name}
            </div>
            <div
              className={`text-center text-3xl font-mono font-bold ${team.score < 0 ? "text-red-400" : "text-yellow-400"}`}
            >
              ${team.score}
            </div>
          </div>
        ))}
      </div>

      {/* --- ACTIVE CLUE MODAL --- */}
      <Dialog open={!!activeClue} onOpenChange={() => {}}>
        <DialogContent className="max-w-[90vw] h-[85vh] bg-blue-900 border-4 border-black p-0 flex flex-col text-white [&>button]:hidden">
          {/* PHASE 1: DAILY DOUBLE WAGER */}
          {modalPhase === "WAGER" && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in zoom-in duration-300">
              <h2 className="text-6xl font-black text-yellow-400 uppercase drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] animate-bounce">
                Daily Double!
              </h2>
              <div className="space-y-4 w-full max-w-md text-center">
                <label className="text-2xl font-bold">Enter Wager:</label>
                <Input
                  type="number"
                  className="text-black text-4xl font-bold text-center h-20"
                  autoFocus
                  value={tempWager}
                  onChange={(e) => setTempWager(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitWager()}
                />
                <Button
                  size="lg"
                  className="w-full text-xl py-8 bg-yellow-400 text-blue-900 hover:bg-yellow-300 font-bold"
                  onClick={submitWager}
                >
                  Place Bet
                </Button>
              </div>
            </div>
          )}

          {/* PHASE 2: QUESTION */}
          {modalPhase === "QUESTION" && activeClue && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8 animate-in fade-in slide-in-from-bottom-10">
              {/* Media Display */}
              {activeClue.media_url && (
                <div className="h-1/3 w-full flex items-center justify-center mb-4">
                  <img
                    src={getImageUrl(activeClue.media_url) || ""}
                    alt="Clue Media"
                    className="max-h-full max-w-full rounded-lg border-4 border-black shadow-2xl object-contain bg-black"
                  />
                </div>
              )}

              <div className="flex-1 flex items-center justify-center">
                <h2 className="text-3xl md:text-5xl font-bold uppercase leading-relaxed max-w-5xl shadow-black drop-shadow-md">
                  {activeClue.question}
                </h2>
              </div>

              <Button
                className="bg-yellow-400 text-blue-900 hover:bg-yellow-300 text-xl font-bold px-10 py-6 rounded-full shadow-lg hover:scale-105 transition-transform"
                onClick={() => setModalPhase("ANSWER")}
              >
                Show Answer
              </Button>
            </div>
          )}

          {/* PHASE 3: ANSWER & SCORING */}
          {modalPhase === "ANSWER" && activeClue && (
            <div className="flex-1 flex flex-col p-6 animate-in fade-in">
              {/* Top: The Correct Answer */}
              <div className="flex-2 flex flex-col items-center justify-center text-center border-b-2 border-blue-700 mb-4">
                <h3 className="text-slate-400 text-xl uppercase mb-2">
                  Correct Response
                </h3>
                <h2 className="text-4xl md:text-5xl font-black text-green-400 uppercase leading-relaxed">
                  {activeClue.answer}
                </h2>
              </div>

              {/* Middle: Score Controls */}
              <div className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto">
                <h3 className="text-center text-white/50 text-sm uppercase mb-4">
                  Award Points
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {teams.map((team) => (
                    <Card
                      key={team.id}
                      className="bg-blue-800 border-none text-white"
                    >
                      <CardContent className="p-3 flex flex-col items-center gap-2">
                        <span className="font-bold truncate w-full text-center">
                          {team.name}
                        </span>
                        <div className="flex gap-2 w-full">
                          <Button
                            variant="default"
                            className="flex-1 bg-green-600 hover:bg-green-500"
                            onClick={() => handleScoreUpdate(team.id, "add")}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            className="flex-1 bg-red-600 hover:bg-red-500"
                            onClick={() =>
                              handleScoreUpdate(team.id, "subtract")
                            }
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <span className="text-sm font-mono">${team.score}</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Bottom: Continue */}
              <div className="pt-4 flex justify-center">
                <Button
                  variant="secondary"
                  size="lg"
                  className="text-xl px-12 font-bold"
                  onClick={closeActiveClue}
                >
                  Continue Game
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
