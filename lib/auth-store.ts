"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AdminUser } from "@/types";
import { seedAdmins } from "@/lib/data/seed";

type AuthState = {
  currentUser: AdminUser | null;
  login: (email: string) => boolean;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,

      login: (email: string) => {
        const found = seedAdmins.find(
          (a) => a.email.toLowerCase() === email.trim().toLowerCase(),
        );
        if (found) {
          set({ currentUser: found });
          return true;
        }
        return false;
      },

      logout: () => set({ currentUser: null }),
    }),
    {
      name: "unap-auth",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
