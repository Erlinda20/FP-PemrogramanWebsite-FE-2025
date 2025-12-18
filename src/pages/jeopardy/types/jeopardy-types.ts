// 1. Clue Interface
export interface JeopardyClue {
  id: string;
  value: number;
  question: string;
  answer: string;
  is_daily_double: boolean;

  // FIXED: Added this field so the Board can read the image path
  media_url?: string | null;

  // Backend Mapping (for creation)
  media_image_index?: number | null;

  // UI Only (for upload previews)
  media_file?: File | null;
  media_preview?: string;
  isPlayed?: boolean;
}

// 2. Category Interface
export interface JeopardyCategory {
  id: string;
  title: string;
  clues: JeopardyClue[];
}

// 3. Round Interface
export interface JeopardyRound {
  id: string;
  name: string;
  type: "jeopardy" | "double" | "final";
  categories: JeopardyCategory[];
}

// 4. Settings Interface
export interface JeopardySettings {
  max_teams: number;
  time_limit_per_clue: number;
  allow_daily_double: boolean;
  double_jeopardy_multiplier: number;
  starting_score: number;
}

// 5. Game Data Container
export interface JeopardyGameData {
  settings: JeopardySettings;
  rounds: JeopardyRound[];
}

// 6. Team Interface
export interface Team {
  id: number;
  name: string;
  score: number;
}
