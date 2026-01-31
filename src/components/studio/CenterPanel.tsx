
import React from 'react';
import { ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';
import { BibleScript, AppStatus } from '../../types';
import ScriptInput from '../ScriptInput';
import ControlBar from '../ControlBar';
import Timeline from '../Timeline';
import { NicheConfig } from '../../config/nicheConfig';

interface CenterPanelProps {
    script: BibleScript | null;
    niche: NicheConfig;
    status: AppStatus;
    error: string | null;
    isNarrationExpanded: boolean;
    setIsNarrationExpanded: (expanded: boolean) => void;
    scriptGeneration: any;
    assetGeneration: any;
    sampleImages: Record<number, string>;
    sampleAudios: Record<number, string>;
    projectState: any; // Simplified for brevity, ideal to be specific
    handlers: any;
    audioPlayer: any;
    videoRender: any;
    projectActions: any;
}

export const CenterPanel: React.FC<CenterPanelProps> = ({
    script, niche, status, error, isNarrationExpanded, setIsNarrationExpanded,
    scriptGeneration, assetGeneration, sampleImages, sampleAudios, projectState, handlers,
    audioPlayer, videoRender, projectActions
}) => {
    return (
        <div className="lg:col-span-2 space-y-8">
            <ScriptInput
                niche={niche}
                theme={scriptGeneration.theme}
                setTheme={scriptGeneration.setTheme}
                language={scriptGeneration.language}
                setLanguage={scriptGeneration.setLanguage}
                status={status}
                onGenerate={scriptGeneration.handleGenerate}
            />

            {error && (
                <div className="max-w-3xl mx-auto mb-8 p-4 bg-red-900/30 border border-red-500/50 rounded-xl flex items-start gap-3 text-red-200">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p>{error}</p>
                </div>
            )}

            {script && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <ControlBar
                        script={script}
                        isGeneratingAll={assetGeneration.isGeneratingAll}
                        genProgress={assetGeneration.genProgress}
                        onGenerateAllAssets={() => {
                            if (!script?.timeline) return;
                            assetGeneration.setIsGeneratingAll(true);
                            let completed = 0;
                            const totalOps = script.timeline.length * 2;
                            const updateProgress = () => {
                                completed++;
                                assetGeneration.setGenProgress(Math.round((completed / totalOps) * 100));
                            };
                            const generateImages = async () => {
                                for (let i = 0; i < script.timeline.length; i++) {
                                    if (!sampleImages[i]) await assetGeneration.handleGenerateImage(i, script.timeline[i].imagePrompt, script.visualSeed);
                                    updateProgress();
                                }
                            };
                            const generateAudios = async () => {
                                for (let i = 0; i < script.timeline.length; i++) {
                                    if (!sampleAudios[i]) await assetGeneration.handleGenerateAudio(i, script.timeline[i].narration, undefined, script.timeline[i].speaker || 'Narrador');
                                    updateProgress();
                                }
                            };
                            Promise.all([generateImages(), generateAudios()]).then(() => {
                                assetGeneration.setIsGeneratingAll(false);
                                assetGeneration.setGenProgress(100);
                            });
                        }}
                        onRegenerateAllAudios={() => {
                            if (!script?.timeline) return;
                            assetGeneration.setIsGeneratingAll(true);
                            (async () => {
                                for (let i = 0; i < script.timeline.length; i++) {
                                    await assetGeneration.handleGenerateAudio(i, script.timeline[i].narration, undefined, script.timeline[i].speaker || 'Narrador');
                                    assetGeneration.setGenProgress(Math.round(((i + 1) / script.timeline.length) * 100));
                                }
                                assetGeneration.setIsGeneratingAll(false);
                            })();
                        }}
                        onGenerateMissingAudios={() => {
                            if (!script?.timeline) return;
                            assetGeneration.setIsGeneratingAll(true);
                            (async () => {
                                for (let i = 0; i < script.timeline.length; i++) {
                                    if (!sampleAudios[i]) await assetGeneration.handleGenerateAudio(i, script.timeline[i].narration, undefined, script.timeline[i].speaker || 'Narrador');
                                    assetGeneration.setGenProgress(Math.round(((i + 1) / script.timeline.length) * 100));
                                }
                                assetGeneration.setIsGeneratingAll(false);
                            })();
                        }}
                        onGenerateAllImages={() => {
                            if (!script?.timeline) return;
                            assetGeneration.setIsGeneratingAll(true);
                            (async () => {
                                for (let i = 0; i < script.timeline.length; i++) {
                                    if (!sampleImages[i]) await assetGeneration.handleGenerateImage(i, script.timeline[i].imagePrompt, script.visualSeed);
                                    assetGeneration.setGenProgress(Math.round(((i + 1) / script.timeline.length) * 100));
                                }
                                assetGeneration.setIsGeneratingAll(false);
                            })();
                        }}
                        onRegenerateAllImages={() => {
                            if (!script?.timeline) return;
                            assetGeneration.setIsGeneratingAll(true);
                            (async () => {
                                for (let i = 0; i < script.timeline.length; i++) {
                                    await assetGeneration.handleGenerateImage(i, script.timeline[i].imagePrompt, script.visualSeed);
                                    assetGeneration.setGenProgress(Math.round(((i + 1) / script.timeline.length) * 100));
                                }
                                assetGeneration.setIsGeneratingAll(false);
                            })();
                        }}
                        ttsProvider={projectState.ttsProvider} setTtsProvider={projectState.setters.setTtsProvider}
                        elevenLabsVoice={projectState.elevenLabsVoice} setElevenLabsVoice={projectState.setters.setElevenLabsVoice}
                        availableVoices={projectState.availableVoices}
                        onShowVoiceMapping={() => projectState.setters.setShowVoiceMapping(true)}
                        onTogglePreview={() => { audioPlayer.setIsPreviewOpen(!audioPlayer.isPreviewOpen); audioPlayer.setCurrentPreviewIndex(0); }}
                        loadingImagesCount={(script.timeline?.length || 0) - Object.keys(sampleImages || {}).length}
                        loadingAudiosCount={(script.timeline?.length || 0) - Object.keys(sampleAudios || {}).length}
                        onReviewScript={handlers.handleReviewScript} isReviewingScript={projectState.isReviewingScript}
                        onExportVideo={videoRender.handleExportVideo} isRendering={videoRender.isRendering}
                        onExportFullProject={projectActions.handleExportFullProject}
                        onOpenTranslation={() => projectState.setters.setShowTranslationModal(true)}
                    />

                    <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl">
                        <h3 className="text-4xl font-serif mb-4 text-white leading-tight">{script.title}</h3>
                        <div className="relative">
                            <div className={`text-slate-300 leading-relaxed italic ${isNarrationExpanded ? '' : 'max-h-[150px] overflow-hidden'}`}>
                                {script.fullNarration}
                            </div>
                            <button onClick={() => setIsNarrationExpanded(!isNarrationExpanded)} className="text-indigo-400 mt-2 text-sm flex items-center gap-1">
                                {isNarrationExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />} {isNarrationExpanded ? "Menos" : "Mais"}
                            </button>
                        </div>
                    </div>

                    <Timeline
                        script={script}
                        sampleImages={sampleImages} sampleAudios={sampleAudios}
                        loadingAssets={assetGeneration.loadingAssets}
                        optimizingIndex={projectState.optimizingIndex}
                        editingPromptIndex={projectState.editingPromptIndex}
                        tempPrompt={projectState.tempPrompt}
                        setEditingPromptIndex={projectState.setters.setEditingPromptIndex}
                        setTempPrompt={projectState.setters.setTempPrompt}
                        saveEditedPrompt={(i) => { const n = [...script.timeline]; n[i].imagePrompt = projectState.tempPrompt; projectState.setters.setScript({ ...script, timeline: n }); projectState.setters.setEditingPromptIndex(null); }}
                        characterVoices={projectState.characterVoices} ttsProvider={projectState.ttsProvider}
                        onPlayAudio={handlers.playSceneAudio}
                        onGenerateAudio={(i, t, s) => assetGeneration.handleGenerateAudio(i, t, undefined, s)}
                        onGeneratorImage={(i, p) => assetGeneration.handleGenerateImage(i, p, script.visualSeed)}
                        onGenerateAssets={(i, e) => assetGeneration.handleGenerateAssets(i, e, script.visualSeed)}
                        onOptimizeScene={handlers.handleOptimizeScene}
                        onManualThumbnail={handlers.handleManualThumbnail}
                        onSpeakerChange={(i, s) => { const n = [...script.timeline]; n[i].speaker = s; projectState.setters.setScript({ ...script, timeline: n }); }}
                    />
                </div>
            )}
        </div>
    );
};
