import React from "react";
import { BarChart3, Trophy, Flame, PlayCircle, Clock, Percent, Palette, ArrowLeft, Trash2 } from "lucide-react";
import { GameStats } from "../types";

interface StatsPanelProps {
  stats: GameStats;
  onBack: () => void;
  onReset: () => void;
}

export default function StatsPanel({ stats, onBack, onReset }: StatsPanelProps) {
  const winRate = stats.played > 0 ? Math.round((stats.victories / stats.played) * 100) : 0;
  
  // Format average time
  const avgTime = stats.victories > 0 ? Math.round(stats.totalTimeSec / stats.victories) : 0;
  const formatTime = (secs: number) => {
    if (secs === 0) return "--:--";
    const minutes = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${minutes.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
  };

  // Sort and load favorite themes
  const popularThemes = Object.entries(stats.themesUsed || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Total difficulty choices count
  const totalLevelsCount = (stats.levelsUsed?.facil || 0) + (stats.levelsUsed?.medio || 0) + (stats.levelsUsed?.dificil || 0);

  const getLevelRatio = (count: number) => {
    if (totalLevelsCount === 0) return "0%";
    return `${Math.round((count / totalLevelsCount) * 100)}%`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl rounded-3xl animate-fade-in text-slate-800 dark:text-slate-200 border-t-[6px] border-t-blue-600 dark:border-t-blue-500 font-sans">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="text-2xl font-extrabold font-display tracking-tight text-slate-850 dark:text-white">Estatísticas</h2>
            <p className="text-xs text-slate-455 dark:text-slate-400">Seu desempenho local acumulado</p>
          </div>
        </div>

        <button
          onClick={() => {
            if (confirm("Deseja realmente redefinir todas as suas estatísticas locais? Esta ação é permanente.")) {
              onReset();
            }
          }}
          className="p-2 bg-slate-50 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-500/10 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:border-rose-400 transition-all cursor-pointer rounded-xl"
          title="Redefinir Estatísticas"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Grid of Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {/* Played */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <span className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <PlayCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> JOGADAS
          </span>
          <div className="mt-2.5">
            <span className="text-3xl font-extrabold font-display text-slate-800 dark:text-white">{stats.played}</span>
          </div>
        </div>

        {/* Victories */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <span className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-500" /> VITÓRIAS
          </span>
          <div className="mt-2.5">
            <span className="text-3xl font-extrabold font-display text-slate-800 dark:text-white">{stats.victories}</span>
          </div>
        </div>

        {/* Win Rate */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <span className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Percent className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> TAXA
          </span>
          <div className="mt-2.5">
            <span className="text-3xl font-extrabold font-display text-slate-800 dark:text-white">{winRate}%</span>
          </div>
        </div>

        {/* High Score */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <span className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-rose-500" /> RECORD
          </span>
          <div className="mt-2.5">
            <span className="text-3xl font-extrabold font-display text-slate-800 dark:text-white">{stats.highScore}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Difficulties ratios */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">PREFERÊNCIA DE NÍVEL</h3>
          {totalLevelsCount === 0 ? (
            <div className="text-xs text-slate-400 py-6 text-center">Nenhum jogo concluído ainda</div>
          ) : (
            <div className="space-y-3">
              {/* Facil */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-350">
                  <span>Fácil</span>
                  <span className="font-mono">{stats.levelsUsed?.facil || 0} ({getLevelRatio(stats.levelsUsed?.facil || 0)})</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-750 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: getLevelRatio(stats.levelsUsed?.facil || 0) }}></div>
                </div>
              </div>

              {/* Medio */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-350">
                  <span>Médio</span>
                  <span className="font-mono">{stats.levelsUsed?.medio || 0} ({getLevelRatio(stats.levelsUsed?.medio || 0)})</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-750 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: getLevelRatio(stats.levelsUsed?.medio || 0) }}></div>
                </div>
              </div>

              {/* Dificil */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-350">
                  <span>Difícil</span>
                  <span className="font-mono">{stats.levelsUsed?.dificil || 0} ({getLevelRatio(stats.levelsUsed?.dificil || 0)})</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-750 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: getLevelRatio(stats.levelsUsed?.dificil || 0) }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Favorite Themes & Time */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-pink-500 dark:text-pink-400" /> TEMAS FAVORITOS
            </h3>
            {popularThemes.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">Nenhum tema jogado ainda</p>
            ) : (
              <div className="space-y-2 mt-2">
                {popularThemes.map(([theme, count], index) => (
                  <div key={theme} className="flex items-center justify-between text-xs bg-white dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200 dark:border-slate-750/50">
                    <span className="font-semibold text-slate-600 dark:text-slate-300 capitalize">{theme.toLowerCase()}</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full font-bold">{count} partidas</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-sky-500 dark:text-sky-400" /> TEMPO MÉDIO DE VITÓRIA
            </span>
            <span className="font-mono text-slate-800 dark:text-white text-sm font-bold bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-750">
              {formatTime(avgTime)}
            </span>
          </div>
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
