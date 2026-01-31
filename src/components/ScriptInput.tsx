import React from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { AppStatus } from '../types';
import { NicheConfig } from '../config/nicheConfig';

interface ScriptInputProps {
    niche: NicheConfig;
    theme: string;
    setTheme: (theme: string) => void;
    language?: string;
    setLanguage?: (lang: string) => void;
    status: AppStatus;
    onGenerate: () => void;
}

const ScriptInput: React.FC<ScriptInputProps> = ({
    niche,
    theme,
    setTheme,
    language = 'pt-BR',
    setLanguage,
    status,
    onGenerate
}) => {
    return (
        <div className="mb-12">
            <div className="max-w-2xl mx-auto text-center mb-8">
                <h2 className="text-4xl font-serif mb-4 italic text-amber-500">{niche.name} AI</h2>
                <p className="text-slate-400">{niche.description}</p>
            </div>

            <div className="max-w-3xl mx-auto bg-slate-900 p-1 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
                <div className="p-6 space-y-4">
                    {setLanguage && (
                        <div className="flex justify-end mb-2">
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="bg-slate-800 text-slate-300 text-sm rounded-lg px-3 py-1 border border-slate-700 outline-none focus:border-amber-500"
                            >
                                <option value="pt-BR">🇧🇷 Português (BR)</option>
                                <option value="en-US">🇺🇸 English (US)</option>
                                <option value="es-ES">🇪🇸 Español</option>
                                <option value="fr-FR">🇫🇷 Français</option>
                                <option value="de-DE">🇩🇪 Deutsch</option>
                                <option value="it-IT">🇮🇹 Italiano</option>
                                <option value="ja-JP">🇯🇵 日本語</option>
                                <option value="ko-KR">🇰🇷 한국어</option>
                                <option value="ru-RU">🇷🇺 Русский</option>
                            </select>
                        </div>
                    )}
                    <textarea
                        placeholder={niche.placeholder}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-amber-500 outline-none min-h-[100px] transition-all text-lg"
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                    />
                    <button
                        onClick={onGenerate}
                        disabled={status === AppStatus.GENERATING_SCRIPT || !theme.trim()}
                        className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold py-5 rounded-xl flex items-center justify-center gap-3 transition-all text-lg shadow-xl shadow-amber-900/20"
                    >
                        {status === AppStatus.GENERATING_SCRIPT ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                        {status === AppStatus.GENERATING_SCRIPT ? "Criando Roteiro e Timeline..." : "Iniciar Projeto Audiovisual"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScriptInput;
