import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, AlertCircle, Sparkles, Trophy, Lightbulb, RefreshCw, ArrowLeft, Clock, Award, TrendingUp, CheckCircle, Zap, Flame, Flag } from "lucide-react";
import { Difficulty, Position, WordState, GameSettings, MultiplayerState, MultiplayerPlayer } from "../types";
import { AudioSynthesizer } from "../utils/audio";

interface GameScreenProps {
  grid: string[][];
  wordStates: WordState[];
  themeName: string;
  difficulty: Difficulty;
  isCustom: boolean;
  timeElapsed: number;
  initialScore: number;
  onBack: () => void;
  onGameSaved: (state: {
    grid: string[][];
    words: WordState[];
    timeElapsed: number;
    score: number;
    hintsUsed: number;
    multiplayerState?: MultiplayerState | null;
  }) => void;
  onVictory: (summary: {
    score: number;
    timeSec: number;
    wordCount: number;
  }) => void;
  settings: GameSettings;
  multiplayerState: MultiplayerState | null;
  onMultiplayerStateChange: (state: MultiplayerState | null) => void;
  timingMode?: "livre" | "temporizado";
  timingType?: "jogada" | "partida";
  timingDuration?: number;
  infiniteHints?: boolean;
}

export default function GameScreen({
  grid,
  wordStates,
  themeName,
  difficulty,
  isCustom,
  timeElapsed: initialTime,
  initialScore,
  onBack,
  onGameSaved,
  onVictory,
  settings,
  multiplayerState,
  onMultiplayerStateChange,
  timingMode = "livre",
  timingType = "partida",
  timingDuration = 60,
  infiniteHints = false
}: GameScreenProps) {
  const size = grid.length;

  // Active state variables
  const [words, setWords] = useState<WordState[]>(wordStates);
  const [score, setScore] = useState(initialScore);
  const [time, setTime] = useState(initialTime);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hintsUsed, setHintsUsed] = useState(0);
  const maxHints = infiniteHints ? Infinity : (difficulty === "facil" ? 3 : difficulty === "medio" ? 2 : 1);

  // Singleplayer Game Over & Timed countdowns
  const [timeLeftForWord, setTimeLeftForWord] = useState<number>(timingDuration);
  const [singleplayerGameOver, setSingleplayerGameOver] = useState<boolean>(false);

  // Custom modals/flags
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  // Multiplayer turn transition overlays
  const [showTurnTransition, setShowTurnTransition] = useState(false);
  const [wordsMatchedThisTurn, setWordsMatchedThisTurn] = useState<string | null>(null);
  const [lastTurnScorer, setLastTurnScorer] = useState<string | null>(null);
  const [lastTurnPoints, setLastTurnPoints] = useState<number>(0);
  const [passedByTimeout, setPassedByTimeout] = useState(false);

  const isMultiplayer = multiplayerState !== null && multiplayerState.isGroupMode;

  // Selection states
  const [dragStart, setDragStart] = useState<Position | null>(null);
  const [dragCurrent, setDragCurrent] = useState<Position | null>(null);
  const [activePath, setActivePath] = useState<Position[]>([]);
  const isDragging = dragStart !== null;

  // Accessibility/keyboard cursor focus states
  const [kbFocusedCell, setKbFocusedCell] = useState<Position>({ row: 0, col: 0 });
  const [kbSelectionStart, setKbSelectionStart] = useState<Position | null>(null);

  // Hints helper: highlighted coords
  const [hintHighlightedCell, setHintHighlightedCell] = useState<Position | null>(null);
  const [hintCycleIndex, setHintCycleIndex] = useState<number>(0);
  const hintTimeoutRef = useRef<any>(null);

  // Clean up hint timeout on unmount
  useEffect(() => {
    return () => {
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
      }
    };
  }, []);

  // Time tracker effect
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && !singleplayerGameOver) {
      interval = setInterval(() => {
        setTime((prev) => {
          const nextTime = prev + 1;
          // Check match level timeout in single player
          if (timingMode === "temporizado" && timingType === "partida" && !isMultiplayer) {
            if (nextTime >= timingDuration) {
              setSingleplayerGameOver(true);
              setIsPlaying(false);
              AudioSynthesizer.playError();
            }
          }
          return nextTime;
        });

        // Check move level timeout in single player
        if (timingMode === "temporizado" && timingType === "jogada" && !isMultiplayer) {
          setTimeLeftForWord((prev) => {
            const nextLeft = prev - 1;
            if (nextLeft <= 0) {
              setSingleplayerGameOver(true);
              setIsPlaying(false);
              AudioSynthesizer.playError();
              return 0;
            }
            return nextLeft;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, timingMode, timingType, timingDuration, isMultiplayer, singleplayerGameOver]);

  // Handle local multiplayer turn counter decrements
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && multiplayerState && multiplayerState.isGroupMode) {
      interval = setInterval(() => {
        const currentActive = multiplayerState;
        const newTimeLeft = currentActive.timeLeft - 1;
        
        if (newTimeLeft <= 0) {
          // Turn time limit expired! Show beautiful non-blocking overlay to transfer turn
          setIsPlaying(false);
          AudioSynthesizer.playError();
          
          setWordsMatchedThisTurn(null);
          setLastTurnScorer(currentActive.players[currentActive.currentPlayerIndex]?.name || "");
          setPassedByTimeout(true);
          setShowTurnTransition(true);

          const nextIndex = (currentActive.currentPlayerIndex + 1) % currentActive.players.length;
          onMultiplayerStateChange({
            ...currentActive,
            currentPlayerIndex: nextIndex,
            timeLeft: currentActive.timePerTurn
          });
        } else {
          onMultiplayerStateChange({
            ...currentActive,
            timeLeft: newTimeLeft
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, multiplayerState?.timeLeft, multiplayerState?.currentPlayerIndex, multiplayerState?.isGroupMode]);

  // Keep progress state saved automatically to backend/localStorage whenever changes occur
  useEffect(() => {
    onGameSaved({
      grid,
      words,
      timeElapsed: time,
      score,
      hintsUsed,
      multiplayerState: multiplayerState
    });
  }, [words, time, score, hintsUsed, multiplayerState]);

  // Handle straight line calculations
  const calculatePath = (start: Position, end: Position): Position[] => {
    const dr = end.row - start.row;
    const dc = end.col - start.col;
    
    const stepR = dr === 0 ? 0 : dr > 0 ? 1 : -1;
    const stepC = dc === 0 ? 0 : dc > 0 ? 1 : -1;

    const isHorizontal = dr === 0;
    const isVertical = dc === 0;
    const isDiagonal = Math.abs(dr) === Math.abs(dc);

    // Filter allowed directions based on difficulty
    if (difficulty === "facil") {
      // Fácil only allows → (horizontal right) and ↓ (vertical down)
      const isRight = dr === 0 && dc > 0;
      const isDown = dc === 0 && dr > 0;
      if (!isRight && !isDown) return [];
    } else {
      if (!isHorizontal && !isVertical && !isDiagonal) return [];
    }

    const pathList: Position[] = [];
    let r = start.row;
    let c = start.col;
    
    const steps = Math.max(Math.abs(dr), Math.abs(dc));
    for (let i = 0; i <= steps; i++) {
      pathList.push({ row: r, col: c });
      r += stepR;
      c += stepC;
    }
    return pathList;
  };

  // Convert mouse actions to grid coordinates
  const getCellFromEvent = (e: React.MouseEvent | React.TouchEvent): Position | null => {
    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const ele = document.elementFromPoint(clientX, clientY);
    if (!ele) return null;

    const rowAttr = ele.getAttribute("data-row");
    const colAttr = ele.getAttribute("data-col");

    if (rowAttr !== null && colAttr !== null) {
      return { row: parseInt(rowAttr), col: parseInt(colAttr) };
    }
    return null;
  };

  // Drag Handlers
  const handleDragStart = (pos: Position) => {
    if (!isPlaying) return;
    setDragStart(pos);
    setDragCurrent(pos);
    setActivePath([pos]);
    AudioSynthesizer.playSelect();

    // Clear hint highlighted cell when player starts interacting
    if (hintHighlightedCell) {
      setHintHighlightedCell(null);
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
        hintTimeoutRef.current = null;
      }
    }
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !isPlaying) return;
    
    // Evitar scroll nativo da página apenas enquanto o jogador realiza a seleção na matriz
    if (e.cancelable) {
      e.preventDefault();
    }

    const cell = getCellFromEvent(e);
    if (cell) {
      if (!dragCurrent || dragCurrent.row !== cell.row || dragCurrent.col !== cell.col) {
        setDragCurrent(cell);
        const path = calculatePath(dragStart, cell);
        setActivePath(path.length > 0 ? path : [dragStart]);
      }
    }
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    validateSelection(activePath);
    setDragStart(null);
    setDragCurrent(null);
    setActivePath([]);
  };

  // Validate the selected character string
  const validateSelection = (path: Position[]) => {
    if (path.length < 4) {
      // too short
      return;
    }

    // Accumulate letters
    const wordStr = path.map(pos => grid[pos.row][pos.col]).join("");
    const revStr = [...wordStr].reverse().join("");

    // Look for a clean match in the wordlist
    const wordIndex = words.findIndex(
      w => !w.isFound && (w.word === wordStr || w.word === revStr)
    );

    if (wordIndex !== -1) {
      const matched = words[wordIndex];
      // Mark word as found and store its coordinates path
      const nextWords = [...words];
      nextWords[wordIndex] = {
        ...matched,
        isFound: true,
        path: path
      };
      
      setWords(nextWords);
      
      // Reset word countdown timer for singleplayer timed by-move mode
      if (timingMode === "temporizado" && timingType === "jogada" && !isMultiplayer) {
        setTimeLeftForWord(timingDuration);
      }
      
      // Calculate score points (Multiplier: Facil=15, Medio=30, Dificil=50)
      const diffMult = difficulty === "facil" ? 150 : difficulty === "medio" ? 300 : 500;
      // Time bonus: quickly solved yields more points
      const speedBonus = Math.max(50, 1000 - Math.floor(time / words.length));
      const turnEarnedPoints = diffMult + speedBonus;
      const newScore = score + turnEarnedPoints;
      setScore(newScore);

      let updatedPlayers = multiplayerState?.players || [];
      if (isMultiplayer && multiplayerState) {
        // Increment score of active player
        updatedPlayers = multiplayerState.players.map((p, idx) => {
          if (idx === multiplayerState.currentPlayerIndex) {
            return { ...p, score: p.score + turnEarnedPoints };
          }
          return p;
        });
      }

      AudioSynthesizer.playSuccess();

      // Check win condition
      const won = nextWords.every(w => w.isFound);
      if (won) {
        setIsPlaying(false);
        AudioSynthesizer.playWin();
        if (isMultiplayer && multiplayerState) {
          onMultiplayerStateChange({
            ...multiplayerState,
            players: updatedPlayers
          });
        }
        // Give time for visual confetti and highlight
        setTimeout(() => {
          onVictory({
            score: newScore,
            timeSec: time,
            wordCount: words.length
          });
        }, 1500);
      } else if (isMultiplayer && multiplayerState) {
        // If not won yet, trigger transition to next player!
        const nextIndex = (multiplayerState.currentPlayerIndex + 1) % multiplayerState.players.length;
        
        // Delay the transition overlay slightly so the user sees the found highlights first
        setTimeout(() => {
          setIsPlaying(false);
          setWordsMatchedThisTurn(matched.word);
          setLastTurnScorer(multiplayerState.players[multiplayerState.currentPlayerIndex]?.name || "");
          setLastTurnPoints(turnEarnedPoints);
          setPassedByTimeout(false);
          setShowTurnTransition(true);

          onMultiplayerStateChange({
            ...multiplayerState,
            players: updatedPlayers,
            currentPlayerIndex: nextIndex,
            timeLeft: multiplayerState.timePerTurn
          });
        }, 1000);
      }
    } else {
      AudioSynthesizer.playError();
    }
  };

  // Keyboard navigation interaction
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isPlaying) return;
    let { row, col } = kbFocusedCell;

    switch (e.key) {
      case "ArrowUp":
        row = Math.max(0, row - 1);
        break;
      case "ArrowDown":
        row = Math.min(size - 1, row + 1);
        break;
      case "ArrowLeft":
        col = Math.max(0, col - 1);
        break;
      case "ArrowRight":
        col = Math.min(size - 1, col + 1);
        break;
      case " ":
      case "Enter":
        e.preventDefault();
        if (kbSelectionStart === null) {
          // Start keyboard selection trail
          setKbSelectionStart({ row, col });
          setActivePath([{ row, col }]);
          AudioSynthesizer.playSelect();

          // Clear hint highlighted cell when player starts interacting
          if (hintHighlightedCell) {
            setHintHighlightedCell(null);
            if (hintTimeoutRef.current) {
              clearTimeout(hintTimeoutRef.current);
              hintTimeoutRef.current = null;
            }
          }
        } else {
          // Confirm keyboard selection trail
          const path = calculatePath(kbSelectionStart, { row, col });
          validateSelection(path.length > 0 ? path : [kbSelectionStart]);
          setKbSelectionStart(null);
          setActivePath([]);
        }
        break;
      case "Escape":
        setKbSelectionStart(null);
        setActivePath([]);
        break;
      default:
        return;
    }

    setKbFocusedCell({ row, col });

    // If typing/selecting with keyboard trail active, refresh highlight
    if (kbSelectionStart !== null) {
      const path = calculatePath(kbSelectionStart, { row, col });
      setActivePath(path.length > 0 ? path : [kbSelectionStart]);
    }
  };

  // Dicas system (Hints helper)
  const handleTriggerHint = () => {
    if (hintsUsed >= maxHints || !isPlaying) return;

    // Find all unsolved words
    const unsolvedWords = words.filter(w => !w.isFound);
    if (unsolvedWords.length > 0) {
      // Clear any pending timeout first
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
      }

      // Pick the unsolved word based on hintCycleIndex
      const unsolvedWord = unsolvedWords[hintCycleIndex % unsolvedWords.length];

      if (unsolvedWord && unsolvedWord.path.length > 0) {
        // Encontra a primeira letra da palavra não encontrada que ainda não faz parte de nenhuma palavra solucionada.
        // Isso evita dar uma dica sobre uma casa que o jogador já solucionou através de outro cruzamento de palavras.
        let targetCell = unsolvedWord.path.find(pos => {
          return !words.some(w => w.isFound && w.path.some(p => p.row === pos.row && p.col === pos.col));
        });

        // Caso todas as letras da palavra estejam cobertas por cruzamentos solucionados (cenário raro),
        // usamos a primeira letra como padrão de segurança.
        if (!targetCell) {
          targetCell = unsolvedWord.path[0];
        }

        setHintHighlightedCell(targetCell);
        setHintsUsed(p => p + 1);
        setHintCycleIndex(p => p + 1);
        AudioSynthesizer.playHint();

        // Clear highlight after 10 seconds (or until user interacts/clicks)
        hintTimeoutRef.current = setTimeout(() => {
          setHintHighlightedCell(null);
          hintTimeoutRef.current = null;
        }, 10000);
      }
    }
  };

  // Helper to check if cell is highlighted as found
  const getFoundCellColor = (r: number, c: number): string | null => {
    for (const w of words) {
      if (w.isFound) {
        const hasCell = w.path.some(p => p.row === r && p.col === c);
        if (hasCell) return w.color;
      }
    }
    return null;
  };

  // Calculate overall metrics
  const foundCount = words.filter(w => w.isFound).length;
  const progressPercent = Math.round((foundCount / words.length) * 100);

  // Sizing scaling classes
  const fontClass =
    settings.gridTextSize === "pequeno"
      ? "text-[10px] md:text-xs"
      : settings.gridTextSize === "grande"
      ? "text-base md:text-xl font-bold"
      : "text-xs md:text-base font-semibold"; // medieval

  // Format displayed time depending on single/multiplayer and timing style
  const displaySec = (isMultiplayer && multiplayerState)
    ? multiplayerState.timeLeft
    : (timingMode === "temporizado"
      ? (timingType === "partida" ? Math.max(0, timingDuration - time) : timeLeftForWord)
      : time);

  const formattedTime = `${Math.floor(displaySec / 60).toString().padStart(2, "0")}:${(displaySec % 60).toString().padStart(2, "0")}`;

  return (
    <div className="w-full max-w-6xl mx-auto px-2 md:px-6 py-4 flex flex-col gap-4 select-none font-sans" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* 🚀 Cabeçalho HUD Consolidado e Ultra Compacto de Linha Única */}
      <div className="w-full max-w-[500px] mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-2.5 md:px-4 md:py-3 shadow-md flex flex-wrap items-center justify-between gap-2.5 animate-fade-in text-xs font-bold text-slate-800 dark:text-slate-100">
        
        {/* Lado Esquerdo: Voltar */}
        <div className="flex items-center gap-2 md:gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => {
              AudioSynthesizer.playSelect();
              onBack();
            }}
            className="py-1 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 transition-all cursor-pointer shadow-xs flex items-center gap-1 font-bold text-xs"
            title="Voltar ao Menu"
            id="back_button_triggered"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-900 dark:text-slate-100" />
            <span className="hidden sm:inline">Voltar</span>
          </button>
        </div>

        {/* Lado Direito: Todos os elementos em formato de ícones compactos */}
        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap font-mono">
          
          {/* Temporizador */}
          <div 
            className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950/45 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px]" 
            title={timingMode === "temporizado" ? "Tempo Restante" : "Tempo Decorrido"}
          >
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>{formattedTime}</span>
          </div>

          {/* Pontuação */}
          <div 
            className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950/45 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px]" 
            title="Sua Pontuação"
          >
            <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-amber-600 dark:text-amber-400">{score}p</span>
          </div>

          {/* Resolvidas */}
          <div 
            className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950/45 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px]"
            title="Palavras Resolvidas"
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="text-emerald-600 dark:text-emerald-400">{foundCount}/{words.length}</span>
          </div>

          {/* Placar do Jogo (Multiplayer inline) */}
          {isMultiplayer && multiplayerState && (
            <div 
              className="flex items-center gap-1 bg-indigo-50/55 dark:bg-indigo-950/20 px-1.5 py-1 rounded-xl border border-indigo-100 dark:border-indigo-900/40 max-w-[100px] sm:max-w-[140px] md:max-w-[200px]"
              title="Placar de Jogadores"
            >
              <Trophy className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <div className="flex gap-1 overflow-x-auto no-scrollbar py-0.5">
                {multiplayerState.players.map((p, idx) => {
                  const isActive = idx === multiplayerState.currentPlayerIndex;
                  return (
                     <span 
                      key={p.id} 
                      className={`px-1 py-0.5 rounded text-[9px] font-sans flex items-center gap-0.5 leading-none shrink-0 border ${
                        isActive 
                          ? "bg-indigo-600 text-white border-indigo-500 font-black shadow-xs" 
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"
                      }`}
                      title={`${p.name}: ${p.score}p${isActive ? " (Sua vez)" : ""}`}
                    >
                      {isActive && <span className="animate-pulse">👉</span>}
                      <span className="truncate max-w-[35px] font-bold">{p.name}</span>
                      <span className="font-mono font-black">{p.score}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modo de jogo */}
          <span className="text-[10px] uppercase font-black px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 tracking-wider shrink-0" title="Modo de Jogo">
            {timingMode === "temporizado" ? (timingType === "partida" ? "⏱️ Pt" : "⏳ Jg") : "🌟 Lv"}
          </span>

          {/* Botão Desistir */}
          <button
            onClick={() => {
              AudioSynthesizer.playSelect();
              setIsPlaying(false);
              setShowQuitConfirm(true);
            }}
            className="p-1.5 rounded-xl transition-all border cursor-pointer shrink-0 bg-rose-600 hover:bg-rose-700 border-rose-500 text-white shadow-sm hover:shadow active:scale-95 flex items-center justify-center dark:bg-rose-700 dark:hover:bg-rose-600 dark:border-rose-600"
            title="Desistir da Partida"
            id="desistir_button"
          >
            <Flag className="w-3.5 h-3.5 text-white fill-white" />
          </button>

          {/* Controle de Pausa */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-1.5 rounded-xl transition-all border cursor-pointer shrink-0 ${
              isPlaying
                ? "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                : "bg-blue-600 hover:bg-blue-700 border-blue-500 text-white animate-pulse shadow-sm"
            }`}
            title={isPlaying ? "Pausar" : "Continuar"}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white text-white" />}
          </button>

        </div>

      </div>

      {/* Main Grid and lower layout stacked vertically at all times */}
      <div className="w-full max-w-[500px] mx-auto flex flex-col gap-5 animate-fade-in mb-8">
        
        {/* Play stage container */}
        <div className="w-full flex justify-center">
          <div className="relative w-full select-none bg-slate-50 dark:bg-slate-900/40 p-3 md:p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg">
            
            {/* Interactive Hint Banner with Lightbulb above the matrix */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2.5 mb-3.5 shadow-xs select-none">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Lightbulb
                    className={`w-6 h-6 transition-all duration-300 ${
                      (maxHints - hintsUsed) > 0
                        ? "text-amber-500 fill-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse"
                        : "text-slate-400 dark:text-slate-500 fill-none"
                    }`}
                  />
                  {(maxHints - hintsUsed) > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                  )}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] uppercase font-black tracking-widest text-slate-600 dark:text-slate-300">
                    Dica Disponível
                  </span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {maxHints === Infinity
                      ? "Dicas Infinitas (∞)"
                      : ((maxHints - hintsUsed) > 0
                        ? `${maxHints - hintsUsed} ${maxHints - hintsUsed === 1 ? "dica" : "dicas"}`
                        : "Nenhuma dica")}
                  </span>
                </div>
              </div>

              <button
                onClick={handleTriggerHint}
                disabled={hintsUsed >= maxHints || !isPlaying}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs select-none transition-all active:scale-95 flex items-center gap-1 cursor-pointer border ${
                  hintsUsed >= maxHints || !isPlaying
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-transparent opacity-50 cursor-not-allowed"
                    : "bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30 shadow-sm"
                }`}
              >
                <span>Usar Dica</span>
              </button>
            </div>

            {/* Play area grid */}
            <div
              className="grid gap-1 cell-aspect-square outline-none touch-none"
              style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
              onMouseLeave={handleDragEnd}
              onMouseUp={handleDragEnd}
              onMouseMove={(e) => handleDragMove(e)}
              onTouchMove={(e) => handleDragMove(e)}
              onTouchEnd={handleDragEnd}
            >
              {grid.map((rowArr, rowIndex) =>
                rowArr.map((char, colIndex) => {
                  const isSelectTrail = activePath.some(
                     (p) => p.row === rowIndex && p.col === colIndex
                  );
                  const foundColor = getFoundCellColor(rowIndex, colIndex);
                  
                  // Keyboard outlined focus indicator
                  const isKbFocused = kbFocusedCell.row === rowIndex && kbFocusedCell.col === colIndex;
                  const isKbMarking = kbSelectionStart !== null && kbSelectionStart.row === rowIndex && kbSelectionStart.col === colIndex;

                  // Hints glow
                  const isHinted = hintHighlightedCell?.row === rowIndex && hintHighlightedCell?.col === colIndex;

                  // Cell Styling
                  let styleClasses = "cell-aspect-square flex items-center justify-center font-mono rounded-lg cursor-pointer transition-all border select-none ";
                  
                  if (isSelectTrail) {
                    styleClasses += "bg-blue-600 text-white border-blue-500 scale-[0.96] shadow-md shadow-blue-600/30 font-extrabold z-10 ";
                  } else if (isHinted) {
                    styleClasses += "bg-amber-100 dark:bg-amber-950/80 text-amber-950 dark:text-amber-100 border-4 border-amber-500 dark:border-amber-400 font-extrabold scale-110 shadow-lg shadow-amber-500/50 animate-pulse z-10 ";
                  } else if (foundColor) {
                    styleClasses += `${foundColor} border-transparent font-black `;
                  } else {
                    styleClasses += "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs ";
                  }

                  // Additional accessibility marks
                  if (isKbFocused) {
                    styleClasses += "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900 z-10 ";
                  }
                  if (isKbMarking) {
                    styleClasses += "ring-2 ring-rose-500 ring-offset-2 dark:ring-offset-slate-900 z-10 ";
                  }

                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      data-row={rowIndex}
                      data-col={colIndex}
                      onMouseDown={() => handleDragStart({ row: rowIndex, col: colIndex })}
                      onTouchStart={() => handleDragStart({ row: rowIndex, col: colIndex })}
                      className={`${styleClasses} ${fontClass}`}
                      title={`Linha ${rowIndex + 1}, Coluna ${colIndex + 1}`}
                      role="gridcell"
                    >
                      {char}
                    </div>
                  );
                })
              )}
            </div>

            {/* PAUSE OVERLAY MASK */}
            {!isPlaying && (
              <div className="absolute inset-0 bg-white/95 dark:bg-slate-950/95 rounded-3xl backdrop-blur-md flex flex-col items-center justify-center text-center p-4 z-20">
                <Pause className="w-12 h-12 text-blue-600 dark:text-blue-500 animate-pulse mb-3" />
                <h3 className="text-xl font-bold text-slate-800 dark:text-white font-display">Partida Pausada</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
                  Os caracteres da grade foram ocultados por motivos de integridade para evitar trapaças. Clique continuar para retomar!
                </p>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => {
                      AudioSynthesizer.playSelect();
                      setIsPlaying(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white text-white" /> Continuar Jogo
                  </button>
                   <button
                    onClick={() => {
                      AudioSynthesizer.playSelect();
                      onBack();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-800"
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-900 dark:text-slate-100" /> Voltar ao Menu
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Word List Card - Single space-saving box with flowing inline word badges */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 text-slate-800 dark:text-slate-100 flex flex-col shadow-md w-full animate-fade-in gap-2.5">
          <div className="flex flex-wrap gap-2.5 items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
            {/* 1. TEMA */}
            <div className="flex items-center gap-1.5 text-xs text-white bg-blue-600 dark:bg-blue-500 px-3 py-1 rounded-xl font-extrabold capitalize shadow-sm">
              <span className="text-[9px] uppercase font-black tracking-widest text-blue-100 dark:text-slate-950 opacity-90">Tema:</span>
              <span className="font-black text-white dark:text-slate-950">{themeName.toLowerCase()}</span>
            </div>

            {/* 2. "PALAVRAS PARA ENCONTRAR" */}
            <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-slate-50 flex items-center gap-1.5">
              📌 Palavras para Encontrar
            </span>

            {/* 3. quantidade para encontrar/resolvidas */}
            <span className="text-xs bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 px-3 py-1 rounded-xl font-black font-mono border border-slate-700 dark:border-slate-200 shadow-sm">
              {foundCount}/{words.length} resolvidas
            </span>

            {/* 4. NÍVEL (representado por ícone com alto contraste) */}
            <div className="flex items-center gap-1.5 font-bold text-xs" title={`Nível: ${difficulty}`}>
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-600 dark:text-slate-400">Nível:</span>
              {difficulty === "facil" ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-black shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-white fill-emerald-300/30" />
                  <span>Fácil</span>
                </span>
              ) : difficulty === "medio" ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-black shadow-sm">
                  <Zap className="w-3.5 h-3.5 text-slate-950 fill-amber-300/30" />
                  <span>Médio</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-600 text-white font-black shadow-sm">
                  <Flame className="w-3.5 h-3.5 text-white fill-rose-300/30" />
                  <span>Difícil</span>
                </span>
              )}
            </div>
          </div>

          {/* Word list single box content wrapper */}
          <div className="w-full bg-slate-50 dark:bg-slate-950/25 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-3 max-h-[160px] overflow-y-auto no-scrollbar flex flex-wrap gap-1.5 font-sans">
            {words.map((w, index) => (
              <span
                key={index}
                className={`px-2.5 py-1 text-xs font-mono font-bold uppercase rounded-lg border transition-all inline-flex items-center gap-1.5 shadow-xs ${
                  w.isFound
                    ? "bg-emerald-50 dark:bg-emerald-950/25 border-emerald-200/55 dark:border-emerald-950/20 text-emerald-600 dark:text-emerald-400 line-through opacity-70"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-205 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <span>{w.word}</span>
                <span className="text-[10px] text-slate-400">
                  {w.isFound ? "✓" : "•"}
                </span>
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* QUIT REAL-TIME CONFIRM OVERLAY DIALOG */}
      {showQuitConfirm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto animate-bounce mb-3" />
            <h3 className="text-lg font-black text-slate-800 dark:text-white font-display">Desistir do Jogo?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Você tem certeza que deseja desistir? Você retornará para o menu de seleção de jogo, ou se preferir, pode continuar a partida de onde parou.
            </p>
            <div className="flex gap-2.5 mt-5">
               <button
                onClick={() => {
                  setShowQuitConfirm(false);
                  setIsPlaying(true);
                  AudioSynthesizer.playSelect();
                }}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 transition-all cursor-pointer border border-slate-200 dark:border-slate-800"
              >
                Continuar
              </button>
              <button
                onClick={() => {
                  setShowQuitConfirm(false);
                  onBack();
                  AudioSynthesizer.playSelect();
                }}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer shadow-md border border-rose-500"
              >
                Desistir e Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MULTIPLAYER TURN TRANSITION OVERLAY */}
      {showTurnTransition && multiplayerState && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border-2 border-blue-500 rounded-3xl p-6 max-w-md w-full shadow-2xl text-center scale-[1.01] transition-all">
            <div className="inline-flex p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full mb-3.5 shadow-sm">
              <RefreshCw className="w-10 h-10 animate-spin-slow" />
            </div>

            {passedByTimeout ? (
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black tracking-widest text-rose-700 bg-rose-100 dark:text-rose-300 dark:bg-rose-950/45 px-2.5 py-0.5 rounded">Tempo Esgotado!</span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white pt-2">Vez de {lastTurnScorer} encerrou!</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto pt-1 leading-relaxed">
                  Os segundos se esgotaram e nenhuma palavra foi encontrada nesta rodada.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-amber-500">
                  <Sparkles className="w-5 h-5 fill-amber-500 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-wider">Palavra Encontrada!</span>
                  <Sparkles className="w-5 h-5 fill-amber-500 animate-pulse" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white pt-2">
                  Muito bem, {lastTurnScorer}!
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 pt-1.5 leading-relaxed">
                  Encontrou a palavra <strong className="uppercase text-blue-600 dark:text-blue-400 font-mono">"{wordsMatchedThisTurn}"</strong> e ganhou <strong className="text-blue-600 dark:text-blue-400 font-mono">+{lastTurnPoints} pontos</strong>!
                </p>
              </div>
            )}

            {/* Next Player Callout */}
            <div className="my-5 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-center items-center">
              <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest block">PRÓXIMO DE JOGAR</span>
              <span className="text-xl font-black text-blue-600 dark:text-blue-400 capitalize mt-1.5 font-display">
                👉 {multiplayerState.players[multiplayerState.currentPlayerIndex]?.name}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight block mt-1">
                Você terá {multiplayerState.timePerTurn} segundos nesta jogada!
              </span>
            </div>

            <button
              onClick={() => {
                setShowTurnTransition(false);
                setIsPlaying(true);
                AudioSynthesizer.playSelect();
              }}
              className="w-full py-3.5 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-blue-500"
            >
              <Play className="w-4 h-4 fill-white text-white" /> Iniciar Minha Vez
            </button>
          </div>
        </div>
      )}

      {/* SINGLE PLAYER TIMEOUT GAME OVER OVERLAY */}
      {singleplayerGameOver && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-sm w-full text-center shadow-2xl border-t-8 border-t-rose-600 dark:border-t-rose-500 animate-scale-up">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100 dark:border-rose-900/45">
              <Clock className="w-8 h-8 animate-pulse text-rose-600" />
            </div>
            
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">Tempo Esgotado!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed">
              Infelizmente, o seu tempo se esgotou antes de decifrar todas as palavras!
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 my-4 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-500 dark:text-slate-400">Palavras Encontradas:</span>
              <span className="font-mono font-black text-rose-600 dark:text-rose-400">{foundCount} de {words.length}</span>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setSingleplayerGameOver(false);
                  setTime(0);
                  setTimeLeftForWord(timingDuration);
                  setWords(words.map(w => ({ ...w, isFound: false, path: [] })));
                  setIsPlaying(true);
                  AudioSynthesizer.playSelect();
                }}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                Tentar Novamente
              </button>
              <button
                onClick={() => {
                  AudioSynthesizer.playSelect();
                  onBack();
                }}
                className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold text-sm transition-all cursor-pointer border border-slate-200 dark:border-slate-800"
              >
                Voltar ao Menu Principal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
