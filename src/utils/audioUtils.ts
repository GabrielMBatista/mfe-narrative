
/**
 * Utility to get audio duration from a URL (local blob or remote).
 * Used for accurate chapter calculation.
 */
export const getAudioDuration = (src: string): Promise<number> => {
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.preload = 'metadata';

        audio.onloadedmetadata = () => {
            if (audio.duration === Infinity) {
                // Fix for possible Infinity duration in some blob scenarios
                audio.currentTime = 1e101;
                audio.ontimeupdate = () => {
                    audio.ontimeupdate = null;
                    audio.currentTime = 0;
                    resolve(audio.duration);
                };
            } else {
                resolve(audio.duration);
            }
        };

        audio.onerror = (e) => reject("Erro ao carregar áudio para metadados.");
        audio.src = src;
    });
};

/**
 * Formats seconds into HH:MM:SS or MM:SS
 */
export const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const format = (n: number) => n.toString().padStart(2, '0');

    if (h > 0) {
        return `${format(h)}:${format(m)}:${format(s)}`;
    }
    return `${format(m)}:${format(s)}`;
};
