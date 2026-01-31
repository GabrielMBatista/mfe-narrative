import React from 'react';
import { RefreshCw, ImageIcon, Volume2, Mic, Users, Play, Wand2, FileVideo, FileJson, Languages } from 'lucide-react';
import { BibleScript } from '../types';
import { GEMINI_VOICES } from '../services/geminiService';
import { ELEVENLABS_VOICES } from '../services/elevenLabsService';

interface ControlBarProps {
    script: BibleScript;
    isGeneratingAll: boolean;
    genProgress: number;
    onGenerateAllAssets: () => void;
    onRegenerateAllAudios: () => void;
    onRegenerateAllImages: () => void;
    onGenerateMissingAudios: () => void;
    ttsProvider: 'gemini' | 'elevenlabs';
    setTtsProvider: (provider: 'gemini' | 'elevenlabs') => void;
    elevenLabsVoice: string;
    setElevenLabsVoice: (voice: string) => void;
    onShowVoiceMapping: () => void;
    onTogglePreview: () => void;
    onGenerateAllImages: () => void;
    loadingImagesCount: number;
    loadingAudiosCount: number;
    onReviewScript: () => void;
    isReviewingScript: boolean;
    onExportVideo: () => void;
    isRendering: boolean;
    onExportFullProject: () => void;
    availableVoices?: import('../services/elevenLabsService').ElevenLabsVoice[];
    onOpenTranslation: () => void;
}

