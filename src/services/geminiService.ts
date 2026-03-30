
import { GoogleGenAI } from "@google/genai";
import { BibleScript, TimelineEntry, ThumbnailSuggestion } from "../types";
import { NicheConfig, NICHES } from "../config/nicheConfig";

// Interface for configuration passed to services
export interface ServiceConfig {
  apiKey?: string;
  useProxy?: boolean;
  token?: string; // Token for proxy auth
}

// Vozes disponíveis do Gemini TTS
export interface GeminiVoice {
  name: string;
  description: string;
  gender: 'male' | 'female' | 'neutral';
}

export const GEMINI_VOICES: GeminiVoice[] = [
  { name: 'Puck', description: 'Voz masculina jovem e energética', gender: 'male' },
  { name: 'Charon', description: 'Voz masculina profunda e autoritária', gender: 'male' },
  { name: 'Kore', description: 'Voz feminina clara e expressiva', gender: 'female' },
  { name: 'Fenrir', description: 'Voz masculina grave e intensa', gender: 'male' },
  { name: 'Aoede', description: 'Voz feminina suave e melodiosa', gender: 'female' },
  { name: 'Zephyr', description: 'Voz neutra equilibrada e profissional', gender: 'neutral' },
];

// Helper to get client or proxy response
// Helper for delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to get client or proxy response with Retry Logic
async function generateContentCommon(
  config: ServiceConfig,
  model: string,
  contents: any,
  generationConfig?: any,
  isImage = false,
  retries = 3
) {
  let lastError: any;

  // Smart Fallback Map: If 'key' model fails with 503/Overloaded, try 'value'
  const FALLBACK_MODELS: Record<string, string> = {
    'gemini-2.5-flash': 'gemini-2.5-flash',      // 3.0 Pro -> 2.5 Flash (Stable, High Reasoning)
    'gemini-3-flash-preview': 'gemini-2.5-flash',    // 3.0 Flash -> 2.5 Flash (Reliable Replacement)
    'gemini-2.5-flash-image': 'gemini-1.5-pro'       // Image fallback to 1.5 Pro (Multimodal Stable)
  };

  let currentModel = model;


  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.warn(`Tentativa ${attempt} de ${retries} para ${currentModel}...`);
        await sleep(2000 * Math.pow(2, attempt - 1)); // Exponential backoff: 2s, 4s, 8s
      }

      if (config.useProxy) {
        // PROXY CALL
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
          const errText = await res.text();
          let errJson;
          try { errJson = JSON.parse(errText); } catch { errJson = { error: errText }; }

          if (res.status === 503 || res.status === 429) {
            console.warn(`Model ${currentModel} overloaded/unavailable (503).`);
            if (FALLBACK_MODELS[currentModel]) {
              console.warn(`Switching to fallback model: ${FALLBACK_MODELS[currentModel]}`);
              currentModel = FALLBACK_MODELS[currentModel];
              // Reset retries for the new model or just continue? 
              // Let's continue the loop but maybe we shouldn't sleep if switching?
              // For safety, just continue next loop iteration which will use new model.
              continue;
            }
            throw new Error(`Server Busy (Status ${res.status}): ${errJson.message || errText}`);
          }
          throw new Error(errJson.error || errJson.message || 'Proxy Error');
        }

        // Return raw result object simulating SDK return
        return await res.json();
      } else {
        // DIRECT SDK CALL
        if (!config.apiKey) throw new Error("API Key obrigatória para modo Visitante.");
        const ai = new GoogleGenAI({ apiKey: config.apiKey });
        try {
          return await ai.models.generateContent({
            model: currentModel,
            contents,
            config: generationConfig
          });
        } catch (sdkError: any) {
          // Check for overloaded/unavailable errors in SDK
          if (sdkError.message?.includes('503') || sdkError.message?.includes('429') || sdkError.status === 503 || sdkError.status === 429) {
            console.warn(`Model ${currentModel} overloaded/unavailable (SDK).`);
            if (FALLBACK_MODELS[currentModel]) {
              console.warn(`Switching to fallback model: ${FALLBACK_MODELS[currentModel]}`);
              currentModel = FALLBACK_MODELS[currentModel];
              continue;
            }
            throw sdkError; // Throw to trigger retry
          }
          throw sdkError; // Other errors, rethrow immediately
        }
      }
    } catch (e: any) {
      lastError = e;
      // If error is NOT a 503/429/Overloaded, throw immediately (don't retry authentication errors etc)
      const isRetryable =
        e.message?.includes('503') ||
        e.message?.includes('429') ||
        e.message?.includes('overloaded') ||
        e.message?.includes('UNAVAILABLE') ||
        e.message?.includes('quota') ||
        e.message?.includes('exhausted') ||
        e.message?.includes('INTERNAL') ||
        e.status === 500;

      if (!isRetryable) {
        throw e;
      }

      if (attempt === retries) {
        console.error(`Falha após ${retries} tentativas:`, e);
      }
    }
  }

  throw lastError;
}

