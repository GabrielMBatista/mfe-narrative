
export interface Character {
  name: string;
  voiceType: string;
  description: string;
}

export interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
}

export interface ThumbnailSuggestion {
  prompt: string;
  title: string;
  subtitle: string;
  color: string;
  imageUrl?: string;
}

export interface TimelineEntry {
  timestamp: string;
  narration: string;
  imagePrompt: string;
  speaker?: string; // Nome do personagem que está falando (opcional)
  audio?: string; // Base64 encoded raw PCM data
  cameraMovement?: 'zoom_in' | 'zoom_out' | 'pan_left' | 'pan_right' | 'static';
  focusPoint?: 'center' | 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';
}

export interface BibleScript {
  title: string;
  fullNarration: string;
  characters: Character[];
  visualSeed: string;
  timeline: TimelineEntry[];
  framingOrientations: string;
  biblicalSource: string;
  backgroundMusicPrompt?: string; // Sugestão de estilo
}

export enum AppStatus {
  IDLE = 'IDLE',
  GENERATING_SCRIPT = 'GENERATING_SCRIPT',
  GENERATING_IMAGES = 'GENERATING_IMAGES',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS'
}

export interface FullProject {
  script: BibleScript;
  images: Record<number, string>;
  audios: Record<number, string>;
  backgroundMusic?: string;
  exportDate: string;
  version: string;
  // Voice Configuration (adicionado v3.8)
  characterVoices?: Record<string, string>; // Mapeia nome do personagem para voice_id
  ttsProvider?: 'gemini' | 'elevenlabs'; // Provedor TTS usado
  defaultGeminiVoice?: string; // Voz padrão do Gemini
  elevenLabsVoice?: string; // Voz selecionada do ElevenLabs
  // Thumbnail otimizada (adicionado v3.9)
  thumbnail?: string; // Thumbnail otimizada do projeto (formato WebP/JPEG, otimizado)
  thumbnailPrompt?: string; // Prompt usado para gerar a thumbnail (v3.9.1)
  // Nicho do projeto (adicionado v3.9.1)
  nicheId?: string; // ID do nicho usado ('bible', 'lessons', etc.)
  // Flag de configuração manual de vozes (v3.9.2)
  // Flag de configuração manual de vozes (v3.9.2)
  hasManualVoiceConfig?: boolean; // Se true, user configurou vozes manualmente - NÃO sobrescrever

  // Alinhamento de palavras para legendas precisas (adicionado v3.10)
  alignments?: Record<number, WordTiming[]>;
  thumbnailSuggestions?: ThumbnailSuggestion[];
}

