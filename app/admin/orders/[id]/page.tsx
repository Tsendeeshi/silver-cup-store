"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Order = {
  id: string;
  order_number: string;
  order_status: string;
  payment_status: string;
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  delivery_address: string;
  delivery_note: string | null;
  created_at: string;
  customers: { full_name: string; phone: string; email: string | null } | null;
};

type OrderItem = {
  id: string;
  product_name: string;
  color: string;
  size: string;
  qty: number;
  unit_price: number;
  line_total: number;
};

const ORDER_STATUSES = [
  { key: "pending", label: "Хүлээгдэж буй" },
  { key: "confirmed", label: "Баталгаажсан" },
  { key: "processing", label: "Бэлтгэж буй" },
  { key: "shipped", label: "Хүргэлтэнд гарсан" },
  { key: "delivered", label: "Хүргэгдсэн" },
  { key: "cancelled", label: "Цуцлагдсан" },
];

const PAYMENT_STATUSES = [
  { key: "unpaid", label: "Төлөгдөөгүй" },
  { key: "paid", label: "Төлөгдсөн" },
  { key: "refunded", label: "Буцаагдсан" },
];

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

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      const { data } = await supabase
        .from("orders")
        .select("*, customers(full_name, phone, email)")
        .eq("id", orderId)
        .single();

      if (data) setOrder(data);

      const { data: orderItems } = await supabase
        .from("order_items")
        .select("id, product_name, color, size, qty, unit_price, line_total")
        .eq("order_id", orderId);

      setItems(orderItems ?? []);
      setLoading(false);
    }

    fetchOrder();
  }, [orderId]);

  async function updateStatus(field: string, value: string) {
    setSaving(true);
    setMessage(null);

    const { error } = await supabase
      .from("orders")
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) {
      setMessage("Алдаа: " + error.message);
    } else {
      setOrder((prev) => (prev ? { ...prev, [field]: value } : prev));
      setMessage("Амжилттай хадгалагдлаа");
      setTimeout(() => setMessage(null), 3000);
    }

    setSaving(false);
  }

  if (loading) {
    return <p className="text-zinc-500">Уншиж байна...</p>;
  }

  if (!order) {
    return <p className="text-red-500">Захиалга олдсонгүй</p>;
  }

  return (
    <div>
      <Link
        href="/admin"
        className="mb-4 inline-block text-sm text-zinc-500 hover:text-zinc-900"
      >
        ← Захиалгууд руу буцах
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-zinc-900">
          {order.order_number}
        </h2>
        <span className="text-sm text-zinc-500">
          {formatDate(order.created_at)}
        </span>
      </div>

      {message && (
        <div
          className={`mb-4 rounded-lg p-3 text-sm ${
            message.startsWith("Алдаа")
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Status controls */}
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h3 className="mb-4 font-medium text-zinc-900">Төлөв удирдах</h3>

          <div className="mb-4">
            <label className="mb-1 block text-sm text-zinc-600">
              Захиалгын төлөв
            </label>
            <select
              value={order.order_status}
              onChange={(e) => updateStatus("order_status", e.target.value)}
              disabled={saving}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-600">
              Төлбөрийн төлөв
            </label>
            <select
              value={order.payment_status}
              onChange={(e) => updateStatus("payment_status", e.target.value)}
              disabled={saving}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
            >
              {PAYMENT_STATUSES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Customer info */}
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h3 className="mb-4 font-medium text-zinc-900">Захиалагч</h3>
          {order.customers && (
            <div className="space-y-1 text-sm">
              <p className="text-zinc-900">{order.customers.full_name}</p>
              <p className="text-zinc-600">{order.customers.phone}</p>
              {order.customers.email && (
                <p className="text-zinc-600">{order.customers.email}</p>
              )}
            </div>
          )}

          <h3 className="mb-2 mt-4 font-medium text-zinc-900">Хүргэлтийн хаяг</h3>
          <p className="text-sm text-zinc-700">{order.delivery_address}</p>
          {order.delivery_note && (
            <p className="mt-1 text-sm text-zinc-500">
              Тэмдэглэл: {order.delivery_note}
            </p>
          )}
        </div>
      </div>

      {/* Order items */}
      <div className="mt-6 rounded-lg border border-zinc-200 bg-white">
        <h3 className="border-b border-zinc-200 p-4 font-medium text-zinc-900">
          Бүтээгдэхүүн
        </h3>
        <div className="divide-y divide-zinc-100">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-zinc-900">{item.product_name}</p>
                <p className="text-sm text-zinc-500">
                  {item.color} / {item.size} x {item.qty}
                </p>
              </div>
              <p className="font-medium text-zinc-900">
                {formatPrice(item.line_total)}
              </p>
            </div>
          ))}
        </div>
        <div className="border-t border-zinc-200 p-4">
          <div className="flex justify-between text-sm text-zinc-600">
            <span>Дэд дүн</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-zinc-600">
            <span>Хүргэлт</span>
            <span>
              {order.shipping_fee === 0
                ? "Үнэгүй"
                : formatPrice(order.shipping_fee)}
            </span>
          </div>
          <div className="mt-2 flex justify-between border-t border-zinc-200 pt-2 font-bold text-zinc-900">
            <span>Нийт</span>
            <span>{formatPrice(order.total_amount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
