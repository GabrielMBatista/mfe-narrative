import React from 'react';
import { Users, CheckCircle2 } from 'lucide-react';
import { BibleScript } from '../types';
import { GEMINI_VOICES } from '../services/geminiService';
import { ELEVENLABS_VOICES } from '../services/elevenLabsService';

interface VoicePlanningPanelProps {
    script: BibleScript;
    characterVoices: Record<string, string>;
    setCharacterVoices: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    ttsProvider: 'gemini' | 'elevenlabs';
    availableVoices?: import('../services/elevenLabsService').ElevenLabsVoice[];
}

const VoicePlanningPanel: React.FC<VoicePlanningPanelProps> = ({
    script,
    characterVoices,
    setCharacterVoices,
    ttsProvider,
    availableVoices
}) => {
    return (
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
            <h4 className="text-sm font-black uppercase text-slate-500 mb-6 flex items-center gap-2 tracking-widest">
                <Users className="w-4 h-4 text-amber-500" /> Planejamento Vocal
            </h4>
            <div className="space-y-4">
                {[
                    { name: 'Narrador', voiceType: 'Narrativa Principal', description: 'Voz responsável pela narração do vídeo.' } as import('../types').Character,
                    ...(script.characters || []).filter(c => !['narrador', 'narrator'].includes(c.name.toLowerCase()))
                ].map((char, i) => (
                    <div key={i} className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 hover:border-indigo-500/30 transition-all group">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                                <p className="font-black text-slate-100 group-hover:text-amber-500 transition-colors">
                                    {char.name}
                                </p>
                                <p className="text-[10px] font-bold text-amber-500/60 uppercase tracking-wider">
                                    {char.voiceType}
                                </p>
                            </div>
                        </div>

                        {/* Seletor de Voz */}
                        <div className="mb-3">
                            <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 font-bold">
                                Voz Atribuída:
                            </label>
                            <select
                                value={characterVoices[char.name] || ''}
                                onChange={(e) => setCharacterVoices(prev => ({ ...prev, [char.name]: e.target.value }))}
                                className={`w-full bg-slate-900 text-xs font-bold ${!characterVoices[char.name] ? 'text-slate-500 border-red-500/50' : 'text-indigo-300 border-indigo-500/30'} border rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all`}
                            >
                                <option value="">Selecione uma voz...</option>

                                <optgroup label="✨ Gemini AI (Gratuito/Rápido)">
                                    {GEMINI_VOICES.map(v => (
                                        <option key={v.name} value={v.name}>
                                            {v.name} - {v.description}
                                        </option>
                                    ))}
                                </optgroup>

                                <optgroup label="📡 ElevenLabs (Premium/Realista)">
                                    {(availableVoices || ELEVENLABS_VOICES).map(v => (
                                        <option key={v.voice_id} value={v.voice_id}>
                                            {v.name} {v.description ? `- ${v.description}` : ''} {v.gender ? `(${v.gender === 'male' ? 'M' : 'F'})` : ''}
                                        </option>
                                    ))}
                                </optgroup>
                            </select>
                            {characterVoices[char.name] && (
                                <p className="text-[9px] text-green-400 mt-1 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Auto-atribuída
                                </p>
                            )}
                        </div>

                        <p className="text-xs text-slate-500 italic leading-relaxed">
                            {char.description}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VoicePlanningPanel;
