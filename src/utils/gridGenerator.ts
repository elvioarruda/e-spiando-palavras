import { Difficulty, Position, WordState } from "../types";

// Direction vectors
interface Direction {
  dx: number;
  dy: number;
  name: string;
}

const DIRECTIONS: Record<string, Direction> = {
  HORIZONTAL_RIGHT: { dx: 1, dy: 0, name: "→" },
  VERTICAL_DOWN: { dx: 0, dy: 1, name: "↓" },
  HORIZONTAL_LEFT: { dx: -1, dy: 0, name: "←" },
  VERTICAL_UP: { dx: 0, dy: -1, name: "↑" },
  DIAGONAL_DOWN_RIGHT: { dx: 1, dy: 1, name: "↘" },
  DIAGONAL_UP_LEFT: { dx: -1, dy: -1, name: "↖" },
  DIAGONAL_UP_RIGHT: { dx: 1, dy: -1, name: "↗" },
  DIAGONAL_DOWN_LEFT: { dx: -1, dy: 1, name: "↙" }
};

const TAILWIND_COLORS = [
  "bg-rose-500/30 text-rose-700 dark:text-rose-300 ring-rose-500",
  "bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 ring-emerald-500",
  "bg-amber-500/30 text-amber-700 dark:text-amber-300 ring-amber-500",
  "bg-sky-500/30 text-sky-700 dark:text-sky-300 ring-sky-500",
  "bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 ring-indigo-500",
  "bg-fuchsia-500/30 text-fuchsia-700 dark:text-fuchsia-300 ring-fuchsia-500",
  "bg-violet-500/30 text-violet-700 dark:text-violet-300 ring-violet-500",
  "bg-cyan-500/30 text-cyan-700 dark:text-cyan-300 ring-cyan-500",
  "bg-teal-500/30 text-teal-700 dark:text-teal-300 ring-teal-500",
  "bg-orange-500/30 text-orange-700 dark:text-orange-300 ring-orange-500"
];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Get directions permitted for a specific level
 */
function getAllowedDirections(difficulty: Difficulty): Direction[] {
  if (difficulty === "facil") {
    // Only Horizontal Right (→) and Vertical Down (↓)
    return [DIRECTIONS.HORIZONTAL_RIGHT, DIRECTIONS.VERTICAL_DOWN];
  }
  // Medium and Hard allow all 8 directions
  return Object.values(DIRECTIONS);
}

/**
 * Get grid sizing based on difficulty
 */
export function getGridSize(difficulty: Difficulty): number {
  if (difficulty === "facil") return 10;
  if (difficulty === "medio") return 15;
  return 20; // dificil
}

/**
 * Generates the game grid and maps placements
 */
export function generateGrid(
  words: string[],
  difficulty: Difficulty
): { grid: string[][]; wordStates: WordState[] } {
  const size = getGridSize(difficulty);
  const allowedDirs = getAllowedDirections(difficulty);

  // Filter and clean words to make sure they are within length and strictly uppercase A-Z
  let cleanWords = words
    .map(w =>
      w
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Z]/g, "")
        .trim()
    )
    .filter(w => w.length >= 4 && w.length <= size);

  // Remove duplicates
  cleanWords = Array.from(new Set(cleanWords));

  let attempts = 0;
  const maxAttempts = 20;

  while (attempts < maxAttempts) {
    attempts++;
    const grid: string[][] = Array(size)
      .fill(null)
      .map(() => Array(size).fill(" "));

    const placedWords: WordState[] = [];
    let success = true;

    // Sort words by length descending to place larger words first
    const sortedWords = [...cleanWords].sort((a, b) => b.length - a.length);

    for (let wordIndex = 0; wordIndex < sortedWords.length; wordIndex++) {
      const word = sortedWords[wordIndex];
      const color = TAILWIND_COLORS[wordIndex % TAILWIND_COLORS.length];
      const placement = tryPlaceWord(grid, word, allowedDirs, size);

      if (placement) {
        // Write word to grid
        const { row, col, dir } = placement;
        const path: Position[] = [];

        for (let i = 0; i < word.length; i++) {
          const r = row + i * dir.dy;
          const c = col + i * dir.dx;
          grid[r][c] = word[i];
          path.push({ row: r, col: c });
        }

        placedWords.push({
          word,
          isFound: false,
          color,
          path,
        });
      } else {
        // Failed to place a word
        success = false;
        break;
      }
    }

    if (success) {
      // Validate that all words are indeed inside the grid
      if (placedWords.length > 0) {
        // Fill remaining spaces with random uppercase letters
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (grid[r][c] === " ") {
              grid[r][c] = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
            }
          }
        }
        return { grid, wordStates: placedWords };
      }
    }
  }

  // Fallback if we absolutely cannot place all requested words (should be extremely rare after 20 complete retries,
  // but let's return a guaranteed smaller subset or a less-packed grid rather than crashing)
  console.warn("Could not place all words organically. Fitting as many as possible...");
  return generateGridEmergency(cleanWords, difficulty);
}

