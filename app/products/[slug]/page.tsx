"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/lib/cart-store";
import type { Product, ProductVariant, ProductImage } from "@/lib/types";

function formatPrice(price: number): string {
  return price.toLocaleString("mn-MN") + "₮";
}

export default function ProductDetail() {
  const params = useParams();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    async function fetchProduct() {
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (productError || !productData) {
        setError("Бүтээгдэхүүн олдсонгүй");
        setLoading(false);
        return;
      }

      setProduct(productData);

      const [variantsRes, imagesRes] = await Promise.all([
        supabase
          .from("product_variants")
          .select("*")
          .eq("product_id", productData.id)
          .eq("is_active", true)
          .order("price", { ascending: true }),
        supabase
          .from("product_images")
          .select("*")
          .eq("product_id", productData.id)
          .order("sort_order", { ascending: true }),
      ]);

      setVariants(variantsRes.data ?? []);
      setImages(imagesRes.data ?? []);
      setLoading(false);
    }

    fetchProduct();
  }, [slug]);

  // Derive unique colors and sizes
  const colors = [...new Set(variants.map((v) => v.color))];
  const sizes = [...new Set(variants.map((v) => v.size))];

  // Auto-select first color
  useEffect(() => {
    if (colors.length > 0 && !selectedColor) {
      setSelectedColor(colors[0]);
    }
  }, [colors, selectedColor]);

  // Filter sizes available for selected color
  const availableSizes = variants
    .filter((v) => v.color === selectedColor)
    .map((v) => v.size);

  // Reset size when color changes if current size not available
  useEffect(() => {
    if (selectedSize && !availableSizes.includes(selectedSize)) {
      setSelectedSize(null);
    }
  }, [selectedColor, availableSizes, selectedSize]);

  // Find selected variant
  const selectedVariant = variants.find(
    (v) => v.color === selectedColor && v.size === selectedSize
  );

  // Filter images for selected color
  const displayImages = selectedColor
    ? images.filter((img) => img.color === selectedColor || !img.color)
    : images;

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-zinc-500">
        Уншиж байна...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="mb-4 text-red-500">{error}</p>
        <Link href="/" className="text-sm text-zinc-600 hover:text-zinc-900">
          Нүүр хуудас руу буцах
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-zinc-500 hover:text-zinc-900"
      >
        ← Бүх бүтээгдэхүүн
      </Link>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Image section */}
        <div className="aspect-square rounded-lg bg-zinc-100 flex items-center justify-center">
          {displayImages.length > 0 ? (
            <img
              src={displayImages[0].image_url}
              alt={product.name}
              className="h-full w-full rounded-lg object-cover"
            />
          ) : (
            <span className="text-6xl text-zinc-300">🏆</span>
          )}
        </div>

        {/* Info section */}
        <div>
          <h1 className="mb-2 text-2xl font-bold text-zinc-900">
            {product.name}
          </h1>

          {product.material && (
            <p className="mb-4 text-sm text-zinc-500">{product.material}</p>
          )}

          {product.description && (
            <p className="mb-6 text-zinc-700">{product.description}</p>
          )}

          {/* Price */}
          <p className="mb-6 text-2xl font-bold text-zinc-900">
            {selectedVariant
              ? formatPrice(selectedVariant.price)
              : formatPrice(product.base_price)}
          </p>

          {/* Color selection */}
          {colors.length > 0 && (
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Өнгө
              </label>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                      selectedColor === color
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size selection */}
          {sizes.length > 0 && (
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Хэмжээ
              </label>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const isAvailable = availableSizes.includes(size);
                  return (
                    <button
                      key={size}
                      onClick={() => isAvailable && setSelectedSize(size)}
                      disabled={!isAvailable}
                      className={`rounded-md border px-4 py-2 text-sm transition-colors ${
                        selectedSize === size
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : isAvailable
                            ? "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500"
                            : "cursor-not-allowed border-zinc-100 bg-zinc-50 text-zinc-300"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock info */}
          {selectedVariant && (
            <p className="mb-6 text-sm text-zinc-500">
              Нөөц: {selectedVariant.stock_qty} ширхэг
            </p>
          )}

          {/* Add to cart button */}
          <button
            disabled={!selectedVariant || selectedVariant.stock_qty === 0}
            onClick={() => {
              if (!selectedVariant || !product) return;
              const image = displayImages.find((img) => img.is_primary) ?? displayImages[0];
              addItem({
                variant_id: selectedVariant.id,
                product_id: product.id,
                product_name: product.name,
                slug: product.slug,
                color: selectedVariant.color,
                size: selectedVariant.size,
                price: selectedVariant.price,
                image_url: image?.image_url ?? null,
              });
              setAdded(true);
              setTimeout(() => setAdded(false), 2000);
            }}
            className={`w-full rounded-lg px-6 py-3 text-base font-medium transition-colors ${
              added
                ? "bg-green-600 text-white"
                : selectedVariant && selectedVariant.stock_qty > 0
                  ? "bg-zinc-900 text-white hover:bg-zinc-800"
                  : "cursor-not-allowed bg-zinc-200 text-zinc-400"
            }`}
          >
            {added
              ? "Нэмэгдлээ!"
              : !selectedVariant
                ? "Хэмжээ сонгоно уу"
                : selectedVariant.stock_qty === 0
                  ? "Дууссан"
                  : "Сагсанд нэмэх"}
          </button>
        </div>
      </div>
    </div>
  );
}
