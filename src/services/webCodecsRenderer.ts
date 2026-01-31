import { FullProject } from '../types';
import * as Mp4Muxer from 'mp4-muxer';
import { SubtitleRenderer, createSubtitleSegments, getActiveSubtitle, type SubtitleSegment } from './subtitleRenderer';
import { detectSpeakerFromText } from '../config/characterColors';

export class WebCodecsVideoRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private subtitleRenderer: SubtitleRenderer;

    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 1280;
        this.canvas.height = 720;
        const ctx = this.canvas.getContext('2d', { alpha: false });
        if (!ctx) throw new Error("Could not get canvas context");
        this.ctx = ctx;
        this.subtitleRenderer = new SubtitleRenderer(this.canvas);
    }

    private async loadImage(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    private async loadAudio(src: string): Promise<AudioBuffer> {
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        const audioCtx = new AudioContext();
        return await audioCtx.decodeAudioData(arrayBuffer);
    }

    async renderProject(
        project: FullProject,
        images: Record<number, string>,
        audios: Record<number, string>,
        backgroundMusic?: string,
        onProgress?: (progress: number, status: string) => void
    ): Promise<Blob> {
        const { timeline } = project.script;
        const fps = 30;

        // 1. Load All Assets First
        onProgress?.(5, "Carregando e preparando assets...");
        const loadedScenes: { img: HTMLImageElement; audio: AudioBuffer; duration: number }[] = [];

        for (let i = 0; i < timeline.length; i++) {
            if (!images[i] || !audios[i]) continue;
            try {
                const img = await this.loadImage(images[i]);
                let audio: AudioBuffer;

                // Audio Load Logic
                try {
                    if (audios[i].startsWith('data:') || audios[i].startsWith('blob:') || audios[i].startsWith('http') || audios[i].startsWith('/')) {
                        audio = await this.loadAudio(audios[i]);
                    } else {
                        // Assume raw base64 (older format or fallback)
                        const audioCtx = new AudioContext();
                        const byteCharacters = atob(audios[i]);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let j = 0; j < byteCharacters.length; j++) {
                            byteNumbers[j] = byteCharacters.charCodeAt(j);
                        }
                        const byteArray = new Uint8Array(byteNumbers);
                        audio = await audioCtx.decodeAudioData(byteArray.buffer);
                    }
                } catch (e) {
                    console.warn(`Audio fail scene ${i}, using silent fallback. URL: ${audios[i]}`, e);
                    const ctx = new AudioContext();
                    audio = ctx.createBuffer(2, 48000 * 2, 48000); // 2s silent fallback
                }

                loadedScenes.push({ img, audio, duration: audio.duration });

            } catch (e) {
                console.error(`Error loading scene ${i}`, e);
            }
        }

        if (loadedScenes.length === 0) throw new Error("Nenhuma cena carregada com sucesso.");

        // 2. Concatenate Audio into one master buffer
        const totalDuration = loadedScenes.reduce((acc, s) => acc + s.duration, 0);
        const sampleRate = 48000;
        const totalAudioFrames = Math.ceil(totalDuration * sampleRate);
        const offlineCtx = new OfflineAudioContext(2, totalAudioFrames, sampleRate);

        let offset = 0;
        for (const scene of loadedScenes) {
            const source = offlineCtx.createBufferSource();
            source.buffer = scene.audio;
            source.connect(offlineCtx.destination);
            source.start(offset);
            offset += scene.audio.duration;
        }

        if (backgroundMusic) {
            try {
                const bgBuffer = await this.loadAudio(backgroundMusic);
                const bgSource = offlineCtx.createBufferSource();
                bgSource.buffer = bgBuffer;
                bgSource.loop = true;
                const gain = offlineCtx.createGain();
                gain.gain.value = 0.3;
                bgSource.connect(gain);
                gain.connect(offlineCtx.destination);
                bgSource.start(0);
            } catch (e) { console.warn("BG Music failed", e); }
        }

        const masterAudioBuffer = await offlineCtx.startRendering();

        // 3. Setup Muxer & Encoders
        const muxer = new Mp4Muxer.Muxer({
            target: new Mp4Muxer.ArrayBufferTarget(),
            video: {
                codec: 'avc',
                width: this.canvas.width,
                height: this.canvas.height
            },
            audio: {
                codec: 'aac',
                numberOfChannels: 2,
                sampleRate: 48000
            },
            fastStart: 'in-memory'
        });

        const videoEncoder = new VideoEncoder({
            output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
            error: (e) => console.error("Video Encode Error", e)
        });
        videoEncoder.configure({
            codec: 'avc1.4d002a',
            width: this.canvas.width,
            height: this.canvas.height,
            bitrate: 5_000_000,
            framerate: fps
        });

        const audioEncoder = new AudioEncoder({
            output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
            error: (e) => console.error("Audio Encode Error", e)
        });
        audioEncoder.configure({
            codec: 'mp4a.40.2',
            numberOfChannels: 2,
            sampleRate: 48000,
            bitrate: 128000
        });

        // 4. Encode Audio (Chunked)
        onProgress?.(20, "Codificando áudio...");
        const numberOfChannels = masterAudioBuffer.numberOfChannels;
        const length = masterAudioBuffer.length;
        const interleaved = new Float32Array(length * numberOfChannels);

        for (let channel = 0; channel < numberOfChannels; channel++) {
            const data = masterAudioBuffer.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                interleaved[i * numberOfChannels + channel] = data[i];
            }
        }

        const audioChunkSize = 48000; // 1 sec chunks
        for (let i = 0; i < length; i += audioChunkSize) {
            const end = Math.min(i + audioChunkSize, length);
            const frameCount = end - i;
            const chunkData = interleaved.slice(i * numberOfChannels, end * numberOfChannels);

            const audioData = new AudioData({
                format: 'f32',
                sampleRate: 48000,
                numberOfFrames: frameCount,
                numberOfChannels: numberOfChannels,
                timestamp: (i / 48000) * 1_000_000,
                data: chunkData
            });
            audioEncoder.encode(audioData);
            audioData.close();
        }
        await audioEncoder.flush();

        // 5. Preparar Legendas
        const subtitleSegments: SubtitleSegment[] = createSubtitleSegments(
            timeline.map(entry => ({
                text: entry.narration,
                speaker: entry.speaker
            })),
            loadedScenes.map(s => s.duration)
        );

        // Inject word timings if available for perfect sync
        if (project.alignments) {
            subtitleSegments.forEach((seg, idx) => {
                if (project.alignments![idx]) {
                    seg.wordTimings = project.alignments![idx];
                }
            });
        }

        // 6. Encode Video
        onProgress?.(40, "Renderizando vídeo com legendas...");
        const totalVideoFrames = Math.ceil(totalDuration * fps);
        let sceneIndex = 0;
        let timeElapsed = 0;

        for (let i = 0; i < totalVideoFrames; i++) {
            const time = i / fps;

            // Allow JS event loop to breathe
            if (i % 30 === 0) await new Promise(r => setTimeout(r, 0));

            // Backpressure: aguardar se a fila do encoder estiver muito cheia
            if (videoEncoder.encodeQueueSize > 10) {
                await new Promise(r => setTimeout(r, 10));
            }

            // Find which scene we are in
            while (sceneIndex < loadedScenes.length - 1 && time >= timeElapsed + loadedScenes[sceneIndex].duration) {
                timeElapsed += loadedScenes[sceneIndex].duration;
                sceneIndex++;
                onProgress?.(40 + (sceneIndex / loadedScenes.length) * 50, `Renderizando cena ${sceneIndex + 1}/${loadedScenes.length}...`);
            }

            const sceneObj = loadedScenes[sceneIndex];
            const scene = timeline[sceneIndex];
            if (!sceneObj) break;

            const sceneTime = Math.max(0, time - timeElapsed);
            const progress = Math.min(1, sceneTime / sceneObj.duration);
            const cam = scene.cameraMovement || 'static';

            // Draw
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            let scale = 1.0;
            let tx = 0;
            let ty = 0;
            if (cam === 'zoom_in') {
                scale = 1.0 + (progress * 0.15);
            } else if (cam === 'zoom_out') {
                scale = 1.15 - (progress * 0.15);
            } else if (cam === 'pan_left') {
                scale = 1.1;
                tx = - (progress * 50);
            } else if (cam === 'pan_right') {
                scale = 1.1;
                tx = (progress * 50) - 25;
            }

            this.ctx.save();
            this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.scale(scale, scale);
            this.ctx.translate(tx, ty);
            this.ctx.drawImage(sceneObj.img, -this.canvas.width / 2, -this.canvas.height / 2, this.canvas.width, this.canvas.height);
            this.ctx.restore();

            // Desenhar legendas sincronizadas
            const activeSubtitle = getActiveSubtitle(subtitleSegments, time);
            if (activeSubtitle) {
                this.subtitleRenderer.drawSubtitle(activeSubtitle, time);
            }

            // Encode
            const frame = new VideoFrame(this.canvas, { timestamp: time * 1_000_000 });
            videoEncoder.encode(frame, { keyFrame: i % fps === 0 });
            frame.close();
        }

        console.log('📹 Codificação de vídeo concluída, iniciando flush...');
        onProgress?.(90, "Finalizando codificação de vídeo...");
        await videoEncoder.flush();
        console.log('✅ VideoEncoder flush completo');

        onProgress?.(95, "Processando container MP4...");
        console.log('📦 Finalizando muxer...');
        muxer.finalize();
        console.log('✅ Muxer finalizado');

        onProgress?.(100, "Vídeo exportado com sucesso!");
        const videoBlob = new Blob([muxer.target.buffer], { type: 'video/mp4' });

        console.log('✅ Vídeo renderizado com sucesso!', {
            size: `${(videoBlob.size / 1024 / 1024).toFixed(2)} MB`,
            duration: `${totalDuration.toFixed(2)}s`,
            scenes: loadedScenes.length
        });

        // Cleanup
        videoEncoder.close();
        audioEncoder.close();

        return videoBlob;
    }
}

export const webCodecsRenderer = new WebCodecsVideoRenderer();
