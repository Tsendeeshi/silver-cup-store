"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";

function formatPrice(price: number): string {
  return price.toLocaleString("mn-MN") + "₮";
}

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const totalPrice = useCartStore((s) => s.totalPrice);

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">Сагс</h1>

      <div className="divide-y divide-zinc-200 border-y border-zinc-200">
        {items.map((item) => (
          <div
            key={item.variant_id}
            className="flex items-center gap-4 py-4"
          >
            {/* Image */}
            <div className="h-20 w-20 flex-shrink-0 rounded-md bg-zinc-100 flex items-center justify-center">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.product_name}
                  className="h-full w-full rounded-md object-cover"
                />
              ) : (
                <span className="text-2xl text-zinc-300">🏆</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <Link
                href={`/products/${item.slug}`}
                className="font-medium text-zinc-900 hover:underline"
              >
                {item.product_name}
              </Link>
              <p className="text-sm text-zinc-500">
                {item.color} / {item.size}
              </p>
              <p className="text-sm font-medium text-zinc-900">
                {formatPrice(item.price)}
              </p>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQty(item.variant_id, item.qty - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-300 text-zinc-600 hover:bg-zinc-50"
              >
                -
              </button>
              <span className="w-8 text-center text-sm font-medium">
                {item.qty}
              </span>
              <button
                onClick={() => updateQty(item.variant_id, item.qty + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-300 text-zinc-600 hover:bg-zinc-50"
              >
                +
              </button>
            </div>

            {/* Line total */}
            <div className="w-24 text-right">
              <p className="font-medium text-zinc-900">
                {formatPrice(item.price * item.qty)}
              </p>
            </div>

            {/* Remove */}
            <button
              onClick={() => removeItem(item.variant_id)}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Устгах
            </button>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 flex items-center justify-between border-t border-zinc-200 pt-6">
        <p className="text-lg font-bold text-zinc-900">Нийт дүн</p>
        <p className="text-lg font-bold text-zinc-900">
          {formatPrice(totalPrice())}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/"
          className="rounded-lg border border-zinc-300 px-6 py-3 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Үргэлжлүүлэн худалдаалах
        </Link>
        <Link
          href="/checkout"
          className="rounded-lg bg-zinc-900 px-6 py-3 text-center text-sm font-medium text-white hover:bg-zinc-800"
        >
          Захиалга өгөх
        </Link>
      </div>
    </div>
  );
}
