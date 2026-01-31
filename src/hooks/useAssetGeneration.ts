
import React, { useState, useCallback } from 'react';
import { TimelineEntry } from '../types';
import { generateSampleImage, generateSpeech, GEMINI_VOICES } from '../services/geminiService';
import { generateElevenLabsSpeech } from '../services/elevenLabsService';
import { saveAssetLocally } from '../utils/assetHelpers';
import { useSettings } from '../contexts/SettingsContext';

export interface LoadingAssets {
    [index: number]: {
        image: boolean;
        audio: boolean;
    };
}

export const useAssetGeneration = (
    currentProjectId: string | null,
    setCurrentProjectId: (id: string | null) => void,
    setSampleImages: React.Dispatch<React.SetStateAction<Record<number, string>>>,
    setSampleAudios: React.Dispatch<React.SetStateAction<Record<number, string>>>,
    characterVoices: Record<string, string>,
    ttsProvider: 'gemini' | 'elevenlabs',
    defaultGeminiVoice: string,
    elevenLabsVoice: string,
    currentNicheId: string,
    showNotification: (title: string, message: string, type?: 'info' | 'success' | 'error') => void
) => {
    const [loadingAssets, setLoadingAssets] = useState<LoadingAssets>({});
    const [isGeneratingAll, setIsGeneratingAll] = useState(false);
    const [genProgress, setGenProgress] = useState(0);

    const { getEffectiveKeys, authMode, getEffectiveNiche } = useSettings();

    // Helper to get fresh config
    const getServiceConfig = useCallback(() => {
        const keys = getEffectiveKeys();
        return {
            apiKey: keys.gemini === 'PROXY_MODE' ? undefined : keys.gemini, // Logic separation for Gemini vs Eleven handled in service? 
            // Actually, getEffectiveKeys returns {gemini: ..., eleven: ...}
            // Services expect 'apiKey' generic or specific?
            // geminiService expects `config.apiKey` to be the Gemini Key.
            // elevenService expects `config.apiKey` to be the Eleven Key.
            // We need to map correctly before calling.
            useProxy: authMode === 'db',
            token: localStorage.getItem('admin_token') || undefined
        };
    }, [getEffectiveKeys, authMode]);

    const handleGenerateImage = useCallback(async (
        index: number,
        prompt: string,
        seed: string,
        forcedProjectId?: string
    ) => {
        const projectId = forcedProjectId || currentProjectId || crypto.randomUUID();
        if (!currentProjectId && !forcedProjectId) setCurrentProjectId(projectId);

        setLoadingAssets(prev => ({ ...prev, [index]: { ...prev[index], image: true } }));

        try {
            console.log(`🖼️ Gerando imagem ${index} para projectId: ${projectId} no nicho ${currentNicheId}`);

            const config = getServiceConfig();
            // Map generic key to specific for this call? 
            // geminiService uses `config.apiKey` for Gemini.
            // If Local mode, we need keys.gemini.
            const keys = getEffectiveKeys();
            if (authMode === 'local') {
                config.apiKey = keys.gemini;
            }

            const nicheConfig = getEffectiveNiche(currentNicheId);
            const base64Image = await generateSampleImage(prompt, seed, nicheConfig, config);
            const localUrl = await saveAssetLocally(base64Image, 'images', `scene_${index}_${Date.now()}.jpg`, projectId);

            console.log(`✅ Imagem ${index} salva em: ${localUrl}`);
            setSampleImages(prev => ({ ...prev, [index]: localUrl }));
        } catch (err: any) {
            console.error(`Erro ao gerar imagem para o índice ${index}`, err);
            showNotification("Erro na Geração", `Não foi possível gerar a imagem para a cena ${index + 1}: ${err.message}`, 'error');
        } finally {
            setLoadingAssets(prev => ({ ...prev, [index]: { ...prev[index], image: false } }));
        }
    }, [currentProjectId, setCurrentProjectId, setSampleImages, currentNicheId, showNotification, getServiceConfig, getEffectiveKeys, authMode, getEffectiveNiche]);

    const handleGenerateAudio = useCallback(async (
        index: number,
        text: string,
        forcedProjectId?: string,
        speakerName?: string
    ) => {
        const projectId = forcedProjectId || currentProjectId || crypto.randomUUID();
        if (!currentProjectId && !forcedProjectId) setCurrentProjectId(projectId);

        setLoadingAssets(prev => ({ ...prev, [index]: { ...prev[index], audio: true } }));

        try {
            console.log(`🎤 Gerando áudio ${index} (Provider Global: ${ttsProvider}) para projectId: ${projectId}`);

            let base64Audio: string;
            let fileExtension: string;

            // 1. Determinação da Voz e Provedor (Smart Routing)
            let selectedVoice = ttsProvider === 'elevenlabs' ? elevenLabsVoice : defaultGeminiVoice;
            let selectedProvider = ttsProvider;
            let detectedCharacter = null;

            if (speakerName && characterVoices[speakerName]) {
                detectedCharacter = speakerName;
            }

            if (!detectedCharacter && Object.keys(characterVoices).length > 0) {
                const textLower = text.toLowerCase();
                // ... (Regex logic same as before, abbreviated here for brevity but assuming functionality is preserved if not modifying logic)
                // Re-implementing logic to ensure it exists
                const sortedCharacters = Object.keys(characterVoices).sort((a, b) => b.length - a.length);
                for (const charName of sortedCharacters) {
                    if (new RegExp(`${charName.toLowerCase()}\\s+(disse|falou|respondeu|perguntou)`, 'i').test(textLower) ||
                        (textLower.includes(charName.toLowerCase()) && (text.includes('"') || text.includes("'")))
                    ) {
                        detectedCharacter = charName;
                        break;
                    }
                }
            }

            if (detectedCharacter && characterVoices[detectedCharacter]) {
                const assignedVoice = characterVoices[detectedCharacter];
                selectedVoice = assignedVoice;
                const isGeminiVoice = GEMINI_VOICES.some(v => v.name === assignedVoice);
                selectedProvider = isGeminiVoice ? 'gemini' : 'elevenlabs';
            }

            // 2. Geração do Áudio
            const config = getServiceConfig();
            const keys = getEffectiveKeys();

            if (selectedProvider === 'elevenlabs') {
                console.log(`🔊 Usando ElevenLabs (${selectedVoice})`);

                // Config Specifics for Eleven
                if (authMode === 'local') {
                    config.apiKey = keys.elevenLabs; // USE ELEVEN KEY
                }

                base64Audio = await generateElevenLabsSpeech(text, config, { voice_id: selectedVoice });
                fileExtension = 'mp3';

            } else {
                console.log(`✨ Usando Gemini TTS (${selectedVoice})`);

                // Config Specifics for Gemini
                if (authMode === 'local') {
                    config.apiKey = keys.gemini; // USE GEMINI KEY
                }

                const geminiAudio = await generateSpeech(text, selectedVoice, config);
                base64Audio = geminiAudio.startsWith('data:') ? geminiAudio : `data:audio/wav;base64,${geminiAudio}`;
                fileExtension = 'wav';
            }

            const localUrl = await saveAssetLocally(base64Audio, 'audio', `narration_${index}_${Date.now()}.${fileExtension}`, projectId);
            setSampleAudios(prev => ({ ...prev, [index]: localUrl }));
        } catch (err: any) {
            console.error(`Erro ao gerar áudio ${index}`, err);
            showNotification("Erro na Geração", `Falha no áudio: ${err.message}`, 'error');
        } finally {
            setLoadingAssets(prev => ({ ...prev, [index]: { ...prev[index], audio: false } }));
        }
    }, [
        currentProjectId, setCurrentProjectId, setSampleAudios, characterVoices,
        ttsProvider, defaultGeminiVoice, elevenLabsVoice, showNotification,
        getServiceConfig, getEffectiveKeys, authMode
    ]);

    const handleGenerateAssets = useCallback(async (
        index: number,
        entry: TimelineEntry,
        seed: string,
        projectId?: string
    ) => {
        await Promise.all([
            handleGenerateImage(index, entry.imagePrompt, seed, projectId),
            handleGenerateAudio(index, entry.narration, projectId, entry.speaker)
        ]);
    }, [handleGenerateImage, handleGenerateAudio]);

    return {
        loadingAssets,
        isGeneratingAll,
        genProgress,
        setLoadingAssets,
        setIsGeneratingAll,
        setGenProgress,
        handleGenerateImage,
        handleGenerateAudio,
        handleGenerateAssets
    };
};
