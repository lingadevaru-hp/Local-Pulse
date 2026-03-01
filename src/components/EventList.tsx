
'use client';

import type { FC } from 'react';
import EventCard from './EventCard';
import type { Event } from '@/types';
import { Skeleton } from "@/components/ui/skeleton";
import { Ghost } from 'lucide-react';

interface EventListProps {
  events: Event[];
  isLoading: boolean;
  onEventClick: (eventId: string) => void;
}

const EventList: FC<EventListProps> = ({ events, isLoading, onEventClick }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {[...Array(3)].map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-card/50 dark:bg-zinc-800/50 backdrop-blur-sm rounded-2xl shadow-sm min-h-[300px]">
        <Ghost className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-foreground">No Events Found</h3>
        <p className="text-muted-foreground">Try adjusting your search or city selection.</p>
      </div>
    );
  }

  return (
    <section aria-label="Event results">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {events.map((event) => (
          <EventCard key={event.id} event={event} onClick={onEventClick} />
        ))}
      </div>
    </section>
  );
};

const CardSkeleton: FC = () => (
  <div className="rounded-2xl border border-border/30 bg-card/50 dark:bg-zinc-800/50 backdrop-blur-sm shadow-lg overflow-hidden">
    <Skeleton className="h-48 md:h-[calc( (100vw - 2*1rem - 2*1rem) / 16 * 9 )] sm:h-[calc( (50vw - 2*0.75rem - 2*0.75rem - 1rem) / 16 * 9 )] lg:h-[calc( (33.33vw - 2*1rem - 2*1rem - 1.5rem) / 16 * 9 )] w-full" />
    <div className="p-4 md:p-5 space-y-3">
      <Skeleton className="h-6 w-3/4 rounded" />
      <Skeleton className="h-4 w-full rounded" />
      <Skeleton className="h-4 w-5/6 rounded" />
      <div className="space-y-1.5 pt-1">
        <Skeleton className="h-3.5 w-1/2 rounded" />
        <Skeleton className="h-3.5 w-2/3 rounded" />
      </div>
    </div>
    <div className="p-4 md:p-5 bg-white/30 dark:bg-black/30 border-t border-white/20 dark:border-black/20 flex justify-between items-center">
      <Skeleton className="h-6 w-1/4 rounded-lg" />
      <Skeleton className="h-5 w-1/3 rounded-lg" />
    </div>
  </div>
);


export default EventList;
