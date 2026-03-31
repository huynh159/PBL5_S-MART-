/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import cartService from '../services/cart.service';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const { token } = useAuth(); // Theo dõi trạng thái login

  // Hàm load lại số lượng trên giỏ hàng
  const fetchCartCount = useCallback(async () => {
    if (!token) {
      setCartCount(0);
      return;
    }
    try {
      const data = await cartService.getCart();
      const count = data.reduce((total, item) => total + item.quantity, 0);
      setCartCount(count);
    } catch (err) {
      console.error("Lỗi khi tải số lượng giỏ hàng:", err);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCartCount();
  }, [fetchCartCount]);

  return (
    <CartContext.Provider value={{ cartCount, fetchCartCount }}>
      {children}
    </CartContext.Provider>
  );
};

