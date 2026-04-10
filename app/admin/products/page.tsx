"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  base_price: number;
  is_active: boolean;
};

function formatPrice(price: number): string {
  return price.toLocaleString("mn-MN") + "₮";
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, category, base_price, is_active")
        .order("created_at", { ascending: false });

      setProducts(data ?? []);
      setLoading(false);
    }

    fetchProducts();
  }, []);

  async function toggleActive(id: string, currentActive: boolean) {
    await supabase
      .from("products")
      .update({ is_active: !currentActive })
      .eq("id", id);

    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: !currentActive } : p))
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-zinc-900">Бүтээгдэхүүн</h2>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          + Нэмэх
        </Link>
      </div>

      {loading ? (
        <p className="text-zinc-500">Уншиж байна...</p>
      ) : products.length === 0 ? (
        <p className="text-zinc-500">Бүтээгдэхүүн байхгүй</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-zinc-500">
                <th className="pb-2 pr-4">Нэр</th>
                <th className="pb-2 pr-4">Slug</th>
                <th className="pb-2 pr-4">Төрөл</th>
                <th className="pb-2 pr-4 text-right">Үнэ</th>
                <th className="pb-2 pr-4">Идэвхтэй</th>
                <th className="pb-2">Үйлдэл</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-zinc-50">
                  <td className="py-3 pr-4 font-medium text-zinc-900">
                    {product.name}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-zinc-500">
                    {product.slug}
                  </td>
                  <td className="py-3 pr-4 text-zinc-600">{product.category}</td>
                  <td className="py-3 pr-4 text-right text-zinc-900">
                    {formatPrice(product.base_price)}
                  </td>
                  <td className="py-3 pr-4">
                    <button
                      onClick={() => toggleActive(product.id, product.is_active)}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        product.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {product.is_active ? "Тийм" : "Үгүй"}
                    </button>
                  </td>
                  <td className="py-3">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="text-sm text-zinc-600 hover:text-zinc-900"
                    >
                      Засах
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
