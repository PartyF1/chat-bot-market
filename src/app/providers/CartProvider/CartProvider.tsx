import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Bot } from "@app/types/bot";
import { getJSON, setJSON } from "@shared/utils/localStorage";

interface CartItem {
  bot: Bot;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (bot: Bot) => void;
  removeFromCart: (botId: string) => void;
  updateQuantity: (botId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  totalOldPrice?: number;
  totalDiscount?: number;
}

const CART_STORAGE_KEY = "cbm_cart";

const CartContext = createContext<CartContextType | undefined>(undefined);

const reviveCartItems = (items: CartItem[]): CartItem[] =>
  items.map((item) => ({
    ...item,
    bot: {
      ...item.bot,
      createdAt: item.bot.createdAt
        ? new Date(item.bot.createdAt)
        : new Date(),
    },
  }));

export const CartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<CartItem[]>(() =>
    reviveCartItems(getJSON<CartItem[]>(CART_STORAGE_KEY, []))
  );

  useEffect(() => {
    setJSON(CART_STORAGE_KEY, items);
  }, [items]);

  const addToCart = (bot: Bot) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.bot.id === bot.id);
      if (existingItem) {
        return currentItems.map((item) =>
          item.bot.id === bot.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...currentItems, { bot, quantity: 1 }];
    });
  };

  const removeFromCart = (botId: string) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.bot.id !== botId)
    );
  };

  const updateQuantity = (botId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(botId);
      return;
    }
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.bot.id === botId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalOldPrice = items.reduce(
    (sum, item) => sum + (item.bot.oldPrice ?? 0) * item.quantity,
    0
  );
  const totalPrice = items.reduce(
    (sum, item) => sum + item.bot.price * item.quantity,
    0
  );
  const totalDiscount = Math.abs(totalOldPrice - totalPrice);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        totalDiscount,
        totalOldPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
