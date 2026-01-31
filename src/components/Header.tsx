import React from 'react';
import { BookOpen, Upload, Folder, Save, CheckCircle2 } from 'lucide-react';
import { NICHES } from '../config/nicheConfig';
import { BibleScript } from '../types';
import { PersonaSelector } from './PersonaSelector';

interface HeaderProps {
    currentNicheId: string;
    setCurrentNicheId: (id: string) => void;
    onImportClick: () => void;
    onShowProjects: () => void;
    onSave: () => void;
    script: BibleScript | null;
    activeModule: 'studio' | 'social';
    setActiveModule: (m: 'studio' | 'social') => void;
}

const Header: React.FC<HeaderProps> = ({
    currentNicheId,
    setCurrentNicheId,
    onImportClick,
    onShowProjects,
    onSave,
    script,
    activeModule,
    setActiveModule
}) => {
    return (
        <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-600 rounded-lg shadow-lg shadow-amber-900/20">
                        <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight hidden sm:block">Narrative Studio</h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-slate-800/50 p-1 rounded-xl border border-slate-700">
                        <button
                            onClick={() => setActiveModule('studio')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeModule === 'studio' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Studio
                        </button>
                        <button
                            onClick={() => setActiveModule('social')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeModule === 'social' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Social SEO
                        </button>
                    </div>

                    {activeModule === 'studio' && (
                        <div className="hidden md:block">
                            <PersonaSelector
                                currentNicheId={currentNicheId}
                                onSelectConfig={setCurrentNicheId}
                            />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    <button onClick={onImportClick} className="flex items-center gap-2 text-xs font-semibold hover:bg-slate-800 px-3 py-2 rounded-lg transition-colors text-slate-300">
                        <Upload className="w-4 h-4" /> <span className="hidden xs:inline">Importar</span>
                    </button>
                    <button onClick={onShowProjects} className="flex items-center gap-2 text-xs font-semibold hover:bg-slate-800 px-3 py-2 rounded-lg transition-colors text-amber-500">
                        <Folder className="w-4 h-4" /> <span className="hidden xs:inline">Meus Projetos</span>
                    </button>
                    {script && (
                        <button onClick={onSave} className="flex items-center gap-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white px-3 py-2 rounded-lg transition-colors shadow-lg shadow-amber-900/20">
                            <Save className="w-4 h-4" /> <span className="hidden xs:inline">Salvar</span>
                        </button>
                    )}
                    <div className="h-6 w-px bg-slate-800"></div>
                    <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium bg-slate-900 px-2 py-1 rounded border border-slate-800">
                        <CheckCircle2 className="w-3 h-3 text-green-500" /> FULL SYNC V3.8
                    </span>
                </div>
            </div>
        </header>
    );
};

export default Header;
