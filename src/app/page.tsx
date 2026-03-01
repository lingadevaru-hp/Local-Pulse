'use client';

import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import FeaturedEventCarousel from '@/components/FeaturedEventCarousel';
import SearchBar from '@/components/SearchBar';
import NearbyEventsSection from '@/components/NearbyEventsSection';
import EventList from '@/components/EventList';
import AppFooter from '@/components/AppFooter';
import { Badge } from '@/components/ui/badge';
import { Clock3, Heart, Sparkles } from 'lucide-react';
import type { Event, City } from '@/types';

import { useAuth } from '@/context/AuthContext';
import { MOCK_EVENTS } from '@/lib/mockData';
import {
    getMergedEvents,
    LOCAL_EVENTS_UPDATED_EVENT,
    LOCAL_FAVORITES_UPDATED_EVENT,
    LOCAL_RECENTLY_VIEWED_UPDATED_EVENT,
    getFavoriteEventIds,
    getRecentlyViewedEvents,
} from '@/lib/local-db';

const AVAILABLE_LOCATIONS: City[] = [
    { id: 'all', name: 'All Locations' },
    { id: 'bengaluru', name: 'Bengaluru' },
    { id: 'mysuru', name: 'Mysuru' },
    { id: 'mangaluru', name: 'Mangaluru' },
    { id: 'mumbai', name: 'Mumbai' },
    { id: 'delhi', name: 'Delhi' },
    { id: 'chennai', name: 'Chennai' },
    { id: 'hyderabad', name: 'Hyderabad' },
    { id: 'kolkata', name: 'Kolkata' },
    { id: 'pune', name: 'Pune' },
    { id: 'hampi', name: 'Hampi' },
    { id: 'hubli', name: 'Hubballi' },
];

const AVAILABLE_CATEGORIES = ['Technology', 'Cultural', 'Music', 'Food', 'Sports', 'Wellness', 'Art'];

