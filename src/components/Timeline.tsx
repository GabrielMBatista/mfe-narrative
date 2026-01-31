import React from 'react';
import { Clock, Users, Music, ImageIcon, Edit2, RefreshCw, Wand2, Volume2 } from 'lucide-react';
import { BibleScript, TimelineEntry } from '../types';
import { ELEVENLABS_VOICES } from '../services/elevenLabsService';

interface TimelineProps {
    script: BibleScript;
    sampleImages: Record<number, string>;
    sampleAudios: Record<number, string>;
    loadingAssets: Record<number, { image?: boolean; audio?: boolean }>;
    optimizingIndex: number | null;
    editingPromptIndex: number | null;
    tempPrompt: string;
    setEditingPromptIndex: (index: number | null) => void;
    setTempPrompt: (prompt: string) => void;
    saveEditedPrompt: (index: number) => void;
    characterVoices: Record<string, string>;
    ttsProvider: 'gemini' | 'elevenlabs';
    onPlayAudio: (index: number) => void;
    onGenerateAudio: (index: number, text: string, speaker?: string) => void;
    onGeneratorImage: (index: number, prompt: string) => void;
    onGenerateAssets: (index: number, entry: TimelineEntry) => void;
    onOptimizeScene: (index: number) => void;
    onManualThumbnail: (index: number) => void;
    onSpeakerChange: (index: number, speaker: string) => void;
}