// Helper safely extracts text from diverse SDK/Proxy response structures
const extractTextFromResponse = (response: any): string => {
  if (!response) return "";

  // 1. Text as property (New SDK / Simple JSON)
  if (typeof response.text === 'string') return response.text;

  // 2. Text as function (Standard GoogleGenerativeAI SDK)
  if (typeof response.text === 'function') {
    try {
      return response.text();
    } catch (e) {
      console.warn("Found .text() method but it failed:", e);
    }
  }

  // 3. Nested Candidates (Raw API / Proxy)
  const candidateText = response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (candidateText) return candidateText;

  // 4. Fallback for debugging (returns JSON string if nothing matches)
  return typeof response === 'string' ? response : JSON.stringify(response);
};

export const generateScript = async (topic: string, niche: NicheConfig, config: ServiceConfig, language: string = 'pt-BR'): Promise<BibleScript> => {

  const prompt = `
    ${niche.systemPrompt}
    
    TEMA/TÓPICO: "${topic}".
    IDIOMA DE SAÍDA: "${language}" (O JSON deve estar neste idioma, independentemente do idioma do input).

    REGRAS GERAIS:
    1. 'fullNarration' deve ser um texto longo e robusto, refletindo o conteúdo somado de todas as cenas.
    2. CADA bloco da timeline DEVE ter uma narração específica que, quando lida em sequência, conte a história/aula completa.
    3. 'visualSeed' deve ser um número aleatório de 6 dígitos para consistência.
    4. 'cameraMovement' deve ser escolhido entre: 'zoom_in', 'zoom_out', 'pan_left', 'pan_right', 'static'.
    5. 'focusPoint' deve indicar onde o "zoom" ou atenção deve estar.
    6. ⚠️ CRÍTICO - IDENTIFICAÇÃO DE VOZ (campo 'speaker' OBRIGATÓRIO):
       
       REGRA FUNDAMENTAL:
       • NARRADOR (speaker vazio ou "Narrador"): Tudo que for contexto, descrição, introdução
       • PERSONAGEM (speaker = nome): APENAS falas diretas, citações entre aspas, diálogos
       
       EXEMPLOS PRÁTICOS:
       
       ✅ NARRADOR (speaker: ""):
       - "Nas encostas verdejantes da Galileia, Jesus ensinava."
       - "Ele não estava oferecendo descanso no sentido comum."
       - "Esta passagem revela o amor incondicional de Deus."
       - "Jesus se aproximou dos discípulos."
       
       ✅ PERSONAGEM (speaker: "Jesus"):
       - "Vinde a mim, todos os que estais cansados."
       - "Tomai o meu jugo sobre vós."
       - "Eu sou o caminho, a verdade e a vida."
       
       ⚠️ DIVISÃO OBRIGATÓRIA:
       Se uma narração mistura contexto + citação, DIVIDA em cenas separadas:
       
       ERRADO (misturado):
       "Jesus não disse 'larguem tudo'. Ele disse 'tomai o meu jugo'." → UMA cena (CONFUSO!)
       
       CORRETO (separado):
       • Cena 1: "Jesus não estava mandando largar tudo." (speaker: "")
       • Cena 2: "Tomai o meu jugo sobre vós." (speaker: "Jesus")
       
       Isso garante vozes corretas e ritmo natural.
    
    Retorne o JSON completo no formato solicitado.
  `;

  // Modelo mais capaz para roteiro completo
  const response = await generateContentCommon(config, 'gemini-2.5-flash', prompt, {
    responseMimeType: "application/json",
    responseSchema: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        fullNarration: { type: "STRING" },
        backgroundMusicPrompt: { type: "STRING" },
        characters: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" },
              voiceType: { type: "STRING" },
              description: { type: "STRING" }
            },
            required: ["name", "voiceType", "description"]
          }
        },
        visualSeed: { type: "STRING" },
        timeline: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              timestamp: { type: "STRING" },
              narration: { type: "STRING" },
              imagePrompt: { type: "STRING" },
              speaker: { type: "STRING" },
              cameraMovement: {
                type: "STRING",
                enum: ['zoom_in', 'zoom_out', 'pan_left', 'pan_right', 'static']
              },
              focusPoint: {
                type: "STRING",
                enum: ['center', 'top_left', 'top_right', 'bottom_left', 'bottom_right']
              }
            },
            required: ["timestamp", "narration", "imagePrompt", "speaker", "cameraMovement", "focusPoint"]
          }
        },
        framingOrientations: { type: "STRING" },
        biblicalSource: { type: "STRING" }
      },
      required: ["title", "fullNarration", "characters", "visualSeed", "timeline", "framingOrientations", "biblicalSource", "backgroundMusicPrompt"]
    }
  });

  // Extract text safely from SDK or JSON response
  // Extract text safely using the helper
  const text = extractTextFromResponse(response);


  // Parse if it's a string, or if proxy returned object check if it's already parsed?
  // Gemini 1.5/2.0 returns structured output if requested?
  // When responseMimeType is json, text() returns string JSON.

  if (typeof text !== 'string') throw new Error("Formato de resposta inesperado");
  return JSON.parse(text.trim()) as BibleScript;
};

