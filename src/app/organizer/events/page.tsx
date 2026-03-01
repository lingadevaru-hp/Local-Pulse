
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppFooter from '@/components/AppFooter';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, PlusCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { getLocalEvents, LOCAL_EVENTS_UPDATED_EVENT } from '@/lib/local-db';
import type { Event } from '@/types';

export default function MyEventsPage() {
    const { user, loading: authLoading } = useAuth();
    const [activeEvents, setActiveEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        const syncLocalEvents = () => {
            if (!user) {
                setActiveEvents([]);
                setLoading(false);
                return;
            }

            const mine = getLocalEvents().filter((event) => event.organizerId === user.uid);
            setActiveEvents(mine);
            setLoading(false);
        };

        syncLocalEvents();
        window.addEventListener(LOCAL_EVENTS_UPDATED_EVENT, syncLocalEvents);

        return () => window.removeEventListener(LOCAL_EVENTS_UPDATED_EVENT, syncLocalEvents);
    }, [user, authLoading]);

    if (authLoading || loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <main className="flex-grow container mx-auto px-4 py-24 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </main>
                <AppFooter />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-grow container mx-auto px-4 py-24">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/organizer">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                        </Button>
                        <h1 className="text-3xl font-bold">My Events</h1>
                    </div>
                    <Button asChild>
                        <Link href="/events/create">
                            <PlusCircle className="w-4 h-4 mr-2" /> Create Event
                        </Link>
                    </Button>
                </div>

                <div className="space-y-8">
                    <section>
                        <h2 className="text-xl font-semibold mb-4 flex items-center">
                            <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                            Published Events ({activeEvents.length}) - Local Database
                        </h2>
                        {activeEvents.length === 0 ? (
                            <Card className="glass-effect border-dashed">
                                <CardContent className="py-8 text-center text-muted-foreground">
                                    No published events yet.
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {activeEvents.map((event) => (
                                    <div key={event.id} className="relative">
                                        <div className="absolute top-2 right-2 z-10">
                                            <Badge variant="default" className="bg-green-600">
                                                Live
                                            </Badge>
                                        </div>
                                        <Card className="h-full glass-effect">
                                            <div className="relative w-full aspect-[16/9] bg-muted">
                                                <img
                                                    src={event.imageUrl}
                                                    alt={event.name}
                                                    className="w-full h-full object-cover rounded-t-xl"
                                                />
                                            </div>
                                            <CardHeader>
                                                <CardTitle className="text-lg">{event.name}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <Button variant="outline" className="w-full" asChild>
                                                    <Link href={`/events/${event.id}`}>View Details</Link>
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
            <AppFooter />
        </div>
    );
}