const Timeline: React.FC<TimelineProps> = ({
    script,
    sampleImages,
    sampleAudios,
    loadingAssets,
    optimizingIndex,
    editingPromptIndex,
    tempPrompt,
    setEditingPromptIndex,
    setTempPrompt,
    saveEditedPrompt,
    characterVoices,
    ttsProvider,
    onPlayAudio,
    onGenerateAudio,
    onGeneratorImage,
    onGenerateAssets,
    onOptimizeScene,
    onManualThumbnail,
    onSpeakerChange
}) => {

    return (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800 bg-slate-800/30">
                <h4 className="font-bold text-lg flex items-center gap-2"><Clock className="w-5 h-5 text-amber-500" /> Timeline de Produção Sincronizada</h4>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-800/50 text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                        <tr>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Narração e Áudio</th>
                            <th className="px-6 py-4">Cena Visual</th>
                            <th className="px-6 py-4 text-center">Regerar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {(script.timeline || []).map((item, i) => (
                            <tr key={i} className="hover:bg-slate-800/10 transition-colors">
                                <td className="px-6 py-6 align-top">
                                    <div className="flex flex-col gap-2 items-center">
                                        <span className="font-mono font-black text-amber-500 text-sm">{item.timestamp}</span>
                                        {(() => {
                                            // Normalizar speaker: se vazio, assume 'Narrador'
                                            const speakerDisplay = item.speaker || 'Narrador';
                                            const voiceId = characterVoices[speakerDisplay];

                                            return (
                                                <div className="bg-indigo-900/30 border border-indigo-500/30 px-2 py-1 rounded-lg">
                                                    <div className="flex items-center gap-1.5">
                                                        <Users className="w-3 h-3 text-indigo-400" />
                                                        <span className="text-[10px] font-bold text-indigo-200">{speakerDisplay}</span>
                                                    </div>
                                                    {voiceId && (
                                                        <div className="text-[8px] text-indigo-400/70 mt-0.5 font-mono truncate max-w-[80px]" title={voiceId}>
                                                            {voiceId}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                        {i < 2 && (
                                            <span className="bg-red-600/20 text-red-500 text-[9px] font-black px-1.5 py-0.5 rounded border border-red-600/30 animate-pulse">
                                                HOOK 🔥
                                            </span>
                                        )}
                                        <div className="flex gap-1">
                                            <div className={`w-2 h-2 rounded-full ${sampleImages[i] ? 'bg-green-500' : 'bg-slate-700'}`} title="Imagem" />
                                            <div className={`w-2 h-2 rounded-full ${sampleAudios[i] ? 'bg-blue-500' : 'bg-slate-700'}`} title="Áudio" />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-6 text-sm text-slate-200 min-w-[300px] align-top">
                                    <p className="mb-4 leading-relaxed">{item.narration}</p>

                                    {/* Seletor de Personagem/Narrador */}
                                    {script.characters && script.characters.length > 0 && (
                                        <div className="mb-3">
                                            <select
                                                value={item.speaker || ''}
                                                onChange={(e) => onSpeakerChange(i, e.target.value)}
                                                className="w-full bg-slate-800/50 border border-slate-700 text-xs px-2 py-1.5 rounded-lg text-slate-300 outline-none focus:border-indigo-500 transition-all"
                                            >
                                                <option value="">
                                                    {(() => {
                                                        const narratorVoice = characterVoices['Narrador'];

                                                        if (!narratorVoice) {
                                                            return `🎙️ Narrador (Não Definida)`;
                                                        }

                                                        let voiceName = narratorVoice;
                                                        if (ttsProvider === 'elevenlabs') {
                                                            voiceName = ELEVENLABS_VOICES.find(v => v.voice_id === narratorVoice)?.name || narratorVoice;
                                                        }

                                                        return `🎙️ Narrador (${voiceName})`;
                                                    })()}
                                                </option>
                                                {script.characters
                                                    .filter(char => !['narrador', 'narrator'].includes(char.name.toLowerCase()))
                                                    .map((char) => {
                                                        const voiceId = characterVoices[char.name];
                                                        let voiceName = 'Voz não definida';

                                                        if (voiceId) {
                                                            if (ttsProvider === 'gemini') {
                                                                voiceName = voiceId; // Para Gemini, o voiceId já é o nome
                                                            } else {
                                                                const voice = ELEVENLABS_VOICES.find(v => v.voice_id === voiceId);
                                                                voiceName = voice?.name || voiceId;
                                                            }
                                                        }

                                                        return (
                                                            <option key={char.name} value={char.name}>
                                                                🎭 {char.name} ({voiceName})
                                                            </option>
                                                        );
                                                    })}
                                            </select>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        {sampleAudios[i] && (
                                            <button
                                                onClick={() => onPlayAudio(i)}
                                                className="flex items-center gap-2 text-[10px] font-bold text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition-all uppercase tracking-wider border border-blue-500/20"
                                            >
                                                <Volume2 className="w-3 h-3" /> Ouvir
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onGenerateAudio(i, item.narration, item.speaker || 'Narrador')}
                                            disabled={loadingAssets[i]?.audio}
                                            className="flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-all uppercase tracking-wider border border-slate-700 disabled:opacity-50"
                                        >
                                            {loadingAssets[i]?.audio ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Music className="w-3 h-3" />}
                                            Áudio
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-6 align-top">
                                    <div className="space-y-3">
                                        {sampleImages[i] ? (
                                            <img src={sampleImages[i]} className="w-48 h-28 object-cover rounded-xl border border-slate-700 shadow-xl" alt="" />
                                        ) : (
                                            <div className="w-48 h-28 bg-slate-800 rounded-xl border border-slate-700 border-dashed flex flex-col items-center justify-center gap-2 text-slate-600">
                                                <ImageIcon className="w-6 h-6 opacity-20" />
                                                <span className="text-[10px] font-bold">SEM IMAGEM</span>
                                            </div>
                                        )}
                                        <div className="flex gap-2 items-center">
                                            <span className="text-[10px] bg-black/50 px-2 py-1 rounded text-slate-400 border border-slate-800">
                                                {item.cameraMovement}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setEditingPromptIndex(i);
                                                    setTempPrompt(item.imagePrompt);
                                                }}
                                                className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-amber-500 transition-colors"
                                            >
                                                <Edit2 className="w-3 h-3" /> Editar Visual
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => onOptimizeScene(i)}
                                            disabled={optimizingIndex === i}
                                            className="w-full mb-2 bg-purple-900/30 hover:bg-purple-900/50 text-purple-200 text-[10px] font-bold py-1.5 rounded-lg border border-purple-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                        >
                                            {optimizingIndex === i ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                            Otimizar com AI
                                        </button>

                                        {sampleImages[i] && (
                                            <button
                                                onClick={() => onManualThumbnail(i)}
                                                className="w-full mb-2 bg-slate-800 hover:bg-amber-900/40 text-slate-400 hover:text-amber-500 text-[10px] font-bold py-1.5 rounded-lg border border-slate-700 hover:border-amber-500/50 flex items-center justify-center gap-2 transition-all"
                                                title="Definir esta imagem como capa do projeto"
                                            >
                                                <ImageIcon className="w-3 h-3" /> Definir como Capa
                                            </button>
                                        )}

                                        {editingPromptIndex === i ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    className="w-full h-24 bg-black/50 border border-amber-500/50 rounded-lg p-2 text-xs text-amber-100"
                                                    value={tempPrompt}
                                                    onChange={(e) => setTempPrompt(e.target.value)}
                                                />
                                                <div className="flex gap-2">
                                                    <button onClick={() => saveEditedPrompt(i)} className="bg-amber-600 text-xs px-3 py-1 rounded font-bold">Salvar</button>
                                                    <button onClick={() => setEditingPromptIndex(null)} className="bg-slate-700 text-xs px-3 py-1 rounded">Cancelar</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-500 line-clamp-2 hover:line-clamp-none transition-all cursor-help" title={item.imagePrompt}>
                                                {item.imagePrompt}
                                            </p>
                                        )}

                                        <button
                                            onClick={() => onGeneratorImage(i, item.imagePrompt)}
                                            disabled={loadingAssets[i]?.image}
                                            className="flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-all uppercase tracking-wider border border-slate-700 disabled:opacity-50"
                                        >
                                            {loadingAssets[i]?.image ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
                                            Visual
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-6 text-center align-top">
                                    <button
                                        onClick={() => onGenerateAssets(i, item)}
                                        disabled={loadingAssets[i]?.image || loadingAssets[i]?.audio}
                                        className="p-3 hover:bg-amber-600/20 hover:text-amber-500 rounded-xl transition-all text-slate-500 border border-transparent hover:border-amber-500/30 disabled:opacity-20"
                                        title="Regerar Ambos"
                                    >
                                        <RefreshCw className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Timeline;