export const generateSampleImage = async (prompt: string, seed: string, niche: NicheConfig, config: ServiceConfig): Promise<string> => {
  const fullPrompt = `${prompt}. ${niche.imageStyleSuffix} Consistent look with seed ${seed}. High detail, 8k resolution, cinematic lighting. Aspect Ratio 16:9. Wide angle shot.`;

  try {
    // For image generation, using Gemini 2.5 Flash Image which is designated for this
    const response = await generateContentCommon(config, 'gemini-2.5-flash-image', fullPrompt, {}, true);

    const parts = response.candidates?.[0]?.content?.parts;
    const imagePart = parts?.find((p: any) => p.inlineData && p.inlineData.data);
    const data = imagePart?.inlineData?.data;

    if (data) return `data:image/jpeg;base64,${data}`;

    throw new Error("Não foi possível obter dados da imagem do Gemini.");
  } catch (e: any) {
    console.error("API Gemini Imagem falhou:", e);
    throw e;
  }
};


const encodeWAV = (pcmBase64: string, sampleRate: number = 24000): string => {
  const pcmBytes = Uint8Array.from(atob(pcmBase64), c => c.charCodeAt(0));
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);
  view.setUint32(0, 0x52494646, false);
  view.setUint32(4, 36 + pcmBytes.length, true);
  view.setUint32(8, 0x57415645, false);
  view.setUint32(12, 0x666d7420, false);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 0x64617461, false);
  view.setUint32(40, pcmBytes.length, true);
  const combined = new Uint8Array(wavHeader.byteLength + pcmBytes.length);
  combined.set(new Uint8Array(wavHeader), 0);
  combined.set(pcmBytes, wavHeader.byteLength);
  return btoa(Array.from(combined).map(b => String.fromCharCode(b)).join(''));
};

