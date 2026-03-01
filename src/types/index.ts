
export interface Comment {
  id: string;
  userName: string;
  userImage?: string;
  rating: number;
  text: string;
  date: string; // ISO date string
}

export type EventType = 'local' | 'college' | 'department';

export interface Event {
  id: string;
  name: string;
  description: string;
  city: string;
  date: string;
  time: string;
  location: string;
  locationAddress?: string;
  category: string;
  imageUrl?: string;
  imageGallery?: string[];
  rating?: number;
  organizer?: string;
  organizerName?: string;
  organizerId?: string;
  price?: string;
  ageGroup?: string;
  mapUrl?: string;
  registrationLink?: string;
  comments?: Comment[];
  duration?: string;
  accessibilityInfo?: string;
  contactEmail?: string;
  type: EventType;
  college?: string;
  department?: string;
  status?: 'pending' | 'approved' | 'rejected';
  coordinates?: { latitude: number; longitude: number };
}

export interface City {
  id: string;
  name: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'user' | 'organizer' | 'admin';
  userType: 'public' | 'student' | 'faculty';
  college?: string;
  department?: string;
  bio?: string;
  interests?: string;
  updatedAt?: string;
  organizerRequestedAt?: string;
}
