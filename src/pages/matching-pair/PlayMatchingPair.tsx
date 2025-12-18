import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/api/axios";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Typography } from "@/components/ui/typography";
import { ArrowLeft, Trophy, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";

interface MatchingPair {
  first: string;
  second: string;
  first_image?: string | null;
  second_image?: string | null;
}

interface GameData {
  id: string;
  name: string;
  description: string;
  thumbnail_image: string | null;
  is_published: boolean;
  game_json: {
    pairs: MatchingPair[];
  };
}

interface GameSession {
  gameId: string;
  board: number[];
  startTime: number;
}

interface MatchCheckResponse {
  isMatch: boolean;
  value?: number;
  moves: number;
  matchedCount: number;
  status: "ONGOING" | "FINISHED";
}

interface FinishGameResponse {
  gameId: string;
  duration: number;
  score: number;
  moves: number;
}

export default function PlayMatchingPair() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [game, setGame] = useState<GameData | null>(null);
  const [session, setSession] = useState<GameSession | null>(null);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [matchedCards, setMatchedCards] = useState<Set<number>>(new Set());
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [, setGameStatus] = useState<"ONGOING" | "FINISHED">("ONGOING");
  const [moves, setMoves] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [result, setResult] = useState<FinishGameResponse | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        setLoading(true);
        const response = await api.get(
          `/api/game/game-type/matching-pair/${id}/play/public`,
        );
        setGame(response.data.data);
      } catch (err) {
        setError("Failed to load game.");
        console.error(err);
        toast.error("Failed to load game.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchGame();
  }, [id]);

  useEffect(() => {
    if (game && !session) {
      generateSession();
    }
  }, [game]);

  const generateSession = async () => {
    if (!id) return;
    try {
      const response = await api.post(
        `/api/game/game-type/matching-pair/${id}/play/generate`,
      );
      setSession(response.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate game session.");
    }
  };

  const handleCardClick = async (index: number) => {
    if (
      !session ||
      isChecking ||
      matchedCards.has(index) ||
      flippedCards.has(index) ||
      selectedCards.includes(index) ||
      selectedCards.length >= 2
    ) {
      return;
    }

    const newSelected = [...selectedCards, index];
    setSelectedCards(newSelected);
    setFlippedCards((prev) => new Set([...prev, index]));

    if (newSelected.length === 2) {
      await checkMatch(newSelected[0], newSelected[1]);
    }
  };

  const checkMatch = async (firstIndex: number, secondIndex: number) => {
    if (!session || !id) return;

    setIsChecking(true);
    try {
      const response = await api.post(
        `/api/game/game-type/matching-pair/${id}/play/check`,
        {
          gameId: session.gameId,
          firstIndex,
          secondIndex,
        },
      );

      const data: MatchCheckResponse = response.data.data;
      setMoves(data.moves);
      setMatchedCount(data.matchedCount);
      setGameStatus(data.status);

      if (data.isMatch) {
        // Match found
        setMatchedCards((prev) => new Set([...prev, firstIndex, secondIndex]));
        setSelectedCards([]);

        if (data.status === "FINISHED") {
          await finishGame();
        }
      } else {
        // No match - flip back after delay
        setTimeout(() => {
          setFlippedCards((prev) => {
            const newSet = new Set(prev);
            newSet.delete(firstIndex);
            newSet.delete(secondIndex);
            return newSet;
          });
          setSelectedCards([]);
        }, 1000);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to check match.");
      setSelectedCards([]);
      setFlippedCards((prev) => {
        const newSet = new Set(prev);
        newSet.delete(firstIndex);
        newSet.delete(secondIndex);
        return newSet;
      });
    } finally {
      setIsChecking(false);
    }
  };

  const finishGame = async () => {
    if (!session || !id) return;

    try {
      const response = await api.post(
        `/api/game/game-type/matching-pair/${id}/play/finish`,
        {
          gameId: session.gameId,
        },
      );

      setResult(response.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to finish game.");
    }
  };

  const addPlayCount = async (gameId: string) => {
    try {
      await api.post("/api/game/play-count", {
        game_id: gameId,
      });
    } catch (err) {
      console.error("Failed to update play count:", err);
      // Don't show error toast on exit to avoid blocking navigation
    }
  };

  const handleExit = async () => {
    if (id) {
      await addPlayCount(id);
    }
    navigate("/");
  };

  const handleReshuffle = async () => {
    if (!session || !id) return;

    try {
      const response = await api.post(
        `/api/game/game-type/matching-pair/play/session/${session.gameId}/reshuffle`,
      );
      setSession(response.data.data);
      setSelectedCards([]);
      setMatchedCards(new Set());
      setFlippedCards(new Set());
      setMoves(0);
      setMatchedCount(0);
      setGameStatus("ONGOING");
      setResult(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to reshuffle board.");
    }
  };

  const resetGame = () => {
    setSelectedCards([]);
    setMatchedCards(new Set());
    setFlippedCards(new Set());
    setMoves(0);
    setMatchedCount(0);
    setGameStatus("ONGOING");
    setResult(null);
    generateSession();
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-black"></div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="w-full h-screen flex flex-col justify-center items-center gap-4">
        <Typography variant="p">{error ?? "Game not found"}</Typography>
        <Button onClick={() => navigate("/")}>Go Back</Button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-black"></div>
      </div>
    );
  }

  if (result) {
    const { duration, score, moves: finalMoves } = result;
    const durationSeconds = Math.floor(duration / 1000);
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;

    return (
      <div className="w-full h-screen flex justify-center items-center bg-slate-50">
        <div className="bg-white rounded-xl p-10 mx-10 text-center max-w-sm w-full space-y-4 shadow-lg">
          <Trophy className="mx-auto text-yellow-400" size={72} />
          <Typography variant="h4">Congratulations!</Typography>
          <Typography variant="h2">{score.toLocaleString()}</Typography>
          <Typography variant="p">Final Score</Typography>
          <div className="space-y-2 pt-4 border-t">
            <Typography variant="p">
              Time: {minutes}m {seconds}s
            </Typography>
            <Typography variant="p">Moves: {finalMoves}</Typography>
            <Typography variant="p">
              Matched: {matchedCount} / {game.game_json.pairs.length}
            </Typography>
          </div>
          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={resetGame}>
              <RotateCcw className="mr-2" size={16} />
              Play Again
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleExit}>
              Exit
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const pairs = game.game_json.pairs;
  const totalPairs = pairs.length;
  const board = session.board;

  return (
    <div className="w-full bg-slate-50 min-h-screen flex flex-col">
      <div className="bg-white h-fit w-full flex justify-between items-center px-8 py-4 shadow-sm">
        <div>
          <Button
            size="sm"
            variant="ghost"
            className="hidden md:flex"
            onClick={handleExit}
          >
            <ArrowLeft /> Exit Game
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="block md:hidden"
            onClick={handleExit}
          >
            <ArrowLeft />
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <Typography variant="p" className="text-sm">
            Moves: {moves} | Matched: {matchedCount}/{totalPairs}
          </Typography>
          <Button
            size="sm"
            variant="outline"
            onClick={handleReshuffle}
            disabled={isChecking}
          >
            <RotateCcw size={16} className="mr-2" />
            Reshuffle
          </Button>
        </div>
      </div>

      <div className="w-full h-full p-8 flex justify-center items-center">
        <div className="max-w-5xl w-full space-y-6">
          <div className="text-center">
            <Typography variant="h3">{game.name}</Typography>
            {game.description && (
              <Typography variant="p" className="text-slate-600 mt-2">
                {game.description}
              </Typography>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {board.map((pairIndex, cardIndex) => {
              const pair = pairs[pairIndex];
              const isFlipped = flippedCards.has(cardIndex);
              const isMatched = matchedCards.has(cardIndex);
              const isSelected = selectedCards.includes(cardIndex);
              const isEven = cardIndex % 2 === 0;
              const displayText = isEven ? pair.first : pair.second;
              const displayImage = isEven
                ? pair.first_image
                : pair.second_image;

              return (
                <Card
                  key={cardIndex}
                  className={`aspect-square cursor-pointer transition-all duration-300 ${
                    isMatched
                      ? "opacity-50 cursor-not-allowed"
                      : isSelected
                        ? "ring-4 ring-blue-500 scale-105"
                        : "hover:scale-105 hover:shadow-lg"
                  } ${
                    isFlipped || isMatched
                      ? "bg-white"
                      : "bg-gradient-to-br from-blue-500 to-blue-600"
                  }`}
                  onClick={() => handleCardClick(cardIndex)}
                >
                  <div className="w-full h-full flex items-center justify-center p-4">
                    {isFlipped || isMatched ? (
                      <div className="text-center space-y-2">
                        {displayImage ? (
                          <img
                            src={`${import.meta.env.VITE_API_URL}/${displayImage}`}
                            alt={displayText}
                            className="mx-auto max-h-24 max-w-full object-contain"
                          />
                        ) : (
                          <Typography
                            variant="p"
                            className="text-lg font-semibold break-words"
                          >
                            {displayText}
                          </Typography>
                        )}
                      </div>
                    ) : (
                      <Typography variant="h4" className="text-white font-bold">
                        ?
                      </Typography>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
