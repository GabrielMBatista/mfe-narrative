import React from 'react';
import { Info, CheckCircle, AlertCircle, X } from 'lucide-react';

export type ModalType = 'info' | 'success' | 'error';

interface NotificationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    type: ModalType;
    onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
    isOpen,
    title,
    message,
    type,
    onClose
}) => {
    if (!isOpen) return null;

    const icons = {
        info: <Info className="w-8 h-8 text-blue-400" />,
        success: <CheckCircle className="w-8 h-8 text-green-400" />,
        error: <AlertCircle className="w-8 h-8 text-red-400" />
    };

    const bgColors = {
        info: 'from-blue-900/30 to-blue-800/30 border-blue-500/30',
        success: 'from-green-900/30 to-green-800/30 border-green-500/30',
        error: 'from-red-900/30 to-red-800/30 border-red-500/30'
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className={`bg-gradient-to-br ${bgColors[type]} rounded-xl max-w-md w-full border shadow-2xl animate-in fade-in zoom-in duration-200`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            {icons[type]}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-white mb-2">
                                {title}
                            </h3>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                {message}
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
