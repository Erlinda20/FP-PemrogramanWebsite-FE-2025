import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Home, Medal } from "lucide-react";
import { type Team } from "./types/jeopardy-types";

export default function JeopardyGameEnd() {
  const location = useLocation();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    // 1. Get teams from navigation state
    if (location.state?.teams) {
      // 2. Sort teams by score (Highest to Lowest)
      const sortedTeams = [...location.state.teams].sort(
        (a, b) => b.score - a.score,
      );
      setTeams(sortedTeams);
    } else {
      // Fallback if accessed directly without playing
      navigate("/");
    }
  }, [location, navigate]);

  const winner = teams[0];

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-blue-900/40 via-slate-950 to-slate-950 pointer-events-none" />

      <Card className="w-full max-w-2xl bg-slate-900/90 border-slate-800 text-white shadow-2xl backdrop-blur-md z-10 animate-in zoom-in duration-500">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-4xl font-black text-yellow-400 uppercase tracking-widest drop-shadow-lg">
            Game Over
          </CardTitle>
          <p className="text-slate-400 mt-2">Final Results</p>
        </CardHeader>

        <CardContent className="space-y-8 pt-6">
          {/* 1. THE WINNER PODIUM */}
          {winner && (
            <div className="flex flex-col items-center justify-center animate-bounce duration-2000ms">
              <div className="relative">
                <Trophy className="w-32 h-32 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                <div className="absolute -top-4 -right-4 bg-yellow-500 text-black font-bold px-3 py-1 rounded-full animate-pulse">
                  WINNER
                </div>
              </div>
              <h2 className="text-3xl font-bold mt-4">{winner.name}</h2>
              <p className="text-5xl font-mono text-yellow-400 font-black mt-2">
                ${winner.score}
              </p>
            </div>
          )}

          {/* 2. LEADERBOARD LIST */}
          <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-4 max-h-[300px] overflow-y-auto">
            {teams.map((team, index) => (
              <div
                key={team.id}
                className={`flex items-center justify-between p-4 rounded-lg mb-2 transition-all ${index === 0 ? "bg-yellow-900/20 border border-yellow-700/50" : "bg-slate-900 border border-slate-800"}`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${
                      index === 0
                        ? "bg-yellow-500 text-black"
                        : index === 1
                          ? "bg-slate-400 text-black"
                          : index === 2
                            ? "bg-orange-700 text-white"
                            : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {index <= 2 ? <Medal className="w-4 h-4" /> : index + 1}
                  </div>
                  <span
                    className={`text-lg ${index === 0 ? "font-bold text-yellow-400" : "text-white"}`}
                  >
                    {team.name}
                  </span>
                </div>
                <span className="font-mono text-xl font-bold">
                  ${team.score}
                </span>
              </div>
            ))}
          </div>
        </CardContent>

        <CardFooter className="flex gap-4 justify-center pt-6 border-t border-slate-800">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate("/")}
          >
            <Home className="w-4 h-4" /> Return Home
          </Button>
          {/* Optional: Play Again logic would require resetting state */}
        </CardFooter>
      </Card>
    </div>
  );
}
