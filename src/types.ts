export type Difficulty = "facil" | "medio" | "dificil";

export type GameMode = "theme" | "custom";

export type ScreenState = "menu" | "playing" | "victory" | "stats" | "about" | "settings";

export interface Position {
  row: number;
  col: number;
}

export interface WordState {
  word: string;
  isFound: boolean;
  color: string; // Tailwind background highlight color
  path: Position[]; // Path coordinates when solved so we can keep them highlighted
}

export interface GridCell {
  row: number;
  col: number;
  char: string;
  isWordPart: boolean;
  foundByWords: string[]; // Keep track of which found words intersect this cell, so we can color them correctly!
}

export interface MultiplayerPlayer {
  id: number;
  name: string;
  score: number;
}

export interface MultiplayerState {
  isGroupMode: boolean;
  players: MultiplayerPlayer[];
  currentPlayerIndex: number;
  timePerTurn: number; // in seconds
  timeLeft: number; // in seconds (countdown)
}

export interface GameSettings {
  themeMode: "light" | "dark";
  gridTextSize: "pequeno" | "medieval" | "grande"; // Accessibility size
  soundVolume: number; // 0 to 1
  animationsEnabled: boolean;
}

export interface GameStats {
  played: number;
  victories: number;
  totalTimeSec: number;
  highScore: number;
  levelsUsed: {
    facil: number;
    medio: number;
    dificil: number;
  };
  themesUsed: Record<string, number>;
}

export interface SavedGameState {
  grid: string[][]; // The letter characters
  words: WordState[]; // All words we need to find with their details
  themeName: string;
  isCustom: boolean;
  difficulty: Difficulty;
  timeElapsed: number; // in seconds
  score: number;
  hintsUsed: number;
  maxHints: number;
  originalWordList: string[];
  multiplayerState?: MultiplayerState;
  timingMode?: "livre" | "temporizado";
  timingType?: "jogada" | "partida";
  timingDuration?: number;
  infiniteHints?: boolean;
}
