import React, { useEffect, useRef, useState } from 'react';
import { X, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { TimelineEntry, WordTiming } from '../types';
import { SubtitleRenderer, SubtitleSegment } from '../services/subtitleRenderer';
import { detectSpeakerFromText } from '../config/characterColors';

interface PreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    timeline: TimelineEntry[];
    images: Record<number, string>;
    audios: Record<number, string>;
    alignments?: Record<number, WordTiming[]>;
    currentIndex: number;
    onIndexChange: (index: number) => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
    isOpen,
    onClose,
    timeline,
    images,
    audios,
    alignments,
    currentIndex,
    onIndexChange
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const animationFrameRef = useRef<number>();
    const subtitleRendererRef = useRef<SubtitleRenderer | null>(null);

    // Limpar ao fechar
    useEffect(() => {
        if (!isOpen) {
            setIsPlaying(false);
            setCurrentTime(0);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        }
    }, [isOpen]);

    // Inicializar canvas e carregar cena atual
    useEffect(() => {
        if (!isOpen || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Criar renderer de legendas
        if (!subtitleRendererRef.current) {
            subtitleRendererRef.current = new SubtitleRenderer(canvas);
        }

        // Carregar imagem da cena atual
        const imageUrl = images[currentIndex];
        if (imageUrl) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                // Desenhar imagem
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Desenhar legenda inicial (tempo 0)
                if (timeline[currentIndex]) {
                    const entry = timeline[currentIndex];
                    const detected = detectSpeakerFromText(entry.narration);

                    let speaker = entry.speaker;
                    let text = entry.narration;

                    if (!speaker) {
                        speaker = detected.speaker;
                        text = detected.cleanText;
                    } else if (detected.speaker.toLowerCase() === speaker.toLowerCase()) {
                        text = detected.cleanText;
                    }

                    const subtitle: SubtitleSegment = {
                        speaker: speaker || detected.speaker, // Fallback p/ detected se entry.speaker for null (mas tratado acima)
                        text: text,
                        startTime: 0,
                        duration: duration || 5,
                        wordTimings: alignments?.[currentIndex]
                    };

                    if (subtitleRendererRef.current) {
                        subtitleRendererRef.current.drawSubtitle(subtitle, 0);
                    }
                }
            };
            img.src = imageUrl;
        }

        // Carregar áudio
        if (audioRef.current && audios[currentIndex]) {
            audioRef.current.src = audios[currentIndex];
            audioRef.current.load();
        }

    }, [isOpen, currentIndex, images, audios, timeline, duration, alignments]);

    // Atualizar canvas durante reprodução
    useEffect(() => {
        if (!isPlaying || !canvasRef.current || !subtitleRendererRef.current) {
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const updateFrame = () => {
            // Redesenhar imagem
            const imageUrl = images[currentIndex];
            if (imageUrl) {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    ctx.fillStyle = '#000';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    // Desenhar legenda com tempo atual
                    if (timeline[currentIndex] && subtitleRendererRef.current) {
                        const entry = timeline[currentIndex];
                        const detected = detectSpeakerFromText(entry.narration);

                        let speaker = entry.speaker;
                        let text = entry.narration;

                        if (!speaker) {
                            speaker = detected.speaker;
                            text = detected.cleanText;
                        } else if (detected.speaker.toLowerCase() === speaker.toLowerCase()) {
                            text = detected.cleanText;
                        }

                        const subtitle: SubtitleSegment = {
                            speaker: speaker || detected.speaker,
                            text: text,
                            startTime: 0,
                            duration: duration,
                            wordTimings: alignments?.[currentIndex]
                        };

                        subtitleRendererRef.current.drawSubtitle(subtitle, currentTime);
                    }
                };
                img.src = imageUrl;
            }

            animationFrameRef.current = requestAnimationFrame(updateFrame);
        };

        updateFrame();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isPlaying, currentTime, currentIndex, images, timeline, duration, alignments]);

    // Handlers
    const handlePlayPause = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            onIndexChange(currentIndex - 1);
            setIsPlaying(false);
            setCurrentTime(0);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        }
    };

    const handleNext = () => {
        if (currentIndex < timeline.length - 1) {
            onIndexChange(currentIndex + 1);
            setIsPlaying(false);
            setCurrentTime(0);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        if (currentIndex < timeline.length - 1) {
            // Auto avançar para próxima cena
            setTimeout(() => {
                handleNext();
            }, 500);
        }
    };

    if (!isOpen) return null;

    const currentEntry = timeline[currentIndex];

    return (
        <div className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-6xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-2xl font-bold text-white">Preview Cinema</h3>
                        <p className="text-sm text-slate-400">
                            Cena {currentIndex + 1} de {timeline.length}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* Canvas com legendas */}
                <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl mb-4">
                    <canvas
                        ref={canvasRef}
                        width={1280}
                        height={720}
                        className="w-full h-auto"
                    />

                    {/* Audio oculto */}
                    <audio
                        ref={audioRef}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onEnded={handleEnded}
                    />
                </div>

                {/* Controles */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                    {/* Barra de progresso */}
                    <div className="mb-4">
                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-amber-500 transition-all duration-100"
                                style={{ width: `${(currentTime / duration) * 100}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                            <span>{currentTime.toFixed(1)}s</span>
                            <span>{duration.toFixed(1)}s</span>
                        </div>
                    </div>

                    {/* Botões de controle */}
                    <div className="flex items-center justify-center gap-4">
                        <button
                            onClick={handlePrevious}
                            disabled={currentIndex === 0}
                            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft className="w-5 h-5 text-white" />
                        </button>

                        <button
                            onClick={handlePlayPause}
                            className="p-4 bg-amber-600 hover:bg-amber-500 rounded-full transition-all shadow-lg"
                        >
                            {isPlaying ? (
                                <Pause className="w-6 h-6 text-white fill-current" />
                            ) : (
                                <Play className="w-6 h-6 text-white fill-current" />
                            )}
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={currentIndex === timeline.length - 1}
                            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    {/* Narração */}
                    {currentEntry && (
                        <div className="mt-4 p-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
                            <p className="text-sm text-slate-300 italic text-center leading-relaxed">
                                "{currentEntry.narration}"
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PreviewModal;
