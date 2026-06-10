"use client";

import Image from "next/image";
import { fmtDate, fmtDateTime, formatMoney, statusLabel } from "@/lib/format";
import type { Order } from "@/types";

export function OrderPrintSheet({ order }: { order: Order }) {
  const isPaid = order.paymentStatus === "paid";

  return (
    <div id="order-print-sheet" className="hidden print:block">
      <div className="p-8 max-w-[210mm] mx-auto text-zinc-900 text-sm">
        <header className="flex items-start justify-between border-b border-zinc-300 pb-6 mb-6">
          <div>
            <Image
              src="/logos/unap_logo_black.png"
              alt="Unapologetic"
              width={140}
              height={40}
              className="h-10 w-auto mb-3"
            />
            <p className="text-xs text-zinc-600">
              Unapologetic Store
              <br />
              Accra, Ghana
              <br />
              orders@unapologetic.store
            </p>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-semibold tracking-tight">INVOICE</h1>
            <p className="text-xs text-zinc-600 mt-2">
              {order.id}
              <br />
              {order.trackingNumber}
              <br />
              {fmtDate(order.createdAt)}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
              Bill to
            </p>
            <p className="font-medium">{order.customerName}</p>
            <p className="text-zinc-600">{order.customerEmail}</p>
            <p className="text-zinc-600">{order.customerPhone}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
              Ship to
            </p>
            <p className="font-medium">
              {order.shippingAddress.firstName}{" "}
              {order.shippingAddress.lastName}
            </p>
            <p>{order.shippingAddress.address}</p>
            {order.shippingAddress.address2 && (
              <p>{order.shippingAddress.address2}</p>
            )}
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.region}
            </p>
            <p>{order.shippingAddress.country}</p>
            <p className="text-zinc-600">{order.shippingAddress.phone}</p>
          </div>
        </div>

        <table className="w-full mb-6 text-sm">
          <thead>
            <tr className="border-b border-zinc-300 text-left text-xs uppercase tracking-wide text-zinc-500">
              <th className="py-2 pr-4">Item</th>
              <th className="py-2 pr-4">Variant</th>
              <th className="py-2 pr-4 text-center">Qty</th>
              <th className="py-2 pr-4 text-right">Unit</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it, i) => (
              <tr key={`${it.productId}-${i}`} className="border-b border-zinc-100">
                <td className="py-3 pr-4">{it.productName}</td>
                <td className="py-3 pr-4 text-zinc-600">
                  {it.colorName} · {it.size}
                </td>
                <td className="py-3 pr-4 text-center">{it.quantity}</td>
                <td className="py-3 pr-4 text-right">{formatMoney(it.unitPrice)}</td>
                <td className="py-3 text-right">{formatMoney(it.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-8">
          <div className="w-56 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-zinc-600">Subtotal</span>
              <span>{formatMoney(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Shipping</span>
              <span>{formatMoney(order.shippingFee)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount</span>
                <span>- {formatMoney(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-base border-t border-zinc-300 pt-2 mt-2">
              <span>Total</span>
              <span>{formatMoney(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-zinc-500 border-t border-zinc-200 pt-4">
          All amounts in Ghana cedis. International payments are
          converted at checkout.
        </div>

        {isPaid && (
          <div className="mt-10 border-t-2 border-dashed border-zinc-400 pt-8">
            <header className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  PAYMENT RECEIPT
                </h2>
                <p className="text-xs text-zinc-600 mt-1">
                  Proof of payment for {order.id}
                </p>
              </div>
              <div className="text-right text-xs">
                <p className="font-semibold text-emerald-700 uppercase">Paid</p>
                <p className="text-zinc-600">{fmtDateTime(order.updatedAt)}</p>
              </div>
            </header>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-zinc-500 text-xs uppercase mb-1">Amount</p>
                <p className="font-semibold text-lg">{formatMoney(order.total)}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs uppercase mb-1">Method</p>
                <p className="font-medium uppercase">{order.paymentMethod}</p>
              </div>
              {order.paymentReference && (
                <div className="col-span-2">
                  <p className="text-zinc-500 text-xs uppercase mb-1">
                    Reference
                  </p>
                  <p className="font-mono text-xs">{order.paymentReference}</p>
                </div>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-6">
              Thank you for shopping with Unapologetic.
            </p>
          </div>
        )}

        {/* <footer className="mt-10 text-center text-xs text-zinc-400">
          Order status: {statusLabel(order.status)} · Printed{" "}
          {fmtDateTime(new Date())}
        </footer> */}
      </div>
    </div>
  );
}

export function printOrderDocument() {
  window.print();
}
