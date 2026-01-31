
import React from 'react';
import { RefreshCw } from 'lucide-react';
import ProjectsModal from '../ProjectsModal';
import TranslationModal from '../TranslationModal';
import StatusModal, { ModalType } from '../StatusModal';
import VoiceMappingModal from '../VoiceMappingModal';
import PreviewModal from '../PreviewModal';
import { SettingsModal } from '../SettingsModal';
import { BibleScript } from '../../types';

interface StudioModalsProps {
    projectActions: any;
    showTranslationModal: boolean;
    setShowTranslationModal: (show: boolean) => void;
    handlers: any;
    isTranslating: boolean;
    modalConfig: { isOpen: boolean; title: string; message: string; type: ModalType };
    setModalConfig: (config: any) => void;
    showVoiceMapping: boolean;
    setShowVoiceMapping: (show: boolean) => void;
    script: BibleScript | null;
    characterVoices: Record<string, string>;
    setCharacterVoices: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    ttsProvider: 'gemini' | 'elevenlabs';
    availableVoices: any[];
    setHasManualVoiceConfig: (has: boolean) => void;
    audioPlayer: any;
    sampleImages: Record<number, string>;
    sampleAudios: Record<number, string>;
    showSettings: boolean;
    setShowSettings: (show: boolean) => void;
    videoRender: any;
}

export const StudioModals: React.FC<StudioModalsProps> = ({
    projectActions, showTranslationModal, setShowTranslationModal, handlers, isTranslating,
    modalConfig, setModalConfig, showVoiceMapping, setShowVoiceMapping, script,
    characterVoices, setCharacterVoices, ttsProvider, availableVoices, setHasManualVoiceConfig,
    audioPlayer, sampleImages, sampleAudios, showSettings, setShowSettings, videoRender
}) => {
    return (
        <>
            <ProjectsModal
                isOpen={projectActions.showProjectsModal}
                projects={projectActions.savedProjects}
                onClose={() => projectActions.setShowProjectsModal(false)}
                onOpenProject={projectActions.handleOpenProject}
                onDeleteProject={projectActions.handleDeleteSavedProject}
            />

            {videoRender.isRendering && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl max-w-sm w-full flex flex-col items-center gap-6 text-center">
                        <div className="relative w-20 h-20 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="40" cy="40" r="36" fill="transparent" stroke="#1e293b" strokeWidth="8" />
                                <circle
                                    cx="40" cy="40" r="36"
                                    fill="transparent"
                                    stroke="#f59e0b"
                                    strokeWidth="8"
                                    strokeDasharray="226.2"
                                    strokeDashoffset={226.2 - (226.2 * videoRender.renderProgress) / 100}
                                    strokeLinecap="round"
                                    className="transition-all duration-500 ease-out"
                                />
                            </svg>
                            <span className="absolute text-xl font-bold text-amber-500">{Math.round(videoRender.renderProgress)}%</span>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                                <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
                                Renderizando Vídeo
                            </h3>
                            <p className="text-slate-400 text-sm">{videoRender.renderStatus || "Processando..."}</p>
                        </div>
                    </div>
                </div>
            )}

            <TranslationModal
                isOpen={showTranslationModal}
                onClose={() => setShowTranslationModal(false)}
                onTranslate={handlers.handleTranslateScript}
                isTranslating={isTranslating}
            />

            <StatusModal
                isOpen={modalConfig.isOpen}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
            />

            <VoiceMappingModal
                isOpen={showVoiceMapping}
                onClose={() => setShowVoiceMapping(false)}
                characters={script?.characters || []}
                characterVoices={characterVoices}
                setCharacterVoices={setCharacterVoices}
                ttsProvider={ttsProvider}
                availableVoices={availableVoices}
                onSave={() => { setHasManualVoiceConfig(true); setShowVoiceMapping(false); projectActions.handleSaveScenery(true); }}
                onReset={() => { setCharacterVoices({}); setHasManualVoiceConfig(false); }}
            />

            <PreviewModal
                isOpen={audioPlayer.isPreviewOpen}
                onClose={() => audioPlayer.setIsPreviewOpen(false)}
                timeline={script?.timeline || []}
                images={sampleImages}
                audios={sampleAudios}
                currentIndex={audioPlayer.currentPreviewIndex || 0}
                onIndexChange={audioPlayer.setCurrentPreviewIndex}
            />

            <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
        </>
    );
};
