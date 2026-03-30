
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { AppStatus } from '../types';
import { optimizeScene, reviewAndUpdateScript, generateThumbnailPrompt, translateScript } from '../services/geminiService';
import { fetchAvailableVoices, ELEVENLABS_VOICES } from '../services/elevenLabsService';
import { generateVideoThumbnail } from '../services/thumbnailService';
import { saveAssetLocally } from '../utils/assetHelpers';
import { useSettings } from '../contexts/SettingsContext';
import { ModalType } from '../components/StatusModal';
import { ThumbnailSuggestion } from '../types';

// Hooks
import { useProjectState } from './useProjectState';
import { useAssetGeneration } from './useAssetGeneration';
import { useAudioPlayer } from './useAudioPlayer';
import { useProjectActions } from './useProjectActions';
import { useVideoRender } from './useVideoRender';
import { useScriptGeneration } from './useScriptGeneration';

export const useStudioOrchestrator = () => {
    // Config & Auth from Context
    const { isLoggedIn, authMode, userKeys, getEffectiveKeys, getEffectiveNiche } = useSettings();
    const showLogin = (authMode === 'local' && !userKeys.gemini) || (authMode === 'db' && !isLoggedIn);

    // 1. Core State
    const projectState = useProjectState();
    // Destructure for easy access inside hook
    const {
        script, setScript,
        currentProjectId, setCurrentProjectId,
        currentNicheId, setCurrentNicheId,
        sampleImages, setSampleImages,
        sampleAudios, setSampleAudios,
        backgroundMusic, setBackgroundMusic,
        projectThumbnail, setProjectThumbnail,
        characterVoices, setCharacterVoices,
        ttsProvider, setTtsProvider,
        defaultGeminiVoice, setDefaultGeminiVoice,
        elevenLabsVoice, setElevenLabsVoice,
        availableVoices, setAvailableVoices,
        thumbnailPrompt, setThumbnailPrompt,
        setHasManualVoiceConfig,
        setSampleAlignments
    } = projectState;

    // Local UI State
    const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
    const [error, setError] = useState<string | null>(null);
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; message: string; type: ModalType }>({
        isOpen: false, title: "", message: "", type: "info"
    });
    const [showVoiceMapping, setShowVoiceMapping] = useState(false);
    const [isNarrationExpanded, setIsNarrationExpanded] = useState(false);
    const [activeModule, setActiveModule] = useState<'studio' | 'social'>('studio');
    const [showSettings, setShowSettings] = useState(false);

    // Specific Action States
    const [isReviewingScript, setIsReviewingScript] = useState(false);
    const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
    const [showTranslationModal, setShowTranslationModal] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [optimizingIndex, setOptimizingIndex] = useState<number | null>(null);
    const [editingPromptIndex, setEditingPromptIndex] = useState<number | null>(null);
    const [tempPrompt, setTempPrompt] = useState("");
    const [thumbnailSuggestions, setThumbnailSuggestions] = useState<ThumbnailSuggestion[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showNotification = useCallback((title: string, message: string, type: ModalType = 'info') => {
        setModalConfig({ isOpen: true, title, message, type });
    }, []);

    // 2. Initial Effects
    useEffect(() => {
        const fetchVoices = async () => {
            const keys = getEffectiveKeys();
            const apiKey = keys.elevenLabs;

            if (apiKey && apiKey !== 'PROXY_MODE') {
                try {
                    const voices = await fetchAvailableVoices({ apiKey: apiKey, useProxy: false });
                    if (voices.length > 0) setAvailableVoices(voices);
                } catch (e) { console.error("Failed to fetch voices", e); }
            } else {
                setAvailableVoices(ELEVENLABS_VOICES);
            }
        };
        fetchVoices();
    }, [userKeys.elevenLabs, authMode, getEffectiveKeys, setAvailableVoices]);

    // 3. Logic Hooks Initialization
    const assetGeneration = useAssetGeneration(
        currentProjectId, setCurrentProjectId, setSampleImages, setSampleAudios,
        characterVoices, ttsProvider, defaultGeminiVoice, elevenLabsVoice, currentNicheId, showNotification
    );

    const scriptGeneration = useScriptGeneration({
        currentNicheId, ttsProvider, setCurrentProjectId, setScript, setCharacterVoices,
        setStatus, setError, setSampleImages, setSampleAudios, setBackgroundMusic, setProjectThumbnail,
        handleGenerateAssets: assetGeneration.handleGenerateAssets, showNotification
    });

    const projectActions = useProjectActions({
        ...projectState, setScript, setHasManualVoiceConfig, setSampleAlignments,
        setCurrentNicheId, setCurrentProjectId, setSampleImages, setSampleAudios,
        setBackgroundMusic, setProjectThumbnail, setCharacterVoices, setTtsProvider,
        setDefaultGeminiVoice, setElevenLabsVoice, setThumbnailPrompt, showNotification,
        thumbnailSuggestions, setThumbnailSuggestions
    });

    const videoRender = useVideoRender({
        script, sampleImages, sampleAudios, backgroundMusic, characterVoices, ttsProvider,
        defaultGeminiVoice, elevenLabsVoice, projectThumbnail, showNotification
    });

    const audioPlayer = useAudioPlayer();

    // 4. Routing
    const router = useRouter();
    const projectId = router.query.projectId as string;
    const navigate = (path: string, options?: any) => router.push(path, undefined, { shallow: options?.replace });
    const location = { pathname: router.pathname };

    useEffect(() => {
        if (projectId && projectId !== currentProjectId) {
            projectActions.loadProjectById(projectId);
        }
    }, [projectId, projectActions.loadProjectById, currentProjectId]);

    useEffect(() => {
        if (currentProjectId) {
            if (location.pathname !== `/projects/${currentProjectId}`) navigate(`/projects/${currentProjectId}`, { replace: true });
        } else if (location.pathname !== '/') navigate('/', { replace: true });
    }, [currentProjectId, navigate, location.pathname]);

    // 4. Autosave
    useEffect(() => {
        if (!script || !currentProjectId) return;
        const timeout = setTimeout(() => {
            projectActions.handleSaveScenery(true);
        }, 2000);
        return () => clearTimeout(timeout);
    }, [script, sampleImages, sampleAudios, currentProjectId]);

    // 5. Handlers
    const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setBackgroundMusic(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const { getEffectiveKeys: getKeysForThumb, authMode: thumbAuthMode } = useSettings();

    const handleReviewScript = async () => {
        if (!script) return;
        setIsReviewingScript(true);
        try {
            const keys = getKeysForThumb();
            const config = {
                apiKey: keys.gemini === 'PROXY_MODE' ? undefined : keys.gemini,
                useProxy: thumbAuthMode === 'db',
                token: localStorage.getItem('admin_token') || undefined
            };
            const nicheConfig = getEffectiveNiche(currentNicheId);
            const updatedScript = await reviewAndUpdateScript(script, nicheConfig, config);
            if (window.confirm("A IA gerou uma nova versão do roteiro. Isso substituirá o conteúdo atual. Deseja continuar?")) {
                setScript(updatedScript);
                showNotification("Roteiro Atualizado", "Roteiro revisado com sucesso!", "success");
            }
        } catch (e: any) { showNotification("Erro na Revisão", e.message, "error"); }
        finally { setIsReviewingScript(false); }
    };

    const handleSuggestThumbnailPrompt = async () => {
        if (!script) return;
        setIsGeneratingThumbnail(true);
        try {
            const keys = getKeysForThumb();
            const config = {
                apiKey: keys.gemini === 'PROXY_MODE' ? undefined : keys.gemini,
                useProxy: thumbAuthMode === 'db',
                token: localStorage.getItem('admin_token') || undefined
            };
            const nicheConfig = getEffectiveNiche(currentNicheId);
            // Now fetching 3 suggestions instead of one prompt
            const suggestions = await import('../services/geminiService').then(m => m.generateThumbnailSuggestions(script, nicheConfig, config));
            setThumbnailSuggestions(suggestions);
            if (suggestions.length > 0) {
                // Set the first one as default for backward compatibility inputs
                setThumbnailPrompt(suggestions[0].prompt);
            }
            showNotification("Ideias Geradas", "3 opções de capa criadas para teste A/B!", "success");
        } catch (e: any) { showNotification("Erro", "Não foi possível sugerir prompts.", "error"); }
        finally { setIsGeneratingThumbnail(false); }
    };

    const handleTranslateScript = async (targetLanguage: string) => {
        if (!script) return;
        setIsTranslating(true);
        try {
            const keys = getKeysForThumb();
            const config = {
                apiKey: keys.gemini === 'PROXY_MODE' ? undefined : keys.gemini,
                useProxy: thumbAuthMode === 'db',
                token: localStorage.getItem('admin_token') || undefined
            };
            const nicheConfig = getEffectiveNiche(currentNicheId);
            const translatedScript = await translateScript(script, targetLanguage, nicheConfig, config);
            setScript(translatedScript);
            setSampleAudios({});
            const newProjectId = crypto.randomUUID();
            setCurrentProjectId(newProjectId);
            projectActions.handleSaveScenery(true);
            setShowTranslationModal(false);
            showNotification("Sucesso", `Roteiro traduzido para ${targetLanguage}`, "success");
        } catch (e: any) { showNotification("Erro na Tradução", e.message, "error"); }
        finally { setIsTranslating(false); }
    };

    const handleGenerateCustomThumbnail = async (specificPrompt?: string, overlayOptions?: { title: string, subtitle: string, color: string }) => {
        const promptToUse = specificPrompt || thumbnailPrompt;
        if (!promptToUse.trim()) return;

        setIsGeneratingThumbnail(true);
        try {
            const projectId = currentProjectId || crypto.randomUUID();
            if (!currentProjectId) setCurrentProjectId(projectId);
            const seed = script?.visualSeed || "123456";
            const keys = getKeysForThumb();
            const config = {
                apiKey: keys.gemini === 'PROXY_MODE' ? undefined : keys.gemini,
                useProxy: thumbAuthMode === 'db',
                token: localStorage.getItem('admin_token') || undefined
            };
            const nicheConfig = getEffectiveNiche(currentNicheId);

            // 1. Generate Image
            const base64 = await import('../services/geminiService').then(m => m.generateSampleImage(promptToUse, seed, nicheConfig, config));

            // 2. Apply Rasterization/Resize
            let finalImage = await generateVideoThumbnail(base64);

            // 3. Apply Text Overlay if requested
            if (overlayOptions) {
                finalImage = await import('../services/thumbnailService').then(m => m.overlayTextOnThumbnail(finalImage, {
                    title: overlayOptions.title,
                    subtitle: overlayOptions.subtitle,
                    titleColor: overlayOptions.color,
                    position: 'center', // Standard for viral thumbs
                    titleShadow: true
                }));
            }

            // 4. Save
            const rasterized = await generateVideoThumbnail(finalImage); // Ensure formatting
            await saveAssetLocally(rasterized, 'images', `cover_art_${Date.now()}.jpg`, projectId);
            setProjectThumbnail(rasterized);
            showNotification("Capa Atualizada", "Nova thumbnail criada com sucesso!", "success");
        } catch (e: any) { showNotification("Erro", "Não foi possível criar a capa.", "error"); }
        finally { setIsGeneratingThumbnail(false); }
    };

    const handleGenerateAllThumbnails = async () => {
        if (thumbnailSuggestions.length === 0) return;
        setIsGeneratingThumbnail(true);
        try {
            const projectId = currentProjectId || crypto.randomUUID();
            if (!currentProjectId) setCurrentProjectId(projectId);
            const seed = script?.visualSeed || "123456";
            const keys = getKeysForThumb();
            const config = {
                apiKey: keys.gemini === 'PROXY_MODE' ? undefined : keys.gemini,
                useProxy: thumbAuthMode === 'db',
                token: localStorage.getItem('admin_token') || undefined
            };
            const nicheConfig = getEffectiveNiche(currentNicheId);
            const geminiService = await import('../services/geminiService');
            const thumbService = await import('../services/thumbnailService');

            // Generate all images in parallel
            const updatedSuggestions = await Promise.all(thumbnailSuggestions.map(async (sugg) => {
                try {
                    // 1. Generate Base Image
                    const base64 = await geminiService.generateSampleImage(sugg.prompt, seed, nicheConfig, config);
                    let finalImage = await generateVideoThumbnail(base64);

                    // 2. Apply Text Overlay
                    finalImage = await thumbService.overlayTextOnThumbnail(finalImage, {
                        title: sugg.title,
                        subtitle: sugg.subtitle || "",
                        titleColor: sugg.color,
                        position: 'center',
                        titleShadow: true
                    });

                    // 3. Save locally
                    const fileName = `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.jpg`;
                    const savedPath = await saveAssetLocally(finalImage, 'images', fileName, projectId);

                    return { ...sugg, imageUrl: savedPath };
                } catch (e) {
                    console.error("Failed to generate suggestion image", e);
                    return sugg; // Return original without image on failure
                }
            }));

            setThumbnailSuggestions(updatedSuggestions);

            // If we successfully generated images, set the first one as main thumbnail if not already set?
            // Or just notify user.
            const firstSuccess = updatedSuggestions.find(s => s.imageUrl);
            if (firstSuccess && !projectThumbnail) {
                setProjectThumbnail(firstSuccess.imageUrl || null);
            }

            showNotification("Geração Concluída", "3 opções de thumbnails geradas!", "success");
        } catch (e: any) {
            showNotification("Erro", "Falha ao gerar lote de thumbnails.", "error");
        } finally {
            setIsGeneratingThumbnail(false);
        }
    };

    const handleUpdateThumbnail = async (newThumbnail: string) => {
        try {
            const projectId = currentProjectId || crypto.randomUUID();
            if (!currentProjectId) setCurrentProjectId(projectId);
            const savedPath = await saveAssetLocally(newThumbnail, 'images', `custom_thumb_${Date.now()}.png`, projectId);
            setProjectThumbnail(savedPath);
            showNotification("Sucesso", "Thumbnail atualizada com texto!", "success");
        } catch (e: any) { showNotification("Erro", "Falha ao salvar thumbnail.", "error"); }
    };

    const handleDownloadThumbnail = async () => {
        if (!projectThumbnail || !script) return;
        const a = document.createElement('a');
        a.href = projectThumbnail;
        a.download = `THUMBNAIL-${script.title.replace(/\s+/g, '-')}.png`;
        a.click();
    };

    const handleManualThumbnail = async (index: number) => {
        if (!sampleImages[index]) return;
        try {
            const thumb = await generateVideoThumbnail(sampleImages[index]);
            setProjectThumbnail(thumb);
            showNotification("Capa Atualizada", "Imagem definida como capa!", "success");
        } catch (e) { showNotification("Erro", "Falha ao definir capa.", "error"); }
    };

    const handleOptimizeScene = async (index: number) => {
        if (!script) return;
        setOptimizingIndex(index);
        try {
            const keys = getKeysForThumb();
            const config = {
                apiKey: keys.gemini === 'PROXY_MODE' ? undefined : keys.gemini,
                useProxy: thumbAuthMode === 'db',
                token: localStorage.getItem('admin_token') || undefined
            };
            const optimizedEntry = await optimizeScene(script.timeline[index], script.fullNarration, config);
            const newTimeline = [...script.timeline];
            newTimeline[index] = optimizedEntry;
            setScript({ ...script, timeline: newTimeline });
        } catch (e: any) { showNotification("Erro", e.message, "error"); }
        finally { setOptimizingIndex(null); }
    };

    const playSceneAudio = (index: number) => {
        audioPlayer.stopCurrentAudio();
        const source = sampleAudios[index];
        if (!source) return;
        const ctx = audioPlayer.getAudioContext();
        const play = async () => {
            try {
                if (ctx.state === 'suspended') await ctx.resume();
                const fetchUrl = source.startsWith('/') || source.startsWith('data:') || source.startsWith('http') ? source : `/${source}`;
                const response = await fetch(fetchUrl);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
                const bufferSource = ctx.createBufferSource();
                bufferSource.buffer = audioBuffer;
                bufferSource.connect(ctx.destination);
                bufferSource.start();
                bufferSource.onended = () => {
                    if (audioPlayer.isPreviewOpen) {
                        audioPlayer.setCurrentPreviewIndex(prev => (prev !== null && prev < (script?.timeline.length || 0) - 1) ? prev + 1 : prev);
                    }
                };
                audioPlayer.currentAudioSourceRef.current = bufferSource;
            } catch (e) { console.error(e); }
        };
        play();
    };

    useEffect(() => {
        if (audioPlayer.isPreviewOpen && audioPlayer.currentPreviewIndex !== null && script) {
            playSceneAudio(audioPlayer.currentPreviewIndex);
        } else {
            audioPlayer.stopCurrentAudio();
        }
    }, [audioPlayer.currentPreviewIndex, audioPlayer.isPreviewOpen]);

    const niche = getEffectiveNiche(currentNicheId);

    return {
        state: {
            showLogin, script, currentProjectId, currentNicheId, sampleImages, sampleAudios,
            backgroundMusic, projectThumbnail, characterVoices, ttsProvider, defaultGeminiVoice,
            elevenLabsVoice, availableVoices, thumbnailPrompt, status, error, modalConfig,
            showVoiceMapping, isNarrationExpanded, activeModule, showSettings, isReviewingScript,
            isGeneratingThumbnail, showTranslationModal, isTranslating, optimizingIndex,
            editingPromptIndex, tempPrompt, niche, thumbnailSuggestions
        },
        refs: { fileInputRef },
        setters: {
            setShowSettings, setModalConfig, setShowVoiceMapping, setIsNarrationExpanded,
            setActiveModule, setEditingPromptIndex, setTempPrompt, setShowTranslationModal,
            setCurrentNicheId, setCharacterVoices, setTtsProvider, setElevenLabsVoice, setThumbnailPrompt, setHasManualVoiceConfig
        },
        generated: {
            assetGeneration, scriptGeneration, projectActions, videoRender, audioPlayer
        },
        handlers: {
            handleMusicUpload, handleReviewScript, handleSuggestThumbnailPrompt, handleTranslateScript,
            handleGenerateCustomThumbnail, handleUpdateThumbnail, handleDownloadThumbnail, handleManualThumbnail,
            handleOptimizeScene, playSceneAudio, showNotification, handleGenerateAllThumbnails
        }
    };
};
