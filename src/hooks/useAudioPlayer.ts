import { useState, useRef, useCallback } from 'react';

export const useAudioPlayer = () => {
    const [isPlaying, setIsPlaying] = useState<{ [index: number]: boolean }>({});
    const [currentPreviewIndex, setCurrentPreviewIndex] = useState<number | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return audioContextRef.current;
    }, []);

    const stopCurrentAudio = useCallback(() => {
        if (currentAudioSourceRef.current) {
            try {
                currentAudioSourceRef.current.stop();
            } catch (e) {
                // Already stopped
            }
            currentAudioSourceRef.current = null;
        }
    }, []);

    return {
        // State
        isPlaying,
        currentPreviewIndex,
        isPreviewOpen,
        audioContextRef,
        currentAudioSourceRef,

        // Setters
        setIsPlaying,
        setCurrentPreviewIndex,
        setIsPreviewOpen,

        // Actions
        getAudioContext,
        stopCurrentAudio
    };
};
