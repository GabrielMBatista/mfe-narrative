import { useState, useCallback, useEffect } from 'react';
import { BibleScript, AppStatus } from '../types';
import { ELEVENLABS_VOICES, fetchAvailableVoices, ElevenLabsVoice } from '../services/elevenLabsService';

export const useProjectState = () => {
    const [script, setScript] = useState<BibleScript | null>(null);
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
    const [currentNicheId, setCurrentNicheId] = useState<string>('bible');
    const [sampleImages, setSampleImages] = useState<Record<number, string>>({});
    const [sampleAudios, setSampleAudios] = useState<Record<number, string>>({});
    const [backgroundMusic, setBackgroundMusic] = useState<string | null>(null);
    const [projectThumbnail, setProjectThumbnail] = useState<string | null>(null);
    const [characterVoices, setCharacterVoices] = useState<Record<string, string>>({});
    const [ttsProvider, setTtsProvider] = useState<'gemini' | 'elevenlabs'>('gemini');
    const [defaultGeminiVoice, setDefaultGeminiVoice] = useState<string>('Zephyr');
    const [elevenLabsVoice, setElevenLabsVoice] = useState<string>('JBFqnCBsd6RMkjVDRZzb');

    // ElevenLabs Voices Data
    const [availableVoices, setAvailableVoices] = useState<ElevenLabsVoice[]>(ELEVENLABS_VOICES);

    const [thumbnailPrompt, setThumbnailPrompt] = useState<string>('');
    const [hasManualVoiceConfig, setHasManualVoiceConfig] = useState<boolean>(false);
    const [sampleAlignments, setSampleAlignments] = useState<Record<number, any[]>>({});

    const resetProject = useCallback(() => {
        setScript(null);
        setCurrentProjectId(null);
        setSampleImages({});
        setSampleAudios({});
        setBackgroundMusic(null);
        setProjectThumbnail(null);
        setCharacterVoices({});
        setThumbnailPrompt('');
        setHasManualVoiceConfig(false);
        setSampleAlignments({});
    }, []);

    return {
        // State
        script,
        currentProjectId,
        currentNicheId,
        sampleImages,
        sampleAudios,
        backgroundMusic,
        projectThumbnail,
        characterVoices,
        ttsProvider,
        defaultGeminiVoice,
        elevenLabsVoice,
        availableVoices,
        thumbnailPrompt,
        hasManualVoiceConfig,
        sampleAlignments,

        // Setters
        setScript,
        setCurrentProjectId,
        setCurrentNicheId,
        setSampleImages,
        setSampleAudios,
        setBackgroundMusic,
        setProjectThumbnail,
        setCharacterVoices,
        setTtsProvider,
        setDefaultGeminiVoice,
        setElevenLabsVoice,
        setAvailableVoices,
        setThumbnailPrompt,
        setHasManualVoiceConfig,
        setSampleAlignments,

        // Actions
        resetProject
    };
};
