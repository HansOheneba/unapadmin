"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMockApi } from "@/lib/api/client";
import { rehydratePersistedStore } from "@/lib/mock/persisted-store";

/** Rehydrates persisted demo data and refreshes React Query caches. */
export function MockStoreHydrator() {
  const qc = useQueryClient();
  const mock = useMockApi();

  React.useEffect(() => {
    if (!mock) return;
    void rehydratePersistedStore().then(() => {
      qc.invalidateQueries();
    });
  }, [mock, qc]);

  return null;
}
