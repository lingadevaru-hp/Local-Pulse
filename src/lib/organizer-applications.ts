import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';
import type { OrganizerApplication, OrganizerApplicationStatus, UserProfile } from '@/types';
import { db, storage } from '@/lib/firebase';
import { isPlaceholderFirebaseConfig } from '@/lib/firebase-config';
import { getLocalUserProfile, saveLocalUserProfile } from '@/lib/local-user-profile';

const LOCAL_ORGANIZER_APPLICATIONS_KEY = 'localpulse_organizer_applications_v1';
export const LOCAL_ORGANIZER_APPLICATIONS_UPDATED_EVENT = 'localpulse:organizer-applications-updated';
const MAX_LOCAL_DOCUMENT_DATA_URL_LENGTH = 120_000;

export interface OrganizerApplicationInput {
  userId: string;
  userEmail: string;
  fullName: string;
  phone: string;
  city: string;
  organizationName: string;
  organizationType: string;
  governmentIdType: string;
  governmentIdNumber: string;
  documentName: string;
  documentDataUrl?: string;
  notes?: string;
}

const isBrowser = () => typeof window !== 'undefined';

const emit = () => {
  if (!isBrowser()) return;
  window.dispatchEvent(new window.Event(LOCAL_ORGANIZER_APPLICATIONS_UPDATED_EVENT));
};

const readLocal = (): OrganizerApplication[] => {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_ORGANIZER_APPLICATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OrganizerApplication[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocal = (applications: OrganizerApplication[]) => {
  if (!isBrowser()) return;
  const serialize = (items: OrganizerApplication[]) => JSON.stringify(items);
  const stripDocumentData = (items: OrganizerApplication[]) =>
    items.map((item) => ({ ...item, documentDataUrl: undefined }));

  try {
    window.localStorage.setItem(LOCAL_ORGANIZER_APPLICATIONS_KEY, serialize(applications));
  } catch {
    try {
      const compact = stripDocumentData(applications);
      window.localStorage.setItem(LOCAL_ORGANIZER_APPLICATIONS_KEY, serialize(compact));
    } catch {
      const minimal = stripDocumentData(applications).slice(0, 20);
      window.localStorage.setItem(LOCAL_ORGANIZER_APPLICATIONS_KEY, serialize(minimal));
    }
  }

  emit();
};

const toIso = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    const date = (value as { toDate: () => Date }).toDate();
    return date.toISOString();
  }
  return new Date().toISOString();
};

const mapApplicationRecord = (
  id: string,
  data: Record<string, unknown>
): OrganizerApplication => {
  return {
    id,
    userId: String(data.userId || ''),
    userEmail: String(data.userEmail || ''),
    fullName: String(data.fullName || ''),
    phone: String(data.phone || ''),
    city: String(data.city || ''),
    organizationName: String(data.organizationName || ''),
    organizationType: String(data.organizationType || ''),
    governmentIdType: String(data.governmentIdType || ''),
    governmentIdNumber: String(data.governmentIdNumber || ''),
    documentName: String(data.documentName || ''),
    documentUrl: typeof data.documentUrl === 'string' ? data.documentUrl : undefined,
    documentDataUrl: typeof data.documentDataUrl === 'string' ? data.documentDataUrl : undefined,
    notes: typeof data.notes === 'string' ? data.notes : undefined,
    status: (data.status as OrganizerApplicationStatus) || 'pending',
    submittedAt: toIso(data.submittedAt),
    reviewedAt: data.reviewedAt ? toIso(data.reviewedAt) : undefined,
    reviewedBy: typeof data.reviewedBy === 'string' ? data.reviewedBy : undefined,
    adminNotes: typeof data.adminNotes === 'string' ? data.adminNotes : undefined,
  };
};

const setLocalOrganizerProfile = (
  userId: string,
  patch: Partial<UserProfile>
) => {
  const existing = getLocalUserProfile(userId);
  const base: UserProfile = existing || {
    uid: userId,
    email: null,
    displayName: null,
    photoURL: null,
    role: 'user',
    userType: 'public',
    organizerStatus: 'none',
  };

  saveLocalUserProfile({
    ...base,
    ...patch,
  });
};

const applyUserRoleFromStatus = async (
  userId: string,
  status: OrganizerApplicationStatus,
  submittedAt: string
) => {
  const now = new Date().toISOString();
  const patch: Partial<UserProfile> =
    status === 'approved'
      ? {
          role: 'organizer',
          organizerStatus: 'approved',
          organizerApprovedAt: now,
          organizerRequestedAt: submittedAt,
        }
      : status === 'rejected'
        ? {
            role: 'user',
            organizerStatus: 'rejected',
            organizerRejectedAt: now,
            organizerRequestedAt: submittedAt,
          }
        : {
            role: 'user',
            organizerStatus: 'pending',
            organizerRequestedAt: submittedAt,
          };

  if (!isPlaceholderFirebaseConfig()) {
    await setDoc(
      doc(db, 'users', userId),
      {
        ...patch,
        updatedAt: now,
      },
      { merge: true }
    );
  } else {
    setLocalOrganizerProfile(userId, {
      ...patch,
      updatedAt: now,
    });
  }
};

