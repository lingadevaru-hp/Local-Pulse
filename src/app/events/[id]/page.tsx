'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { CalendarDays, MapPin, UserCircle, Tag, ArrowLeft, Bell, CheckCircle2, Loader2, Lock, CalendarPlus } from 'lucide-react';
import Link from 'next/link';
import AppFooter from '@/components/AppFooter';
import RegistrationDialog from '@/components/RegistrationDialog';
import ShareButton from '@/components/ShareButton';
import FavoriteToggleButton from '@/components/FavoriteToggleButton';
import type { Event } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { MOCK_EVENTS } from '@/lib/mockData';
import { getLocalEventById, getLocalRegistrations, trackRecentlyViewedEvent } from '@/lib/local-db';
import { downloadEventCalendar } from '@/lib/calendar';

export default function EventPage() {
    const params = useParams();
    const id = params?.id as string;
    const { user, profile, loading: authLoading } = useAuth();
    const { toast } = useToast();

    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRegistered, setIsRegistered] = useState(false);
    const [registrationDialogOpen, setRegistrationDialogOpen] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);

    useEffect(() => {
        async function fetchEventData() {
            if (!id) return;

            try {
                const localEvent = getLocalEventById(id);
                if (localEvent) {
                    setEvent(localEvent);
                    setLoading(false);
                    return;
                }

                // Check if it's a mock event
                if (typeof id === 'string' && (id.startsWith('local-') || id.startsWith('college-') || id.startsWith('dept-'))) {
                    const mockEvent = MOCK_EVENTS.find(e => e.id === id);
                    if (mockEvent) {
                        setEvent(mockEvent);
                        setLoading(false);
                        return;
                    }
                }

                const eventDoc = await getDoc(doc(db, "events", id));
                if (eventDoc.exists()) {
                    const eventData = { id: eventDoc.id, ...eventDoc.data() } as Event;

                    // Access Control Check
                    if (eventData.type === 'college' && (!profile || profile.college !== eventData.college)) {
                        setAccessDenied(true);
                    } else if (eventData.type === 'department' && (!profile || profile.college !== eventData.college || profile.department !== eventData.department)) {
                        setAccessDenied(true);
                    } else {
                        setEvent(eventData);
                    }
                } else {
                    // Fallback to mock data if doc doesn't exist
                    const mockEvent = MOCK_EVENTS.find(e => e.id === id);
                    if (mockEvent) setEvent(mockEvent);
                }
            } catch (error) {
                console.error("Error fetching event:", error);
                // Fallback to mock data on error
                const mockEvent = MOCK_EVENTS.find(e => e.id === id);
                if (mockEvent) setEvent(mockEvent);
            } finally {
                setLoading(false);
            }
        }

        if (!authLoading) {
            fetchEventData();
        }
    }, [id, authLoading, profile]);

    useEffect(() => {
        async function checkRegistration() {
            if (!user || !id) return;

            // Check Firestore first
            try {
                const q = query(
                    collection(db, "registrations"),
                    where("userId", "==", user.uid),
                    where("eventId", "==", id)
                );
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    setIsRegistered(true);
                    return;
                }
            } catch (e) {
                console.warn("Firestore registration check failed, checking localStorage:", e);
            }

            const localRegistrations = getLocalRegistrations();
            const isLocallyRegistered = localRegistrations.some((reg) => reg.userId === user.uid && reg.eventId === id);
            setIsRegistered(isLocallyRegistered);
        }

        if (user && id) {
            checkRegistration();
        }
    }, [user, id, registrationDialogOpen]);

    useEffect(() => {
        if (!event?.id) return;
        trackRecentlyViewedEvent(event.id);
    }, [event?.id]);

    const handleSetNotification = () => {
        toast({
            title: "Reminders Active",
            description: `We'll remind you about ${event?.name} when it's near!`,
            action: <Bell className="h-4 w-4 text-primary" />,
        });
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (accessDenied) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center space-y-4 max-w-md glass-effect p-8 rounded-2xl border border-border/50 shadow-2xl">
                    <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                        <Lock className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold">Access Restricted</h1>
                    <p className="text-muted-foreground">
                        This event is restricted to members of <strong>{event?.college || 'the host college'}</strong>
                        {event?.department ? ` in the ${event.department} department.` : '.'}
                    </p>
                    <Link href="/">
                        <Button className="w-full">Back to Home</Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
                    <Link href="/">
                        <Button>Go Back Home</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-grow pb-12">
                <div className="relative w-full h-[40vh] md:h-[50vh] overflow-hidden">
                    <Image
                        src={event.imageUrl || `https://picsum.photos/seed/${event.id}/1200/600`}
                        alt={event.name}
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                    <div className="absolute top-4 left-4">
                        <Link href="/">
                            <Button variant="ghost" size="icon" className="rounded-full bg-black/30 hover:bg-black/50 text-white">
                                <ArrowLeft className="h-6 w-6" />
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="container mx-auto px-4 -mt-20 relative z-10">
                    <div className="bg-card glass-effect rounded-2xl p-6 md:p-8 shadow-xl border border-border/50">
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                            <div className="space-y-4 flex-grow">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center">
                                        <Tag className="w-3 h-3 mr-1" /> {event.category}
                                    </span>
                                    <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                                        {event.type.toUpperCase()}
                                    </span>
                                </div>

                                <h1 className="text-3xl md:text-4xl font-bold text-foreground">{event.name}</h1>

                                <div className="flex flex-col sm:flex-row gap-4 text-muted-foreground">
                                    <div className="flex items-center">
                                        <CalendarDays className="w-5 h-5 mr-2 text-primary" />
                                        <span>{new Date(event.date).toLocaleDateString()} at {event.time}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <MapPin className="w-5 h-5 mr-2 text-primary" />
                                        <span>{event.location}, {event.city}</span>
                                    </div>
                                    {event.price && (
                                        <div className="flex items-center font-semibold text-foreground">
                                            <Tag className="w-5 h-5 mr-2 text-primary" />
                                            <span>{event.price}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 min-w-[200px]">
                                {isRegistered ? (
                                    <>
                                        <div className="bg-green-500/10 text-green-600 dark:text-green-400 px-4 py-3 rounded-xl border border-green-500/20 flex items-center justify-center mb-1">
                                            <CheckCircle2 className="w-5 h-5 mr-2" />
                                            <span className="font-semibold text-lg">Registered</span>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="w-full h-11 rounded-xl border-primary/30 text-primary hover:bg-primary/5"
                                            onClick={handleSetNotification}
                                        >
                                            <Bell className="w-4 h-4 mr-2" /> Notifications On
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        className="w-full text-lg h-12 rounded-xl shadow-lg shadow-primary/20"
                                        onClick={() => {
                                            console.log("Register Now clicked, opening dialog");
                                            setRegistrationDialogOpen(true);
                                        }}
                                    >
                                        Register Now
                                    </Button>
                                )}
                                <div className="grid grid-cols-2 gap-2">
                                    <FavoriteToggleButton eventId={event.id} showLabel className="w-full rounded-xl" />
                                    <ShareButton event={event} variant="outline" size="default" className="w-full rounded-xl" />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full rounded-xl"
                                    onClick={() => downloadEventCalendar(event)}
                                >
                                    <CalendarPlus className="w-4 h-4 mr-2" />
                                    Add To Calendar
                                </Button>
                            </div>
                        </div>

                        <hr className="my-8 border-border/50" />

                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 space-y-6">
                                <h2 className="text-2xl font-semibold">About This Event</h2>
                                <p className="text-muted-foreground leading-relaxed text-lg whitespace-pre-wrap">
                                    {event.description}
                                </p>

                                {event.imageGallery && event.imageGallery.length > 0 && (
                                    <>
                                        <h3 className="text-xl font-semibold mt-8 mb-4">Event Gallery</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {event.imageGallery.map((src, i) => (
                                                <div key={i} className="relative aspect-square rounded-xl overflow-hidden shadow-sm group">
                                                    <Image
                                                        src={src}
                                                        alt="Gallery image"
                                                        fill
                                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="space-y-6">
                                <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
                                    <h3 className="font-semibold mb-4 flex items-center">
                                        <UserCircle className="w-5 h-5 mr-2" /> Organizer
                                    </h3>
                                    <p className="text-lg font-medium">{event.organizer || event.organizerName || "LocalPulse"}</p>
                                    <p className="text-sm text-muted-foreground mt-1">Verified Organizer</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-4 w-full border-primary/20 hover:bg-primary/5"
                                        onClick={() => {
                                            const subject = encodeURIComponent(`Inquiry: ${event.name}`);
                                            const body = encodeURIComponent(`Hi ${event.organizer || 'Organizer'},\n\nI am interested in your event "${event.name}".\n\n`);
                                            window.open(`mailto:contact@localpulse.app?subject=${subject}&body=${body}`, '_blank');
                                        }}
                                    >
                                        Contact Organizer
                                    </Button>
                                </div>

                                <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
                                    <h3 className="font-semibold mb-4">Location</h3>
                                    <div className="aspect-video bg-muted rounded-lg w-full overflow-hidden shadow-inner">
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            style={{ border: 0 }}
                                            loading="lazy"
                                            allowFullScreen
                                            referrerPolicy="no-referrer-when-downgrade"
                                            src={`https://maps.google.com/maps?q=${encodeURIComponent(
                                                (event.type === 'college' || event.type === 'department')
                                                    ? `${event.location}, ${event.college || ''}, ${event.city}`
                                                    : `${event.location}, ${event.city}`
                                            )}&z=15&output=embed`}
                                            title={`Map location of ${event.location}`}
                                        ></iframe>
                                    </div>
                                    <p className="mt-2 text-sm text-muted-foreground">{event.locationAddress || event.location}</p>
                                    {event.coordinates && (
                                        <div className="mt-2 flex items-center text-[10px] font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                                            <MapPin className="w-3 h-3 mr-1" />
                                            {event.coordinates.latitude.toFixed(6)}, {event.coordinates.longitude.toFixed(6)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <RegistrationDialog
                    open={registrationDialogOpen}
                    onOpenChange={setRegistrationDialogOpen}
                    eventName={event.name}
                    eventId={event.id}
                    eventDate={event.date}
                    eventLocation={`${event.location}, ${event.city}`}
                    eventPrice={event.price}
                />
            </main>
            <AppFooter />
        </div>
    );
}
