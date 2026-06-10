"use client";

import { Check, CircleDashed, RotateCcw, XCircle } from "lucide-react";
import { FULFILLMENT_STEPS, fmtDateTime, statusLabel } from "@/lib/format";
import { fulfillmentStepIndex } from "@/lib/delivery";
import type { Order } from "@/types";

export function OrderFulfillmentStepper({ order }: { order: Order }) {
  const isReturned = order.status === "returned";
  const isDelivered = order.status === "delivered";
  const currentIndex = fulfillmentStepIndex(order.status);

  if (isReturned) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 p-4">
          <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <div>
            <div className="text-sm font-medium text-zinc-900">
              Returned to warehouse
            </div>
            {order.failureReason && (
              <div className="text-xs text-zinc-600 mt-0.5">
                {order.failureReason.replace(/_/g, " ")}
              </div>
            )}
            {order.failedAt && (
              <div className="text-xs text-zinc-500 mt-1">
                {fmtDateTime(order.failedAt)}
              </div>
            )}
            {order.returnVerifiedAt ? (
              <div className="text-xs text-emerald-700 mt-1">
                Verified {fmtDateTime(order.returnVerifiedAt)}
              </div>
            ) : (
              <div className="text-xs text-amber-700 mt-1">
                Awaiting admin verification
              </div>
            )}
          </div>
        </div>
        {order.deliveryAttempts > 0 && (
          <p className="text-xs text-zinc-500 flex items-center gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            {order.deliveryAttempts} delivery attempt
            {order.deliveryAttempts === 1 ? "" : "s"}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        {FULFILLMENT_STEPS.map((step, i) => {
          const done = isDelivered ? true : i <= currentIndex;
          const current = !isDelivered && i === currentIndex;
          return (
            <div key={step} className="contents">
              <div className="flex flex-col items-center flex-1 min-w-0">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
                    done
                      ? "bg-zinc-900 border-zinc-900 text-white"
                      : "bg-white border-zinc-300 text-zinc-400"
                  } ${current ? "ring-4 ring-zinc-200" : ""}`}
                >
                  {done ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <CircleDashed className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={`mt-2 text-[11px] font-medium text-center ${
                    done ? "text-zinc-900" : "text-zinc-400"
                  }`}
                >
                  {statusLabel(step)}
                </div>
              </div>
              {i < FULFILLMENT_STEPS.length - 1 && (
                <div
                  className={`h-px flex-1 min-w-2 ${
                    i < currentIndex || isDelivered
                      ? "bg-zinc-900"
                      : "bg-zinc-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      {order.deliveryAttempts > 1 && (
        <p className="text-xs text-zinc-500 flex items-center gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" />
          {order.deliveryAttempts} delivery attempts
        </p>
      )}
      {currentIndex >= FULFILLMENT_STEPS.indexOf("picked_up") && (
        <p className="text-xs text-zinc-500">
          Pickup and transit updates come from the rider app.
        </p>
      )}
    </div>
  );
}
