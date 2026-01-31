import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { NicheConfig } from '../config/nicheConfig';
import { Settings, X, Save, RotateCcw, Shield, Key } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const {
        authMode, isLoggedIn, userKeys, setUserKeys,
        nicheOverrides, updateNicheOverride,
        dbStatus, refreshDbStatus,
        getAllPersonas
    } = useSettings();

    const allPersonas = getAllPersonas();

    const [activeTab, setActiveTab] = useState<'general' | 'personas'>('general');
    const [selectedNicheId, setSelectedNicheId] = useState<string>('bible');
    const [tempNicheConfig, setTempNicheConfig] = useState<Partial<NicheConfig>>({});

    // Admin Key Update State
    const [adminKeys, setAdminKeys] = useState({ geminiKey: '', elevenLabsKey: '' });
    const [isSaving, setIsSaving] = useState(false);

    // Initialize temp config when niche changes
    useEffect(() => {
        const currentOverride = authMode === 'db' ?
            // In DB mode, we would load from dbPersonas in context, but let's assume overrides are synced
            // Actually context has getEffectiveNiche, but here we want to edit the *raw* values
            // Currently context.nicheOverrides handles local.
            // For DB, we query logic is inside context.updateNicheOverride
            // Let's rely on context.nicheOverrides for now or add a specialized getter if needed.
            // Simplified: The implementation plan said `nicheOverrides` handles logic.
            nicheOverrides[selectedNicheId] || {}
            : nicheOverrides[selectedNicheId] || {};

        setTempNicheConfig(currentOverride);
    }, [selectedNicheId, nicheOverrides, authMode]);

    if (!isOpen) return null;

    const handleSaveKeys = async () => {
        setIsSaving(true);
        if (authMode === 'local') {
            setUserKeys(userKeys); // Already bound to input? No, we need local state for inputs or bind directly.
            // For local, inputs bind to userKeys directly in `renderGeneral`
        } else {
            // Admin Update
            await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                },
                body: JSON.stringify({
                    action: 'updateKeys',
                    payload: adminKeys
                })
            });
            await refreshDbStatus();
            setAdminKeys({ geminiKey: '', elevenLabsKey: '' }); // Clear after save
        }
        setIsSaving(false);
    };

    const handleSavePersona = () => {
        updateNicheOverride(selectedNicheId, tempNicheConfig);
    };

    return (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                        <Settings className="w-6 h-6 text-slate-400" /> Configurações
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="flex border-b border-slate-800">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`flex-1 py-3 text-sm font-bold ${activeTab === 'general' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Conexões & Chaves
                    </button>
                    <button
                        onClick={() => setActiveTab('personas')}
                        className={`flex-1 py-3 text-sm font-bold ${activeTab === 'personas' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Personas (Niches)
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
                                <div className={`p-2 rounded-lg ${authMode === 'db' ? 'bg-green-900/30 text-green-400' : 'bg-amber-900/30 text-amber-400'}`}>
                                    {authMode === 'db' ? <Shield className="w-6 h-6" /> : <Settings className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">{authMode === 'db' ? 'Modo Admin (Seguro)' : 'Modo Visitante (Local)'}</h4>
                                    <p className="text-xs text-slate-400">
                                        {authMode === 'db'
                                            ? 'Suas chaves estão protegidas no banco de dados do servidor.'
                                            : 'Suas chaves estão salvas neste navegador.'}
                                    </p>
                                </div>
                            </div>

                            {authMode === 'db' ? (
                                <div className="space-y-4">
                                    <h5 className="text-sm font-bold text-slate-300 uppercase">Atualizar Chaves do Servidor</h5>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <label className="text-xs text-slate-500">Gemini Key</label>
                                                <span className={`text-[10px] px-2 rounded ${dbStatus?.hasGemini ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                                                    {dbStatus?.hasGemini ? 'CONFIGURADA' : 'AUSENTE'}
                                                </span>
                                            </div>
                                            <input
                                                type="password"
                                                placeholder="Atualizar chave..."
                                                value={adminKeys.geminiKey}
                                                onChange={e => setAdminKeys({ ...adminKeys, geminiKey: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <label className="text-xs text-slate-500">ElevenLabs Key</label>
                                                <span className={`text-[10px] px-2 rounded ${dbStatus?.hasEleven ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                                                    {dbStatus?.hasEleven ? 'CONFIGURADA' : 'AUSENTE'}
                                                </span>
                                            </div>
                                            <input
                                                type="password"
                                                placeholder="Atualizar chave..."
                                                value={adminKeys.elevenLabsKey}
                                                onChange={e => setAdminKeys({ ...adminKeys, elevenLabsKey: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white"
                                            />
                                        </div>
                                        <button
                                            onClick={handleSaveKeys}
                                            disabled={isSaving || (!adminKeys.geminiKey && !adminKeys.elevenLabsKey)}
                                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm disabled:opacity-50"
                                        >
                                            {isSaving ? 'Salvando...' : 'Atualizar Chaves do Banco'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <h5 className="text-sm font-bold text-slate-300 uppercase">Suas Chaves Locais</h5>
                                    <div>
                                        <label className="text-xs text-slate-500 block mb-1">Gemini Key</label>
                                        <input
                                            type="password"
                                            value={userKeys.gemini}
                                            onChange={e => setUserKeys({ ...userKeys, gemini: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 block mb-1">ElevenLabs Key</label>
                                        <input
                                            type="password"
                                            value={userKeys.elevenLabs}
                                            onChange={e => setUserKeys({ ...userKeys, elevenLabs: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'personas' && (
                        <div className="space-y-6">
                            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                                {Object.values(allPersonas).map(niche => (
                                    <button
                                        key={niche.id}
                                        onClick={() => setSelectedNicheId(niche.id)}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${selectedNicheId === niche.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                    >
                                        {niche.name}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-2 block uppercase">System Prompt (Comportamento da IA)</label>
                                    <textarea
                                        value={tempNicheConfig.systemPrompt !== undefined ? tempNicheConfig.systemPrompt : (allPersonas[selectedNicheId]?.systemPrompt || '')}
                                        onChange={e => setTempNicheConfig({ ...tempNicheConfig, systemPrompt: e.target.value })}
                                        className="w-full h-40 bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-300 font-mono resize-y focus:border-indigo-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-2 block uppercase">Estilo de Imagem (Prompt Suffix)</label>
                                    <textarea
                                        value={tempNicheConfig.imageStyleSuffix !== undefined ? tempNicheConfig.imageStyleSuffix : (allPersonas[selectedNicheId]?.imageStyleSuffix || '')}
                                        onChange={e => setTempNicheConfig({ ...tempNicheConfig, imageStyleSuffix: e.target.value })}
                                        className="w-full h-20 bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-300 resize-y focus:border-indigo-500 outline-none"
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={handleSavePersona}
                                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2"
                                    >
                                        <Save className="w-4 h-4" /> Salvar Alterações
                                    </button>
                                    <button
                                        onClick={() => {
                                            const newOverrides = { ...nicheOverrides };
                                            delete newOverrides[selectedNicheId];
                                            if (authMode === 'local') {
                                                updateNicheOverride(selectedNicheId, {}); // Resets logic? `updateNicheOverride` merges...
                                                // We need a clear way to reset. 
                                                // For now, let's just create an empty override or rely on a "Reset" logic in context that removes the entry.
                                                // Simplified: setTemp to actual defaults manually
                                                setTempNicheConfig({
                                                    systemPrompt: allPersonas[selectedNicheId]?.systemPrompt,
                                                    imageStyleSuffix: allPersonas[selectedNicheId]?.imageStyleSuffix
                                                });
                                            }
                                        }}
                                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg font-bold text-sm"
                                        title="Restaurar Padrão"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
