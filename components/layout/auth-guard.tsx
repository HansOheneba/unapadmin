"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { getMe } from "@/lib/api/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.token);
  const currentUser = useAuthStore((s) => s.currentUser);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const [validated, setValidated] = React.useState(false);

  React.useEffect(() => {
    if (!hydrated) return;

    if (!token || !currentUser) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    getMe()
      .then((user) => {
        if (cancelled) return;
        setUser(user);
        setValidated(true);
      })
      .catch(() => {
        if (cancelled) return;
        logout();
        router.replace("/login");
      });

    return () => {
      cancelled = true;
    };
  }, [hydrated, token, currentUser, router, setUser, logout]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-sm text-zinc-500">Loading...</div>
      </div>
    );
  }

  if (!token || !currentUser) return null;

  if (!validated) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-sm text-zinc-500">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
