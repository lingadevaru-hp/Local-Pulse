
import type { FC } from 'react';
import Image from 'next/image';
import { Badge } from "@/components/ui/badge";
import type { Event } from '@/types';
import { CalendarDays, MapPin, Tag, UserCircle, Star as StarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import ShareButton from '@/components/ShareButton';
import FavoriteToggleButton from '@/components/FavoriteToggleButton';

interface EventCardProps {
  event: Event;
  onClick: (eventId: string) => void;
}

const EventCard: FC<EventCardProps> = ({ event, onClick }) => {
  let aiHint = `${event.category || 'event'} placeholder`;
  if (event.name.toLowerCase().includes('mysuru dasara')) aiHint = "mysore palace";
  else if (event.name.toLowerCase().includes('karaga')) aiHint = "karaga festival";
  else if (event.name.toLowerCase().includes('mangalore') && event.name.toLowerCase().includes('food')) aiHint = "coastal food";
  else if (event.name.toLowerCase().includes('kannada folk')) aiHint = "folk music";
  else if (event.name.toLowerCase().includes('tech summit')) aiHint = "tech conference";
  else if (event.name.toLowerCase().includes('cricket')) aiHint = "cricket stadium";
  else if (event.name.toLowerCase().includes('art exhibition')) aiHint = "art gallery";
  else if (event.name.toLowerCase().includes('literature festival')) aiHint = "books festival";

  const handleCardClick = () => {
    onClick(event.id);
  };

  return (
    <div
      className={cn(
        "group rounded-2xl overflow-hidden transition-all duration-300 ease-in-out",
        "glass-effect",
        "hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex flex-col"
      )}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); }}
      aria-label={`View details for ${event.name}`}
    >
      <div className="relative w-full aspect-[16/9] overflow-hidden">
        <Image
          src={event.imageUrl || `https://picsum.photos/seed/${event.id}/400/225`}
          alt={event.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          data-ai-hint={aiHint}
        />
        <FavoriteToggleButton
          eventId={event.id}
          className="absolute right-3 top-3 h-9 w-9 bg-background/80 backdrop-blur border-border/60 hover:bg-background"
        />
      </div>
      <div className="p-4 space-y-2 flex-grow">
        <h3 className="text-md md:text-lg font-semibold leading-tight text-foreground truncate" title={event.name}>
          {event.name}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 h-[2.5em]">
          {event.description}
        </p>

        <div className="space-y-1 pt-1 text-xs">
          <div className="flex items-center text-muted-foreground">
            <CalendarDays className="mr-1.5 h-3 w-3.5" />
            <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {event.time}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <MapPin className="mr-1.5 h-3 w-3.5" />
            <span>{event.location}, {event.city}</span>
          </div>
          {event.organizer && (
            <div className="flex items-center text-muted-foreground">
              <UserCircle className="mr-1.5 h-3 w-3.5" />
              <span>By: {event.organizer}</span>
            </div>
          )}
        </div>
      </div>
      <div className="p-4 border-t border-[var(--glass-border-light)] dark:border-[var(--glass-border-dark)] flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <Badge
            variant="outline"
            className={cn(
              "py-1 px-2.5 rounded-lg text-xs border-primary/30 text-primary",
              "bg-primary/10 dark:bg-primary/20"
            )}
          >
            <Tag className="mr-1 h-3 w-3" />
            {event.category}
          </Badge>
          {typeof event.rating === 'number' && (
            <div className="flex items-center ml-2 sm:ml-0">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`w-3.5 h-3.5 ${i < Math.round(event.rating!) ? 'text-yellow-400 dark:text-yellow-500' : 'text-muted-foreground/30'}`}
                  fill={i < Math.round(event.rating!) ? 'currentColor' : 'none'}
                />
              ))}
              <span className="ml-1.5 text-xs text-muted-foreground">({event.rating.toFixed(1)})</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="default"
            size="sm"
            className="flex-1 sm:flex-none rounded-full bg-green-500 hover:bg-green-600 text-white text-xs px-4 py-1.5 h-auto"
            onClick={(e) => {
              e.stopPropagation();
              if (event.registrationLink) {
                window.open(event.registrationLink, '_blank');
              } else {
                onClick(event.id);
              }
            }}
            aria-label={`Register for ${event.name}`}
          >
            {event.registrationLink ? 'Register' : 'Details'}
          </Button>
          <ShareButton event={event} variant="outline" size="sm" />
        </div>
      </div>
    </div>
  );
};

export default EventCard;
