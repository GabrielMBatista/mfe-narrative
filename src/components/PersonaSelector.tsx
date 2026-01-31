import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { NicheConfig } from '../config/nicheConfig';
import { Check, Plus, Trash2, Ghost } from 'lucide-react';
import { PersonaCreatorModal } from './PersonaCreatorModal';

interface PersonaSelectorProps {
    currentNicheId: string;
    onSelectConfig: (id: string) => void;
}

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({ currentNicheId, onSelectConfig }) => {
    const { getAllPersonas, deleteCustomPersona } = useSettings();
    const [isOpen, setIsOpen] = useState(false);
    const [showCreator, setShowCreator] = useState(false);

    const personas = getAllPersonas();
    const currentPersona = personas[currentNicheId];

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700 transition-all min-w-[200px]"
            >
                <div className={`p-1.5 rounded-lg ${currentNicheId === 'bible' ? 'bg-amber-600' : 'bg-indigo-600'}`}>
                    <Ghost className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col items-start">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Persona Atual</span>
                    <span className="text-sm font-bold text-white truncate max-w-[140px]">{currentPersona?.name || 'Selecione...'}</span>
                </div>
            </button>

            {/* Dropdown Modal */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-12 left-0 mt-2 w-[400px] bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl z-50 overflow-hidden animate-fade-in origin-top-left">
                        <div className="p-4 border-b border-slate-800 bg-slate-950/30">
                            <h4 className="font-bold text-white text-sm">Selecione uma Persona</h4>
                            <p className="text-xs text-slate-500">Cada persona define o estilo de narração e visual.</p>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto p-2 space-y-1">
                            {Object.values(personas).map((persona) => {
                                const isSelected = currentNicheId === persona.id;
                                const isCustom = !['bible', 'english'].includes(persona.id);

                                return (
                                    <div
                                        key={persona.id}
                                        className={`group relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors border ${isSelected
                                            ? 'bg-indigo-600/10 border-indigo-500/50'
                                            : 'hover:bg-slate-800 border-transparent hover:border-slate-700'
                                            }`}
                                        onClick={() => {
                                            onSelectConfig(persona.id);
                                            setIsOpen(false);
                                        }}
                                    >
                                        <div className={`mt-1 p-2 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-indigo-400'}`}>
                                            <Ghost className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className={`font-bold text-sm ${isSelected ? 'text-indigo-400' : 'text-slate-200'}`}>
                                                    {persona.name}
                                                </span>
                                                {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{persona.description}</p>
                                        </div>

                                        {isCustom && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm(`Tem certeza que deseja apagar a persona "${persona.name}"?`)) {
                                                        deleteCustomPersona(persona.id);
                                                        if (isSelected) onSelectConfig('bible'); // Fallback
                                                    }
                                                }}
                                                className="absolute right-2 top-2 p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                title="Apagar Persona"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-3 border-t border-slate-800 bg-slate-950/30">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    setShowCreator(true);
                                }}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-xl font-bold text-sm transition-colors border border-dashed border-slate-700 hover:border-indigo-500/50"
                            >
                                <Plus className="w-4 h-4" /> Criar Nova Persona
                            </button>
                        </div>
                    </div>
                </>
            )}

            <PersonaCreatorModal
                isOpen={showCreator}
                onClose={() => setShowCreator(false)}
            />
        </div>
    );
};
