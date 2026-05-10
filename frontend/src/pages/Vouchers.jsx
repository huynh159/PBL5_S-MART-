import React, { useState, useEffect } from 'react';
import { Ticket, Copy, CheckCircle2, Clock, Zap } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';

const Vouchers = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await api.get('/coupons/public');
      setCoupons(response.data);
    } catch (error) {
      console.error('Error fetching public coupons:', error);
      toast.error('Lỗi khi tải dữ liệu mã giảm giá');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Đã sao chép mã giảm giá!');
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const calculateDaysLeft = (expiryDate) => {
    const diff = new Date(expiryDate).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days > 0 ? days : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 font-medium text-lg flex items-center gap-2">
          <Zap className="w-5 h-5 animate-pulse text-yellow-500" /> Đang tải dữ liệu voucher...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 min-h-screen">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-4 bg-orange-100 rounded-full mb-4">
          <Ticket className="w-10 h-10 text-orange-600" />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Kho Voucher Siêu Ưu Đãi</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Săn ngay các mã giảm giá hấp dẫn đang có sẵn. Số lượng có hạn, nhanh tay copy mã và sử dụng ở bước thanh toán trước khi hết lượt!
        </p>
      </div>

      {/* Voucher Grid */}
      {coupons.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
          <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-500">Hiện tại chưa có mã giảm giá nào</h3>
          <p className="text-gray-400 mt-2">Hãy quay lại sau để cập nhật những ưu đãi mới nhất nhé!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => {
            const daysLeft = calculateDaysLeft(coupon.expiryDate);
            const isLowStock = coupon.quantity <= 10;

            return (
              <div 
                key={coupon.id} 
                className="relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group flex flex-col"
              >
                {/* Decorative cutouts */}
                <div className="absolute top-1/2 -translate-y-1/2 -left-3 w-6 h-6 bg-gray-50 rounded-full border-r border-gray-100"></div>
                <div className="absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 bg-gray-50 rounded-full border-l border-gray-100"></div>
                
                {/* Dashed divider */}
                <div className="absolute top-1/2 left-4 right-4 border-t-2 border-dashed border-gray-100 -z-10"></div>

                {/* Top Half: Info */}
                <div className="p-6 pb-8 bg-gradient-to-br from-orange-50 to-white">
                  <div className="flex justify-between items-start mb-4">
                    <span className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-700 font-bold px-3 py-1 rounded-full text-sm">
                      <Zap className="w-4 h-4" />
                      Giảm {coupon.discountPercent}%
                    </span>
                    <span className="text-xs font-semibold text-gray-500 bg-white px-2 py-1 rounded-md border shadow-sm">
                      MÃ: {coupon.code}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-800 mb-2">Ưu đãi giảm {coupon.discountPercent}% toàn sàn</h3>
                  
                  <div className="flex items-center gap-4 text-sm mt-4">
                    <div className="flex items-center gap-1.5 text-gray-600 font-medium">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {daysLeft > 0 ? `Còn ${daysLeft} ngày` : 'Hết hạn hôm nay'}
                    </div>
                  </div>
                </div>

                {/* Bottom Half: Action */}
                <div className="p-6 pt-8 bg-white flex flex-col items-center mt-auto border-t border-dashed border-gray-200">
                  <div className="w-full flex justify-between items-center mb-4">
                    <span className="text-sm font-medium text-gray-500">Tiến độ săn mã</span>
                    <span className={`text-sm font-bold ${isLowStock ? 'text-red-500 animate-pulse' : 'text-blue-600'}`}>
                      Còn {coupon.quantity} lượt
                    </span>
                  </div>
                  
                  {/* Progress bar fake visual */}
                  <div className="w-full h-2 bg-gray-100 rounded-full mb-6 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${isLowStock ? 'bg-red-500' : 'bg-gradient-to-r from-orange-400 to-red-500'}`} 
                      style={{ width: `${Math.min(100, (coupon.quantity / 100) * 100)}%` }}
                    ></div>
                  </div>

                  <button
                    onClick={() => handleCopy(coupon.code)}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                      copiedCode === coupon.code 
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-slate-900 text-white hover:bg-orange-600 hover:shadow-lg hover:-translate-y-0.5'
                    }`}
                  >
                    {copiedCode === coupon.code ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Đã sao chép
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        Sao chép mã ngay
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Vouchers;
