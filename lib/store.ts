'use client';

import { create } from 'zustand';
import { CartStateItem } from '@/lib/types';

type CartStore = {
  items: CartStateItem[];
  addItem: (item: CartStateItem) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
};

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  addItem: (item) =>
    set((state) => {
      const existing = state.items.find(
        (entry) =>
          entry.productId === item.productId &&
          JSON.stringify(entry.selectedOptions) === JSON.stringify(item.selectedOptions)
      );

      if (existing) {
        return {
          items: state.items.map((entry) =>
            entry.id === existing.id ? { ...entry, quantity: entry.quantity + item.quantity } : entry
          )
        };
      }

      return { items: [...state.items, item] };
    }),
  updateQuantity: (id, quantity) =>
    set((state) => ({
      items: state.items
        .map((entry) => (entry.id === id ? { ...entry, quantity } : entry))
        .filter((entry) => entry.quantity > 0)
    })),
  clear: () => set({ items: [] })
}));
