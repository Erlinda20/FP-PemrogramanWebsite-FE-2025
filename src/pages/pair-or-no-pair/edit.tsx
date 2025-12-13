import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { TextareaField } from "@/components/ui/textarea-field";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/ui/form-field";
import { Switch } from "@/components/ui/switch";
import Dropzone from "@/components/ui/dropzone";
import { Typography } from "@/components/ui/typography";
import { ArrowLeft, Plus, SaveIcon, Trash2, X, EyeIcon } from "lucide-react";
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
import type { AxiosError } from "axios";
import api from "@/api/axios";

interface PairItem {
  leftContent: string;
  rightContent: string;
}

interface ApiItem {
  left_content: string;
  right_content: string;
}

function EditPairOrNoPair() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [items, setItems] = useState<PairItem[]>([
    { leftContent: "", rightContent: "" },
    { leftContent: "", rightContent: "" },
  ]);

  const [settings, setSettings] = useState({
    isPublishImmediately: false,
  });

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchGame = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/game/game-type/pair-or-no-pair/${id}`);
        const data = res.data.data;

        setTitle(data.name || "");
        setDescription(data.description || "");
        setSettings({
          isPublishImmediately: data.is_published || false,
        });

        if (data.thumbnail_image) {
          setThumbnailPreview(
            `${import.meta.env.VITE_API_URL}/${data.thumbnail_image}`,
          );
        }

        // Load items if available
        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
          setItems(
            data.items.map((item: ApiItem) => ({
              leftContent: item.left_content || "",
              rightContent: item.right_content || "",
            })),
          );
        }
      } catch (err) {
        console.error("Failed to fetch game:", err);
        toast.error("Failed to load game data. Please try again.");
        navigate("/my-projects");
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [id, navigate]);

  const addItem = () => {
    setItems((prev) => [...prev, { leftContent: "", rightContent: "" }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 2) {
      setItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (
    index: number,
    field: "leftContent" | "rightContent",
    value: string,
  ) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (publish = false) => {
    if (!title.trim()) return toast.error("Game title is required");
    if (items.length < 2) return toast.error("Minimum 2 pairs required");

    // Validate all items have content
    for (let i = 0; i < items.length; i++) {
      if (!items[i].leftContent.trim() || !items[i].rightContent.trim()) {
        return toast.error(
          `Pair ${i + 1} must have both left and right content`,
        );
      }
    }

    const formData = new FormData();
    formData.append("name", title);
    formData.append("description", description);
    if (thumbnail) {
      formData.append("thumbnail_image", thumbnail);
    }
    // Always send is_publish: true for publish, false for draft
    formData.append("is_publish", String(publish));
    formData.append(
      "items",
      JSON.stringify(
        items.map((item) => ({
          left_content: item.leftContent,
          right_content: item.rightContent,
        })),
      ),
    );

    try {
      await api.patch(`/api/game/game-type/pair-or-no-pair/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(
        publish
          ? "Game updated and published successfully!"
          : "Game updated successfully!",
      );
      navigate("/my-projects");
    } catch (err: unknown) {
      console.error("Failed to update game:", err);
      const axiosError = err as AxiosError<{ message?: string }>;
      const errorMessage =
        axiosError.response?.data?.message ||
        axiosError.message ||
        "Failed to update game. Please try again.";
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <Typography variant="h3">Loading...</Typography>
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
            <Typography variant="h3">Edit Pair or No Pair Game</Typography>
            <Typography variant="p" className="mt-2">
              Update your matching game
            </Typography>
          </div>

          {/* Game Info Section */}
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
            </div>
            <TextareaField
              label="Description"
              placeholder="Describe your matching game"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div>
              <Label className="mb-2">Thumbnail Image</Label>
              {thumbnailPreview && !thumbnail && (
                <div className="mb-4">
                  <img
                    src={thumbnailPreview}
                    alt="Current thumbnail"
                    className="w-32 h-32 object-cover rounded-md"
                  />
                </div>
              )}
              <Dropzone
                label={
                  thumbnailPreview
                    ? "Change Thumbnail Image"
                    : "Thumbnail Image"
                }
                allowedTypes={["image/png", "image/jpeg"]}
                maxSize={2 * 1024 * 1024}
                onChange={(file) => {
                  setThumbnail(file);
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setThumbnailPreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>
          </div>

          {/* Pairs Section */}
          <div className="flex justify-between items-center">
            <Typography variant="p">Pairs {`(${items.length})`}</Typography>
            <Button variant="outline" onClick={addItem}>
              <Plus /> Add Pair
            </Button>
          </div>

          {items.map((item, index) => (
            <div
              key={index}
              className="bg-white w-full h-full p-6 space-y-4 rounded-xl border"
            >
              <div className="flex justify-between">
                <Typography variant="p">Pair {index + 1}</Typography>
                <Trash2
                  size={20}
                  className={`${
                    items.length <= 2
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-red-500 cursor-pointer"
                  }`}
                  onClick={() => removeItem(index)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2">
                    Left Content <span className="text-red-500">*</span>
                  </Label>
                  <FormField
                    label=""
                    placeholder="e.g., Apple"
                    type="text"
                    value={item.leftContent}
                    onChange={(e) =>
                      handleItemChange(index, "leftContent", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label className="mb-2">
                    Right Content <span className="text-red-500">*</span>
                  </Label>
                  <FormField
                    label=""
                    placeholder="e.g., 🍎 or image URL"
                    type="text"
                    value={item.rightContent}
                    onChange={(e) =>
                      handleItemChange(index, "rightContent", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Settings Section */}
          <div className="bg-white w-full h-full p-6 space-y-6 rounded-xl border">
            <Typography variant="p">Settings</Typography>
            <div className="flex justify-between items-center">
              <div>
                <Label>Publish Game</Label>
                <Typography variant="small">
                  Make the game publicly available
                </Typography>
              </div>
              <div>
                <Switch
                  checked={settings.isPublishImmediately}
                  onCheckedChange={(val: boolean) =>
                    setSettings((prev) => ({
                      ...prev,
                      isPublishImmediately: val,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
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
                  <AlertDialogAction onClick={() => navigate("/my-projects")}>
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
              disabled={items.length < 2}
              size="sm"
              variant="outline"
              className="bg-black text-white"
              onClick={() => handleSubmit(true)}
            >
              <EyeIcon /> Update & Publish
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditPairOrNoPair;
