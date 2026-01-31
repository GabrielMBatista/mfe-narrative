import React from 'react';
import { Trash2, FolderOpen, X, ImageIcon } from 'lucide-react';
import { ProjectRecord } from '../services/projectStorage';

interface ProjectsModalProps {
    isOpen: boolean;
    projects: ProjectRecord[];
    onClose: () => void;
    onOpenProject: (project: ProjectRecord) => void;
    onDeleteProject: (id: string, e: React.MouseEvent) => void;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
    isOpen,
    projects,
    onClose,
    onOpenProject,
    onDeleteProject
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 w-full max-w-4xl max-h-[80vh] rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <FolderOpen className="w-6 h-6 text-amber-500" /> Projetos Salvos
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {projects.length === 0 ? (
                        <div className="text-center py-20 opacity-50 space-y-4">
                            <FolderOpen className="w-16 h-16 mx-auto text-slate-700" />
                            <p>Nenhum projeto salvo encontrado.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {projects.map((project) => (
                                <div key={project.id}
                                    onClick={() => onOpenProject(project)}
                                    className="group bg-slate-950 border border-slate-800 rounded-xl overflow-hidden hover:border-amber-500/50 transition-all cursor-pointer flex aspect-video relative"
                                >
                                    {project.previewImage ? (
                                        <img src={project.previewImage} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity" alt="" />
                                    ) : (
                                        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-slate-800">
                                            <ImageIcon className="w-12 h-12" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent p-6 flex flex-col justify-end">
                                        <h4 className="font-bold text-lg text-white group-hover:text-amber-500 transition-colors line-clamp-2">{project.script?.title || "Sem Título"}</h4>
                                        <div className="flex justify-between items-end mt-2">
                                            <div className="text-xs text-slate-400 space-y-1">
                                                <p>{new Date(project.lastModified).toLocaleDateString()}</p>
                                                <p className="opacity-70">{project.script?.timeline?.length || 0} cenas</p>
                                            </div>
                                            <button
                                                onClick={(e) => onDeleteProject(project.id, e)}
                                                className="p-2 bg-slate-800 hover:bg-red-900/50 hover:text-red-400 rounded-lg transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectsModal;
