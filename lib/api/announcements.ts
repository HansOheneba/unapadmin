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

export const EMPTY_BANNER_CONFIG: BannerConfig = {
  isEnabled: false,
  rotationIntervalMs: 4000,
  backgroundColor: "#000000",
  textColor: "#ffffff",
};

type BannerMessageInput = Omit<
  BannerMessage,
  "id" | "createdAt" | "updatedAt"
>;

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

export function normalizeBannerConfig(raw: unknown): BannerConfig {
  const obj =
    raw && typeof raw === "object"
      ? ((raw as { config?: unknown }).config &&
        typeof (raw as { config?: unknown }).config === "object"
          ? ((raw as { config: object }).config as Record<string, unknown>)
          : (raw as Record<string, unknown>))
      : {};

  return {
    isEnabled: Boolean(
      obj.isEnabled ?? obj.enabled ?? EMPTY_BANNER_CONFIG.isEnabled,
    ),
    rotationIntervalMs: asNumber(
      obj.rotationIntervalMs ?? obj.rotationInterval,
      EMPTY_BANNER_CONFIG.rotationIntervalMs,
    ),
    backgroundColor: asString(
      obj.backgroundColor ?? obj.bgColor,
      EMPTY_BANNER_CONFIG.backgroundColor,
    ),
    textColor: asString(
      obj.textColor ?? obj.color,
      EMPTY_BANNER_CONFIG.textColor,
    ),
  };
}

function normalizeBannerMessage(
  raw: unknown,
  index: number,
): BannerMessage | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  // create/update may wrap the row: { message } | { data }
  const nested =
    obj.message && typeof obj.message === "object"
      ? (obj.message as Record<string, unknown>)
      : obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)
        ? (obj.data as Record<string, unknown>)
        : obj;

  const id = typeof nested.id === "string" ? nested.id : `msg_${index}`;
  const text = asString(nested.text ?? nested.message ?? nested.content, "");
  if (!text && typeof nested.id !== "string") return null;

  return {
    id,
    text,
    href: asString(nested.href ?? nested.link ?? nested.url, "/"),
    isActive: Boolean(nested.isActive ?? nested.active ?? true),
    startsAt: typeof nested.startsAt === "string" ? nested.startsAt : null,
    endsAt: typeof nested.endsAt === "string" ? nested.endsAt : null,
    sortOrder: asNumber(nested.sortOrder ?? nested.order ?? index, index),
    createdAt: asString(nested.createdAt, new Date(0).toISOString()),
    updatedAt: asString(nested.updatedAt, new Date(0).toISOString()),
  };
}

export function normalizeBannerMessages(raw: unknown): BannerMessage[] {
  let list: unknown[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && typeof raw === "object") {
    const obj = raw as {
      data?: unknown;
      messages?: unknown;
      items?: unknown;
    };
    if (Array.isArray(obj.data)) list = obj.data;
    else if (Array.isArray(obj.messages)) list = obj.messages;
    else if (Array.isArray(obj.items)) list = obj.items;
  }

  return list
    .map((item, i) => normalizeBannerMessage(item, i))
    .filter((m): m is BannerMessage => m !== null);
}

/** Postman: full config object on update-config. */
function toConfigBody(config: BannerConfig): BannerConfig {
  return {
    isEnabled: config.isEnabled,
    rotationIntervalMs: config.rotationIntervalMs,
    backgroundColor: config.backgroundColor,
    textColor: config.textColor,
  };
}

/** Postman create-message body. */
function toCreateMessageBody(body: BannerMessageInput) {
  return {
    text: body.text,
    href: body.href,
    isActive: body.isActive,
  };
}

/** Postman update-message body. */
function toUpdateMessageBody(id: string, body: Partial<BannerMessage>) {
  const payload: Record<string, unknown> = { id };
  if (body.text !== undefined) payload.text = body.text;
  if (body.href !== undefined) payload.href = body.href;
  if (body.isActive !== undefined) payload.isActive = body.isActive;
  if (body.startsAt !== undefined) payload.startsAt = body.startsAt;
  if (body.endsAt !== undefined) payload.endsAt = body.endsAt;
  if (body.sortOrder !== undefined) payload.sortOrder = body.sortOrder;
  return payload;
}

export async function getBannerConfig(): Promise<BannerConfig> {
  try {
    const raw = await executeOrMock(
      "announcement.get-config",
      mockGetBannerConfig,
    );
    return normalizeBannerConfig(raw);
  } catch (err) {
    // Backend get-config currently 500s when no config row exists.
    // Messages still come from announcement.get-messages.
    // Keep enabled so the messages list still previews while config is broken.
    console.warn("[announcements] get-config failed, using empty defaults", err);
    return { ...EMPTY_BANNER_CONFIG, isEnabled: true };
  }
}

export async function updateBannerConfig(
  config: BannerConfig,
): Promise<BannerConfig> {
  const body = toConfigBody(config);
  const raw = await executeOrMock(
    "announcement.update-config",
    () => mockUpdateBannerConfig(body),
    { method: "PATCH", body },
  );
  return normalizeBannerConfig(raw);
}

export async function getBannerMessages(): Promise<BannerMessage[]> {
  const raw = await executeOrMock(
    "announcement.get-messages",
    mockGetBannerMessages,
  );
  return normalizeBannerMessages(raw);
}

export async function createBannerMessage(
  body: BannerMessageInput,
): Promise<BannerMessage> {
  const payload = toCreateMessageBody(body);
  const raw = await executeOrMock(
    "announcement.create-message",
    () =>
      mockUpsertBannerMessage({
        ...body,
        id: "",
        createdAt: "",
        updatedAt: "",
      }),
    { method: "POST", body: payload },
  );
  return (
    normalizeBannerMessage(raw, 0) ?? {
      ...body,
      id: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  );
}

export async function updateBannerMessage(
  id: string,
  body: Partial<BannerMessage>,
): Promise<BannerMessage> {
  const payload = toUpdateMessageBody(id, body);
  const raw = await executeOrMock(
    "announcement.update-message",
    () => {
      const existing = mockGetBannerMessages().find((x) => x.id === id);
      if (!existing) throw new Error("Message not found");
      return mockUpsertBannerMessage({ ...existing, ...body });
    },
    { method: "PATCH", body: payload },
  );
  const normalized = normalizeBannerMessage(raw, 0);
  if (!normalized) throw new Error("Message not found");
  return normalized;
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
