'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Calendar, ExternalLink, Ticket as TicketIcon, Bell, BellOff } from 'lucide-react';
import Ticket from './Ticket';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import {
    getLocalRegistrations,
    saveLocalRegistration,
    LOCAL_REGISTRATIONS_UPDATED_EVENT,
    LocalRegistration,
} from '@/lib/local-db';

export default function BookingHistory() {
    const [bookings, setBookings] = useState<LocalRegistration[]>([]);
    const [selectedBooking, setSelectedBooking] = useState<LocalRegistration | null>(null);
    const [isTicketOpen, setIsTicketOpen] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        const syncBookings = () => {
            if (!user) {
                setBookings([]);
                return;
            }

            const filtered = getLocalRegistrations().filter((booking) => booking.userId === user.uid);
            setBookings(filtered);
        };

        syncBookings();
        window.addEventListener(LOCAL_REGISTRATIONS_UPDATED_EVENT, syncBookings);
        window.addEventListener('storage', syncBookings);

        return () => {
            window.removeEventListener(LOCAL_REGISTRATIONS_UPDATED_EVENT, syncBookings);
            window.removeEventListener('storage', syncBookings);
        };
    }, [user]);

    const viewTicket = (booking: LocalRegistration) => {
        setSelectedBooking(booking);
        setIsTicketOpen(true);
    };

    const toggleReminder = (booking: LocalRegistration) => {
        saveLocalRegistration({
            ...booking,
            remindersEnabled: booking.remindersEnabled === false ? true : false,
        });
    };

    const hasBookings = useMemo(() => bookings.length > 0, [bookings]);

    if (!hasBookings) {
        return (
            <div className="text-center py-12 bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
                <TicketIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold">No bookings yet</h3>
                <p className="text-muted-foreground">Your booked event tickets will appear here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {bookings.map((booking) => (
                <Card key={booking.bookingId} className="overflow-hidden border-border/50 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-xl">{booking.eventName}</CardTitle>
                                <CardDescription className="flex items-center mt-1">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {new Date(booking.registeredAt).toLocaleDateString()}
                                </CardDescription>
                            </div>
                            <Badge variant={booking.status === 'completed' || !booking.status ? 'default' : 'secondary'}>
                                {booking.status === 'completed' || !booking.status ? 'Confirmed' : booking.status}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 w-full sm:w-auto">
                                <div className="text-sm">
                                    <p className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Attendees</p>
                                    <p className="font-medium">{booking.attendees} {parseInt(booking.attendees, 10) > 1 ? 'People' : 'Person'}</p>
                                </div>
                                <div className="text-sm">
                                    <p className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Price Paid</p>
                                    <p className="font-medium text-primary">{booking.amount || 'Free'}</p>
                                </div>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <div className="flex items-center space-x-2 bg-muted/50 px-3 py-1.5 rounded-lg border">
                                    {booking.remindersEnabled === false ? (
                                        <BellOff className="w-4 h-4 text-muted-foreground" />
                                    ) : (
                                        <Bell className="w-4 h-4 text-primary" />
                                    )}
                                    <Label htmlFor={`reminder-${booking.bookingId}`} className="text-xs font-medium cursor-pointer">
                                        Reminders
                                    </Label>
                                    <Switch
                                        id={`reminder-${booking.bookingId}`}
                                        checked={booking.remindersEnabled !== false}
                                        onCheckedChange={() => toggleReminder(booking)}
                                    />
                                </div>
                                <Button variant="outline" size="sm" onClick={() => viewTicket(booking)} className="flex-1 sm:flex-none">
                                    <TicketIcon className="w-4 h-4 mr-2" /> View Ticket
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => window.location.href = `/events/${booking.eventId}`} className="flex-1 sm:flex-none">
                                    <ExternalLink className="w-4 h-4 mr-2" /> Event Page
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}

            <Dialog open={isTicketOpen} onOpenChange={setIsTicketOpen}>
                <DialogContent className="sm:max-w-md p-0 bg-transparent border-none shadow-none">
                    <div className="pt-6 pb-2">
                        {selectedBooking && (
                            <Ticket
                                bookingId={selectedBooking.bookingId}
                                eventName={selectedBooking.eventName}
                                eventDate={selectedBooking.eventDate || selectedBooking.registeredAt}
                                eventLocation={selectedBooking.eventLocation || 'Event Venue'}
                                attendeeName={selectedBooking.fullName}
                                attendees={parseInt(selectedBooking.attendees, 10)}
                                amount={selectedBooking.amount || 'Free'}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
