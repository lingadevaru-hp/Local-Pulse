
'use client';

import type { FC } from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import EventCard from './EventCard';
import type { Event } from '@/types';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from './ui/button';
import { MapPin, WifiOff } from 'lucide-react';

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { MOCK_EVENTS } from '@/lib/mockData';

interface NearbyEventsSectionProps {
  onEventClick: (eventId: string) => void;
}

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

const NearbyEventsSection: FC<NearbyEventsSectionProps> = ({ onEventClick }) => {
  const { profile } = useAuth();
  const [locationState, setLocationState] = useState<'prompt' | 'detecting' | 'detected' | 'denied' | 'error' | 'notsupported'>('prompt');
  const [nearbyEvents, setNearbyEvents] = useState<Event[]>([]);
  const [isFallback, setIsFallback] = useState(false);
  const isDetectingRef = useRef(false);

  const fetchNearbyEvents = async (latitude: number, longitude: number) => {
    let timeoutFinished = false;
    const timeoutId = setTimeout(() => {
      // Check ref instead of state to avoid stale closure
      if (nearbyEvents.length === 0 && isDetectingRef.current) {
        console.warn("Nearby events fetch timed out, using mock data");
        const nearbyMock = MOCK_EVENTS.filter(event => {
          if (event.type === 'college' && (!profile || profile.college !== event.college)) return false;
          if (event.type === 'department' && (!profile || profile.college !== event.college || profile.department !== event.department)) return false;
          if (event.coordinates) {
            const dist = getDistance(latitude, longitude, event.coordinates.latitude, event.coordinates.longitude);
            return dist < 50;
          }
          return false;
        });

        if (nearbyMock.length > 0) {
          setNearbyEvents(nearbyMock);
          setIsFallback(false);
        } else {
          // Fallback to MOCK_EVENTS (filtered by access control)
          setNearbyEvents(MOCK_EVENTS.filter(event => {
            if (event.type === 'college' && (!profile || profile.college !== event.college)) return false;
            if (event.type === 'department' && (!profile || profile.college !== event.college || profile.department !== event.department)) return false;
            return true;
          }));
          setIsFallback(true);
        }
        setLocationState('detected');
        isDetectingRef.current = false;
        timeoutFinished = true;
      }
    }, 3000);

    try {
      const q = query(
        collection(db, "events"),
        where("status", "==", "approved")
      );

      const snapshot = await getDocs(q);
      if (timeoutFinished) return;
      clearTimeout(timeoutId);

      let allEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));

      if (allEvents.length === 0) {
        allEvents = MOCK_EVENTS;
      }

      // Filter by Distance (< 50km) and Access Control
      const nearby = allEvents.filter(event => {
        // Access Control
        if (event.type === 'college' && (!profile || profile.college !== event.college)) return false;
        if (event.type === 'department' && (!profile || profile.college !== event.college || profile.department !== event.department)) return false;

        if (event.coordinates) {
          const dist = getDistance(latitude, longitude, event.coordinates.latitude, event.coordinates.longitude);
          return dist < 50; // Show events within 50km
        }
        return false;
      });

      if (nearby.length > 0) {
        setNearbyEvents(nearby);
        setIsFallback(false);
      } else {
        // Fallback to MOCK_EVENTS (filtered by access control)
        setNearbyEvents(MOCK_EVENTS.filter(event => {
          if (event.type === 'college' && (!profile || profile.college !== event.college)) return false;
          if (event.type === 'department' && (!profile || profile.college !== event.college || profile.department !== event.department)) return false;
          return true;
        }));
        setIsFallback(true);
      }
      setLocationState('detected');
    } catch (error) {
      if (timeoutFinished) return;
      clearTimeout(timeoutId);
      console.error("Error fetching nearby events, using mock data:", error);
      const nearbyMock = MOCK_EVENTS.filter(event => {
        if (event.type === 'college' && (!profile || profile.college !== event.college)) return false;
        if (event.type === 'department' && (!profile || profile.college !== event.college || profile.department !== event.department)) return false;
        if (event.coordinates) {
          const dist = getDistance(latitude, longitude, event.coordinates.latitude, event.coordinates.longitude);
          return dist < 50;
        }
        return false;
      });
      if (nearbyMock.length > 0) {
        setNearbyEvents(nearbyMock);
        setIsFallback(false);
      } else {
        // Fallback to MOCK_EVENTS (filtered by access control)
        setNearbyEvents(MOCK_EVENTS.filter(event => {
          if (event.type === 'college' && (!profile || profile.college !== event.college)) return false;
          if (event.type === 'department' && (!profile || profile.college !== event.college || profile.department !== event.department)) return false;
          return true;
        }));
        setIsFallback(true);
      }
      setLocationState('detected');
      isDetectingRef.current = false;
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationState('notsupported');
      return;
    }
    setLocationState('detecting');
    isDetectingRef.current = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchNearbyEvents(latitude, longitude);
      },
      (err) => {
        console.error("Error getting location, using default:", err);
        // Fallback to Bengaluru center if geolocation fails
        fetchNearbyEvents(12.9716, 77.5946);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation && typeof navigator.permissions?.query === 'function') {
      navigator.permissions.query({ name: 'geolocation' }).then(permissionStatus => {
        if (permissionStatus.state === 'granted') {
          handleDetectLocation();
        } else if (permissionStatus.state === 'denied') {
          setLocationState('denied');
        }
      });
    } else if (typeof window !== 'undefined' && !navigator.geolocation) {
      setLocationState('notsupported');
    }
  }, []);


  const renderContent = () => {
    switch (locationState) {
      case 'prompt':
        return (
          <div className="text-center glass-effect rounded-2xl p-6">
            <p className="text-muted-foreground mb-3">Enable location to discover events near you!</p>
            <Button
              onClick={handleDetectLocation}
              aria-label="Enable location to find nearby events"
              className="rounded-full"
            >
              <MapPin className="mr-2 h-4 w-4" /> Enable Location
            </Button>
          </div>
        );
      case 'detecting':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="rounded-2xl border border-border/30 bg-card/50 dark:bg-zinc-800/50 backdrop-blur-sm shadow-lg overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-3"><Skeleton className="h-6 w-3/4 rounded" /><Skeleton className="h-4 w-full rounded" /></div>
              </div>
            ))}
          </div>
        );
      case 'denied':
        return (
          <div className="text-center glass-effect rounded-2xl p-6">
            <WifiOff className="h-12 w-12 text-destructive mx-auto mb-3" />
            <p className="text-destructive-foreground mb-2">Location access denied.</p>
            <p className="text-sm text-muted-foreground">Please enable location permissions in your browser settings to see nearby events.</p>
          </div>
        );
      case 'error':
      case 'notsupported':
        return (
          <div className="text-center glass-effect rounded-2xl p-6 border-2 border-dashed border-destructive/20">
            <WifiOff className="h-12 w-12 text-destructive mx-auto mb-3 opacity-50" />
            <p className="text-destructive font-medium mb-1">
              {locationState === 'notsupported' ? 'Location Not Supported' : 'Location / Data Error'}
            </p>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
              {locationState === 'notsupported'
                ? 'Geolocation is not supported by your browser.'
                : 'There was an error determining your location or fetching events. Please check your connection and Firebase configuration.'}
            </p>
            {locationState !== 'notsupported' && (
              <Button onClick={handleDetectLocation} variant="outline" size="sm" className="rounded-full">
                Try Again
              </Button>
            )}
          </div>
        );
      case 'detected':
        if (nearbyEvents.length === 0 && !isFallback) {
          return <p className="text-center text-muted-foreground">No nearby events found for your location.</p>;
        }
        return (
          <div className="space-y-4">
            {isFallback && (
              <div className="p-3 bg-muted/50 border border-border rounded-lg text-sm text-center">
                <span className="font-medium text-foreground">Location Demo:</span> No events found in your immediate vicinity. Showing popular events in Bengaluru.
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {nearbyEvents.map(event => <EventCard key={event.id} event={event} onClick={onEventClick} />)}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section aria-labelledby="nearby-events-heading" className="mb-6 md:mb-8">
      <h2 id="nearby-events-heading" className="text-xl font-semibold mb-4">
        Nearby Events
      </h2>
      {renderContent()}
    </section>
  );
};

export default NearbyEventsSection;
