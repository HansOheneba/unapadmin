import type { NewsletterSubscriber, Paginated } from "@/types";
import { executePaginatedOrMock } from "./client";
import { mockGetNewsletterSubscribers } from "@/lib/mock/data-store";

export type NewsletterListParams = {
  page?: number;
  pageSize?: number;
};

export async function getNewsletterSubscribers(
  params: NewsletterListParams = {},
): Promise<Paginated<NewsletterSubscriber>> {
  return executePaginatedOrMock(
    "newsletter.list",
    () => mockGetNewsletterSubscribers(params),
    { method: "GET", query: params },
  );
}
