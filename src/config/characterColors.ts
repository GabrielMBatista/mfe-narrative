// Sistema de cores para personagens nas legendas

export interface CharacterColor {
    primary: string;    // Cor principal do texto
    accent: string;     // Cor de destaque/karaoke
    shadow: string;     // Cor da sombra
    background: string; // Cor de fundo da legenda
}

// Cores pré-definidas por tipo de personagem
export const CHARACTER_COLORS: Record<string, CharacterColor> = {
    // Personagens Bíblicos
    'Ezequiel': {
        primary: '#4169E1',      // Azul Royal
        accent: '#87CEEB',       // Azul Céu
        shadow: 'rgba(0, 0, 0, 0.9)',
        background: 'rgba(0, 0, 0, 0.75)'
    },
    'Espírito de Deus': {
        primary: '#9370DB',      // Roxo Médio
        accent: '#E6E6FA',       // Lavanda
        shadow: 'rgba(75, 0, 130, 0.9)',
        background: 'rgba(75, 0, 130, 0.5)'
    },
    'Anjo': {
        primary: '#00CED1',      // Turquesa Escuro
        accent: '#AFEEEE',       // Turquesa Pálido
        shadow: 'rgba(0, 0, 0, 0.9)',
        background: 'rgba(0, 100, 100, 0.6)'
    },
    'Jesus': {
        primary: '#FFD700',      // Dourado
        accent: '#FFFACD',       // Dourado Claro
        shadow: 'rgba(139, 69, 19, 0.9)',
        background: 'rgba(139, 69, 19, 0.5)'
    },
    'Moisés': {
        primary: '#8B4513',      // Marrom Sela
        accent: '#DEB887',       // Marrom Claro
        shadow: 'rgba(0, 0, 0, 0.9)',
        background: 'rgba(101, 67, 33, 0.6)'
    },
    'Davi': {
        primary: '#DAA520',      // Dourado Vara
        accent: '#F0E68C',       // Caqui
        shadow: 'rgba(0, 0, 0, 0.9)',
        background: 'rgba(139, 69, 19, 0.5)'
    },
    'Narrador': {
        primary: '#FFFFFF',      // Branco
        accent: '#FFD700',       // Dourado
        shadow: 'rgba(0, 0, 0, 0.95)',
        background: 'rgba(0, 0, 0, 0.8)'
    },
    // Default para personagens não mapeados
    'Default': {
        primary: '#E0E0E0',      // Cinza Claro
        accent: '#FFFFFF',       // Branco
        shadow: 'rgba(0, 0, 0, 0.9)',
        background: 'rgba(0, 0, 0, 0.75)'
    }
};

/**
 * Obtém as cores para um personagem específico
 * Se não encontrar, retorna as cores default
 */
export function getCharacterColors(characterName: string): CharacterColor {
    // Normalizar nome (remover espaços extras, capitalizar)
    const normalizedName = characterName.trim();

    // Buscar por match exato primeiro
    if (CHARACTER_COLORS[normalizedName]) {
        return CHARACTER_COLORS[normalizedName];
    }

    // Buscar por match parcial (case-insensitive)
    for (const key in CHARACTER_COLORS) {
        if (normalizedName.toLowerCase().includes(key.toLowerCase()) ||
            key.toLowerCase().includes(normalizedName.toLowerCase())) {
            return CHARACTER_COLORS[key];
        }
    }

    // Retornar default
    return CHARACTER_COLORS['Default'];
}

/**
 * Detecta o nome do personagem a partir do texto da narração
 * Formato esperado: "PersonagemName: texto da fala"
 */
export function detectSpeakerFromText(text: string): { speaker: string; cleanText: string } {
    // Regex para detectar "Nome: texto"
    const match = text.match(/^([^:]+):\s*(.+)$/);

    if (match) {
        return {
            speaker: match[1].trim(),
            cleanText: match[2].trim()
        };
    }

    // Se não encontrar padrão, assume Narrador
    return {
        speaker: 'Narrador',
        cleanText: text
    };
}
