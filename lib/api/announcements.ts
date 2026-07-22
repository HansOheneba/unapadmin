import type { BannerConfig, BannerMessage } from "@/types";
import { executeOrMock } from "./client";
import {
  mockDeleteBannerMessage,
  mockGetBannerConfig,
  mockGetBannerMessages,
  mockReorderBannerMessages,
  mockUpdateBannerConfig,
  mockUpsertBannerMessage,
} from "@/lib/mock/data-store";

export async function getBannerConfig(): Promise<BannerConfig> {
  return executeOrMock("announcement.get-config", mockGetBannerConfig);
}

export async function updateBannerConfig(
  patch: Partial<BannerConfig>,
): Promise<BannerConfig> {
  return executeOrMock(
    "announcement.update-config",
    () => mockUpdateBannerConfig(patch),
    { method: "PATCH", body: patch },
  );
}

export async function getBannerMessages(): Promise<BannerMessage[]> {
  return executeOrMock("announcement.get-messages", mockGetBannerMessages);
}

export async function createBannerMessage(
  body: Omit<BannerMessage, "id" | "createdAt" | "updatedAt">,
): Promise<BannerMessage> {
  return executeOrMock(
    "announcement.create-message",
    () =>
      mockUpsertBannerMessage({
        ...body,
        id: "",
        createdAt: "",
        updatedAt: "",
      }),
    { method: "POST", body },
  );
}

export async function updateBannerMessage(
  id: string,
  body: Partial<BannerMessage>,
): Promise<BannerMessage> {
  return executeOrMock(
    "announcement.update-message",
    () => {
      const existing = mockGetBannerMessages().find((m) => m.id === id);
      if (!existing) throw new Error("Message not found");
      return mockUpsertBannerMessage({ ...existing, ...body });
    },
    { method: "PATCH", body: { id, ...body } },
  );
}

export async function deleteBannerMessage(id: string): Promise<void> {
  return executeOrMock(
    "announcement.delete-message",
    () => mockDeleteBannerMessage(id),
    { method: "DELETE", body: { id } },
  );
}

export async function reorderBannerMessages(ids: string[]): Promise<void> {
  return executeOrMock(
    "announcement.reorder-messages",
    () => mockReorderBannerMessages(ids),
    { method: "PATCH", body: { ids } },
  );
}
