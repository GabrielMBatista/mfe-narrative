
export interface VideoScript {
    title: string;
    hook: string;
    body: string;
    callToAction: string;
    keywords: string[];
}

export interface PlatformSEO {
    platform: string;
    title: string;
    description: string;
    hashtags: string[];
    isManual: boolean;
}

export interface GenerationResult {
    youtube: PlatformSEO;
    youtubeLong: PlatformSEO;
    instagram: PlatformSEO;
    facebook: PlatformSEO;
    kwai: PlatformSEO;
    tiktok: PlatformSEO;
    thumbnails?: {
        landscape: string;
        portrait: string;
    };
}

export interface HistoryItem {
    id: string;
    timestamp: number;
    videoName: string;
    script: string;
    results: GenerationResult;
}

export enum SocialAppStatus {
    IDLE = 'IDLE',
    GENERATING = 'GENERATING',
    GENERATING_THUMBS = 'GENERATING_THUMBS',
    SUCCESS = 'SUCCESS',
    ERROR = 'ERROR'
}