export const generateSpeech = async (text: string, voiceName: string = 'Zephyr', config: ServiceConfig): Promise<string> => {
  try {
    // TTS via Gemini - Using 2.5 Flash Preview TTS as per user feedback
    const response = await generateContentCommon(config, "gemini-2.5-flash-preview-tts", text, {
      // @ts-ignore
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    });

    const base64PCM = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64PCM) throw new Error("Sem dados de áudio.");

    return `data:audio/wav;base64,${encodeWAV(base64PCM, 24000)}`;

  } catch (e: any) {
    console.warn("Falha no Audio Multimodal (Gemini Audio).", e.message);
    throw new Error("Geração de áudio Gemini falhou. Tente ElevenLabs.");
  }
};

export const optimizeScene = async (currentEntry: TimelineEntry, context: string, config: ServiceConfig): Promise<TimelineEntry> => {
  const prompt = `
    ATUE COMO UM ESPECIALISTA EM ENGAJAMENTO DE VÍDEO.
    Otimize a cena.
    CONTEXTO: ${context}
    CENA: "${currentEntry.narration}" / "${currentEntry.imagePrompt}"
    
    REQUISITO CRÍTICO DE IMAGEM: O 'imagePrompt' deve SEMPRE incluir instruções para formato 16:9, estilo cinematográfico e alta resolução. Acrescente: "Cinematic, 16:9 aspect ratio, 8k resolution, highly detailed" ao final do prompt gerado.
    
    Retorne JSON com: narration, imagePrompt, cameraMovement (enum), focusPoint (enum).
  `;

  const response = await generateContentCommon(config, 'gemini-3-flash-preview', prompt, {
    responseMimeType: "application/json",
    responseSchema: {
      type: "OBJECT",
      properties: {
        narration: { type: "STRING" },
        imagePrompt: { type: "STRING" },
        cameraMovement: { type: "STRING", enum: ['zoom_in', 'zoom_out', 'pan_left', 'pan_right', 'static'] },
        focusPoint: { type: "STRING", enum: ['center', 'top_left', 'top_right', 'bottom_left', 'bottom_right'] }
      },
      required: ["narration", "imagePrompt", "cameraMovement", "focusPoint"]
    }
  });

  const text = extractTextFromResponse(response);


  if (!text) throw new Error("Falha na otimização.");
  return { ...currentEntry, ...JSON.parse(typeof text === 'string' ? text.trim() : JSON.stringify(text)) };
};

export const reviewAndUpdateScript = async (currentScript: BibleScript, niche: NicheConfig, config: ServiceConfig): Promise<BibleScript> => {

  const prompt = `
    ATUE COMO UM EDITOR SÊNIOR DE CINEMA E ROTEIRISTA. 
    Seu trabalho é REVISAR e MELHORAR o roteiro fornecido abaixo, mantendo a essência mas elevando a qualidade.

    ${niche.systemPrompt}

    ROTEIRO ATUAL (JSON):
    ${JSON.stringify(currentScript, null, 2)}

    INSTRUÇÕES DE REVISÃO:
    1. **MELHORIA DE NARRATIVA**: Torne o texto mais envolvente, poético ou dramático, conforme o nicho.
    2. **RITMO**: Se houver narrativas muito longas (multi-parágrafos), QUEBRE em cenas menores para manter o dinamismo visual.
    3. **SEPARAÇÃO DE VOZES**: 
       - Garanta que 'Narrador' só fale contexto.
       - Garanta que Personagens só tenham diálogos diretos.
       - Se houver mistura na mesma cena, DIVIDA em duas cenas.
    4. **VISUAIS**: Enriqueça os 'imagePrompts' para serem mais descritivos e cinemáticos.
    5. **CONSISTÊNCIA**: MANTENHA o mesmo 'visualSeed' do roteiro original.
    6. **TÍTULO**: Você pode sugerir um título melhor se necessário.

    Retorne o JSON COMPLETO do roteiro melhorado.
  `;

  // Review requires high reasoning context
  const response = await generateContentCommon(config, 'gemini-2.5-flash', prompt, {
    responseMimeType: "application/json",
    responseSchema: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        fullNarration: { type: "STRING" },
        backgroundMusicPrompt: { type: "STRING" },
        characters: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" },
              voiceType: { type: "STRING" },
              description: { type: "STRING" }
            },
            required: ["name", "voiceType", "description"]
          }
        },
        visualSeed: { type: "STRING" },
        timeline: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              timestamp: { type: "STRING" },
              narration: { type: "STRING" },
              imagePrompt: { type: "STRING" },
              speaker: { type: "STRING" },
              cameraMovement: {
                type: "STRING",
                enum: ['zoom_in', 'zoom_out', 'pan_left', 'pan_right', 'static']
              },
              focusPoint: {
                type: "STRING",
                enum: ['center', 'top_left', 'top_right', 'bottom_left', 'bottom_right']
              }
            },
            required: ["timestamp", "narration", "imagePrompt", "speaker", "cameraMovement", "focusPoint"]
          }
        },
        framingOrientations: { type: "STRING" },
        biblicalSource: { type: "STRING" }
      },
      required: ["title", "fullNarration", "characters", "visualSeed", "timeline", "framingOrientations", "biblicalSource", "backgroundMusicPrompt"]
    }
  });

  const text = extractTextFromResponse(response);
  if (typeof text !== 'string') throw new Error("Formato de resposta inesperado na revisão");

  return JSON.parse(text.trim()) as BibleScript;
};


