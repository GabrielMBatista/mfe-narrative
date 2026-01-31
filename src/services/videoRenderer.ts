import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { FullProject } from '../types';

export class VideoRenderer {
    private ffmpeg: FFmpeg;
    private loaded: boolean = false;

    constructor() {
        this.ffmpeg = new FFmpeg();
    }

    async load() {
        if (this.loaded) return;
        try {
            await this.ffmpeg.load({
                coreURL: new URL('/ffmpeg-core.js', window.location.origin).href,
                wasmURL: new URL('/ffmpeg-core.wasm', window.location.origin).href,
            });
            this.loaded = true;
            console.log("FFmpeg loaded successfully.");
        } catch (error) {
            console.error("Failed to load FFmpeg:", error);
            throw new Error("Falha ao carregar o motor de vídeo (FFmpeg). Tente recarregar a página.");
        }
    }

    async renderProject(
        project: FullProject,
        images: Record<number, string>,
        audios: Record<number, string>,
        backgroundMusic?: string,
        onProgress?: (progress: number, status: string) => void
    ): Promise<Blob> {
        if (!this.loaded) await this.load();

        const { timeline } = project.script;
        const fileList: string[] = [];

        onProgress?.(5, "Preparando assets...");

        // 1. Process each scene
        for (let i = 0; i < timeline.length; i++) {
            const index = i;
            const scene = timeline[i];

            const imgData = images[index];
            const audioData = audios[index];

            if (!imgData || !audioData) {
                console.warn(`Scene ${i} missing assets, skipping.`);
                continue;
            }

            const imgName = `image_${i}.png`;
            const audioName = `audio_${i}.mp3`; // Assuming mp3 for simplicity, or check header
            const videoName = `scene_${i}.mp4`;

            // Write files to virtual FS
            await this.ffmpeg.writeFile(imgName, await fetchFile(imgData));
            await this.ffmpeg.writeFile(audioName, await fetchFile(audioData));

            onProgress?.(10 + (i / timeline.length) * 40, `Renderizando cena ${i + 1}/${timeline.length}...`);

            // Calculate zoom/pan filter
            let vf = "scale=1280:720"; // Base scaling
            const cam = scene.cameraMovement || 'static';
            // Simple ZoomPan logic
            // duration roughly 10s (250 frames) just to be safe, -shortest cuts it
            if (cam === 'zoom_in') {
                vf = "zoompan=z='min(zoom+0.0015,1.5)':d=500:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1280x720";
            } else if (cam === 'zoom_out') {
                vf = "zoompan=z='1.5-0.0015*on':d=500:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1280x720";
            } else if (cam === 'pan_left') {
                vf = "zoompan=z=1.2:d=500:x='if(lte(on,1),(iw-iw/zoom)/2,x-1)':y='(ih-ih/zoom)/2':s=1280x720";
            } else if (cam === 'pan_right') {
                vf = "zoompan=z=1.2:d=500:x='x+1':y='(ih-ih/zoom)/2':s=1280x720";
            } else {
                // Static but scaled
                vf = "scale=1280:720";
            }

            // Ensure even dimensions for yuv420p
            vf += ",format=yuv420p";

            // Create scene video
            // -loop 1 -i img -i audio ... -shortest
            await this.ffmpeg.exec([
                '-y',
                '-loop', '1',
                '-i', imgName,
                '-i', audioName,
                '-vf', vf,
                '-c:v', 'libx264',
                '-tune', 'stillimage',
                '-c:a', 'aac',
                '-b:a', '192k',
                '-pix_fmt', 'yuv420p',
                '-shortest',
                videoName
            ]);

            fileList.push(`file '${videoName}'`);
        }

        // 2. Concat
        onProgress?.(60, "Concatenando cenas...");
        await this.ffmpeg.writeFile('concat_list.txt', fileList.join('\n'));
        await this.ffmpeg.exec([
            '-y',
            '-f', 'concat',
            '-safe', '0',
            '-i', 'concat_list.txt',
            '-c', 'copy',
            'visual_track.mp4'
        ]);

        // 3. Mix Background Music
        let finalOutput = 'visual_track.mp4';

        if (backgroundMusic) {
            onProgress?.(80, "Adicionando trilha sonora...");
            await this.ffmpeg.writeFile('bg_music.mp3', await fetchFile(backgroundMusic));

            await this.ffmpeg.exec([
                '-y',
                '-i', 'visual_track.mp4',
                '-stream_loop', '-1',
                '-i', 'bg_music.mp3',
                '-filter_complex', '[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=2,volume=1[a]',
                '-map', '0:v',
                '-map', '[a]',
                '-c:v', 'copy',
                '-c:a', 'aac',
                'final_render.mp4'
            ]);
            finalOutput = 'final_render.mp4';
        }

        onProgress?.(95, "Finalizando...");

        const data = await this.ffmpeg.readFile(finalOutput);
        return new Blob([data as any], { type: 'video/mp4' });
    }
}

export const videoRenderer = new VideoRenderer();