const ControlBar: React.FC<ControlBarProps> = ({
    script,
    isGeneratingAll,
    genProgress,
    onGenerateAllAssets,
    onRegenerateAllAudios,
    onRegenerateAllImages,
    onGenerateMissingAudios,
    ttsProvider,
    setTtsProvider,
    elevenLabsVoice,
    setElevenLabsVoice,
    onTogglePreview,
    onGenerateAllImages,
    loadingImagesCount,
    loadingAudiosCount,
    onReviewScript,
    isReviewingScript,
    onExportVideo,
    isRendering,
    onExportFullProject,
    availableVoices,
    onOpenTranslation
}) => {
    return (
        <div className="flex flex-wrap gap-4 items-center justify-between bg-slate-900/80 p-4 rounded-2xl border border-slate-800 sticky top-20 z-40 backdrop-blur-md shadow-lg">
            <div className="flex flex-wrap gap-3">
                <button
                    onClick={onGenerateAllAssets}
                    disabled={isGeneratingAll}
                    className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all border border-slate-700 group"
                >
                    {isGeneratingAll ? <RefreshCw className="w-4 h-4 animate-spin text-amber-500" /> : <div className="flex items-center gap-1"><ImageIcon className="w-4 h-4 text-amber-500" /><Volume2 className="w-4 h-4 text-blue-400" /></div>}
                    {isGeneratingAll ? `Gerando Tudo (${genProgress}%)` : "Gerar Todos os Assets"}
                </button>



                {/* TTS Provider Selector */}
                <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
                    <Mic className="w-4 h-4 text-purple-400" />
                    <select
                        value={ttsProvider}
                        onChange={(e) => setTtsProvider(e.target.value as 'gemini' | 'elevenlabs')}
                        className="bg-transparent text-sm font-bold text-slate-100 outline-none cursor-pointer"
                    >
                        <option value="gemini">Gemini TTS</option>
                        <option value="elevenlabs">ElevenLabs</option>
                    </select>
                </div>

                {/* ElevenLabs Voice Selector */}
                {ttsProvider === 'elevenlabs' && (
                    <div className="flex items-center gap-2 bg-purple-900/30 px-4 py-2 rounded-xl border border-purple-500/30">
                        <Volume2 className="w-4 h-4 text-purple-400" />
                        <select
                            value={elevenLabsVoice}
                            onChange={(e) => setElevenLabsVoice(e.target.value)}
                            className="bg-transparent text-sm font-bold text-purple-200 outline-none cursor-pointer"
                        >
                            {(availableVoices || ELEVENLABS_VOICES).map(voice => (
                                <option key={voice.voice_id} value={voice.voice_id}>
                                    {voice.name} {voice.description ? `- ${voice.description}` : ''} {voice.gender ? `(${voice.gender === 'male' ? 'M' : 'F'})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                )}



                <button
                    onClick={onTogglePreview}
                    className="bg-amber-600 hover:bg-amber-500 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-amber-900/20"
                >
                    <Play className="w-4 h-4 fill-current" /> Preview Cinema
                </button>
            </div>
            <div className="flex gap-2 flex-wrap">
                {/* Botões de Geração Inteligente */}
                <div className="flex flex-col gap-1">
                    <div className="flex gap-1">
                        <button
                            onClick={onGenerateAllImages}
                            disabled={isGeneratingAll || !script}
                            className="bg-blue-900/30 hover:bg-blue-900/50 disabled:opacity-50 px-4 py-2.5 rounded-l-xl text-sm font-bold flex items-center gap-2 transition-all border border-blue-500/30 text-blue-200"
                            title="Gerar apenas imagens faltantes"
                        >
                            {isGeneratingAll ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                            Imagens
                            {loadingImagesCount > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 bg-blue-500/30 rounded text-xs font-mono">
                                    {loadingImagesCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={onRegenerateAllImages}
                            disabled={isGeneratingAll || !script}
                            className="bg-blue-900/30 hover:bg-blue-900/50 disabled:opacity-50 px-3 py-2.5 rounded-r-xl text-sm font-bold flex items-center transition-all border border-l-0 border-blue-500/30 text-blue-300"
                            title="Regerar TODAS as imagens (Sobrescrever)"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <div className="flex gap-1">
                        <button
                            onClick={onGenerateMissingAudios}
                            disabled={isGeneratingAll || !script}
                            className="bg-green-900/30 hover:bg-green-900/50 disabled:opacity-50 px-4 py-2.5 rounded-l-xl text-sm font-bold flex items-center gap-2 transition-all border border-green-500/30 text-green-200"
                            title="Gerar apenas áudios faltantes"
                        >
                            {isGeneratingAll ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                            Áudios
                            {loadingAudiosCount > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 bg-green-500/30 rounded text-xs font-mono">
                                    {loadingAudiosCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={onRegenerateAllAudios}
                            disabled={isGeneratingAll || !script}
                            className="bg-green-900/30 hover:bg-green-900/50 disabled:opacity-50 px-3 py-2.5 rounded-r-xl text-sm font-bold flex items-center transition-all border border-l-0 border-green-500/30 text-green-300"
                            title="Regerar TODOS os áudios (Sobrescrever)"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <button
                    onClick={onOpenTranslation}
                    className="bg-indigo-900/30 hover:bg-indigo-900/50 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all border border-indigo-500/30 text-indigo-200 shadow-lg"
                >
                    <Languages className="w-4 h-4" /> Traduzir
                </button>
                <button
                    onClick={onReviewScript}
                    disabled={isReviewingScript}
                    className="bg-purple-900/30 hover:bg-purple-900/50 disabled:opacity-50 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all border border-purple-500/30 text-purple-200 shadow-lg"
                >
                    {isReviewingScript ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    {isReviewingScript ? "Revisando..." : "Revisar Roteiro"}
                </button>
                <button
                    onClick={onExportVideo}
                    disabled={isRendering}
                    className="bg-amber-800 hover:bg-amber-700 disabled:opacity-50 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all border border-amber-600/50 text-amber-100 shadow-lg"
                >
                    {isRendering ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileVideo className="w-4 h-4" />}
                    {isRendering ? "Renderizando..." : "Exportar Vídeo MP4"}
                </button>
                <button
                    onClick={onExportFullProject}
                    className="bg-slate-800 hover:bg-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all border border-slate-700 text-slate-300"
                >
                    <FileJson className="w-4 h-4 text-green-500" /> Exportar JSON
                </button>
            </div>
        </div>
    );
};

export default ControlBar;
