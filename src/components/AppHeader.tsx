'use client';

import Link from 'next/link';
import type { ComponentType, SVGProps } from 'react';
import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { CalendarDays, Database, Home, LayoutDashboard, Menu, PlusCircle, ShieldCheck, Ticket } from 'lucide-react';
import {
    SignedIn,
    SignedOut,
    SignInButton,
    SignUpButton,
    UserButton,
} from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { isOrganizerApproved } from '@/lib/access';

interface NavItem {
    href: string;
    label: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const NavLinks = ({ mobile = false, items }: { mobile?: boolean; items: NavItem[] }) => {
    const pathname = usePathname();

    return (
        <nav className={cn("items-center gap-2", mobile ? "flex flex-col w-full" : "hidden md:flex")}>
            {items.map((item) => {
                const basePath = item.href.split('#')[0];
                const isHashLink = item.href.includes('#');
                const isActive = item.href === '/'
                    ? pathname === '/'
                    : isHashLink
                        ? pathname === basePath
                        : pathname.startsWith(basePath);
                const linkClass = cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                    mobile && "w-full justify-start flex items-center gap-2 text-base py-3"
                );

                const link = (
                    <Link key={item.label} href={item.href} className={linkClass}>
                        {mobile && <item.icon className="h-4 w-4" />}
                        {item.label}
                    </Link>
                );

                return mobile ? <SheetClose key={item.label} asChild>{link}</SheetClose> : link;
            })}
        </nav>
    );
};

export default function AppHeader() {
    const { user, profile } = useAuth();

    const organizerApproved = isOrganizerApproved(profile);
    const isAdmin = profile?.role === 'admin';

    const navItems = useMemo<NavItem[]>(() => {
        const items: NavItem[] = [
            { href: '/', label: 'Home', icon: Home },
            { href: '/#events', label: 'Events', icon: CalendarDays },
            { href: '/database', label: 'Data Hub', icon: Database },
        ];

        if (user) {
            items.push({ href: '/my-tickets', label: 'My Tickets', icon: Ticket });
        }

        if (organizerApproved) {
            items.push({ href: '/organizer', label: 'Organizer', icon: LayoutDashboard });
        } else if (user) {
            items.push({ href: '/organizer/apply', label: 'Become Organizer', icon: ShieldCheck });
        }

        if (isAdmin) {
            items.push({ href: '/admin', label: 'Admin', icon: ShieldCheck });
        }

        return items;
    }, [user, organizerApproved, isAdmin]);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
            <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
                <Link href="/" className="text-xl sm:text-2xl font-semibold tracking-tight whitespace-nowrap">
                    Local Pulse
                </Link>

                <NavLinks items={navItems} />

                <div className="flex items-center gap-2">
                    <SignedIn>
                        {organizerApproved ? (
                            <Button asChild className="hidden sm:inline-flex rounded-full">
                                <Link href="/events/create">
                                    <PlusCircle className="h-4 w-4 mr-2" />
                                    Create Event
                                </Link>
                            </Button>
                        ) : (
                            <Button asChild variant="outline" className="hidden sm:inline-flex rounded-full">
                                <Link href="/organizer/apply">
                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                    Organizer Apply
                                </Link>
                            </Button>
                        )}
                        <UserButton
                            afterSignOutUrl="/"
                            userProfileUrl="/profile"
                            userProfileMode="navigation"
                        />
                    </SignedIn>

                    <SignedOut>
                        <SignInButton mode="modal">
                            <Button className="rounded-full">Sign In</Button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                            <Button variant="outline" className="rounded-full hidden sm:inline-flex">Sign Up</Button>
                        </SignUpButton>
                    </SignedOut>

                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden rounded-full" aria-label="Open menu">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[86vw] max-w-sm">
                            <SheetHeader>
                                <SheetTitle>Menu</SheetTitle>
                            </SheetHeader>
                            <div className="mt-6 flex flex-col gap-2">
                                <NavLinks mobile items={navItems} />
                                <SignedIn>
                                    {organizerApproved ? (
                                        <SheetClose asChild>
                                            <Link href="/events/create" className="rounded-full px-4 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 flex items-center gap-2">
                                                <PlusCircle className="h-4 w-4" />
                                                Create Event
                                            </Link>
                                        </SheetClose>
                                    ) : (
                                        <SheetClose asChild>
                                            <Link href="/organizer/apply" className="rounded-full px-4 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 flex items-center gap-2">
                                                <ShieldCheck className="h-4 w-4" />
                                                Organizer Apply
                                            </Link>
                                        </SheetClose>
                                    )}
                                </SignedIn>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
