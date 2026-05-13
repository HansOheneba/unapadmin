"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CsvExportButtonProps {
  url: string;
  params?: Record<string, string>;
  filename?: string;
}

export function CsvExportButton({
  url,
  params = {},
  filename = "export.csv",
}: CsvExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      const qs = new URLSearchParams(params).toString();
      const res = await fetch(`${BASE}${url}${qs ? `?${qs}` : ""}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={loading}>
      <Download className="h-4 w-4 mr-1" />
      {loading ? "Exporting..." : "Export CSV"}
    </Button>
  );
}
