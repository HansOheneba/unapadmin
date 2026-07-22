"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AdminUser } from "@/types";

// The admin JWT itself lives only in an httpOnly session cookie managed by
// the BFF routes (see lib/api/session.ts) — this store only ever holds the
// non-sensitive user profile, so reload/rehydrate can't leak or lose a token.
type AuthState = {
  currentUser: AdminUser | null;
  hydrated: boolean;
  setUser: (user: AdminUser | null) => void;
  setHydrated: (v: boolean) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      hydrated: false,

      setUser: (user) => set({ currentUser: user }),

      setHydrated: (v) => set({ hydrated: v }),

      logout: () => set({ currentUser: null }),
    }),
    {
      name: "unap-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ currentUser: s.currentUser }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
