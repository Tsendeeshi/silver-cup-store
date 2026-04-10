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
  updated_at: string;
  customers: { full_name: string; phone: string } | null;
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

const STATUS_STEPS = [
  { key: "pending", label: "Хүлээгдэж буй" },
  { key: "confirmed", label: "Баталгаажсан" },
  { key: "processing", label: "Бэлтгэж буй" },
  { key: "shipped", label: "Хүргэлтэнд гарсан" },
  { key: "delivered", label: "Хүргэгдсэн" },
];

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

function paymentColor(status: string): string {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-700";
    case "refunded":
      return "bg-red-100 text-red-700";
    default:
      return "bg-yellow-100 text-yellow-700";
  }
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      const { data, error: orderError } = await supabase
        .from("orders")
        .select("*, customers(full_name, phone)")
        .eq("id", orderId)
        .single();

      if (orderError || !data) {
        setError("Захиалга олдсонгүй");
        setLoading(false);
        return;
      }

      setOrder(data);

      const { data: orderItems } = await supabase
        .from("order_items")
        .select("id, product_name, color, size, qty, unit_price, line_total")
        .eq("order_id", orderId);

      setItems(orderItems ?? []);
      setLoading(false);
    }

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-zinc-500">
        Уншиж байна...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="mb-4 text-red-500">{error}</p>
        <Link href="/orders" className="text-sm text-zinc-600 hover:text-zinc-900">
          Захиалга шалгах хуудас руу буцах
        </Link>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex(
    (s) => s.key === order.order_status
  );
  const isCancelled = order.order_status === "cancelled";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/orders"
        className="mb-6 inline-block text-sm text-zinc-500 hover:text-zinc-900"
      >
        ← Захиалгууд руу буцах
      </Link>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            {order.order_number}
          </h1>
          <p className="text-sm text-zinc-500">{formatDate(order.created_at)}</p>
        </div>
        <span
          className={`inline-block w-fit rounded-full px-3 py-1 text-sm font-medium ${paymentColor(order.payment_status)}`}
        >
          {PAYMENT_LABELS[order.payment_status] ?? order.payment_status}
        </span>
      </div>

      {/* Status timeline */}
      {isCancelled ? (
        <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-700">
          Захиалга цуцлагдсан
        </div>
      ) : (
        <div className="mb-8">
          <h2 className="mb-4 text-sm font-medium text-zinc-700">
            Захиалгын төлөв
          </h2>
          <div className="flex items-center">
            {STATUS_STEPS.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              return (
                <div key={step.key} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : "bg-zinc-200 text-zinc-500"
                      } ${isCurrent ? "ring-2 ring-green-300" : ""}`}
                    >
                      {isCompleted ? "✓" : index + 1}
                    </div>
                    <span
                      className={`mt-1 text-center text-xs ${
                        isCompleted
                          ? "font-medium text-green-700"
                          : "text-zinc-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < STATUS_STEPS.length - 1 && (
                    <div
                      className={`mx-1 h-0.5 flex-1 ${
                        index < currentStepIndex ? "bg-green-500" : "bg-zinc-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Order items */}
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-medium text-zinc-700">Бүтээгдэхүүн</h2>
        <div className="rounded-lg border border-zinc-200 bg-white divide-y divide-zinc-100">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3">
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
      </div>

      {/* Summary */}
      <div className="mb-8 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex justify-between text-sm text-zinc-600">
          <span>Дэд дүн</span>
          <span>{formatPrice(order.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-zinc-600">
          <span>Хүргэлт</span>
          <span>
            {order.shipping_fee === 0 ? "Үнэгүй" : formatPrice(order.shipping_fee)}
          </span>
        </div>
        <div className="mt-2 flex justify-between border-t border-zinc-200 pt-2 font-bold text-zinc-900">
          <span>Нийт</span>
          <span>{formatPrice(order.total_amount)}</span>
        </div>
      </div>

      {/* Delivery info */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-700">Хүргэлтийн мэдээлэл</h2>
        {order.customers && (
          <>
            <p className="text-sm text-zinc-900">{order.customers.full_name}</p>
            <p className="text-sm text-zinc-500">{order.customers.phone}</p>
          </>
        )}
        <p className="mt-2 text-sm text-zinc-900">{order.delivery_address}</p>
        {order.delivery_note && (
          <p className="mt-1 text-sm text-zinc-500">
            Тэмдэглэл: {order.delivery_note}
          </p>
        )}
      </div>
    </div>
  );
}
