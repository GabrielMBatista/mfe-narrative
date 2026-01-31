import React, { useState, useCallback, useRef } from 'react';
import { ProjectRecord, saveProject, getAllProjects, deleteProject, getProject } from '../services/projectStorage';
import { FullProject, BibleScript, ThumbnailSuggestion } from '../types';
import { createAutoVoiceMapping } from '../utils/voiceAutoAssign';
import { saveAssetLocally } from '../utils/assetHelpers';
import { ModalType } from '../components/StatusModal';

interface UseProjectActionsProps {
    script: BibleScript | null;
    currentProjectId: string | null;
    setCurrentProjectId: (id: string | null) => void;
    sampleImages: Record<number, string>;
    setSampleImages: (images: Record<number, string>) => void;
    sampleAudios: Record<number, string>;
    setSampleAudios: (audios: Record<number, string>) => void;
    backgroundMusic: string | null;
    setBackgroundMusic: (music: string | null) => void;
    projectThumbnail: string | null;
    setProjectThumbnail: (thumb: string | null) => void;
    thumbnailPrompt: string;
    setThumbnailPrompt: (prompt: string) => void;
    characterVoices: Record<string, string>;
    setCharacterVoices: (voices: Record<string, string>) => void;
    ttsProvider: 'gemini' | 'elevenlabs';
    setTtsProvider: (provider: 'gemini' | 'elevenlabs') => void;
    defaultGeminiVoice: string;
    setDefaultGeminiVoice: (voice: string) => void;
    elevenLabsVoice: string;
    setElevenLabsVoice: (voice: string) => void;
    currentNicheId: string;
    setCurrentNicheId: (id: string) => void;
    setScript: (script: BibleScript | null) => void;
    setHasManualVoiceConfig: (has: boolean) => void;
    hasManualVoiceConfig: boolean;
    sampleAlignments: Record<number, any[]>;
    setSampleAlignments: (alignments: Record<number, any[]>) => void;
    thumbnailSuggestions: ThumbnailSuggestion[];
    setThumbnailSuggestions: (suggestions: ThumbnailSuggestion[]) => void;
    showNotification: (title: string, message: string, type: ModalType) => void;
}

