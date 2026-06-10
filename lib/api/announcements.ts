import type { BannerConfig, BannerMessage } from "@/types";
import { apiFetchOrMock } from "./client";
import {
  mockDeleteBannerMessage,
  mockGetBannerConfig,
  mockGetBannerMessages,
  mockReorderBannerMessages,
  mockUpdateBannerConfig,
  mockUpsertBannerMessage,
} from "@/lib/mock/data-store";

export async function getBannerConfig(): Promise<BannerConfig> {
  return apiFetchOrMock("/announcements/config", mockGetBannerConfig);
}

export async function updateBannerConfig(
  patch: Partial<BannerConfig>,
): Promise<BannerConfig> {
  return apiFetchOrMock(
    "/announcements/config",
    () => mockUpdateBannerConfig(patch),
    { method: "PATCH", body: JSON.stringify(patch) },
  );
}

export async function getBannerMessages(): Promise<BannerMessage[]> {
  return apiFetchOrMock("/announcements/messages", mockGetBannerMessages);
}

export async function createBannerMessage(
  body: Omit<BannerMessage, "id" | "createdAt" | "updatedAt">,
): Promise<BannerMessage> {
  return apiFetchOrMock(
    "/announcements/messages",
    () =>
      mockUpsertBannerMessage({
        ...body,
        id: "",
        createdAt: "",
        updatedAt: "",
      }),
    { method: "POST", body: JSON.stringify(body) },
  );
}

export async function updateBannerMessage(
  id: string,
  body: Partial<BannerMessage>,
): Promise<BannerMessage> {
  return apiFetchOrMock(
    `/announcements/messages/${id}`,
    () => {
      const existing = mockGetBannerMessages().find((m) => m.id === id);
      if (!existing) throw new Error("Message not found");
      return mockUpsertBannerMessage({ ...existing, ...body });
    },
    { method: "PATCH", body: JSON.stringify(body) },
  );
}

export async function deleteBannerMessage(id: string): Promise<void> {
  return apiFetchOrMock(
    `/announcements/messages/${id}`,
    () => mockDeleteBannerMessage(id),
    { method: "DELETE" },
  );
}

export async function reorderBannerMessages(ids: string[]): Promise<void> {
  return apiFetchOrMock(
    "/announcements/messages/reorder",
    () => mockReorderBannerMessages(ids),
    { method: "PATCH", body: JSON.stringify({ ids }) },
  );
}
