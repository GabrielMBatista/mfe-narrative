// Sistema de legendas com sincronização e efeito karaoke

import { getCharacterColors, detectSpeakerFromText } from '../config/characterColors';

export interface WordTiming {
    word: string;
    startTime: number;
    endTime: number;
}

export interface SubtitleSegment {
    speaker: string;
    text: string;
    startTime: number;  // em segundos
    duration: number;   // em segundos
    wordTimings?: WordTiming[]; // Opcional: para sync perfeito
}

export class SubtitleRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private baseFontSize: number = 32; // Tamanho de fonte base
    private fontFamily: string = 'Inter, system-ui, sans-serif'; // Fonte moderna
    private padding: number = 20;
    private maxWidthRatio: number = 0.85; // 85% do canvas

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Não foi possível obter contexto 2D do canvas');
        this.ctx = ctx;
    }

    /**
     * Quebra o texto em palavras
     */
    private splitIntoWords(text: string): string[] {
        return text.split(/\s+/).filter(word => word.length > 0);
    }

    /**
     * Mede largura do texto
     */
    private measureText(text: string, fontSize: number): number {
        this.ctx.font = `800 ${fontSize}px ${this.fontFamily}`; // Extra Bold
        return this.ctx.measureText(text).width;
    }

    /**
     * Quebra texto em linhas
     */
    private wrapText(text: string, maxWidth: number, fontSize: number): string[] {
        const words = this.splitIntoWords(text);
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const width = this.measureText(testLine, fontSize);

            if (width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    }

    /**
     * Desenha legenda com efeito karaoke
     */
    public drawSubtitle(segment: SubtitleSegment, currentTime: number): void {
        const { speaker, text } = segment;
        const colors = getCharacterColors(speaker);

        // Calcular progresso do karaoke
        // Se temos wordTimings, usamos agnóstico linear
        // Se não temos, usamos interpolação linear simples
        let highlightIndex = -1;

        if (segment.wordTimings) {
            // Lógica de Sincronia Precisa (Word Timings)
            // Ajustar currentTime relativo ao início do segmento
            const relativeTime = currentTime - segment.startTime;

            // Encontrar qual palavra está sendo falada agora
            // Usamos apenas o endTime para garantir que a palavra fique destacada até acabar
            highlightIndex = segment.wordTimings.findIndex(w =>
                relativeTime >= w.startTime && relativeTime <= w.endTime
            );

            // Se não achou exato (pausa entre palavras), pega a última palavra que já passou
            if (highlightIndex === -1) {
                for (let i = segment.wordTimings.length - 1; i >= 0; i--) {
                    if (relativeTime >= segment.wordTimings[i].endTime) {
                        highlightIndex = i; // Já leu esta
                        break;
                    }
                }
            }

        } else {
            // Lógica Linear (Fallback)
            const elapsed = currentTime - segment.startTime;
            const progress = Math.max(0, Math.min(1, elapsed / segment.duration));
            const wordCount = text.trim().split(/\s+/).length;
            highlightIndex = Math.floor(wordCount * progress);
        }

        // Preparar texto e layout dinâmico
        const speakerLabel = speaker.toUpperCase();
        const maxWidth = this.canvas.width * this.maxWidthRatio;

        // Lógica de Autosize da Fonte:
        // Reduz a fonte se o texto ocupar muito espaço vertical (max 35% da tela)
        let currentFontSize = this.baseFontSize;
        let wrappedLines = this.wrapText(text, maxWidth, currentFontSize);
        let lineHeight = currentFontSize * 1.5;
        let totalTextHeight = (wrappedLines.length * lineHeight) + (this.padding * 2);

        const maxAllowedHeight = this.canvas.height * 0.35;

        while (totalTextHeight > maxAllowedHeight && currentFontSize > 16) {
            currentFontSize -= 2;
            wrappedLines = this.wrapText(text, maxWidth, currentFontSize);
            lineHeight = currentFontSize * 1.5;
            totalTextHeight = (wrappedLines.length * lineHeight) + (this.padding * 2);
        }

        // Posicionamento: Parte inferior da tela
        const bottomMargin = 50;
        const startY = this.canvas.height - totalTextHeight - bottomMargin;
        const centerX = this.canvas.width / 2;

        // 1. Vignette Dinâmica (fundo escuro atrás do texto para legibilidade)
        this.ctx.save();
        // O gradiente começa um pouco acima do texto
        const gradientStartY = startY - 40;
        const gradientHeight = this.canvas.height - gradientStartY;

        const gradient = this.ctx.createLinearGradient(0, gradientStartY, 0, this.canvas.height);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(0.2, 'rgba(0,0,0,0.6)'); // Mais escuro logo no início do texto
        gradient.addColorStop(1, 'rgba(0,0,0,0.8)');   // Bem escuro embaixo

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, gradientStartY, this.canvas.width, gradientHeight);
        this.ctx.restore();

        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // 2. Desenhar Nome do Personagem (Se não for Narrador)
        // Posicionado acima do bloco de texto
        if (speaker.toLowerCase() !== 'narrador') {
            this.ctx.save();
            const labelFontSize = currentFontSize * 0.7; // Escala com a fonte do texto
            this.ctx.font = `700 ${labelFontSize}px ${this.fontFamily}`;
            this.ctx.shadowColor = 'rgba(0,0,0,1)';
            this.ctx.shadowBlur = 4;
            this.ctx.lineWidth = 3;
            this.ctx.strokeStyle = 'rgba(0,0,0,0.8)';

            const labelY = startY - (labelFontSize * 1.2);

            // Stroke
            this.ctx.strokeText(speakerLabel, centerX, labelY);

            // Fill
            this.ctx.fillStyle = colors.accent;
            this.ctx.fillText(speakerLabel, centerX, labelY);
            this.ctx.restore();
        }

        // 3. Desenhar Texto Karaoke
        this.ctx.font = `800 ${currentFontSize}px ${this.fontFamily}`;
        let currentY = startY + (currentFontSize / 2) + this.padding; // Ajuste fino do Y inicial

        // Calcular índice de palavras para destaque
        const allWords = wrappedLines.join(' ').split(/\s+/);
        const totalWords = allWords.length;
        // O highlightIndex já foi calculado acima com precisão
        const currentWordIndex = highlightIndex;

        let globalWordIndex = 0;

        for (const line of wrappedLines) {
            const lineWords = line.split(/\s+/);
            const lineWidth = this.measureText(line, currentFontSize);
            let currentX = centerX - (lineWidth / 2); // Começa X centralizado

            for (const word of lineWords) {
                const wordWidth = this.measureText(word, currentFontSize);
                const isCurrentWord = globalWordIndex === currentWordIndex; // Palavra sendo lida AGORA
                const wasRead = globalWordIndex < currentWordIndex; // Já foi lida

                this.ctx.save();

                // Borda (Stroke) para legibilidade máxima
                this.ctx.lineWidth = Math.max(3, currentFontSize * 0.15); // Stroke proporcional
                this.ctx.lineJoin = 'round';
                this.ctx.strokeStyle = 'rgba(0,0,0,0.95)'; // Borda preta forte
                this.ctx.strokeText(word, currentX + (wordWidth / 2), currentY);

                // Cor do Texto:
                if (isCurrentWord) {
                    this.ctx.fillStyle = colors.accent; // Destaque colorido
                } else if (wasRead) {
                    this.ctx.fillStyle = 'rgba(255,255,255,0.85)'; // Já lida um pouco mais visível que antes
                } else {
                    this.ctx.fillStyle = '#FFFFFF'; // Não lida
                }
                this.ctx.fillText(word, currentX + (wordWidth / 2), currentY);

                this.ctx.restore();

                // Espaço
                const spaceWidth = this.measureText(' ', currentFontSize);
                currentX += wordWidth + spaceWidth;
                globalWordIndex++;
            }

            currentY += lineHeight;
        }
    }

    public clear(): void { }
}

