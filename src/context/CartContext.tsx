import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, variant: any) => void;
  updateQuantity: (productId: string, variant: any, quantity: number) => void;
  updateMessage: (productId: string, variant: any, message: string) => void;
  toggleSelection: (productId: string, variant: any) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  selectedItems: CartItem[];
}

const CartContext = createContext<CartContextType>({
  items: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  updateMessage: () => {},
  toggleSelection: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0,
  selectedItems: [],
});

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('bakery_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('bakery_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (newItem: CartItem) => {
    setItems(prev => {
      const currentTotal = prev.reduce((acc, i) => acc + i.quantity, 0);
      if (currentTotal + newItem.quantity > 2) {
        alert("Mỗi đơn hàng chỉ được đặt tối đa 2 bánh. Vui lòng kiểm tra lại giỏ hàng.");
        return prev;
      }

      const existing = prev.find(i => 
        i.productId === newItem.productId && 
        JSON.stringify(i.variant) === JSON.stringify(newItem.variant)
      );
      if (existing) {
        return prev.map(i => i === existing ? { ...i, quantity: i.quantity + newItem.quantity, selected: true } : i);
      }
      return [...prev, { ...newItem, selected: true }];
    });
  };

  const removeFromCart = (productId: string, variant: any) => {
    setItems(prev => prev.filter(i => 
      !(i.productId === productId && JSON.stringify(i.variant) === JSON.stringify(variant))
    ));
  };

  const updateQuantity = (productId: string, variant: any, quantity: number) => {
    setItems(prev => {
      const otherItems = prev.filter(i => 
        !(i.productId === productId && JSON.stringify(i.variant) === JSON.stringify(variant))
      );
      const otherTotal = otherItems.reduce((acc, i) => acc + i.quantity, 0);
      
      if (otherTotal + quantity > 2) {
        alert("Mỗi đơn hàng chỉ được đặt tối đa 2 bánh.");
        return prev;
      }

      return prev.map(i => 
        (i.productId === productId && JSON.stringify(i.variant) === JSON.stringify(variant)) 
        ? { ...i, quantity } 
        : i
      );
    });
  };

  const updateMessage = (productId: string, variant: any, message: string) => {
    setItems(prev => prev.map(i => 
      (i.productId === productId && JSON.stringify(i.variant) === JSON.stringify(variant)) 
      ? { ...i, message } 
      : i
    ));
  };

  const toggleSelection = (productId: string, variant: any) => {
    setItems(prev => prev.map(i => 
      (i.productId === productId && JSON.stringify(i.variant) === JSON.stringify(variant)) 
      ? { ...i, selected: !i.selected } 
      : i
    ));
  };

  const clearCart = () => setItems([]);

  const selectedItems = items.filter(i => i.selected);
  const totalItems = selectedItems.reduce((acc, i) => acc + i.quantity, 0);
  const totalPrice = selectedItems.reduce((acc, i) => acc + (i.price || i.product.salePrice || i.product.price) * i.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      items, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      updateMessage,
      toggleSelection, 
      clearCart, 
      totalItems, 
      totalPrice,
      selectedItems 
    }}>
      {children}
    </CartContext.Provider>
  );
};
