'use client';

import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import BookingHistory from '@/components/BookingHistory';
import AppFooter from '@/components/AppFooter';

export default function MyTicketsPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-grow container mx-auto px-4 py-10">
                <SignedIn>
                    <div className="max-w-5xl mx-auto">
                        <h1 className="text-3xl font-bold mb-6">My Tickets</h1>
                        <p className="text-sm text-muted-foreground mb-6">
                            View your complete booking history, virtual tickets, and downloadable event PDFs.
                        </p>
                        <BookingHistory />
                    </div>
                </SignedIn>

                <SignedOut>
                    <div className="max-w-md mx-auto text-center rounded-2xl border border-border/50 bg-card p-8 shadow-sm">
                        <h1 className="text-2xl font-semibold mb-2">Sign in required</h1>
                        <p className="text-muted-foreground mb-6">Please sign in to see your tickets.</p>
                        <SignInButton mode="modal">
                            <Button>Sign In</Button>
                        </SignInButton>
                    </div>
                </SignedOut>
            </main>
            <AppFooter />
        </div>
    );
}
