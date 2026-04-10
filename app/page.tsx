import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { ProductVariantView, Category, ProductImage } from "@/lib/types";

const STORAGE_URL =
  "https://vdoieqzhmvilwmnkzzvh.supabase.co/storage/v1/object/public/product-images";

// Cover images for hero and sections
const COVER_HERO = `${STORAGE_URL}/full/65.jpg`;
const COVER_CRAFT = `${STORAGE_URL}/full/37.jpg`;

type ProductCard = {
  product_id: string;
  product_name: string;
  slug: string;
  description: string | null;
  material: string | null;
  category: string;
  min_price: number;
  max_price: number;
  colors: string[];
  sizes: string[];
  image_url: string | null;
};

function groupProducts(
  variants: ProductVariantView[],
  images: ProductImage[]
): ProductCard[] {
  const imageMap = new Map<string, string>();
  for (const img of images) {
    if (img.is_primary && !imageMap.has(img.product_id)) {
      imageMap.set(img.product_id, `${STORAGE_URL}/${img.image_url}`);
    }
  }

  const map = new Map<string, ProductCard>();
  for (const v of variants) {
    const existing = map.get(v.product_id);
    if (existing) {
      existing.min_price = Math.min(existing.min_price, v.price);
      existing.max_price = Math.max(existing.max_price, v.price);
      if (!existing.colors.includes(v.color)) existing.colors.push(v.color);
      if (!existing.sizes.includes(v.size)) existing.sizes.push(v.size);
    } else {
      map.set(v.product_id, {
        product_id: v.product_id,
        product_name: v.product_name,
        slug: v.slug,
        description: v.description,
        material: v.material,
        category: v.category,
        min_price: v.price,
        max_price: v.price,
        colors: [v.color],
        sizes: [v.size],
        image_url: imageMap.get(v.product_id) ?? null,
      });
    }
  }
  return Array.from(map.values());
}

