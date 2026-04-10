"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setAuthenticated(true);
      } else if (pathname !== "/admin/login") {
        router.push("/admin/login");
      }
      setChecking(false);
    }

    checkAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
          if (pathname !== "/admin/login") {
            router.push("/admin/login");
          }
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [router, pathname]);

  if (checking) {
    return (
      <div className="py-16 text-center text-zinc-500">Уншиж байна...</div>
    );
  }

  // Login page - no admin nav
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Admin nav */}
      <div className="mb-6 flex items-center justify-between border-b border-zinc-200 pb-4">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-bold text-zinc-900">Админ</h1>
          <Link
            href="/admin"
            className={`text-sm ${pathname === "/admin" ? "font-medium text-zinc-900" : "text-zinc-500 hover:text-zinc-900"}`}
          >
            Dashboard
          </Link>
          <Link
            href="/admin/orders"
            className={`text-sm ${pathname.startsWith("/admin/orders") ? "font-medium text-zinc-900" : "text-zinc-500 hover:text-zinc-900"}`}
          >
            Захиалга
          </Link>
          <Link
            href="/admin/products"
            className={`text-sm ${pathname.startsWith("/admin/products") ? "font-medium text-zinc-900" : "text-zinc-500 hover:text-zinc-900"}`}
          >
            Бүтээгдэхүүн
          </Link>
          <Link
            href="/admin/categories"
            className={`text-sm ${pathname.startsWith("/admin/categories") ? "font-medium text-zinc-900" : "text-zinc-500 hover:text-zinc-900"}`}
          >
            Категори
          </Link>
        </div>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/admin/login");
          }}
          className="text-sm text-red-500 hover:text-red-700"
        >
          Гарах
        </button>
      </div>

      {children}
    </div>
  );
}
