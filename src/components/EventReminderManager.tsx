'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getLocalRegistrations, LOCAL_REGISTRATIONS_UPDATED_EVENT } from '@/lib/local-db';

interface Booking {
    eventId: string;
    eventName: string;
    eventDate?: string;
    bookingId: string;
    remindersEnabled?: boolean;
}

export default function EventReminderManager() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [lastChecked, setLastChecked] = useState(0);

    useEffect(() => {
        const checkReminders = async () => {
            if (!user) return;
            const now = new Date();

            // Only check once every 5 minutes
            if (Date.now() - lastChecked < 300000) return;
            setLastChecked(Date.now());

            const bookings = getLocalRegistrations().filter((booking) => booking.userId === user.uid) as Booking[];
            const dismissed = JSON.parse(localStorage.getItem('dismissed_reminders') || '[]');

            bookings.forEach(booking => {
                if (dismissed.includes(booking.bookingId)) return;
                if (booking.remindersEnabled === false) return;

                if (!booking.eventDate) return;
                const eventDate = new Date(booking.eventDate);
                if (Number.isNaN(eventDate.getTime())) return;
                const diffTime = eventDate.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays >= 0 && diffDays <= 1) {
                    const message = diffDays === 0
                        ? `Reminder: ${booking.eventName} is happening today!`
                        : `Reminder: ${booking.eventName} is happening tomorrow!`;

                    toast({
                        title: "Upcoming Event",
                        description: message,
                        action: <Bell className="h-4 w-4 text-primary" />,
                    });

                    const newDismissed = [...dismissed, booking.bookingId];
                    localStorage.setItem('dismissed_reminders', JSON.stringify(newDismissed));
                }
            });
        };

        checkReminders();

        const onRegistrationsUpdated = () => {
            setLastChecked(0);
        };

        window.addEventListener(LOCAL_REGISTRATIONS_UPDATED_EVENT, onRegistrationsUpdated);
        return () => window.removeEventListener(LOCAL_REGISTRATIONS_UPDATED_EVENT, onRegistrationsUpdated);
    }, [user, lastChecked, toast]);

    return null;
}
