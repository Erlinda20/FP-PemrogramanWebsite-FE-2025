import { useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Trash2,
  Plus,
  Save,
  ArrowLeft,
  Image as ImageIcon,
  Upload,
} from "lucide-react";

interface QuestionItem {
  id: number;
  word: string;
  imageFile: File | null;
  previewUrl: string | null;
}

interface QuestionDataPayload {
  correct_word: string;
  question_image_array_index: number;
}

const CreateAnagram = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // STATE GAME HEADER
  const [gameInfo, setGameInfo] = useState({
    name: "",
    description: "",
    is_publish_immediately: false,
    is_question_randomized: false,
  });

  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  // QUESTION STATE
  const [questions, setQuestions] = useState<QuestionItem[]>([
    { id: Date.now(), word: "", imageFile: null, previewUrl: null },
  ]);

  // HANDLERS
  const handleThumbnailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { id: Date.now(), word: "", imageFile: null, previewUrl: null },
    ]);
  };

  const handleRemoveQuestion = (id: number) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleQuestionWordChange = (id: number, val: string) => {
    const updated = questions.map((q) =>
      q.id === id ? { ...q, word: val } : q,
    );
    setQuestions(updated);
  };

  const handleQuestionImageChange = (
    id: number,
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const updated = questions.map((q) => {
        if (q.id === id) {
          return {
            ...q,
            imageFile: file,
            previewUrl: URL.createObjectURL(file),
          };
        }
        return q;
      });
      setQuestions(updated);
    }
  };

  // LOGIC SUBMIT
  const handleSubmit = async () => {
    // 1. INPUT VALIDATION
    if (!gameInfo.name) return alert("Game Title is required!");

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].word)
        return alert(
          `Question no ${i + 1}: Correct Answer (Word) is required!`,
        );
      if (!questions[i].imageFile)
        return alert(`Question no ${i + 1}: Image Hint is required!`);
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Authentication failed! Please login again.");
        navigate("/login");
        return;
      }

      // 3. Siapkan FormData
      const formData = new FormData();

      formData.append("name", gameInfo.name);
      formData.append("description", gameInfo.description);
      formData.append(
        "is_publish_immediately",
        gameInfo.is_publish_immediately.toString(),
      );
      formData.append("score_per_question", "10");
      formData.append(
        "is_question_randomized",
        gameInfo.is_question_randomized.toString(),
      );

      if (thumbnail) {
        formData.append("thumbnail_image", thumbnail);
      }

      const questionsDataPayload: QuestionDataPayload[] = [];

      questions.forEach((q, index) => {
        if (q.imageFile) {
          formData.append("files_to_upload", q.imageFile);
        }

        questionsDataPayload.push({
          correct_word: q.word.toUpperCase(),
          question_image_array_index: index,
        });
      });

      formData.append("questions", JSON.stringify(questionsDataPayload));

      console.log("=== SENDING TO BACKEND ===");

      // BACKEND FETCH
      const response = await fetch("http://localhost:4000/api/game/anagram", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      // Cek response, hati-hati kalau backend balikin HTML error
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") === -1) {
        throw new Error(
          "Server returned HTML error (Not JSON). Check Backend URL or Token.",
        );
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create game");
      }

      alert("Anagram Game Created Successfully!");
      navigate("/my-projects");
    } catch (error: unknown) {
      console.error(error);
      alert(`Error: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-32 relative">
      <div className="mb-6">
        <Button
          size="sm"
          variant="ghost"
          className="gap-2 pl-0 text-slate-500 hover:text-slate-900 hover:bg-transparent"
          onClick={() => navigate("/create-projects")}
        >
          <ArrowLeft className="w-5 h-5" /> Back to Projects
        </Button>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* PAGE HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Create Anagram Game
          </h1>
          <p className="text-slate-500 mt-1">
            Arrange scrambled words with image hints.
          </p>
        </div>

        {/* FORM CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN: Basic Info & Questions */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Game Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Example: Guess the Animal Name"
                    value={gameInfo.name}
                    onChange={(e) =>
                      setGameInfo({ ...gameInfo, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Brief description of this game..."
                    value={gameInfo.description}
                    onChange={(e) =>
                      setGameInfo({ ...gameInfo, description: e.target.value })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Questions List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Question List</h2>
                <span className="text-sm text-slate-500">
                  Total: {questions.length} Questions
                </span>
              </div>

              {questions.map((q, index) => (
                <Card
                  key={q.id}
                  className="relative overflow-hidden border-l-4 border-l-blue-500 shadow-sm"
                >
                  <CardContent className="pt-6 flex flex-col md:flex-row gap-6">
                    {/* Image Hint Upload */}
                    <div className="flex-shrink-0 w-full md:w-48 space-y-2">
                      <Label className="text-xs font-semibold uppercase text-slate-500">
                        Image Hint <span className="text-red-500">*</span>
                      </Label>
                      <div
                        className={`h-32 w-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${q.previewUrl ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:bg-slate-50"}`}
                        onClick={() =>
                          document.getElementById(`q-img-${q.id}`)?.click()
                        }
                      >
                        {q.previewUrl ? (
                          <img
                            src={q.previewUrl}
                            alt="Preview"
                            className="h-full w-full object-cover rounded-md"
                          />
                        ) : (
                          <div className="text-center p-2">
                            <ImageIcon className="w-8 h-8 mx-auto text-slate-400 mb-1" />
                            <span className="text-xs text-slate-500">
                              Upload Image
                            </span>
                          </div>
                        )}
                        <input
                          id={`q-img-${q.id}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleQuestionImageChange(q.id, e)}
                        />
                      </div>
                    </div>

                    {/* Correct Answer Input */}
                    <div className="flex-1 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                          Question #{index + 1}
                        </div>
                        {questions.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleRemoveQuestion(q.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" /> Remove
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>
                          Correct Answer (Word){" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="Example: CAT"
                          value={q.word}
                          onChange={(e) =>
                            handleQuestionWordChange(q.id, e.target.value)
                          }
                          className="font-mono uppercase tracking-wider"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                variant="outline"
                className="w-full py-8 border-dashed border-2 text-slate-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50"
                onClick={handleAddQuestion}
              >
                <Plus className="w-5 h-5 mr-2" /> Add New Question
              </Button>
            </div>
          </div>

          {/* RIGHT COLUMN: Settings */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Game Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Game Thumbnail */}
                <div className="space-y-2">
                  <Label>Game Thumbnail</Label>
                  <div
                    className="aspect-video w-full border rounded-md bg-slate-100 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition"
                    onClick={() =>
                      document.getElementById("thumb-input")?.click()
                    }
                  >
                    {thumbnailPreview ? (
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-slate-400">
                        <Upload className="w-8 h-8 mb-2" />
                        <span className="text-xs">Upload Cover</span>
                      </div>
                    )}
                  </div>
                  <input
                    id="thumb-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleThumbnailChange}
                  />
                </div>

                <hr />

                {/* Toggles */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="randomize" className="cursor-pointer">
                    Randomize Question Order?
                  </Label>
                  <Switch
                    id="randomize"
                    checked={gameInfo.is_question_randomized}
                    onCheckedChange={(checked) =>
                      setGameInfo({
                        ...gameInfo,
                        is_question_randomized: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="publish" className="cursor-pointer">
                    Publish Immediately?
                  </Label>
                  <Switch
                    id="publish"
                    checked={gameInfo.is_publish_immediately}
                    onCheckedChange={(checked) =>
                      setGameInfo({
                        ...gameInfo,
                        is_publish_immediately: checked,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* FOOTER FLOATING BUTTON */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg z-50">
        <div className="max-w-5xl mx-auto flex justify-end">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={isLoading}
            className="min-w-[150px]"
          >
            {isLoading ? (
              "Saving..."
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" /> Save Game
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateAnagram;
