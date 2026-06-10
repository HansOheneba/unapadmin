import type { InnerCircleMember, Paginated } from "@/types";
import { apiFetchOrMock } from "./client";
import {
  mockGetInnerCircle,
  mockUpdateInnerCircleStatus,
} from "@/lib/mock/data-store";

export type InnerCircleListParams = {
  status?: string;
  page?: number;
  pageSize?: number;
};

function toQuery(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export async function getInnerCircle(
  params: InnerCircleListParams = {},
): Promise<Paginated<InnerCircleMember>> {
  return apiFetchOrMock(
    `/inner-circle${toQuery(params)}`,
    () => mockGetInnerCircle(params),
  );
}

export async function updateInnerCircleStatus(
  id: string,
  status: InnerCircleMember["status"],
  note?: string,
): Promise<InnerCircleMember> {
  return apiFetchOrMock(
    `/inner-circle/${id}/status`,
    () => {
      const m = mockUpdateInnerCircleStatus(id, status, note);
      if (!m) throw new Error("Member not found");
      return m;
    },
    { method: "PATCH", body: JSON.stringify({ status, note }) },
  );
}
