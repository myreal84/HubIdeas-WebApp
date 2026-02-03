"use client";

import { useState, useRef } from 'react';
import { Upload, Loader2, X, FileText, Image as ImageIcon } from 'lucide-react';
import { uploadFile } from '@/lib/actions';

interface FileUploadProps {
    projectId: string;
    onUploadComplete: () => void;
}

export default function FileUpload({ projectId, onUploadComplete }: FileUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset
        setError(null);
        setIsUploading(true);

        const formData = new FormData();
        formData.append("file", file);

        try {
            await uploadFile(projectId, formData);
            if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
            onUploadComplete();
        } catch (err) {
            console.error("Upload failed", err);
            setError(err instanceof Error ? err.message : "Upload fehlgeschlagen.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            {error && (
                <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError(null)}><X size={12} /></button>
                </div>
            )}

            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed group"
            >
                {isUploading ? (
                    <Loader2 size={18} className="animate-spin" />
                ) : (
                    <Upload size={18} className="group-hover:scale-110 transition-transform" />
                )}
                <span className="text-sm font-medium">{isUploading ? 'Wird hochgeladen...' : 'Datei hochladen'}</span>
            </button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".txt,.pdf,.doc,.docx,.png,.jpg,.jpeg"
            />
            <p className="text-[10px] text-muted-foreground text-center">
                .txt, .pdf, .docx, .png, .jpg (Max. 10MB empfohlen)
            </p>
        </div>
    );
}
