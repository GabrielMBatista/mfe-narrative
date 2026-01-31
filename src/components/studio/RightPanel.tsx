
import React from 'react';
import { Music, Upload } from 'lucide-react';
import ThumbnailPanel from '../ThumbnailPanel';
import VoicePlanningPanel from '../VoicePlanningPanel';
import { BibleScript } from '../../types';

interface RightPanelProps {
    script: BibleScript | null;
    projectThumbnail: string | null;
    thumbnailPrompt: string;
    setThumbnailPrompt: (prompt: string) => void;
    isGeneratingThumbnail: boolean;
    backgroundMusic: string | null;
    handlers: any;
    characterVoices: Record<string, string>;
    setCharacterVoices: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    ttsProvider: 'gemini' | 'elevenlabs';
    availableVoices: any[];
    thumbnailSuggestions?: any[];
}

export const RightPanel: React.FC<RightPanelProps> = ({
    script, projectThumbnail, thumbnailPrompt, setThumbnailPrompt,
    isGeneratingThumbnail, backgroundMusic, handlers, characterVoices,
    setCharacterVoices, ttsProvider, availableVoices, thumbnailSuggestions
}) => {
    if (!script) return null;

    return (
        <div className="space-y-8">
            <ThumbnailPanel
                projectThumbnail={projectThumbnail}
                thumbnailPrompt={thumbnailPrompt}
                setThumbnailPrompt={setThumbnailPrompt}
                isGeneratingThumbnail={isGeneratingThumbnail}
                onDownload={handlers.handleDownloadThumbnail}
                onSuggestPrompt={handlers.handleSuggestThumbnailPrompt}
                onGenerateCustom={handlers.handleGenerateCustomThumbnail}
                onUpdateThumbnail={handlers.handleUpdateThumbnail}
                thumbnailSuggestions={thumbnailSuggestions}
                handlers={handlers}
            />

            <VoicePlanningPanel
                script={script}
                characterVoices={characterVoices}
                setCharacterVoices={setCharacterVoices}
                ttsProvider={ttsProvider}
                availableVoices={availableVoices}
            />

            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
                <h4 className="text-sm font-black uppercase text-slate-500 mb-2 flex items-center gap-2"><Music className="w-4 h-4 text-amber-500" /> Trilha Sonora</h4>
                <label className="flex items-center gap-3 w-full cursor-pointer bg-slate-900 p-3 rounded-lg border border-slate-700 hover:bg-slate-800">
                    <Upload className="w-4 h-4 text-amber-500" />
                    <div>
                        <p className="text-xs font-bold text-slate-200">{backgroundMusic ? "Substituir Trilha" : "Upload Música"}</p>
                        {backgroundMusic && <p className="text-[10px] text-green-500">Selecionada</p>}
                    </div>
                    <input type="file" accept="audio/*" onChange={handlers.handleMusicUpload} className="hidden" />
                </label>
            </div>
        </div>
    );
};
