
import React from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export type ModalType = 'success' | 'error' | 'info';

interface StatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: ModalType;
}

const StatusModal: React.FC<StatusModalProps> = ({
    isOpen,
    onClose,
    title,
    message,
    type = 'info'
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle2 className="w-12 h-12 text-green-500" />;
            case 'error':
                return <AlertCircle className="w-12 h-12 text-red-500" />;
            default:
                return <Info className="w-12 h-12 text-blue-500" />;
        }
    };

    const getButtonClass = () => {
        switch (type) {
            case 'success':
                return 'bg-green-600 hover:bg-green-500';
            case 'error':
                return 'bg-red-600 hover:bg-red-500';
            default:
                return 'bg-blue-600 hover:bg-blue-500';
        }
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl transform animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-8 flex flex-col items-center text-center">
                    <div className="mb-6 p-4 bg-slate-800/50 rounded-full">
                        {getIcon()}
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
                        {title}
                    </h3>

                    <p className="text-slate-400 leading-relaxed mb-8">
                        {message}
                    </p>

                    <button
                        onClick={onClose}
                        className={`w-full py-4 rounded-xl text-white font-bold transition-all active:scale-95 shadow-lg shadow-black/20 ${getButtonClass()}`}
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StatusModal;
