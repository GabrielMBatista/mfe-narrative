
import { ServiceConfig } from './geminiService'; // Reuse config type

// ElevenLabs TTS Service

export interface ElevenLabsVoice {
    voice_id: string;
    name: string;
    category: string;
    description?: string;  // Descrição da voz
    gender?: 'male' | 'female'; // Gênero da voz
    age?: 'young' | 'middle-aged' | 'old'; // Idade aparente
}

// Vozes populares do ElevenLabs (lista expandida com características)
export const ELEVENLABS_VOICES: ElevenLabsVoice[] = [
    // Vozes Premium (Multilingual V2)
    {
        voice_id: 'ErXwobaYiN019PkySvjV',
        name: 'Antoni',
        category: 'premade',
        description: 'Voz masculina jovem, bem articulada e energética',
        gender: 'male',
        age: 'young'
    },
    {
        voice_id: 'VR6AewLTigWG4xSOukaG',
        name: 'Arnold',
        category: 'premade',
        description: 'Voz masculina madura, firme e autoritária',
        gender: 'male',
        age: 'middle-aged'
    },
    {
        voice_id: 'pNInz6obpgDQGcFmaJgB',
        name: 'Adam',
        category: 'premade',
        description: 'Voz masculina profunda e narrativa, ideal para documentários',
        gender: 'male',
        age: 'middle-aged'
    },
    {
        voice_id: 'EXAVITQu4vr4xnSDxMaL',
        name: 'Bella',
        category: 'premade',
        description: 'Voz feminina majéstica e serena, tom documental',
        gender: 'female',
        age: 'middle-aged'
    },
    {
        voice_id: 'MF3mGyEYCl7XYWbV9V6O',
        name: 'Elli',
        category: 'premade',
        description: 'Voz feminina jovem, expressiva e calorosa',
        gender: 'female',
        age: 'young'
    },
    {
        voice_id: 'TxGEqnHWrfWFTfGW9XjX',
        name: 'Josh',
        category: 'premade',
        description: 'Voz masculina jovem, casual e amigável',
        gender: 'male',
        age: 'young'
    },
    {
        voice_id: 'AZnzlk1XvdvUeBnXmlld',
        name: 'Domi',
        category: 'premade',
        description: 'Voz feminina confiante e assertiva',
        gender: 'female',
        age: 'young'
    },
    {
        voice_id: 'ThT5KcBeYPX3keUQqHPh',
        name: 'Dave',
        category: 'premade',
        description: 'Voz masculina britânica, clara e profissional',
        gender: 'male',
        age: 'middle-aged'
    },
    {
        voice_id: 'CYw3kZ02Hs0563khs1Fj',
        name: 'Freya',
        category: 'premade',
        description: 'Voz feminina americana madura e sofisticada',
        gender: 'female',
        age: 'middle-aged'
    },
    {
        voice_id: '21m00Tcm4TlvDq8ikWAM',
        name: 'Rachel',
        category: 'premade',
        description: 'Voz feminina calma e agradável, tom neutro',
        gender: 'female',
        age: 'young'
    },
    {
        voice_id: 'XB0fDUnXU5powFXDhCwa',
        name: 'Charlotte',
        category: 'premade',
        description: 'Voz feminina inglesa suave e refinada',
        gender: 'female',
        age: 'middle-aged'
    },
    {
        voice_id: 'IKne3meq5aSn9XLyUdCD',
        name: 'Charlie',
        category: 'premade',
        description: 'Voz masculina australiana casual e amigável',
        gender: 'male',
        age: 'young'
    },
    {
        voice_id: 'JBFqnCBsd6RMkjVDRZzb',
        name: 'George',
        category: 'premade',
        description: 'Voz masculina britânica madura e autoritária',
        gender: 'male',
        age: 'old'
    },
    {
        voice_id: 'N2lVS1w4EtoT3dr4eOWO',
        name: 'Callum',
        category: 'premade',
        description: 'Voz masculina escocesa forte e característica',
        gender: 'male',
        age: 'middle-aged'
    },
    {
        voice_id: 'piTKgcLEGmPE4e6mEKli',
        name: 'Nicole',
        category: 'premade',
        description: 'Voz feminina americana suave e melódica',
        gender: 'female',
        age: 'young'
    },
    {
        voice_id: 'yoZ06aMxZJJ28mfd3POQ',
        name: 'Sam',
        category: 'premade',
        description: 'Voz masculina jovem, dinâmica e versátil',
        gender: 'male',
        age: 'young'
    },
    {
        voice_id: 'GBv7mTt0atIp3Br8iCZE',
        name: 'Thomas',
        category: 'premade',
        description: 'Voz masculina americana madura e confiável',
        gender: 'male',
        age: 'middle-aged'
    },
    {
        voice_id: 'onwK4e9ZLuTAKqWW03F9',
        name: 'Daniel',
        category: 'premade',
        description: 'Voz masculina britânica profunda e autoritária',
        gender: 'male',
        age: 'middle-aged'
    },
    {
        voice_id: 'cjVigY5qzO86Huf0OWal',
        name: 'Lily',
        category: 'premade',
        description: 'Voz feminina britânica jovem e expressiva',
        gender: 'female',
        age: 'young'
    },
    {
        voice_id: 'XrExE9yKIg1WjnnlVkGX',
        name: 'Matilda',
        category: 'premade',
        description: 'Voz feminina americana calorosa e amigável',
        gender: 'female',
        age: 'middle-aged'
    },
    // ... (Existing voices)
    {
        voice_id: 'pqHfZKP75CvOlQylNhV4',
        name: 'Bill',
        category: 'premade',
        description: 'Voz masculina americana forte e confiável',
        gender: 'male',
        age: 'middle-aged'
    },
    {
        voice_id: 'nPckMiKJy0BkDjik8FW4',
        name: 'Brian',
        category: 'premade',
        description: 'Voz masculina americana profunda e narrativa',
        gender: 'male',
        age: 'middle-aged'
    },
    {
        voice_id: '2EiwWnXFnvU5JabPnv8n',
        name: 'Clyde',
        category: 'premade',
        description: 'Voz masculina americana grave e rouca',
        gender: 'male',
        age: 'middle-aged'
    },
    {
        voice_id: 'zrHiDhphv9ZnVXBqCLjz',
        name: 'Mimi',
        category: 'premade',
        description: 'Voz feminina australiana infantil e fofa',
        gender: 'female',
        age: 'young'
    },
    {
        voice_id: 'D38z5RcWu1voky8WS1ja',
        name: 'Fin',
        category: 'premade',
        description: 'Voz masculina irlandesa energética e rápida',
        gender: 'male',
        age: 'young'
    },
];

