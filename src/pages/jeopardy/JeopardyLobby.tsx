import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { jeopardyApi } from "@/api/jeopardy";
import { Users, Play, ArrowLeft } from "lucide-react";
import { type Team } from "./types/jeopardy-types";

export default function JeopardyLobby() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [gameTitle, setGameTitle] = useState("Loading Game...");
  const [isLoading, setIsLoading] = useState(true);
  const [teamCount, setTeamCount] = useState(2);

  // Default State: 2 Teams
  const [teams, setTeams] = useState<Team[]>([
    { id: 1, name: "Team 1", score: 0 },
    { id: 2, name: "Team 2", score: 0 },
  ]);

  // 1. Fetch Game Details (to show title and verify ID)
  useEffect(() => {
    if (!id) return;
    jeopardyApi
      .getDetail(id)
      .then((res) => {
        // Backend usually wraps response in { data: { ... } }
        const data = res.data.data || res.data;
        setGameTitle(data.name);

        // Optional: If backend has a default max_teams setting, we could use it here
        // const maxTeams = data.settings.max_teams;
      })
      .catch((err) => {
        console.error("Failed to load game", err);
        setGameTitle("Game Not Found");
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  // 2. Handle Team Count Change
  const handleTeamCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let count = parseInt(e.target.value);
    if (isNaN(count)) count = 2;

    // Hard limits: Min 1, Max 6 (or whatever fits your UI)
    if (count < 1) count = 1;
    if (count > 6) count = 6;

    setTeamCount(count);

    // Rebuild teams array, preserving existing names where possible
    const newTeams = Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: teams[i]?.name || `Team ${i + 1}`,
      score: 0,
    }));
    setTeams(newTeams);
  };

  // 3. Handle Name Edit
  const handleTeamNameChange = (index: number, newName: string) => {
    const newTeams = [...teams];
    newTeams[index].name = newName;
    setTeams(newTeams);
  };

  // 4. Start Game -> Navigate to Board with State
  const handleStartGame = () => {
    if (!id) return;
    navigate(`/jeopardy/play/${id}`, {
      state: { teams }, // <--- Passing data to the Board
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        Loading Lobby...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
      <Card className="w-full max-w-lg bg-slate-900 border-slate-800 text-white shadow-2xl">
        <CardHeader className="text-center border-b border-slate-800 pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.5)]">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-blue-400">
            {gameTitle}
          </CardTitle>
          <p className="text-slate-400 mt-2">Game Setup & Lobby</p>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Team Count Input */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300 uppercase tracking-wider">
              Number of Teams
            </label>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                min={1}
                max={6}
                value={teamCount}
                onChange={handleTeamCountChange}
                className="bg-slate-800 border-slate-700 text-white text-lg h-12"
              />
              <span className="text-sm text-slate-500 italic">
                (Max 6 recommended)
              </span>
            </div>
          </div>

          {/* Team Names List */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300 uppercase tracking-wider">
              Team Names
            </label>
            <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2">
              {teams.map((team, index) => (
                <div
                  key={team.id}
                  className="flex items-center gap-3 animate-in slide-in-from-left-2 duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 font-bold text-sm border border-blue-800">
                    {index + 1}
                  </div>
                  <Input
                    value={team.name}
                    onChange={(e) =>
                      handleTeamNameChange(index, e.target.value)
                    }
                    placeholder={`Team ${index + 1}`}
                    className="bg-slate-800 border-slate-700 text-white focus:border-blue-500 transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-6 border-t border-slate-800">
          <Button
            className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20"
            onClick={handleStartGame}
          >
            <Play className="w-5 h-5 mr-2 fill-current" />
            Start Game
          </Button>
          <Button
            variant="ghost"
            className="w-full text-slate-400 hover:text-white"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel & Return Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
