"use client";

import { useState, useEffect } from 'react';
import { X, FileText, Trash2, Download, Image as ImageIcon } from 'lucide-react';
import { createPortal } from 'react-dom';
import FileUpload from './FileUpload';
import { getProjectFiles, deleteFile } from '@/lib/actions';
import { motion, AnimatePresence } from 'framer-motion';

interface FileData {
    id: string;
    name: string;
    type: string;
    size: number;
    createdAt: Date;
    uploader?: { name: string | null };
}

interface FilesDialogProps {
    projectId: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function FilesDialog({ projectId, isOpen, onClose }: FilesDialogProps) {
    const [files, setFiles] = useState<FileData[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const data = await getProjectFiles(projectId);
            setFiles(data);
        } catch (error) {
            console.error("Failed to load files", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchFiles();
        }
    }, [isOpen, projectId]);

    const handleDelete = async (id: string) => {
        if (!confirm("Datei wirklich löschen?")) return;
        try {
            await deleteFile(id);
            setFiles(prev => prev.filter(f => f.id !== id));
        } catch (error) {
            alert("Fehler beim Löschen");
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
            >
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <h3 className="text-xl font-bold">Dateien & Anhänge</h3>
                    <button onClick={onClose} className="p-2 hover:bg-foreground/5 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-6">
                    <FileUpload projectId={projectId} onUploadComplete={fetchFiles} />

                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Vorhandene Dateien</h4>
                        {loading ? (
                            <p className="text-center text-muted-foreground animate-pulse">Lade...</p>
                        ) : files.length === 0 ? (
                            <p className="text-center text-muted-foreground italic text-sm">Keine Dateien hochgeladen.</p>
                        ) : (
                            <div className="space-y-3">
                                {files.map(file => (
                                    <div key={file.id} className="flex items-center justify-between p-3 bg-foreground/5 rounded-xl border border-border group">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-2 bg-background rounded-lg text-primary">
                                                {file.type.startsWith('image/') ? <ImageIcon size={18} /> : <FileText size={18} />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm truncate">{file.name}</p>
                                                <p className="text-[10px] text-muted-foreground flex gap-2">
                                                    <span>{formatSize(file.size)}</span>
                                                    <span>•</span>
                                                    <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                                                    {file.uploader?.name && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{file.uploader.name}</span>
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(file.id)}
                                            className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            title="Löschen"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
