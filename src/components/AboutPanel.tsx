import React from "react";
import { Info, HelpCircle, Gamepad2, ArrowLeft, Download } from "lucide-react";
import { GameSettings } from "../types";

interface AboutPanelProps {
  onBack: () => void;
  settings: GameSettings;
}

export default function AboutPanel({ onBack, settings }: AboutPanelProps) {
  return (
    <div className="w-full max-w-2xl mx-auto p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl rounded-3xl animate-fade-in text-slate-800 dark:text-slate-200 border-t-[6px] border-t-blue-600 dark:border-t-blue-500 font-sans">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
        <Gamepad2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <div>
          <h2 className="text-2xl font-extrabold font-display tracking-tight text-slate-800 dark:text-white">Sobre o Jogo</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">e-Spiando Palavras v1.0.0</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Intro */}
        <section className="space-y-2">
          <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
            <Info className="w-4 h-4" /> Proposta
          </h3>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            O <strong>e-Spiando Palavras</strong> é um aplicativo moderno desenvolvido em formato
            <strong> Progressive Web App (PWA)</strong>, projetado para operar <strong>100% offline</strong> após instalado,
            com um banco inteligente de busca de temas integrados de alta qualidade.
          </p>
        </section>

        {/* Como Jogar */}
        <section className="space-y-3 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-2">
            <HelpCircle className="w-4 h-4" /> Como Jogar?
          </h3>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 list-disc list-inside">
            <li>Selecione as palavras na grade clicando e arrastando com o mouse (ou tocando e arrastando o dedo na tela do celular).</li>
            <li>As palavras podem ser selecionadas em qualquer sentido (de trás para frente ou de frente para trás).</li>
            <li>No nível <strong>Fácil</strong>, as palavras aparecem apenas na horizontal e vertical regulares.</li>
            <li>Nos níveis <strong>Médio</strong> e <strong>Difícil</strong>, as palavras podem cruzar as diagonais e também aparecer invertidas!</li>
            <li>Se travar, utilize o botão de <strong>Dica</strong> para revelar a posição da letra inicial de alguma palavra, mas lembre-se: as dicas são limitadas!</li>
          </ul>
        </section>

        {/* PWA Feature */}
        <section className="space-y-2">
          <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <Download className="w-4 h-4" /> Instalabilidade (PWA)
          </h3>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Você pode instalar este aplicativo no seu celular (Android/iOS) ou computador. Seus progressos ficarão armazenados localmente e com carregamento instantâneo mesmo sem nenhuma conexão à internet.
          </p>
        </section>
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
