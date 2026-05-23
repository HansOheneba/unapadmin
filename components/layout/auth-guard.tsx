"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.currentUser);
  const [checked, setChecked] = React.useState(false);

  React.useEffect(() => {
    if (!currentUser) {
      router.replace("/login");
    } else {
      setChecked(true);
    }
  }, [currentUser, router]);

  if (!checked) return null;
  return <>{children}</>;
}
