
'use client';

import type { NextPage } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Database } from 'lucide-react';

const OrganizerDashboardPage: NextPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Organizer Dashboard</CardTitle>
          <CardDescription>Create and manage your events stored in the local database.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Welcome to your dashboard. This area is for event organizers.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>My Events</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">View and manage events you have created on this device.</p>
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
                <p className="text-sm text-muted-foreground">Start by creating a new event. It appears instantly without backend setup.</p>
                <Button className="mt-4" asChild>
                  <Link href="/events/create">Create Event</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Database Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Export/import local data and inspect the browser database state.</p>
                <Button className="mt-4" variant="outline" asChild>
                  <Link href="/database">
                    <Database className="h-4 w-4 mr-2" />
                    Open Data Hub
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-2">Registrations Overview</h3>
            <p className="text-sm text-muted-foreground">Analytics and registration data will be displayed here.</p>
            {/* Placeholder for charts or stats */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizerDashboardPage;
