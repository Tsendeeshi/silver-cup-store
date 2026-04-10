import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";

const STORAGE_URL =
  "https://vdoieqzhmvilwmnkzzvh.supabase.co/storage/v1/object/public/product-images";

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const { data: product } = await supabase
    .from("products")
    .select("id, name, description, material, base_price")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!product) {
    return { title: "Бүтээгдэхүүн олдсонгүй" };
  }

  const { data: image } = await supabase
    .from("product_images")
    .select("image_url")
    .eq("product_id", product.id)
    .eq("is_primary", true)
    .limit(1)
    .single();

  const imageUrl = image
    ? `${STORAGE_URL}/${image.image_url.replace("thumbnail/", "full/")}`
    : `${STORAGE_URL}/full/65.jpg`;

  const price = product.base_price.toLocaleString("mn-MN");
  const description =
    product.description ??
    `${product.name} - ${product.material ?? "Монгол гар урлал"}. Үнэ: ${price}₮`;

  return {
    title: product.name,
    description,
    openGraph: {
      title: `${product.name} | Дүүрэн Гоёл`,
      description,
      images: [{ url: imageUrl, width: 1200, height: 960, alt: product.name }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | Дүүрэн Гоёл`,
      description,
      images: [imageUrl],
    },
  };
}

export default function ProductLayout({ children }: Props) {
  return <>{children}</>;
}