/**
 * Emergency generator that places as many words as it can, discarding ones that don't fit
 */
function generateGridEmergency(
  words: string[],
  difficulty: Difficulty
): { grid: string[][]; wordStates: WordState[] } {
  const size = getGridSize(difficulty);
  const allowedDirs = getAllowedDirections(difficulty);
  const grid: string[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(" "));

  const placedWords: WordState[] = [];
  const sortedWords = [...words].sort((a, b) => b.length - a.length);

  sortedWords.forEach((word, wordIndex) => {
    const placement = tryPlaceWord(grid, word, allowedDirs, size);
    if (placement) {
      const { row, col, dir } = placement;
      const path: Position[] = [];
      const color = TAILWIND_COLORS[wordIndex % TAILWIND_COLORS.length];

      for (let i = 0; i < word.length; i++) {
        const r = row + i * dir.dy;
        const c = col + i * dir.dx;
        grid[r][c] = word[i];
        path.push({ row: r, col: c });
      }

      placedWords.push({
        word,
        isFound: false,
        color,
        path,
      });
    }
  });

  // Fill spaces
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === " ") {
        grid[r][c] = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
      }
    }
  }

  return { grid, wordStates: placedWords };
}

/**
 * Helper to attempt placing a single word, searching for intersection opportunities
 */
function tryPlaceWord(
  grid: string[][],
  word: string,
  allowedDirs: Direction[],
  size: number
): { row: number; col: number; dir: Direction } | null {
  const candidates: { row: number; col: number; dir: Direction; score: number }[] = [];

  // Scrape the grid to find all intersections with already placed letters (crossing search)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // If we find an existing letter that corresponds to a letter in our word, try crossing
      if (grid[r][c] !== " ") {
        const letterIndex = word.indexOf(grid[r][c]);
        if (letterIndex !== -1) {
          // Check if we can start this word such that the intersection lines up
          allowedDirs.forEach(dir => {
            const startRow = r - letterIndex * dir.dy;
            const startCol = c - letterIndex * dir.dx;

            if (isValidPlacement(grid, word, startRow, startCol, dir, size)) {
              // Calculate compatibility score (count matches / crossings)
              const score = calculatePlacementScore(grid, word, startRow, startCol, dir);
              candidates.push({ row: startRow, col: startCol, dir, score });
            }
          });
        }
      }
    }
  }

  // Sort candidates by score descending to maximize crossings
  if (candidates.length > 0) {
    const sortedCandidates = candidates.sort((a, b) => b.score - a.score);
    // Grab the best scoring ones
    const bestScore = sortedCandidates[0].score;
    const topCandidates = sortedCandidates.filter(c => c.score === bestScore);
    return topCandidates[Math.floor(Math.random() * topCandidates.length)];
  }

  // If no visual crossings are possible, fallback to finding any fit randomly
  const randomPositions: { row: number; col: number; dir: Direction }[] = [];
  for (let attempt = 0; attempt < 400; attempt++) {
    const row = Math.floor(Math.random() * size);
    const col = Math.floor(Math.random() * size);
    const dir = allowedDirs[Math.floor(Math.random() * allowedDirs.length)];

    if (isValidPlacement(grid, word, row, col, dir, size)) {
      randomPositions.push({ row, col, dir });
      if (randomPositions.length >= 10) break; // found enough random options
    }
  }

  if (randomPositions.length > 0) {
    return randomPositions[Math.floor(Math.random() * randomPositions.length)];
  }

  return null;
}

/**
 * Checks if a word fits in the given direction and doesn't collide improperly
 */
function isValidPlacement(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  dir: Direction,
  size: number
): boolean {
  // Check bounds of start and end of word
  const endRow = row + (word.length - 1) * dir.dy;
  const endCol = col + (word.length - 1) * dir.dx;

  if (row < 0 || row >= size || col < 0 || col >= size) return false;
  if (endRow < 0 || endRow >= size || endCol < 0 || endCol >= size) return false;

  // Verify there are no collisions
  for (let i = 0; i < word.length; i++) {
    const r = row + i * dir.dy;
    const c = col + i * dir.dx;
    const existing = grid[r][c];

    // Safe if blank or matches current letter we are placing
    if (existing !== " " && existing !== word[i]) {
      return false; // mismatch collision
    }
  }

  return true;
}

/**
 * Calculates how many cross intersections this placement creates
 */
function calculatePlacementScore(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  dir: Direction
): number {
  let score = 0;
  for (let i = 0; i < word.length; i++) {
    const r = row + i * dir.dy;
    const c = col + i * dir.dx;
    if (grid[r][c] === word[i]) {
      score += 15; // Heavy weight to reward matching/crossing letters
    }
  }
  return score;
}
