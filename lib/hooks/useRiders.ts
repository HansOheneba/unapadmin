"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRider,
  deleteRider,
  getRider,
  getRiders,
  updateRider,
  type RiderListParams,
  type RiderWriteBody,
} from "@/lib/api/riders";
import type { Rider } from "@/types";
import { queryKeys } from "./query-keys";

function toWriteBody(r: Rider): RiderWriteBody {
  return {
    firstName: r.firstName,
    lastName: r.lastName,
    phone: r.phone,
    whatsapp: r.whatsapp,
    email: r.email,
    country: r.country,
    city: r.city,
    zone: r.zone,
    status: r.status,
    vehicleType: r.vehicleType,
    plateNumber: r.plateNumber,
    vehicleMake: r.vehicleMake,
    vehicleModel: r.vehicleModel,
    vehicleColor: r.vehicleColor,
    licenseNumber: r.licenseNumber,
    notes: r.notes,
  };
}

export function useRiders(params: RiderListParams = {}) {
  return useQuery({
    queryKey: queryKeys.riders(params),
    queryFn: () => getRiders(params),
  });
}

export function useRider(id: string) {
  return useQuery({
    queryKey: queryKeys.rider(id),
    queryFn: () => getRider(id),
    enabled: !!id,
  });
}

export function useRiderMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["riders"] });

  const upsert = useMutation({
    mutationFn: async (r: Rider) => {
      const body = toWriteBody(r);
      if (r.id) return updateRider(r.id, body);
      return createRider(body);
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: deleteRider,
    onSuccess: invalidate,
  });

  return { upsert, remove };
}
