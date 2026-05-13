"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCustomers, getCustomer, updateCustomer } from "@/lib/api/customers";
import { getDashboardStats } from "@/lib/api/analytics";
import { getDiscounts, getDiscount, createDiscount, updateDiscount, deleteDiscount } from "@/lib/api/discounts";
import { getBanners, getBanner, createBanner, updateBanner, deleteBanner, reorderBanners } from "@/lib/api/banners";
import { getAffiliates, getAffiliate, createAffiliate, createPayout } from "@/lib/api/affiliates";
import { getReturns, getReturn, updateReturnStatus } from "@/lib/api/returns";
import { getDeliveries, getDelivery, updateDelivery } from "@/lib/api/deliveries";
import { getInventory, updateInventory } from "@/lib/api/inventory";
import { getSettings, updateSettings, getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser } from "@/lib/api/auth";
import type { Customer, ReturnStatus, DeliveryStatus, Delivery, AdminRole } from "@/types";

// Customers
export const useCustomers = (params: { q?: string; page?: number } = {}) =>
  useQuery({ queryKey: ["customers", params], queryFn: () => getCustomers(params) });

export const useCustomer = (id: string) =>
  useQuery({ queryKey: ["customers", id], queryFn: () => getCustomer(id), enabled: !!id });

export const useUpdateCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Customer> }) =>
      updateCustomer(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
};

// Dashboard
export const useDashboardStats = () =>
  useQuery({ queryKey: ["dashboard-stats"], queryFn: getDashboardStats });

// Discounts
export const useDiscounts = () =>
  useQuery({ queryKey: ["discounts"], queryFn: getDiscounts });

export const useDiscount = (id: string) =>
  useQuery({ queryKey: ["discounts", id], queryFn: () => getDiscount(id) });

export const useCreateDiscount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createDiscount,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["discounts"] }),
  });
};

export const useUpdateDiscount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: Parameters<typeof updateDiscount>[0] extends string ? { id: string; body: Parameters<typeof updateDiscount>[1] } : never) =>
      updateDiscount(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["discounts"] }),
  });
};

export const useDeleteDiscount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDiscount,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["discounts"] }),
  });
};

// Banners
export const useBanners = () =>
  useQuery({ queryKey: ["banners"], queryFn: getBanners });

export const useBanner = (id: string) =>
  useQuery({ queryKey: ["banners", id], queryFn: () => getBanner(id), enabled: !!id });

export const useCreateBanner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBanner,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["banners"] }),
  });
};

export const useUpdateBanner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: Parameters<typeof updateBanner>[0] extends string ? { id: string; body: Parameters<typeof updateBanner>[1] } : never) =>
      updateBanner(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["banners"] }),
  });
};

export const useDeleteBanner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteBanner,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["banners"] }),
  });
};

export const useReorderBanners = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reorderBanners,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["banners"] }),
  });
};

// Affiliates
export const useAffiliates = () =>
  useQuery({ queryKey: ["affiliates"], queryFn: getAffiliates });

export const useAffiliate = (id: string) =>
  useQuery({ queryKey: ["affiliates", id], queryFn: () => getAffiliate(id), enabled: !!id });

export const useCreateAffiliate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAffiliate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["affiliates"] }),
  });
};

export const useCreatePayout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ affiliateId, body }: { affiliateId: string; body: { amount: number; method: string; reference?: string | null } }) =>
      createPayout(affiliateId, { ...body, reference: body.reference ?? undefined }),
    onSuccess: (_, { affiliateId }) => qc.invalidateQueries({ queryKey: ["affiliates", affiliateId] }),
  });
};

// Returns
export const useReturns = (params: { status?: ReturnStatus; page?: number } = {}) =>
  useQuery({ queryKey: ["returns", params], queryFn: () => getReturns(params) });

export const useReturn = (id: string) =>
  useQuery({ queryKey: ["returns", id], queryFn: () => getReturn(id), enabled: !!id });

export const useUpdateReturnStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      refundAmount,
    }: {
      id: string;
      status: ReturnStatus;
      refundAmount?: number;
    }) => updateReturnStatus(id, status, refundAmount),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["returns"] }),
  });
};

// Deliveries
export const useDeliveries = (params: { status?: DeliveryStatus; q?: string; page?: number } = {}) =>
  useQuery({ queryKey: ["deliveries", params], queryFn: () => getDeliveries(params) });

export const useDelivery = (id: string) =>
  useQuery({ queryKey: ["deliveries", id], queryFn: () => getDelivery(id), enabled: !!id });

export const useUpdateDelivery = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Pick<Delivery, "carrier" | "trackingNumber" | "trackingUrl" | "status" | "estimatedDelivery">> }) =>
      updateDelivery(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deliveries"] }),
  });
};

// Inventory
export const useInventory = () =>
  useQuery({ queryKey: ["inventory"], queryFn: getInventory });

export const useUpdateInventory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, stock, lowStockThreshold }: { productId: string; stock: number; lowStockThreshold: number }) =>
      updateInventory(productId, { stock, lowStockThreshold }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
  });
};

// Settings
export const useSettings = () =>
  useQuery({ queryKey: ["settings"], queryFn: getSettings });

export const useUpdateSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
};

export const useAdminUsers = () =>
  useQuery({ queryKey: ["admin-users"], queryFn: getAdminUsers });

export const useCreateAdminUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
};

export const useDeleteAdminUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
};
