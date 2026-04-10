"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";

export default function CartBadge() {
  const count = useCartStore((s) =>
    s.items.reduce((sum, i) => sum + i.qty, 0)
  );

  return (
    <Link
      href="/cart"
      className="relative text-xs tracking-widest text-zinc-600 uppercase hover:text-gold transition-colors"
    >
      Сагс
      {count > 0 && (
        <span className="absolute -right-4 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] font-medium text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
