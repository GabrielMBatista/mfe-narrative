import React, { useState } from 'react';
import { Languages, X, Wand2 } from 'lucide-react';

interface TranslationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTranslate: (language: string) => void;
    isTranslating: boolean;
}

const TranslationModal: React.FC<TranslationModalProps> = ({
    isOpen,
    onClose,
    onTranslate,
    isTranslating
}) => {
    const [selectedLanguage, setSelectedLanguage] = useState('en-US');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-500/10 rounded-xl">
                        <Languages className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Traduzir Roteiro</h3>
                        <p className="text-sm text-slate-400">Adapte todo o conteúdo para outro idioma</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="block space-y-2">
                        <span className="text-sm font-medium text-slate-300">Selecione o idioma de destino</span>
                        <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all cursor-pointer hover:bg-slate-900"
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
                    </label>

                    <div className="bg-yellow-900/20 border border-yellow-700/30 p-4 rounded-xl text-xs text-yellow-200/80 leading-relaxed">
                        ⚠️ A tradução irá gerar um novo roteiro e substituir o texto atual.
                        As narrações precisarão ser geradas novamente para o novo idioma.
                        As imagens e prompts visuais (em inglês) serão preservados.
                    </div>

                    <button
                        onClick={() => onTranslate(selectedLanguage)}
                        disabled={isTranslating}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        {isTranslating ? (
                            <>
                                <Wand2 className="w-5 h-5 animate-spin" /> Traduzindo...
                            </>
                        ) : (
                            <>
                                <Languages className="w-5 h-5" /> Confirmar Tradução
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TranslationModal;
