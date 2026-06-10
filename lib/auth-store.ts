"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AdminUser } from "@/types";
import { clearToken, setToken } from "@/lib/api/token";

type AuthState = {
  currentUser: AdminUser | null;
  token: string | null;
  hydrated: boolean;
  setSession: (token: string, user: AdminUser) => void;
  setUser: (user: AdminUser) => void;
  setHydrated: (v: boolean) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      token: null,
      hydrated: false,

      setSession: (token, user) => {
        setToken(token);
        set({ token, currentUser: user });
      },

      setUser: (user) => set({ currentUser: user }),

      setHydrated: (v) => set({ hydrated: v }),

      logout: () => {
        clearToken();
        set({ currentUser: null, token: null });
      },
    }),
    {
      name: "unap-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        currentUser: s.currentUser,
        token: s.token,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) setToken(state.token);
        state?.setHydrated(true);
      },
    },
  ),
);