/**
 * Converte timeline entries em segmentos de legendas
 */
export function createSubtitleSegments(
    narrations: Array<{ text: string; speaker?: string }>,
    audioDurations: number[]
): SubtitleSegment[] {
    const segments: SubtitleSegment[] = [];
    let currentTime = 0;

    for (let i = 0; i < narrations.length; i++) {
        // Normalizar a narração removendo prefixos como "Narrador:" do texto falado
        const narration = narrations[i];
        const duration = audioDurations[i] || 5;

        const detected = detectSpeakerFromText(narration.text);

        // Lógica segura para determinar speaker e texto
        let speaker = narration.speaker;
        let text = narration.text;

        if (!speaker) {
            // Se não tem speaker definido na timeline, usamos o detectado
            speaker = detected.speaker;
            text = detected.cleanText;
        } else {
            // Se já tem speaker, SÓ substituímos o texto pelo cleanText se o speaker detectado
            // for igual ao speaker da timeline. Isso evita cortar frases bíblicas como "Observai: as aves..."
            // onde o "Observai" seria incorretamente identificado como speaker.
            if (detected.speaker.toLowerCase() === speaker.toLowerCase()) {
                text = detected.cleanText;
            }
        }

        segments.push({
            speaker,
            text,
            startTime: currentTime,
            duration
        });

        // Log para debug de sincronia
        if (i % 10 === 0 || i === narrations.length - 1) {
            console.log(`📝 Legenda ${i}: startTime=${currentTime.toFixed(2)}s, duration=${duration.toFixed(2)}s`);
        }

        currentTime += duration;
    }

    console.log(`✅ Total de ${segments.length} legendas criadas, duração total: ${currentTime.toFixed(2)}s`);
    return segments;
}

/**
 * Encontra o segmento de legenda ativo no tempo atual
 */
export function getActiveSubtitle(
    segments: SubtitleSegment[],
    currentTime: number
): SubtitleSegment | null {
    for (const segment of segments) {
        const endTime = segment.startTime + segment.duration;
        if (currentTime >= segment.startTime && currentTime < endTime) {
            return segment;
        }
    }
    return null;
}

/**
 * Converte o formato de alinhamento do ElevenLabs (caracteres) para palavras
 */
export function convertElevenLabsAlignmentToWords(
    alignment: {
        characters: string[];
        character_start_times_seconds: number[];
        character_end_times_seconds: number[];
    }
): WordTiming[] {
    const words: WordTiming[] = [];
    const { characters, character_start_times_seconds, character_end_times_seconds } = alignment;

    let currentWord = '';
    let currentWordStart = -1;
    let currentWordEnd = -1;

    for (let i = 0; i < characters.length; i++) {
        const char = characters[i];
        const start = character_start_times_seconds[i];
        const end = character_end_times_seconds[i];

        if (char === ' ') {
            if (currentWord) {
                words.push({
                    word: currentWord,
                    startTime: currentWordStart,
                    endTime: currentWordEnd
                });
                currentWord = '';
                currentWordStart = -1;
                currentWordEnd = -1;
            }
        } else {
            if (currentWordStart === -1) currentWordStart = start;
            currentWordEnd = end;
            currentWord += char;
        }
    }

    if (currentWord) {
        words.push({
            word: currentWord,
            startTime: currentWordStart,
            endTime: currentWordEnd
        });
    }

    return words;
}
