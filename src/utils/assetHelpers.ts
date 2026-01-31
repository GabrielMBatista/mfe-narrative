/**
 * Asset Helpers
 * Funções utilitárias para manipulação de assets (imagens, áudio)
 */

// Audio Utils
export const decodeBase64 = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

// Helper para salvar asset no disco via Vite Middleware
export const saveAssetLocally = async (
    base64: string,
    type: 'images' | 'audio',
    fileName: string,
    projectId?: string
): Promise<string> => {
    try {
        const response = await fetch('/api/save-asset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName, base64, type, projectId })
        });
        const data = await response.json();
        return data.url; // Retorna ex: /assets/projects/{projectId}/images/filename.png
    } catch (e) {
        console.error("Falha ao salvar asset localmente:", e);
        return base64; // Fallback para base64 se falhar
    }
};

export const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number = 24000,
    numChannels: number = 1,
): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
};

/**
 * Converte assets (imagens/áudio) de Base64 para arquivos locais
 * Utilizado para migração de projetos antigos
 */
export const convertAssetsToLocal = async (
    assets: Record<number, string>,
    type: 'images' | 'audio',
    projectId: string,
    prefix: string
): Promise<Record<number, string>> => {
    const converted: Record<number, string> = {};

    for (const [key, value] of Object.entries(assets)) {
        const index = parseInt(key);
        if (value.startsWith('data:') || value.startsWith('blob:')) {
            // É base64 ou blob antigo, converter para arquivo local
            const ext = type === 'images' ? 'jpg' : 'mp3';
            const fileName = `${prefix}_${index}_${Date.now()}.${ext}`;
            const localUrl = await saveAssetLocally(value, type, fileName, projectId);
            converted[index] = localUrl;
        } else {
            // Já é URL local ou caminho, manter
            converted[index] = value;
        }
    }

    return converted;
};
