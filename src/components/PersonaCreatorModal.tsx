import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSettings } from '../contexts/SettingsContext';
import { NicheConfig } from '../config/nicheConfig';
import { generatePersonaConfig } from '../services/geminiService';
import { X, MessageSquare, Save, Wand2, Loader2, User } from 'lucide-react';

interface PersonaCreatorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PersonaCreatorModal: React.FC<PersonaCreatorModalProps> = ({ isOpen, onClose }) => {
    const { addCustomPersona, getEffectiveKeys, authMode } = useSettings();

    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
        { role: 'assistant', content: 'Olá! Que tipo de canal ou persona você quer criar hoje? Me descreva o estilo, o público e o tom que desejamos.' }
    ]);
    const [isThinking, setIsThinking] = useState(false);
    const [generatedConfig, setGeneratedConfig] = useState<NicheConfig | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isThinking]);

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsThinking(true);

        try {
            const keys = getEffectiveKeys();
            if (!keys.gemini) {
                setMessages(prev => [...prev, { role: 'assistant', content: 'Erro: API Key do Google não configurada. Configure nas Configurações.' }]);
                setIsThinking(false);
                return;
            }

            const conversationHistory = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
            const config = {
                apiKey: keys.gemini,
                useProxy: authMode === 'db' // If using DB mode, we might use proxy, but for now let's stick to simple logic
            };

            // Call the service
            const newConfigPart = await generatePersonaConfig(conversationHistory, userMsg, config);

            // Validate and cast to full config (basic validation)
            if (newConfigPart && newConfigPart.name && newConfigPart.systemPrompt) {
                const fullConfig: NicheConfig = {
                    id: crypto.randomUUID(), // Generate a new ID
                    name: newConfigPart.name || 'Nova Persona',
                    description: newConfigPart.description || '',
                    systemPrompt: newConfigPart.systemPrompt,
                    imageStyleSuffix: newConfigPart.imageStyleSuffix || '',
                    sourceLabel: newConfigPart.sourceLabel || 'Contexto',
                    placeholder: newConfigPart.placeholder || 'Insira o tema...',
                    icon: 'Ghost' // Default icon
                };
                setGeneratedConfig(fullConfig);
                setMessages(prev => [...prev, { role: 'assistant', content: `Criei uma configuração para "${fullConfig.name}". Veja o preview ao lado. O que achou? Podemos ajustar se quiser.` }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: 'Não consegui gerar uma configuração completa. Poderia me dar mais detalhes?' }]);
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Ops, tive um erro ao processar seu pedido na IA.' }]);
        } finally {
            setIsThinking(false);
        }
    };

    const handleSave = () => {
        if (generatedConfig) {
            addCustomPersona(generatedConfig);
            onClose();
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 w-full max-w-5xl h-[80vh] rounded-3xl border border-slate-800 shadow-2xl flex overflow-hidden animate-fade-in">

                {/* Chat Section */}
                <div className="w-1/2 flex flex-col border-r border-slate-800">
                    <div className="p-4 border-b border-slate-800 flex items-center gap-2 bg-slate-950/50">
                        <Wand2 className="w-5 h-5 text-indigo-400" />
                        <h3 className="font-bold text-white">Criador de Persona com IA</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'
                                    }`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {isThinking && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800 rounded-2xl p-3 rounded-tl-none flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                                    <span className="text-xs text-slate-400">Criando persona...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 bg-slate-950 border-t border-slate-800">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Ex: Quero um canal de curiosidades científicas..."
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={isThinking || !input.trim()}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl disabled:opacity-50 transition-colors"
                            >
                                <MessageSquare className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview Section */}
                <div className="w-1/2 flex flex-col bg-slate-950/30">
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                        <h3 className="font-bold text-slate-400 text-sm uppercase">Preview da Configuração</h3>
                        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {generatedConfig ? (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Nome da Persona</label>
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-white">{generatedConfig.name}</h2>
                                            <p className="text-slate-400 text-sm">{generatedConfig.description}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="group">
                                        <label className="text-xs font-bold text-indigo-400 uppercase mb-2 block">System Prompt (Personalidade)</label>
                                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 h-40 overflow-y-auto group-hover:border-indigo-500/50 transition-colors">
                                            {generatedConfig.systemPrompt}
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className="text-xs font-bold text-pink-400 uppercase mb-2 block">Image Style (Visual)</label>
                                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 group-hover:border-pink-500/50 transition-colors">
                                            {generatedConfig.imageStyleSuffix}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                                <Wand2 className="w-16 h-16 opacity-20" />
                                <p className="text-center max-w-xs">Converse com a IA ao lado para gerar automaticamente a configuração da sua nova persona.</p>
                            </div>
                        )}
                    </div>

                    {generatedConfig && (
                        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
                            <button
                                onClick={handleSave}
                                className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 transition-all hover:scale-[1.02]"
                            >
                                <Save className="w-5 h-5" /> Salvar e Usar Persona
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
