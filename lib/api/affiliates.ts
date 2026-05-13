import type { Affiliate, AffiliatePayout } from "@/types";
import { apiFetch } from "./client";

// TODO: remove mock
const MOCK_AFFILIATES: Affiliate[] = [
  {
    id: "aff-1",
    name: "Yaw Darko",
    email: "yaw@example.com",
    code: "YAWDARKO10",
    commissionRate: 0.1,
    totalReferrals: 28,
    totalRevenue: 3420,
    totalOwed: 180,
    totalPaid: 162,
    active: true,
    createdAt: "2024-01-10T00:00:00Z",
  },
  {
    id: "aff-2",
    name: "Efua Mensah",
    email: "efua@example.com",
    code: "EFUA15",
    commissionRate: 0.15,
    totalReferrals: 15,
    totalRevenue: 1890,
    totalOwed: 120,
    totalPaid: 163.5,
    active: true,
    createdAt: "2024-02-01T00:00:00Z",
  },
];

const MOCK_PAYOUTS: AffiliatePayout[] = [
  {
    id: "pay-1",
    affiliateId: "aff-1",
    amount: 100,
    method: "momo",
    reference: "MOMO-PAY-001",
    paidAt: "2024-02-01T00:00:00Z",
  },
  {
    id: "pay-2",
    affiliateId: "aff-1",
    amount: 62,
    method: "bank",
    reference: "BANK-001",
    paidAt: "2024-03-01T00:00:00Z",
  },
];

export const getAffiliates = (): Promise<Affiliate[]> => {
  // TODO: remove mock
  return Promise.resolve(MOCK_AFFILIATES);
};

export const getAffiliate = (
  id: string,
): Promise<Affiliate & { payouts: AffiliatePayout[] }> => {
  // TODO: remove mock
  const affiliate = MOCK_AFFILIATES.find((a) => a.id === id);
  if (!affiliate) return Promise.reject(new Error("Not found"));
  const payouts = MOCK_PAYOUTS.filter((p) => p.affiliateId === id);
  return Promise.resolve({ ...affiliate, payouts });
};

export const createAffiliate = (
  body: Omit<Affiliate, "id" | "totalReferrals" | "totalRevenue" | "totalOwed" | "totalPaid" | "createdAt">,
) => apiFetch<Affiliate>("/affiliates", { method: "POST", body: JSON.stringify(body) });

export const updateAffiliate = (id: string, body: Partial<Affiliate>) =>
  apiFetch<Affiliate>(`/affiliates/${id}`, { method: "PATCH", body: JSON.stringify(body) });

export const createPayout = (
  id: string,
  body: { amount: number; method: string; reference?: string },
) =>
  apiFetch<AffiliatePayout>(`/affiliates/${id}/payouts`, {
    method: "POST",
    body: JSON.stringify(body),
  });
