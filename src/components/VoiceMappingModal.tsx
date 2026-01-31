import React from 'react';
import { X, Users } from 'lucide-react';
import { Character } from '../types';
import { GEMINI_VOICES } from '../services/geminiService';
import { ELEVENLABS_VOICES } from '../services/elevenLabsService';

interface VoiceMappingModalProps {
    isOpen: boolean;
    onClose: () => void;
    characters: Character[];
    characterVoices: Record<string, string>;
    setCharacterVoices: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    ttsProvider: 'gemini' | 'elevenlabs';
    onSave: () => void;
    onReset: () => void;
    availableVoices?: import('../services/elevenLabsService').ElevenLabsVoice[];
}

const VoiceMappingModal: React.FC<VoiceMappingModalProps> = ({
    isOpen,
    onClose,
    characters,
    characterVoices,
    setCharacterVoices,
    ttsProvider,
    onSave,
    onReset,
    availableVoices
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl max-h-[80vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-900/20 to-purple-900/20">
                    <h3 className="text-2xl font-bold flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-lg">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        Configurar Vozes dos Personagens
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto max-h-[calc(80vh-120px)] space-y-6">
                    <p className="text-slate-400 text-sm mb-6">
                        Atribua uma voz específica para cada personagem. O sistema detectará automaticamente qual personagem está falando em cada cena.
                    </p>

                    {/* Prepender Narrador à lista de personagens para configuração */}
                    {[
                        {
                            name: 'Narrador',
                            description: 'Voz responsável pela narração principal da história.',
                            voiceType: 'Narrativa, Clara, Envolvente'
                        } as Character,
                        ...characters.filter(c => !['narrador', 'narrator'].includes(c.name.toLowerCase()))
                    ].map((character, idx) => (
                        <div key={idx} className="bg-slate-950/50 border border-slate-800 rounded-xl p-6 hover:border-indigo-500/30 transition-all">
                            <div className="flex items-start gap-4">
                                {/* Character Info */}
                                <div className="flex-1">
                                    <h4 className="font-bold text-lg text-white mb-2 flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${character.name === 'Narrador' ? 'bg-amber-500' : 'bg-indigo-500'}`}></span>
                                        {character.name}
                                    </h4>
                                    <p className="text-slate-400 text-sm mb-4">{character.description}</p>
                                    <p className={`${character.name === 'Narrador' ? 'text-amber-300 bg-amber-950/30' : 'text-indigo-300 bg-indigo-950/30'} text-xs font-mono px-3 py-1 rounded inline-block`}>
                                        Tipo de Voz Sugerido: {character.voiceType}
                                    </p>
                                </div>

                                {/* Voice Selector */}
                                <div className="min-w-[200px]">
                                    <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2 font-bold">
                                        Voz Atribuída
                                    </label>
                                    <select
                                        value={characterVoices[character.name] || ''}
                                        onChange={(e) => setCharacterVoices(prev => ({
                                            ...prev,
                                            [character.name]: e.target.value
                                        }))}
                                        className={`w-full bg-slate-800 border ${!characterVoices[character.name] ? 'border-red-500/50' : 'border-slate-700'} text-white px-4 py-2.5 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                                    >
                                        <option value="">Selecione uma voz...</option>
                                        {ttsProvider === 'gemini' ? (
                                            <>
                                                <optgroup label="Vozes Gemini">
                                                    {GEMINI_VOICES.map(voice => (
                                                        <option key={voice.name} value={voice.name}>
                                                            {voice.name} - {voice.description}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            </>
                                        ) : (
                                            <>
                                                <optgroup label="Vozes ElevenLabs">
                                                    {(availableVoices || ELEVENLABS_VOICES).map(voice => (
                                                        <option key={voice.voice_id} value={voice.voice_id}>
                                                            {voice.name} {voice.description ? `- ${voice.description}` : ''} {voice.gender ? `(${voice.gender === 'male' ? 'M' : 'F'})` : ''}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            </>
                                        )}
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                        <button
                            onClick={onReset}
                            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-bold transition-all"
                        >
                            Resetar Tudo
                        </button>
                        <button
                            onClick={onSave}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold transition-all shadow-lg"
                        >
                            Salvar Configuração
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoiceMappingModal;
