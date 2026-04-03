import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, CreditCard } from 'lucide-react';
import { toast } from 'react-toastify';
import cartService from '../services/cart.service';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const navigate = useNavigate();

  const { token } = useAuth();
  const { fetchCartCount } = useCart();

  const fetchCart = useCallback(async () => {
    if (!token) {
      toast.warning('Bạn cần đăng nhập để xem giỏ hàng!');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      const data = await cartService.getCart();
      setCartItems(data);
    } catch (err) {
      setError('Lỗi tải giỏ hàng.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleUpdateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await cartService.updateCartItem(cartItemId, newQuantity);
      setCartItems((prevItems) =>
        prevItems.map(item => item.id === cartItemId ? { ...item, quantity: newQuantity } : item)
      );
      fetchCartCount(); // Đồng bộ lại số lượng Header
    } catch (err) {
      toast.error('Lỗi khi cập nhật số lượng');
      console.error(err);
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    try {
      await cartService.removeCartItem(cartItemId);
      setCartItems((prevItems) => prevItems.filter(item => item.id !== cartItemId));
      setSelectedItemIds((prev) => prev.filter(id => id !== cartItemId));
      fetchCartCount(); // Đồng bộ lại số lượng Header
      toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
    } catch (err) {
      toast.error('Lỗi khi xóa sản phẩm');
      console.error(err);
    }
  };

  const calculateTotal = () => {
    return cartItems
      .filter(item => selectedItemIds.includes(item.id))
      .reduce((total, item) => {
          const itemPrice = item.price ? item.price : (item.product?.salePrice || item.product?.price || 0);
          return total + itemPrice * item.quantity;
      }, 0);
  };

  const handleSelectItem = (id) => {
    setSelectedItemIds(prev =>
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  const handeSelectAll = () => {
    if (selectedItemIds.length === cartItems.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(cartItems.map(item => item.id));
    }
  };

  const handleCheckout = () => {
    if (selectedItemIds.length === 0) {
      toast.warning('Vui lòng chọn ít nhất 1 sản phẩm để thanh toán!');
      return;
    }
    navigate('/checkout', { state: { selectedItems: selectedItemIds } });
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Đang tải giỏ hàng...</div>;

  return (
    <div className="bg-white rounded-2xl shadow p-6 md:p-8 mb-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Giỏ Hàng Của Bạn</h1>

      {error && <div className="text-red-500 text-center mb-6">{error}</div>}

      {cartItems.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-gray-400 mb-6"> Giỏ hàng đang trống! </div>
          <Link to="/" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700">
            Tiếp tục mua sắm
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cột Trái: Danh sách sản phẩm */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={selectedItemIds.length === cartItems.length && cartItems.length > 0}
                onChange={handeSelectAll}
                className="w-5 h-5 cursor-pointer"
              />
              <span className="font-semibold text-gray-700">Chọn tất cả ({cartItems.length} sản phẩm)</span>
            </div>
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center gap-6 bg-gray-50 rounded-xl p-4 border border-gray-100 relative">
                <input
                  type="checkbox"
                  checked={selectedItemIds.includes(item.id)}
                  onChange={() => handleSelectItem(item.id)}
                  className="w-5 h-5 cursor-pointer flex-shrink-0"
                />
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition"
                  title="Xóa sản phẩm"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="w-24 h-24 bg-white rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                  <img src={item.product?.imageUrl || 'https://via.placeholder.com/100'} alt={item.product?.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 line-clamp-2 pr-8">{item.product?.name}</h3>
                  {(item.color || item.size) && (
                      <p className="text-sm text-gray-500 mt-1">
                          Phân loại: {item.color} {item.color && item.size ? ',' : ''} {item.size}
                      </p>
                  )}
                  <p className="text-red-600 font-bold mt-1 text-lg">
                    {(item.price ? item.price : (item.product?.salePrice || item.product?.price || 0)).toLocaleString('vi-VN')} ₫
                  </p>
                  <div className="flex items-center mt-4 bg-white border rounded-lg w-max shadow-sm">
                    <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} className="p-2 text-gray-500 hover:bg-gray-100">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 font-medium">{item.quantity}</span>
                    <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} className="p-2 text-gray-500 hover:bg-gray-100">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cột Phải: Tổng thanh toán */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 h-fit">
            <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">Đơn Hàng (Order Summary)</h2>
            <div className="flex justify-between mb-4">
              <span className="text-gray-600">Tổng phụ:</span>
              <span className="font-semibold text-gray-800">{calculateTotal().toLocaleString('vi-VN')} ₫</span>
            </div>
            <div className="flex justify-between mb-4">
              <span className="text-gray-600">Phí giao hàng:</span>
              <span className="text-green-600 font-semibold">Miễn phí</span>
            </div>
            <div className="flex justify-between mt-6 pt-6 border-t font-bold text-xl">
              <span>Tổng cộng:</span>
              <span className="text-blue-600">{calculateTotal().toLocaleString('vi-VN')} ₫</span>
            </div>

            <button
              onClick={handleCheckout}
              className="mt-8 flex items-center justify-center w-full py-4 bg-yellow-400 text-slate-800 font-bold rounded-xl hover:bg-yellow-500 shadow-md transition text-lg"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Thanh Toán Ngay ({selectedItemIds.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;

