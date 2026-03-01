'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Share2, Link as LinkIcon, MessageCircle, Send, Instagram, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Event } from '@/types';

interface ShareButtonProps {
    event: Event;
    variant?: 'default' | 'ghost' | 'outline';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    className?: string;
}

export default function ShareButton({ event, variant = 'ghost', size = 'sm', className = '' }: ShareButtonProps) {
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);

    // Generate event URL
    const eventUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/events/${event.id}`
        : `http://localhost:9002/events/${event.id}`;

    // Format share message
    const shareMessage = `Check out this event: ${event.name}\n📅 ${new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${event.time}\n📍 ${event.location}, ${event.city}\n${eventUrl}`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(eventUrl);
            setCopied(true);
            toast({
                title: "Link Copied!",
                description: "Event link copied to clipboard",
            });
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast({
                title: "Copy Failed",
                description: "Could not copy link to clipboard",
                variant: "destructive",
            });
        }
    };

    const handleWhatsAppShare = () => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleTelegramShare = () => {
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(eventUrl)}&text=${encodeURIComponent(`Check out this event: ${event.name}\n📅 ${new Date(event.date).toLocaleDateString()} at ${event.time}\n📍 ${event.location}, ${event.city}`)}`;
        window.open(telegramUrl, '_blank');
    };

    const handleInstagramShare = async () => {
        // Instagram doesn't support direct URL sharing
        // Try Web Share API first (works on mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: event.name,
                    text: `Check out this event: ${event.name}`,
                    url: eventUrl,
                });
            } catch (err) {
                // User cancelled or share failed
                if ((err as Error).name !== 'AbortError') {
                    handleCopyLink();
                }
            }
        } else {
            // Fallback: copy link and show instructions
            await handleCopyLink();
            toast({
                title: "Share to Instagram",
                description: "Link copied! Paste it in your Instagram story or post.",
            });
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant={variant}
                    size={size}
                    className={className}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Share event"
                >
                    <Share2 className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 glass-effect">
                <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                    {copied ? (
                        <>
                            <Check className="mr-2 h-4 w-4 text-green-500" />
                            <span>Copied!</span>
                        </>
                    ) : (
                        <>
                            <LinkIcon className="mr-2 h-4 w-4" />
                            <span>Copy Link</span>
                        </>
                    )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleWhatsAppShare} className="cursor-pointer">
                    <MessageCircle className="mr-2 h-4 w-4 text-green-600" />
                    <span>Share via WhatsApp</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleTelegramShare} className="cursor-pointer">
                    <Send className="mr-2 h-4 w-4 text-blue-500" />
                    <span>Share via Telegram</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleInstagramShare} className="cursor-pointer">
                    <Instagram className="mr-2 h-4 w-4 text-pink-600" />
                    <span>Share to Instagram</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