export const generateThumbnailSuggestions = async (script: BibleScript, niche: NicheConfig, config: ServiceConfig): Promise<ThumbnailSuggestion[]> => {

  const prompt = `
    ATUE COMO UM CONSULTOR DE CANAL YOUTUBE EXPERT EM VIRAIS (MR BEAST STYLE).
    Crie 3 (TRÊS) opções diferentes de conceitos de Thumbnail para o vídeo: "${script.title}".
    
    PARA CADA OPÇÃO, GERE:
    1. PROMPT VISUAL (inglês): Estilo ${niche.imageStyleSuffix}, cores vibrantes, composição regra dos terços.
    2. TÍTULO (Overlay Text): Curto, impactante, 2-4 palavras (ex: "A VERDADE!", "ELE VOLTOU?").
    3. SUBTÍTULO: Opcional (pode ser vazio), texto complementar menor.
    4. COR PREDOMINANTE: Cor principal do texto de destaque (ex: #FFD700, #FF0000).

    O Título e Subtítulo devem estar em PORTUGUÊS (ou idioma do script), mas o PROMPT DE IMAGEM deve ser em INGLÊS.

    Retorne um JSON ARRAY com 3 objetos.
  `;

  // Utilizando Gemini 3 Pro para melhor criatividade e seguimento de instruções complexas JSON
  const response = await generateContentCommon(config, 'gemini-2.5-flash', prompt, {
    responseMimeType: "application/json",
    responseSchema: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          prompt: { type: "STRING" },
          title: { type: "STRING" },
          subtitle: { type: "STRING" },
          color: { type: "STRING" }
        },
        required: ["prompt", "title", "subtitle", "color"]
      }
    }
  });

  const text = extractTextFromResponse(response);
  if (!text) return [];
  try {
    return JSON.parse(text.trim());
  } catch (e) {
    console.error("Falha ao parsear sugestões de thumbnail", e);
    return [];
  }
};

// Deprecated: kept for compatibility if needed, but unused in new flow
export const generateThumbnailPrompt = async (script: BibleScript, niche: NicheConfig, config: ServiceConfig): Promise<string> => {
  const suggestions = await generateThumbnailSuggestions(script, niche, config);
  return suggestions[0]?.prompt || "";
};

