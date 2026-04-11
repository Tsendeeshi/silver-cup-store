export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  category_id: string | null;
  material: string | null;
  base_price: number;
  is_active: boolean;
  design_group: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  sku: string;
  size: string;
  color: string;
  price: number;
  stock_qty: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductImage = {
  id: string;
  product_id: string;
  color: string | null;
  image_url: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
};

export type ProductVariantView = {
  product_id: string;
  product_name: string;
  slug: string;
  description: string | null;
  category: string;
  material: string | null;
  product_is_active: boolean;
  variant_id: string;
  sku: string;
  size: string;
  color: string;
  price: number;
  stock_qty: number;
  variant_is_active: boolean;
};
