import React, { useState, useEffect } from "react";
import { GameSettings, GameStats, Difficulty, GameMode, WordState, SavedGameState, MultiplayerState, MultiplayerPlayer } from "./types";
import { generateGrid, getGridSize } from "./utils/gridGenerator";
import { getSampleWords, embeddedThemes, cleanWord, matchOfflineTheme } from "./themesData";
import { AudioSynthesizer } from "./utils/audio";

// Import UI Panels
import MainMenu from "./components/MainMenu";
import GameScreen from "./components/GameScreen";
import SettingsPanel from "./components/SettingsPanel";
import StatsPanel from "./components/StatsPanel";
import AboutPanel from "./components/AboutPanel";
import VictoryScreen from "./components/VictoryScreen";

// Lucide Icons for fallback UI indicators
import { Sparkles, Brain, Loader, Info, AlertCircle, Wifi, WifiOff } from "lucide-react";

// Default States
const DEFAULT_SETTINGS: GameSettings = {
  themeMode: "dark",
  gridTextSize: "medieval",
  soundVolume: 0.5,
  animationsEnabled: true
};

const DEFAULT_STATS: GameStats = {
  played: 0,
  victories: 0,
  totalTimeSec: 0,
  highScore: 0,
  levelsUsed: { facil: 0, medio: 0, dificil: 0 },
  themesUsed: {}
};

