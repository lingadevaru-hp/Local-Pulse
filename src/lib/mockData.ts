import { Event } from '@/types';

export const MOCK_EVENTS: Event[] = [
    {
        id: 'local-1',
        name: 'Bengaluru AI Builders Meetup',
        description:
            'A community meetup for AI founders, developers, and students. Expect practical demos, lightning talks, and networking with local builders.',
        city: 'Bengaluru',
        date: '2026-04-18',
        time: '10:30',
        location: 'Koramangala Community Hall',
        category: 'Technology',
        imageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2000&auto=format&fit=crop',
        rating: 4.8,
        price: 'INR 299',
        type: 'local',
        status: 'approved',
        organizerName: 'Local Pulse Team',
        coordinates: { latitude: 12.9352, longitude: 77.6245 }
    },
    {
        id: 'local-2',
        name: 'Sunrise Lakeside Yoga',
        description:
            'Start your weekend with guided breathing, mobility, and mindful yoga at the lakeside. Open for all skill levels.',
        city: 'Mysuru',
        date: '2026-05-10',
        time: '06:30',
        location: 'Kukkarahalli Lake Park',
        category: 'Wellness',
        imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1840&auto=format&fit=crop',
        rating: 4.6,
        price: 'Free',
        type: 'local',
        status: 'approved',
        organizerName: 'Mysuru Wellness Circle',
        coordinates: { latitude: 12.3222, longitude: 76.6247 }
    },
    {
        id: 'local-3',
        name: 'Street Food Carnival',
        description:
            'Taste curated regional food stalls, live acoustic music, and family-friendly games in an open-air weekend carnival.',
        city: 'Mangaluru',
        date: '2026-06-07',
        time: '17:00',
        location: 'Kadri Grounds',
        category: 'Food',
        imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2000&auto=format&fit=crop',
        rating: 4.7,
        price: 'INR 150',
        type: 'local',
        status: 'approved',
        organizerName: 'Coastal Events Collective',
        coordinates: { latitude: 12.8947, longitude: 74.8560 }
    },
    {
        id: 'college-1',
        name: 'RVCE Innovation Expo',
        description:
            'Showcase day for college startups, robotics demos, and capstone projects across departments.',
        city: 'Bengaluru',
        date: '2026-08-22',
        time: '09:00',
        location: 'RV College of Engineering',
        category: 'Technology',
        imageUrl: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?q=80&w=2000&auto=format&fit=crop',
        rating: 4.9,
        price: 'Free',
        type: 'college',
        college: 'RV College of Engineering',
        status: 'approved',
        organizerName: 'RVCE Student Council',
        coordinates: { latitude: 12.9234, longitude: 77.4987 }
    },
    {
        id: 'dept-1',
        name: 'Design Sprint Workshop',
        description:
            'Hands-on sprint to prototype an app experience in one day. Includes mentoring and portfolio review.',
        city: 'Bengaluru',
        date: '2026-09-05',
        time: '14:00',
        location: 'CS Department Lab 4',
        category: 'Art',
        imageUrl: 'https://images.unsplash.com/photo-1558655146-364adaf1fcc9?q=80&w=2000&auto=format&fit=crop',
        rating: 4.4,
        price: 'INR 99',
        type: 'department',
        college: 'RV College of Engineering',
        department: 'Computer Science',
        status: 'approved',
        organizerName: 'Design Club RVCE',
        coordinates: { latitude: 12.9226, longitude: 77.4969 }
    }
];
