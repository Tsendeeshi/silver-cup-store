"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/lib/cart-store";

function formatPrice(price: number): string {
  return price.toLocaleString("mn-MN") + "₮";
}

function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SC-${date}-${rand}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const clearCart = useCartStore((s) => s.clearCart);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shippingFee = 0;
  const subtotal = totalPrice();
  const total = subtotal + shippingFee;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="mb-4 text-zinc-500">Сагс хоосон байна</p>
        <Link
          href="/"
          className="text-sm font-medium text-zinc-900 hover:underline"
        >
          Бүтээгдэхүүн үзэх
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // 1. Create or find customer
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .upsert(
          { full_name: fullName, phone, email: email || null },
          { onConflict: "phone" }
        )
        .select("id")
        .single();

      if (customerError) throw new Error("Хэрэглэгч үүсгэхэд алдаа: " + customerError.message);

      // 2. Create order
      const orderNumber = generateOrderNumber();
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_id: customer.id,
          order_status: "pending",
          payment_status: "unpaid",
          subtotal,
          shipping_fee: shippingFee,
          total_amount: total,
          delivery_address: address,
          delivery_note: note || null,
        })
        .select("id")
        .single();

      if (orderError) throw new Error("Захиалга үүсгэхэд алдаа: " + orderError.message);

      // 3. Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name: item.product_name,
        color: item.color,
        size: item.size,
        qty: item.qty,
        unit_price: item.price,
        line_total: item.price * item.qty,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw new Error("Захиалгын бараа нэмэхэд алдаа: " + itemsError.message);

      // 4. Clear cart and redirect to payment
      clearCart();
      router.push(`/payment/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">Захиалга</h1>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
        {/* Form */}
        <form onSubmit={handleSubmit} className="md:col-span-3 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Нэр *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
              placeholder="Овог нэр"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Утасны дугаар *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
              placeholder="9911-2233"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              И-мэйл
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
              placeholder="example@mail.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Хүргэлтийн хаяг *
            </label>
            <textarea
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
              placeholder="Дүүрэг, хороо, байр, тоот"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Нэмэлт тэмдэглэл
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
              placeholder="Хүргэлттэй холбоотой тэмдэглэл..."
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className={`w-full rounded-lg px-6 py-3 text-base font-medium transition-colors ${
              submitting
                ? "bg-zinc-400 text-white"
                : "bg-zinc-900 text-white hover:bg-zinc-800"
            }`}
          >
            {submitting ? "Илгээж байна..." : `Захиалах - ${formatPrice(total)}`}
          </button>
        </form>

        {/* Order summary */}
        <div className="md:col-span-2">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <h2 className="mb-4 font-medium text-zinc-900">Таны сагс</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.variant_id} className="flex justify-between text-sm">
                  <div>
                    <p className="text-zinc-700">{item.product_name}</p>
                    <p className="text-zinc-500">
                      {item.color} / {item.size} x {item.qty}
                    </p>
                  </div>
                  <p className="font-medium text-zinc-900">
                    {formatPrice(item.price * item.qty)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-zinc-200 pt-4">
              <div className="flex justify-between text-sm text-zinc-600">
                <span>Дэд дүн</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-600">
                <span>Хүргэлт</span>
                <span>{shippingFee === 0 ? "Үнэгүй" : formatPrice(shippingFee)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-zinc-200 pt-2 font-bold text-zinc-900">
                <span>Нийт</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
