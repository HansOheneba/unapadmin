"use client";

import { useQuery } from "@tanstack/react-query";
import { getAnalytics } from "@/lib/api/analytics";
import { queryKeys } from "./query-keys";

export function useAnalytics(from: string, to: string) {
  return useQuery({
    queryKey: queryKeys.analytics(from, to),
    queryFn: () => getAnalytics(from, to),
    enabled: !!from && !!to,
  });
}
