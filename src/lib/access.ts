import type { UserProfile } from '@/types';

const DEFAULT_ADMIN_EMAILS = [
  'contact@lingadevaru.in',
  'akshaysarun30@gmail.com',
  'hpthoshan@gmail.com',
];

export const getAdminEmails = () => {
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
  const fromEnv = raw
    ? raw
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    : [];
  return Array.from(new Set([...DEFAULT_ADMIN_EMAILS, ...fromEnv]));
};

export const isAdminEmail = (email?: string | null) => {
  if (!email) return false;
  return getAdminEmails().includes(email.trim().toLowerCase());
};

export const isOrganizerApproved = (profile?: UserProfile | null) => {
  if (!profile) return false;
  if (profile.role === 'admin') return true;
  return profile.role === 'organizer' && (profile.organizerStatus ?? 'none') === 'approved';
};
