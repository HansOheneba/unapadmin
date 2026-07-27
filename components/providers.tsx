"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { MockStoreHydrator } from "@/components/layout/mock-store-hydrator";
import { ApiError } from "@/lib/api/client";

function errorStatus(error: unknown): number | undefined {
  if (error instanceof ApiError) return error.status;
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: unknown }).status;
    if (typeof status === "number") return status;
  }
  return undefined;
}

function shouldRetry(failureCount: number, error: unknown): boolean {
  // Never retry auth failures or rate limits — retries dig a deeper 429 hole.
  // Duck-type status too: `instanceof` can fail across duplicated module graphs.
  const status = errorStatus(error);
  if (status === 401 || status === 403 || status === 429) return false;
  return failureCount < 1;
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 10 * 60_000,
        retry: shouldRetry,
        // Failed queries must NOT auto-refetch on remount (Strict Mode / layout
        // shifts). That was turning one 429 into a request storm.
        retryOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <MockStoreHydrator />
      {children}
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}
