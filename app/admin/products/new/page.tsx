"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type CategoryOption = { id: string; name: string; slug: string };

type VariantRow = {
  sku: string;
  color: string;
  size: string;
  price: string;
  stock: string;
};

const emptyVariant: VariantRow = {
  sku: "",
  color: "",
  size: "",
  price: "",
  stock: "0",
};

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [material, setMaterial] = useState("");
  const [variants, setVariants] = useState<VariantRow[]>([{ ...emptyVariant }]);

  useEffect(() => {
    supabase
      .from("categories")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        setCategories(data ?? []);
        if (data && data.length > 0) setCategoryId(data[0].id);
      });
  }, []);

  function generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }

  function updateVariant(index: number, field: keyof VariantRow, value: string) {
    setVariants(
      variants.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  }

  function addVariantRow() {
    setVariants([...variants, { ...emptyVariant }]);
  }

  function removeVariantRow(index: number) {
    if (variants.length <= 1) return;
    setVariants(variants.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Validate variants
    const validVariants = variants.filter(
      (v) => v.color && v.size && v.price
    );
    if (validVariants.length === 0) {
      setError("Дор хаяж 1 variant (өнгө, хэмжээ, үнэ) оруулна уу");
      setSaving(false);
      return;
    }

    const selectedCat = categories.find((c) => c.id === categoryId);

    // Find min price from variants for base_price
    const prices = validVariants.map((v) => parseFloat(v.price) || 0);
    const minPrice = Math.min(...prices);

    // 1. Create product
    const { data, error: insertError } = await supabase
      .from("products")
      .insert({
        name,
        slug: slug || generateSlug(name),
        description: description || null,
        material: material || null,
        base_price: minPrice,
        category: selectedCat?.slug ?? "other",
        category_id: categoryId || null,
        is_active: true,
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    // 2. Create variants
    const variantInserts = validVariants.map((v, i) => ({
      product_id: data.id,
      sku: v.sku || `${generateSlug(name)}-${i + 1}`,
      color: v.color,
      size: v.size,
      price: parseFloat(v.price) || 0,
      stock_qty: parseInt(v.stock) || 0,
      is_active: true,
    }));

    const { error: variantError } = await supabase
      .from("product_variants")
      .insert(variantInserts);

    if (variantError) {
      setError("Variant нэмэхэд алдаа: " + variantError.message);
      setSaving(false);
      return;
    }

    router.push(`/admin/products/${data.id}`);
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/products"
        className="mb-4 inline-block text-sm text-zinc-500 hover:text-zinc-900"
      >
        ← Бүтээгдэхүүн руу буцах
      </Link>

      <h2 className="mb-6 text-xl font-bold text-zinc-900">
        Шинэ бүтээгдэхүүн
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* === Ерөнхий мэдээлэл === */}
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-800">
            Ерөнхий мэдээлэл
          </h3>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Нэр *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug) setSlug(generateSlug(e.target.value));
                }}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Категори *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Материал
                </label>
                <input
                  type="text"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                  placeholder="925 мөнгө"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Тайлбар
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Slug (URL)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-500 focus:border-zinc-500 focus:outline-none"
                placeholder="auto-generated"
              />
            </div>
          </div>
        </div>

        {/* === Үнэ, хэмжээ, нөөц === */}
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-800">
              Үнэ, хэмжээ, нөөц
            </h3>
            <button
              type="button"
              onClick={addVariantRow}
              className="text-xs text-zinc-500 hover:text-zinc-900"
            >
              + Мөр нэмэх
            </button>
          </div>

          <div className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
              <div className="col-span-2">Өнгө *</div>
              <div className="col-span-2">Хэмжээ *</div>
              <div className="col-span-3">Үнэ (₮) *</div>
              <div className="col-span-2">Нөөц</div>
              <div className="col-span-2">SKU</div>
              <div className="col-span-1"></div>
            </div>

            {variants.map((v, index) => (
              <div key={index} className="grid grid-cols-12 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Алт"
                  value={v.color}
                  onChange={(e) => updateVariant(index, "color", e.target.value)}
                  className="col-span-2 rounded-lg border border-zinc-300 px-2 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                />
                <input
                  type="text"
                  required
                  placeholder="250мл"
                  value={v.size}
                  onChange={(e) => updateVariant(index, "size", e.target.value)}
                  className="col-span-2 rounded-lg border border-zinc-300 px-2 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="295000"
                  value={v.price}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    updateVariant(index, "price", val);
                  }}
                  className="col-span-3 rounded-lg border border-zinc-300 px-2 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={v.stock}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    updateVariant(index, "stock", val);
                  }}
                  className="col-span-2 rounded-lg border border-zinc-300 px-2 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="auto"
                  value={v.sku}
                  onChange={(e) => updateVariant(index, "sku", e.target.value)}
                  className="col-span-2 rounded-lg border border-zinc-300 px-2 py-2 text-sm text-zinc-500 focus:border-zinc-500 focus:outline-none"
                />
                <div className="col-span-1 flex items-center justify-center">
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariantRow(index)}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-3 text-xs text-zinc-400">
            Нэг бүтээгдэхүүнд олон өнгө/хэмжээ байвал мөр нэмнэ.
            Суурь үнэ хамгийн бага үнээс автоматаар тооцогдоно.
          </p>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            {saving ? "Хадгалж байна..." : "Бүтээгдэхүүн үүсгэх"}
          </button>
          <Link
            href="/admin/products"
            className="rounded-lg border border-zinc-300 px-6 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50"
          >
            Болих
          </Link>
        </div>
      </form>
    </div>
  );
}
