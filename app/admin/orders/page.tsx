"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type OrderRow = {
  id: string;
  order_number: string;
  order_status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customers: any;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Хүлээгдэж буй",
  confirmed: "Баталгаажсан",
  processing: "Бэлтгэж буй",
  shipped: "Хүргэлтэнд гарсан",
  delivered: "Хүргэгдсэн",
  cancelled: "Цуцлагдсан",
};

const PAYMENT_LABELS: Record<string, string> = {
  unpaid: "Төлөгдөөгүй",
  paid: "Төлөгдсөн",
  refunded: "Буцаагдсан",
};

function formatPrice(price: number): string {
  return price.toLocaleString("mn-MN") + "₮";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("mn-MN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusColor(status: string): string {
  switch (status) {
    case "delivered":
    case "paid":
      return "bg-green-100 text-green-700";
    case "cancelled":
    case "refunded":
      return "bg-red-100 text-red-700";
    case "shipped":
    case "processing":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-yellow-100 text-yellow-700";
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function fetchOrders() {
      let query = supabase
        .from("orders")
        .select("id, order_number, order_status, payment_status, total_amount, created_at, customers(full_name, phone)")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("order_status", filter);
      }

      const { data } = await query;
      setOrders(data ?? []);
      setLoading(false);
    }

    fetchOrders();
  }, [filter]);

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-zinc-900">Захиалгууд</h2>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { key: "all", label: "Бүгд" },
          { key: "pending", label: "Хүлээгдэж буй" },
          { key: "confirmed", label: "Баталгаажсан" },
          { key: "processing", label: "Бэлтгэж буй" },
          { key: "shipped", label: "Хүргэлтэнд" },
          { key: "delivered", label: "Хүргэгдсэн" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setLoading(true); }}
            className={`rounded-full px-3 py-1 text-sm ${
              filter === f.key
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-zinc-500">Уншиж байна...</p>
      ) : orders.length === 0 ? (
        <p className="text-zinc-500">Захиалга байхгүй</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-zinc-500">
                <th className="pb-2 pr-4">Дугаар</th>
                <th className="pb-2 pr-4">Захиалагч</th>
                <th className="pb-2 pr-4">Төлөв</th>
                <th className="pb-2 pr-4">Төлбөр</th>
                <th className="pb-2 pr-4 text-right">Дүн</th>
                <th className="pb-2">Огноо</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-50">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-mono font-medium text-zinc-900 hover:underline"
                    >
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">
                    <p className="text-zinc-900">
                      {order.customers?.full_name ?? "-"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {order.customers?.phone ?? ""}
                    </p>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(order.order_status)}`}
                    >
                      {STATUS_LABELS[order.order_status] ?? order.order_status}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(order.payment_status)}`}
                    >
                      {PAYMENT_LABELS[order.payment_status] ?? order.payment_status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right font-medium text-zinc-900">
                    {formatPrice(order.total_amount)}
                  </td>
                  <td className="py-3 text-zinc-500">
                    {formatDate(order.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
