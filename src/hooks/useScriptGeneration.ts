
import { useState, useCallback } from 'react';
import { generateScript } from '../services/geminiService';
import { createAutoVoiceMapping } from '../utils/voiceAutoAssign';
import { BibleScript, AppStatus } from '../types';
import { ModalType } from '../components/StatusModal';
import { useSettings } from '../contexts/SettingsContext';

interface UseScriptGenerationProps {
    currentNicheId: string;
    ttsProvider: 'gemini' | 'elevenlabs';
    setCurrentProjectId: (id: string) => void;
    setScript: (script: BibleScript | null) => void;
    setCharacterVoices: (voices: Record<string, string>) => void;
    setStatus: (status: AppStatus) => void;
    setError: (error: string | null) => void;
    setSampleImages: (images: Record<number, string>) => void;
    setSampleAudios: (audios: Record<number, string>) => void;
    setBackgroundMusic: (music: string | null) => void;
    setProjectThumbnail: (thumb: string | null) => void;
    handleGenerateAssets: (index: number, entry: any, seed: string, projectId: string) => Promise<void>;
    showNotification: (title: string, message: string, type: ModalType) => void;
}

export const useScriptGeneration = ({
    currentNicheId,
    ttsProvider,
    setCurrentProjectId,
    setScript,
    setCharacterVoices,
    setStatus,
    setError,
    setSampleImages,
    setSampleAudios,
    setBackgroundMusic,
    setProjectThumbnail,
    handleGenerateAssets,
    showNotification
}: UseScriptGenerationProps) => {
    const [theme, setTheme] = useState('');
    const [language, setLanguage] = useState('pt-BR');
    const { getEffectiveKeys, authMode, getEffectiveNiche } = useSettings();

    const handleGenerate = useCallback(async () => {
        if (!theme.trim()) return;
        setStatus(AppStatus.GENERATING_SCRIPT);
        setError(null);
        setSampleImages({});
        setSampleAudios({});
        setBackgroundMusic(null);
        setProjectThumbnail(null);

        const newProjectId = crypto.randomUUID();
        setCurrentProjectId(newProjectId);

        try {
            const keys = getEffectiveKeys();
            // Prepare ServiceConfig
            const serviceConfig = {
                apiKey: keys.gemini === 'PROXY_MODE' ? undefined : keys.gemini,
                useProxy: authMode === 'db',
                token: localStorage.getItem('admin_token') || undefined
            };

            const nicheConfig = getEffectiveNiche(currentNicheId);
            const result = await generateScript(theme, nicheConfig, serviceConfig, language);
            setScript(result);

            if (result.characters && result.characters.length > 0) {
                const autoMapping = createAutoVoiceMapping(result.characters, ttsProvider);
                setCharacterVoices(autoMapping);
            }

            setStatus(AppStatus.SUCCESS);
            if (result.timeline.length > 0) {
                handleGenerateAssets(0, result.timeline[0], result.visualSeed, newProjectId);
            }
        } catch (err: any) {
            setError("Erro ao gerar roteiro: " + err.message);
            setStatus(AppStatus.ERROR);
        }
    }, [
        theme, currentNicheId, ttsProvider, setCurrentProjectId, setScript,
        setCharacterVoices, setStatus, setError, setSampleImages,
        setSampleAudios, setBackgroundMusic, setProjectThumbnail,
        handleGenerateAssets, getEffectiveKeys, authMode, language, getEffectiveNiche
    ]);

    return {
        theme,
        setTheme,
        language,
        setLanguage,
        handleGenerate
    };
};
