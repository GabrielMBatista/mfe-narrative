/**
 * Serviço de Geração de Thumbnails Otimizadas
 * Gera thumbnails de alta qualidade e tamanho reduzido para projetos/vídeos
 */

export interface ThumbnailOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number; // 0-1, padrão 0.85
    format?: 'webp' | 'jpeg' | 'png';
    fit?: 'contain' | 'cover';
}

const DEFAULT_OPTIONS: Required<ThumbnailOptions> = {
    maxWidth: 640,
    maxHeight: 360,
    quality: 0.85,
    format: 'webp',
    fit: 'contain'
};

/**
 * Gera uma thumbnail otimizada a partir de uma imagem source
 * @param imageSource - URL da imagem (data:, blob:, http:, ou caminho local)
 * @param options - Opções de otimização
 * @returns Promise com a thumbnail em base64 (data URL)
 */
export async function generateThumbnail(
    imageSource: string,
    options: ThumbnailOptions = {}
): Promise<string> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            try {
                let width = img.width;
                let height = img.height;

                let dstWidth, dstHeight, dstX = 0, dstY = 0;
                let canvasWidth, canvasHeight;

                if (opts.fit === 'cover') {
                    // Lógica COVER: Preencher todo o espaço (Crop)
                    const scale = Math.max(opts.maxWidth / width, opts.maxHeight / height);
                    dstWidth = width * scale;
                    dstHeight = height * scale;

                    // Centralizar
                    dstX = (opts.maxWidth - dstWidth) / 2;
                    dstY = (opts.maxHeight - dstHeight) / 2;

                    canvasWidth = opts.maxWidth;
                    canvasHeight = opts.maxHeight;
                } else {
                    // Lógica CONTAIN (Padrão): Ajustar dentro sem cortar
                    const widthRatio = opts.maxWidth / width;
                    const heightRatio = opts.maxHeight / height;
                    const ratio = Math.min(widthRatio, heightRatio, 1);

                    dstWidth = Math.floor(width * ratio);
                    dstHeight = Math.floor(height * ratio);

                    canvasWidth = dstWidth;
                    canvasHeight = dstHeight;
                }

                // Criar canvas otimizado
                const canvas = document.createElement('canvas');
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;

                const ctx = canvas.getContext('2d', {
                    alpha: opts.format === 'png',
                    desynchronized: false
                });

                if (!ctx) {
                    reject(new Error('Falha ao criar contexto do canvas'));
                    return;
                }

                // Configurar suavização para melhor qualidade
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                // Desenhar imagem redimensionada
                ctx.drawImage(img, dstX, dstY, dstWidth, dstHeight);

                // Converter para formato otimizado
                const mimeType = `image/${opts.format}`;
                const thumbnail = canvas.toDataURL(mimeType, opts.quality);

                resolve(thumbnail);
            } catch (error) {
                reject(error);
            }
        };

        img.onerror = () => {
            reject(new Error(`Falha ao carregar imagem: ${imageSource.substring(0, 100)}...`));
        };

        img.src = imageSource;
    });
}

/**
 * Gera thumbnail a partir da primeira cena de um projeto
 * @param firstSceneImage - URL da primeira imagem do projeto
 * @param options - Opções de otimização
 */
export async function generateProjectThumbnail(
    firstSceneImage: string,
    options: ThumbnailOptions = {}
): Promise<string> {
    // Usar configurações específicas para thumbnails de projeto (menores)
    const projectOptions: ThumbnailOptions = {
        maxWidth: 480,
        maxHeight: 270,
        quality: 0.8,
        format: 'webp',
        ...options
    };

    return generateThumbnail(firstSceneImage, projectOptions);
}

/**
 * Gera thumbnail para vídeo (capa do vídeo)
 * @param videoThumbnailSource - Imagem de capa do vídeo
 * @param options - Opções de otimização
 */
