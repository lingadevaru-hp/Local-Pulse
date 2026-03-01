"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile } from "@/types";
import { isPlaceholderFirebaseConfig } from "@/lib/firebase-config";

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
                userType: "public",
            };

            if (isPlaceholderFirebaseConfig()) {
                if (!isCancelled) {
                    setProfile((prev) => prev || fallbackProfile);
                    setLoading(false);
                }
                return;
            }

            try {
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);

                if (isCancelled) return;

                if (userDoc.exists()) {
                    setProfile(userDoc.data() as UserProfile);
                } else {
                    await setDoc(userDocRef, fallbackProfile);
                    if (!isCancelled) {
                        setProfile(fallbackProfile);
                    }
                }
            } catch (error) {
                if (!isCancelled) {
                    setProfile((prev) => prev || fallbackProfile);
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
