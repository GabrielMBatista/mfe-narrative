import React, { useState } from 'react';
import { ImageIcon, Video, RefreshCw, Sparkles, Download, Type, Check, X, Palette, Layout } from 'lucide-react';
import { estimateThumbnailSize, overlayTextOnThumbnail, TextOverlayOptions } from '../services/thumbnailService';

interface ThumbnailPanelProps {
    projectThumbnail: string | null;
    thumbnailPrompt: string;
    setThumbnailPrompt: (prompt: string) => void;
    isGeneratingThumbnail: boolean;
    onDownload: () => void;
    onSuggestPrompt: () => void;
    onGenerateCustom: () => void;
    onUpdateThumbnail: (newThumbnail: string) => void;
    thumbnailSuggestions?: { prompt: string; title: string; subtitle: string; color: string, imageUrl?: string }[];
    handlers?: any;
}

const ThumbnailPanel: React.FC<ThumbnailPanelProps> = ({
    projectThumbnail,
    thumbnailPrompt,
    setThumbnailPrompt,
    isGeneratingThumbnail,
    onDownload,
    onSuggestPrompt,
    onGenerateCustom,
    onUpdateThumbnail,
    thumbnailSuggestions = [],
    handlers
}) => {
    const [showTextOverlay, setShowTextOverlay] = useState(false);
    const [overlayTitle, setOverlayTitle] = useState("");
    const [overlaySubtitle, setOverlaySubtitle] = useState("");
    const [overlayPosition, setOverlayPosition] = useState<'center' | 'top' | 'bottom'>('center');
    const [titleColor, setTitleColor] = useState('#FFD700');

    // Preview Logic (Simples) or Just inputs?
    // Let's keep it simple: Inputs -> Apply -> Updates State -> UI Updates

    const handleApplyText = async () => {
        if (!projectThumbnail) return;

        try {
            const newThumb = await overlayTextOnThumbnail(projectThumbnail, {
                title: overlayTitle,
                subtitle: overlaySubtitle,
                position: overlayPosition,
                titleColor: titleColor,
                titleShadow: true
            });
            onUpdateThumbnail(newThumb);
            setShowTextOverlay(false); // Close overlay mode
            setOverlayTitle("");
            setOverlaySubtitle("");
        } catch (e) {
            console.error("Failed to overlay text", e);
            alert("Erro ao aplicar texto na imagem.");
        }
    };

    return (
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
            <h4 className="text-sm font-black uppercase text-slate-500 mb-4 flex items-center gap-2 tracking-widest">
                <ImageIcon className="w-4 h-4 text-amber-500" /> Thumbnail YouTube (Capa)
            </h4>

            <div className="space-y-4">
                {/* Visualização da Thumbnail */}
                <div className="relative group rounded-xl overflow-hidden border border-slate-700 shadow-2xl aspect-video bg-black">
                    {projectThumbnail ? (
                        <>
                            <img
                                src={projectThumbnail}
                                className="w-full h-full object-cover"
                                alt="Thumbnail do YouTube"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>

                            {/* UI simulada de YouTube player time */}
                            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                05:00
                            </div>

                            <div className="absolute inset-x-0 bottom-0 p-3 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <span className="text-[10px] text-slate-300 font-mono bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
                                    {estimateThumbnailSize(projectThumbnail)} KB
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-6 bg-slate-950/50">
                            <Video className="w-12 h-12 text-slate-800" />
                            <p className="text-xs text-slate-500 font-medium">
                                Sem thumbnail definida
                            </p>
                        </div>
                    )}

                    {/* Botões de Ação (Overlay) */}
                    {projectThumbnail && (
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => setShowTextOverlay(!showTextOverlay)}
                                className={`p-2 ${showTextOverlay ? 'bg-amber-600 text-white' : 'bg-black/50 text-white hover:bg-black/80'} rounded-lg backdrop-blur-sm transition-colors`}
                                title="Adicionar Texto"
                            >
                                <Type className="w-4 h-4" />
                            </button>
                            <button
                                onClick={onDownload}
                                className="p-2 bg-black/50 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition-colors"
                                title="Baixar thumbnail"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm('Regerar capa irá substituir a atual. Continuar?')) {
                                        onSuggestPrompt();
                                    }
                                }}
                                className="p-2 bg-black/50 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition-colors"
                                title="Criar nova versão"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Painel de Texto Overlay */}
                {showTextOverlay && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/30 space-y-3 animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-[10px] uppercase font-bold text-amber-500 tracking-wider flex items-center gap-2">
                                <Type className="w-3 h-3" /> Editor de Texto
                            </label>
                            <button onClick={() => setShowTextOverlay(false)} className="text-slate-500 hover:text-slate-300"><X className="w-3 h-3" /></button>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            <input
                                type="text"
                                placeholder="TÍTULO PRINCIPAL (ex: O SEGREDO...)"
                                value={overlayTitle}
                                onChange={(e) => setOverlayTitle(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white placeholder:text-slate-600 focus:border-amber-500 outline-none font-bold"
                            />
                            <input
                                type="text"
                                placeholder="Subtítulo (opcional)"
                                value={overlaySubtitle}
                                onChange={(e) => setOverlaySubtitle(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white placeholder:text-slate-600 focus:border-amber-500 outline-none"
                            />
                        </div>

                        <div className="flex gap-2">
                            <div className="bg-slate-900 flex rounded border border-slate-700 p-1">
                                <button onClick={() => setOverlayPosition('top')} title="Topo" className={`p-1.5 rounded ${overlayPosition === 'top' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}><Layout className="w-3 h-3 transform rotate-180" /></button>
                                <button onClick={() => setOverlayPosition('center')} title="Centro" className={`p-1.5 rounded ${overlayPosition === 'center' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}><Layout className="w-3 h-3" /></button>
                                <button onClick={() => setOverlayPosition('bottom')} title="Fundo" className={`p-1.5 rounded ${overlayPosition === 'bottom' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}><Layout className="w-3 h-3" /></button>
                            </div>
                            <div className="flex-1 flex gap-1 items-center bg-slate-900 border border-slate-700 rounded px-2">
                                <Palette className="w-3 h-3 text-slate-500" />
                                <input type="color" value={titleColor} onChange={(e) => setTitleColor(e.target.value)} className="bg-transparent w-full h-6 cursor-pointer" />
                            </div>
                        </div>

                        <button
                            onClick={handleApplyText}
                            className="w-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Check className="w-3 h-3" /> Aplicar Texto na Capa
                        </button>
                    </div>
                )}

                {/* Controles de Geração */}
                {!showTextOverlay && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                        {thumbnailSuggestions && thumbnailSuggestions.length > 0 ? (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Escolha uma Opção (A/B Test)</label>
                                    <button onClick={onSuggestPrompt} className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                                        <RefreshCw className="w-3 h-3" /> Novas Ideias
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                    {thumbnailSuggestions.map((sugg, idx) => (
                                        <div key={idx}
                                            onClick={() => {
                                                setThumbnailPrompt(sugg.prompt);
                                                // Pre-fill overlay text based on AI suggestion
                                                setOverlayTitle(sugg.title);
                                                setOverlaySubtitle(sugg.subtitle);
                                                setTitleColor(sugg.color || '#FFD700');
                                            }}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-slate-900 ${thumbnailPrompt === sugg.prompt ? 'border-amber-500 bg-slate-900/50 ring-1 ring-amber-500/50' : 'border-slate-800 bg-slate-900/30'}`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    {sugg.imageUrl && (
                                                        <div className="relative group/img mb-2">
                                                            <img src={sugg.imageUrl} alt="Preview" className="w-full h-auto rounded object-cover aspect-video border border-slate-700" />
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const a = document.createElement('a');
                                                                    a.href = sugg.imageUrl!;
                                                                    a.download = `option_${idx + 1}_${sugg.title.substring(0, 20).replace(/\s+/g, '_')}.png`;
                                                                    a.click();
                                                                }}
                                                                className="absolute top-1 right-1 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-md opacity-0 group-hover/img:opacity-100 transition-opacity border border-white/20"
                                                                title="Baixar esta versão"
                                                            >
                                                                <Download className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    )}
                                                    <h5 className="text-xs font-bold text-slate-200" style={{ color: sugg.color }}>{sugg.title}</h5>
                                                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{sugg.prompt}</p>
                                                </div>
                                                {thumbnailPrompt === sugg.prompt && <Check className="w-4 h-4 text-amber-500 shrink-0" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {thumbnailPrompt && (
                                    <button
                                        onClick={() => {
                                            const selected = thumbnailSuggestions.find(s => s.prompt === thumbnailPrompt);
                                            // @ts-ignore
                                            onGenerateCustom(thumbnailPrompt, selected ? { title: selected.title, subtitle: selected.subtitle, color: selected.color } : undefined);
                                        }}
                                        disabled={isGeneratingThumbnail}
                                        className="w-full mt-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50"
                                    >
                                        {isGeneratingThumbnail ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                        Gerar Essa Versão
                                    </button>
                                )}

                                {thumbnailSuggestions.length > 0 && !thumbnailSuggestions.some(s => s.imageUrl) && (
                                    <button
                                        // @ts-ignore
                                        onClick={isGeneratingThumbnail ? undefined : () => handlers?.handleGenerateAllThumbnails && handlers.handleGenerateAllThumbnails()}
                                        disabled={isGeneratingThumbnail}
                                        className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50"
                                    >
                                        {isGeneratingThumbnail ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
                                        Gerar Todas as 3 Opções
                                    </button>
                                )}
                            </div>
                        ) : (
                            !thumbnailPrompt ? (
                                <div className="text-center">
                                    <p className="text-[10px] text-slate-400 mb-3">
                                        Crie 3 opções exclusivas de capa focadas em alta taxa de clique (CTR).
                                    </p>
                                    <button
                                        onClick={onSuggestPrompt}
                                        disabled={isGeneratingThumbnail}
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/20 disabled:opacity-50"
                                    >
                                        {isGeneratingThumbnail ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                        Sugerir 3 Ideias Virais
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Prompt Personalizado</label>
                                        <button onClick={() => setThumbnailPrompt("")} className="text-[10px] text-slate-500 hover:text-red-400">Cancelar</button>
                                    </div>
                                    <textarea
                                        value={thumbnailPrompt}
                                        onChange={(e) => setThumbnailPrompt(e.target.value)}
                                        className="w-full h-24 bg-slate-900 border border-indigo-500/30 rounded-lg p-3 text-xs text-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                                        placeholder="Descreva a capa perfeita..."
                                    />
                                    <button
                                        // @ts-ignore
                                        onClick={() => onGenerateCustom()}
                                        disabled={isGeneratingThumbnail}
                                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50"
                                    >
                                        {isGeneratingThumbnail ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
                                        Gerar Thumbnail
                                    </button>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ThumbnailPanel;
