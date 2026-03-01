'use client';

import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Download, Calendar, MapPin, User, Ticket as TicketIcon } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface TicketProps {
    bookingId: string;
    eventName: string;
    eventDate: string;
    eventLocation: string;
    attendeeName: string;
    attendees: number;
    amount: string;
}

export default function Ticket({
    bookingId,
    eventName,
    eventDate,
    eventLocation,
    attendeeName,
    attendees,
    amount,
}: TicketProps) {
    const ticketRef = useRef<HTMLDivElement>(null);

    const downloadTicket = async () => {
        if (!ticketRef.current) return;

        try {
            const canvas = await html2canvas(ticketRef.current, {
                scale: 2,
                backgroundColor: null,
                useCORS: true,
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width / 2, canvas.height / 2],
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
            pdf.save(`Ticket-${eventName.replace(/\s+/g, '-')}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to download ticket. Please try again.');
        }
    };

    return (
        <div className="flex flex-col items-center">
            <div
                ref={ticketRef}
                className="w-full max-w-sm bg-card border-2 border-dashed border-primary/30 rounded-3xl overflow-hidden shadow-2xl relative"
            >
                {/* Decorative cutouts */}
                <div className="absolute top-1/2 -left-3 w-6 h-6 bg-background rounded-full border-r-2 border-primary/30 -translate-y-1/2 z-10" />
                <div className="absolute top-1/2 -right-3 w-6 h-6 bg-background rounded-full border-l-2 border-primary/30 -translate-y-1/2 z-10" />

                {/* Header */}
                <div className="bg-primary/10 p-6 flex flex-col items-center border-b-2 border-dashed border-primary/20">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-3">
                        <TicketIcon className="text-primary-foreground w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-center">{eventName}</h3>
                    <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">Entry Ticket</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4 bg-white/50 dark:bg-zinc-900/50">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Date</p>
                            <div className="flex items-center text-sm font-medium">
                                <Calendar className="w-3 h-3 mr-1.5 text-primary" />
                                {new Date(eventDate).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Attendees</p>
                            <div className="flex items-center text-sm font-medium">
                                <User className="w-3 h-3 mr-1.5 text-primary" />
                                {attendees} {attendees > 1 ? 'People' : 'Person'}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Location</p>
                        <div className="flex items-center text-sm font-medium">
                            <MapPin className="w-3 h-3 mr-1.5 text-primary" />
                            {eventLocation}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Booked By</p>
                        <p className="text-sm font-semibold">{attendeeName}</p>
                    </div>

                    <hr className="border-t border-muted-foreground/10 my-2" />

                    <div className="flex flex-col items-center py-2">
                        <div className="bg-white p-2 rounded-xl border-4 border-primary/10 mb-2">
                            <QRCodeSVG value={bookingId} size={150} level="H" />
                        </div>
                        <p className="text-[10px] font-mono text-muted-foreground">ID: {bookingId.substring(0, 12)}...</p>
                    </div>
                </div>

                {/* Footer Section (Price) */}
                <div className="bg-primary p-4 text-primary-foreground flex justify-between items-center">
                    <div>
                        <p className="text-[8px] uppercase font-bold opacity-80 text-white">Amount Paid</p>
                        <p className="text-lg font-bold text-white tracking-tight">{amount}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[8px] uppercase font-bold opacity-80 text-white">Booking ID</p>
                        <p className="text-[10px] font-mono text-white opacity-90 tracking-tighter">LP-{bookingId.substring(0, 6).toUpperCase()}</p>
                    </div>
                </div>
            </div>

            <Button
                onClick={downloadTicket}
                className="mt-6 rounded-full px-8 shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
            >
                <Download className="w-4 h-4 mr-2" /> Download Ticket
            </Button>
        </div>
    );
}
