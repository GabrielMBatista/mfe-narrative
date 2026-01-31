
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateSocialSEO, generateSocialThumbnail } from '../services/socialSeoService';
import { GenerationResult, PlatformSEO, HistoryItem, SocialAppStatus } from '../types/socialSeoTypes';
import { useSettings } from '../contexts/SettingsContext';
import { AlertCircle, RefreshCw, Download } from 'lucide-react';
import { BibleScript } from '../types';
import { getAudioDuration, formatDuration } from '../utils/audioUtils';

interface SocialSeoModuleProps {
    currentScript?: BibleScript | null;
    sampleAudios?: Record<number, string>;
}

const UPLOAD_URLS: Record<string, string> = {
    youtube: 'https://studio.youtube.com',
    youtubeLong: 'https://studio.youtube.com',
    instagram: 'https://www.instagram.com/reels/',
    facebook: 'https://www.facebook.com/reels/create',
    kwai: 'https://www.kwai.com',
    tiktok: 'https://www.tiktok.com/upload'
};

const PlatformCard: React.FC<{ seo: PlatformSEO; onOpen: (p: string) => void }> = ({ seo, onOpen }) => {
    const hashtagsText = seo.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ');
    const combinedCaption = `${seo.description}\n\n${hashtagsText}`;
    const isYouTubeLong = seo.platform === 'youtubeLong';

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        // Simple alert replacement or toast custom event could go here
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-bold shadow-2xl z-[200] animate-bounce';
        notification.innerText = `${label} copiado!`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-full transition-all hover:shadow-xl hover:border-indigo-100 group text-slate-800">
            <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isYouTubeLong ? 'bg-rose-50' : 'bg-slate-50'} group-hover:bg-indigo-50`}>
                        <span className={`text-xl font-black ${isYouTubeLong ? 'text-rose-600' : 'text-indigo-600'}`}>
                            {isYouTubeLong ? 'YT' : seo.platform.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <span className="capitalize font-bold text-slate-800 text-base block">
                            {isYouTubeLong ? 'YouTube Normal' : (seo.platform === 'youtube' ? 'YouTube Shorts' : seo.platform)}
                        </span>
                        <span className="text-[9px] uppercase font-black tracking-tighter text-indigo-500">• SEO Otimizado</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4 flex-grow">
                <div className="bg-slate-50 rounded-lg p-3 group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-100 relative">
                    <div className="flex justify-between items-start mb-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400 block">Título Sugerido</label>
                        <button onClick={() => copyToClipboard(seo.title, 'Título')} className="text-indigo-600 hover:text-indigo-800 p-1 rounded-md hover:bg-indigo-50 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                        </button>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 leading-snug pr-6">{seo.title}</p>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-100 relative flex-grow flex flex-col">
                    <div className="flex justify-between items-start mb-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400 block">Legenda/Descrição</label>
                        <button onClick={() => copyToClipboard(combinedCaption, 'Legenda')} className="text-indigo-600 hover:text-indigo-800 p-1 rounded-md hover:bg-indigo-50 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                        </button>
                    </div>
                    <div className="text-xs text-slate-600 whitespace-pre-line leading-relaxed overflow-hidden">
                        <div className={isYouTubeLong ? "max-h-60 overflow-y-auto pr-2" : "line-clamp-4"}>
                            {seo.description}
                        </div>
                        <p className="mt-2 text-indigo-500 font-bold break-all">{hashtagsText}</p>
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-50">
                <button
                    onClick={() => onOpen(seo.platform)}
                    className={`w-full py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-indigo-600 active:scale-95 text-white ${isYouTubeLong ? 'bg-rose-600' : 'bg-slate-900'}`}
                >
                    Ir para {isYouTubeLong ? 'YouTube' : seo.platform.toUpperCase()}
                </button>
            </div>
        </div>
    );
};

const SocialSeoModule: React.FC<SocialSeoModuleProps> = ({ currentScript, sampleAudios }) => {
    const [script, setScript] = useState('');
    const [thumbPrompt, setThumbPrompt] = useState('');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [status, setStatus] = useState<SocialAppStatus>(SocialAppStatus.IDLE);
    const [results, setResults] = useState<GenerationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [history, setHistory] = useState<HistoryItem[]>(() => {
        try {
            const saved = localStorage.getItem('social_post_ai_history');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const videoInputRef = useRef<HTMLInputElement>(null);
    const importInputRef = useRef<HTMLInputElement>(null);
    const { getEffectiveKeys, authMode } = useSettings();

    useEffect(() => {
        localStorage.setItem('social_post_ai_history', JSON.stringify(history));
    }, [history]);

    const handleOpenApp = useCallback((platform: string) => {
        const url = UPLOAD_URLS[platform];
        if (url) window.open(url, '_blank');
    }, []);

    const clearHistory = useCallback(() => {
        if (window.confirm('Tem certeza que deseja limpar todo o histórico local?')) {
            setHistory([]);
            localStorage.removeItem('social_post_ai_history');
        }
    }, []);

    const exportHistory = () => {
        const dataStr = JSON.stringify(history, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `historico-seo-ai-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
    };

    const extractProjectName = (rawScript: string, file?: File | null): string => {
        if (file) return file.name;
        const cleanScript = rawScript.trim();
        if (!cleanScript) return "Roteiro Vazio";

        // ... (logic from original file)
        const findKeyDeep = (obj: any, targetKey: string): string | null => {
            if (!obj || typeof obj !== 'object') return null;
            if (obj[targetKey] && typeof obj[targetKey] === 'string' && obj[targetKey].length > 2) return obj[targetKey];
            if (Array.isArray(obj)) {
                for (const item of obj) {
                    const found = findKeyDeep(item, targetKey);
                    if (found) return found;
                }
            } else {
                for (const key in obj) {
                    const found = findKeyDeep(obj[key], targetKey);
                    if (found) return found;
                }
            }
            return null;
        };

        try {
            const parsed = JSON.parse(cleanScript);
            const optimizedTitle = findKeyDeep(parsed, 'titulo_otimizado');
            if (optimizedTitle) return optimizedTitle;

            const commonKeys = ['title', 'titulo', 'nome', 'tema', 'assunto', 'hook', 'projeto', 'video_title'];
            for (const k of commonKeys) {
                const val = findKeyDeep(parsed, k);
                if (val) return val;
            }
        } catch { }

        const lines = cleanScript.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length > 0) {
            const firstLine = lines[0].replace(/["'{}[\]:]/g, '').trim();
            return firstLine.length > 5 ? (firstLine.substring(0, 50) + (firstLine.length > 50 ? '...' : '')) : firstLine || "Roteiro de Texto";
        }
        return "Roteiro s/ título";
    };

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setVideoFile(file);
            setVideoPreview(URL.createObjectURL(file));
        }
    };

    const handleGenerate = async () => {
        if (!script) {
            setError("Roteiro é obrigatório.");
            return;
        }
        try {
            setStatus(SocialAppStatus.GENERATING);
            setError(null);

            const keys = getEffectiveKeys();
            const config = {
                apiKey: keys.gemini === 'PROXY_MODE' ? undefined : keys.gemini,
                useProxy: authMode === 'db',
                token: localStorage.getItem('admin_token') || undefined
            };

            let chapterContext = "";

            // Calculate chapters if we have current script context and audios match
            if (currentScript && sampleAudios) {
                // Extremely simplified check: if script text roughly matches current script text
                // Ideally we would pass a flag saying "usingCurrentProject"
                const cleanInput = script.replace(/\s/g, '').slice(0, 100);
                const cleanCurrent = JSON.stringify(currentScript).replace(/\s/g, '').slice(0, 100);

                // Assuming user clicked "Import from Project", so we trust them or we just try to match
                // Let's just calculate if we have audios, and warn if missing.

                if (currentScript.timeline.length > 0) {
                    const missingAudios = currentScript.timeline.some((_, i) => !sampleAudios[i]);
                    if (missingAudios) {
                        if (!confirm("Atenção: Alguns áudios do projeto estão faltando. O cálculo dos Capítulos (Timestamps) será impreciso ou ignorado. Deseja continuar mesmo assim?")) {
                            setStatus(SocialAppStatus.IDLE);
                            return;
                        }
                    }

                    let currentTime = 0;
                    let chaptersList = `00:00 - Introdução\n`;

                    // We need to async fetch durations, so we map promises
                    const durationPromises = currentScript.timeline.map(async (scene, index) => {
                        const audioUrl = sampleAudios[index];
                        if (!audioUrl) return 5; // Fallback estimate 5s
                        try {
                            return await getAudioDuration(audioUrl);
                        } catch {
                            return 5; // Fallback error
                        }
                    });

                    const durations = await Promise.all(durationPromises);

                    for (let i = 0; i < currentScript.timeline.length; i++) {
                        // Create a chapter every ~30s or on specific scene changes? 
                        // The prompt/gemini will decide the titles, we just feed the map.
                        // Let's feed every scene start time + topic summary
                        const startTime = formatDuration(currentTime);
                        const duration = durations[i];
                        const topic = currentScript.timeline[i].narration.slice(0, 50) + "...";

                        chaptersList += `${startTime} - [Cena ${i + 1}] ${topic}\n`;

                        currentTime += duration;
                    }
                    chapterContext = chaptersList;
                }
            }

            const data = await generateSocialSEO(script, config, chapterContext);
            const videoName = extractProjectName(script, videoFile);
            setThumbPrompt(`A stunning visual representation for a video about: ${videoName}. Cinematic lighting, professional media style, no text.`);
            setResults(data);
            setStatus(SocialAppStatus.SUCCESS);
            const newEntry: HistoryItem = { id: crypto.randomUUID(), timestamp: Date.now(), videoName, script, results: data };
            setHistory(prev => [newEntry, ...prev].slice(0, 100));
        } catch (err: any) {
            console.error(err);
            setError("Falha na geração. Verifique sua chave API ou o formato do roteiro. Detalhes: " + err.message);
            setStatus(SocialAppStatus.ERROR);
        }
    };

    const handleGenerateThumbs = async () => {
        if (!results || !thumbPrompt) return;
        try {
            setStatus(SocialAppStatus.GENERATING_THUMBS);

            const keys = getEffectiveKeys();
            const config = {
                apiKey: keys.gemini === 'PROXY_MODE' ? undefined : keys.gemini,
                useProxy: authMode === 'db',
                token: localStorage.getItem('admin_token') || undefined
            };

            const landscape = await generateSocialThumbnail(thumbPrompt, "16:9", config);
            const portrait = await generateSocialThumbnail(thumbPrompt, "9:16", config);
            const updatedResults = { ...results, thumbnails: { landscape, portrait } };
            setResults(updatedResults);
            setHistory(prev => prev.map(item => item.script === script ? { ...item, results: updatedResults } : item));
            setStatus(SocialAppStatus.SUCCESS);
        } catch (err: any) {
            alert("Erro ao gerar capas: " + err.message);
            setStatus(SocialAppStatus.SUCCESS);
        }
    };

    // ... (Editing handlers)
    const startEditing = (e: React.MouseEvent, id: string, currentValue: string) => {
        e.stopPropagation();
        setEditingId(id);
        setEditValue(currentValue);
    };

    const syncTitleFromScript = (e: React.MouseEvent, id: string, itemScript: string) => {
        e.stopPropagation();
        const newName = extractProjectName(itemScript);
        setHistory(prev => prev.map(item => item.id === id ? { ...item, videoName: newName } : item));
    };

    const saveEdit = (id: string) => {
        if (editValue.trim()) setHistory(prev => prev.map(item => item.id === id ? { ...item, videoName: editValue.trim() } : item));
        setEditingId(null);
    };

    const handleEditKeyPress = (e: React.KeyboardEvent, id: string) => {
        if (e.key === 'Enter') saveEdit(id);
        if (e.key === 'Escape') setEditingId(null);
    };

    const loadFromHistory = (item: HistoryItem) => {
        setResults(item.results);
        setScript(item.script);
        setIsHistoryOpen(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };


    return (
        <div className="pb-20 selection:bg-indigo-100/30">
            {/* Helper Header for History - can be moved to main header later but keeping local for now */}
            <div className="flex justify-end mb-6">
                <button
                    onClick={() => setIsHistoryOpen(true)}
                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-full hover:bg-indigo-600 transition-all active:scale-95 font-bold text-xs shadow-md border border-slate-700"
                >
                    <RefreshCw className="w-4 h-4" />
                    Histórico
                </button>
            </div>

            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-4">
                        <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm sticky top-24 text-slate-900">
                            <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-100">01</span>
                                Input Content
                            </h2>
                            <div className="space-y-6">
                                <div
                                    className={`relative group border-2 border-dashed rounded-2xl overflow-hidden transition-all cursor-pointer ${videoPreview ? 'border-indigo-500 aspect-video' : 'border-slate-200 p-8 bg-slate-50 hover:bg-white hover:border-indigo-300'}`}
                                    onClick={() => videoInputRef.current?.click()}
                                >
                                    <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoChange} />
                                    {videoPreview ? <video src={videoPreview} className="w-full h-full object-cover" /> : (
                                        <div className="flex flex-col items-center text-center">
                                            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-indigo-500 mb-3 group-hover:scale-110 transition-transform">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                                            </div>
                                            <p className="text-xs font-bold text-slate-700">Adicionar Vídeo</p>
                                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-black">Opcional</p>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest flex justify-between items-center">
                                        Roteiro (JSON ou Texto)
                                        {currentScript && (
                                            <button
                                                onClick={() => setScript(JSON.stringify(currentScript, null, 2))}
                                                className="text-indigo-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                                                title="Importar do Projeto Aberto"
                                            >
                                                <Download className="w-3 h-3" />
                                                Importar Atual
                                            </button>
                                        )}
                                    </label>
                                    <textarea
                                        value={script} onChange={(e) => setScript(e.target.value)}
                                        placeholder='Cole seu roteiro JSON ou texto aqui...'
                                        className="w-full h-48 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-mono focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all resize-none shadow-sm text-slate-800"
                                    />
                                </div>
                                <button
                                    onClick={handleGenerate} disabled={status === SocialAppStatus.GENERATING}
                                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm hover:bg-indigo-600 transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {status === SocialAppStatus.GENERATING ? 'Analisando Conteúdo...' : 'Gerar SEO Estratégico'}
                                </button>
                                {error && <p className="text-rose-500 text-[10px] font-black uppercase text-center bg-rose-50 py-2 rounded-lg">{error}</p>}
                            </div>
                        </section>
                    </div>

                    <div className="lg:col-span-8">
                        {!results ? (
                            <div className="h-full min-h-[500px] border-2 border-dashed border-slate-700 rounded-[40px] flex flex-col items-center justify-center p-12 text-center bg-slate-800/40">
                                <div className="w-16 h-16 rounded-3xl bg-slate-700 shadow-lg flex items-center justify-center mb-6 text-slate-400">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                                </div>
                                <h3 className="text-xl font-black text-slate-200">Pronto para Otimizar</h3>
                                <p className="text-slate-400 max-w-sm mt-3 text-sm leading-relaxed">Gere o SEO completo para vídeos normais (longos) e shorts em todas as redes.</p>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <section className="bg-white rounded-[40px] p-8 border border-slate-200 shadow-sm space-y-6 text-slate-900">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Capas Estratégicas</h2>
                                            <p className="text-slate-500 text-xs">Refine o prompt visual abaixo antes de gerar.</p>
                                        </div>
                                        <button
                                            onClick={handleGenerateThumbs} disabled={status === SocialAppStatus.GENERATING_THUMBS}
                                            className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
                                        >
                                            {status === SocialAppStatus.GENERATING_THUMBS ? 'Criando...' : (results.thumbnails ? 'Regerar Capas' : 'Gerar Capas')}
                                        </button>
                                    </div>
                                    <textarea
                                        value={thumbPrompt} onChange={(e) => setThumbPrompt(e.target.value)}
                                        className="w-full h-20 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none shadow-sm"
                                    />
                                    {results.thumbnails && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                            <div className="space-y-2">
                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Horizontal (16:9)</span>
                                                <img src={results.thumbnails.landscape} className="w-full aspect-video object-cover rounded-[32px] shadow-xl bg-slate-100 border-4 border-white" />
                                            </div>
                                            <div className="space-y-2">
                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Vertical (9:16)</span>
                                                <div className="flex justify-center h-[250px]">
                                                    <img src={results.thumbnails.portrait} className="h-full aspect-[9/16] object-cover rounded-[32px] shadow-xl bg-slate-100 border-4 border-white" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </section>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                                    {results.youtubeLong && <PlatformCard seo={results.youtubeLong} onOpen={handleOpenApp} />}
                                    {results.youtube && <PlatformCard seo={results.youtube} onOpen={handleOpenApp} />}
                                    {results.tiktok && <PlatformCard seo={results.tiktok} onOpen={handleOpenApp} />}
                                    {results.instagram && <PlatformCard seo={results.instagram} onOpen={handleOpenApp} />}
                                    {results.facebook && <PlatformCard seo={results.facebook} onOpen={handleOpenApp} />}
                                    {results.kwai && <PlatformCard seo={results.kwai} onOpen={handleOpenApp} />}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isHistoryOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end text-slate-900">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsHistoryOpen(false)}></div>
                    <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-8 border-b flex justify-between items-center bg-slate-50">
                            <h3 className="text-xl font-black text-slate-900">Histórico de SEO</h3>
                            <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-4 border-b bg-slate-50 flex gap-2 overflow-x-auto scrollbar-hide">
                            <button onClick={exportHistory} className="flex-1 min-w-[100px] py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-sm transition-colors">Exportar</button>
                            <button onClick={() => importInputRef.current?.click()} className="flex-1 min-w-[100px] py-2 bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 transition-colors">Importar</button>
                            <input ref={importInputRef} type="file" accept=".json" className="hidden" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                    try {
                                        const imported = JSON.parse(event.target?.result as string);
                                        if (Array.isArray(imported)) {
                                            setHistory(imported.slice(0, 100));
                                            alert("Histórico importado com sucesso!");
                                        }
                                    } catch { alert("Arquivo JSON inválido."); }
                                };
                                reader.readAsText(file);
                                e.target.value = '';
                            }} />
                            <button onClick={clearHistory} className="flex-1 min-w-[100px] py-2 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-colors">Limpar</button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto flex-1 bg-slate-50/30">
                            {history.length > 0 ? history.map(item => (
                                <div key={item.id} onClick={() => loadFromHistory(item)} className="p-4 bg-white rounded-xl cursor-pointer hover:border-indigo-400 border border-slate-100 transition-all group relative shadow-sm hover:shadow-md">
                                    <div className="relative z-10 flex flex-col gap-2">
                                        <div className="flex justify-between items-start gap-2">
                                            {editingId === item.id ? (
                                                <input autoFocus value={editValue} onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={() => saveEdit(item.id)} onKeyDown={(e) => handleEditKeyPress(e, item.id)}
                                                    onClick={(e) => e.stopPropagation()} className="w-full bg-slate-50 border border-indigo-200 rounded p-1 text-sm font-bold text-indigo-700 focus:outline-none" />
                                            ) : (
                                                <div className="flex items-center gap-2 max-w-[85%]">
                                                    <h4 className="font-bold text-sm truncate text-slate-800 group-hover:text-indigo-600 transition-colors">{item.videoName}</h4>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button onClick={(e) => startEditing(e, item.id, item.videoName)} className="p-1 hover:bg-indigo-50 rounded text-indigo-400" title="Editar nome"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                                        <button onClick={(e) => syncTitleFromScript(e, item.id, item.script)} className="p-1 hover:bg-indigo-50 rounded text-indigo-400" title="Sincronizar título do script"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
                                                    </div>
                                                </div>
                                            )}
                                            <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                                            {new Date(item.timestamp).toLocaleDateString()} • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-20">
                                    <div className="text-slate-200 mb-4 flex justify-center">
                                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                    </div>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Nenhum registro encontrado</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SocialSeoModule;
