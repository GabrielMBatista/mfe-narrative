import React, { useState } from 'react';
import { Sparkles, Wand2 } from 'lucide-react';
import { BibleScript } from '../types';

interface ThumbnailCreatorProps {
    thumbnailPrompt: string;
    onPromptChange: (prompt: string) => void;
    onGenerateSuggestion: () => Promise<void>;
    onGenerateThumbnail: () => Promise<void>;
    isGenerating: boolean;
    script: BibleScript | null;
}

export const ThumbnailCreator: React.FC<ThumbnailCreatorProps> = ({
    thumbnailPrompt,
    onPromptChange,
    onGenerateSuggestion,
    onGenerateThumbnail,
    isGenerating,
    script
}) => {
    return (
        <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-6 border border-purple-500/30">
            <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-6 h-6 text-purple-400" />
                <h3 className="text-xl font-bold text-white">YouTube Thumbnail Creator</h3>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Prompt Personalizado (Em inglês para melhor resultado)
                    </label>
                    <textarea
                        value={thumbnailPrompt}
                        onChange={(e) => onPromptChange(e.target.value)}
                        placeholder="Ex: Epic biblical scene, dramatic lighting, cinematic composition..."
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px]"
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onGenerateSuggestion}
                        disabled={isGenerating || !script}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                    >
                        <Wand2 className="w-5 h-5" />
                        {isGenerating ? 'Gerando...' : 'Sugerir Prompt Viral'}
                    </button>

                    <button
                        onClick={onGenerateThumbnail}
                        disabled={isGenerating || !thumbnailPrompt.trim()}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed rounded-lg font-medium transition-all"
                    >
                        <Sparkles className="w-5 h-5" />
                        {isGenerating ? 'Criando...' : 'Criar Capa'}
                    </button>
                </div>

                <p className="text-xs text-slate-400 italic">
                    💡 Dica: Seja específico sobre cores, emoções e composição para melhores resultados
                </p>
            </div>
        </div>
    );
};
