import React from "react";
import { Sliders, Sun, Moon, Volume2, Settings2, Sparkles, SlidersHorizontal, ArrowLeft } from "lucide-react";
import { GameSettings } from "../types";
import { AudioSynthesizer } from "../utils/audio";

interface SettingsPanelProps {
  settings: GameSettings;
  onUpdate: (updated: GameSettings) => void;
  onBack: () => void;
}

export default function SettingsPanel({ settings, onUpdate, onBack }: SettingsPanelProps) {
  // Simple state update helper
  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    const updated = { ...settings, [key]: value };
    
    // If updating volume, trigger a preview beep so user knows what they set it to!
    if (key === "soundVolume") {
      AudioSynthesizer.setVolume(value as number);
      AudioSynthesizer.playSelect();
    }
    
    onUpdate(updated);
  };

  return (
    <div className="w-full max-w-xl mx-auto p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl rounded-3xl animate-fade-in text-slate-800 dark:text-slate-200 border-t-[6px] border-t-blue-600 dark:border-t-blue-500">
      
      {/* Title */}
      <div className="flex items-center gap-3 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
        <Settings2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <div>
          <h2 className="text-2xl font-extrabold font-display tracking-tight text-slate-800 dark:text-white animate-fade-in">Configurações</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Personalize sua experiência de jogo</p>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* Theme Settings */}
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-800 dark:text-white">Tema Visual</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Alternar entre temas Claro e Escuro</span>
          </div>
          <button
            onClick={() => updateSetting("themeMode", settings.themeMode === "light" ? "dark" : "light")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-sm transition-all font-bold text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            {settings.themeMode === "light" ? (
              <>
                <Sun className="w-4 h-4 text-amber-500" />
                Tema Claro
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-violet-400" />
                Tema Escuro
              </>
            )}
          </button>
        </div>

        {/* Font Accessibility settings */}
        <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-800 dark:text-white">Tamanho das Letras</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Aumente ou diminua a escala das células no tabuleiro para melhor legibilidade</span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {(["pequeno", "medieval", "grande"] as const).map((sz) => (
              <button
                key={sz}
                onClick={() => updateSetting("gridTextSize", sz)}
                className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                  settings.gridTextSize === sz
                    ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-100 dark:shadow-none"
                    : "bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                {sz === "pequeno" ? "Pequeno" : sz === "medieval" ? "Médio" : "Grande"}
              </button>
            ))}
          </div>
        </div>

        {/* Sound Settings */}
        <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-blue-500" /> Volume dos Efeitos
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Ajuste o volume do som de match e vitória</span>
            </div>
            <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold">{Math.round(settings.soundVolume * 100)}%</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Mudo</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.soundVolume}
              onChange={(e) => updateSetting("soundVolume", parseFloat(e.target.value))}
              className="w-full accent-blue-600 bg-slate-200 dark:bg-slate-700 h-2 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs text-slate-400">Máx</span>
          </div>
        </div>

        {/* Animations Settings */}
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-500" /> Efeitos e Animações
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Ativar animações fluidas de seleção e vitória</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.animationsEnabled}
              onChange={(e) => updateSetting("animationsEnabled", e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

      </div>

      <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 transition-all text-sm font-bold shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-900 dark:text-slate-100" /> Voltar ao Menu
        </button>
      </div>

    </div>
  );
}
