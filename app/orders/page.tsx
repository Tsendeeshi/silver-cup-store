"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type OrderSummary = {
  id: string;
  order_number: string;
  order_status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
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
    year: "numeric",
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

export default function OrdersPage() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data: customers } = await supabase
      .from("customers")
      .select("id")
      .eq("phone", phone)
      .single();

    if (!customers) {
      setOrders([]);
      setSearched(true);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("orders")
      .select("id, order_number, order_status, payment_status, total_amount, created_at")
      .eq("customer_id", customers.id)
      .order("created_at", { ascending: false });

    setOrders(data ?? []);
    setSearched(true);
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">
        Захиалга шалгах
      </h1>

      <form onSubmit={handleSearch} className="mb-8 flex gap-3">
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Утасны дугаар оруулна уу"
          className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-zinc-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          {loading ? "Хайж байна..." : "Хайх"}
        </button>
      </form>

      {searched && orders.length === 0 && (
        <p className="text-center text-zinc-500">
          Энэ дугаараар захиалга олдсонгүй.
        </p>
      )}

      {orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block rounded-lg border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-zinc-900">
                  {order.order_number}
                </span>
                <span className="text-sm text-zinc-500">
                  {formatDate(order.created_at)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(order.order_status)}`}
                  >
                    {STATUS_LABELS[order.order_status] ?? order.order_status}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(order.payment_status)}`}
                  >
                    {PAYMENT_LABELS[order.payment_status] ?? order.payment_status}
                  </span>
                </div>
                <span className="font-bold text-zinc-900">
                  {formatPrice(order.total_amount)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