export const listOrganizerApplications = async (
  status?: OrganizerApplicationStatus
): Promise<OrganizerApplication[]> => {
  if (isPlaceholderFirebaseConfig()) {
    const local = readLocal().sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
    return status ? local.filter((item) => item.status === status) : local;
  }

  const base = collection(db, 'organizerApplications');
  const appQuery = status ? query(base, where('status', '==', status)) : base;
  const snapshot = await getDocs(appQuery);
  const apps = snapshot.docs.map((docItem) =>
    mapApplicationRecord(docItem.id, docItem.data() as Record<string, unknown>)
  );
  return apps.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
};

export const getOrganizerApplicationByUser = async (userId: string): Promise<OrganizerApplication | null> => {
  if (isPlaceholderFirebaseConfig()) {
    const match = readLocal().find((item) => item.userId === userId);
    return match || null;
  }

  const base = collection(db, 'organizerApplications');
  const snapshot = await getDocs(query(base, where('userId', '==', userId)));
  if (snapshot.empty) return null;
  const appDoc = snapshot.docs[0];
  return mapApplicationRecord(appDoc.id, appDoc.data() as Record<string, unknown>);
};

export const submitOrganizerApplication = async (
  payload: OrganizerApplicationInput
): Promise<OrganizerApplication> => {
  const submittedAt = new Date().toISOString();
  const base: OrganizerApplication = {
    id: `org-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    userId: payload.userId,
    userEmail: payload.userEmail,
    fullName: payload.fullName,
    phone: payload.phone,
    city: payload.city,
    organizationName: payload.organizationName,
    organizationType: payload.organizationType,
    governmentIdType: payload.governmentIdType,
    governmentIdNumber: payload.governmentIdNumber,
    documentName: payload.documentName,
    documentDataUrl: payload.documentDataUrl,
    notes: payload.notes,
    status: 'pending',
    submittedAt,
  };

  if (isPlaceholderFirebaseConfig()) {
    const safeDocumentDataUrl =
      payload.documentDataUrl && payload.documentDataUrl.length <= MAX_LOCAL_DOCUMENT_DATA_URL_LENGTH
        ? payload.documentDataUrl
        : undefined;

    const localCopy: OrganizerApplication = {
      ...base,
      documentDataUrl: safeDocumentDataUrl,
      notes:
        !safeDocumentDataUrl && payload.documentDataUrl
          ? `${payload.notes || ''}\n[Document preview omitted in local mode due storage limit.]`.trim()
          : payload.notes,
    };

    const existing = readLocal();
    const filtered = existing.filter((item) => item.userId !== payload.userId);
    writeLocal([localCopy, ...filtered]);
    await applyUserRoleFromStatus(payload.userId, 'pending', submittedAt);
    return localCopy;
  }

  let documentUrl: string | undefined;
  if (payload.documentDataUrl) {
    const storageRef = ref(
      storage,
      `organizer-documents/${payload.userId}/${Date.now()}-${payload.documentName.replace(/\s+/g, '-')}`
    );
    await uploadString(storageRef, payload.documentDataUrl, 'data_url');
    documentUrl = await getDownloadURL(storageRef);
  }

  const docRef = await addDoc(collection(db, 'organizerApplications'), {
    ...base,
    documentUrl: documentUrl || null,
    documentDataUrl: null,
    submittedAt,
  });

  await applyUserRoleFromStatus(payload.userId, 'pending', submittedAt);

  return {
    ...base,
    id: docRef.id,
    documentUrl,
    documentDataUrl: undefined,
  };
};

export const reviewOrganizerApplication = async (
  applicationId: string,
  status: OrganizerApplicationStatus,
  reviewedBy: string,
  adminNotes?: string
) => {
  const reviewedAt = new Date().toISOString();

  if (isPlaceholderFirebaseConfig()) {
    const apps = readLocal();
    const target = apps.find((item) => item.id === applicationId);
    if (!target) throw new Error('Application not found.');

    const updated: OrganizerApplication = {
      ...target,
      status,
      reviewedAt,
      reviewedBy,
      adminNotes,
    };

    writeLocal([updated, ...apps.filter((item) => item.id !== applicationId)]);
    await applyUserRoleFromStatus(target.userId, status, target.submittedAt);
    return updated;
  }

  const appRef = doc(db, 'organizerApplications', applicationId);
  const snap = await getDoc(appRef);
  if (!snap.exists()) {
    throw new Error('Application not found.');
  }

  const current = mapApplicationRecord(snap.id, snap.data() as Record<string, unknown>);

  await updateDoc(appRef, {
    status,
    reviewedAt,
    reviewedBy,
    adminNotes: adminNotes || null,
  });

  await applyUserRoleFromStatus(current.userId, status, current.submittedAt);

  return {
    ...current,
    status,
    reviewedAt,
    reviewedBy,
    adminNotes,
  };
};
