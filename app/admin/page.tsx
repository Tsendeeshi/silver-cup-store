"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Stats = {
  todayOrders: number;
  todayRevenue: number;
  monthOrders: number;
  monthRevenue: number;
  pendingPayment: number;
  pendingDelivery: number;
  lowStockVariants: LowStockItem[];
  recentOrders: RecentOrder[];
};

type LowStockItem = {
  id: string;
  sku: string;
  size: string;
  color: string;
  price: number;
  stock_qty: number;
  product_name: string;
};

type RecentOrder = {
  id: string;
  order_number: string;
  order_status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  customer_name: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Хүлээгдэж буй",
  confirmed: "Баталгаажсан",
  processing: "Бэлтгэж буй",
  shipped: "Хүргэлтэнд",
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

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      const now = new Date();
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ).toISOString();
      const monthStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      ).toISOString();

      // Fetch all data in parallel
      const [
        todayOrdersRes,
        monthOrdersRes,
        pendingPaymentRes,
        pendingDeliveryRes,
        lowStockRes,
        recentOrdersRes,
      ] = await Promise.all([
        // Today's orders
        supabase
          .from("orders")
          .select("total_amount")
          .gte("created_at", todayStart)
          .neq("order_status", "cancelled"),

        // Month orders
        supabase
          .from("orders")
          .select("total_amount")
          .gte("created_at", monthStart)
          .neq("order_status", "cancelled"),

        // Pending payment
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("payment_status", "unpaid")
          .neq("order_status", "cancelled"),

        // Pending delivery (confirmed or processing)
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .in("order_status", ["confirmed", "processing"])
          .eq("payment_status", "paid"),

        // Low stock variants (stock <= 3)
        supabase
          .from("product_variant_view")
          .select(
            "variant_id, sku, size, color, price, stock_qty, product_name"
          )
          .lte("stock_qty", 3)
          .eq("variant_is_active", true)
          .order("stock_qty", { ascending: true })
          .limit(10),

        // Recent orders
        supabase
          .from("orders")
          .select(
            "id, order_number, order_status, payment_status, total_amount, created_at, customers(full_name)"
          )
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const todayOrders = todayOrdersRes.data ?? [];
      const monthOrders = monthOrdersRes.data ?? [];

      const recentOrders: RecentOrder[] = (recentOrdersRes.data ?? []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (o: any) => ({
          id: o.id,
          order_number: o.order_number,
          order_status: o.order_status,
          payment_status: o.payment_status,
          total_amount: o.total_amount,
          created_at: o.created_at,
          customer_name: o.customers?.full_name ?? "-",
        })
      );

      const lowStockVariants: LowStockItem[] = (lowStockRes.data ?? []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (v: any) => ({
          id: v.variant_id,
          sku: v.sku,
          size: v.size,
          color: v.color,
          price: v.price,
          stock_qty: v.stock_qty,
          product_name: v.product_name,
        })
      );

      setStats({
        todayOrders: todayOrders.length,
        todayRevenue: todayOrders.reduce(
          (sum, o) => sum + (o.total_amount ?? 0),
          0
        ),
        monthOrders: monthOrders.length,
        monthRevenue: monthOrders.reduce(
          (sum, o) => sum + (o.total_amount ?? 0),
          0
        ),
        pendingPayment: pendingPaymentRes.count ?? 0,
        pendingDelivery: pendingDeliveryRes.count ?? 0,
        lowStockVariants,
        recentOrders,
      });

      setLoading(false);
    }

    fetchDashboard();
  }, []);

  if (loading) {
    return <p className="text-zinc-500">Уншиж байна...</p>;
  }

  if (!stats) {
    return <p className="text-red-500">Алдаа гарлаа</p>;
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-zinc-900">Dashboard</h2>

      {/* Stats cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">
            Өнөөдрийн захиалга
          </p>
          <p className="mt-2 text-2xl font-bold text-zinc-900">
            {stats.todayOrders}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {formatPrice(stats.todayRevenue)}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">
            Энэ сарын борлуулалт
          </p>
          <p className="mt-2 text-2xl font-bold text-zinc-900">
            {stats.monthOrders}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {formatPrice(stats.monthRevenue)}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">
            Төлбөр хүлээгдэж буй
          </p>
          <p className="mt-2 text-2xl font-bold text-yellow-600">
            {stats.pendingPayment}
          </p>
          <Link
            href="/admin/orders"
            className="mt-1 text-xs text-zinc-400 hover:text-zinc-600"
          >
            Захиалга харах →
          </Link>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">
            Хүргэлт хүлээгдэж буй
          </p>
          <p className="mt-2 text-2xl font-bold text-blue-600">
            {stats.pendingDelivery}
          </p>
          <Link
            href="/admin/orders"
            className="mt-1 text-xs text-zinc-400 hover:text-zinc-600"
          >
            Захиалга харах →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent orders */}
        <div className="lg:col-span-2 rounded-lg border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <h3 className="font-medium text-zinc-900">Сүүлийн захиалгууд</h3>
            <Link
              href="/admin/orders"
              className="text-xs text-zinc-400 hover:text-zinc-600"
            >
              Бүгдийг харах →
            </Link>
          </div>
          <div className="divide-y divide-zinc-50">
            {stats.recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-medium text-zinc-900">
                      {order.order_number}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor(order.order_status)}`}
                    >
                      {STATUS_LABELS[order.order_status] ?? order.order_status}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor(order.payment_status)}`}
                    >
                      {PAYMENT_LABELS[order.payment_status] ??
                        order.payment_status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    {order.customer_name} · {formatDate(order.created_at)}
                  </p>
                </div>
                <p className="font-medium text-zinc-900">
                  {formatPrice(order.total_amount)}
                </p>
              </Link>
            ))}
            {stats.recentOrders.length === 0 && (
              <p className="px-5 py-6 text-center text-sm text-zinc-400">
                Захиалга байхгүй
              </p>
            )}
          </div>
        </div>

        {/* Low stock */}
        <div className="rounded-lg border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <h3 className="font-medium text-zinc-900">Нөөц дуусаж буй</h3>
            <span className="text-xs text-zinc-400">≤ 3 ширхэг</span>
          </div>
          <div className="divide-y divide-zinc-50">
            {stats.lowStockVariants.map((v) => (
              <div key={v.id} className="px-5 py-3">
                <p className="text-sm text-zinc-900">{v.product_name}</p>
                <div className="mt-0.5 flex items-center justify-between">
                  <p className="text-xs text-zinc-400">
                    {v.color} / {v.size}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      v.stock_qty === 0
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {v.stock_qty === 0 ? "Дууссан" : `${v.stock_qty} үлдсэн`}
                  </span>
                </div>
              </div>
            ))}
            {stats.lowStockVariants.length === 0 && (
              <p className="px-5 py-6 text-center text-sm text-zinc-400">
                Бүгд хангалттай нөөцтэй
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
