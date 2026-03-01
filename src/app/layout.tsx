import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import ThemeProvider from '@/components/ThemeProvider';
import AppHeader from '@/components/AppHeader';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import EventReminderManager from '@/components/EventReminderManager';
import { AuthProvider } from '@/context/AuthContext';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import PwaInstallPrompt from '@/components/PwaInstallPrompt';


export const metadata: Metadata = {
  title: 'Local Pulse',
  description: 'Discover, create, and manage local events with Local Pulse',
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/icon.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/apple-icon.png', sizes: '192x192', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Local Pulse',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'hsl(var(--background))' },
    { media: '(prefers-color-scheme: dark)', color: 'hsl(var(--background))' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <GoogleAnalytics />
      </head>
      <body className="font-sans antialiased bg-background text-foreground" suppressHydrationWarning>
        <ClerkProvider>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <div className="min-h-screen flex flex-col">
                <AppHeader />
                <main className="flex-grow pt-20">
                  {children}
                </main>
              </div>
              <Toaster />
              <ServiceWorkerRegistration />
              <PwaInstallPrompt />
              <EventReminderManager />
            </ThemeProvider>
          </AuthProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
