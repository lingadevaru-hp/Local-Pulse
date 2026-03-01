import { jsPDF } from 'jspdf';

export interface TicketDownloadPayload {
  bookingId: string;
  eventName: string;
  eventDate?: string;
  eventLocation?: string;
  fullName: string;
  email?: string;
  phone?: string;
  attendees: string;
  amount: string;
  bookedAt: string;
}

const slugify = (value: string) => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const getTicketFileName = (eventName: string, bookingId: string) => {
  const nameSlug = slugify(eventName) || 'event';
  const idChunk = bookingId.slice(0, 8);
  return `local-pulse-ticket-${nameSlug}-${idChunk}.pdf`;
};

const formatDate = (value?: string) => {
  if (!value) return 'TBD';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const downloadTicketPdf = (payload: TicketDownloadPayload) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const left = 56;
  let y = 68;

  doc.setFillColor(14, 116, 144);
  doc.rect(0, 0, 595, 110, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('Local Pulse Ticket', left, 68);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Booking ID: ${payload.bookingId}`, left, 92);

  y = 148;
  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(payload.eventName, left, y);

  y += 28;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(`Event Date: ${formatDate(payload.eventDate)}`, left, y);
  y += 22;
  doc.text(`Venue: ${payload.eventLocation || 'TBD'}`, left, y);
  y += 22;
  doc.text(`Booked By: ${payload.fullName}`, left, y);
  y += 22;
  doc.text(`Email: ${payload.email || 'N/A'}`, left, y);
  y += 22;
  doc.text(`Phone: ${payload.phone || 'N/A'}`, left, y);
  y += 22;
  doc.text(`Attendees: ${payload.attendees}`, left, y);
  y += 22;
  doc.text(`Amount Paid: ${payload.amount || 'Free'}`, left, y);
  y += 22;
  doc.text(`Booked At: ${formatDate(payload.bookedAt)}`, left, y);

  y += 36;
  doc.setDrawColor(225, 225, 225);
  doc.line(left, y, 540, y);
  y += 28;
  doc.setFontSize(11);
  doc.setTextColor(90, 90, 90);
  doc.text(
    'This ticket was generated digitally by Local Pulse. Please carry a valid government ID for venue verification.',
    left,
    y,
    { maxWidth: 480 }
  );

  doc.save(getTicketFileName(payload.eventName, payload.bookingId));
};
