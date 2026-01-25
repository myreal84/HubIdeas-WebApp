"use client";

import { useEffect, useState } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';

type PushManagerProps = {
    vapidPublicKey: string;
};

export default function PushManager({ vapidPublicKey }: PushManagerProps) {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            checkSubscription();
            setPermission(Notification.permission);
        } else {
            setLoading(false);
        }
    }, []);

    const checkSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (error) {
            console.error('Error checking subscription:', error);
        } finally {
            setLoading(false);
        }
    };

    const subscribe = async () => {
        setLoading(true);
        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === 'granted') {
                const registration = await navigator.serviceWorker.getRegistration();
                if (!registration) return;

                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
                });

                // Save to server
                await fetch('/api/push/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(subscription)
                });

                setIsSubscribed(true);
            }
        } catch (error) {
            console.error('Failed to subscribe:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return null;

    if (permission === 'denied') {
        return (
            <div className="flex items-center gap-2 text-xs text-red-500 font-medium bg-red-500/5 px-3 py-2 rounded-xl border border-red-500/10">
                <BellOff size={14} /> Benachrichtigungen blockiert
            </div>
        );
    }

    return (
        <button
            onClick={!isSubscribed ? subscribe : undefined}
            disabled={isSubscribed || loading}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${isSubscribed
                    ? 'bg-green-500/10 text-green-500 border-green-500/20 cursor-default'
                    : 'bg-white/5 text-muted-foreground border-white/5 hover:bg-white/10 hover:text-white'
                }`}
        >
            {isSubscribed ? <Check size={14} /> : <Bell size={14} />}
            <span>{isSubscribed ? 'Erinnerungen aktiv' : 'Erinnerungen aktivieren'}</span>
        </button>
    );
}

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
