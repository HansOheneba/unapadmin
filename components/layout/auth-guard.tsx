"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import { getMe } from "@/lib/api/auth";
import { ApiError, useMockApi } from "@/lib/api/client";
import { queryKeys } from "@/lib/hooks/query-keys";
import { PageSpinner } from "@/components/ui/spinner";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const qc = useQueryClient();
  const hydrated = useAuthStore((s) => s.hydrated);
  const currentUser = useAuthStore((s) => s.currentUser);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const hasUser = !!currentUser;

  // Single cached session check — React Query dedupes this across remounts /
  // Strict Mode, and with a long staleTime it won't re-hit auth.me on every
  // navigation or window focus.
  const { data, error, isPending, isFetched, isError } = useQuery({
    queryKey: queryKeys.me,
    queryFn: getMe,
    enabled: hydrated && hasUser,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  React.useEffect(() => {
    if (!hydrated) return;
    if (!hasUser) {
      router.replace("/login");
    }
  }, [hydrated, hasUser, router]);

  React.useEffect(() => {
    if (data) setUser(data);
  }, [data, setUser]);

  React.useEffect(() => {
    if (!isError || !error) return;
    const isAuthFailure =
      useMockApi() || (error instanceof ApiError && error.status === 401);
    if (!isAuthFailure) {
      console.error("[auth-guard] session check failed, keeping session", error);
      return;
    }
    qc.removeQueries({ queryKey: queryKeys.me });
    logout();
    router.replace("/login");
  }, [isError, error, qc, logout, router]);

  if (!hydrated) {
    return <PageSpinner />;
  }

  if (!currentUser) return null;

  // First visit only: wait for the session check. On later navigations the
  // cached query settles instantly (or we already have a persisted user and
  // a non-auth error like 429 — keep the shell up).
  const waitingOnFirstCheck = isPending && !isFetched;
  if (waitingOnFirstCheck) {
    return <PageSpinner />;
  }

  return <>{children}</>;
}
