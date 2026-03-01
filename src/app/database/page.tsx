'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Download, RefreshCw, Trash2, Upload, Database, Clock3, Heart, Ticket } from 'lucide-react';
import AppFooter from '@/components/AppFooter';
import { useToast } from '@/hooks/use-toast';
import {
  clearLocalDatabase,
  getLocalDatabaseSnapshot,
  importLocalDatabaseSnapshot,
  LOCAL_DATABASE_UPDATED_EVENT,
  type LocalDatabaseSnapshot,
} from '@/lib/local-db';

const snapshotToFileName = () => {
  const now = new Date();
  const safeDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now
    .getDate()
    .toString()
    .padStart(2, '0')}`;
  return `local-pulse-backup-${safeDate}.json`;
};

export default function DatabasePage() {
  const [snapshot, setSnapshot] = useState<LocalDatabaseSnapshot>(getLocalDatabaseSnapshot());
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const syncSnapshot = () => setSnapshot(getLocalDatabaseSnapshot());
    syncSnapshot();
    window.addEventListener(LOCAL_DATABASE_UPDATED_EVENT, syncSnapshot);
    window.addEventListener('storage', syncSnapshot);
    return () => {
      window.removeEventListener(LOCAL_DATABASE_UPDATED_EVENT, syncSnapshot);
      window.removeEventListener('storage', syncSnapshot);
    };
  }, []);

  const stats = useMemo(
    () => [
      { label: 'Events', value: snapshot.events.length, icon: Database },
      { label: 'Registrations', value: snapshot.registrations.length, icon: Ticket },
      { label: 'Favorites', value: snapshot.favoriteEventIds.length, icon: Heart },
      { label: 'Recently Viewed', value: snapshot.recentlyViewed.length, icon: Clock3 },
    ],
    [snapshot]
  );

  const handleExport = () => {
    const data = JSON.stringify(getLocalDatabaseSnapshot(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = snapshotToFileName();
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Backup exported',
      description: 'Your local database backup JSON was downloaded.',
    });
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const result = importLocalDatabaseSnapshot(parsed);
      setSnapshot(getLocalDatabaseSnapshot());
      toast({
        title: 'Backup imported',
        description: `Events: ${result.events}, registrations: ${result.registrations}, favorites: ${result.favorites}.`,
      });
    } catch (error) {
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Invalid backup file.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const handleClear = () => {
    const ok = window.confirm(
      'This will clear local events, registrations, favorites, and recent history on this browser. Continue?'
    );
    if (!ok) return;

    clearLocalDatabase();
    setSnapshot(getLocalDatabaseSnapshot());
    toast({
      title: 'Local database cleared',
      description: 'All browser-stored data has been removed.',
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow container mx-auto px-4 py-10 space-y-6">
        <header className="space-y-2">
          <Badge variant="outline" className="rounded-full px-3 py-1 border-primary/30 text-primary">
            Local Device Database
          </Badge>
          <h1 className="text-3xl font-bold">Data Hub</h1>
          <p className="text-muted-foreground max-w-2xl">
            Manage browser-stored data for this app. Export/import backups, inspect totals, and reset data when needed.
          </p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((item) => (
            <Card key={item.label} className="glass-effect">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 text-primary" />
                  {item.label}
                </CardDescription>
                <CardTitle className="text-2xl">{item.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </section>

        <Card className="glass-effect">
          <CardHeader>
            <CardTitle>Backup And Restore</CardTitle>
            <CardDescription>
              Use JSON backups to move local data between browsers/devices.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button onClick={() => setSnapshot(getLocalDatabaseSnapshot())} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Backup
            </Button>
            <Button onClick={handleImportClick} disabled={isImporting}>
              <Upload className="h-4 w-4 mr-2" />
              {isImporting ? 'Importing...' : 'Import Backup'}
            </Button>
            <Button onClick={handleClear} variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Database
            </Button>
            <Input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImport}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recently Created Events</CardTitle>
            <CardDescription>Latest events stored locally on this browser.</CardDescription>
          </CardHeader>
          <CardContent>
            {snapshot.events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No local events yet.</p>
            ) : (
              <div className="space-y-2">
                {snapshot.events.slice(-5).reverse().map((event) => (
                  <div
                    key={event.id}
                    className="rounded-lg border border-border/50 px-3 py-2 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="font-medium">{event.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.city} - {new Date(event.date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary">{event.category}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}
