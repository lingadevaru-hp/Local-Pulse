import type { Event } from "@/types";

const pad2 = (value: number) => value.toString().padStart(2, "0");

const toIcsDateTime = (date: Date) => {
    return [
        date.getFullYear(),
        pad2(date.getMonth() + 1),
        pad2(date.getDate()),
    ].join("") + "T" + [
        pad2(date.getHours()),
        pad2(date.getMinutes()),
        pad2(date.getSeconds()),
    ].join("");
};

const parseEventDateTime = (event: Event) => {
    const [year, month, day] = event.date.split("-").map((value) => parseInt(value, 10));
    const [hours, minutes] = event.time.split(":").map((value) => parseInt(value, 10));

    const safeYear = Number.isFinite(year) ? year : new Date().getFullYear();
    const safeMonth = Number.isFinite(month) ? month - 1 : 0;
    const safeDay = Number.isFinite(day) ? day : 1;
    const safeHours = Number.isFinite(hours) ? hours : 9;
    const safeMinutes = Number.isFinite(minutes) ? minutes : 0;

    const start = new Date(safeYear, safeMonth, safeDay, safeHours, safeMinutes, 0);

    const defaultDurationHours = 2;
    const durationInMinutes = event.duration
        ? parseInt(event.duration, 10) * 60
        : defaultDurationHours * 60;
    const resolvedDuration = Number.isFinite(durationInMinutes) && durationInMinutes > 0
        ? durationInMinutes
        : defaultDurationHours * 60;

    const end = new Date(start.getTime() + resolvedDuration * 60 * 1000);
    return { start, end };
};

const escapeIcsText = (value: string) => {
    return value
        .replace(/\\/g, "\\\\")
        .replace(/,/g, "\\,")
        .replace(/;/g, "\\;")
        .replace(/\n/g, "\\n");
};

export const buildEventCalendarIcs = (event: Event) => {
    const { start, end } = parseEventDateTime(event);
    const uid = `${event.id}@localpulse.app`;
    const now = toIcsDateTime(new Date());

    const lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Local Pulse//Event Calendar//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${now}`,
        `DTSTART:${toIcsDateTime(start)}`,
        `DTEND:${toIcsDateTime(end)}`,
        `SUMMARY:${escapeIcsText(event.name)}`,
        `DESCRIPTION:${escapeIcsText(event.description)}`,
        `LOCATION:${escapeIcsText(`${event.location}, ${event.city}`)}`,
        "END:VEVENT",
        "END:VCALENDAR",
    ];

    return lines.join("\r\n");
};

export const downloadEventCalendar = (event: Event) => {
    if (typeof window === "undefined") return;

    const icsContent = buildEventCalendarIcs(event);
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${event.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "event"}.ics`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
};
