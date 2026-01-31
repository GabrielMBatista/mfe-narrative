
import { GoogleGenAI, Type } from "@google/genai";
import { GenerationResult, PlatformSEO } from "../types/socialSeoTypes";

export interface ServiceConfig {
    apiKey?: string;
    useProxy?: boolean;
    token?: string;
}

// Reuse the common generation logic pattern from the main project to support Proxy/Direct modes
async function generateContentCommon(
    config: ServiceConfig,
    model: string,
    contents: any,
    generationConfig?: any,
    isImage = false,
    retries = 3
) {
    // Fallback logic for Social SEO as well
    const FALLBACK_MODELS: Record<string, string> = {
        'gemini-2.5-flash': 'gemini-2.5-flash',
        'gemini-3-flash-preview': 'gemini-2.5-flash',
        'gemini-2.5-flash-image': 'gemini-1.5-pro'
    };
    let currentModel = model;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            if (config.useProxy) {
                const res = await fetch('/api/generate/gemini', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.token}`
                    },
                    body: JSON.stringify({
                        modelName: currentModel,
                        contents,
                        config: generationConfig
                    })
                });

                if (!res.ok) {
                    const err = await res.json();
                    if ((res.status === 503 || res.status === 429) && FALLBACK_MODELS[currentModel]) {
                        console.warn(`Model ${currentModel} busy (Social Proxy). Switching to ${FALLBACK_MODELS[currentModel]}`);
                        currentModel = FALLBACK_MODELS[currentModel];
                        continue;
                    }
                    throw new Error(err.error || 'Proxy Error');
                }
                return await res.json();
            } else {
                if (!config.apiKey) throw new Error("API Key required");
                const ai = new GoogleGenAI({ apiKey: config.apiKey });
                try {
                    return await ai.models.generateContent({
                        model: currentModel,
                        contents,
                        config: generationConfig
                    });
                } catch (sdkError: any) {
                    if ((sdkError.message?.includes('503') || sdkError.status === 503) && FALLBACK_MODELS[currentModel]) {
                        console.warn(`Model ${currentModel} busy (Social SDK). Switching to ${FALLBACK_MODELS[currentModel]}`);
                        currentModel = FALLBACK_MODELS[currentModel];
                        continue;
                    }
                    throw sdkError;
                }
            }
        } catch (e: any) {
            if (attempt === retries) throw e;
            // Simple backoff if not switching models
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        }
    }
}

const extractTextFromResponse = (response: any): string => {
    if (!response) return "";
    if (typeof response.text === 'string') return response.text;
    if (typeof response.text === 'function') {
        try { return response.text(); } catch (e) { console.warn(e); }
    }
    // Handle proxy/raw structure
    const candidateText = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (candidateText) return candidateText;

    return typeof response === 'string' ? response : JSON.stringify(response);
};

export const generateSocialSEO = async (script: string, config: ServiceConfig, chapterContext?: string): Promise<GenerationResult> => {
    let prompt = `Analise cuidadosamente este roteiro de vídeo e gere SEO otimizado para postagem em redes sociais e YouTube. 
    Importante: No JSON de resposta, você DEVE incluir um campo de alto nível chamado 'titulo_otimizado' que representa o melhor título comercial para o projeto como um todo.
    
    Roteiro para análise: ${script}`;

    if (chapterContext) {
        prompt += `\n\n[CONTEXTO DE CAPÍTULOS/TIMESTAMPS REAIS]
        Utilize EXATAMENTE os seguintes timestamps para a descrição do YouTube (YouTube Long). NÃO invente tempos, use estes que foram calculados baseados na duração real dos áudios:
        ${chapterContext}
        
        Na descrição, integre estes capítulos de forma natural.`;
    }

    prompt += `\n\nDiretrizes específicas por plataforma:
    1. YouTube Shorts: Título de impacto (máx 60 chars), focado em loop e hashtags no título.
    2. YouTube Standard (Long-form): Título focado em SEARCH SEO (máx 100 chars). Descrição muito detalhada contendo capítulos sugeridos (Timestamps), resumo atraente para o algoritmo e palavras-chave.
    3. Instagram Reels: Legenda estética, uso estratégico de emojis, foco em salvamentos e compartilhamentos.
    4. Facebook Reels: Título direto e legenda que estimula comentários.
    5. Kwai: Título com gatilho de curiosidade extrema.
    6. TikTok: Legenda curta, trend-driven, e exatamente 5 hashtags virais específicas do nicho.
    
    Idioma: Português do Brasil.
    Retorne APENAS o JSON.`;

    const response = await generateContentCommon(config, "gemini-3-flash-preview", prompt, {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                titulo_otimizado: { type: Type.STRING },
                youtube: {
                    type: Type.OBJECT,
                    properties: {
                        platform: { type: Type.STRING },
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        isManual: { type: Type.BOOLEAN }
                    },
                    required: ["platform", "title", "description", "hashtags", "isManual"]
                },
                youtubeLong: {
                    type: Type.OBJECT,
                    properties: {
                        platform: { type: Type.STRING },
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        isManual: { type: Type.BOOLEAN }
                    },
                    required: ["platform", "title", "description", "hashtags", "isManual"]
                },
                instagram: {
                    type: Type.OBJECT,
                    properties: {
                        platform: { type: Type.STRING },
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        isManual: { type: Type.BOOLEAN }
                    },
                    required: ["platform", "title", "description", "hashtags", "isManual"]
                },
                facebook: {
                    type: Type.OBJECT,
                    properties: {
                        platform: { type: Type.STRING },
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        isManual: { type: Type.BOOLEAN }
                    },
                    required: ["platform", "title", "description", "hashtags", "isManual"]
                },
                kwai: {
                    type: Type.OBJECT,
                    properties: {
                        platform: { type: Type.STRING },
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        isManual: { type: Type.BOOLEAN }
                    },
                    required: ["platform", "title", "description", "hashtags", "isManual"]
                },
                tiktok: {
                    type: Type.OBJECT,
                    properties: {
                        platform: { type: Type.STRING },
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        isManual: { type: Type.BOOLEAN }
                    },
                    required: ["platform", "title", "description", "hashtags", "isManual"]
                }
            },
            required: ["titulo_otimizado", "youtube", "youtubeLong", "instagram", "facebook", "kwai", "tiktok"]
        }
    });

    const text = extractTextFromResponse(response);
    return JSON.parse(text.trim());
};

export const generateSocialThumbnail = async (prompt: string, aspectRatio: "16:9" | "9:16", config: ServiceConfig): Promise<string> => {
    const finalPrompt = `${prompt}. Professional digital photography, vibrant colors, cinematic composition, high definition. NO TEXT, NO CHARACTERS OR WORDS.`;

    // Using gemini-2.5-flash-image for dedicated image generation
    try {
        const response = await generateContentCommon(config, 'gemini-2.5-flash-image', { parts: [{ text: finalPrompt }] }, {
            // @ts-ignore
            responseModalities: ["IMAGE"],
            generationConfig: {
                responseMimeType: "image/jpeg",
                // @ts-ignore
                aspectRatio: aspectRatio
            }
        }, true);

        // Handle proxy vs direct structure
        const candidate = response.candidates?.[0];
        // Proxy might return similar structure.

        let data = null;
        if (candidate?.content?.parts?.[0]?.inlineData?.data) {
            data = candidate.content.parts[0].inlineData.data;
        }

        if (data) {
            return `data:image/jpeg;base64,${data}`;
        }

        throw new Error("No image data returned compatible with standard GemAI response");
    } catch (e) {
        console.error("Gemini Thumbnail Error", e);
        // Add fallback logic here if needed (like Pollinations from the other service)
        // For now sticking to Gemini as per source repo
        throw e;
    }
};
