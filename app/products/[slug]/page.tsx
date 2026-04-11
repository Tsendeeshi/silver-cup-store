"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/lib/cart-store";
import type { Product, ProductVariant, ProductImage } from "@/lib/types";

const STORAGE_URL =
  "https://vdoieqzhmvilwmnkzzvh.supabase.co/storage/v1/object/public/product-images";

function formatPrice(price: number): string {
  return price.toLocaleString("mn-MN") + "₮";
}

function getImageUrl(imageUrl: string): string {
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${STORAGE_URL}/${imageUrl.replace(/^\//, "")}`;
}

export default function ProductDetail() {
  const params = useParams();
  const slug = params.slug as string;

  type SiblingProduct = {
    id: string;
    name: string;
    slug: string;
    material: string | null;
    base_price: number;
    image_url: string | null;
  };

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [siblings, setSiblings] = useState<SiblingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
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

      // Ижил загвартай бүтээгдэхүүнүүдийг олох
      if (productData.design_group) {
        const { data: siblingProducts } = await supabase
          .from("products")
          .select("id, name, slug, material, base_price")
          .eq("design_group", productData.design_group)
          .eq("is_active", true)
          .order("base_price");

        if (siblingProducts && siblingProducts.length > 1) {
          // Sibling бүрийн primary зургийг авах
          const siblingIds = siblingProducts.map((s) => s.id);
          const { data: siblingImages } = await supabase
            .from("product_images")
            .select("product_id, image_url")
            .in("product_id", siblingIds)
            .eq("is_primary", true);

          const imageMap = new Map<string, string>();
          for (const img of siblingImages ?? []) {
            imageMap.set(img.product_id, getImageUrl(img.image_url));
          }

          setSiblings(
            siblingProducts.map((s) => ({
              ...s,
              image_url: imageMap.get(s.id) ?? null,
            }))
          );
        }
      }

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

  // Reset image index when color changes or when index is out of bounds
  useEffect(() => {
    setSelectedImageIndex(0);
  }, [selectedColor]);

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
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link
        href="/"
        className="mb-8 inline-block text-xs tracking-wider text-white/30 hover:text-gold transition-colors font-light uppercase"
      >
        ← Бүх бүтээгдэхүүн
      </Link>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        {/* Image section */}
        <div>
          {/* Main image */}
          <div className="aspect-[5/4] rounded-sm bg-dark border border-white/5 flex items-center justify-center overflow-hidden mb-3">
            {displayImages.length > 0 ? (
              <img
                src={getImageUrl(
                  displayImages[selectedImageIndex]?.image_url.replace("thumbnail/", "full/") ??
                  displayImages[0].image_url.replace("thumbnail/", "full/")
                )}
                alt={product.name}
                className="h-full w-full object-contain transition-opacity duration-300"
              />
            ) : (
              <span className="text-6xl text-white/10">🏆</span>
            )}
          </div>

          {/* Thumbnail strip */}
          {displayImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
              {displayImages.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImageIndex(i)}
                  className={`shrink-0 w-16 h-16 rounded-sm overflow-hidden border transition-all duration-300 ${
                    i === selectedImageIndex
                      ? "border-gold ring-1 ring-gold/30"
                      : "border-white/5 opacity-50 hover:opacity-80"
                  }`}
                >
                  <img
                    src={getImageUrl(img.image_url)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info section */}
        <div>
          <div className="divider-gold mb-6" style={{ width: 32 }} />
          <h1 className="font-display mb-3 text-3xl font-light tracking-wide text-white/90">
            {product.name}
          </h1>

          {product.material && (
            <p className="mb-4 text-[11px] text-gold/60 tracking-wider uppercase font-light">{product.material}</p>
          )}

          {product.description && (
            <p className="mb-8 text-sm text-white/35 leading-[1.9] font-light">{product.description}</p>
          )}

          {/* Price */}
          <p className="mb-8 text-2xl font-display font-semibold text-gold tracking-wide">
            {selectedVariant
              ? formatPrice(selectedVariant.price)
              : formatPrice(product.base_price)}
          </p>

          {/* Material siblings */}
          {siblings.length > 1 && (
            <div className="mb-6">
              <label className="mb-2.5 block text-[10px] font-medium text-white/40 tracking-[0.2em] uppercase">
                Материал
              </label>
              <div className="flex flex-wrap gap-2">
                {siblings.map((sib) => {
                  const isCurrent = sib.id === product.id;
                  const materialLabel = sib.material?.split(",")[0]?.trim() ?? sib.name;
                  return (
                    <Link
                      key={sib.id}
                      href={`/products/${sib.slug}`}
                      className={`flex items-center gap-2 border px-3 py-2 text-xs tracking-wider transition-all duration-300 ${
                        isCurrent
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-white/10 text-white/40 hover:border-white/25"
                      }`}
                    >
                      {sib.image_url && (
                        <img
                          src={sib.image_url}
                          alt=""
                          className="w-8 h-8 rounded-sm object-cover"
                        />
                      )}
                      <div>
                        <span className="block">{materialLabel}</span>
                        <span className="block text-[9px] text-white/25">{formatPrice(sib.base_price)}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Color selection */}
          {colors.length > 0 && (
            <div className="mb-6">
              <label className="mb-2.5 block text-[10px] font-medium text-white/40 tracking-[0.2em] uppercase">
                Өнгө
              </label>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`border px-4 py-2 text-xs tracking-wider transition-all duration-300 ${
                      selectedColor === color
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-white/10 text-white/40 hover:border-white/25"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size selection */}
          {sizes.length > 0 && (() => {
            const zodiacNames = ["Хулгана","Үхэр","Бар","Туулай","Луу","Могой","Морь","Хонь","Бич","Тахиа","Нохой","Гахай"];
            const isZodiac = sizes.some((s) => zodiacNames.includes(s));
            return (
            <div className="mb-6">
              <label className="mb-2.5 block text-[10px] font-medium text-white/40 tracking-[0.2em] uppercase">
                {isZodiac ? "Жил сонгох" : "Хэмжээ"}
              </label>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const isAvailable = availableSizes.includes(size);
                  return (
                    <button
                      key={size}
                      onClick={() => isAvailable && setSelectedSize(size)}
                      disabled={!isAvailable}
                      className={`border px-4 py-2 text-xs tracking-wider transition-all duration-300 ${
                        selectedSize === size
                          ? "border-gold bg-gold/10 text-gold"
                          : isAvailable
                            ? "border-white/10 text-white/40 hover:border-white/25"
                            : "cursor-not-allowed border-white/5 text-white/15"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
            );
          })()}

          {/* Stock info */}
          {selectedVariant && (
            <p className="mb-6 text-[11px] text-white/25 font-light tracking-wider">
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
                image_url: image ? getImageUrl(image.image_url) : null,
              });
              setAdded(true);
              setTimeout(() => setAdded(false), 2000);
            }}
            className={`w-full px-6 py-3.5 text-[11px] font-medium tracking-[0.2em] uppercase transition-all duration-300 ${
              added
                ? "bg-green-800 text-green-100 border border-green-700"
                : selectedVariant && selectedVariant.stock_qty > 0
                  ? "bg-gold text-dark hover:bg-gold-light hover:shadow-[0_8px_32px_rgba(184,150,78,0.25)]"
                  : "cursor-not-allowed bg-white/5 text-white/20 border border-white/5"
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
