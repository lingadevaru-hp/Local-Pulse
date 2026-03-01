'use client';

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import { SignedOut, SignInButton } from '@clerk/nextjs';
import { AlertCircle, CheckCircle2, FileText, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  getOrganizerApplicationByUser,
  submitOrganizerApplication,
  type OrganizerApplicationInput,
} from '@/lib/organizer-applications';
import type { OrganizerApplication } from '@/types';
import { isOrganizerApproved } from '@/lib/access';

const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE_MB = 5;

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Unable to read file.'));
    reader.readAsDataURL(file);
  });

export default function OrganizerApplicationPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingApplication, setLoadingApplication] = useState(true);
  const [application, setApplication] = useState<OrganizerApplication | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    city: '',
    organizationName: '',
    organizationType: '',
    governmentIdType: '',
    governmentIdNumber: '',
    notes: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | undefined>(undefined);

  const organizerApproved = useMemo(() => isOrganizerApproved(profile), [profile]);

  useEffect(() => {
    if (!user) {
      setLoadingApplication(false);
      return;
    }

    const load = async () => {
      setLoadingApplication(true);
      try {
        const existing = await getOrganizerApplicationByUser(user.uid);
        setApplication(existing);
        if (existing) {
          setFormData((prev) => ({
            ...prev,
            fullName: existing.fullName || prev.fullName,
            phone: existing.phone || prev.phone,
            city: existing.city || prev.city,
            organizationName: existing.organizationName || prev.organizationName,
            organizationType: existing.organizationType || prev.organizationType,
            governmentIdType: existing.governmentIdType || prev.governmentIdType,
            governmentIdNumber: existing.governmentIdNumber || prev.governmentIdNumber,
            notes: existing.notes || prev.notes,
          }));
        }
      } catch (error) {
        toast({
          title: 'Unable to load organizer request',
          description: 'Please try refreshing the page.',
          variant: 'destructive',
        });
      } finally {
        setLoadingApplication(false);
      }
    };

    load();
  }, [user, toast]);

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    if (!ACCEPTED_FILE_TYPES.includes(selected.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Upload a PDF, JPG, or PNG document.',
        variant: 'destructive',
      });
      event.target.value = '';
      return;
    }

    if (selected.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: `Please upload a document smaller than ${MAX_FILE_SIZE_MB} MB.`,
        variant: 'destructive',
      });
      event.target.value = '';
      return;
    }

    setFile(selected);
    const dataUrl = await fileToDataUrl(selected);
    setFileDataUrl(dataUrl);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;

    if (!file && !application?.documentName) {
      toast({
        title: 'Document required',
        description: 'Upload a government ID or business verification document.',
        variant: 'destructive',
      });
      return;
    }

    const payload: OrganizerApplicationInput = {
      userId: user.uid,
      userEmail: user.email || '',
      fullName: formData.fullName,
      phone: formData.phone,
      city: formData.city,
      organizationName: formData.organizationName,
      organizationType: formData.organizationType,
      governmentIdType: formData.governmentIdType,
      governmentIdNumber: formData.governmentIdNumber,
      documentName: file?.name || application?.documentName || 'verification-document',
      documentDataUrl: fileDataUrl || application?.documentDataUrl,
      notes: formData.notes,
    };

    setIsSubmitting(true);
    try {
      const submitted = await submitOrganizerApplication(payload);
      setApplication(submitted);
      toast({
        title: 'Application submitted',
        description: 'Your organizer request is now pending admin approval.',
      });
    } catch (error) {
      toast({
        title: 'Submission failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loadingApplication) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SignedOut>
          <Card className="max-w-xl mx-auto text-center">
            <CardHeader>
              <CardTitle className="text-2xl">Sign in required</CardTitle>
              <CardDescription>Sign in to submit organizer verification documents.</CardDescription>
            </CardHeader>
            <CardContent>
              <SignInButton mode="modal">
                <Button>Sign In</Button>
              </SignInButton>
            </CardContent>
          </Card>
        </SignedOut>
      </div>
    );
  }

  if (organizerApproved) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              Organizer Verified
            </CardTitle>
            <CardDescription>Your organizer account is approved. You can now create and host events.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button asChild>
              <Link href="/events/create">Create Event</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/organizer">Open Organizer Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = application?.status || profile?.organizerStatus || 'none';
  const submissionBlocked = status === 'pending';

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card className="glass-effect border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-3xl font-bold">Organizer Verification</CardTitle>
              <CardDescription>
                Submit your details and government/business document for admin verification.
              </CardDescription>
            </div>
            <Badge variant="outline" className="capitalize border-primary/30 text-primary px-3 py-1">
              Status: {status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {status === 'pending' && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
              <p className="font-semibold text-amber-700 dark:text-amber-300">
                Your account creation request has been successful. Waiting for admin approval.
              </p>
              <p className="text-amber-700/80 dark:text-amber-300/80 mt-1">
                We will review your documents and reach out soon.
              </p>
            </div>
          )}

          {status === 'rejected' && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
              <p className="font-semibold text-red-700 dark:text-red-300">
                Your last organizer request was rejected.
              </p>
              <p className="text-red-700/80 dark:text-red-300/80 mt-1">
                Please update your details/documents and submit again.
              </p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  required
                  disabled={submissionBlocked}
                  value={formData.fullName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  required
                  disabled={submissionBlocked}
                  placeholder="+91"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  required
                  disabled={submissionBlocked}
                  value={formData.city}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organizationName">Organization / Brand Name</Label>
                <Input
                  id="organizationName"
                  required
                  disabled={submissionBlocked}
                  value={formData.organizationName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, organizationName: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="organizationType">Organization Type</Label>
                <Input
                  id="organizationType"
                  required
                  disabled={submissionBlocked}
                  placeholder="Company, NGO, College Club..."
                  value={formData.organizationType}
                  onChange={(e) => setFormData((prev) => ({ ...prev, organizationType: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="governmentIdType">Government ID Type</Label>
                <Input
                  id="governmentIdType"
                  required
                  disabled={submissionBlocked}
                  placeholder="Aadhaar, PAN, GST, CIN..."
                  value={formData.governmentIdType}
                  onChange={(e) => setFormData((prev) => ({ ...prev, governmentIdType: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="governmentIdNumber">Government ID Number</Label>
              <Input
                id="governmentIdNumber"
                required
                disabled={submissionBlocked}
                value={formData.governmentIdNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, governmentIdNumber: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentUpload" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Document Upload (PDF/JPG/PNG)
              </Label>
              <Input id="documentUpload" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={onFileChange} disabled={submissionBlocked} />
              <p className="text-xs text-muted-foreground">
                Max {MAX_FILE_SIZE_MB} MB. Accepted: Aadhaar/PAN/GST certificate/business registration docs.
              </p>
              {(file?.name || application?.documentName) && (
                <p className="text-xs font-medium text-foreground">
                  Selected document: {file?.name || application?.documentName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                rows={4}
                disabled={submissionBlocked}
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Tell us what kind of events you organize..."
              />
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground flex gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 text-primary" />
              Your request will be reviewed by admin. After approval, your organizer account will be activated and event creation will be enabled.
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={isSubmitting || submissionBlocked}>
                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                {submissionBlocked ? 'Awaiting Approval' : status === 'rejected' ? 'Re-Submit Request' : 'Submit Request'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/organizer">Back To Organizer Page</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
