'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, MapPin, User, Mail, Phone, Users, CheckCircle2, Bell, QrCode, Download, ArrowLeft, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { isPlaceholderFirebaseConfig } from '@/lib/firebase-config';
import Image from 'next/image';
import { saveLocalRegistration, type LocalRegistration } from '@/lib/local-db';
import { downloadTicketPdf } from '@/lib/ticket-pdf';

interface RegistrationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    eventName: string;
    eventId: string;
    eventDate?: string;
    eventLocation?: string;
    eventPrice?: string;
}

interface FormData {
    fullName: string;
    email: string;
    phone: string;
    attendees: string;
    specialRequirements: string;
}

interface FormErrors {
    fullName?: string;
    email?: string;
    phone?: string;
}

export default function RegistrationDialog({
    open,
    onOpenChange,
    eventName,
    eventId,
    eventDate,
    eventLocation,
    eventPrice,
}: RegistrationDialogProps) {
    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        email: '',
        phone: '',
        attendees: '1',
        specialRequirements: '',
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState<'form' | 'scanner' | 'success'>('form');
    const [sendReminders, setSendReminders] = useState(true);
    const [latestRegistration, setLatestRegistration] = useState<LocalRegistration | null>(null);

    const { user } = useAuth();

    useEffect(() => {
        if (!open) {
            const timer = setTimeout(() => setStep('form'), 300);
            setLatestRegistration(null);
            return () => clearTimeout(timer);
        }
    }, [open]);

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Please enter a valid email address';
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        else if (!/^\+?[\d\s-()]{10,}$/.test(formData.phone)) newErrors.phone = 'Please enter a valid phone number';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        if (!user) {
            alert("Please sign in to register.");
            return;
        }

        setIsSubmitting(true);
        const normalizedPrice = (eventPrice || '').toLowerCase().trim();
        const isPaid =
            normalizedPrice !== '' &&
            normalizedPrice !== 'free' &&
            normalizedPrice !== 'inr 0' &&
            normalizedPrice !== 'rs 0' &&
            normalizedPrice !== '0';

        if (isPaid) {
            setTimeout(() => {
                setIsSubmitting(false);
                setStep('scanner');
            }, 800);
        } else {
            await finalizeRegistration();
        }
    };

    const finalizeRegistration = async () => {
        setIsSubmitting(true);
        const bookingId = 'bk_' + Math.random().toString(36).substr(2, 9);
        const registration: LocalRegistration = {
            bookingId,
            userId: user?.uid,
            eventId,
            eventName,
            eventDate,
            eventLocation,
            ...formData,
            status: 'completed',
            amount: eventPrice || '0',
            remindersEnabled: sendReminders,
            registeredAt: new Date().toISOString(),
        };

        try {
            if (!isPlaceholderFirebaseConfig()) {
                await addDoc(collection(db, "registrations"), registration);
            }
        } catch (e) {
            console.warn("Firestore registration save failed, continuing with local save:", e);
        }

        saveLocalRegistration(registration);
        setLatestRegistration(registration);

        setIsSubmitting(false);
        setStep('success');
    };

    const handlePaymentComplete = () => {
        setIsSubmitting(true);
        setTimeout(() => {
            finalizeRegistration();
        }, 2000);
    };

    const handleDownloadTicket = () => {
        if (!latestRegistration) return;
        downloadTicketPdf({
            bookingId: latestRegistration.bookingId,
            eventName: latestRegistration.eventName,
            eventDate: latestRegistration.eventDate,
            eventLocation: latestRegistration.eventLocation,
            fullName: latestRegistration.fullName,
            email: latestRegistration.email,
            phone: latestRegistration.phone,
            attendees: latestRegistration.attendees,
            amount: latestRegistration.amount,
            bookedAt: latestRegistration.registeredAt,
        });
    };

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    // Custom animation styles
    const animationStyles = (
        <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes scan {
                0%, 100% { top: 0; }
                50% { top: 100%; }
            }
            .animate-scan {
                animation: scan 2.5s ease-in-out infinite;
            }
            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
            .animate-shimmer {
                background: linear-gradient(90deg, var(--primary) 0%, #a855f7 50%, var(--primary) 100%);
                background-size: 200% 100%;
                animation: shimmer 3s infinite linear;
            }
        `}} />
    );

    if (step === 'success') {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md bg-background border-border shadow-2xl rounded-[32px] p-0 overflow-hidden">
                    <div className="flex flex-col items-center justify-center py-12 px-8 text-center space-y-8">
                        <div className="rounded-full bg-green-500/10 p-6 animate-in zoom-in duration-500">
                            <CheckCircle2 className="h-24 w-24 text-green-500" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-4xl font-black tracking-tight">YOU'RE IN!</h2>
                            <p className="text-muted-foreground text-lg font-medium">Your booking is confirmed.</p>
                        </div>

                        <div className="w-full bg-muted/40 p-6 rounded-[24px] border border-dashed border-primary/20 text-left space-y-3">
                            <div className="font-black text-xl text-foreground uppercase tracking-tight">{eventName}</div>
                            <div className="space-y-1">
                                <div className="flex items-center text-sm font-semibold text-muted-foreground">
                                    <CalendarDays className="w-4 h-4 mr-2 text-primary" /> {eventDate}
                                </div>
                                <div className="flex items-center text-sm font-semibold text-muted-foreground">
                                    <MapPin className="w-4 h-4 mr-2 text-primary" /> {eventLocation}
                                </div>
                                {latestRegistration?.bookingId ? (
                                    <div className="text-xs text-muted-foreground font-mono">
                                        Booking ID: {latestRegistration.bookingId}
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 w-full pt-4">
                            <Button
                                className="w-full h-16 text-xl rounded-2xl shadow-2xl shadow-primary/30 font-black tracking-tight"
                                onClick={handleDownloadTicket}
                            >
                                <Download className="w-6 h-6 mr-3" /> DOWNLOAD TICKET
                            </Button>
                            <Button variant="ghost" className="w-full h-12 text-muted-foreground font-bold" onClick={() => onOpenChange(false)}>
                                CLOSE WINDOW
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    if (step === 'scanner') {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[480px] bg-background border-border shadow-2xl rounded-[32px] p-0 overflow-hidden">
                    {animationStyles}
                    <DialogHeader className="p-8 pb-2">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-muted/50 hover:bg-muted" onClick={() => setStep('form')}>
                                <ArrowLeft className="w-6 h-6" />
                            </Button>
                            <div>
                                <DialogTitle className="text-3xl font-black tracking-tight uppercase">Pay & Book</DialogTitle>
                                <DialogDescription className="text-lg font-medium text-primary">
                                    Scan to pay {eventPrice}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="py-10 flex flex-col items-center space-y-10 px-8">
                        <div className="relative w-80 h-80 rounded-[48px] overflow-hidden border-[12px] border-primary/5 shadow-2xl animate-in zoom-in-95 duration-700">
                            <Image
                                src="/payment-qr.png"
                                alt="Payment QR Scanner"
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-primary/5 mix-blend-overlay" />
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-primary shadow-[0_0_20px_rgba(var(--primary),1)] animate-scan" />
                        </div>

                        <div className="text-center space-y-3">
                            <p className="text-xl font-black tracking-tight uppercase">Scan with UPI App</p>
                            <div className="flex gap-4 justify-center mt-6 grayscale opacity-30">
                                <span className="text-xs font-black tracking-widest px-3 py-1 bg-muted rounded-full">GPAY</span>
                                <span className="text-xs font-black tracking-widest px-3 py-1 bg-muted rounded-full">PHONEPE</span>
                                <span className="text-xs font-black tracking-widest px-3 py-1 bg-muted rounded-full">PAYTM</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 pt-0">
                        <Button
                            className="w-full h-20 text-2xl rounded-3xl shadow-2xl shadow-primary/30 font-black uppercase tracking-widest animate-shimmer border-none"
                            onClick={handlePaymentComplete}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-3">
                                    <Loader2 className="w-6 h-6 animate-spin" /> VERIFYING...
                                </span>
                            ) : 'I HAVE PAID'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] max-h-[95vh] overflow-y-auto bg-background border-border shadow-2xl rounded-[32px] p-0 border-none">
                <DialogHeader className="p-10 pb-6 bg-muted/20">
                    <DialogTitle className="text-4xl font-black tracking-tighter uppercase italic">Registration</DialogTitle>
                    <div className="pt-6 space-y-4">
                        <div className="font-black text-2xl text-foreground leading-none tracking-tight">{eventName}</div>
                        <div className="flex flex-wrap gap-3 pt-2">
                            {eventPrice && (
                                <div className="flex items-center text-sm font-black text-primary bg-primary/10 px-4 py-2 rounded-2xl border border-primary/20 tracking-tight">
                                    <QrCode className="w-4 h-4 mr-2" />
                                    {eventPrice}
                                </div>
                            )}
                            {eventDate && (
                                <div className="flex items-center text-sm font-bold text-muted-foreground bg-muted px-4 py-2 rounded-2xl tracking-tight">
                                    <CalendarDays className="w-4 h-4 mr-2" /> {new Date(eventDate).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-10 pt-8 space-y-8">
                    <div className="space-y-3">
                        <Label htmlFor="fullName" className="text-sm font-black uppercase tracking-widest text-muted-foreground pl-1">Full Name</Label>
                        <div className="relative group">
                            <User className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground transition-colors group-focus-within:text-primary" />
                            <Input
                                id="fullName"
                                placeholder="YOUR FULL NAME"
                                value={formData.fullName}
                                onChange={(e) => handleInputChange('fullName', e.target.value)}
                                className={`pl-14 h-16 rounded-2xl border-none bg-muted/40 font-bold focus:bg-muted/60 transition-all ${errors.fullName ? 'ring-2 ring-red-500/50' : 'focus:ring-2 focus:ring-primary/50'}`}
                            />
                        </div>
                        {errors.fullName && <p className="text-xs text-red-500 font-bold pl-5 uppercase tracking-wider">{errors.fullName}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Label htmlFor="email" className="text-sm font-black uppercase tracking-widest text-muted-foreground pl-1">Email</Label>
                            <div className="relative group">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="YOU@EXAMPLE.COM"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    className={`pl-14 h-16 rounded-2xl border-none bg-muted/40 font-bold focus:bg-muted/60 transition-all ${errors.email ? 'ring-2 ring-red-500/50' : 'focus:ring-2 focus:ring-primary/50'}`}
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="phone" className="text-sm font-black uppercase tracking-widest text-muted-foreground pl-1">Phone</Label>
                            <div className="relative group">
                                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="+91..."
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    className={`pl-14 h-16 rounded-2xl border-none bg-muted/40 font-bold focus:bg-muted/60 transition-all ${errors.phone ? 'ring-2 ring-red-500/50' : 'focus:ring-2 focus:ring-primary/50'}`}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-primary/5 rounded-[24px] border border-primary/10 shadow-inner">
                        <div className="flex items-center gap-5">
                            <div className="bg-primary/10 p-3 rounded-2xl text-primary shadow-sm">
                                <Bell className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-base font-black tracking-tight uppercase">Reminders</p>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-70">SMS & In-app updates</p>
                            </div>
                        </div>
                        <Switch checked={sendReminders} onCheckedChange={setSendReminders} className="data-[state=checked]:bg-primary scale-110" />
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="attendees" className="text-sm font-black uppercase tracking-widest text-muted-foreground pl-1">Attendees</Label>
                        <div className="relative group">
                            <Users className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground transition-colors group-focus-within:text-primary" />
                            <Input
                                id="attendees"
                                type="number"
                                min="1"
                                max="10"
                                value={formData.attendees}
                                onChange={(e) => handleInputChange('attendees', e.target.value)}
                                className="pl-14 h-16 rounded-2xl border-none bg-muted/40 font-bold focus:bg-muted/60 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="h-16 rounded-[20px] text-muted-foreground font-bold hover:text-foreground hover:bg-muted">
                            CANCEL
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="flex-grow h-20 text-2xl rounded-[24px] shadow-2xl shadow-primary/30 font-black tracking-tighter uppercase italic">
                            {isSubmitting ? 'WORKING...' : (
                                !eventPrice || eventPrice.toLowerCase() === 'free' || eventPrice.toLowerCase() === 'inr 0'
                                    ? 'Confirm Now ->'
                                    : `Pay ${eventPrice} & Book ->`
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
