import type { AnalyticsReport } from "@/types";
import { downloadApiFile, executeOrMock, useMockApi } from "./client";
import { mockGetAnalytics } from "@/lib/mock/data-store";
import { downloadCsv } from "@/lib/format";
import { getOrders } from "./orders";

export async function getAnalytics(
  from: string,
  to: string,
): Promise<AnalyticsReport> {
  return executeOrMock(
    "analytics.get",
    () => mockGetAnalytics(from, to),
    { method: "GET", query: { from, to } },
  );
}

export async function exportAnalyticsCsv(
  from: string,
  to: string,
): Promise<void> {
  const filename = `analytics-${from}-to-${to}.csv`;

  if (useMockApi()) {
    const { data: orders } = await getOrders({ from, to, pageSize: 500 });
    downloadCsv(
      filename,
      orders.map((o) => ({
        order_id: o.id,
        date: o.createdAt,
        customer: o.customerName,
        country: o.currency === "GHS" ? "Ghana" : "Nigeria",
        total: o.total,
        currency: o.currency,
        payment_method: o.paymentMethod,
        payment_status: o.paymentStatus,
        status: o.status,
        items: o.items.reduce((s, i) => s + i.quantity, 0),
      })),
    );
    return;
  }

  await downloadApiFile(
    "/workflow/execute/analytics.export-csv",
    filename,
    { from, to },
  );
}
