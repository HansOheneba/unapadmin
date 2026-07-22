import type { InnerCircleMember, Paginated } from "@/types";
import { executeOrMock, executePaginatedOrMock } from "./client";
import {
  mockGetInnerCircle,
  mockUpdateInnerCircleStatus,
} from "@/lib/mock/data-store";

export type InnerCircleListParams = {
  status?: string;
  page?: number;
  pageSize?: number;
};

export async function getInnerCircle(
  params: InnerCircleListParams = {},
): Promise<Paginated<InnerCircleMember>> {
  return executePaginatedOrMock(
    "inner-circle.list",
    () => mockGetInnerCircle(params),
    { method: "GET", query: params },
  );
}

export async function updateInnerCircleStatus(
  id: string,
  status: InnerCircleMember["status"],
  note?: string,
): Promise<InnerCircleMember> {
  return executeOrMock(
    "inner-circle.update-status",
    () => {
      const m = mockUpdateInnerCircleStatus(id, status, note);
      if (!m) throw new Error("Member not found");
      return m;
    },
    { method: "PATCH", body: { id, status, note } },
  );
}
