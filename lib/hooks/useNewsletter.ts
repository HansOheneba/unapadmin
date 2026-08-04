"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getNewsletterSubscribers,
  type NewsletterListParams,
} from "@/lib/api/newsletter";
import { queryKeys } from "./query-keys";

export function useNewsletter(params: NewsletterListParams = {}) {
  return useQuery({
    queryKey: queryKeys.newsletter(params),
    queryFn: () => getNewsletterSubscribers(params),
  });
}
