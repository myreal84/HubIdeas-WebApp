"use client";

import { useEffect, useState } from 'react';
import { Download, Smartphone, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

declare global {
    interface WindowEventMap {
        beforeinstallprompt: BeforeInstallPromptEvent;
    }
}

export default function InstallPWA() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSHint, setShowIOSHint] = useState(false);

    useEffect(() => {
        // Check if already installed (standalone mode)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Detect iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) &&
            !(window as unknown as { MSStream?: unknown }).MSStream;
        setIsIOS(isIOSDevice);

        const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later
            setDeferredPrompt(e);
        };

        const handleAppInstalled = () => {
            setDeferredPrompt(null);
            setIsInstalled(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    // Already installed
    if (isInstalled) {
        return (
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                <Smartphone size={14} />
                <span>App installiert</span>
            </div>
        );
    }

    // iOS: Show hint to use Share menu
    if (isIOS) {
        return (
            <div className="relative">
                <button
                    onClick={() => setShowIOSHint(!showIOSHint)}
                    className="flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 hover:border-primary/40 active:scale-95"
                >
                    <Share size={14} />
                    <span>App installieren</span>
                </button>
                {showIOSHint && (
                    <div className="absolute top-full left-0 mt-2 p-3 bg-card border border-border rounded-xl shadow-xl z-50 w-64 text-xs">
                        <p className="font-bold mb-2">So installierst du die App:</p>
                        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                            <li>Tippe unten auf <Share size={12} className="inline" /> (Teilen)</li>
                            <li>Wähle &ldquo;Zum Home-Bildschirm&rdquo;</li>
                            <li>Tippe auf &ldquo;Hinzufügen&rdquo;</li>
                        </ol>
                    </div>
                )}
            </div>
        );
    }

    // Android/Desktop: Show install button if prompt available
    if (!deferredPrompt) {
        return null;
    }

    return (
        <button
            onClick={handleInstallClick}
            className="flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 hover:border-primary/40 active:scale-95"
        >
            <Download size={14} />
            <span>App installieren</span>
        </button>
    );
}
