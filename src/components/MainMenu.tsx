import React, { useState, useEffect } from "react";
import { Gamepad2, Settings, BarChart3, HelpCircle, Palette, CheckCircle, Brain, Sparkles, Wifi, WifiOff, FileText, ArrowRight, Play } from "lucide-react";
import { Difficulty, GameMode, GameSettings } from "../types";
import { cleanWord } from "../themesData";

interface MainMenuProps {
  hasSavedGame: boolean;
  onContinue: () => void;
  onNewGame: (config: {
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
  }) => void;
  onSwitchScreen: (screen: "stats" | "about" | "settings") => void;
  settings: GameSettings;
  initialConfiguring?: boolean;
}

const DEFAULT_THEMES = [
  "ANIMAIS", "FRUTAS", "PAÍSES", "PROFISSÕES", "TECNOLOGIA", 
  "ESPORTES", "MÚSICA", "FILMES", "CIÊNCIAS", "VEÍCULOS"
];

export default function MainMenu({
  hasSavedGame,
  onContinue,
  onNewGame,
  onSwitchScreen,
  settings,
  initialConfiguring
}: MainMenuProps) {
  const [isConfiguring, setIsConfiguring] = useState(initialConfiguring ?? false);

  useEffect(() => {
    if (initialConfiguring !== undefined) {
      setIsConfiguring(initialConfiguring);
    }
  }, [initialConfiguring]);
  const [difficulty, setDifficulty] = useState<Difficulty>("facil");
  const [mode, setMode] = useState<GameMode>("theme");
  
  // Theme state
  const [selectedTheme, setSelectedTheme] = useState("ANIMAIS");
  const [customThemeText, setCustomThemeText] = useState("");
  const [isCustomThemeSelected, setIsCustomThemeSelected] = useState(false);

  // Custom wordlist state
  const [rawWordListText, setRawWordListText] = useState("");

  // Group Mode States
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [numPlayers, setNumPlayers] = useState(2);
  const [playerNames, setPlayerNames] = useState<string[]>(["Jogador 1", "Jogador 2"]);
  const [turnTimeLimit, setTurnTimeLimit] = useState(30); // in seconds

  // Game Timing States
  const [timingMode, setTimingMode] = useState<"livre" | "temporizado">("livre");
  const [timingType, setTimingType] = useState<"jogada" | "partida">("partida");
  const [selectedDurationOption, setSelectedDurationOption] = useState<string>("60");
  const [customDuration, setCustomDuration] = useState<number>(60);
  const [infiniteHints, setInfiniteHints] = useState<boolean>(false);

  // Online connectivity detection
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    setPlayerNames((prev) => {
      const updated = [...prev];
      if (updated.length < numPlayers) {
        for (let i = updated.length; i < numPlayers; i++) {
          updated.push(`Jogador ${i + 1}`);
        }
      } else if (updated.length > numPlayers) {
        updated.splice(numPlayers);
      }
      return updated;
    });
  }, [numPlayers]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Form submit generator
  const handleLaunchGame = () => {
    let finalThemeName = "";
    let finalCustomWords: string[] = [];

    if (mode === "theme") {
      if (isCustomThemeSelected) {
        finalThemeName = customThemeText.trim() || "Tema Aleatório";
      } else {
        finalThemeName = selectedTheme;
      }
    } else {
      // Custom list. Split, clean and extract words
      finalThemeName = "Lista Personalizada";
      // Split by space, commas, or newline
      const tokens = rawWordListText.split(/[\s,;\n]+/);
      const cleaned = tokens
        .map(t => cleanWord(t))
        .filter(t => t.length >= 4 && t.length <= 15);
      
      // Deduplicate
      finalCustomWords = Array.from(new Set(cleaned));

      if (finalCustomWords.length < 3) {
        alert("Por favor, digite pelo menos 3 palavras válidas (entre 4 e 15 letras, sem acentos ou números).");
        return;
      }
    }

    let finalTimingDuration = 60;
    if (timingMode === "temporizado") {
      if (selectedDurationOption === "personalizado") {
        finalTimingDuration = Math.max(10, Math.min(600, customDuration));
      } else {
        finalTimingDuration = parseInt(selectedDurationOption, 10) || 60;
      }
    }

    onNewGame({
      difficulty,
      mode,
      themeName: finalThemeName,
      customWords: finalCustomWords,
      isGroupMode,
      groupPlayers: playerNames.map((n, idx) => n.trim() || `Jogador ${idx + 1}`),
      turnTimeLimit,
      timingMode,
      timingType,
      timingDuration: finalTimingDuration,
      infiniteHints
    });
  };

  return (
    <div className="w-full max-w-xl mx-auto p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl rounded-3xl animate-fade-in text-slate-800 dark:text-slate-100 font-sans border-t-[6px] border-t-blue-600 dark:border-t-blue-500">
      
      {/* Header section */}
      <header className="text-center py-4 mb-4">
        <div className="inline-flex p-3.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl mb-3 shadow-inner">
          <Gamepad2 className="w-12 h-12 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-display tracking-tight text-slate-800 dark:text-white select-none">
          E-Spiando <span className="text-blue-600 dark:text-blue-400">Palavras</span>
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
          Crie infinitos quebra-cabeças sob medida! Divirta-se jogando totalmente de forma estática offline e com temas integrados.
        </p>

        {/* Connectivity badge */}
        <div className="inline-flex items-center gap-1.5 mt-4 px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">Modo 100% Offline e Estático Ativo</span>
        </div>
      </header>

      {/* Primary List of Menu Options */}
      {!isConfiguring ? (
        <div className="space-y-3 mt-4">
          
          {/* Continue game */}
          {hasSavedGame && (
            <button
              onClick={onContinue}
              className="w-full relative group overflow-hidden p-4 rounded-xl border border-blue-200 dark:border-blue-500/40 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30 text-blue-700 dark:text-blue-300 transition-all cursor-pointer font-bold shadow-sm text-sm flex items-center justify-between"
            >
              <span className="flex items-center gap-2.5">
                <Play className="w-5 h-5 fill-blue-600 dark:fill-blue-400 text-blue-600 dark:text-blue-400 animate-pulse" /> Continuar Partida
              </span>
              <span className="text-[10px] font-black uppercase bg-blue-100 dark:bg-blue-500/20 px-2 py-0.5 rounded text-blue-700 dark:text-blue-300">Em curso</span>
            </button>
          )}

          {/* New Game Trigger */}
          <button
            onClick={() => setIsConfiguring(true)}
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 bg-slate-50 dark:bg-slate-800/40 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-white transition-all cursor-pointer font-bold flex items-center justify-between select-none"
          >
            <span className="flex items-center gap-2.5">
              <Gamepad2 className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Novo Jogo
            </span>
            <ArrowRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>

          {/* Stats Button */}
          <button
            onClick={() => onSwitchScreen("stats")}
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 bg-slate-50 dark:bg-slate-800/40 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-white transition-all cursor-pointer flex items-center justify-between font-bold select-none"
          >
            <span className="flex items-center gap-2.5">
              <BarChart3 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" /> Estatísticas locais
            </span>
            <ArrowRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>

          {/* Settings Button */}
          <button
            onClick={() => onSwitchScreen("settings")}
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 bg-slate-50 dark:bg-slate-800/40 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-white transition-all cursor-pointer flex items-center justify-between font-bold select-none"
          >
            <span className="flex items-center gap-2.5">
              <Settings className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> Ajustes e Preferências
            </span>
            <ArrowRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>

          {/* About Game Button */}
          <button
            onClick={() => onSwitchScreen("about")}
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 bg-slate-50 dark:bg-slate-800/40 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-white transition-all cursor-pointer flex items-center justify-between font-bold select-none"
          >
            <span className="flex items-center gap-2.5">
              <HelpCircle className="w-5 h-5 text-rose-500 dark:text-rose-400" /> Sobre o Jogo
            </span>
            <ArrowRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      ) : (
        <div className="space-y-4 mt-2 animate-fade-in text-slate-800 dark:text-slate-200">
          
          <div className="max-h-[50vh] overflow-y-auto pr-1.5 space-y-5 border-b border-slate-100 dark:border-slate-800/80 pb-4">
            
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">1. Selecione a Dificuldade:</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "facil", label: "Fácil", desc: "Grade 10x10, Horizontal e Vertical, s/ inversões" },
                { id: "medio", label: "Médio", desc: "Grade 15x15, 8 direções, c/ inversões" },
                { id: "dificil", label: "Difícil", desc: "Grade 20x20, Alta complexidade e cruzamento" }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setDifficulty(opt.id as Difficulty)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[84px] ${
                    difficulty === opt.id
                      ? "bg-blue-600 border-blue-500 text-white shadow-lg"
                      : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100/75 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="block text-xs font-black uppercase tracking-wider">{opt.label}</span>
                  <span className={`text-[10px] mt-1.5 block leading-tight font-medium ${difficulty === opt.id ? "text-blue-100" : "text-slate-700 dark:text-slate-350"}`}>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">2. Escolha o Modo de Criação:</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode("theme")}
                className={`py-2 px-3 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === "theme"
                    ? "bg-blue-600 border-blue-500 text-white shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100/75"
                }`}
              >
                <Palette className="w-3.5 h-3.5" /> Escolher Tema
              </button>
              <button
                onClick={() => setMode("custom")}
                className={`py-2 px-3 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === "custom"
                    ? "bg-blue-600 border-blue-500 text-white shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100/75"
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Lista Customizada
              </button>
            </div>
          </div>

          {/* Mode 1 Layout */}
          {mode === "theme" ? (
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomThemeSelected(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    !isCustomThemeSelected
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  Temas Nativos
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomThemeSelected(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    isCustomThemeSelected
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  <Brain className="w-3 h-3" /> Outro Tema (Banco Local)
                </button>
              </div>
 
              {!isCustomThemeSelected ? (
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-700 dark:text-slate-300 uppercase tracking-widest block font-bold">Escolha uma Categoria:</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto pr-1 no-scrollbar border border-slate-200 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-900/40">
                    {DEFAULT_THEMES.map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedTheme(t)}
                        className={`py-1.5 px-2 rounded-lg text-xs text-left font-semibold capitalize truncate transition-all cursor-pointer border ${
                          selectedTheme === t
                            ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        {selectedTheme === t && "✓ "} {t.toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-700 dark:text-slate-300 uppercase tracking-widest block font-bold">Digite qualquer tema de sua cabeça:</label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={30}
                      placeholder="Ex: Mitologia Grega, Peixes de Aquário, Doces..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-3.5 text-sm text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-300 outline-none focus:border-blue-500"
                      value={customThemeText}
                      onChange={(e) => setCustomThemeText(e.target.value)}
                    />
                    <div className="absolute right-2.5 top-2.5 flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase">
                      <Sparkles className="w-4 h-4 animate-bounce" /> Local
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-700 dark:text-slate-300 leading-tight font-medium">
                    * Busque de forma livre: nosso mapeador inteligente buscará em frações de segundos a melhor correspondência em nosso pacote de temas locais!
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Mode 2 Layout */
            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Escreva suas palavras separadas por espaços ou quebras de linha:</label>
              <textarea
                rows={4}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-350 outline-none focus:border-blue-500"
                placeholder="Exemplo: GUITARRA VIOLÃO BATERIA PIANO BAIXO..."
                value={rawWordListText}
                onChange={(e) => setRawWordListText(e.target.value)}
              />
              <p className="text-[10px] text-slate-700 dark:text-slate-300 leading-tight font-medium">
                * O sistema removerá de forma autônoma acentos, cecilhas, números, letras duplicadas e palavras com menos que 4 ou mais que 15 letras.
              </p>
            </div>
          )}

          {/* 3. Modalidade de Jogo: Individual ou em Grupo */}
          <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">3. Modalidade de Jogo:</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsGroupMode(false)}
                className={`py-2 px-3 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  !isGroupMode
                    ? "bg-blue-600 border-blue-500 text-white shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100/75"
                }`}
              >
                Partida Individual
              </button>
              <button
                type="button"
                onClick={() => setIsGroupMode(true)}
                className={`py-2 px-3 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isGroupMode
                    ? "bg-blue-600 border-blue-500 text-white shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100/75"
                }`}
              >
                Partida em Grupo
              </button>
            </div>

            {/* If Group mode is active, configure players & timers */}
            {isGroupMode && (
              <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 animate-fade-in">
                {/* Number of players selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-700 dark:text-slate-300 uppercase tracking-widest block font-bold">Quantidade de Jogadores:</label>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setNumPlayers(num)}
                        className={`w-9 h-9 shrink-0 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center border ${
                          numPlayers === num
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Player names list inputs */}
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-700 dark:text-slate-300 uppercase tracking-widest block font-bold">Nome de cada Jogador:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                    {playerNames.map((name, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-600 dark:text-slate-400">P{i + 1}:</span>
                        <input
                          type="text"
                          maxLength={12}
                          placeholder={`Nome do Jogador ${i + 1}`}
                          className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-500 outline-none focus:border-blue-500 font-medium"
                          value={name}
                          onChange={(e) => {
                            const updatedNames = [...playerNames];
                            updatedNames[i] = e.target.value;
                            setPlayerNames(updatedNames);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>                  {/* Turn time limit */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-700 dark:text-slate-300 uppercase tracking-widest block font-bold">Tempo Limite por Jogada:</label>
                  <div className="grid grid-cols-5 gap-1">
                    {[15, 30, 45, 60, 90].map((tValue) => (
                      <button
                        type="button"
                        key={tValue}
                        onClick={() => setTurnTimeLimit(tValue)}
                        className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center border ${
                          turnTimeLimit === tValue
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                        }`}
                      >
                        <span>{tValue}s</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-700 dark:text-slate-300 leading-tight font-medium">
                    * Se o jogador não encontrar nenhuma palavra dentro desse tempo, a vez passa para o próximo jogador da rodada!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 4. Controle de Tempo: Livre ou Temporizado */}
          <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">4. Tempo de Jogo:</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTimingMode("livre")}
                className={`py-2 px-3 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  timingMode === "livre"
                    ? "bg-blue-600 border-blue-500 text-white shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100/75"
                }`}
              >
                Modo Livre (Sem pressa)
              </button>
              <button
                type="button"
                onClick={() => setTimingMode("temporizado")}
                className={`py-2 px-3 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  timingMode === "temporizado"
                    ? "bg-blue-600 border-blue-500 text-white shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100/75"
                }`}
              >
                Modo Temporizado
              </button>
            </div>

            {/* If timingMode is active, configure timing rules */}
            {timingMode === "temporizado" && (
              <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 animate-fade-in">
                {/* Choose turn or match */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-700 dark:text-slate-300 uppercase tracking-widest block font-bold">Tipo de Temporizador:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTimingType("jogada")}
                      className={`py-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer border ${
                        timingType === "jogada"
                          ? "bg-blue-600 border-blue-500 text-white shadow-inner"
                          : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      Por Jogada / Palavra
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimingType("partida")}
                      className={`py-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer border ${
                        timingType === "partida"
                          ? "bg-blue-600 border-blue-500 text-white shadow-inner"
                          : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      Por Partida Inteira
                    </button>
                  </div>
                </div>

                {/* Choose times preset */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-700 dark:text-slate-300 uppercase tracking-widest block font-bold">Tempo Limite:</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {["30", "60", "90", "120", "personalizado"].map((opt) => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => setSelectedDurationOption(opt)}
                        className={`py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center border capitalize ${
                          selectedDurationOption === opt
                            ? "bg-blue-600 border-blue-500 text-white shadow-sm"
                            : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                        }`}
                      >
                        {opt === "personalizado" ? "Personaliz." : `${opt}s`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom numeric duration field if 'personalizado' selected */}
                {selectedDurationOption === "personalizado" && (
                  <div className="space-y-1.5 animate-fade-in">
                    <label className="text-[10px] text-slate-700 dark:text-slate-300 uppercase tracking-widest block font-bold">Defina os segundos (10 a 600 segundos):</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={10}
                        max={600}
                        value={customDuration}
                        onChange={(e) => setCustomDuration(parseInt(e.target.value, 10) || 60)}
                        className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 dark:text-white outline-none focus:border-blue-500 font-mono font-bold"
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300">segundos</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 5. Dicas Disponíveis: Limitadas ou Infinitas */}
          <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">5. Dicas Disponíveis:</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setInfiniteHints(false)}
                className={`py-2 px-3 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  !infiniteHints
                    ? "bg-blue-600 border-blue-500 text-white shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100/75"
                }`}
              >
                Dicas Limitadas
              </button>
              <button
                type="button"
                onClick={() => setInfiniteHints(true)}
                className={`py-2 px-3 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  infiniteHints
                    ? "bg-blue-600 border-blue-500 text-white shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100/75"
                }`}
              >
                Dicas Infinitas (∞)
              </button>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight font-medium">
              * Escolha "Dicas Infinitas" para poder revelar letras-chave a qualquer momento, sem nenhuma limitação de quantidade durante a partida.
            </p>
          </div>

          </div>

          {/* Action trigger buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setIsConfiguring(false)}
              className="flex-1 py-3 text-sm font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all text-slate-900 dark:text-slate-100 cursor-pointer text-center"
            >
              Cancelar
            </button>
            <button
              onClick={handleLaunchGame}
              className="flex-[2] py-3 text-sm font-bold text-white text-center rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-blue-100 dark:shadow-none flex items-center justify-center gap-1.5"
            >
              Começar Jogo <CheckCircle className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