export async function generateVideoThumbnail(
    videoThumbnailSource: string,
    options: ThumbnailOptions = {}
): Promise<string> {
    // Usar configurações específicas para thumbnails de vídeo (maiores, mais qualidade)
    const videoOptions: ThumbnailOptions = {
        maxWidth: 1280,
        maxHeight: 720,
        quality: 0.9,
        format: 'jpeg', // JPEG é melhor suportado para vídeo thumbnails
        fit: 'cover',   // Força preenchimento 16:9 (crop central se necessário)
        ...options
    };

    return generateThumbnail(videoThumbnailSource, videoOptions);
}

/**
 * Estima o tamanho de uma thumbnail em KB
 * @param thumbnailDataUrl - Thumbnail em formato data URL
 * @returns Tamanho estimado em KB
 */
// ... (existing code)

/**
 * Estima o tamanho de uma thumbnail em KB
 * @param thumbnailDataUrl - Thumbnail em formato data URL
 * @returns Tamanho estimado em KB
 */
export function estimateThumbnailSize(thumbnailDataUrl: string): number {
    // Remove o prefixo "data:image/...;base64,"
    const base64 = thumbnailDataUrl.split(',')[1] || thumbnailDataUrl;
    // Tamanho aproximado: (base64.length * 3) / 4 bytes
    const sizeInBytes = (base64.length * 3) / 4;
    return Math.round(sizeInBytes / 1024);
}

export interface TextOverlayOptions {
    title: string;
    subtitle?: string;
    titleColor?: string;
    subtitleColor?: string;
    titleShadow?: boolean;
    position?: 'center' | 'bottom' | 'top';
}

/**
 * Adiciona texto (Título e Subtítulo) sobre uma thumbnail existente
 * @param base64Image - Imagem original em Base64
 * @param options - Opções de texto e posicionamento
 */
export async function overlayTextOnThumbnail(
    base64Image: string,
    options: TextOverlayOptions
): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error("Canvas context failed"));
                return;
            }

            // 1. Draw Original Image
            ctx.drawImage(img, 0, 0);

            // 2. Add Dimming Overlay for Readability
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; // 30% dim
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Add Gradient at the text position
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(0.7, 'rgba(0,0,0,0.4)');
            gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 3. Configure Fonts
            const fontSizeTitle = Math.floor(canvas.height * 0.15); // 15% of height
            const fontSizeSubtitle = Math.floor(canvas.height * 0.08); // 8% of height

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const centerX = canvas.width / 2;
            let titleY = canvas.height / 2;
            let subtitleY = titleY + fontSizeTitle;

            if (options.position === 'bottom') {
                titleY = canvas.height * 0.75;
                subtitleY = titleY + fontSizeTitle;
            } else if (options.position === 'top') {
                titleY = canvas.height * 0.25;
                subtitleY = titleY + fontSizeTitle;
            }

            // Helper to draw text with shadow/stroke
            const drawText = (text: string, x: number, y: number, size: number, color: string, isBold: boolean = true) => {
                ctx.font = `${isBold ? '900' : 'normal'} ${size}px "Inter", "Roboto", sans-serif`;

                // Stroke/Shadow for contrast
                if (options.titleShadow !== false) {
                    ctx.shadowColor = "rgba(0,0,0,0.9)";
                    ctx.shadowBlur = size * 0.2;
                    ctx.shadowOffsetX = size * 0.05;
                    ctx.shadowOffsetY = size * 0.05;

                    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
                    ctx.lineWidth = size * 0.1;
                    ctx.strokeText(text, x, y);
                }

                ctx.fillStyle = color;
                ctx.fillText(text, x, y);

                // Reset shadow for next draw
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            };

            // 4. Draw Title
            if (options.title) {
                // Caps Lock for Title usually looks better on Thumbnails
                drawText(options.title.toUpperCase(), centerX, titleY, fontSizeTitle, options.titleColor || '#FFD700'); // Gold default
            }

            // 5. Draw Subtitle
            if (options.subtitle) {
                drawText(options.subtitle, centerX, subtitleY, fontSizeSubtitle, options.subtitleColor || '#FFFFFF', false);
            }

            resolve(canvas.toDataURL('image/png', 0.9));
        };
        img.onerror = reject;
        img.src = base64Image;
    });
}
