import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { NicheConfig, NICHES } from '../config/nicheConfig';

interface ApiKeys {
    gemini: string;
    elevenLabs: string;
}

interface SettingsContextType {
    // Auth & Mode
    isLoggedIn: boolean;
    authMode: 'db' | 'local';
    login: (password: string) => Promise<boolean>;
    logout: () => void;

    // Configs
    userKeys: ApiKeys;
    setUserKeys: (keys: ApiKeys) => void;

    // Niche Overrides
    nicheOverrides: Record<string, Partial<NicheConfig>>;
    updateNicheOverride: (nicheId: string, overrides: Partial<NicheConfig>) => void;

    // Helpers
    getEffectiveKeys: () => ApiKeys; // Returns DB keys (placeholders if hidden) or Local keys
    getEffectiveNiche: (nicheId: string) => NicheConfig;

    dbStatus?: {
        hasGemini: boolean;
        hasEleven: boolean;
    };
    refreshDbStatus: () => Promise<void>;

    // Custom Personas
    customPersonas: Record<string, NicheConfig>;
    addCustomPersona: (persona: NicheConfig) => void;
    deleteCustomPersona: (id: string) => void;
    getAllPersonas: () => Record<string, NicheConfig>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // 1. Auth State
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authMode, setAuthMode] = useState<'db' | 'local'>('local'); // Default to local/guest
    const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));

    // 2. Local State
    const [userKeys, setUserKeysState] = useState<ApiKeys>(() => {
        const saved = localStorage.getItem('user_keys');
        return saved ? JSON.parse(saved) : { gemini: '', elevenLabs: '' };
    });

    const [nicheOverrides, setNicheOverrides] = useState<Record<string, Partial<NicheConfig>>>(() => {
        const saved = localStorage.getItem('niche_overrides');
        return saved ? JSON.parse(saved) : {};
    });

    // 3. DB State
    const [dbStatus, setDbStatus] = useState<{ hasGemini: boolean; hasEleven: boolean } | undefined>();
    const [dbPersonas, setDbPersonas] = useState<Record<string, Partial<NicheConfig>>>({});

    // 4. Custom Personas (Local only for now, can be synced later)
    const [customPersonas, setCustomPersonas] = useState<Record<string, NicheConfig>>(() => {
        const saved = localStorage.getItem('custom_personas');
        return saved ? JSON.parse(saved) : {};
    });

    // Persistence wrappers
    const setUserKeys = (keys: ApiKeys) => {
        setUserKeysState(keys);
        localStorage.setItem('user_keys', JSON.stringify(keys));
    };

    const updateNicheOverride = (nicheId: string, overrides: Partial<NicheConfig>) => {
        if (authMode === 'local') {
            const newOverrides = { ...nicheOverrides, [nicheId]: { ...nicheOverrides[nicheId], ...overrides } };
            setNicheOverrides(newOverrides);
            localStorage.setItem('niche_overrides', JSON.stringify(newOverrides));
        } else {
            // Admin updates DB
            // Map frontend 'imageStyleSuffix' back to DB 'imageStyle'
            const dbPayload: any = { nicheId, ...overrides };
            if (dbPayload.imageStyleSuffix) {
                dbPayload.imageStyle = dbPayload.imageStyleSuffix;
                delete dbPayload.imageStyleSuffix;
            }

            fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ action: 'updatePersona', payload: dbPayload })
            }).then(() => refreshDbStatus());
        }
    };

    const addCustomPersona = (persona: NicheConfig) => {
        const newPersonas = { ...customPersonas, [persona.id]: persona };
        setCustomPersonas(newPersonas);
        localStorage.setItem('custom_personas', JSON.stringify(newPersonas));
    };

    const deleteCustomPersona = (id: string) => {
        const newPersonas = { ...customPersonas };
        delete newPersonas[id];
        setCustomPersonas(newPersonas);
        localStorage.setItem('custom_personas', JSON.stringify(newPersonas));
    };

    const getAllPersonas = () => {
        return { ...NICHES, ...customPersonas };
    };

    const refreshDbStatus = async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/settings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDbStatus(data.keys);
                // process personas
                const personasMap: Record<string, Partial<NicheConfig>> = {};
                if (Array.isArray(data.personas)) {
                    data.personas.forEach((p: any) => {
                        personasMap[p.nicheId] = {
                            systemPrompt: p.systemPrompt,
                            imageStyleSuffix: p.imageStyle,
                            sourceLabel: p.sourceLabel
                        };
                    });
                }
                setDbPersonas(personasMap);
                setAuthMode('db');
                setIsLoggedIn(true);
            } else {
                // Token invalid
                logout();
            }
        } catch (e) {
            console.error("DB check failed", e);
            setAuthMode('local');
        }
    };

    // Auto-login check
    useEffect(() => {
        if (token) {
            refreshDbStatus();
        }
    }, [token]);

    const login = async (password: string) => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();
            if (res.ok && data.token) {
                localStorage.setItem('admin_token', data.token);
                setToken(data.token);
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('admin_token');
        setToken(null);
        setIsLoggedIn(false);
        setAuthMode('local');
        setDbStatus(undefined);
    };

    const getEffectiveKeys = () => {
        if (authMode === 'db' && isLoggedIn) {
            return { gemini: 'PROXY_MODE', elevenLabs: 'PROXY_MODE' };
        }
        return userKeys;
    };

    const getEffectiveNiche = (nicheId: string) => {
        const all = { ...NICHES, ...customPersonas };
        const base = all[nicheId];
        if (!base) return NICHES.bible; // fallback

        const overrides = authMode === 'db' ? dbPersonas[nicheId] : nicheOverrides[nicheId];
        return { ...base, ...overrides };
    };

    return (
        <SettingsContext.Provider value={{
            isLoggedIn, authMode, login, logout,
            userKeys, setUserKeys,
            nicheOverrides, updateNicheOverride,
            getEffectiveKeys, getEffectiveNiche,
            dbStatus, refreshDbStatus,
            customPersonas, addCustomPersona, deleteCustomPersona, getAllPersonas
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) throw new Error("useSettings must be used within SettingsProvider");
    return context;
};
