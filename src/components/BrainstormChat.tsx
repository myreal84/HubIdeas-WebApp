"use client";

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Send, Loader2, ArrowRight, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

interface BrainstormChatProps {
    onClose: () => void;
    aiTokenLimit: number;
    aiTokensUsed: number;
}

export default function BrainstormChat({ onClose, aiTokenLimit, aiTokensUsed }: BrainstormChatProps) {
    const router = useRouter();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Check limit
    const isLimitReached = aiTokensUsed >= aiTokenLimit;

    // Use local input state instead of useChat's input (which may be undefined)
    const [localInput, setLocalInput] = useState('');

    const params = useChat({
        body: { mode: 'brainstorm' },
        initialMessages: [],
        keepLastMessageOnError: true,
    } as any) as any;

    const { messages = [], status, sendMessage, setMessages } = params;
    const isLoading = status === 'streaming' || status === 'submitted';

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalInput(e.target.value);
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!localInput.trim() || isLoading) return;

        const userContent = localInput;
        setLocalInput(''); // Clear input immediately

        // Send message to AI
        await sendMessage({ role: 'user', content: userContent }, {
            body: { mode: 'brainstorm' }
        });
    };

    const handleCreateProject = async () => {
        if (messages.length === 0 || isGenerating) return;
        setIsGenerating(true);

        try {
            // Transform messages to ensure content is a string (handle AI SDK parts format)
            const transformedMessages = messages.map((m: any) => {
                let content = m.content || '';
                if (!content && m.parts && Array.isArray(m.parts)) {
                    content = m.parts
                        .filter((p: any) => p.type === 'text')
                        .map((p: any) => p.text)
                        .join('');
                }
                return {
                    role: m.role,
                    content: content
                };
            });

            const res = await fetch('/api/ai/generate-project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: transformedMessages,
                    saveHistory: true  // Always save chat history to project
                })
            });

            if (!res.ok) throw new Error('Failed to create project');

            const data = await res.json();
            if (data.projectId) {
                // Navigate to new project
                router.push(`/project/${data.projectId}`);
            }
        } catch (error) {
            console.error(error);
            setIsGenerating(false);
            // TODO: Show error toast
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-4xl h-[85vh] bg-[#0F1117] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#0F1117]/50 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-2xl shadow-lg shadow-fuchsia-500/20">
                            <Sparkles className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tight">Idee entwickeln</h2>
                            <div className="flex items-center gap-3">
                                <p className="text-sm text-slate-400 font-medium">Lass uns deine Gedanken strukturieren.</p>
                                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isLimitReached
                                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                        : 'bg-white/5 text-slate-500 border-white/5'
                                    }`}>
                                    {aiTokensUsed.toLocaleString()} / {aiTokenLimit.toLocaleString()} Tokens
                                </div>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 bg-dots-pattern" ref={scrollRef}>
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-60">
                            <Sparkles size={64} className="text-fuchsia-500/50" />
                            <div className="max-w-md space-y-2">
                                <h3 className="text-xl font-bold text-white">Was hast du vor?</h3>
                                <p className="text-slate-400">Beschreibe deine grobe Idee, und ich helfe dir, ein konkretes Projekt daraus zu machen.</p>
                            </div>
                        </div>
                    )}

                    {messages.map((m: any) => {
                        // Extract content from message - handle both content and parts (newer AI SDK)
                        let displayContent = m.content || '';
                        if (!displayContent && m.parts && Array.isArray(m.parts)) {
                            displayContent = m.parts
                                .filter((p: any) => p.type === 'text')
                                .map((p: any) => p.text)
                                .join('');
                        }

                        return (
                            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`
                                    max-w-[80%] p-5 rounded-3xl text-sm md:text-base leading-relaxed
                                    ${m.role === 'user'
                                        ? 'bg-white/10 text-white rounded-br-none'
                                        : 'bg-fuchsia-500/10 text-slate-200 border border-fuchsia-500/20 rounded-bl-none prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-strong:text-fuchsia-300'}`}
                                >
                                    {m.role === 'user' ? displayContent : (
                                        <ReactMarkdown>{displayContent}</ReactMarkdown>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="p-4 rounded-3xl bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-bl-none flex items-center gap-2">
                                <Loader2 size={16} className="animate-spin text-fuchsia-400" />
                                <span className="text-xs font-bold text-fuchsia-400 uppercase tracking-wider">Denke nach...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions Bar */}
                {messages.length > 1 && !isGenerating && (
                    <div className="px-6 py-2 flex items-center justify-between animate-in slide-in-from-bottom-5 fade-in">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setMessages([])}
                                className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                                title="Chat leeren"
                            >
                                <Trash2 size={18} />
                            </button>

                        </div>

                        <button
                            onClick={handleCreateProject}
                            className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-2xl font-bold hover:bg-slate-200 transition-all shadow-lg shadow-white/10 active:scale-95"
                        >
                            <Sparkles size={18} className="text-fuchsia-600" />
                            <span>Projekt erstellen</span>
                            <ArrowRight size={18} />
                        </button>
                    </div>
                )}

                {/* Input Area */}
                <div className="p-4 bg-[#0F1117] border-t border-white/5 relative z-20">
                    {isGenerating ? (
                        <div className="h-16 flex items-center justify-center gap-3 text-fuchsia-400">
                            <Loader2 size={24} className="animate-spin" />
                            <span className="font-bold uppercase tracking-widest animate-pulse">Erstelle Projekt...</span>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="relative">
                            <input
                                value={localInput}
                                onChange={handleInputChange}
                                placeholder={isLimitReached ? "Limit erreicht" : "Beschreibe deine Idee..."}
                                disabled={isLoading || isLimitReached}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-6 pr-14 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-fuchsia-500/50 focus:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={!localInput.trim() || isLoading || isLimitReached}
                                className="absolute right-2 top-2 p-2 bg-fuchsia-500 hover:bg-fuchsia-600 disabled:bg-white/5 disabled:text-slate-500 text-white rounded-xl transition-all"
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