export const useProjectActions = ({
    script,
    currentProjectId,
    setCurrentProjectId,
    sampleImages,
    setSampleImages,
    sampleAudios,
    setSampleAudios,
    backgroundMusic,
    setBackgroundMusic,
    projectThumbnail,
    setProjectThumbnail,
    thumbnailPrompt,
    setThumbnailPrompt,
    characterVoices,
    setCharacterVoices,
    ttsProvider,
    setTtsProvider,
    defaultGeminiVoice,
    setDefaultGeminiVoice,
    elevenLabsVoice,
    setElevenLabsVoice,
    currentNicheId,
    setCurrentNicheId,
    setScript,
    setHasManualVoiceConfig,
    hasManualVoiceConfig,
    sampleAlignments,
    setSampleAlignments,
    thumbnailSuggestions,
    setThumbnailSuggestions,
    showNotification
}: UseProjectActionsProps) => {
    const [savedProjects, setSavedProjects] = useState<ProjectRecord[]>([]);
    const [showProjectsModal, setShowProjectsModal] = useState(false);

    const loadProjects = useCallback(async () => {
        try {
            const projects = await getAllProjects();
            setSavedProjects(projects);
        } catch (e) {
            console.error("Falha ao carregar projetos", e);
        }
    }, []);

    // Carregar projetos sempre que o modal abrir
    React.useEffect(() => {
        if (showProjectsModal) {
            loadProjects();
        }
    }, [showProjectsModal, loadProjects]);

    const handleSaveScenery = useCallback(async (silent = false) => {
        if (!script) return;

        let thumbnail = projectThumbnail;
        // Tentar usar a primeira imagem como thumbnail se não houver uma definida
        if (!thumbnail && sampleImages[0]) {
            thumbnail = sampleImages[0];
        }

        const fullProject: FullProject = {
            script: script,
            images: sampleImages,
            audios: sampleAudios,
            backgroundMusic: backgroundMusic || undefined,
            exportDate: new Date().toISOString(),
            characterVoices: characterVoices,
            alignments: sampleAlignments,
            ttsProvider: ttsProvider,
            defaultGeminiVoice: defaultGeminiVoice,
            elevenLabsVoice: elevenLabsVoice,
            thumbnail: thumbnail || undefined,
            thumbnailPrompt: thumbnailPrompt || undefined,
            nicheId: currentNicheId,
            hasManualVoiceConfig: hasManualVoiceConfig,
            thumbnailSuggestions: thumbnailSuggestions,
            version: "3.9.3"
        };

        try {
            const projectId = currentProjectId || crypto.randomUUID();
            if (!currentProjectId) setCurrentProjectId(projectId);

            const cleanProject = JSON.parse(JSON.stringify(fullProject));
            await saveProject(cleanProject, projectId);
            await loadProjects();
            if (!silent) {
                showNotification("Sucesso", "Projeto salvo com segurança na biblioteca local!", "success");
            }
        } catch (e) {
            console.error(e);
            showNotification("Erro ao Salvar", "Não foi possível salvar o projeto no banco de dados local.", "error");
        }
    }, [
        script, sampleImages, sampleAudios, backgroundMusic, characterVoices,
        sampleAlignments, ttsProvider, defaultGeminiVoice, elevenLabsVoice,
        projectThumbnail, thumbnailPrompt, currentNicheId, hasManualVoiceConfig,
        thumbnailSuggestions,
        currentProjectId, setCurrentProjectId, loadProjects, showNotification
    ]);

    const cleanPath = (path: string) => {
        if (!path) return path;
        // 1. Normalize slashes
        let clean = path.replace(/\\/g, '/');

        // 2. Extract from /assets/ if present (handles absolute paths like D:/.../public/assets/...)
        const idx = clean.indexOf('/assets/');
        if (idx !== -1) {
            clean = clean.substring(idx);
        } else if (clean.startsWith('assets/')) {
            // 3. Ensure leading slash for relative paths
            clean = '/' + clean;
        }
        return clean;
    };

    const sanitizeAssets = (assets: Record<number, string>) => {
        const cleaned: Record<number, string> = {};
        Object.entries(assets).forEach(([k, v]) => {
            if (!v) return;
            cleaned[Number(k)] = cleanPath(v);
        });
        return cleaned;
    };

    const loadProjectById = useCallback(async (id: string) => {
        try {
            const fullProject = await getProject(id);

            if (!fullProject) {
                showNotification("Erro", "Projeto não encontrado no banco de dados local.", "error");
                return false;
            }

            setCurrentProjectId(fullProject.id);

            // Restaurar configurações de vozes
            let voicesToUse = fullProject.characterVoices || {};
            if (!fullProject.characterVoices && fullProject.script.characters?.length > 0) {
                const provider = fullProject.ttsProvider || ttsProvider;
                voicesToUse = createAutoVoiceMapping(fullProject.script.characters, provider);
            }
            setCharacterVoices(voicesToUse);

            if (fullProject.ttsProvider) setTtsProvider(fullProject.ttsProvider);
            if (fullProject.defaultGeminiVoice) setDefaultGeminiVoice(fullProject.defaultGeminiVoice);
            if (fullProject.elevenLabsVoice) setElevenLabsVoice(fullProject.elevenLabsVoice);

            if (fullProject.hasManualVoiceConfig !== undefined) {
                setHasManualVoiceConfig(fullProject.hasManualVoiceConfig);
            }

            setScript(fullProject.script);

            // Sanitize paths for Images and Audios
            setSampleImages(sanitizeAssets(fullProject.images || {}));
            setSampleAudios(sanitizeAssets(fullProject.audios || {}));

            setBackgroundMusic(fullProject.backgroundMusic || null);
            setSampleAlignments(fullProject.alignments || {});

            if (fullProject.thumbnail) setProjectThumbnail(cleanPath(fullProject.thumbnail));
            if (fullProject.thumbnailPrompt) setThumbnailPrompt(fullProject.thumbnailPrompt);
            if (fullProject.nicheId) setCurrentNicheId(fullProject.nicheId);
            if (fullProject.thumbnailSuggestions) setThumbnailSuggestions(fullProject.thumbnailSuggestions);


            setShowProjectsModal(false);
            showNotification("Projeto Carregado", "Projeto carregado com sucesso!", "success");
            return true;

        } catch (e) {
            console.error("Erro ao abrir projeto:", e);
            showNotification("Falha no Carregamento", "Não foi possível carregar o projeto.", "error");
            return false;
        }
    }, [
        setCurrentProjectId, setCharacterVoices, ttsProvider, setTtsProvider,
        setDefaultGeminiVoice, setElevenLabsVoice, setHasManualVoiceConfig,
        setScript, setSampleImages, setSampleAudios, setBackgroundMusic,
        setSampleAlignments, setProjectThumbnail, setThumbnailPrompt,
        setCurrentNicheId, showNotification
    ]);

    const handleOpenProject = useCallback(async (project: ProjectRecord) => {
        await loadProjectById(project.id);
    }, [loadProjectById]);

    const handleDeleteSavedProject = useCallback(async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Tem certeza que deseja excluir este projeto?")) {
            await deleteProject(id);
            await loadProjects();
        }
    }, [loadProjects]);

    const handleImportProject = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const fullProject = JSON.parse(event.target?.result as string) as FullProject;
                if (fullProject.script && fullProject.script.title) {
                    const newProjectId = crypto.randomUUID();
                    setCurrentProjectId(newProjectId);
                    setScript(fullProject.script);

                    // Restaurar configs
                    let voicesToUse = fullProject.characterVoices || {};
                    if (!fullProject.characterVoices && fullProject.script.characters?.length > 0) {
                        const provider = fullProject.ttsProvider || ttsProvider;
                        voicesToUse = createAutoVoiceMapping(fullProject.script.characters, provider);
                    }
                    setCharacterVoices(voicesToUse);

                    if (fullProject.ttsProvider) setTtsProvider(fullProject.ttsProvider);
                    if (fullProject.defaultGeminiVoice) setDefaultGeminiVoice(fullProject.defaultGeminiVoice);
                    if (fullProject.elevenLabsVoice) setElevenLabsVoice(fullProject.elevenLabsVoice);

                    // Assets conversion logic (Base64 -> Local)
                    const images = { ...fullProject.images };
                    const audios = { ...fullProject.audios };

                    for (const [key, val] of Object.entries(images)) {
                        if (val.startsWith('data:')) {
                            images[Number(key)] = await saveAssetLocally(val, 'images', `scene_${key}.png`, newProjectId);
                        }
                    }
                    for (const [key, val] of Object.entries(audios)) {
                        if (val.startsWith('data:') || (val.length > 500 && !val.includes('/'))) {
                            const base64 = val.startsWith('data:') ? val : `data:audio/wav;base64,${val}`;
                            audios[Number(key)] = await saveAssetLocally(base64, 'audio', `narration_${key}.wav`, newProjectId);
                        }
                    }

                    // Apply Sanitization to Imported Assets too
                    setSampleImages(sanitizeAssets(images));
                    setSampleAudios(sanitizeAssets(audios));

                    setBackgroundMusic(fullProject.backgroundMusic || null);
                    if (fullProject.thumbnail) setProjectThumbnail(cleanPath(fullProject.thumbnail));

                    showNotification("Sucesso", "Projeto importado com sucesso!", "success");
                } else {
                    throw new Error("Formato inválido");
                }
            } catch (e: any) {
                showNotification("Erro", "Erro ao importar: " + e.message, "error");
            }
        };
        reader.readAsText(file);
    }, [
        setCurrentProjectId, setScript, setCharacterVoices,
        ttsProvider, setTtsProvider, setDefaultGeminiVoice,
        setElevenLabsVoice, setSampleImages, setSampleAudios,
        setBackgroundMusic, setProjectThumbnail, showNotification
    ]);

    const handleExportFullProject = useCallback(() => {
        if (!script) return;
        const fullProject: FullProject = {
            script: script,
            images: sampleImages,
            audios: sampleAudios,
            backgroundMusic: backgroundMusic || undefined,
            exportDate: new Date().toISOString(),
            version: "3.9",
            characterVoices: characterVoices,
            ttsProvider: ttsProvider,
            defaultGeminiVoice: defaultGeminiVoice,
            elevenLabsVoice: elevenLabsVoice,
            thumbnail: projectThumbnail || undefined
        };
        const data = JSON.stringify(fullProject, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PROJETO-COMPLETO-${script.title.toUpperCase().replace(/\s+/g, '-')}.json`;
        a.click();
    }, [script, sampleImages, sampleAudios, backgroundMusic, characterVoices, ttsProvider, defaultGeminiVoice, elevenLabsVoice, projectThumbnail]);

    return React.useMemo(() => ({
        savedProjects,
        showProjectsModal,
        setShowProjectsModal,
        loadProjects,
        handleSaveScenery,
        handleOpenProject,
        loadProjectById,
        handleDeleteSavedProject,
        handleImportProject,
        handleExportFullProject
    }), [
        savedProjects,
        showProjectsModal,
        loadProjects,
        handleSaveScenery,
        handleOpenProject,
        loadProjectById,
        handleDeleteSavedProject,
        handleImportProject,
        handleExportFullProject
    ]);
};
