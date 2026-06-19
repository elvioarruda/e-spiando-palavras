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
    wordCount: number;
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
  const [wordCount, setWordCount] = useState<number>(8);

  // Custom themes local state
  const [customThemes, setCustomThemes] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem("espiando_custom_themes");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Custom themes editor states
  const [editingThemeName, setEditingThemeName] = useState<string | null>(null);
  const [newThemeNameInput, setNewThemeNameInput] = useState("");
  const [singleWordInput, setSingleWordInput] = useState("");
  const [bulkWordsInput, setBulkWordsInput] = useState("");
  const [showAddThemeBox, setShowAddThemeBox] = useState(false);
  const [newThemeNameToAdd, setNewThemeNameToAdd] = useState("");

  // Individual word inline edit states
  const [editingWordIndex, setEditingWordIndex] = useState<number | null>(null);
  const [editingWordValue, setEditingWordValue] = useState("");

  const saveCustomThemes = (updated: Record<string, string[]>) => {
    setCustomThemes(updated);
    localStorage.setItem("espiando_custom_themes", JSON.stringify(updated));
  };

  const handleExportCustomThemes = () => {
    if (Object.keys(customThemes).length === 0) {
      alert("Não há temas personalizados para exportar.");
      return;
    }
    let txt = "";
    Object.keys(customThemes).forEach(themeName => {
      const words = customThemes[themeName];
      txt += `${themeName};${words.join(";")}\n`;
    });
    
    try {
      const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "temas_personalizados_espiando.txt";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Falha ao exportar temas: " + err);
    }
  };

  const handleImportCustomThemes = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const lines = content.split("\n");
      const updatedThemes = { ...customThemes };

      let importCount = 0;
      lines.forEach(line => {
        if (!line.trim()) return;
        const parts = line.split(";").map(p => p.trim());
        const themeName = parts[0];
        if (!themeName) return;

        // Parse list of words
        const words = parts.slice(1)
          .map(w => cleanWord(w))
          .filter(w => w.length >= 4 && w.length <= 20);

        if (words.length > 0 || parts.length > 1) {
          updatedThemes[themeName] = Array.from(new Set([...(updatedThemes[themeName] || []), ...words]));
          importCount++;
        }
      });

      if (importCount > 0) {
        saveCustomThemes(updatedThemes);
        alert(`${importCount} tema(s) importado(s) com sucesso!`);
      } else {
        alert("Nenhum tema válido encontrado no arquivo. Verifique o formato (.txt delimitado por ';').");
      }
    };
    reader.readAsText(file);
    // Reset file input so user can choose same file again if desired
    e.target.value = "";
  };

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
      infiniteHints,
      wordCount
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
          e-Spiando <span className="text-blue-600 dark:text-blue-400">Palavras</span>
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
          Crie infinitos quebra-cabeças sob medida! Divirta-se jogando totalmente de forma estática offline e com temas integrados.
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 font-medium">
          Desenvolvido por Élvio A. de Arruda &bull; <a href="mailto:elvio.desenvolvimento@gmail.com" className="text-blue-500 hover:underline dark:text-blue-400 select-all">elvio.desenvolvimento@gmail.com</a>
        </p>


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
      ) : editingThemeName !== null ? (
        /* EDITING CUSTOM THEME PANEL */
        <div className="space-y-5 mt-2 animate-fade-in text-slate-800 dark:text-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-805 pb-3 flex-wrap gap-2">
            <div>
              <span className="text-[10px] text-slate-550 dark:text-slate-400 uppercase tracking-wider font-extrabold block">Gerenciar Tema</span>
              <h2 className="text-lg font-bold text-slate-850 dark:text-white flex items-center gap-1.5 leading-none">
                <span className="text-blue-500">⚙</span> {editingThemeName}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingThemeName(null);
                setEditingWordIndex(null);
              }}
              className="px-3 py-1.5 text-xs bg-slate-205 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold rounded-lg cursor-pointer transition-all"
            >
              Voltar ao Menu
            </button>
          </div>

          {/* Opção de Renomear o Tema */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300 block">Renomear este Tema:</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 p-2 text-xs rounded-lg text-slate-805 dark:text-slate-105 outline-none focus:border-blue-500 font-bold"
                value={newThemeNameInput}
                onChange={(e) => setNewThemeNameInput(e.target.value)}
                maxLength={24}
              />
              <button
                type="button"
                onClick={() => {
                  const trimmedNewName = newThemeNameInput.trim();
                  if (!trimmedNewName || trimmedNewName === editingThemeName) return;
                  if (customThemes[trimmedNewName] || DEFAULT_THEMES.includes(trimmedNewName.toUpperCase())) {
                    alert("Já existe um tema nativo ou personalizado com este nome.");
                    return;
                  }
                  
                  const updated = { ...customThemes };
                  updated[trimmedNewName] = updated[editingThemeName!];
                  delete updated[editingThemeName!];
                  saveCustomThemes(updated);
                  setEditingThemeName(trimmedNewName);
                  if (selectedTheme === editingThemeName) {
                    setSelectedTheme(trimmedNewName);
                  }
                }}
                className="px-3.5 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold cursor-pointer transition-all shrink-0"
              >
                Renomear
              </button>
            </div>
          </div>

          {/* Adicionar palavras */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300 block mb-1">Incluir Palavra Individual:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: BANANA, UVA, MELANCIA..."
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 p-2 text-xs rounded-lg text-slate-805 dark:text-slate-105 outline-none focus:border-blue-500 font-bold"
                  value={singleWordInput}
                  onChange={(e) => setSingleWordInput(e.target.value)}
                  maxLength={15}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const wordClean = cleanWord(singleWordInput);
                      if (!wordClean) return;
                      if (wordClean.length < 4 || wordClean.length > 15) {
                        alert("Palavras devem ter entre 4 e 15 letras.");
                        return;
                      }
                      const currentList = customThemes[editingThemeName!] || [];
                      if (currentList.includes(wordClean)) {
                        alert("Esta palavra já existe neste tema.");
                        return;
                      }
                      saveCustomThemes({
                        ...customThemes,
                        [editingThemeName!]: [...currentList, wordClean]
                      });
                      setSingleWordInput("");
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const wordClean = cleanWord(singleWordInput);
                    if (!wordClean) return;
                    if (wordClean.length < 4 || wordClean.length > 15) {
                      alert("Palavras devem ter entre 4 e 15 letras.");
                      return;
                    }
                    const currentList = customThemes[editingThemeName!] || [];
                    if (currentList.includes(wordClean)) {
                      alert("Esta palavra já existe neste tema.");
                      return;
                    }
                    saveCustomThemes({
                      ...customThemes,
                      [editingThemeName!]: [...currentList, wordClean]
                    });
                    setSingleWordInput("");
                  }}
                  className="px-3.5 py-2 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold cursor-pointer transition-all shrink-0"
                >
                  Adicionar
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300 block mb-1">Colar palavras em grupo (delimitadas por ponto e vírgula, vírgula ou linhas):</label>
              <textarea
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 p-2 text-xs rounded-lg text-slate-805 dark:text-slate-105 placeholder-slate-400 outline-none focus:border-blue-500 font-bold"
                placeholder="Cole um bloco de texto com as palavras aqui. Pode estar separado por vírgula, ponto e vírgula, espaço ou uma em cada linha!"
                rows={3}
                value={bulkWordsInput}
                onChange={(e) => setBulkWordsInput(e.target.value)}
              />
              <button
                type="button"
                onClick={() => {
                  const rawWords = bulkWordsInput.split(/[\s,;\n\r]+/);
                  const validWords: string[] = [];
                  rawWords.forEach(rw => {
                    const w = cleanWord(rw);
                    if (w.length >= 4 && w.length <= 15) {
                      validWords.push(w);
                    }
                  });

                  if (validWords.length === 0) {
                    alert("Nenhuma palavra válida de 4 a 15 letras encontrada para importar.");
                    return;
                  }

                  const currentList = customThemes[editingThemeName!] || [];
                  const merged = Array.from(new Set([...currentList, ...validWords]));
                  saveCustomThemes({
                    ...customThemes,
                    [editingThemeName!]: merged
                  });
                  setBulkWordsInput("");
                  alert(`${validWords.length} nova(s) palavra(s) adicionada(s) com sucesso.`);
                }}
                className="mt-1.5 w-full py-1.5 text-xs bg-slate-750 dark:bg-slate-800 text-slate-100 hover:bg-slate-700 rounded-lg font-bold cursor-pointer transition-all"
              >
                Importar Palavras em Bloco
              </button>
            </div>
          </div>

          {/* Lista de palavras cadastradas */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Palavras Cadastradas ({(customThemes[editingThemeName!] || []).length}):</span>
              <button
                type="button"
                onClick={() => {
                  const confirmClear = window.confirm("Excluir todas as palavras deste tema?");
                  if (confirmClear) {
                    saveCustomThemes({
                      ...customThemes,
                      [editingThemeName!]: []
                    });
                  }
                }}
                className="text-[10px] text-red-500 hover:underline font-bold cursor-pointer"
              >
                Limpar Tudo
              </button>
            </h3>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl max-h-56 overflow-y-auto p-2 bg-slate-50/50 dark:bg-slate-900/30 no-scrollbar">
              {(customThemes[editingThemeName!] || []).length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">Nenhuma palavra cadastrada neste tema. Adicione acima!</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {(customThemes[editingThemeName!] || []).map((word, wordIdx) => {
                    const isWordEditing = editingWordIndex === wordIdx;
                    return (
                      <div
                        key={wordIdx}
                        className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs font-mono font-bold text-slate-700 dark:text-slate-200 shadow-sm animate-fade-in"
                      >
                        {isWordEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editingWordValue}
                              onChange={(e) => setEditingWordValue(e.target.value)}
                              className="w-20 bg-slate-100 dark:bg-slate-950 px-1 py-0.2 rounded border border-slate-350 text-[11px] font-bold text-slate-850 dark:text-white uppercase"
                              maxLength={15}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const cleaned = cleanWord(editingWordValue);
                                if (!cleaned || cleaned.length < 4 || cleaned.length > 15) {
                                  alert("A palavra precisa ter entre 4 e 15 letras.");
                                  return;
                                }
                                const currentList = [...(customThemes[editingThemeName!] || [])];
                                currentList[wordIdx] = cleaned;
                                saveCustomThemes({
                                  ...customThemes,
                                  [editingThemeName!]: Array.from(new Set(currentList))
                                });
                                setEditingWordIndex(null);
                              }}
                              className="text-green-600 hover:text-green-800 font-bold"
                              title="Salvar"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingWordIndex(null)}
                              className="text-red-500 hover:text-red-700 font-bold"
                              title="Cancelar"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="uppercase">{word}</span>
                            <div className="flex items-center gap-1 border-l border-slate-150 pl-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingWordIndex(wordIdx);
                                  setEditingWordValue(word);
                                }}
                                className="text-slate-400 hover:text-blue-500 text-[10px] cursor-pointer"
                                title="Editar palavra"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentList = [...(customThemes[editingThemeName!] || [])];
                                  currentList.splice(wordIdx, 1);
                                  saveCustomThemes({
                                    ...customThemes,
                                    [editingThemeName!]: currentList
                                  });
                                }}
                                className="text-red-400 hover:text-red-650 text-[10px] cursor-pointer"
                                title="Excluir"
                              >
                                ✕
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
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
                <FileText className="w-3.5 h-3.5" /> Lista Personalizada
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Quantidade de Palavras para Encontrar:</h3>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-350 block">Determine o número de palavras escondidas</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">* Média recomendada: 8 a 25 palavras</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWordCount(prev => Math.max(3, prev - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-705 text-slate-800 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-700 text-sm font-extrabold flex items-center justify-center transition-all select-none cursor-pointer"
                >
                  -
                </button>
                <input
                  id="word-count-input"
                  type="number"
                  min={3}
                  max={50}
                  value={wordCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setWordCount(isNaN(val) ? 8 : val);
                  }}
                  className="w-16 h-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm rounded-lg text-slate-800 dark:text-white outline-none focus:border-blue-500 font-mono font-bold"
                />
                <button
                  type="button"
                  onClick={() => setWordCount(prev => Math.min(50, prev + 1))}
                  className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-705 text-slate-800 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-700 text-sm font-extrabold flex items-center justify-center transition-all select-none cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Mode 1 Layout */}
          {mode === "theme" ? (
            <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-700 dark:text-slate-300 uppercase tracking-widest block font-bold">Escolha uma Categoria Nativa:</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto pr-1 no-scrollbar border border-slate-200 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-900/40">
                  {DEFAULT_THEMES.map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setSelectedTheme(t);
                        setIsCustomThemeSelected(false);
                      }}
                      className={`py-1.5 px-2 rounded-lg text-xs text-left font-semibold capitalize truncate transition-all cursor-pointer border ${
                        selectedTheme === t && !isCustomThemeSelected
                          ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 font-bold"
                          : "bg-slate-100 dark:bg-slate-850 text-slate-800 dark:text-slate-200 border-slate-300/40 dark:border-slate-750 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {selectedTheme === t && !isCustomThemeSelected && "✓ "} {t.toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Seção de Temas Criados pelo Usuário */}
              <div className="space-y-2 pt-2 border-t border-slate-250 dark:border-slate-800/80">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className="text-[10px] text-slate-700 dark:text-slate-300 uppercase tracking-widest block font-bold">Seus Temas Personalizados:</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleExportCustomThemes}
                      className="px-2 py-0.5 text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-705 rounded border border-slate-250 dark:border-slate-700 font-bold cursor-pointer transition-all"
                      title="Salvar temas em arquivo .txt"
                    >
                      Exportar
                    </button>
                    <label className="px-2 py-0.5 text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-705 rounded border border-slate-250 dark:border-slate-700 font-bold cursor-pointer transition-all flex items-center justify-center gap-0.5">
                      Importar
                      <input
                        type="file"
                        accept=".txt"
                        className="hidden"
                        onChange={handleImportCustomThemes}
                      />
                    </label>
                  </div>
                </div>

                {Object.keys(customThemes).length === 0 ? (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center py-3 bg-white dark:bg-slate-900/10 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                    Nenhum tema personalizado criado. Clique em "Criar Novo Tema" abaixo para começar!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1 no-scrollbar p-1">
                    {Object.keys(customThemes).map((themeName) => {
                      const isSelected = selectedTheme === themeName;
                      const countWords = customThemes[themeName]?.length || 0;
                      return (
                        <div
                          key={themeName}
                          className={`flex items-center justify-between p-1.5 rounded-lg border text-xs gap-1.5 transition-all ${
                            isSelected
                              ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-450 border-blue-500/40"
                              : "bg-white dark:bg-slate-900/30 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTheme(themeName);
                              setIsCustomThemeSelected(false); // loads words as standard theme
                            }}
                            className="flex-1 text-left font-bold truncate cursor-pointer text-[12px] flex items-center gap-1 text-slate-850 dark:text-slate-200"
                          >
                            <span>{isSelected ? "✓" : "•"}</span>
                            <span className="truncate">{themeName}</span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-normal">({countWords} w.)</span>
                          </button>
                          
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingThemeName(themeName);
                                setNewThemeNameInput(themeName);
                              }}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-all cursor-pointer"
                              title="Editar palavras do tema"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const confirmDelete = window.confirm(`Deseja realmente excluir o tema "${themeName}"?`);
                                if (!confirmDelete) return;
                                const updated = { ...customThemes };
                                delete updated[themeName];
                                saveCustomThemes(updated);
                                if (selectedTheme === themeName) {
                                  setSelectedTheme("ANIMAIS");
                                }
                              }}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 text-red-500 hover:text-red-700 rounded transition-all cursor-pointer"
                              title="Excluir este tema"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Bloco de criar novo tema */}
                {showAddThemeBox ? (
                  <div className="flex gap-1.5 items-center bg-slate-100 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-200 dark:border-slate-800/70 animate-fade-in">
                    <input
                      type="text"
                      placeholder="Nome do novo tema..."
                      value={newThemeNameToAdd}
                      onChange={(e) => setNewThemeNameToAdd(e.target.value)}
                      maxLength={24}
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded py-1 px-2.5 text-xs text-slate-800 dark:text-white outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const nameTrimmed = newThemeNameToAdd.trim();
                        if (!nameTrimmed) return;
                        if (customThemes[nameTrimmed] || DEFAULT_THEMES.includes(nameTrimmed.toUpperCase())) {
                          alert("Já existe um tema nativo ou personalizado com este nome.");
                          return;
                        }
                        const updated = { ...customThemes, [nameTrimmed]: [] };
                        saveCustomThemes(updated);
                        setNewThemeNameToAdd("");
                        setShowAddThemeBox(false);
                        setSelectedTheme(nameTrimmed);
                      }}
                      className="px-2.5 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-bold cursor-pointer transition-all"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNewThemeNameToAdd("");
                        setShowAddThemeBox(false);
                      }}
                      className="px-2.5 py-1 text-xs bg-slate-200 dark:bg-slate-700 hover:bg-slate-305 text-slate-800 dark:text-slate-100 rounded font-bold cursor-pointer transition-all"
                    >
                      Voltar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddThemeBox(true)}
                    className="w-full py-1.5 px-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/40 text-xs font-bold transition-all flex items-center justify-center gap-1 hover:text-blue-650 cursor-pointer"
                  >
                    + Criar Novo Tema Personalizado
                  </button>
                )}
              </div>
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
