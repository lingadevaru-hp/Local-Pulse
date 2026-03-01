'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { MapPin, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { createLocalEvent } from '@/lib/local-db';
import type { EventType } from '@/types';

export default function CreateEventPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mapQuery, setMapQuery] = useState('Bengaluru');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    time: '',
    location: '',
    city: '',
    price: 'Free',
    category: 'Other',
    type: 'local' as EventType,
    college: '',
    department: '',
  });

  useEffect(() => {
    if (coords) {
      setMapQuery(`${coords.lat},${coords.lng}`);
    } else if (formData.location && formData.location.length > 3) {
      const timer = setTimeout(() => {
        setMapQuery(`${formData.location}, ${formData.city}`);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [coords, formData.location, formData.city]);

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Access Denied",
        description: "Please sign in to submit event requests.",
        variant: "destructive",
      });
      router.push('/');
    }
  }, [user, authLoading, router, toast]);

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          toast({ title: "Location Detected", description: "GPS coordinates captured successfully." });
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast({
            title: "Detection Failed",
            description: "Could not get your location. Please check permissions.",
            variant: "destructive"
          });
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      toast({
        title: "Not Supported",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const createdEvent = createLocalEvent({
        ...formData,
        price: formData.price || 'Free',
        organizerId: user.uid,
        organizerName: profile?.displayName || user.displayName || 'Organizer',
        imageGallery: [],
        imageUrl: 'https://images.unsplash.com/photo-1540575861501-7ad05823c28b?q=80&w=2070&auto=format&fit=crop',
        coordinates: coords ? { latitude: coords.lat, longitude: coords.lng } : undefined,
        status: 'approved',
      });

      toast({
        title: "Event Published",
        description: "Your event was saved locally and is now visible in the app.",
      });
      router.push(`/events/${createdEvent.id}`);
    } catch (error) {
      console.error("Error submitting request:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error saving your event locally.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card className="glass-effect shadow-2xl border-border/50">
        <CardHeader>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Submit Event Request
          </CardTitle>
          <CardDescription>
            Submit your event for approval. Once approved, it will be visible on the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Event Name</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Annual Tech Symposium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select onValueChange={v => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Cultural">Cultural</SelectItem>
                    <SelectItem value="Workshop">Workshop</SelectItem>
                    <SelectItem value="Sports">Sports</SelectItem>
                    <SelectItem value="Community">Community</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                required
                className="min-h-[120px]"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell us more about the event..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  required
                  value={formData.time}
                  onChange={e => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Event Level</Label>
                <Select onValueChange={v => setFormData({ ...formData, type: v as EventType })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Access level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local (Open to all)</SelectItem>
                    <SelectItem value="college">College Restricted</SelectItem>
                    <SelectItem value="department">Department Restricted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(formData.type === 'college' || formData.type === 'department') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4">
                <div className="space-y-2">
                  <Label htmlFor="college">College Name</Label>
                  <Input
                    id="college"
                    required
                    value={formData.college}
                    onChange={e => setFormData({ ...formData, college: e.target.value })}
                    placeholder="e.g. RV College of Engineering"
                  />
                </div>
                {formData.type === 'department' && (
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      required
                      value={formData.department}
                      onChange={e => setFormData({ ...formData, department: e.target.value })}
                      placeholder="e.g. Computer Science"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  required
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Mumbai, Delhi, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Venue & Street</Label>
                <div className="flex gap-2">
                  <Input
                    id="location"
                    required
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Gateway of India, BKC"
                    className="flex-grow"
                  />
                  <Button type="button" variant="outline" onClick={detectLocation} title="Get current GPS">
                    <MapPin className="h-4 w-4 mr-2" /> Detect
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Ticket Price</Label>
              <Input
                id="price"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                placeholder="Free or ₹299"
              />
            </div>
            {coords && (
              <p className="text-xs text-muted-foreground">Coordinates: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</p>
            )}

            {/* Map Preview */}
            <div className="w-full h-64 rounded-xl overflow-hidden border-2 border-border/50 relative group bg-muted/30">
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                className="opacity-90 group-hover:opacity-100 transition-opacity"
              ></iframe>
              {!mapQuery && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/80 text-muted-foreground">
                  <MapPin className="h-8 w-8 mr-2 animate-bounce" />
                  <span>Enter a location to see map</span>
                </div>
              )}
              <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider text-muted-foreground shadow-sm">
                Live Preview
              </div>
            </div>


            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" asChild disabled={loading}>
                <Link href="/">Cancel</Link>
              </Button>
              <Button type="submit" className="min-w-[120px]" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Submit Request
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div >
  );
}
