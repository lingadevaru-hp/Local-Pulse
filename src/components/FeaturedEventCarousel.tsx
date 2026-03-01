
'use client';

import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import type { Event } from '@/types';
import { ChevronLeft, ChevronRight, CalendarDays, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeaturedEventCarouselProps {
  events: Event[];
  onEventClick: (eventId: string) => void;
}

const FeaturedEventCarousel: FC<FeaturedEventCarouselProps> = ({ events, onEventClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % events.length);
  }, [events.length]);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + events.length) % events.length);
  };

  useEffect(() => {
    if (events.length <= 1) return;
    const timer = setInterval(() => {
      handleNext();
    }, 5000); 
    return () => clearInterval(timer);
  }, [events.length, handleNext]);

  if (!events || events.length === 0) {
    return ( 
        <div className="mb-6 md:mb-8">
            <div className="glass-effect rounded-2xl overflow-hidden shadow-xl animate-pulse">
                <div className="relative w-full aspect-[16/7] sm:aspect-[16/5] md:aspect-[21/6] lg:aspect-[21/5] bg-muted"></div>
                <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                    <div className="h-6 bg-muted-foreground/30 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted-foreground/20 rounded w-1/2 mb-3"></div>
                    <div className="h-8 bg-muted-foreground/30 rounded w-1/3"></div>
                </div>
            </div>
        </div>
    );
  }

  const currentEvent = events[currentIndex];
  const aiHint = `${currentEvent.category || 'event'} ${currentEvent.city || 'city'}`.toLowerCase();

  const handleLearnMoreClick = () => {
    onEventClick(currentEvent.id);
  };

  return (
    <section aria-labelledby="featured-events-heading" className="mb-6 md:mb-8">
       <h2 id="featured-events-heading" className="sr-only">Featured Events</h2>
      <div className="relative glass-effect rounded-2xl overflow-hidden shadow-xl">
        <div className="relative w-full aspect-[16/7] sm:aspect-[16/5] md:aspect-[21/6] lg:aspect-[21/5]">
          {events.map((event, index) => (
            <Image
              key={event.id}
              src={event.imageUrl || `https://picsum.photos/seed/${event.id}/1200/300`}
              alt={event.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
              className={cn(
                "object-cover transition-opacity duration-1000 ease-in-out",
                index === currentIndex ? "opacity-100" : "opacity-0"
              )}
              priority={index === 0} 
              data-ai-hint={aiHint}
              loading={index === 0 ? "eager" : "lazy"}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 text-white">
          <h3 className="text-lg md:text-2xl font-bold mb-1 drop-shadow-lg truncate">
            {currentEvent.name}
          </h3>
          <p className="text-xs md:text-sm mb-1.5 line-clamp-2 drop-shadow-md">
            {currentEvent.description}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 md:gap-2 mb-2 text-xs">
            <div className="flex items-center">
              <CalendarDays className="mr-1 h-3 w-3 md:h-3.5 md:w-3.5" />
              <span>{new Date(currentEvent.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {currentEvent.time}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="mr-1 h-3 w-3 md:h-3.5 md:w-3.5" />
              <span>{currentEvent.location}, {currentEvent.city}</span>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="default"
            className="bg-primary/80 hover:bg-primary text-primary-foreground backdrop-blur-sm border border-primary-foreground/20 rounded-lg shadow-lg hover:scale-105 transition-transform text-xs h-8 px-4"
            onClick={handleLearnMoreClick}
            aria-label={`Learn more about ${currentEvent.name}`}
          >
            Learn More
          </Button>
        </div>

        {events.length > 1 && (
          <>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute left-1.5 top-1/2 -translate-y-1/2 rounded-full bg-black/30 hover:bg-black/50 text-white w-7 h-7 md:w-9 md:h-9"
              onClick={handlePrev}
              aria-label="Previous featured event"
            >
              <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-black/30 hover:bg-black/50 text-white w-7 h-7 md:w-9 md:h-9"
              onClick={handleNext}
              aria-label="Next featured event"
            >
              <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex space-x-1">
              {events.map((_, index) => (
                <button
                  key={`dot-${index}`}
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Go to featured event ${index + 1}`}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-all", 
                    currentIndex === index ? "bg-white w-3 md:w-4" : "bg-white/50 hover:bg-white/75"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default FeaturedEventCarousel;
