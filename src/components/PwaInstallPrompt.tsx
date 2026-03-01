'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISSED_KEY = 'localpulse_pwa_prompt_dismissed';

export default function PwaInstallPrompt() {
    const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);

    const isIos = useMemo(() => {
        if (typeof navigator === 'undefined') return false;
        return /iphone|ipad|ipod/i.test(navigator.userAgent);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const dismissed = window.localStorage.getItem(DISMISSED_KEY) === 'true';
        if (dismissed) return;

        const handleBeforeInstall = (event: Event) => {
            event.preventDefault();
            setInstallEvent(event as BeforeInstallPromptEvent);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    }, []);

    if (!isVisible || !installEvent) return null;

    const handleInstall = async () => {
        try {
            setIsInstalling(true);
            await installEvent.prompt();
            const result = await installEvent.userChoice;
            if (result.outcome === 'accepted') {
                setIsVisible(false);
            }
        } finally {
            setIsInstalling(false);
        }
    };

    const handleDismiss = () => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(DISMISSED_KEY, 'true');
        }
        setIsVisible(false);
    };

    return (
        <div className="fixed bottom-4 left-4 right-4 z-[60] mx-auto max-w-md rounded-2xl border border-border bg-card p-4 shadow-2xl">
            <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                    <Smartphone className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold">Install Local Pulse</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Add this app to your home screen for a faster experience.
                        {isIos ? ' On iPhone/iPad, use Share -> Add to Home Screen.' : ''}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                        <Button size="sm" onClick={handleInstall} disabled={isInstalling}>
                            <Download className="h-4 w-4 mr-1" />
                            {isInstalling ? 'Installing...' : 'Install'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleDismiss}>
                            Not now
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
