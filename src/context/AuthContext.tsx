"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile } from "@/types";
import { isPlaceholderFirebaseConfig } from "@/lib/firebase-config";
import { isAdminEmail } from "@/lib/access";
import { getLocalUserProfile, saveLocalUserProfile } from "@/lib/local-user-profile";

interface AppUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}

interface AuthContextType {
    user: AppUser | null;
    profile: UserProfile | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    logout: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const { user: clerkUser, isLoaded } = useUser();
    const { signOut } = useClerk();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const mappedClerkUser = useMemo<AppUser | null>(() => {
        if (!clerkUser) return null;

        return {
            uid: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress || null,
            displayName: clerkUser.fullName || clerkUser.firstName || clerkUser.username || "User",
            photoURL: clerkUser.imageUrl || null,
        };
    }, [clerkUser]);

    const user = mappedClerkUser;

    useEffect(() => {
        let isCancelled = false;

        const syncProfile = async () => {
            if (!isLoaded) {
                setLoading(true);
                return;
            }

            if (!user) {
                setProfile(null);
                setLoading(false);
                return;
            }

            setLoading(true);

            const fallbackProfile: UserProfile = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                role: "user",
                organizerStatus: "none",
                userType: "public",
            };

            const applyProfileDefaults = (input: UserProfile): UserProfile => {
                const merged: UserProfile = {
                    ...fallbackProfile,
                    ...input,
                    organizerStatus:
                        input.organizerStatus ??
                        (input.role === "organizer" ? "approved" : "none"),
                };

                if (isAdminEmail(user.email)) {
                    merged.role = "admin";
                    merged.organizerStatus = "approved";
                }

                return merged;
            };

            if (isPlaceholderFirebaseConfig()) {
                if (!isCancelled) {
                    const localProfile = getLocalUserProfile(user.uid);
                    const resolved = applyProfileDefaults(localProfile || fallbackProfile);
                    saveLocalUserProfile(resolved);
                    setProfile(resolved);
                    setLoading(false);
                }
                return;
            }

            try {
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);

                if (isCancelled) return;

                if (userDoc.exists()) {
                    const resolved = applyProfileDefaults(userDoc.data() as UserProfile);
                    setProfile(resolved);
                    await setDoc(userDocRef, resolved, { merge: true });
                } else {
                    const resolved = applyProfileDefaults(fallbackProfile);
                    await setDoc(userDocRef, resolved);
                    if (!isCancelled) {
                        setProfile(resolved);
                    }
                }
            } catch (error) {
                if (!isCancelled) {
                    const localProfile = getLocalUserProfile(user.uid);
                    const resolved = applyProfileDefaults(localProfile || fallbackProfile);
                    saveLocalUserProfile(resolved);
                    setProfile(resolved);
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false);
                }
            }
        };

        syncProfile();

        return () => {
            isCancelled = true;
        };
    }, [isLoaded, user]);

    const logout = async () => {
        setProfile(null);
        await signOut({ redirectUrl: "/" });
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
