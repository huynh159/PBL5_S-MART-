import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Tag, CreditCard, Truck, CheckCircle } from 'lucide-react';
import orderService from '../services/order.service';
import cartService from '../services/cart.service';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Checkout = () => {
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('VNPAY');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(true);
  const { fetchCartCount } = useCart();
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const selectedItemIds = location.state?.selectedItems || [];

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    if (selectedItemIds.length === 0) {
      toast.warning('Không có sản phẩm để thanh toán!');
      navigate('/cart');
      return;
    }
    const loadCart = async () => {
      try {
        const data = await cartService.getCart();
        const selected = data.filter(item => selectedItemIds.includes(item.id));
        setCartItems(selected || []);
      } catch (err) {
        console.error(err);
      } finally {
        setCartLoading(false);
      }
    };
    loadCart();
  }, [token, navigate, location.state]);

  const subtotal = cartItems.reduce((s, item) => s + (item.product?.price || 0) * item.quantity, 0);
  const discount = couponDiscount ? Math.round(subtotal * couponDiscount / 100) : 0;
  const total = subtotal - discount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) { toast.warning('Vui lòng nhập mã giảm giá!'); return; }
    setApplyingCoupon(true);
    try {
      const data = await orderService.applyCoupon(couponCode.trim());
      setCouponDiscount(data.discountPercent);
      toast.success(`Áp dụng mã thành công! Giảm ${data.discountPercent}%`);
    } catch (err) {
      setCouponDiscount(null);
      toast.error(err.response?.data?.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn!');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!address.trim() || !phone.trim()) {
      toast.warning('Vui lòng nhập đầy đủ thông tin giao hàng!');
      return;
    }
    if (cartItems.length === 0) {
      toast.warning('Giỏ hàng đang trống!');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Tạo đơn hàng
      const order = await orderService.createOrder({
        paymentMethod,
        couponCode: couponCode.trim() || null,
        address,
        phone,
        note,
        cartItemIds: selectedItemIds
      });

      await fetchCartCount();

      if (paymentMethod === 'VNPAY') {
        // Step 2: Lấy URL VNPay
        const payData = await orderService.createVnpayPayment(order.id);
        window.location.href = payData.paymentUrl;
      } else {
        // COD: thông báo thành công và chuyển hướng
        toast.success('Đặt hàng thành công! Đơn hàng COD của bạn đang được xử lý.');
        navigate('/orders');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo đơn hàng!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-6 mb-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Thanh Toán</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form giao hàng - cột trái */}
        <form onSubmit={handleCheckout} className="lg:col-span-3 space-y-6">
          {/* Thông tin giao hàng */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-500" /> Thông Tin Giao Hàng
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
                  placeholder="VD: 0987654321"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ giao hàng *</label>
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
                  rows="3"
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú cho shipper (Tùy chọn)</label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
                  placeholder="VD: Gọi trước khi giao, giao buổi chiều..."
                />
              </div>
            </div>
          </div>

          {/* Phương thức thanh toán */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-500" /> Phương Thức Thanh Toán
            </h2>
            <div className="space-y-3">
              {[
                { value: 'VNPAY', label: 'Thanh toán VNPAY', desc: 'Cổng thanh toán trực tuyến an toàn', icon: '🏦' },
                { value: 'COD', label: 'Thanh toán khi nhận hàng (COD)', desc: 'Trả tiền mặt khi nhận hàng', icon: '💵' },
              ].map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition ${
                    paymentMethod === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={opt.value}
                    checked={paymentMethod === opt.value}
                    onChange={() => setPaymentMethod(opt.value)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-2xl">{opt.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-800">{opt.label}</p>
                    <p className="text-sm text-gray-500">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Mã giảm giá */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-green-500" /> Mã Giảm Giá
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-400 outline-none"
                placeholder="Nhập mã giảm giá (VD: SALE20)"
                disabled={couponDiscount !== null}
              />
              {couponDiscount !== null ? (
                <button
                  type="button"
                  onClick={() => { setCouponDiscount(null); setCouponCode(''); }}
                  className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={applyingCoupon}
                  className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition disabled:opacity-60"
                >
                  {applyingCoupon ? '...' : 'Áp dụng'}
                </button>
              )}
            </div>
            {couponDiscount !== null && (
              <div className="mt-3 flex items-center gap-2 text-green-600 font-medium">
                <CheckCircle className="w-4 h-4" />
                Mã hợp lệ! Giảm {couponDiscount}% ({discount.toLocaleString('vi-VN')} ₫)
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || cartItems.length === 0}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-lg shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang xử lý...' : paymentMethod === 'VNPAY' ? '💳 Xác Nhận & Thanh Toán VNPAY' : '📦 Xác Nhận Đặt Hàng COD'}
          </button>
        </form>

        {/* Order Summary - cột phải */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-3">Tóm Tắt Đơn Hàng</h2>

            {cartLoading ? (
              <p className="text-gray-400 py-4 text-center">Đang tải...</p>
            ) : (
              <div className="space-y-3 mb-4">
                {cartItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={item.product?.imageUrl || 'https://via.placeholder.com/40'}
                          alt={item.product?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-gray-700 truncate">{item.product?.name}</span>
                    </div>
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      <span className="text-gray-400 text-xs">x{item.quantity}</span>
                      <span className="font-medium text-gray-800 ml-2">
                        {((item.product?.price || 0) * item.quantity).toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tạm tính</span>
                <span>{subtotal.toLocaleString('vi-VN')} ₫</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Phí vận chuyển</span>
                <span className="text-green-500 font-medium">Miễn phí</span>
              </div>
              {couponDiscount !== null && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Giảm giá ({couponDiscount}%)</span>
                  <span>-{discount.toLocaleString('vi-VN')} ₫</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-3">
                <span>Tổng cộng</span>
                <span className="text-blue-600">{total.toLocaleString('vi-VN')} ₫</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
