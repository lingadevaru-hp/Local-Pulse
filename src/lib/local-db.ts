import type { Event as LocalEvent } from "@/types";

export const LOCAL_EVENTS_KEY = "localpulse_events_v1";
export const LOCAL_REGISTRATIONS_KEY = "localpulse_registrations_v1";
export const LOCAL_FAVORITES_KEY = "localpulse_favorite_event_ids_v1";
export const LOCAL_RECENTLY_VIEWED_KEY = "localpulse_recently_viewed_v1";
const LEGACY_REGISTRATIONS_KEY = "localpulse_registrations";
const LEGACY_NOTIFICATIONS_KEY = "event_registrations";

export const LOCAL_DB_VERSION = 1;

export const LOCAL_EVENTS_UPDATED_EVENT = "localpulse:events-updated";
export const LOCAL_REGISTRATIONS_UPDATED_EVENT = "localpulse:registrations-updated";
export const LOCAL_FAVORITES_UPDATED_EVENT = "localpulse:favorites-updated";
export const LOCAL_RECENTLY_VIEWED_UPDATED_EVENT = "localpulse:recently-viewed-updated";
export const LOCAL_DATABASE_UPDATED_EVENT = "localpulse:database-updated";

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

export interface RecentlyViewedEvent {
    eventId: string;
    viewedAt: string;
}

export interface LocalDatabaseSnapshot {
    version: number;
    exportedAt: string;
    events: LocalEvent[];
    registrations: LocalRegistration[];
    favoriteEventIds: string[];
    recentlyViewed: RecentlyViewedEvent[];
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
    window.dispatchEvent(new window.Event(eventName));
};

const emitDatabaseUpdated = () => emit(LOCAL_DATABASE_UPDATED_EVENT);

const normalizeDate = (value?: string) => {
    if (!value) return new Date("2100-01-01").getTime();
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? new Date("2100-01-01").getTime() : time;
};

const asObject = (value: unknown): Record<string, unknown> | null => {
    if (!value || typeof value !== "object") return null;
    return value as Record<string, unknown>;
};

const isString = (value: unknown): value is string => typeof value === "string";

const sanitizeEvent = (value: unknown): LocalEvent | null => {
    const record = asObject(value);
    if (!record) return null;

    const requiredKeys: Array<keyof LocalEvent> = [
        "id",
        "name",
        "description",
        "city",
        "date",
        "time",
        "location",
        "category",
        "type",
    ];

    const hasAllRequired = requiredKeys.every((key) => isString(record[key]));
    if (!hasAllRequired) return null;

    return record as unknown as LocalEvent;
};

const sanitizeRegistration = (value: unknown): LocalRegistration | null => {
    const record = asObject(value);
    if (!record) return null;

    const requiredStringFields = [
        "bookingId",
        "eventId",
        "eventName",
        "fullName",
        "email",
        "phone",
        "attendees",
        "status",
        "amount",
        "registeredAt",
    ];

    if (!requiredStringFields.every((field) => isString(record[field]))) {
        return null;
    }

    return record as unknown as LocalRegistration;
};

const sanitizeRecentlyViewed = (value: unknown): RecentlyViewedEvent | null => {
    const record = asObject(value);
    if (!record) return null;
    if (!isString(record.eventId) || !isString(record.viewedAt)) return null;
    return { eventId: record.eventId, viewedAt: record.viewedAt };
};

