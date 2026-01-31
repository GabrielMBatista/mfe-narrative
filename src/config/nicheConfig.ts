
export interface NicheConfig {
    id: string;
    name: string;
    icon: string;
    description: string;
    systemPrompt: string;
    imageStyleSuffix: string;
    sourceLabel: string;
    placeholder: string;
}

export const NICHES: Record<string, NicheConfig> = {
    bible: {
        id: 'bible',
        name: 'Bíblia Narrativa',
        icon: 'BookOpen',
        description: 'Documentários bíblicos épicos com narração majestosa.',
        systemPrompt: `
      Você é um roteirista bíblico especializado em audiovisual. 
      REGRAS CRÍTICAS:
      1. Fidelidade absoluta à Bíblia. Linguagem acessível, Tom de documentário majestoso.
      2. O vídeo DEVE ter um ritmo épico e contemplativo, visando uma duração total de 5 MINUTOS.
      3. A timeline deve ter no MÍNIMO 40 a 50 cenas.
      4. Cada cena deve ter entre 8 a 12 segundos de narração fluida.
      5. 'imagePrompt' deve descrever cenas históricas, cinematográficas, estilo stop-motion ilustrado.
      6. 'biblicalSource' deve citar o livro e capítulo.
    `,
        imageStyleSuffix: 'Documentary style, historical illustration, cinematic lighting, stop motion style. No modern items.',
        sourceLabel: 'Referência Bíblica',
        placeholder: 'Ex: A Parábola da Ovelha Perdida, A Vida de José do Egito...'
    },
    english: {
        id: 'english',
        name: 'Inglês Acelerado',
        icon: 'Languages',
        description: 'Aulas práticas para brasileiros aprenderem inglês rápido com situações reais.',
        systemPrompt: `
      Você é um mentor de inglês especializado em ensinar brasileiros de forma rápida e prática.
      OBJETIVO: Criar uma aula envolvente para quem fala PORTUGUÊS e quer aprender inglês do dia a dia.
      
      ESTRUTURA DA AULA:
      1. HOOK: Comece explicando em português por que este tópico é importante para o dia a dia.
      2. CONTEXTO: Apresente uma situação real (ex: no aeroporto, numa reunião, pedindo algo).
      3. BILÍNGUE: A narração deve ser uma mistura inteligente. Você explica em português e exemplifica/ensina em inglês. 
      4. INTERAÇÃO: Inclua momentos de "Repeat after me" (repita comigo) para treinar a pronúncia.
      5. DURAÇÃO: O roteiro DEVE ser denso para atingir 5 MINUTOS. Mínimo de 45 cenas curtas e dinâmicas.
      
      REGRAS VISUAIS:
      - 'imagePrompt': Use estilo animação 3D moderna (Pixar style) com personagens brasileiros e cenários vibrantes.
      - Adicione descrições de "text overlay" no imagePrompt para mostrar as palavras em inglês na tela.
      
      'biblicalSource' (Dica): Forneça uma dica rápida de pronúncia ou um "Macete" para brasileiros.
    `,
        imageStyleSuffix: 'Modern 3D animation style, Pixar inspired, high quality, expressive characters, educational context with text on screen.',
        sourceLabel: 'Macete do Mestre',
        placeholder: 'Ex: Inglês para Viagem, Como falar no Trabalho, 10 Verbos essenciais...'
    }
};
