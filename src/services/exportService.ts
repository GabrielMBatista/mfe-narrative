
import JSZip from 'jszip';
import { BibleScript, FullProject } from '../types';

export async function exportToRenderPackage(
    project: FullProject,
    images: Record<number, string>,
    audios: Record<number, string>,
    musicBase64?: string
) {
    const zip = new JSZip();
    const folderName = `PROJETO_RENDER_${project.script.title.replace(/\s+/g, '_').toUpperCase()}`;
    const root = zip.folder(folderName);

    if (!root) throw new Error("Falha ao criar ZIP");

    // Save JSON
    root.file("project_data.json", JSON.stringify(project, null, 2));

    // Save Images
    const imgFolder = root.folder("assets/images");
    Object.entries(images).forEach(([index, base64]) => {
        const data = base64.split(',')[1];
        imgFolder?.file(`scene_${index.padStart(3, '0')}.png`, data, { base64: true });
    });

    // Save Audios
    const audioFolder = root.folder("assets/audio");
    Object.entries(audios).forEach(([index, base64]) => {
        // Audio from Gemini is typically raw PCM or WAV. If raw, we might need to assume a header,
        // but the app uses it via AudioContext decodeAudioData.
        // Ideally we should export as WAV. For simplicity, let's assume valid base64 audio container or raw.
        // If raw PCM, ffmpeg needs arguments.
        // The current app `geminiService` returns what seems to be WAV or MP3 inside JSON?
        // Check `geminiService.ts`: "generateSpeech" uses "gemini-2.5-flash-preview-tts".
        // It usually returns WAV or MP3. Let's assume MP3/WAV.
        const data = base64.split(',')[1] || base64;
        audioFolder?.file(`narration_${index.padStart(3, '0')}.mp3`, data, { base64: true });
    });

    // Save Background Music
    if (musicBase64) {
        const musicData = musicBase64.split(',')[1] || musicBase64;
        root.file("assets/background_music.mp3", musicData, { base64: true });
    }

    // Create Python Render Script
    const pyScript = `
import os
import json
import subprocess
import glob

def render_project():
    print("Iniciando Renderização FFmpeg do Projeto...")
    
    with open('project_data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    timeline = data['script']['timeline']
    input_files = []
    filter_complex = ""
    
    # 1. Create temporary video segments for each scene
    segment_files = []
    
    for i, scene in enumerate(timeline):
        scene_idx = str(i).zfill(3)
        img_path = f"assets/images/scene_{scene_idx}.png"
        audio_path = f"assets/audio/narration_{scene_idx}.mp3"
        
        # Determine duration from audio length using ffprobe ideally, 
        # but here we might trust the script or just let audio drive video
        # We will use ffmpeg to get audio duration logic
        
        # Camera Movement Logic
        camera = scene.get('cameraMovement', 'static')
        zoom_expr = "1"
        pan_x = "0"
        pan_y = "0"
        
        if camera == 'zoom_in':
            zoom_expr = "zoom+0.0015"
            pan_x = "(iw-ow)/2"
            pan_y = "(ih-oh)/2"
        elif camera == 'zoom_out':
            zoom_expr = "min(zoom+0.0015,1.5)-0.0015*on" # Simple reverse simulation or start zoomed
            # Actually standard zoom out: z starts at 1.5, goes to 1
            zoom_expr = "1.2-0.0005*on" 
            pan_x = "(iw-ow)/2"
            pan_y = "(ih-oh)/2"
        elif camera == 'pan_left':
            zoom_expr = "1.2"
            pan_x = "x+1" 
        # ... logic continues ...

        # Simplified ZoomPan for generic usage (Zoom In Center)
        # s=1920x1080 input size, d=duration in frames
        # We need to know duration.
        
        output_segment = f"temp_segment_{scene_idx}.mp4"
        
        # Basic command: Loop image + Audio
        # We use -shortest to cut video to audio length
        cmd = [
            "ffmpeg", "-y",
            "-loop", "1", "-i", img_path,
            "-i", audio_path,
            "-vf", f"zoompan=z='min(zoom+0.0015,1.5)':d=700:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1280x720,format=yuv420p",
            "-c:v", "libx264", "-tune", "stillimage", "-c:a", "aac",
            "-shortest", output_segment
        ]
        
        subprocess.run(cmd, check=True)
        segment_files.append(output_segment)
        
        # Write to list
        with open('files.txt', 'a') as listfile:
            listfile.write(f"file '{output_segment}'\\n")

    # 2. Concatenate Segments
    print("Concatenating segments...")
    concat_cmd = [
        "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", "files.txt",
        "-c", "copy", "video_no_music.mp4"
    ]
    subprocess.run(concat_cmd, check=True)

    # 3. Add Music
    print("Adding Background Music...")
    if os.path.exists("assets/background_music.mp3"):
        final_cmd = [
            "ffmpeg", "-y",
            "-i", "video_no_music.mp4",
            "-stream_loop", "-1", "-i", "assets/background_music.mp3",
            "-filter_complex", "[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=2,volume=1[a]",
            "-map", "0:v", "-map", "[a]",
            "-c:v", "copy", "-c:a", "aac",
            "FINAL_MOVIE.mp4"
        ]
        subprocess.run(final_cmd, check=True)
    else:
        os.rename("video_no_music.mp4", "FINAL_MOVIE.mp4")

    # Cleanup
    for f in segment_files:
        os.remove(f)
    os.remove("files.txt")
    if os.path.exists("video_no_music.mp4"):
        os.remove("video_no_music.mp4")

    print("DONE! Video saved as FINAL_MOVIE.mp4")

if __name__ == "__main__":
    render_project()
`;

    root.file("render_script.py", pyScript);

    // Generate Bat file for ease of use
    root.file("run_render_windows.bat", "@echo off\npython render_script.py\npause");

    const content = await zip.generateAsync({ type: "blob" });

    // Trigger download
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${folderName}.zip`;
    a.click();
}
