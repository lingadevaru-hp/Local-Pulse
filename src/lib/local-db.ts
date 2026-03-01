import type { Event } from "@/types";

const LOCAL_EVENTS_KEY = "localpulse_events_v1";
const LOCAL_REGISTRATIONS_KEY = "localpulse_registrations_v1";
const LEGACY_REGISTRATIONS_KEY = "localpulse_registrations";
const LEGACY_NOTIFICATIONS_KEY = "event_registrations";

export const LOCAL_EVENTS_UPDATED_EVENT = "localpulse:events-updated";
export const LOCAL_REGISTRATIONS_UPDATED_EVENT = "localpulse:registrations-updated";

export interface LocalRegistration {
    bookingId: string;
    userId?: string;
    eventId: string;
    eventName: string;
    eventDate?: string;
    eventLocation?: string;
    fullName: string;
    email: string;
    phone: string;
    attendees: string;
    specialRequirements?: string;
    status: string;
    amount: string;
    remindersEnabled?: boolean;
    registeredAt: string;
}

const isBrowser = () => typeof window !== "undefined";

const readJson = <T>(key: string, fallback: T): T => {
    if (!isBrowser()) return fallback;

    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
};

const writeJson = <T>(key: string, value: T) => {
    if (!isBrowser()) return;
    window.localStorage.setItem(key, JSON.stringify(value));
};

const emit = (eventName: string) => {
    if (!isBrowser()) return;
    window.dispatchEvent(new Event(eventName));
};

const normalizeDate = (value?: string) => {
    if (!value) return new Date("2100-01-01").getTime();
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? new Date("2100-01-01").getTime() : time;
};

export const getLocalEvents = (): Event[] => {
    return readJson<Event[]>(LOCAL_EVENTS_KEY, []);
};

export const getMergedEvents = (baseEvents: Event[]): Event[] => {
    const merged = new Map<string, Event>();
    for (const event of baseEvents) merged.set(event.id, event);
    for (const event of getLocalEvents()) merged.set(event.id, event);
    return Array.from(merged.values()).sort((a, b) => normalizeDate(a.date) - normalizeDate(b.date));
};

export const upsertLocalEvent = (event: Event): Event => {
    const existing = getLocalEvents();
    const next = existing.filter((item) => item.id !== event.id);
    next.push(event);
    writeJson(LOCAL_EVENTS_KEY, next);
    emit(LOCAL_EVENTS_UPDATED_EVENT);
    return event;
};

export const createLocalEvent = (eventInput: Omit<Event, "id">): Event => {
    const created: Event = {
        ...eventInput,
        id: `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    };

    return upsertLocalEvent(created);
};

export const getLocalEventById = (eventId: string): Event | null => {
    return getLocalEvents().find((event) => event.id === eventId) ?? null;
};

const readRegistrations = (): LocalRegistration[] => {
    const primary = readJson<LocalRegistration[]>(LOCAL_REGISTRATIONS_KEY, []);
    if (primary.length > 0) return primary;

    const legacy = readJson<LocalRegistration[]>(LEGACY_REGISTRATIONS_KEY, []);
    if (legacy.length > 0) {
        writeJson(LOCAL_REGISTRATIONS_KEY, legacy);
        return legacy;
    }

    return [];
};

export const getLocalRegistrations = (): LocalRegistration[] => {
    return readRegistrations().sort(
        (a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
    );
};

export const saveLocalRegistration = (registration: LocalRegistration) => {
    const current = readRegistrations().filter((item) => item.bookingId !== registration.bookingId);
    const next = [...current, registration];

    writeJson(LOCAL_REGISTRATIONS_KEY, next);
    writeJson(LEGACY_REGISTRATIONS_KEY, next);
    writeJson(LEGACY_NOTIFICATIONS_KEY, next);
    emit(LOCAL_REGISTRATIONS_UPDATED_EVENT);
};

