import { useEffect, useState } from "react";

// Types
export interface WordItem {
  id: string;
  text: string;
  correctCategory: string;
  completed?: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export type GameState = "waiting" | "countdown" | "playing";

export interface DropFeedback {
  categoryId: string;
  isCorrect: boolean;
}

// Utility functions
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const getScrollAnimation = () => `
  @keyframes scroll-right {
    0% { 
      transform: translateX(-50%); 
    }
    100% { 
      transform: translateX(0); 
    }
  }
  [data-dragging="true"] {
    border-color: #d1d5db !important;
    box-shadow: none !important;
  }
  [data-dragging="true"]:hover {
    border-color: #d1d5db !important;
    box-shadow: none !important;
    transform: none !important;
  }
`;

interface SpeedSortingDetail {
  id: string;
  name: string;
  description: string;
  thumbnail_image: string;
  categories: { id: string; name: string }[];
  items: {
    id: string;
    value: string;
    category_index?: number;
    category_id?: string;
    type: "text" | "file";
  }[];
}

const transformDataToGameFormat = (
  detail: SpeedSortingDetail | null,
): { words: WordItem[]; categories: Category[] } => {
  if (!detail) return { words: [], categories: [] };

  const categories: Category[] = detail.categories.map((cat, index) => ({
    id: cat.id,
    name: cat.name,
    color:
      index === 0
        ? "bg-blue-600"
        : index === 1
          ? "bg-green-600"
          : index === 2
            ? "bg-purple-600"
            : "bg-red-600",
  }));

  const words: WordItem[] = detail.items.map((item) => {
    // Handle both category_index and direct category_id approaches
    let correctCategoryId = "";

    if (typeof item.category_index === "number" && item.category_index >= 0) {
      // Use category_index if it's a valid number
      correctCategoryId = detail.categories[item.category_index]?.id || "";
    } else if (item.category_id) {
      // Fallback to category_id if category_index is not available
      correctCategoryId = item.category_id;
    } else {
      // Last resort: use first category as default
      correctCategoryId = detail.categories[0]?.id || "";
    }

    return {
      id: item.id,
      text: item.type === "text" ? item.value : `Image: ${item.id}`,
      correctCategory: correctCategoryId,
      completed: false,
    };
  });

  return { words, categories };
};

export function useSpeedSortingGame(detail: SpeedSortingDetail | null = null) {
  const [words, setWords] = useState<WordItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (detail) {
      const newGameData = transformDataToGameFormat(detail);
      setWords(newGameData.words);
      setCategories(newGameData.categories);
    }
  }, [detail]);
  const [timer, setTimer] = useState(0);
  const [incorrectAttempts, setIncorrectAttempts] = useState(0);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [dropFeedback, setDropFeedback] = useState<DropFeedback | null>(null);
  const [showExit, setShowExit] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [finalTime, setFinalTime] = useState(0);
  const [gameState, setGameState] = useState<GameState>("waiting");
  const [countdown, setCountdown] = useState(3);

  const totalWords = words.length;
  const completedWords = words.filter((w) => w.completed).length;
  const speed = totalWords <= 10 ? 5 : totalWords <= 20 ? 15 : 10;

  useEffect(() => {
    if (gameState !== "playing" || gameEnded) return;
    const interval = setInterval(() => setTimer((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [gameState, gameEnded]);

  useEffect(() => {
    if (completedWords === totalWords && completedWords > 0 && !gameEnded) {
      setGameEnded(true);
      setFinalTime(timer);
    }
  }, [completedWords, totalWords, timer, gameEnded]);

  const startGame = () => {
    setGameState("countdown");
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setGameState("playing");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resetGame = () => {
    // Get fresh game data
    const freshGameData = transformDataToGameFormat(detail);
    setWords(freshGameData.words.map((w) => ({ ...w, completed: false })));
    setCategories(freshGameData.categories);
    setScore(0);
    setTimer(0);
    setIncorrectAttempts(0);
    setGameEnded(false);
    setFinalTime(0);
    setGameState("waiting");
    setCountdown(3);
    setDraggedItem(null);
    setHoveredCategory(null);
    setDropFeedback(null);
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    wordId: string,
  ) => {
    if (gameState !== "playing") {
      e.preventDefault();
      return;
    }
    setDraggedItem(wordId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setHoveredCategory(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (
    e: React.DragEvent<HTMLDivElement>,
    categoryId: string,
  ) => {
    e.preventDefault();
    if (draggedItem) {
      setHoveredCategory(categoryId);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setHoveredCategory(null);
    }
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    categoryId: string,
  ) => {
    e.preventDefault();

    if (!draggedItem) return;

    const draggedWord = words.find((w) => w.id === draggedItem);
    if (!draggedWord) return;

    const isCorrect = draggedWord.correctCategory === categoryId;

    setDropFeedback({ categoryId, isCorrect });

    if (isCorrect) {
      setTimeout(() => {
        setWords((prev) =>
          prev.map((w) =>
            w.id === draggedItem ? { ...w, completed: true } : w,
          ),
        );
        setScore((prev) => prev + 1);
      }, 300);
    } else {
      setIncorrectAttempts((prev) => prev + 1);
    }

    setDraggedItem(null);
    setHoveredCategory(null);

    setTimeout(() => {
      setDropFeedback(null);
    }, 600);
  };

  return {
    // State
    words,
    categories,
    score,
    timer,
    incorrectAttempts,
    draggedItem,
    hoveredCategory,
    dropFeedback,
    showExit,
    gameEnded,
    finalTime,
    gameState,
    countdown,
    totalWords,
    completedWords,
    speed,
    // Actions
    setShowExit,
    startGame,
    resetGame,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  };
}
