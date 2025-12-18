import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, Upload, Image as ImageIcon, Plus, X } from "lucide-react";
import { jeopardyApi } from "@/api/jeopardy";
import {
  type JeopardyGameData,
  type JeopardyClue,
  type JeopardyCategory,
  type JeopardyRound,
} from "./types/jeopardy-types";

// Helper: Create a single empty clue
const createEmptyClue = (rIndex: number, cIndex: number): JeopardyClue => ({
  id: `clue-${Date.now()}-${cIndex}-${rIndex}`,
  value: (rIndex + 1) * 200,
  question: "",
  answer: "",
  is_daily_double: false,
  media_file: null,
  media_preview: "",
});

// Helper: Create a new category with 'rowCount' clues
const createNewCategory = (
  index: number,
  rowCount: number,
): JeopardyCategory => ({
  id: `cat-${Date.now()}-${index}`,
  title: `Category ${index + 1}`,
  clues: Array.from({ length: rowCount }, (_, rIndex) =>
    createEmptyClue(rIndex, index),
  ),
});

// Helper: Create a new round
const createNewRound = (index: number): JeopardyRound => ({
  id: `round-${Date.now()}`,
  name: `Round ${index + 1}`,
  type: "jeopardy",
  categories: Array.from({ length: 5 }, (_, cIndex) =>
    createNewCategory(cIndex, 5),
  ),
});

const createInitialState = (): JeopardyGameData => ({
  settings: {
    max_teams: 4,
    time_limit_per_clue: 30,
    allow_daily_double: true,
    double_jeopardy_multiplier: 2,
    starting_score: 0,
  },
  rounds: [createNewRound(0)],
});

