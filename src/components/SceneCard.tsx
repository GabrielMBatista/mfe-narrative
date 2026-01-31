import React from 'react';
import { Play, Pause, Image as ImageIcon, Volume2, Wand2, Settings } from 'lucide-react';
import { TimelineEntry } from '../types';

interface SceneCardProps {
    entry: TimelineEntry;
    index: number;
    imageUrl?: string;
    audioUrl?: string;
    isLoadingImage?: boolean;
    isLoadingAudio?: boolean;
    isPlaying?: boolean;
    onPlayAudio: () => void;
    onRegenerateImage: () => void;
    onRegenerateAudio: () => void;
    onOptimize: () => void;
    onEditPrompt: () => void;
}

export const SceneCard: React.FC<SceneCardProps> = ({
    entry,
    index,
    imageUrl,
    audioUrl,
    isLoadingImage,
    isLoadingAudio,
    isPlaying,
    onPlayAudio,
    onRegenerateImage,
    onRegenerateAudio,
    onOptimize,
    onEditPrompt
}) => {
    return (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-4 border border-slate-700 hover:border-indigo-500/50 transition-all">
            <div className="flex items-start gap-4">
                {/* Thumbnail Preview */}
                <div className="relative w-32 h-32 bg-slate-900 rounded-lg overflow-hidden flex-shrink-0 group">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={`Cena ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-12 h-12 text-slate-600" />
                        </div>
                    )}

                    {isLoadingImage && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                        </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                            onClick={onRegenerateImage}
                            className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg"
                            title="Regenerar imagem"
                        >
                            <ImageIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/20 px-2 py-1 rounded">
                                    Cena {index + 1}
                                </span>
                                <span className="text-xs text-slate-500">
                                    {entry.timestamp}
                                </span>
                            </div>

                            {entry.speaker && (
                                <div className="mt-1 text-xs text-purple-400">
                                    🎭 {entry.speaker}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-1">
                            <button
                                onClick={onOptimize}
                                className="p-2 hover:bg-indigo-500/20 rounded-lg transition-colors"
                                title="Otimizar cena"
                            >
                                <Wand2 className="w-4 h-4 text-indigo-400" />
                            </button>
                            <button
                                onClick={onEditPrompt}
                                className="p-2 hover:bg-indigo-500/20 rounded-lg transition-colors"
                                title="Editar prompt"
                            >
                                <Settings className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>
                    </div>

                    <p className="text-sm text-slate-300 leading-relaxed">
                        {entry.narration}
                    </p>

                    <div className="flex items-center gap-2 pt-2">
                        <button
                            onClick={onPlayAudio}
                            disabled={!audioUrl || isLoadingAudio}
                            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                        >
                            {isPlaying ? (
                                <Pause className="w-4 h-4" />
                            ) : (
                                <Play className="w-4 h-4" />
                            )}
                            {isLoadingAudio ? 'Gerando...' : audioUrl ? 'Preview' : 'Sem áudio'}
                        </button>

                        {audioUrl && (
                            <button
                                onClick={onRegenerateAudio}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                                title="Regenerar áudio"
                            >
                                <Volume2 className="w-4 h-4 text-slate-400" />
                            </button>
                        )}

                        <div className="flex-1"></div>

                        <div className="flex gap-2 text-xs">
                            <span className={`px-2 py-1 rounded ${entry.cameraMovement === 'static' ? 'bg-slate-700' : 'bg-purple-500/20 text-purple-400'}`}>
                                📹 {entry.cameraMovement}
                            </span>
                            <span className="px-2 py-1 rounded bg-slate-700 text-slate-400">
                                📍 {entry.focusPoint}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