export default function Home() {
    const { profile } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestedQuery, setSuggestedQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
    const [selectedRating, setSelectedRating] = useState<string | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [favoriteEventIds, setFavoriteEventIds] = useState<string[]>([]);
    const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        const loadData = () => {
            setEvents(getMergedEvents(MOCK_EVENTS));
            setFavoriteEventIds(getFavoriteEventIds());
            setRecentlyViewedIds(getRecentlyViewedEvents(10).map((item) => item.eventId));
            setLoading(false);
        };

        loadData();
        window.addEventListener(LOCAL_EVENTS_UPDATED_EVENT, loadData);
        window.addEventListener(LOCAL_FAVORITES_UPDATED_EVENT, loadData);
        window.addEventListener(LOCAL_RECENTLY_VIEWED_UPDATED_EVENT, loadData);
        window.addEventListener('storage', loadData);

        return () => {
            window.removeEventListener(LOCAL_EVENTS_UPDATED_EVENT, loadData);
            window.removeEventListener(LOCAL_FAVORITES_UPDATED_EVENT, loadData);
            window.removeEventListener(LOCAL_RECENTLY_VIEWED_UPDATED_EVENT, loadData);
            window.removeEventListener('storage', loadData);
        };
    }, []);

    const hasAccess = (event: Event) => {
        if (event.type === 'college' && (!profile || profile.college !== event.college)) return false;
        if (event.type === 'department' && (!profile || profile.college !== event.college || profile.department !== event.department)) return false;
        return true;
    };

    const accessibleEvents = useMemo(() => {
        return events.filter(hasAccess);
    }, [events, profile]);

    const matchesDateFilter = (eventDate: string, filter: string | null) => {
        if (!filter || filter === 'all') return true;

        const target = new Date(eventDate);
        if (Number.isNaN(target.getTime())) return false;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const eventDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());

        if (filter === 'today') {
            return eventDay.getTime() === today.getTime();
        }

        if (filter === 'this_week') {
            const day = today.getDay();
            const diffToMonday = day === 0 ? -6 : 1 - day;
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() + diffToMonday);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            return eventDay >= weekStart && eventDay <= weekEnd;
        }

        if (filter === 'this_month') {
            return eventDay.getMonth() === today.getMonth() && eventDay.getFullYear() === today.getFullYear();
        }

        return eventDay.toISOString().slice(0, 10) === filter;
    };


    // Filter Logic including Access Control
    const filteredEvents = useMemo(() => {
        return accessibleEvents.filter(event => {
            // Search
            const matchesSearch =
                event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.city.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            // Category
            if (selectedCategory && event.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;

            // Location
            if (selectedLocation && selectedLocation !== 'all') {
                const locationName = AVAILABLE_LOCATIONS.find(l => l.id === selectedLocation)?.name;
                if (locationName && event.city !== locationName) return false;
            }

            // Rating
            if (selectedRating && selectedRating !== 'all') {
                const minRating = parseInt(selectedRating);
                if ((event.rating || 0) < minRating) return false;
            }

            if (!matchesDateFilter(event.date, selectedDate)) {
                return false;
            }

            return true;
        });
    }, [accessibleEvents, searchQuery, selectedCategory, selectedLocation, selectedRating, selectedDate]);

    const allEventMap = useMemo(() => {
        return new Map(accessibleEvents.map((event) => [event.id, event]));
    }, [accessibleEvents]);

    const favoriteEvents = useMemo(() => {
        return favoriteEventIds
            .map((eventId) => allEventMap.get(eventId))
            .filter(Boolean) as Event[];
    }, [favoriteEventIds, allEventMap]);

    const recentlyViewedEvents = useMemo(() => {
        return recentlyViewedIds
            .map((eventId) => allEventMap.get(eventId))
            .filter(Boolean) as Event[];
    }, [recentlyViewedIds, allEventMap]);

    const recommendedEvents = useMemo(() => {
        const categoryAffinity = new Map<string, number>();
        const cityAffinity = new Map<string, number>();

        for (const event of [...favoriteEvents, ...recentlyViewedEvents]) {
            categoryAffinity.set(event.category, (categoryAffinity.get(event.category) || 0) + 1);
            cityAffinity.set(event.city, (cityAffinity.get(event.city) || 0) + 1);
        }

        const blocked = new Set([...favoriteEventIds, ...recentlyViewedIds]);
        const scored = accessibleEvents
            .filter((event) => !blocked.has(event.id))
            .map((event) => {
                const categoryScore = (categoryAffinity.get(event.category) || 0) * 3;
                const cityScore = (cityAffinity.get(event.city) || 0) * 2;
                const ratingScore = event.rating || 0;
                return {
                    event,
                    score: categoryScore + cityScore + ratingScore,
                };
            })
            .sort((a, b) => b.score - a.score);

        if (scored.length === 0) {
            return accessibleEvents
                .slice()
                .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                .slice(0, 6);
        }

        return scored.map((entry) => entry.event).slice(0, 6);
    }, [accessibleEvents, favoriteEventIds, recentlyViewedIds, favoriteEvents, recentlyViewedEvents]);

    const cityCount = useMemo(() => new Set(accessibleEvents.map((event) => event.city)).size, [accessibleEvents]);
    const freeEventCount = useMemo(() => {
        return accessibleEvents.filter((event) => (event.price || '').toLowerCase().includes('free')).length;
    }, [accessibleEvents]);

    const handleEventClick = (eventId: string) => {
        // Navigate to event details
        window.location.href = `/events/${eventId}`;
    };

    const handleApplyFilters = () => {
        return;
    };

    const handleDetectLocation = () => {
        if ("geolocation" in navigator) {
            setIsLocating(true);
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                console.log(`Detected: ${latitude}, ${longitude}`);

                // Simulate processing delay clearly
                setTimeout(() => {
                    setSelectedLocation('bengaluru');
                    setIsLocating(false);
                    toast({
                        title: "Location Detected",
                        description: "Showing events near Bengaluru",
                    });
                }, 1000);

            }, (error) => {
                console.error("Location error", error);
                setIsLocating(false);
                toast({
                    title: "Access Denied",
                    description: "Could not detect location. Please enable location permissions.",
                    variant: "destructive"
                });
            });
        } else {
            toast({
                title: "Not Supported",
                description: "Geolocation is not available in your browser.",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Featured Carousel */}
            <div className="container mx-auto px-4 pt-4">
                <section className="mb-6 rounded-3xl border border-border/60 bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-background p-6 md:p-8">
                    <div className="flex flex-col gap-3">
                        <Badge variant="outline" className="w-fit rounded-full border-primary/40 text-primary">
                            Event Discovery Hub
                        </Badge>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Find local events that match your vibe</h1>
                        <p className="text-muted-foreground max-w-2xl">
                            Browse trending meetups, save favorites, track recently viewed events, and discover recommendations powered by your activity.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                            <div className="rounded-xl border border-border/50 bg-background/80 p-3">
                                <p className="text-xs text-muted-foreground">Visible Events</p>
                                <p className="text-2xl font-semibold">{accessibleEvents.length}</p>
                            </div>
                            <div className="rounded-xl border border-border/50 bg-background/80 p-3">
                                <p className="text-xs text-muted-foreground">Cities Covered</p>
                                <p className="text-2xl font-semibold">{cityCount}</p>
                            </div>
                            <div className="rounded-xl border border-border/50 bg-background/80 p-3">
                                <p className="text-xs text-muted-foreground">Free Events</p>
                                <p className="text-2xl font-semibold">{freeEventCount}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <FeaturedEventCarousel
                    events={accessibleEvents.slice(0, 3)}
                    onEventClick={handleEventClick}
                />
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 pb-12 space-y-8">

                {/* Search & Filter Bar */}
                <section>
                    <SearchBar
                        searchQuery={searchQuery}
                        onSearchQueryChange={setSearchQuery}
                        suggestedQuery={suggestedQuery}
                        onSuggestedQueryChange={setSuggestedQuery}
                        selectedCategoryFilter={selectedCategory}
                        onCategoryFilterChange={setSelectedCategory}
                        availableCategories={AVAILABLE_CATEGORIES}
                        selectedDateFilter={selectedDate}
                        onDateFilterChange={setSelectedDate}
                        selectedLocationFilter={selectedLocation}
                        onLocationFilterChange={setSelectedLocation}
                        availableLocations={AVAILABLE_LOCATIONS}
                        selectedRatingFilter={selectedRating}
                        onRatingFilterChange={setSelectedRating}
                        onApplyFilters={handleApplyFilters}
                        onDetectLocation={handleDetectLocation}
                        isLocating={isLocating}
                        allEvents={events}
                    />
                </section>

                {favoriteEvents.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
                                Saved Events
                            </h2>
                            <span className="text-sm text-muted-foreground">{favoriteEvents.length} saved</span>
                        </div>
                        <EventList
                            events={favoriteEvents.slice(0, 6)}
                            isLoading={loading}
                            onEventClick={handleEventClick}
                        />
                    </section>
                )}

                {recommendedEvents.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                Recommended For You
                            </h2>
                            <span className="text-sm text-muted-foreground">Based on saved and recent events</span>
                        </div>
                        <EventList
                            events={recommendedEvents}
                            isLoading={loading}
                            onEventClick={handleEventClick}
                        />
                    </section>
                )}

                {recentlyViewedEvents.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Clock3 className="h-5 w-5 text-amber-500" />
                                Recently Viewed
                            </h2>
                            <span className="text-sm text-muted-foreground">Continue where you left off</span>
                        </div>
                        <EventList
                            events={recentlyViewedEvents.slice(0, 6)}
                            isLoading={loading}
                            onEventClick={handleEventClick}
                        />
                    </section>
                )}

                {/* Nearby Events */}
                <NearbyEventsSection onEventClick={handleEventClick} />

                {/* All Events List */}
                <section id="events">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">
                            {searchQuery ? 'Search Results' : 'All Events'}
                        </h2>
                        <span className="text-sm text-muted-foreground">
                            {filteredEvents.length} events found
                        </span>
                    </div>
                    <EventList
                        events={filteredEvents}
                        isLoading={loading}
                        onEventClick={handleEventClick}
                    />
                </section>
            </div>

            <AppFooter />
        </div>
    );
}