export default function CreateJeopardy() {
  const navigate = useNavigate();

  // Metadata & State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [gameData, setGameData] =
    useState<JeopardyGameData>(createInitialState());
  const [activeRoundIndex, setActiveRoundIndex] = useState(0);

  // Editor Modal State
  const [editingClue, setEditingClue] = useState<{
    catIndex: number;
    clueIndex: number;
  } | null>(null);
  const [tempClueData, setTempClueData] = useState<JeopardyClue | null>(null);

  // --- DYNAMIC GRID HANDLERS ---

  const addRound = () => {
    const newRound = createNewRound(gameData.rounds.length);
    setGameData((prev) => ({ ...prev, rounds: [...prev.rounds, newRound] }));
    setActiveRoundIndex(gameData.rounds.length); // Switch to new round
  };

  const removeRound = (index: number) => {
    if (gameData.rounds.length <= 1)
      return alert("You must have at least one round.");
    const newRounds = gameData.rounds.filter((_, i) => i !== index);
    setGameData((prev) => ({ ...prev, rounds: newRounds }));
    setActiveRoundIndex(0);
  };

  const addCategory = () => {
    const currentRound = gameData.rounds[activeRoundIndex];
    if (currentRound.categories.length >= 6)
      return alert("Maximum 6 categories allowed."); // Backend Limit

    // How many rows (clues) does this round currently have?
    const rowCount = currentRound.categories[0]?.clues.length || 5;
    const newCategory = createNewCategory(
      currentRound.categories.length,
      rowCount,
    );

    const newRounds = [...gameData.rounds];
    newRounds[activeRoundIndex].categories.push(newCategory);
    setGameData({ ...gameData, rounds: newRounds });
  };

  const removeCategory = (catIndex: number) => {
    const currentRound = gameData.rounds[activeRoundIndex];
    if (currentRound.categories.length <= 1)
      return alert("You must have at least one category.");

    const newRounds = [...gameData.rounds];
    newRounds[activeRoundIndex].categories = currentRound.categories.filter(
      (_, i) => i !== catIndex,
    );
    setGameData({ ...gameData, rounds: newRounds });
  };

  const addRow = () => {
    const currentRound = gameData.rounds[activeRoundIndex];
    const currentRows = currentRound.categories[0]?.clues.length || 0;
    if (currentRows >= 10)
      return alert("Maximum 10 clues per category allowed."); // Backend Limit

    const newRounds = [...gameData.rounds];
    // Add one clue to EVERY category to keep the grid aligned
    newRounds[activeRoundIndex].categories.forEach((cat, cIndex) => {
      cat.clues.push(createEmptyClue(currentRows, cIndex));
    });
    setGameData({ ...gameData, rounds: newRounds });
  };

  const removeRow = () => {
    const currentRound = gameData.rounds[activeRoundIndex];
    const currentRows = currentRound.categories[0]?.clues.length || 0;
    if (currentRows <= 1) return alert("You must have at least one clue row.");

    const newRounds = [...gameData.rounds];
    // Remove the last clue from EVERY category
    newRounds[activeRoundIndex].categories.forEach((cat) => {
      cat.clues.pop();
    });
    setGameData({ ...gameData, rounds: newRounds });
  };

  // --- EXISTING HANDLERS ---

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleClueImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && tempClueData) {
      const file = e.target.files[0];
      setTempClueData({
        ...tempClueData,
        media_file: file,
        media_preview: URL.createObjectURL(file),
      });
    }
  };

  const saveClue = () => {
    if (!editingClue || !tempClueData) return;
    const newGameData = { ...gameData };
    newGameData.rounds[activeRoundIndex].categories[editingClue.catIndex].clues[
      editingClue.clueIndex
    ] = tempClueData;
    setGameData(newGameData);
    setEditingClue(null);
  };

  const handlePublish = async (isPublished: boolean) => {
    try {
      // 1. Basic UI Validation
      if (!title.trim()) {
        alert("Please enter a game title.");
        return;
      }
      if (!thumbnail) {
        alert("Please upload a thumbnail image.");
        return;
      }

      const formData = new FormData();
      formData.append("name", title);
      formData.append("description", description || ""); // Ensure string
      if (thumbnail) formData.append("thumbnail_image", thumbnail);
      formData.append("is_publish_immediately", String(isPublished));

      // 2. DATA CLEANING & MAPPING
      const filesToUpload: File[] = [];

      const backendRounds = gameData.rounds
        .map((round) => {
          // Filter & Sanitize Categories
          const validCategories = round.categories
            .map((cat, cIndex) => {
              // Sanitize Title: Backend rejects empty strings
              const safeTitle =
                cat.title.trim() === "" ? `Category ${cIndex + 1}` : cat.title;

              // Filter Clues: Keep only if Q & A exist
              const validClues = cat.clues
                .filter(
                  (c) => c.question.trim() !== "" && c.answer.trim() !== "",
                )
                .map((clue) => {
                  let mediaIndex = null;

                  // Handle Image Logic
                  if (clue.media_file) {
                    filesToUpload.push(clue.media_file);
                    mediaIndex = filesToUpload.length - 1;
                  }

                  // Sanitize Value: Backend rejects 0 or negative
                  // If value is 0/NaN, default to 200
                  const safeValue =
                    !clue.value || clue.value <= 0 ? 200 : clue.value;

                  return {
                    id: clue.id,
                    question: clue.question,
                    answer: clue.answer,
                    value: safeValue,
                    is_daily_double: clue.is_daily_double,
                    media_image_index: mediaIndex,
                  };
                });

              // If no valid clues in this category, drop the category
              if (validClues.length === 0) return null;

              return {
                ...cat,
                title: safeTitle,
                clues: validClues,
              };
            })
            .filter((cat): cat is NonNullable<typeof cat> => cat !== null);

          // If no valid categories in this round, drop the round
          if (validCategories.length === 0) return null;

          return {
            ...round,
            // Sanitize Round Name
            name: round.name.trim() || `Round`,
            categories: validCategories,
          };
        })
        .filter((round): round is NonNullable<typeof round> => round !== null);

      // 3. FINAL STRUCTURE CHECK
      if (backendRounds.length === 0) {
        alert(
          "Cannot publish empty game. Please add at least one valid Question & Answer.",
        );
        return;
      }

      // 4. APPEND DATA
      filesToUpload.forEach((file) => {
        formData.append("files_to_upload", file);
      });

      formData.append("settings", JSON.stringify(gameData.settings));
      formData.append("rounds", JSON.stringify(backendRounds));

      // Debug: Log what we are sending to spot issues
      // console.log("Sending Payload:", {
      //   settings: gameData.settings,
      //   rounds: backendRounds,
      //   files: filesToUpload.length
      // });

      await jeopardyApi.create(formData);

      // Success
      navigate("/my-projects");
    } catch (error: unknown) {
      console.error("Failed to create game:", error);

      // 5. IMPROVED ERROR HANDLING (use `unknown` and narrow types)
      if (typeof error === "object" && error !== null) {
        const maybeErr = error as { response?: { data?: unknown } };

        if (maybeErr.response && maybeErr.response.data) {
          const backendData = maybeErr.response.data as Record<string, unknown>;

          if ("details" in backendData) {
            alert(`Validation Error: ${JSON.stringify(backendData.details)}`);
          } else if (
            "message" in backendData &&
            typeof backendData.message === "string"
          ) {
            alert(`Error: ${backendData.message}`);
          } else {
            alert("Failed to create game. Check console for 422 details.");
          }
        } else {
          alert("Network error or server unreachable.");
        }
      } else {
        alert("An unexpected error occurred.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Create Jeopardy Game</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handlePublish(false)}>
            Save Draft
          </Button>
          <Button onClick={() => handlePublish(true)}>Publish</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Game Info & Settings (Same as before) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Game Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Thumbnail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg h-40 flex items-center justify-center relative bg-slate-50">
                {thumbnailPreview ? (
                  <img
                    src={thumbnailPreview}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Upload className="text-slate-400" />
                )}
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- DYNAMIC ROUND EDITOR --- */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Round Editor</h2>
            <Button onClick={addRound} size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> Add Round
            </Button>
          </div>

          {/* Round Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {gameData.rounds.map((round, idx) => (
              <div key={round.id} className="relative group">
                <Button
                  variant={idx === activeRoundIndex ? "default" : "outline"}
                  onClick={() => setActiveRoundIndex(idx)}
                  className="pr-8"
                >
                  {round.name}
                </Button>
                {gameData.rounds.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRound(idx);
                    }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Active Round Controls */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-4">
                <Input
                  value={gameData.rounds[activeRoundIndex].name}
                  onChange={(e) => {
                    const newRounds = [...gameData.rounds];
                    newRounds[activeRoundIndex].name = e.target.value;
                    setGameData({ ...gameData, rounds: newRounds });
                  }}
                  className="w-40 font-bold"
                />
                <Select
                  value={gameData.rounds[activeRoundIndex].type}
                  onValueChange={(val: JeopardyRound["type"]) => {
                    const newRounds = [...gameData.rounds];
                    newRounds[activeRoundIndex].type = val;
                    setGameData({ ...gameData, rounds: newRounds });
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jeopardy">Jeopardy</SelectItem>
                    <SelectItem value="double">Double Jeopardy</SelectItem>
                    <SelectItem value="final">Final Jeopardy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={addRow}>
                  + Row
                </Button>
                <Button variant="outline" size="sm" onClick={removeRow}>
                  - Row
                </Button>
                <div className="w-px h-6 bg-slate-300 mx-2" />
                <Button variant="outline" size="sm" onClick={addCategory}>
                  + Category
                </Button>
              </div>
            </CardHeader>

            <CardContent className="overflow-x-auto">
              <div className="flex gap-4 min-w-max pb-4 pt-5 px-2">
                {gameData.rounds[activeRoundIndex].categories.map(
                  (category, catIndex) => (
                    <div
                      key={category.id}
                      className="w-56 space-y-2 relative group"
                    >
                      {/* Remove Category Button */}
                      <div className="absolute -top-3 -right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-6 w-6 rounded-full shadow-md"
                          onClick={() => removeCategory(catIndex)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>

                      <Input
                        className="font-bold text-center bg-blue-900 text-white border-blue-900"
                        value={category.title}
                        onChange={(e) => {
                          const newRounds = [...gameData.rounds];
                          newRounds[activeRoundIndex].categories[
                            catIndex
                          ].title = e.target.value;
                          setGameData({ ...gameData, rounds: newRounds });
                        }}
                      />

                      {category.clues.map((clue, clueIndex) => (
                        <div
                          key={clue.id}
                          onClick={() => {
                            setEditingClue({ catIndex, clueIndex });
                            setTempClueData({ ...clue });
                          }}
                          className={`h-20 border-2 rounded-md flex flex-col items-center justify-center cursor-pointer relative
                                            hover:border-blue-500 hover:bg-blue-50
                                            ${clue.question ? "bg-green-50 border-green-200" : "bg-white border-slate-200"}`}
                        >
                          {clue.media_file && (
                            <ImageIcon className="absolute top-1 right-1 w-3 h-3 text-blue-500" />
                          )}
                          <span className="font-bold text-lg text-blue-900">
                            ${clue.value}
                          </span>
                          {clue.is_daily_double && (
                            <span className="text-[9px] bg-yellow-400 px-1 rounded">
                              Daily Double
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ),
                )}

                {/* Add Category Visual Placeholder */}
                {gameData.rounds[activeRoundIndex].categories.length < 6 && (
                  <button
                    onClick={addCategory}
                    className="w-12 flex items-center justify-center border-2 border-dashed border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors"
                  >
                    <Plus className="text-slate-400" />
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Clue Editor Dialog (Same as before) */}
      <Dialog
        open={!!editingClue}
        onOpenChange={(open) => !open && setEditingClue(null)}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Clue</DialogTitle>
          </DialogHeader>
          {tempClueData && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input
                    type="number"
                    value={tempClueData.value}
                    onChange={(e) =>
                      setTempClueData({
                        ...tempClueData,
                        value: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    checked={tempClueData.is_daily_double}
                    onCheckedChange={(c) =>
                      setTempClueData({ ...tempClueData, is_daily_double: c })
                    }
                  />
                  <Label>Daily Double</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Image</Label>
                <Input type="file" onChange={handleClueImageChange} />
              </div>
              <div className="space-y-2">
                <Label>Question</Label>
                <Textarea
                  value={tempClueData.question}
                  onChange={(e) =>
                    setTempClueData({
                      ...tempClueData,
                      question: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Answer</Label>
                <Input
                  value={tempClueData.answer}
                  onChange={(e) =>
                    setTempClueData({ ...tempClueData, answer: e.target.value })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={saveClue}>Save Clue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