export default function App() {
  const [screen, setScreen] = useState<"menu" | "playing" | "victory" | "stats" | "about" | "settings">("menu");
  
  // Game Configuration & Core States
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<GameStats>(DEFAULT_STATS);
  const [hasSavedGame, setHasSavedGame] = useState(false);

  // Active game logic states
  const [activeGrid, setActiveGrid] = useState<string[][]>([]);
  const [activeWords, setActiveWords] = useState<WordState[]>([]);
  const [themeName, setThemeName] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("facil");
  const [isCustom, setIsCustom] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [score, setScore] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [multiplayerState, setMultiplayerState] = useState<MultiplayerState | null>(null);
  const [timingMode, setTimingMode] = useState<"livre" | "temporizado">("livre");
  const [timingType, setTimingType] = useState<"jogada" | "partida">("partida");
  const [timingDuration, setTimingDuration] = useState<number>(60);
  const [infiniteHints, setInfiniteHints] = useState<boolean>(false);
  const [menuConfiguring, setMenuConfiguring] = useState(false);

  // Loading & Fallbacks
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [fallbackActive, setFallbackActive] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // Load configuration and cached stats upon mount
  useEffect(() => {
    // 1. Settings
    const cachedSettings = localStorage.getItem("caca_palavras_settings");
    if (cachedSettings) {
      try {
        const parsed = JSON.parse(cachedSettings) as GameSettings;
        setSettings(parsed);
        AudioSynthesizer.setVolume(parsed.soundVolume);
      } catch (e) {
        console.warn("Failed parsing cached settings, resetting to defaults.");
      }
    } else {
      AudioSynthesizer.setVolume(DEFAULT_SETTINGS.soundVolume);
    }

    // 2. Stats
    const cachedStats = localStorage.getItem("caca_palavras_stats");
    if (cachedStats) {
      try {
        const parsed = JSON.parse(cachedStats) as GameStats;
        // Merge with DEFAULT_STATS in case properties changed/expanded
        setStats({
          ...DEFAULT_STATS,
          ...parsed,
          levelsUsed: { ...DEFAULT_STATS.levelsUsed, ...(parsed.levelsUsed || {}) },
          themesUsed: parsed.themesUsed || {}
        });
      } catch (e) {
        console.warn("Failed parsing cached stats.");
      }
    }

    // 3. Saved Game check
    const savedSession = localStorage.getItem("caca_palavras_session");
    if (savedSession) {
      setHasSavedGame(true);
    }
  }, []);

  // Update Settings
  const handleUpdateSettings = (updated: GameSettings) => {
    setSettings(updated);
    AudioSynthesizer.setVolume(updated.soundVolume);
    localStorage.setItem("caca_palavras_settings", JSON.stringify(updated));
  };

  // Reset Stats
  const handleResetStats = () => {
    setStats(DEFAULT_STATS);
    localStorage.setItem("caca_palavras_stats", JSON.stringify(DEFAULT_STATS));
  };

  // Continue Game
  const handleContinueGame = () => {
    const saved = localStorage.getItem("caca_palavras_session");
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as SavedGameState;
      setActiveGrid(parsed.grid);
      setActiveWords(parsed.words);
      setThemeName(parsed.themeName);
      setDifficulty(parsed.difficulty);
      setIsCustom(parsed.isCustom);
      setTimeElapsed(parsed.timeElapsed);
      setScore(parsed.score);
      setHintsUsed(parsed.hintsUsed);
      setMultiplayerState(parsed.multiplayerState || null);
      setTimingMode(parsed.timingMode || "livre");
      setTimingType(parsed.timingType || "partida");
      setTimingDuration(parsed.timingDuration || 60);
      setInfiniteHints(!!parsed.infiniteHints);

      setScreen("playing");
      AudioSynthesizer.playSelect();
    } catch (err) {
      console.error("Erro ao carregar partida salva. Iniciando nova partida.", err);
      // clean corrupt cache
      localStorage.removeItem("caca_palavras_session");
      setHasSavedGame(false);
    }
  };

  // Start New Game setup routing
  const handleStartNewGame = async (config: {
    difficulty: Difficulty;
    mode: GameMode;
    themeName: string;
    customWords: string[];
    isGroupMode: boolean;
    groupPlayers: string[];
    turnTimeLimit: number;
    timingMode: "livre" | "temporizado";
    timingType: "jogada" | "partida";
    timingDuration: number;
    infiniteHints: boolean;
  }) => {
    setDifficulty(config.difficulty);
    setTimeElapsed(0);
    setScore(0);
    setHintsUsed(0);
    setFallbackActive(false);
    setErrorDetails(null);
    setTimingMode(config.timingMode);
    setTimingType(config.timingType);
    setTimingDuration(config.timingDuration);
    setInfiniteHints(config.infiniteHints);

    // Initialize multiplayer state if selected
    if (config.isGroupMode) {
      setMultiplayerState({
        isGroupMode: true,
        players: config.groupPlayers.map((name, i) => ({
          id: i,
          name: name,
          score: 0
        })),
        currentPlayerIndex: 0,
        timePerTurn: config.turnTimeLimit,
        timeLeft: config.turnTimeLimit
      });
    } else {
      setMultiplayerState(null);
    }

    // Get expected word counts based on level
    let wordCount = 8;
    if (config.difficulty === "medio") wordCount = 15;
    if (config.difficulty === "dificil") wordCount = 25;

    // Increment played statistical counters immediately
    const nextPlayedCount = stats.played + 1;
    const nextLevelsUsed = { ...stats.levelsUsed };
    nextLevelsUsed[config.difficulty] = (nextLevelsUsed[config.difficulty] || 0) + 1;
    const nextStats = { ...stats, played: nextPlayedCount, levelsUsed: nextLevelsUsed };
    setStats(nextStats);
    localStorage.setItem("caca_palavras_stats", JSON.stringify(nextStats));

    // Mode 2: Custom lists
    if (config.mode === "custom") {
      setIsCustom(true);
      setThemeName("Lista Personalizada");
      
      // Shuffle & keep unique custom words
      let finalWords = [...config.customWords].sort(() => 0.5 - Math.random());
      
      if (finalWords.length > wordCount) {
        finalWords = finalWords.slice(0, wordCount);
      } else if (finalWords.length < wordCount) {
        // Need to pad. Gather all words from local themes
        const themesKeys = Object.keys(embeddedThemes);
        const allWordsPool: string[] = [];
        themesKeys.forEach(tKey => {
          allWordsPool.push(...embeddedThemes[tKey]);
        });
        
        // Clean, shuffle and get unique new words that are not already present
        const cleanedPool = Array.from(new Set(allWordsPool.map(w => cleanWord(w))))
          .filter(w => w.length >= 4 && w.length <= 15 && !finalWords.includes(w))
          .sort(() => 0.5 - Math.random());
          
        const needed = wordCount - finalWords.length;
        const paddingWords = cleanedPool.slice(0, needed);
        finalWords = [...finalWords, ...paddingWords];
      }
      
      const result = generateGrid(finalWords, config.difficulty);
      setActiveGrid(result.grid);
      setActiveWords(result.wordStates);
      setScreen("playing");
      AudioSynthesizer.playSelect();
      return;
    }

    // Mode 1: Theme based
    setIsCustom(false);
    const themeUpper = config.themeName.toUpperCase().trim();

    // Check if the theme is native vs custom
    // To match native themes properly, let's normalize keys
    const nativeKeysNorm = Object.keys(embeddedThemes).reduce((acc, key) => {
      const normKey = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
      acc[normKey] = key;
      return acc;
    }, {} as Record<string, string>);

    const matchedNativeKey = nativeKeysNorm[themeUpper];

    if (matchedNativeKey) {
      // Load standard native built-in words totally offline
      const wordsPool = getSampleWords(matchedNativeKey, wordCount);
      setThemeName(matchedNativeKey);
      
      const result = generateGrid(wordsPool, config.difficulty);
      setActiveGrid(result.grid);
      setActiveWords(result.wordStates);
      setScreen("playing");
      AudioSynthesizer.playSelect();
    } else {
      // Find a semantic match from our embedded themes entirely offline!
      const matchedTheme = matchOfflineTheme(config.themeName);
      let wordsPool: string[] = [];
      let finalThemeName = config.themeName;

      if (matchedTheme) {
        wordsPool = getSampleWords(matchedTheme, wordCount);
        finalThemeName = `${config.themeName.toUpperCase()} (${matchedTheme})`;
      } else {
        // Fallback to random theme if nothing has matched
        const themesList = Object.keys(embeddedThemes);
        const randomTheme = themesList[Math.floor(Math.random() * themesList.length)];
        wordsPool = getSampleWords(randomTheme, wordCount);
        finalThemeName = `${config.themeName.toUpperCase()} (${randomTheme})`;
      }

      setThemeName(finalThemeName);
      
      const result = generateGrid(wordsPool, config.difficulty);
      setActiveGrid(result.grid);
      setActiveWords(result.wordStates);
      setScreen("playing");
      AudioSynthesizer.playSelect();
    }
  };

  // Save current active state to cache helper
  const handleSaveActiveGameState = (gameState: {
    grid: string[][];
    words: WordState[];
    timeElapsed: number;
    score: number;
    hintsUsed: number;
    multiplayerState?: MultiplayerState | null;
  }) => {
    const sessionState: SavedGameState = {
      grid: gameState.grid,
      words: gameState.words,
      themeName,
      isCustom,
      difficulty,
      timeElapsed: gameState.timeElapsed,
      score: gameState.score,
      hintsUsed: gameState.hintsUsed,
      maxHints: difficulty === "facil" ? 3 : difficulty === "medio" ? 2 : 1,
      originalWordList: gameState.words.map(w => w.word),
      multiplayerState: gameState.multiplayerState || undefined,
      timingMode,
      timingType,
      timingDuration,
      infiniteHints
    };

    localStorage.setItem("caca_palavras_session", JSON.stringify(sessionState));
    setHasSavedGame(true);
  };

  // Complete Victory Screen trigger
  const handleGameVictory = (summary: {
    score: number;
    timeSec: number;
    wordCount: number;
  }) => {
    // 1. Terminate saved game cache (completed!)
    localStorage.removeItem("caca_palavras_session");
    setHasSavedGame(false);

    // 2. Refresh acumulado statistics
    const nextVictoriesCount = stats.victories + 1;
    const nextTotalTimeSec = stats.totalTimeSec + summary.timeSec;
    const nextHighScore = Math.max(stats.highScore, summary.score);

    // Populate theme ratio stats
    const nextThemesUsed = { ...stats.themesUsed };
    const normTheme = themeName.toUpperCase().trim();
    nextThemesUsed[normTheme] = (nextThemesUsed[normTheme] || 0) + 1;

    const nextStats = {
      ...stats,
      victories: nextVictoriesCount,
      totalTimeSec: nextTotalTimeSec,
      highScore: nextHighScore,
      themesUsed: nextThemesUsed
    };

    setStats(nextStats);
    localStorage.setItem("caca_palavras_stats", JSON.stringify(nextStats));

    // Update screen to victory
    setScore(summary.score);
    setTimeElapsed(summary.timeSec);
    setScreen("victory");
  };

  const handleRestartNewThemeFromVictory = () => {
    setScreen("menu");
    // Directly trigger configuration launch block inside menu
    AudioSynthesizer.playSelect();
  };

  // Screen background layouts based on theme selection
  const themeContainerClass =
    settings.themeMode === "light"
      ? "bg-slate-50 text-slate-900"
      : "bg-slate-950 text-slate-100";

  return (
    <div className={`min-h-screen flex items-center justify-center p-2 sm:p-4 transition-all duration-300 font-sans ${themeContainerClass}`}>
      
      {/* Dynamic Full Screen Loading Backdrop during game loading */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 text-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative flex items-center justify-center mb-6">
            <Loader className="w-16 h-16 text-indigo-500 animate-spin" />
            <Brain className="absolute w-7 h-7 text-indigo-300" />
          </div>
          <h3 className="text-xl font-bold text-white font-display">Carregando Jogo</h3>
          <p className="text-xs text-slate-400 mt-2 max-w-sm">{loadingMsg}</p>
          
          {fallbackActive && (
            <div className="mt-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-semibold max-w-sm animate-pulse flex items-start gap-2 text-left">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <span>Buscando palavras no banco offline ({errorDetails || "Local"}).</span>
                <p className="text-[10px] text-amber-400/80 mt-1 font-normal">
                  Carregando tema do banco offline nativo do e-Spiando Palavras... Carregando palavras do tema!
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Switch routing router wrapper */}
      <main className="w-full h-full flex items-center justify-center py-4">
        {screen === "menu" && (
          <MainMenu
            hasSavedGame={hasSavedGame}
            onContinue={handleContinueGame}
            onNewGame={handleStartNewGame}
            onSwitchScreen={(target) => {
              setMenuConfiguring(false);
              setScreen(target);
              AudioSynthesizer.playSelect();
            }}
            settings={settings}
            initialConfiguring={menuConfiguring}
          />
        )}

        {screen === "playing" && (
          <GameScreen
            grid={activeGrid}
            wordStates={activeWords}
            themeName={themeName}
            difficulty={difficulty}
            isCustom={isCustom}
            timeElapsed={timeElapsed}
            initialScore={score}
            onBack={() => {
              setMenuConfiguring(true);
              setScreen("menu");
              AudioSynthesizer.playSelect();
            }}
            onGameSaved={handleSaveActiveGameState}
            onVictory={handleGameVictory}
            settings={settings}
            multiplayerState={multiplayerState}
            onMultiplayerStateChange={setMultiplayerState}
            timingMode={timingMode}
            timingType={timingType}
            timingDuration={timingDuration}
            infiniteHints={infiniteHints}
          />
        )}

        {screen === "victory" && (
          <VictoryScreen
            score={score}
            timeSec={timeElapsed}
            wordCount={activeWords.length}
            difficulty={difficulty}
            themeName={themeName}
            onPlayAgain={handleRestartNewThemeFromVictory}
            onGoHome={() => {
              setMenuConfiguring(false);
              setScreen("menu");
              AudioSynthesizer.playSelect();
            }}
            players={multiplayerState?.isGroupMode ? multiplayerState.players : undefined}
          />
        )}

        {screen === "settings" && (
          <SettingsPanel
            settings={settings}
            onUpdate={handleUpdateSettings}
            onBack={() => {
              setMenuConfiguring(false);
              setScreen("menu");
              AudioSynthesizer.playSelect();
            }}
          />
        )}

        {screen === "stats" && (
          <StatsPanel
            stats={stats}
            onBack={() => {
              setMenuConfiguring(false);
              setScreen("menu");
              AudioSynthesizer.playSelect();
            }}
            onReset={handleResetStats}
          />
        )}

        {screen === "about" && (
          <AboutPanel
            settings={settings}
            onBack={() => {
              setMenuConfiguring(false);
              setScreen("menu");
              AudioSynthesizer.playSelect();
            }}
          />
        )}
      </main>

    </div>
  );
}
