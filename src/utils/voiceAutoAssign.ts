// Sistema de atribuição automática de vozes para personagens - COM GARANTIA DE UNICIDADE

import { GEMINI_VOICES, GeminiVoice } from '../services/geminiService';
import { ELEVENLABS_VOICES, ElevenLabsVoice } from '../services/elevenLabsService';
import { Character } from '../types';

/**
 * Calcula score de compatibilidade entre personagem e voz Gemini
 */
function scoreGeminiVoiceMatch(character: Character, voice: GeminiVoice): number {
    let score = 0;
    const voiceType = character.voiceType.toLowerCase();
    const description = character.description.toLowerCase();
    const combinedText = `${voiceType} ${description}`;

    // Score por gênero (peso alto)
    if (voice.gender === 'male' && (voiceType.includes('masculin') || voiceType.includes('male'))) {
        score += 50;
    } else if (voice.gender === 'female' && (voiceType.includes('feminin') || voiceType.includes('female'))) {
        score += 50;
    } else if (voice.gender === 'neutral') {
        score += 25; // Neutro serve para qualquer um, mas com menos prioridade
    }

    // Score por características específicas
    switch (voice.name) {
        case 'Charon':
            if (combinedText.includes('profunda') || combinedText.includes('grave') ||
                combinedText.includes('autorit') || combinedText.includes('matur') ||
                combinedText.includes('rouca') || combinedText.includes('reverente')) {
                score += 30;
            }
            if (combinedText.includes('deus') || combinedText.includes('senhor') ||
                combinedText.includes('profeta')) {
                score += 20;
            }
            break;

        case 'Fenrir':
            if (combinedText.includes('intensa') || combinedText.includes('forte') ||
                combinedText.includes('poderosa') || combinedText.includes('ressonante') ||
                combinedText.includes('profunda') || combinedText.includes('onipresente')) {
                score += 30;
            }
            if (combinedText.includes('espírito') || combinedText.includes('sobrenatural')) {
                score += 20;
            }
            break;

        case 'Puck':
            if (combinedText.includes('jovem') || combinedText.includes('energ') ||
                combinedText.includes('vivaz') || combinedText.includes('alegre')) {
                score += 30;
            }
            break;

        case 'Kore':
            if (combinedText.includes('clara') || combinedText.includes('express') ||
                combinedText.includes('brilhante') || combinedText.includes('firme')) {
                score += 30;
            }
            break;

        case 'Aoede':
            if (combinedText.includes('suave') || combinedText.includes('melodi') ||
                combinedText.includes('angeli') || combinedText.includes('doce') ||
                combinedText.includes('gentil')) {
                score += 30;
            }
            break;

        case 'Zephyr':
            // Zephyr é neutro, serve como fallback
            score += 10;
            break;
    }

    return score;
}

/**
 * Calcula score de compatibilidade entre personagem e voz ElevenLabs
 */
function scoreElevenLabsVoiceMatch(character: Character, voice: ElevenLabsVoice): number {
    let score = 0;
    const voiceType = character.voiceType.toLowerCase();
    const combinedText = `${voiceType} ${character.description.toLowerCase()}`;

    // Mapeamento básico baseado em nomes das vozes ElevenLabs
    const voiceCharacteristics: Record<string, string[]> = {
        'Antoni': ['masculin', 'profunda', 'grave', 'autorit'],
        'Arnold': ['masculin', 'forte', 'intensa'],
        'Adam': ['masculin', 'natural', 'equilibrada'],
        'Josh': ['masculin', 'jovem', 'energ'],
        'Bella': ['feminin', 'clara', 'express'],
        'Elli': ['feminin', 'suave', 'melodi'],
        'Domi': ['feminin', 'forte', 'autorit']
    };

    const characteristics = voiceCharacteristics[voice.name] || [];

    for (const char of characteristics) {
        if (combinedText.includes(char)) {
            score += 20;
        }
    }

    return score;
}

/**
 * Cria mapeamento automático de vozes GARANTINDO UNICIDADE
 * Cada personagem receberá uma voz diferente
 */
export function createAutoVoiceMapping(
    characters: Character[],
    provider: 'gemini' | 'elevenlabs'
): Record<string, string> {
    const mapping: Record<string, string> = {};
    const usedVoices = new Set<string>();

    if (provider === 'gemini') {
        // Criar array de scores para cada combinação personagem-voz
        const assignments: Array<{
            character: Character;
            voice: GeminiVoice;
            score: number;
        }> = [];

        for (const character of characters) {
            for (const voice of GEMINI_VOICES) {
                assignments.push({
                    character,
                    voice,
                    score: scoreGeminiVoiceMatch(character, voice)
                });
            }
        }

        // Ordenar por score decrescente
        assignments.sort((a, b) => b.score - a.score);

        // Atribuir vozes garantindo unicidade
        for (const assignment of assignments) {
            // Se personagem já tem voz ou voz já foi usada, pular
            if (mapping[assignment.character.name] || usedVoices.has(assignment.voice.name)) {
                continue;
            }

            mapping[assignment.character.name] = assignment.voice.name;
            usedVoices.add(assignment.voice.name);
        }

        // Garantir que todos os personagens tenham voz (fallback para vozes restantes)
        const remainingVoices = GEMINI_VOICES.filter(v => !usedVoices.has(v.name));
        let voiceIndex = 0;

        for (const character of characters) {
            if (!mapping[character.name] && voiceIndex < remainingVoices.length) {
                mapping[character.name] = remainingVoices[voiceIndex].name;
                voiceIndex++;
            }
        }

    } else {
        // Lógica similar para ElevenLabs
        const assignments: Array<{
            character: Character;
            voice: ElevenLabsVoice;
            score: number;
        }> = [];

        for (const character of characters) {
            for (const voice of ELEVENLABS_VOICES) {
                assignments.push({
                    character,
                    voice,
                    score: scoreElevenLabsVoiceMatch(character, voice)
                });
            }
        }

        assignments.sort((a, b) => b.score - a.score);

        for (const assignment of assignments) {
            if (mapping[assignment.character.name] || usedVoices.has(assignment.voice.voice_id)) {
                continue;
            }

            mapping[assignment.character.name] = assignment.voice.voice_id;
            usedVoices.add(assignment.voice.voice_id);
        }

        // Fallback
        const remainingVoices = ELEVENLABS_VOICES.filter(v => !usedVoices.has(v.voice_id));
        let voiceIndex = 0;

        for (const character of characters) {
            if (!mapping[character.name] && voiceIndex < remainingVoices.length) {
                mapping[character.name] = remainingVoices[voiceIndex].voice_id;
                voiceIndex++;
            }
        }
    }

    return mapping;
}

/**
 * Obtém descrição amigável da voz atribuída
 */
export function getVoiceDescription(voiceId: string, provider: 'gemini' | 'elevenlabs'): string {
    if (provider === 'gemini') {
        const voice = GEMINI_VOICES.find(v => v.name === voiceId);
        return voice ? `${voice.name} - ${voice.description}` : voiceId;
    } else {
        const voice = ELEVENLABS_VOICES.find(v => v.voice_id === voiceId);
        return voice ? voice.name : voiceId;
    }
}
