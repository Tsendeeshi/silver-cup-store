"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  material: string | null;
  base_price: number;
  is_active: boolean;
};

type Variant = {
  id: string;
  sku: string;
  size: string;
  color: string;
  price: number;
  stock_qty: number;
  is_active: boolean;
};

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // New variant form
  const [newSku, setNewSku] = useState("");
  const [newSize, setNewSize] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("0");

  useEffect(() => {
    async function fetchData() {
      const [productRes, variantsRes] = await Promise.all([
        supabase.from("products").select("*").eq("id", productId).single(),
        supabase
          .from("product_variants")
          .select("id, sku, size, color, price, stock_qty, is_active")
          .eq("product_id", productId)
          .order("color")
          .order("price", { ascending: true }),
      ]);

      if (productRes.data) setProduct(productRes.data);
      setVariants(variantsRes.data ?? []);
      setLoading(false);
    }

    fetchData();
  }, [productId]);

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    setSaving(true);

    const { error } = await supabase
      .from("products")
      .update({
        name: product.name,
        slug: product.slug,
        description: product.description,
        material: product.material,
        base_price: product.base_price,
        is_active: product.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    setMessage(error ? "Алдаа: " + error.message : "Хадгалагдлаа");
    setTimeout(() => setMessage(null), 3000);
    setSaving(false);
  }

  async function addVariant(e: React.FormEvent) {
    e.preventDefault();

    const { data, error } = await supabase
      .from("product_variants")
      .insert({
        product_id: productId,
        sku: newSku,
        size: newSize,
        color: newColor,
        price: parseFloat(newPrice) || 0,
        stock_qty: parseInt(newStock) || 0,
        is_active: true,
      })
      .select("id, sku, size, color, price, stock_qty, is_active")
      .single();

    if (error) {
      setMessage("Алдаа: " + error.message);
      return;
    }

    setVariants([...variants, data]);
    setNewSku("");
    setNewSize("");
    setNewColor("");
    setNewPrice("");
    setNewStock("0");
    setMessage("Variant нэмэгдлээ");
    setTimeout(() => setMessage(null), 3000);
  }

  async function deleteVariant(variantId: string) {
    await supabase.from("product_variants").delete().eq("id", variantId);
    setVariants(variants.filter((v) => v.id !== variantId));
  }

  async function updateVariantStock(variantId: string, stock: number) {
    await supabase
      .from("product_variants")
      .update({ stock_qty: stock, updated_at: new Date().toISOString() })
      .eq("id", variantId);

    setVariants(
      variants.map((v) =>
        v.id === variantId ? { ...v, stock_qty: stock } : v
      )
    );
  }

  if (loading) return <p className="text-zinc-500">Уншиж байна...</p>;
  if (!product) return <p className="text-red-500">Бүтээгдэхүүн олдсонгүй</p>;

  return (
    <div>
      <Link
        href="/admin/products"
        className="mb-4 inline-block text-sm text-zinc-500 hover:text-zinc-900"
      >
        ← Бүтээгдэхүүн руу буцах
      </Link>

      <h2 className="mb-6 text-xl font-bold text-zinc-900">
        Бүтээгдэхүүн засах
      </h2>

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

      {/* Product form */}
      <form onSubmit={saveProduct} className="mb-8 max-w-xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Нэр</label>
            <input
              type="text"
              value={product.name}
              onChange={(e) => setProduct({ ...product, name: e.target.value })}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Slug</label>
            <input
              type="text"
              value={product.slug}
              onChange={(e) => setProduct({ ...product, slug: e.target.value })}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Тайлбар</label>
          <textarea
            value={product.description ?? ""}
            onChange={(e) => setProduct({ ...product, description: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Материал</label>
            <input
              type="text"
              value={product.material ?? ""}
              onChange={(e) => setProduct({ ...product, material: e.target.value })}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Суурь үнэ (₮)</label>
            <input
              type="number"
              value={product.base_price}
              onChange={(e) => setProduct({ ...product, base_price: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            {saving ? "Хадгалж байна..." : "Хадгалах"}
          </button>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={product.is_active}
              onChange={(e) => setProduct({ ...product, is_active: e.target.checked })}
            />
            Идэвхтэй
          </label>
        </div>
      </form>

      {/* Variants */}
      <h3 className="mb-4 text-lg font-bold text-zinc-900">
        Хэмжээ / Өнгө (Variants)
      </h3>

      {variants.length > 0 && (
        <div className="mb-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-zinc-500">
                <th className="pb-2 pr-3">SKU</th>
                <th className="pb-2 pr-3">Өнгө</th>
                <th className="pb-2 pr-3">Хэмжээ</th>
                <th className="pb-2 pr-3 text-right">Үнэ</th>
                <th className="pb-2 pr-3 text-right">Нөөц</th>
                <th className="pb-2">Үйлдэл</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {variants.map((v) => (
                <tr key={v.id} className="hover:bg-zinc-50">
                  <td className="py-2 pr-3 font-mono text-xs">{v.sku}</td>
                  <td className="py-2 pr-3">{v.color}</td>
                  <td className="py-2 pr-3">{v.size}</td>
                  <td className="py-2 pr-3 text-right">
                    {v.price.toLocaleString("mn-MN")}₮
                  </td>
                  <td className="py-2 pr-3 text-right">
                    <input
                      type="number"
                      value={v.stock_qty}
                      onChange={(e) =>
                        updateVariantStock(v.id, parseInt(e.target.value) || 0)
                      }
                      className="w-16 rounded border border-zinc-300 px-2 py-1 text-right text-sm"
                    />
                  </td>
                  <td className="py-2">
                    <button
                      onClick={() => deleteVariant(v.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Устгах
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add variant form */}
      <form
        onSubmit={addVariant}
        className="rounded-lg border border-zinc-200 bg-zinc-50 p-4"
      >
        <h4 className="mb-3 text-sm font-medium text-zinc-700">
          Шинэ variant нэмэх
        </h4>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <input
            type="text"
            required
            placeholder="SKU"
            value={newSku}
            onChange={(e) => setNewSku(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          />
          <input
            type="text"
            required
            placeholder="Өнгө"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          />
          <input
            type="text"
            required
            placeholder="Хэмжээ"
            value={newSize}
            onChange={(e) => setNewSize(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          />
          <input
            type="number"
            required
            placeholder="Үнэ"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          />
          <input
            type="number"
            placeholder="Нөөц"
            value={newStock}
            onChange={(e) => setNewStock(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="mt-3 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Нэмэх
        </button>
      </form>
    </div>
  );
}
