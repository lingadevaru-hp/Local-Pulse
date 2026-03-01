'use client';

import { useEffect, useMemo, useState } from 'react';
import { SignedOut, SignInButton } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Database, Loader2, ShieldCheck, Ticket } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  getLocalEvents,
  getLocalRegistrations,
  LOCAL_EVENTS_UPDATED_EVENT,
  LOCAL_REGISTRATIONS_UPDATED_EVENT,
} from '@/lib/local-db';
import { isOrganizerApproved } from '@/lib/access';

export default function OrganizerDashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [myEventCount, setMyEventCount] = useState(0);
  const [myRegistrationCount, setMyRegistrationCount] = useState(0);

  useEffect(() => {
    const syncStats = () => {
      if (!user) {
        setMyEventCount(0);
        setMyRegistrationCount(0);
        return;
      }

      const myEvents = getLocalEvents().filter((event) => event.organizerId === user.uid);
      const myEventIds = new Set(myEvents.map((event) => event.id));
      const regs = getLocalRegistrations().filter((reg) => myEventIds.has(reg.eventId));

      setMyEventCount(myEvents.length);
      setMyRegistrationCount(regs.length);
    };

    syncStats();
    window.addEventListener(LOCAL_EVENTS_UPDATED_EVENT, syncStats);
    window.addEventListener(LOCAL_REGISTRATIONS_UPDATED_EVENT, syncStats);
    window.addEventListener('storage', syncStats);

    return () => {
      window.removeEventListener(LOCAL_EVENTS_UPDATED_EVENT, syncStats);
      window.removeEventListener(LOCAL_REGISTRATIONS_UPDATED_EVENT, syncStats);
      window.removeEventListener('storage', syncStats);
    };
  }, [user]);

  const organizerApproved = useMemo(() => isOrganizerApproved(profile), [profile]);

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SignedOut>
          <Card className="max-w-xl mx-auto text-center">
            <CardHeader>
              <CardTitle className="text-2xl">Sign in required</CardTitle>
              <CardDescription>Sign in to access organizer tools.</CardDescription>
            </CardHeader>
            <CardContent>
              <SignInButton mode="modal">
                <Button>Sign In</Button>
              </SignInButton>
            </CardContent>
          </Card>
        </SignedOut>
      </div>
    );
  }

  if (!organizerApproved) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="text-2xl">Organizer Verification Pending</CardTitle>
            <CardDescription>
              Submit your organizer verification request to unlock event creation tools.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Current status: <span className="font-semibold text-foreground capitalize">{profile?.organizerStatus || 'none'}</span>
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/organizer/apply">
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Apply As Organizer
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Browse Events</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Organizer Dashboard</CardTitle>
          <CardDescription>Create and manage your verified organizer events.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Events Hosted</CardDescription>
                <CardTitle className="text-3xl">{myEventCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Registrations</CardDescription>
                <CardTitle className="text-3xl">{myRegistrationCount}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>My Events</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">View events created by your organizer account.</p>
                <Button className="mt-4" variant="outline" asChild>
                  <Link href="/organizer/events">View My Events</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Create New Event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Publish a verified local event for your audience.</p>
                <Button className="mt-4" asChild>
                  <Link href="/events/create">Create Event</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Data Hub</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Export/import event data and local backup snapshots.</p>
                <Button className="mt-4" variant="outline" asChild>
                  <Link href="/database">
                    <Database className="h-4 w-4 mr-2" />
                    Open Data Hub
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-xl border border-border/50 p-4 bg-muted/20">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Ticket className="h-4 w-4 text-primary" />
              Organizer Notes
            </h3>
            <p className="text-sm text-muted-foreground">
              Keep your event details, location, and timings accurate. Verified organizers receive higher trust and better attendee conversion.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
