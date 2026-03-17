# 🎬 Narrative Studio — MFE Narrative

> Micro-frontend especializado em **Orquestração de IA Multimodal** e **Síntese de Vídeo no Browser**.

O **Narrative Studio** (V4.0) é um motor de criação de conteúdo que transforma ideias e roteiros em vídeos completos com narração, trilha sonora e artes cinemáticas, processando tudo diretamente no cliente através de tecnologias de ponta.

---

## 🚀 Principais Tecnologias

- **Framework**: [Next.js 14](https://nextjs.org/) (React 18)
- **AI Orchestration**: [Google Gemini AI](https://deepmind.google/technologies/gemini/) (Pro & Flash)
- **Voice Synthesis**: [ElevenLabs API](https://elevenlabs.io/) & Gemini Multimodal TTS
- **Video Engine**: [FFmpeg WASM](https://ffmpegwasm.netlify.app/) & [WebCodecs API](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API)
- **Storage**: [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (via IDB) para persistência de projetos locais
- **Architecture**: [Module Federation](https://module-federation.io/) — Projetado para integração plug-and-play em sistemas de CRM/Shell

---

## ✨ Funcionalidades Core

### 🧠 Inteligência Multimodal
- **Escrita Criativa**: Geração de roteiros otimizados por nicho (Bíblico, Terror, Curiosidades, etc).
- **Consistência Visual**: Sistema de `visualSeed` para manter a identidade dos personagens e cenários entre frames.
- **Análise de Social SEO**: Geração automática de títulos virais, hashtags e descrições para YouTube/Instagram/TikTok.

### 🎙️ Estúdio de Voz Avançado
- **Multi-Provider**: Suporte nativo a ElevenLabs e ao novo audio-modality do Gemini.
- **Mapeamento de Personagens**: Atribuição automática de vozes distintas para diferentes personagens no roteiro.
- **Preview em Tempo Real**: Ouça cada cena individualmente antes da renderização final.

### 🎥 Engine de Vídeo Browser-Side
- **Renderização em Fluxo**: Síntese de frames e áudio usando FFmpeg compilado para WebAssembly.
- **Legendas Dinâmicas**: Renderização de legendas sincronizadas com a narração.
- **Exportação 8K Ready**: Prompts otimizados para alta resolução e aspect ratio configurável.

---

## 🏗️ Arquitetura

O projeto segue um padrão de **Micro-frontend (MFE)**, expondo o estúdio como um módulo remoto.

```
src/
├── components/       # Interface modular (Studio, Header, Modals)
├── services/         # Core Logic (AI, Video, TTS, SEO)
├── hooks/            # Orquestração de estado (StudioOrchestrator)
├── contexts/         # Estado global de configurações
└── lib/              # Utilitários e wrappers (FFmpeg, Storage)
```

---

## 🛠️ Configuração Inicial

1. **Instale as dependências**:
   ```bash
   npm install
   ```

2. **Variáveis de Ambiente**:
   Crie um arquivo `.env` com:
   ```env
   NEXT_PUBLIC_GEMINI_API_KEY=seu_token
   NEXT_PUBLIC_ELEVENLABS_API_KEY=seu_token
   ```

3. **Inicie o ambiente de desenvolvimento**:
   ```bash
   npm run dev
   ```
   *Nota: O MFE roda por padrão na porta 3003 para integração.*

---

## 📡 Integração (Module Federation)

Para consumir este módulo em um Shell App:

```javascript
// next.config.mjs / webpack.config.js
new ModuleFederationPlugin({
  remotes: {
    mfe_narrative: "mfe_narrative@http://localhost:3003/_next/static/chunks/remoteEntry.js",
  },
})
```

---

Desenvolvido por **Gabriel Batista** — Projetado para o futuro da criação de conteúdo automatizado.
