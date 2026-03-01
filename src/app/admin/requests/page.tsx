'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SignInButton } from '@clerk/nextjs';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, MapPin, Calendar, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Event } from '@/types';
import { isAdminEmail } from '@/lib/access';

export default function AdminRequestsPage() {
    const { user, profile, loading: authLoading } = useAuth();
    const [requests, setRequests] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const isAdmin = (profile?.role === 'admin') || isAdminEmail(user?.email || profile?.email || null);

    useEffect(() => {
        if (!authLoading && (!user || !isAdmin)) {
            setLoading(false);
        }
    }, [user, isAdmin, authLoading]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, "events"),
                where("status", "==", "pending")
            );
            const snapshot = await getDocs(q);
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
            setRequests(docs);
        } catch (error) {
            console.error("Error fetching requests:", error);
            toast({
                title: "Error",
                description: "Failed to fetch pending requests.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && isAdmin) {
            fetchRequests();
        }
    }, [user, isAdmin]);

    const handleAction = async (eventId: string, action: 'approved' | 'rejected') => {
        try {
            const docRef = doc(db, "events", eventId);
            if (action === 'approved') {
                await updateDoc(docRef, { status: 'approved' });
                toast({ title: "Approved", description: "Event has been published." });
            } else {
                await deleteDoc(docRef); // Or set status to 'rejected'
                toast({ title: "Rejected", description: "Event request has been removed." });
            }
            setRequests(prev => prev.filter(r => r.id !== eventId));
        } catch (error) {
            console.error("Action error:", error);
            toast({ title: "Error", description: "Action failed.", variant: "destructive" });
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card className="max-w-xl mx-auto text-center">
                    <CardHeader>
                        <CardTitle className="text-2xl">Admin Sign-In Required</CardTitle>
                        <CardDescription>Sign in with your admin account to view event requests.</CardDescription>
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
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Admin Access Denied</CardTitle>
                        <CardDescription>
                            Add your login email to <code>NEXT_PUBLIC_ADMIN_EMAILS</code> and redeploy.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Signed in as: <span className="font-medium text-foreground">{user.email || 'Unknown email'}</span>
                        </p>
                        <Button className="mt-4" variant="outline" asChild>
                            <Link href="/">Back to Home</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Pending Event Requests</h1>
                    <p className="text-muted-foreground">Review and approve event submissions from the community.</p>
                </div>
                <Badge variant="outline" className="text-lg py-1 px-4">
                    {requests.length} Pending
                </Badge>
            </div>

            {requests.length === 0 ? (
                <Card className="p-12 text-center glass-effect">
                    <p className="text-muted-foreground">No pending requests at the moment.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {requests.map((request) => (
                        <Card key={request.id} className="glass-effect flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant="secondary">{request.category}</Badge>
                                    <Badge variant="outline" className="capitalize">{request.type}</Badge>
                                </div>
                                <CardTitle className="line-clamp-1">{request.name}</CardTitle>
                                <CardDescription className="flex items-center gap-1">
                                    Submitted by <span className="font-medium text-foreground">{(request as any).organizerName || 'Anonymous'}</span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 flex-grow">
                                <p className="text-sm text-muted-foreground line-clamp-3">{request.description}</p>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center text-muted-foreground">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        {request.date}
                                    </div>
                                    <div className="flex items-center text-muted-foreground">
                                        <Clock className="mr-2 h-4 w-4" />
                                        {request.time}
                                    </div>
                                    <div className="flex items-center text-muted-foreground">
                                        <MapPin className="mr-2 h-4 w-4" />
                                        <span className="truncate">{request.location}, {request.city}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="grid grid-cols-2 gap-3 pt-4 border-t">
                                <Button
                                    variant="outline"
                                    className="w-full border-red-200 hover:bg-red-50 hover:text-red-600"
                                    onClick={() => handleAction(request.id, 'rejected')}
                                >
                                    <X className="mr-2 h-4 w-4" /> Reject
                                </Button>
                                <Button
                                    className="w-full"
                                    onClick={() => handleAction(request.id, 'approved')}
                                >
                                    <Check className="mr-2 h-4 w-4" /> Approve
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