export interface ElevenLabsTTSOptions {
    voice_id: string;
    model_id?: string;
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
}

/**
 * Gera áudio usando ElevenLabs Text-to-Speech API
 * Docs: https://elevenlabs.io/docs/api-reference/text-to-speech
 */
export async function generateElevenLabsSpeech(
    text: string,
    config: ServiceConfig,
    options: Partial<ElevenLabsTTSOptions> = {}
): Promise<string> {
    const {
        voice_id = 'ErXwobaYiN019PkySvjV', // Antoni (default)
        model_id = 'eleven_multilingual_v2',
        stability = 0.5,
        similarity_boost = 0.75,
        style = 0.0,
        use_speaker_boost = true
    } = options;

    if (config.useProxy) {
        // PROXY CALL
        const res = await fetch('/api/generate/elevenlabs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.token}`
            },
            body: JSON.stringify({
                text,
                voice_id,
                model_id,
                voice_settings: { stability, similarity_boost, style, use_speaker_boost }
            })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'ElevenLabs Proxy Error');
        }

        const data = await res.json();
        // Proxy returns { audioBase64: '...' }
        return `data:audio/mpeg;base64,${data.audioBase64}`;

    } else {
        // DIRECT CALL
        if (!config.apiKey) throw new Error("API Key obrigatória para modo Visitante (ElevenLabs).");

        const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': config.apiKey
            },
            body: JSON.stringify({
                text,
                model_id,
                voice_settings: {
                    stability,
                    similarity_boost,
                    style,
                    use_speaker_boost
                }
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`ElevenLabs API error (${response.status}): ${error}`);
        }

        const audioBlob = await response.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                const base64Only = dataUrl.split(',')[1];
                resolve(base64Only);
            };
            reader.onerror = reject;
            reader.readAsDataURL(audioBlob);
        });

        return `data:audio/mpeg;base64,${base64}`;
    }
}

/**
 * Gera áudio com timestamps (alignment data)
 * Note: Proxy for timestamps not strictly implemented yet in `api/generate/elevenlabs.ts`,
 * defaulting to Client Side only for now or throwing if proxy used?
 * Planning: Let's assume for now Timestamp generation is a "Pro" feature user might want.
 * Currently, I'll only update signature to match, but if Proxy is used, I should probably throw "Not Implemented" unless I update the proxy.
 * Given urgency, let's keep it for direct use (Guest) or warn.
 */
export async function generateElevenLabsSpeechWithTimestamps(
    text: string,
    config: ServiceConfig,
    options: Partial<ElevenLabsTTSOptions> = {}
): Promise<{
    audio: string; // base64
    alignment: {
        characters: string[];
        character_start_times_seconds: number[];
        character_end_times_seconds: number[];
    };
}> {
    if (config.useProxy) {
        throw new Error("Alignment generation not yet supported via Proxy (Admin Mode). Please use Guest Mode keys directly if needed.");
    }

    if (!config.apiKey) throw new Error("API Key required.");

    const {
        voice_id = 'ErXwobaYiN019PkySvjV',
        model_id = 'eleven_multilingual_v2',
        stability = 0.5,
        similarity_boost = 0.75,
        style = 0.0,
        use_speaker_boost = true
    } = options;

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}/with-timestamps`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'xi-api-key': config.apiKey
        },
        body: JSON.stringify({
            text,
            model_id,
            voice_settings: {
                stability,
                similarity_boost,
                style,
                use_speaker_boost
            }
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`ElevenLabs API error (${response.status}): ${error}`);
    }

    const data = await response.json();

    return {
        audio: `data:audio/mpeg;base64,${data.audio_base64}`,
        alignment: data.alignment
    };
}

/**
 * Busca TODAS as vozes disponíveis na conta do usuário
 */
export async function fetchAvailableVoices(config: ServiceConfig): Promise<ElevenLabsVoice[]> {
    if (config.useProxy) {
        // Proxy doesn't implement get-voices yet. Return static list to prevent breakage.
        return ELEVENLABS_VOICES;
    }

    if (!config.apiKey) return ELEVENLABS_VOICES;

    const url = 'https://api.elevenlabs.io/v1/voices';

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'xi-api-key': config.apiKey
            }
        });

        if (!response.ok) return ELEVENLABS_VOICES;

        const data = await response.json();

        return data.voices.map((voice: any) => {
            const labels = voice.labels || {};
            const gender = labels.gender || 'unknown';
            const age = labels.age || 'unknown';
            const description = labels.description || labels.accent || voice.description || '';

            return {
                voice_id: voice.voice_id,
                name: voice.name,
                category: voice.category || 'generated',
                description: description,
                gender: gender,
                age: age
            };
        });
    } catch (error) {
        console.warn('Erro ao buscar vozes:', error);
        return ELEVENLABS_VOICES;
    }
}