export const translateScript = async (script: BibleScript, targetLanguage: string, niche: NicheConfig, config: ServiceConfig): Promise<BibleScript> => {

  const prompt = `
    ATUE COMO UM TRADUTOR PROFISSIONAL E ROTEIRISTA.
    Seu trabalho é TRADUZIR INTEGRALMENTE o roteiro fornecido para o idioma: "${targetLanguage}".

    ROTEIRO ATUAL (JSON):
    ${JSON.stringify(script, null, 2)}

    INSTRUÇÕES:
    1. Traduza 'title', 'fullNarration' e todos os textos de 'timeline' (narration, speaker se for descritivo).
    2. Traduza também as descrições dos personagens ('description').
    3. ADAPTE o tom e estilo para soar natural no idioma alvo ("${targetLanguage}"), mantendo a essência do nicho.
    4. MANTENHA A ESTRUTURA DO JSON INALTERADA.
    5. 'imagePrompts' DEVEM SER MANTIDOS EM INGLÊS (pois são para IA de imagem), mas você pode melhorá-los se necessário.
    6. NÃO TRADUZA 'visualSeed', 'cameraMovement', 'focusPoint'.

    Retorne o JSON COMPLETO traduzido.
  `;

  const response = await generateContentCommon(config, 'gemini-2.5-flash', prompt, {
    responseMimeType: "application/json",
    responseSchema: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        fullNarration: { type: "STRING" },
        backgroundMusicPrompt: { type: "STRING" },
        characters: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" },
              voiceType: { type: "STRING" },
              description: { type: "STRING" }
            },
            required: ["name", "voiceType", "description"]
          }
        },
        visualSeed: { type: "STRING" },
        timeline: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              timestamp: { type: "STRING" },
              narration: { type: "STRING" },
              imagePrompt: { type: "STRING" },
              speaker: { type: "STRING" },
              cameraMovement: {
                type: "STRING",
                enum: ['zoom_in', 'zoom_out', 'pan_left', 'pan_right', 'static']
              },
              focusPoint: {
                type: "STRING",
                enum: ['center', 'top_left', 'top_right', 'bottom_left', 'bottom_right']
              }
            },
            required: ["timestamp", "narration", "imagePrompt", "speaker", "cameraMovement", "focusPoint"]
          }
        },
        framingOrientations: { type: "STRING" },
        biblicalSource: { type: "STRING" }
      },
      required: ["title", "fullNarration", "characters", "visualSeed", "timeline", "framingOrientations", "biblicalSource", "backgroundMusicPrompt"]
    }
  });

  const text = extractTextFromResponse(response);
  if (typeof text !== 'string') throw new Error("Formato de resposta inesperado na tradução");

  return JSON.parse(text.trim()) as BibleScript;
};

export const generatePersonaConfig = async (conversationControl: string, currentContext: string, config: ServiceConfig): Promise<Partial<NicheConfig>> => {
  const prompt = `
    ATUE COMO UM CONSULTOR CRIATIVO DE CONTEÚDO.
    O usuário quer criar uma "Persona" (Nicho) para um sistema de geração de vídeos.
    
    HISTÓRICO DA CONVERSA:
    ${conversationControl}
    
    CONTEXTO ATUAL:
    "${currentContext}"

    OBJETIVO:
    Com base na conversa, extraia um JSON de configuração para esta nova Persona.

    ESTRUTURA DESEJADA (JSON):
    {
      "name": "Nome curto e comercial (ex: 'Terror Sobrenatural', 'História do Brasil')",
      "description": "Descrição curta do foco (ex: 'Contos assustadores com narração tensa')",
      "systemPrompt": "Instruções profundas para O ROTEIRISTA (IA). Defina tom, estrutura, regras de narração, estilo de linguagem. (Ex: 'Você é um especialista em terror... O ritmo deve ser lento...')",
      "imageStyleSuffix": "Sufixo para o gerador de imagem (Ex: 'Dark atmosphere, horror style, high contrast, 8k')",
      "sourceLabel": "Nome do campo de referência (ex: 'Fonte', 'Livro', 'Autor')",
      "placeholder": "Exemplo de input (ex: 'O caso de Varginha...')"
    }

    Retorne APENAS o JSON.
  `;

  const response = await generateContentCommon(config, 'gemini-3-flash-preview', prompt, {
    responseMimeType: "application/json"
  });

  const text = extractTextFromResponse(response);
  return JSON.parse(text.trim()) as Partial<NicheConfig>;
};
