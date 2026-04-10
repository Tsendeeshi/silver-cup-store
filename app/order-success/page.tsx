"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <div className="mb-6 text-5xl">✓</div>
      <h1 className="mb-2 text-2xl font-bold text-zinc-900">
        Захиалга амжилттай!
      </h1>
      {orderNumber && (
        <p className="mb-4 text-zinc-600">
          Захиалгын дугаар:{" "}
          <span className="font-mono font-bold">{orderNumber}</span>
        </p>
      )}
      <p className="mb-8 text-zinc-500">
        Бид тантай удахгүй холбогдох болно. Баярлалаа!
      </p>
      <div className="flex flex-col items-center gap-3">
        <Link
          href="/orders"
          className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Захиалга шалгах
        </Link>
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          Нүүр хуудас руу буцах
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-xl px-4 py-16 text-center text-zinc-500">
          Уншиж байна...
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
