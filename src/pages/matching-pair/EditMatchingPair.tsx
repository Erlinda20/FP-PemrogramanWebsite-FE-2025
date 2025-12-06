import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { TextareaField } from "@/components/ui/textarea-field";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/ui/form-field";
import { Switch } from "@/components/ui/switch";
import Dropzone from "@/components/ui/dropzone";
import { Typography } from "@/components/ui/typography";
import { ArrowLeft, SaveIcon, EyeIcon, X, Plus, Trash2 } from "lucide-react";
import api from "@/api/axios";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface Pair {
  first: string;
  second: string;
  first_image_array_index?: number;
  second_image_array_index?: number;
  first_image_file?: File | null;
  second_image_file?: File | null;
  first_image?: string | null;
  second_image?: string | null;
}

export default function EditMatchingPair() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [existingThumbnail, setExistingThumbnail] = useState<string | null>(null);
  const [isPublishImmediately, setIsPublishImmediately] = useState(false);
  const [pairs, setPairs] = useState<Pair[]>([]);

  useEffect(() => {
    const fetchGame = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await api.get(
          `/api/game/game-type/matching-pair/${id}`,
        );
        const game = response.data.data;
        setTitle(game.name);
        setDescription(game.description || "");
        setExistingThumbnail(game.thumbnail_image);
        setIsPublishImmediately(game.is_published);
        
        const gameJson = game.game_json as { pairs: any[] };
        if (gameJson.pairs) {
          setPairs(
            gameJson.pairs.map((pair) => ({
              first: pair.first || "",
              second: pair.second || "",
              first_image: pair.first_image || null,
              second_image: pair.second_image || null,
            })),
          );
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load game.");
        navigate("/my-projects");
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [id, navigate]);

  const addPair = () => {
    if (pairs.length >= 16) {
      toast.error("Maximum 16 pairs allowed");
      return;
    }
    setPairs((prev) => [...prev, { first: "", second: "" }]);
  };

  const removePair = (index: number) => {
    if (pairs.length <= 4) {
      toast.error("Minimum 4 pairs required");
      return;
    }
    setPairs((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePairChange = (
    index: number,
    field: "first" | "second",
    value: string,
  ) => {
    const newPairs = [...pairs];
    newPairs[index][field] = value;
    setPairs(newPairs);
  };

  const handleImageChange = (
    index: number,
    field: "first_image_file" | "second_image_file",
    file: File | null,
  ) => {
    const newPairs = [...pairs];
    newPairs[index][field] = file;
    setPairs(newPairs);
  };

  const handleSubmit = async (publish = false) => {
    if (!id) return;

    // Validation
    if (!thumbnail && !existingThumbnail) {
      toast.error("Thumbnail is required");
      return;
    }

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    // Validate pairs
    const invalidPairs = pairs.filter(
      (p) => !p.first.trim() || !p.second.trim(),
    );
    if (invalidPairs.length > 0) {
      toast.error("All pairs must have both first and second values");
      return;
    }

    if (pairs.length < 4) {
      toast.error("Minimum 4 pairs required");
      return;
    }

    if (pairs.length > 16) {
      toast.error("Maximum 16 pairs allowed");
      return;
    }

    try {
      // Collect all image files
      const imageFiles: File[] = [];
      const processedPairs = pairs.map((pair) => {
        const processedPair: {
          first: string;
          second: string;
          first_image_array_index?: number;
          second_image_array_index?: number;
        } = {
          first: pair.first.trim(),
          second: pair.second.trim(),
        };

        if (pair.first_image_file) {
          const index = imageFiles.length;
          imageFiles.push(pair.first_image_file);
          processedPair.first_image_array_index = index;
        }

        if (pair.second_image_file) {
          const index = imageFiles.length;
          imageFiles.push(pair.second_image_file);
          processedPair.second_image_array_index = index;
        }

        return processedPair;
      });

      // Create FormData
      const formData = new FormData();
      if (title.trim() !== "") {
        formData.append("name", title.trim());
      }
      if (description.trim() !== "") {
        formData.append("description", description.trim());
      }
      if (thumbnail) {
        formData.append("thumbnail_image", thumbnail);
      }
      formData.append("is_publish_immediately", String(publish || isPublishImmediately));
      formData.append("pairs", JSON.stringify(processedPairs));

      // Add image files
      imageFiles.forEach((file) => {
        formData.append("files_to_upload", file);
      });

      await api.patch(`/api/game/game-type/matching-pair/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Matching pair game updated successfully!");
      navigate("/my-projects");
    } catch (err: any) {
      console.error("Failed to update game:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to update game. Please try again.";
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-black"></div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen flex flex-col">
      <div className="bg-white h-fit w-full flex justify-between items-center px-8 py-4">
        <Button
          size="sm"
          variant="ghost"
          className="hidden md:flex"
          onClick={() => navigate("/my-projects")}
        >
          <ArrowLeft /> Back
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="block md:hidden"
          onClick={() => navigate("/my-projects")}
        >
          <ArrowLeft />
        </Button>
      </div>
      <div className="w-full h-full p-8 justify-center items-center flex flex-col">
        <div className="max-w-3xl w-full space-y-6">
          <div>
            <Typography variant="h3">Edit Matching Pair Game</Typography>
            <Typography variant="p" className="mt-2">
              Update your matching pair game
            </Typography>
          </div>

          <div className="bg-white w-full h-full p-6 space-y-6 rounded-xl border">
            <div>
              <FormField
                required
                label="Game Title"
                placeholder="Title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              {formErrors["title"] && (
                <p className="text-sm text-red-500">{formErrors["title"]}</p>
              )}
            </div>

            <TextareaField
              label="Description"
              placeholder="Describe your matching pair game"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div>
              <Label>Thumbnail Image</Label>
              {existingThumbnail && !thumbnail && (
                <div className="mt-2 mb-4">
                  <img
                    src={`${import.meta.env.VITE_API_URL}/${existingThumbnail}`}
                    alt="Current thumbnail"
                    className="w-32 h-32 object-cover rounded-md"
                  />
                  <Typography variant="small" className="text-slate-500 mt-1">
                    Current thumbnail
                  </Typography>
                </div>
              )}
              <Dropzone
                label={thumbnail ? "New Thumbnail Image" : "Change Thumbnail Image (Optional)"}
                allowedTypes={["image/png", "image/jpeg"]}
                maxSize={2 * 1024 * 1024}
                onChange={(file) => setThumbnail(file)}
              />
              {formErrors["thumbnail"] && (
                <p className="text-sm text-red-500">
                  {formErrors["thumbnail"]}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Typography variant="p">
              Pairs {`(${pairs.length})`} <span className="text-red-500">*</span>
            </Typography>
            <Button variant="outline" onClick={addPair} disabled={pairs.length >= 16}>
              <Plus /> Add Pair
            </Button>
          </div>

          {pairs.map((pair, index) => (
            <div
              key={index}
              className="bg-white w-full h-full p-6 space-y-6 rounded-xl border"
            >
              <div className="flex justify-between">
                <Typography variant="p">Pair {index + 1}</Typography>
                <Trash2
                  size={20}
                  className={`${
                    pairs.length === 4
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-red-500 cursor-pointer"
                  }`}
                  onClick={() => {
                    if (pairs.length > 4) removePair(index);
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label>
                      First Item <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Enter first item"
                      value={pair.first}
                      onChange={(e) =>
                        handlePairChange(index, "first", e.target.value)
                      }
                      className="mt-2"
                    />
                  </div>
                  {pair.first_image && !pair.first_image_file && (
                    <div>
                      <img
                        src={`${import.meta.env.VITE_API_URL}/${pair.first_image}`}
                        alt="Current first image"
                        className="w-24 h-24 object-cover rounded-md"
                      />
                      <Typography variant="small" className="text-slate-500">
                        Current image
                      </Typography>
                    </div>
                  )}
                  <div>
                    <Label>First Item Image (Optional)</Label>
                    <Dropzone
                      label=""
                      allowedTypes={["image/png", "image/jpeg"]}
                      maxSize={2 * 1024 * 1024}
                      onChange={(file) =>
                        handleImageChange(index, "first_image_file", file)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>
                      Second Item <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Enter second item"
                      value={pair.second}
                      onChange={(e) =>
                        handlePairChange(index, "second", e.target.value)
                      }
                      className="mt-2"
                    />
                  </div>
                  {pair.second_image && !pair.second_image_file && (
                    <div>
                      <img
                        src={`${import.meta.env.VITE_API_URL}/${pair.second_image}`}
                        alt="Current second image"
                        className="w-24 h-24 object-cover rounded-md"
                      />
                      <Typography variant="small" className="text-slate-500">
                        Current image
                      </Typography>
                    </div>
                  )}
                  <div>
                    <Label>Second Item Image (Optional)</Label>
                    <Dropzone
                      label=""
                      allowedTypes={["image/png", "image/jpeg"]}
                      maxSize={2 * 1024 * 1024}
                      onChange={(file) =>
                        handleImageChange(index, "second_image_file", file)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="bg-white w-full h-full p-6 space-y-6 rounded-xl border">
            <Typography variant="p">Settings</Typography>
            <div className="flex justify-between items-center">
              <div>
                <Label>Publish Immediately</Label>
                <Typography variant="small">
                  Make this game available to play immediately
                </Typography>
              </div>
              <div>
                <Switch
                  checked={isPublishImmediately}
                  onCheckedChange={setIsPublishImmediately}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-end w-full">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive">
                  <X /> Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel? All unsaved changes will be
                    lost.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Editing</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => navigate("/my-projects")}
                  >
                    Discard
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSubmit(false)}
            >
              <SaveIcon /> Save Draft
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-black text-white"
              onClick={() => handleSubmit(true)}
            >
              <EyeIcon /> Publish
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

