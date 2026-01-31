
import { openDB, DBSchema } from 'idb';
import { FullProject } from '../types';

export interface ProjectRecord extends FullProject {
    id: string; // Unique ID (e.g., UUID or Title-Timestamp)
    name: string;
    lastModified: number;
    previewImage?: string; // Optional: Store the first image as preview
}

interface NarrativeDB extends DBSchema {
    projects: {
        key: string;
        value: Omit<ProjectRecord, 'images' | 'audios'>; // Metadata only
        indexes: { 'by-date': number };
    };
    assets: {
        key: string; // Composite key? Or just projectId
        value: {
            id: string; // projectId
            images: Record<number, string>;
            audios: Record<number, string>;
        };
    };
}

const DB_NAME = 'biblia-narrativa-db';
const STORE_PROJECTS = 'projects';
const STORE_ASSETS = 'assets';

export async function initDB() {
    return openDB<NarrativeDB>(DB_NAME, 2, { // Bump version
        upgrade(db, oldVersion, newVersion, transaction) {
            if (oldVersion < 1) {
                const store = db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
                store.createIndex('by-date', 'lastModified');
            }
            if (oldVersion < 2) {
                db.createObjectStore(STORE_ASSETS, { keyPath: 'id' });
            }
        },
    });
}

export async function saveProject(project: FullProject, existingId?: string): Promise<string> {
    const db = await initDB();

    const id = existingId || crypto.randomUUID();
    const name = project.script ? project.script.title : 'Novo Projeto';

    // Priorizar thumbnail otimizada, se não existir usa a primeira imagem (retrocompatibilidade)
    let previewImage = project.thumbnail;

    if (!previewImage) {
        const firstImageKey = Object.keys(project.images)[0];
        previewImage = firstImageKey ? project.images[Number(firstImageKey)] : undefined;
    }

    const { images, audios, ...metadata } = project;

    const record: any = { // Cast to any to bypass strict type check on Omit vs FullProject inheritance
        ...metadata,
        id,
        name,
        lastModified: Date.now(),
        previewImage
    };


    const assets = {
        id,
        images,
        audios
    };

    const tx = db.transaction([STORE_PROJECTS, STORE_ASSETS], 'readwrite');
    await Promise.all([
        tx.objectStore(STORE_PROJECTS).put(record),
        tx.objectStore(STORE_ASSETS).put(assets)
    ]);
    await tx.done;

    return id;
}

export async function getAllProjects(): Promise<ProjectRecord[]> {
    const db = await initDB();
    // Only return metadata, but cast to ProjectRecord (missing images/audios will be empty/undefined)
    // Actually we should probably return a lighter type for lists, but to keep compat:
    const records = await db.getAllFromIndex(STORE_PROJECTS, 'by-date');
    return records.reverse().map(r => ({
        ...r,
        images: {}, // Empty assets for list view
        audios: {}
    } as ProjectRecord));
}

export async function getProject(id: string): Promise<ProjectRecord | undefined> {
    const db = await initDB();
    const meta = await db.get(STORE_PROJECTS, id);
    if (!meta) return undefined;

    const assets = await db.get(STORE_ASSETS, id);

    return {
        ...meta,
        images: assets?.images || {},
        audios: assets?.audios || {}
    } as ProjectRecord;
}

export async function deleteProject(id: string) {
    const db = await initDB();
    const tx = db.transaction([STORE_PROJECTS, STORE_ASSETS], 'readwrite');
    await Promise.all([
        tx.objectStore(STORE_PROJECTS).delete(id),
        tx.objectStore(STORE_ASSETS).delete(id)
    ]);
    await tx.done;
}
