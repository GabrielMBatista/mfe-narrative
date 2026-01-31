import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { Key, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

export const LoginScreen: React.FC = () => {
    const { login, setUserKeys, userKeys } = useSettings();
    const [mode, setMode] = useState<'admin' | 'guest'>('admin');
    const [password, setPassword] = useState('');
    const [guestKeys, setGuestKeys] = useState(userKeys);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const success = await login(password);
        if (!success) {
            setError('Senha incorreta ou erro de conexão.');
        }
        setLoading(false);
    };

    const handleGuestSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!guestKeys.gemini) {
            setError('A chave Gemini é obrigatória para começar.');
            return;
        }
        setUserKeys(guestKeys);
        // "Guest Login" is implicit by just setting keys
    };

    // If we are showing this screen, it implies we are likely not logged in or have missing keys
    // The parent App.tsx will control visibility, but here we render the content.

    return (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-8 text-center border-b border-slate-800 bg-slate-900/50">
                    <h1 className="text-2xl font-serif font-bold text-white mb-2">Narrativa Studio</h1>
                    <p className="text-slate-400 text-sm">Configure seu acesso para começar</p>
                </div>

                <div className="flex border-b border-slate-800">
                    <button
                        onClick={() => setMode('admin')}
                        className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mode === 'admin' ? 'bg-indigo-600/10 text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <ShieldCheck className="w-4 h-4" /> Admin (Database)
                    </button>
                    <button
                        onClick={() => setMode('guest')}
                        className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mode === 'guest' ? 'bg-amber-600/10 text-amber-500 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <User className="w-4 h-4" /> Visitante (Local)
                    </button>
                </div>

                <div className="p-8">
                    {mode === 'admin' ? (
                        <form onSubmit={handleAdminLogin} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Senha do Servidor</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            {error && <p className="text-red-400 text-xs bg-red-900/20 p-2 rounded border border-red-900/50">{error}</p>}
                            <button
                                type="submit"
                                disabled={loading || !password}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? 'Verificando...' : 'Entrar como Admin'} <ArrowRight className="w-4 h-4" />
                            </button>
                            <p className="text-[10px] text-slate-500 text-center">
                                Usa chaves seguras do banco de dados (Prisma/Postgres).
                            </p>
                        </form>
                    ) : (
                        <form onSubmit={handleGuestSave} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Gemini API Key</label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="password"
                                        value={guestKeys.gemini}
                                        onChange={(e) => setGuestKeys({ ...guestKeys, gemini: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                        placeholder="AIzaSy..."
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">ElevenLabs Key (Opcional)</label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="password"
                                        value={guestKeys.elevenLabs}
                                        onChange={(e) => setGuestKeys({ ...guestKeys, elevenLabs: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                        placeholder="sk_..."
                                    />
                                </div>
                            </div>
                            {error && <p className="text-red-400 text-xs bg-red-900/20 p-2 rounded border border-red-900/50">{error}</p>}
                            <button
                                type="submit"
                                disabled={!guestKeys.gemini}
                                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                Salvar e Continuar <ArrowRight className="w-4 h-4" />
                            </button>
                            <p className="text-[10px] text-slate-500 text-center">
                                As chaves ficam salvas apenas no seu navegador.
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
