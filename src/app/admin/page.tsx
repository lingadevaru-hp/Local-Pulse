'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { SignInButton } from '@clerk/nextjs';
import { collection, getDocs } from 'firebase/firestore';
import { CheckCircle2, Clock3, Loader2, ShieldCheck, Users, XCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { isPlaceholderFirebaseConfig } from '@/lib/firebase-config';
import { getLocalEvents, getLocalRegistrations } from '@/lib/local-db';
import { listLocalUserProfiles } from '@/lib/local-user-profile';
import {
  listOrganizerApplications,
  reviewOrganizerApplication,
} from '@/lib/organizer-applications';
import type { OrganizerApplication } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { isAdminEmail } from '@/lib/access';

interface AdminStats {
  totalUsers: number;
  organizerCount: number;
  regularUsers: number;
  totalEvents: number;
  totalRegistrations: number;
  pendingApplications: number;
}

interface OrganizerPerformance {
  organizerId: string;
  organizerName: string;
  eventCount: number;
}

export default function AdminDashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<OrganizerApplication[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    organizerCount: 0,
    regularUsers: 0,
    totalEvents: 0,
    totalRegistrations: 0,
    pendingApplications: 0,
  });
  const [performance, setPerformance] = useState<OrganizerPerformance[]>([]);

  const isAdmin = (profile?.role === 'admin') || isAdminEmail(user?.email || profile?.email || null);

  const loadDashboard = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const applicationsData = await listOrganizerApplications();
      setApplications(applicationsData);

      if (isPlaceholderFirebaseConfig()) {
        const localProfiles = listLocalUserProfiles();
        const mergedProfiles = new Map(localProfiles.map((p) => [p.uid, p]));
        if (profile) mergedProfiles.set(profile.uid, profile);
        const profiles = Array.from(mergedProfiles.values());

        const localEvents = getLocalEvents();
        const localRegistrations = getLocalRegistrations();

        const organizerMap = new Map<string, OrganizerPerformance>();
        for (const event of localEvents) {
          if (!event.organizerId) continue;
          const existing = organizerMap.get(event.organizerId);
          if (existing) {
            existing.eventCount += 1;
          } else {
            organizerMap.set(event.organizerId, {
              organizerId: event.organizerId,
              organizerName: event.organizerName || 'Organizer',
              eventCount: 1,
            });
          }
        }

        const organizerCount = profiles.filter((p) => p.role === 'organizer' || p.role === 'admin').length;

        setStats({
          totalUsers: profiles.length,
          organizerCount,
          regularUsers: Math.max(profiles.length - organizerCount, 0),
          totalEvents: localEvents.length,
          totalRegistrations: localRegistrations.length,
          pendingApplications: applicationsData.filter((app) => app.status === 'pending').length,
        });
        setPerformance(Array.from(organizerMap.values()).sort((a, b) => b.eventCount - a.eventCount));
        return;
      }

      const [usersSnap, eventsSnap, registrationsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'events')),
        getDocs(collection(db, 'registrations')),
      ]);

      const users = usersSnap.docs.map((item) => item.data() as { role?: string });
      const events = eventsSnap.docs.map((item) => ({ id: item.id, ...item.data() })) as Array<{
        organizerId?: string;
        organizerName?: string;
      }>;

      const organizerMap = new Map<string, OrganizerPerformance>();
      for (const event of events) {
        const organizerId = event.organizerId || 'unknown';
        const existing = organizerMap.get(organizerId);
        if (existing) {
          existing.eventCount += 1;
        } else {
          organizerMap.set(organizerId, {
            organizerId,
            organizerName: event.organizerName || 'Organizer',
            eventCount: 1,
          });
        }
      }

      const organizerCount = users.filter((u) => u.role === 'organizer' || u.role === 'admin').length;

      setStats({
        totalUsers: users.length,
        organizerCount,
        regularUsers: Math.max(users.length - organizerCount, 0),
        totalEvents: events.length,
        totalRegistrations: registrationsSnap.size,
        pendingApplications: applicationsData.filter((app) => app.status === 'pending').length,
      });
      setPerformance(Array.from(organizerMap.values()).sort((a, b) => b.eventCount - a.eventCount));
    } catch (error) {
      toast({
        title: 'Failed to load admin dashboard',
        description: 'Please refresh and try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      loadDashboard();
    }
  }, [user, isAdmin]);

  const pendingApps = useMemo(
    () => applications.filter((item) => item.status === 'pending'),
    [applications]
  );

  const reviewedApps = useMemo(
    () => applications.filter((item) => item.status !== 'pending'),
    [applications]
  );

  const handleReview = async (appId: string, nextStatus: 'approved' | 'rejected') => {
    if (!user) return;
    try {
      await reviewOrganizerApplication(appId, nextStatus, user.uid);
      toast({
        title: nextStatus === 'approved' ? 'Organizer approved' : 'Organizer rejected',
        description: 'Application status has been updated.',
      });
      await loadDashboard();
    } catch (error) {
      toast({
        title: 'Action failed',
        description: error instanceof Error ? error.message : 'Unable to update request.',
        variant: 'destructive',
      });
    }
  };

  if (authLoading || (user && isAdmin && loading)) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Admin Sign-In Required</CardTitle>
            <CardDescription>Sign in with your admin account to access the control panel.</CardDescription>
          </CardHeader>
          <CardContent>
            <SignInButton mode="modal">
              <Button>Sign In</Button>
            </SignInButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Admin Access Denied</CardTitle>
            <CardDescription>
              This account is not in the admin allow-list.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Signed in as: <span className="font-medium text-foreground">{user.email || 'Unknown email'}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Add your email in Render env var: <code>NEXT_PUBLIC_ADMIN_EMAILS</code> (comma-separated), then redeploy.
            </p>
            <Button variant="outline" asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Admin Control Panel</h1>
        <p className="text-muted-foreground">
          Review organizer verification requests, monitor platform growth, and manage organizer legitimacy.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardDescription>Total Users</CardDescription><CardTitle className="text-3xl">{stats.totalUsers}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Organizers</CardDescription><CardTitle className="text-3xl">{stats.organizerCount}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Regular Users</CardDescription><CardTitle className="text-3xl">{stats.regularUsers}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Total Events</CardDescription><CardTitle className="text-3xl">{stats.totalEvents}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Total Registrations</CardDescription><CardTitle className="text-3xl">{stats.totalRegistrations}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Pending Organizer Requests</CardDescription><CardTitle className="text-3xl">{stats.pendingApplications}</CardTitle></CardHeader></Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-amber-600" />
            Pending Organizer Verification
          </h2>
          <Badge variant="outline">{pendingApps.length} pending</Badge>
        </div>

        {pendingApps.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No pending organizer requests.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingApps.map((app) => (
              <Card key={app.id} className="glass-effect">
                <CardHeader>
                  <CardTitle className="text-lg">{app.fullName}</CardTitle>
                  <CardDescription>{app.organizationName} - {app.city}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm"><span className="font-medium">Email:</span> {app.userEmail}</p>
                  <p className="text-sm"><span className="font-medium">Phone:</span> {app.phone}</p>
                  <p className="text-sm"><span className="font-medium">ID:</span> {app.governmentIdType} - {app.governmentIdNumber}</p>
                  <p className="text-sm"><span className="font-medium">Document:</span> {app.documentName}</p>
                  {app.documentUrl ? (
                    <Link href={app.documentUrl} className="text-sm text-primary underline" target="_blank">
                      Open uploaded document
                    </Link>
                  ) : null}
                  {app.documentDataUrl ? (
                    <a href={app.documentDataUrl} target="_blank" className="text-sm text-primary underline">
                      Preview uploaded document
                    </a>
                  ) : null}
                  <div className="flex gap-2 pt-3">
                    <Button onClick={() => handleReview(app.id, 'approved')}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button variant="outline" onClick={() => handleReview(app.id, 'rejected')}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Organizer Event Performance
        </h2>
        {performance.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">No organizer event records yet.</Card>
        ) : (
          <Card>
            <CardContent className="pt-6 space-y-3">
              {performance.map((item) => (
                <div key={item.organizerId} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                  <div>
                    <p className="font-medium">{item.organizerName}</p>
                    <p className="text-xs text-muted-foreground">{item.organizerId}</p>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {item.eventCount} events
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Reviewed Applications</h2>
        {reviewedApps.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviewed organizer applications yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reviewedApps.slice(0, 8).map((app) => (
              <Card key={app.id}>
                <CardContent className="pt-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{app.fullName}</p>
                    <p className="text-xs text-muted-foreground">{app.organizationName}</p>
                  </div>
                  <Badge
                    variant={app.status === 'approved' ? 'default' : 'destructive'}
                    className="capitalize"
                  >
                    {app.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
