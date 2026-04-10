"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type BankUrl = {
  name: string;
  description: string;
  logo: string;
  link: string;
};

function formatPrice(price: number): string {
  return price.toLocaleString("mn-MN") + "₮";
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [qrImage, setQrImage] = useState<string | null>(null);
  const [bankUrls, setBankUrls] = useState<BankUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>("pending");

  // Create invoice
  useEffect(() => {
    async function createInvoice() {
      try {
        const res = await fetch("/api/qpay/create-invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "QPay invoice үүсгэхэд алдаа гарлаа");
          setLoading(false);
          return;
        }

        setQrImage(data.qr_image);
        setBankUrls(data.urls ?? []);
        setLoading(false);
      } catch {
        setError("Сервертэй холбогдож чадсангүй");
        setLoading(false);
      }
    }

    createInvoice();
  }, [orderId]);

  // Poll payment status every 3 seconds
  const checkPaymentStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/qpay/check-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();

      if (data.status === "paid") {
        setPaymentStatus("paid");
        setTimeout(() => {
          router.push(`/order-success?order=${orderId}`);
        }, 2000);
      }
    } catch {
      // Polling error, will retry
    }
  }, [orderId, router]);

  useEffect(() => {
    if (paymentStatus === "paid" || loading || error) return;

    const interval = setInterval(checkPaymentStatus, 3000);
    return () => clearInterval(interval);
  }, [paymentStatus, loading, error, checkPaymentStatus]);

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-zinc-500">
        QPay invoice үүсгэж байна...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="mb-4 text-red-500">{error}</p>
        <Link href="/" className="text-sm text-zinc-600 hover:text-zinc-900">
          Нүүр хуудас руу буцах
        </Link>
      </div>
    );
  }

  if (paymentStatus === "paid") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mb-4 text-5xl">✓</div>
        <h1 className="mb-2 text-2xl font-bold text-green-600">
          Төлбөр амжилттай!
        </h1>
        <p className="text-zinc-500">Захиалгын хуудас руу шилжиж байна...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-center text-2xl font-bold text-zinc-900">
        Төлбөр төлөх
      </h1>

      {/* QR Code */}
      {qrImage && (
        <div className="mb-6 flex flex-col items-center">
          <p className="mb-3 text-sm text-zinc-500">
            QR кодыг банкны апп-аар уншуулна уу
          </p>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <img
              src={`data:image/png;base64,${qrImage}`}
              alt="QPay QR Code"
              className="h-64 w-64"
            />
          </div>
        </div>
      )}

      {/* Bank app links */}
      {bankUrls.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-center text-sm text-zinc-500">
            Эсвэл банкны апп-аа сонгоно уу
          </p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {bankUrls.map((bank) => (
              <a
                key={bank.name}
                href={bank.link}
                className="flex flex-col items-center gap-1 rounded-lg border border-zinc-200 bg-white p-3 text-center transition-shadow hover:shadow-md"
              >
                {bank.logo && (
                  <img
                    src={bank.logo}
                    alt={bank.name}
                    className="h-10 w-10 rounded-md"
                  />
                )}
                <span className="text-xs text-zinc-700">{bank.name}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center">
        <p className="text-sm text-yellow-700">
          Төлбөр хүлээж байна... Төлбөр төлөгдсөний дараа автоматаар шилжинэ.
        </p>
      </div>
    </div>
  );
}
