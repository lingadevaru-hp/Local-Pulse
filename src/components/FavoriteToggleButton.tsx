'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  isFavoriteEvent,
  toggleFavoriteEvent,
  LOCAL_FAVORITES_UPDATED_EVENT,
} from '@/lib/local-db';

interface FavoriteToggleButtonProps {
  eventId: string;
  className?: string;
  stopPropagation?: boolean;
  showLabel?: boolean;
}

export default function FavoriteToggleButton({
  eventId,
  className,
  stopPropagation = true,
  showLabel = false,
}: FavoriteToggleButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const syncFavorite = () => setIsFavorite(isFavoriteEvent(eventId));
    syncFavorite();

    window.addEventListener(LOCAL_FAVORITES_UPDATED_EVENT, syncFavorite);
    window.addEventListener('storage', syncFavorite);

    return () => {
      window.removeEventListener(LOCAL_FAVORITES_UPDATED_EVENT, syncFavorite);
      window.removeEventListener('storage', syncFavorite);
    };
  }, [eventId]);

  const handleToggle = (e: MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) {
      e.stopPropagation();
    }
    setIsFavorite(toggleFavoriteEvent(eventId));
  };

  return (
    <Button
      type="button"
      variant={isFavorite ? 'default' : 'outline'}
      size={showLabel ? 'default' : 'icon'}
      onClick={handleToggle}
      className={cn(
        'rounded-full',
        isFavorite && 'bg-rose-500 hover:bg-rose-600 text-white border-rose-500',
        !isFavorite && 'border-border/70',
        className
      )}
      aria-label={isFavorite ? 'Remove from saved events' : 'Save event'}
      title={isFavorite ? 'Saved' : 'Save event'}
    >
      <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} />
      {showLabel ? <span className="ml-2">{isFavorite ? 'Saved' : 'Save'}</span> : null}
    </Button>
  );
}
