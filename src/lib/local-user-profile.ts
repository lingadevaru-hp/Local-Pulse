import type { UserProfile } from '@/types';

const LOCAL_USER_PROFILE_PREFIX = 'localpulse_user_profile_v1_';
export const LOCAL_USER_PROFILES_UPDATED_EVENT = 'localpulse:user-profiles-updated';

const isBrowser = () => typeof window !== 'undefined';

const profileKey = (uid: string) => `${LOCAL_USER_PROFILE_PREFIX}${uid}`;

const emit = () => {
  if (!isBrowser()) return;
  window.dispatchEvent(new window.Event(LOCAL_USER_PROFILES_UPDATED_EVENT));
};

export const getLocalUserProfile = (uid: string): UserProfile | null => {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(profileKey(uid));
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
};

export const saveLocalUserProfile = (profile: UserProfile) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(profileKey(profile.uid), JSON.stringify(profile));
  emit();
};

export const listLocalUserProfiles = (): UserProfile[] => {
  if (!isBrowser()) return [];
  const users: UserProfile[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(LOCAL_USER_PROFILE_PREFIX)) continue;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      users.push(JSON.parse(raw) as UserProfile);
    } catch {
      continue;
    }
  }
  return users;
};