const uniqueRecentlyViewed = (entries: RecentlyViewedEvent[]): RecentlyViewedEvent[] => {
    const deduped = new Map<string, RecentlyViewedEvent>();

    const sorted = [...entries].sort(
        (a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()
    );

    for (const entry of sorted) {
        if (!deduped.has(entry.eventId)) {
            deduped.set(entry.eventId, entry);
        }
    }

    return Array.from(deduped.values());
};

export const getLocalEvents = (): LocalEvent[] => {
    return readJson<LocalEvent[]>(LOCAL_EVENTS_KEY, []).map(sanitizeEvent).filter(Boolean) as LocalEvent[];
};

export const getMergedEvents = (baseEvents: LocalEvent[]): LocalEvent[] => {
    const merged = new Map<string, LocalEvent>();
    for (const event of baseEvents) merged.set(event.id, event);
    for (const event of getLocalEvents()) merged.set(event.id, event);
    return Array.from(merged.values()).sort((a, b) => normalizeDate(a.date) - normalizeDate(b.date));
};

export const upsertLocalEvent = (event: LocalEvent): LocalEvent => {
    const existing = getLocalEvents();
    const next = existing.filter((item) => item.id !== event.id);
    next.push(event);
    writeJson(LOCAL_EVENTS_KEY, next);
    emit(LOCAL_EVENTS_UPDATED_EVENT);
    emitDatabaseUpdated();
    return event;
};

export const createLocalEvent = (eventInput: Omit<LocalEvent, "id">): LocalEvent => {
    const created: LocalEvent = {
        ...eventInput,
        id: `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    };

    return upsertLocalEvent(created);
};

export const getLocalEventById = (eventId: string): LocalEvent | null => {
    return getLocalEvents().find((event) => event.id === eventId) ?? null;
};

const readRegistrations = (): LocalRegistration[] => {
    const primary = readJson<LocalRegistration[]>(LOCAL_REGISTRATIONS_KEY, [])
        .map(sanitizeRegistration)
        .filter(Boolean) as LocalRegistration[];
    if (primary.length > 0) return primary;

    const legacy = readJson<LocalRegistration[]>(LEGACY_REGISTRATIONS_KEY, [])
        .map(sanitizeRegistration)
        .filter(Boolean) as LocalRegistration[];
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
    emitDatabaseUpdated();
};

const readFavoriteEventIds = (): string[] => {
    const favorites = readJson<string[]>(LOCAL_FAVORITES_KEY, []);
    return Array.from(new Set(favorites.filter(isString)));
};

const writeFavoriteEventIds = (favoriteIds: string[]) => {
    writeJson(LOCAL_FAVORITES_KEY, Array.from(new Set(favoriteIds)));
    emit(LOCAL_FAVORITES_UPDATED_EVENT);
    emitDatabaseUpdated();
};

export const getFavoriteEventIds = (): string[] => readFavoriteEventIds();

export const isFavoriteEvent = (eventId: string): boolean => {
    return readFavoriteEventIds().includes(eventId);
};

export const setFavoriteEvent = (eventId: string, isFavorite: boolean): boolean => {
    const current = new Set(readFavoriteEventIds());
    if (isFavorite) {
        current.add(eventId);
    } else {
        current.delete(eventId);
    }

    writeFavoriteEventIds(Array.from(current));
    return current.has(eventId);
};

export const toggleFavoriteEvent = (eventId: string): boolean => {
    const willBeFavorite = !isFavoriteEvent(eventId);
    return setFavoriteEvent(eventId, willBeFavorite);
};

const readRecentlyViewed = (): RecentlyViewedEvent[] => {
    const raw = readJson<RecentlyViewedEvent[]>(LOCAL_RECENTLY_VIEWED_KEY, []);
    const sanitized = raw.map(sanitizeRecentlyViewed).filter(Boolean) as RecentlyViewedEvent[];
    return uniqueRecentlyViewed(sanitized);
};

const writeRecentlyViewed = (entries: RecentlyViewedEvent[]) => {
    writeJson(LOCAL_RECENTLY_VIEWED_KEY, uniqueRecentlyViewed(entries));
    emit(LOCAL_RECENTLY_VIEWED_UPDATED_EVENT);
    emitDatabaseUpdated();
};

export const getRecentlyViewedEvents = (limit = 12): RecentlyViewedEvent[] => {
    return readRecentlyViewed().slice(0, limit);
};

export const trackRecentlyViewedEvent = (eventId: string) => {
    const next = [{ eventId, viewedAt: new Date().toISOString() }, ...readRecentlyViewed()].slice(0, 40);
    writeRecentlyViewed(next);
};

export const clearRecentlyViewedEvents = () => {
    writeRecentlyViewed([]);
};

export const getLocalDatabaseSnapshot = (): LocalDatabaseSnapshot => {
    return {
        version: LOCAL_DB_VERSION,
        exportedAt: new Date().toISOString(),
        events: getLocalEvents(),
        registrations: getLocalRegistrations(),
        favoriteEventIds: getFavoriteEventIds(),
        recentlyViewed: getRecentlyViewedEvents(40),
    };
};

export const importLocalDatabaseSnapshot = (input: unknown) => {
    const record = asObject(input);
    if (!record) {
        throw new Error("Invalid backup format.");
    }

    const events = Array.isArray(record.events)
        ? (record.events.map(sanitizeEvent).filter(Boolean) as LocalEvent[])
        : [];
    const registrations = Array.isArray(record.registrations)
        ? (record.registrations.map(sanitizeRegistration).filter(Boolean) as LocalRegistration[])
        : [];
    const favoriteEventIds = Array.isArray(record.favoriteEventIds)
        ? Array.from(new Set(record.favoriteEventIds.filter(isString)))
        : [];
    const recentlyViewed = Array.isArray(record.recentlyViewed)
        ? (record.recentlyViewed.map(sanitizeRecentlyViewed).filter(Boolean) as RecentlyViewedEvent[])
        : [];

    writeJson(LOCAL_EVENTS_KEY, events);
    writeJson(LOCAL_REGISTRATIONS_KEY, registrations);
    writeJson(LEGACY_REGISTRATIONS_KEY, registrations);
    writeJson(LEGACY_NOTIFICATIONS_KEY, registrations);
    writeJson(LOCAL_FAVORITES_KEY, favoriteEventIds);
    writeJson(LOCAL_RECENTLY_VIEWED_KEY, uniqueRecentlyViewed(recentlyViewed));

    emit(LOCAL_EVENTS_UPDATED_EVENT);
    emit(LOCAL_REGISTRATIONS_UPDATED_EVENT);
    emit(LOCAL_FAVORITES_UPDATED_EVENT);
    emit(LOCAL_RECENTLY_VIEWED_UPDATED_EVENT);
    emitDatabaseUpdated();

    return {
        events: events.length,
        registrations: registrations.length,
        favorites: favoriteEventIds.length,
        recentlyViewed: recentlyViewed.length,
    };
};

export const clearLocalDatabase = () => {
    if (!isBrowser()) return;

    window.localStorage.removeItem(LOCAL_EVENTS_KEY);
    window.localStorage.removeItem(LOCAL_REGISTRATIONS_KEY);
    window.localStorage.removeItem(LEGACY_REGISTRATIONS_KEY);
    window.localStorage.removeItem(LEGACY_NOTIFICATIONS_KEY);
    window.localStorage.removeItem(LOCAL_FAVORITES_KEY);
    window.localStorage.removeItem(LOCAL_RECENTLY_VIEWED_KEY);

    emit(LOCAL_EVENTS_UPDATED_EVENT);
    emit(LOCAL_REGISTRATIONS_UPDATED_EVENT);
    emit(LOCAL_FAVORITES_UPDATED_EVENT);
    emit(LOCAL_RECENTLY_VIEWED_UPDATED_EVENT);
    emitDatabaseUpdated();
};
