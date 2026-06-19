import React from "react";
import { Trophy, Clock, Award, Star, RefreshCw, Home, Sparkles, Flame } from "lucide-react";
import { Difficulty } from "../types";

interface VictoryScreenProps {
  score: number;
  timeSec: number;
  wordCount: number;
  difficulty: Difficulty;
  themeName: string;
  onPlayAgain: () => void;
  onGoHome: () => void;
  players?: { id: number; name: string; score: number }[];
}

export default function VictoryScreen({
  score,
  timeSec,
  wordCount,
  difficulty,
  themeName,
  onPlayAgain,
  onGoHome,
  players
}: VictoryScreenProps) {
  
  // Format seconds into minutes and remaining seconds
  const minutes = Math.floor(timeSec / 60);
  const remainingSeconds = timeSec % 60;
  const timeFormatted = `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;

  const sortedPlayers = players ? [...players].sort((a, b) => b.score - a.score) : [];
  const hasPlayers = sortedPlayers.length > 0;
  const winner = sortedPlayers[0];

  return (
    <div className="w-full max-w-xl mx-auto p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl rounded-3xl animate-fade-in text-center text-slate-800 dark:text-slate-100 font-sans border-t-[6px] border-t-blue-600 dark:border-t-blue-500">
      
      {/* Decorative Sparkle Header */}
      <div className="relative inline-flex items-center justify-center p-5 bg-gradient-to-tr from-amber-400 to-yellow-300 rounded-full mb-6 shadow-xl shadow-amber-400/20 ring-4 ring-amber-400/10 dark:ring-amber-500/10">
        <Trophy className="w-14 h-14 text-slate-900 animate-bounce" />
        <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-yellow-500 animate-ping" />
        <Star className="absolute -bottom-1 -left-1 w-5 h-5 text-amber-500 fill-amber-500" />
      </div>

      <h2 className="text-3xl md:text-4xl font-extrabold font-display tracking-tight text-slate-900 dark:text-white select-none">
        {hasPlayers ? `Vitória de ${winner.name}!` : "Parabéns, Você Venceu!"}
      </h2>
      <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
        {hasPlayers 
          ? "Excelente desempenho e trabalho de equipe! Confiram a pontuação final dos competidores." 
          : "Excelente visão e agilidade mental! Encontrou com sucesso todas as palavras ocultas do tema."}
      </p>

      {/* Multiplayer Ranks Card */}
      {hasPlayers && (
        <div className="my-6 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/40 text-left">
          <h3 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-1.5 justify-center">
            👑 Classificação dos Jogadores
          </h3>
          <div className="space-y-2">
            {sortedPlayers.map((p, idx) => {
              let medalEmoji = "⭐";
              let cardBg = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800";
              if (idx === 0) {
                medalEmoji = "👑 Venceu!";
                cardBg = "bg-amber-500/10 border-amber-400 dark:border-amber-500/40 border-[2px] shadow-sm";
              } else if (idx === 1) {
                medalEmoji = "🥈 2º";
                cardBg = "bg-slate-100/60 dark:bg-slate-800/20 border-slate-300 dark:border-slate-700 border";
              } else if (idx === 2) {
                medalEmoji = "🥉 3º";
                cardBg = "bg-orange-100/30 dark:bg-orange-950/10 border-orange-200/50 dark:border-orange-900/20 border";
              } else {
                medalEmoji = `👤 ${idx + 1}º`;
              }

              return (
                <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl ${cardBg} transition-all`}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 font-mono w-5 shrink-0 text-center">{idx + 1}º</span>
                    <span className="font-bold text-xs text-slate-800 dark:text-white capitalize truncate max-w-[150px]">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{medalEmoji}</span>
                    <span className="text-xs font-black text-blue-600 dark:text-blue-400 font-mono">{p.score} pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Stats Block */}
      <div className="grid grid-cols-2 gap-3.5 my-6">
        
        {/* Total Score */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-center items-center">
          <Award className="w-5 h-5 text-amber-500 mb-1" />
          <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest">PONTUAÇÃO MÁXIMA</span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-display mt-0.5">{score} pts</span>
        </div>

        {/* Total Time */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-center items-center">
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-1" />
          <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest">TEMPO TOTAL</span>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-display mt-0.5">{timeFormatted}</span>
        </div>

        {/* Theme Completed */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-center items-center">
          <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest">TEMA</span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 capitalize mt-2 truncate max-w-xs">{themeName.toLowerCase()}</span>
        </div>

        {/* Quantidade */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-center items-center">
          <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest">RESOLVIDAS</span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-2">{wordCount} de {wordCount} palavras</span>
        </div>

      </div>

      {/* Level Banner */}
      <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl mb-8">
        <Flame className="w-4 h-4 text-rose-500" />
        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Dificuldade Completa: </span>
        <span className="text-xs font-black uppercase text-rose-600 dark:text-rose-400">{difficulty}</span>
      </div>

      {/* Interactive Trigger Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={onGoHome}
          className="flex-1 py-3 px-5 text-sm font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 transition-all cursor-pointer flex items-center justify-center gap-1.5 focus:ring-2 focus:ring-slate-500 shadow-sm outline-none"
        >
          <Home className="w-4 h-4 text-slate-900 dark:text-slate-100" /> Voltar ao Menu
        </button>
        <button
          onClick={onPlayAgain}
          className="flex-1.5 py-3 px-5 text-sm font-bold text-white rounded-xl bg-blue-600 hover:bg-blue-700 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <RefreshCw className="w-4 h-4" /> Jogar Novamente
        </button>
      </div>

    </div>
  );
}