function formatPrice(price: number): string {
  return price.toLocaleString("mn-MN") + "₮";
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const selectedCategory = params.category ?? "all";

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  const [{ data, error }, { data: productImages }] = await Promise.all([
    supabase
      .from("product_variant_view")
      .select("*")
      .eq("product_is_active", true)
      .eq("variant_is_active", true),
    supabase
      .from("product_images")
      .select("*")
      .eq("is_primary", true)
      .order("sort_order"),
  ]);

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16 text-center text-red-500">
        Алдаа: {error.message}
      </div>
    );
  }

  let products = groupProducts(data ?? [], productImages ?? []);
  if (selectedCategory !== "all") {
    products = products.filter((p) => p.category === selectedCategory);
  }

  return (
    <div>
      {/* ===== FULL-SCREEN HERO ===== */}
      <section
        className="hero-cover noise"
        style={{ backgroundImage: `url(${COVER_HERO})` }}
      >
        <div className="hero-overlay" />

        {/* Decorative frame */}
        <div className="absolute top-10 left-10 w-20 h-20 border-t border-l border-gold/20 hidden md:block" />
        <div className="absolute top-10 right-10 w-20 h-20 border-t border-r border-gold/20 hidden md:block" />
        <div className="absolute bottom-10 left-10 w-20 h-20 border-b border-l border-gold/20 hidden md:block" />
        <div className="absolute bottom-10 right-10 w-20 h-20 border-b border-r border-gold/20 hidden md:block" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <div className="divider-gold mb-8 animate-expand" />
            <p className="mb-4 text-[11px] tracking-[0.4em] text-gold/60 uppercase animate-fade-in-up delay-1">
              Монгол уламжлалт гар урлал
            </p>
            <h1 className="mb-6 text-5xl font-extralight leading-[1.15] tracking-wide text-white md:text-7xl animate-fade-in-up delay-2">
              Мөнгөн
              <br />
              эдлэлийн
              <span className="block mt-1 font-semibold text-gold">
                галерей
              </span>
            </h1>
            <p className="mb-10 max-w-md text-sm leading-[1.8] text-white/40 animate-fade-in-up delay-3">
              Эрт цагийн уламжлалыг өнөөгийн урлагаар бүтээсэн мөнгөн аяга,
              таваг, гоёл чимэглэл. Дархан урчуудын гар ажиллагаа.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row animate-fade-in-up delay-4">
              <Link href="#products" className="btn-primary inline-block text-center">
                Бүтээгдэхүүн үзэх
              </Link>
              <Link href="/orders" className="btn-outline inline-block text-center">
                Захиалга шалгах
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in delay-6">
          <span className="text-[10px] tracking-[0.3em] text-white/30 uppercase">
            Доош гүйлгэх
          </span>
          <div className="h-8 w-px bg-gradient-to-b from-gold/50 to-transparent" />
        </div>
      </section>

      {/* ===== CATEGORY NAV ===== */}
      {(categories ?? []).length > 0 && (
        <section className="border-b border-gold/8 bg-cream sticky top-[73px] z-40 backdrop-blur-md">
          <div className="mx-auto max-w-6xl px-6 py-4">
            <div className="flex items-center gap-8 overflow-x-auto scrollbar-none">
              <Link
                href="/"
                className={`whitespace-nowrap text-[11px] tracking-[0.25em] uppercase transition-all duration-300 pb-1 ${
                  selectedCategory === "all"
                    ? "text-gold font-semibold border-b border-gold"
                    : "text-zinc-400 hover:text-dark"
                }`}
              >
                Бүгд
              </Link>
              {(categories ?? []).map((cat: Category) => (
                <Link
                  key={cat.id}
                  href={`/?category=${cat.slug}`}
                  className={`whitespace-nowrap text-[11px] tracking-[0.25em] uppercase transition-all duration-300 pb-1 ${
                    selectedCategory === cat.slug
                      ? "text-gold font-semibold border-b border-gold"
                      : "text-zinc-400 hover:text-dark"
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== PRODUCTS GRID ===== */}
      <section id="products" className="bg-cream mongol-pattern">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-12 text-center">
            <div className="divider-gold mx-auto mb-5" />
            <h2 className="text-xl font-extralight tracking-[0.25em] text-dark uppercase md:text-2xl">
              {selectedCategory === "all"
                ? "Бүтээгдэхүүн"
                : (categories ?? []).find(
                    (c: Category) => c.slug === selectedCategory
                  )?.name ?? "Бүтээгдэхүүн"}
            </h2>
            <p className="mt-3 text-xs text-zinc-400 tracking-wider">
              {products.length} бүтээгдэхүүн
            </p>
          </div>

          {products.length === 0 ? (
            <p className="py-24 text-center text-zinc-400">
              Бүтээгдэхүүн одоогоор байхгүй байна.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product, index) => (
                <Link
                  key={product.product_id}
                  href={`/products/${product.slug}`}
                  className="product-card group bg-white relative frame-corner"
                >
                  <div className="aspect-[5/4] overflow-hidden bg-[#1a1a1a]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.image_url ?? `${STORAGE_URL}/thumbnail/65.jpg`}
                      alt={product.product_name}
                      className="product-img h-full w-full object-contain"
                    />
                  </div>

                  <div className="p-6">
                    <h3 className="mb-1 text-sm font-medium tracking-wide text-dark group-hover:text-gold transition-colors duration-300">
                      {product.product_name}
                    </h3>

                    {product.material && (
                      <p className="mb-3 text-[11px] text-zinc-400 tracking-wider">
                        {product.material}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gold tracking-wide">
                        {product.min_price === product.max_price
                          ? formatPrice(product.min_price)
                          : `${formatPrice(product.min_price)} – ${formatPrice(product.max_price)}`}
                      </p>
                      <span className="text-[10px] tracking-widest text-zinc-300 uppercase">
                        {product.sizes.length} хэмжээ
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== PARALLAX COVER — CRAFTSMANSHIP ===== */}
      <section
        className="section-cover noise"
        style={{ backgroundImage: `url(${COVER_CRAFT})` }}
      >
        <div className="absolute inset-0 bg-dark/80" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center">
          <div className="divider-gold mx-auto mb-6" />
          <p className="mb-3 text-[11px] tracking-[0.4em] text-gold/50 uppercase">
            Уламжлал ба урлаг
          </p>
          <h2 className="mb-6 text-3xl font-extralight tracking-wide text-white md:text-5xl">
            Гар урлалын
            <span className="font-semibold text-gold"> нарийн ажиллагаа</span>
          </h2>
          <p className="mx-auto max-w-xl text-sm leading-[1.9] text-white/40">
            Бидний бүтээгдэхүүн бүр Монгол дархан урчуудын гар урлалаар бүтсэн
            онцгой бүтээл юм. Эрт цагийн хээ угалз, уламжлалт арга технологи,
            өнөөгийн загварын хослол.
          </p>
        </div>
      </section>

      {/* ===== THREE PILLARS ===== */}
      <section className="bg-dark-soft">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="grid grid-cols-1 gap-px md:grid-cols-3">
            {[
              {
                icon: "⚒",
                title: "Гар урлал",
                desc: "Мэргэжлийн дархан урчуудын олон жилийн туршлага бүхий гар ажиллагаа",
              },
              {
                icon: "◈",
                title: "Цэвэр мөнгө",
                desc: "925 сорьцын цэвэр мөнгө, алт, зэс бүрээстэй эдлэлүүд",
              },
              {
                icon: "❖",
                title: "Бэлэг дурсгал",
                desc: "Онцгой бэлэг дурсгалд тохирсон гоёмсог хайрцагтай",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="relative p-10 text-center border border-white/5 hover:border-gold/20 transition-colors duration-500"
              >
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center border border-gold/25">
                  <span className="text-xl">{item.icon}</span>
                </div>
                <h3 className="mb-3 text-[11px] tracking-[0.25em] text-white uppercase font-medium">
                  {item.title}
                </h3>
                <p className="text-xs text-white/35 leading-[1.8]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BOTTOM CTA ===== */}
      <section className="bg-cream mongol-pattern">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <div className="divider-gold mx-auto mb-6" />
          <h2 className="mb-5 text-2xl font-extralight tracking-wide text-dark md:text-3xl">
            Захиалга өгөх
          </h2>
          <p className="mb-10 text-sm text-zinc-400 leading-[1.8]">
            Бүтээгдэхүүнээ сонгоод захиалгаа өгнө үү.
            Бид тантай удахгүй холбогдох болно.
          </p>
          <Link href="#products" className="btn-primary inline-block">
            Бүтээгдэхүүн сонгох
          </Link>
        </div>
      </section>
    </div>
  );
}
