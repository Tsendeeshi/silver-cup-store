import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  variant_id: string;
  product_id: string;
  product_name: string;
  slug: string;
  color: string;
  size: string;
  price: number;
  qty: number;
  image_url: string | null;
};

type CartStore = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">) => void;
  removeItem: (variantId: string) => void;
  updateQty: (variantId: string, qty: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const existing = get().items.find(
          (i) => i.variant_id === item.variant_id
        );
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.variant_id === item.variant_id
                ? { ...i, qty: i.qty + 1 }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, qty: 1 }] });
        }
      },

      removeItem: (variantId) => {
        set({ items: get().items.filter((i) => i.variant_id !== variantId) });
      },

      updateQty: (variantId, qty) => {
        if (qty <= 0) {
          get().removeItem(variantId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.variant_id === variantId ? { ...i, qty } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.qty, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
    }),
    { name: "silver-cup-cart" }
  )
);
