import { useState, useCallback } from 'react';
import { FullProject, BibleScript } from '../types';
import { webCodecsRenderer } from '../services/webCodecsRenderer';
import { ModalType } from '../components/StatusModal';

interface UseVideoRenderProps {
    script: BibleScript | null;
    sampleImages: Record<number, string>;
    sampleAudios: Record<number, string>;
    backgroundMusic: string | null;
    characterVoices: Record<string, string>;
    ttsProvider: 'gemini' | 'elevenlabs';
    defaultGeminiVoice: string;
    elevenLabsVoice: string;
    projectThumbnail: string | null;
    showNotification: (title: string, message: string, type: ModalType) => void;
}

export const useVideoRender = ({
    script,
    sampleImages,
    sampleAudios,
    backgroundMusic,
    characterVoices,
    ttsProvider,
    defaultGeminiVoice,
    elevenLabsVoice,
    projectThumbnail,
    showNotification
}: UseVideoRenderProps) => {
    const [isRendering, setIsRendering] = useState(false);
    const [renderProgress, setRenderProgress] = useState(0);
    const [renderStatus, setRenderStatus] = useState("");

    const handleExportVideo = useCallback(async () => {
        if (!script) return;
        setIsRendering(true);
        setRenderProgress(0);
        setRenderStatus("Iniciando motor de renderização...");

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

        const assetsToBlobUrls = async (assets: Record<number, string>, type: 'image' | 'audio') => {
            const newAssets: Record<number, string> = {};
            for (const [key, value] of Object.entries(assets)) {
                try {
                    const fetchUrl = value.startsWith('/') ? `${window.location.origin}${value}` : value;
                    const response = await fetch(fetchUrl);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    const blob = await response.blob();
                    newAssets[Number(key)] = URL.createObjectURL(blob);
                } catch (e) {
                    console.error(`Falha ao converter asset ${type} ${key} para BlobURL. URL tentada: ${value}`, e);
                    newAssets[Number(key)] = value; // Fallback
                }
            }
            return newAssets;
        };

        try {
            setRenderStatus("Otimizando assets (convertendo para binários locais)...");
            const blobImages = await assetsToBlobUrls(sampleImages, 'image');
            const blobAudios = await assetsToBlobUrls(sampleAudios, 'audio');

            const blob = await webCodecsRenderer.renderProject(
                fullProject,
                blobImages,
                blobAudios,
                backgroundMusic || undefined,
                (progress, status) => {
                    setRenderProgress(progress);
                    setRenderStatus(status);
                }
            );

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `VIDEO-FINAL-${script.title.toUpperCase().replace(/\s+/g, '-')}.mp4`;
            a.click();
            setRenderStatus("Renderização concluída!");
            showNotification("Sucesso", "Vídeo renderizado e baixado com sucesso!", "success");
        } catch (e: any) {
            console.error(e);
            showNotification("Erro de Renderização", `Falha ao renderizar vídeo: ${e.message}`, "error");
        } finally {
            setIsRendering(false);
        }
    }, [
        script, sampleImages, sampleAudios, backgroundMusic, characterVoices,
        ttsProvider, defaultGeminiVoice, elevenLabsVoice, projectThumbnail, showNotification
    ]);

    return {
        isRendering,
        renderProgress,
        renderStatus,
        handleExportVideo
    };
};
