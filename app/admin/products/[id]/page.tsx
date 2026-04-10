"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const STORAGE_URL =
  "https://vdoieqzhmvilwmnkzzvh.supabase.co/storage/v1/object/public/product-images";

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

type ProductImage = {
  id: string;
  product_id: string;
  color: string | null;
  image_url: string;
  sort_order: number;
  is_primary: boolean;
};

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadColor, setUploadColor] = useState("");
  const [dragOver, setDragOver] = useState(false);

  // New variant form
  const [newSku, setNewSku] = useState("");
  const [newSize, setNewSize] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("0");

  useEffect(() => {
    async function fetchData() {
      const [productRes, variantsRes, imagesRes] = await Promise.all([
        supabase.from("products").select("*").eq("id", productId).single(),
        supabase
          .from("product_variants")
          .select("id, sku, size, color, price, stock_qty, is_active")
          .eq("product_id", productId)
          .order("color")
          .order("price", { ascending: true }),
        supabase
          .from("product_images")
          .select("*")
          .eq("product_id", productId)
          .order("sort_order"),
      ]);

      if (productRes.data) setProduct(productRes.data);
      setVariants(variantsRes.data ?? []);
      setImages(imagesRes.data ?? []);
      setLoading(false);
    }

    fetchData();
  }, [productId]);

  function getImageUrl(imageUrl: string): string {
    if (imageUrl.startsWith("http")) return imageUrl;
    return `${STORAGE_URL}/${imageUrl.replace(/^\//, "")}`;
  }

  async function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) await uploadFiles(Array.from(e.target.files));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length > 0) uploadFiles(files);
  }

  async function uploadFiles(files: File[]) {
    if (files.length === 0) return;
    setUploading(true);

    const maxOrder = images.reduce((max, img) => Math.max(max, img.sort_order), 0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const filePath = `thumbnail/${productId}-${timestamp}-${safeName}`;
      const fullPath = `full/${productId}-${timestamp}-${safeName}`;

      const { error: uploadErr } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, { contentType: file.type, upsert: true });

      await supabase.storage
        .from("product-images")
        .upload(fullPath, file, { contentType: file.type, upsert: true });

      if (uploadErr) {
        showMessage("Алдаа: " + uploadErr.message);
        continue;
      }

      const isPrimary = images.length === 0 && i === 0;
      const { data: imgData, error: dbErr } = await supabase
        .from("product_images")
        .insert({
          product_id: productId,
          color: uploadColor || null,
          image_url: filePath,
          sort_order: maxOrder + i + 1,
          is_primary: isPrimary,
        })
        .select("*")
        .single();

      if (dbErr) {
        showMessage("Алдаа: " + dbErr.message);
        continue;
      }

      setImages((prev) => [...prev, imgData]);
    }

    showMessage(`${files.length} зураг нэмэгдлээ`);
    setUploading(false);
  }

  async function deleteImage(img: ProductImage) {
    // Delete from storage
    await supabase.storage.from("product-images").remove([img.image_url]);
    const fullPath = img.image_url.replace("thumbnail/", "full/");
    await supabase.storage.from("product-images").remove([fullPath]);

    // Delete from DB
    await supabase.from("product_images").delete().eq("id", img.id);
    setImages((prev) => prev.filter((i) => i.id !== img.id));
    showMessage("Зураг устгагдлаа");
  }

  async function setPrimaryImage(imgId: string) {
    // Unset all primary
    await supabase
      .from("product_images")
      .update({ is_primary: false })
      .eq("product_id", productId);

    // Set new primary
    await supabase
      .from("product_images")
      .update({ is_primary: true })
      .eq("id", imgId);

    setImages((prev) =>
      prev.map((img) => ({ ...img, is_primary: img.id === imgId }))
    );
    showMessage("Үндсэн зураг тохируулагдлаа");
  }

  function showMessage(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  }

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

    showMessage(error ? "Алдаа: " + error.message : "Хадгалагдлаа");
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
    showMessage("Variant нэмэгдлээ");
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

      {/* Images */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-zinc-900">Зургууд</h3>
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-500">Өнгө:</label>
          <input
            type="text"
            placeholder="copper, gold..."
            value={uploadColor}
            onChange={(e) => setUploadColor(e.target.value)}
            className="w-32 rounded border border-zinc-300 px-2 py-1 text-xs focus:border-zinc-500 focus:outline-none"
          />
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`mb-8 rounded-lg border-2 border-dashed p-4 transition-colors ${
          dragOver
            ? "border-amber-500 bg-amber-50"
            : "border-zinc-200 bg-zinc-50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {images.map((img) => (
            <div
              key={img.id}
              className={`group relative overflow-hidden rounded-lg border-2 ${
                img.is_primary
                  ? "border-amber-500"
                  : "border-zinc-200"
              }`}
            >
              <div className="aspect-[5/4] bg-[#1a1a1a]">
                <img
                  src={getImageUrl(img.image_url)}
                  alt=""
                  className="h-full w-full object-contain"
                />
              </div>

              {img.is_primary && (
                <div className="absolute top-1 left-1 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  ҮНДСЭН
                </div>
              )}

              {img.color && (
                <div className="absolute top-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                  {img.color}
                </div>
              )}

              <div className="absolute inset-0 flex items-end justify-center gap-1 bg-black/0 pb-2 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                {!img.is_primary && (
                  <button
                    onClick={() => setPrimaryImage(img.id)}
                    className="rounded bg-amber-500 px-2 py-1 text-[10px] font-medium text-white hover:bg-amber-600"
                  >
                    Үндсэн болгох
                  </button>
                )}
                <button
                  onClick={() => deleteImage(img)}
                  className="rounded bg-red-500 px-2 py-1 text-[10px] font-medium text-white hover:bg-red-600"
                >
                  Устгах
                </button>
              </div>
            </div>
          ))}

          {/* Upload tile */}
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
              uploading
                ? "pointer-events-none border-zinc-200 opacity-50"
                : "border-zinc-300 hover:border-amber-400 hover:bg-amber-50/50"
            }`}
            style={{ minHeight: images.length > 0 ? undefined : "160px" }}
          >
            <div className="flex flex-col items-center justify-center p-4">
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <svg className="h-6 w-6 animate-spin text-zinc-400" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-[11px] text-zinc-400">Байршуулж байна...</span>
                </div>
              ) : (
                <>
                  <svg className="mb-1 h-7 w-7 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span className="text-[11px] font-medium text-zinc-400">Зураг нэмэх</span>
                  <span className="mt-0.5 text-[10px] text-zinc-300">чирж эсвэл дарж</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

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
