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
import { Users, Play, ArrowLeft, Minus, Plus } from "lucide-react";
import { type Team } from "./types/jeopardy-types";

// Helper to construct image URL
const getImageUrl = (path: string | null | undefined) => {
  if (!path) return null;
  return `${import.meta.env.VITE_API_URL}/${path}`;
};

export default function JeopardyLobby() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [gameTitle, setGameTitle] = useState("Loading...");
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Settings limits
  const [maxTeamsAllowed, setMaxTeamsAllowed] = useState(6); // Default fallback

  const [teamCount, setTeamCount] = useState(2);
  const [teams, setTeams] = useState<Team[]>([
    { id: 1, name: "Team 1", score: 0 },
    { id: 2, name: "Team 2", score: 0 },
  ]);

  // 1. Fetch Game Data using the PLAY endpoint (Public access)
  useEffect(() => {
    if (!id) return;

    // We use .play() because .getDetail() might be restricted to creators or missing
    jeopardyApi
      .play(id)
      .then((res) => {
        const data = res.data.data || res.data;

        // 1. Set Title & Image
        setGameTitle(data.name || "Untitled Game");
        setThumbnail(data.thumbnail_image);

        // 2. Apply Backend Settings
        if (data.settings) {
          if (data.settings.max_teams)
            setMaxTeamsAllowed(data.settings.max_teams);

          // Optional: Initialize teams based on starting score?
          // if (data.settings.starting_score) ...
        }
      })
      .catch((err) => {
        console.error("Failed to load lobby", err);
        setError("Game Not Found");
        setGameTitle("Error");
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  // 2. Handle Team Count
  const updateTeamCount = (increment: number) => {
    const newCount = teamCount + increment;
    if (newCount < 1 || newCount > maxTeamsAllowed) return;

    setTeamCount(newCount);

    // Resize teams array while preserving existing names/scores
    if (increment > 0) {
      // Add Team
      setTeams([
        ...teams,
        { id: newCount, name: `Team ${newCount}`, score: 0 },
      ]);
    } else {
      // Remove Last Team
      setTeams(teams.slice(0, newCount));
    }
  };

  const handleTeamNameChange = (index: number, newName: string) => {
    const newTeams = [...teams];
    newTeams[index].name = newName;
    setTeams(newTeams);
  };

  const handleStartGame = () => {
    if (!id) return;
    navigate(`/jeopardy/play/${id}`, {
      state: { teams },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-slate-800 rounded-full mb-4"></div>
          <div className="text-lg">Loading Lobby...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white p-4">
        <Card className="w-full max-w-md bg-slate-900 border-red-900">
          <CardHeader>
            <CardTitle className="text-red-500 text-center">
              Unable to Load Game
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center text-slate-400">
            <p>We couldn't find the game you're looking for.</p>
            <p className="text-xs mt-2 opacity-50">ID: {id}</p>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/")}
            >
              Back to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 pointer-events-none" />

      <Card className="w-full max-w-lg bg-slate-900/90 border-slate-800 text-white shadow-2xl backdrop-blur-sm z-10">
        {/* HEADER: Thumbnail & Title */}
        <CardHeader className="text-center border-b border-slate-800 pb-6 relative">
          <div className="absolute top-4 left-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-slate-700 shadow-lg bg-slate-800 flex items-center justify-center">
              {thumbnail ? (
                <img
                  src={getImageUrl(thumbnail) || ""}
                  alt="Game Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Users className="w-10 h-10 text-slate-500" />
              )}
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-blue-400 leading-tight">
                {gameTitle}
              </CardTitle>
              <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-semibold">
                Lobby Configuration
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 pt-6">
          {/* Team Counter */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <label className="text-sm font-medium text-slate-300 uppercase tracking-wider">
                Number of Teams
              </label>
              <span className="text-xs text-slate-500">
                Max: {maxTeamsAllowed}
              </span>
            </div>

            <div className="flex items-center gap-4 bg-slate-950/50 p-2 rounded-lg border border-slate-800">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => updateTeamCount(-1)}
                disabled={teamCount <= 1}
                className="text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <Minus className="w-5 h-5" />
              </Button>

              <div className="flex-1 text-center">
                <span className="text-2xl font-bold font-mono text-white">
                  {teamCount}
                </span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => updateTeamCount(1)}
                disabled={teamCount >= maxTeamsAllowed}
                className="text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Team Names List */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300 uppercase tracking-wider">
              Team Names
            </label>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {teams.map((team, index) => (
                <div
                  key={team.id}
                  className="flex items-center gap-3 animate-in slide-in-from-left-2 duration-300 fill-mode-backwards"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="w-8 h-8 shrink-0 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-900/20">
                    {index + 1}
                  </div>
                  <Input
                    value={team.name}
                    onChange={(e) =>
                      handleTeamNameChange(index, e.target.value)
                    }
                    placeholder={`Team ${index + 1}`}
                    className="bg-slate-800 border-slate-700 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all h-10"
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-6 border-t border-slate-800">
          <Button
            className="w-full h-14 text-lg font-bold bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-900/30 transition-all hover:scale-[1.02]"
            onClick={handleStartGame}
          >
            <Play className="w-5 h-5 mr-2 fill-current" />
            Start Game
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
