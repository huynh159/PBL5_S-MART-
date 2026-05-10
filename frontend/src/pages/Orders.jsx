import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import orderService from '../services/order.service';
import { useAuth } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import api from '../services/api';
import { Star, StarHalf, X, Upload } from 'lucide-react';
import { io } from 'socket.io-client';

const STATUS_MAP = {
  PENDING:   { label: 'Chờ xác nhận', color: 'text-yellow-600', icon: Clock },
  PAID:      { label: 'Đã thanh toán',  color: 'text-teal-600',   icon: CheckCircle },
  CONFIRMED: { label: 'Đang chuẩn bị',  color: 'text-blue-600',   icon: CheckCircle },
  SHIPPING:  { label: 'Đang giao',    color: 'text-purple-600', icon: Package },
  DELIVERED: { label: 'Đã giao',      color: 'text-green-600',  icon: CheckCircle },
  CANCELLED: { label: 'Đã hủy',       color: 'text-red-500',    icon: XCircle },
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelingId, setCancelingId] = useState(null);
  const [myReviews, setMyReviews] = useState({});

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewingItem, setReviewingItem] = useState(null);
  const [reviewData, setReviewData] = useState({ id: null, rating: 5, comment: '', images: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const { token } = useAuth();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const [data, reviewsRes] = await Promise.all([
        orderService.getMyOrders(),
        api.get('/reviews/my')
      ]);
      setOrders(data.sort((a,b) => new Date(b.createdAt || b.orderDate) - new Date(a.createdAt || a.orderDate)));
      if (reviewsRes.data) {
        const reviewMap = {};
        reviewsRes.data.forEach(r => { if (r.orderItemId) reviewMap[r.orderItemId] = r; });
        setMyReviews(reviewMap);
      }
    } catch (err) {
      console.error(err);
      setError('Không thể tải lịch sử đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchOrders();

    const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:8080');
    socketRef.current = socket;

    try {
      const decoded = jwtDecode(token);
      const uid = decoded.userId || decoded.id || decoded.sub;
      if (uid) {
        socket.on('connect', () => socket.emit('register', uid));
        socket.on('receiveNotification', () => fetchOrders());
      }
    } catch (e) {}

    return () => { socket.disconnect(); };
  }, [token, navigate]);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy đơn hàng #${orderId} không?`)) return;
    try {
      setCancelingId(orderId);
      await api.put(`/orders/${orderId}/cancel`);
      toast.success('Đã hủy đơn hàng thành công');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể hủy đơn hàng này');
    } finally {
      setCancelingId(null);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingImage(true);
    try {
      let currentImages = [];
      try { if (reviewData.images) currentImages = JSON.parse(reviewData.images); } catch (err) { currentImages = reviewData.images ? [reviewData.images] : []; }
      for (let i = 0; i < files.length; i++) {
          const formData = new FormData();
          formData.append('image', files[i]);
          const res = await api.post('/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          currentImages.push(res.data.url);
      }
      setReviewData({ ...reviewData, images: JSON.stringify(currentImages) });
      toast.success('Tải ảnh thành công!');
    } catch (err) {
      toast.error('Lỗi khi tải ảnh lên');
    } finally {
      setUploadingImage(false);
    }
  };

  const openReviewModal = (order, item, existingReview = null) => {
    let variationStr = '';
    if (item.color || item.size) variationStr = `Phân loại: ${item.color || ''} ${(item.color && item.size) ? ',' : ''} ${item.size || ''}`;
    setReviewingItem({ order, item, variation: variationStr });
    if (existingReview) {
      setReviewData({ id: existingReview.id, rating: existingReview.rating, comment: existingReview.comment, images: existingReview.images || '' });
    } else {
      setReviewData({ id: null, rating: 5, comment: '', images: '' });
    }
    setReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingReview(true);
      if (reviewData.id) {
         await api.put(`/reviews/${reviewData.id}`, { rating: reviewData.rating, comment: reviewData.comment, images: reviewData.images });
      } else {
         await api.post('/reviews', { productId: reviewingItem.item.product.id, rating: reviewData.rating, comment: reviewData.comment, images: reviewData.images, variation: reviewingItem.variation, orderItemId: reviewingItem.item.id });
      }
      setReviewModalOpen(false);
      fetchOrders();
    } catch (err) {
      toast.error('Có lỗi xảy ra khi gửi đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Đang tải lịch sử mua hàng...</div>;

  return (
    <div className="max-w-5xl mx-auto mt-10 bg-gray-50 p-6 md:p-8 rounded-2xl shadow-sm mb-10 min-h-screen relative">
      <div className="flex items-center justify-between mb-8 border-b pb-4">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">Lịch Sử Mua Hàng</h1>
        </div>
      </div>
      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p>Bạn chưa có đơn hàng nào.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const statusInfo = STATUS_MAP[order.status?.toUpperCase()] || STATUS_MAP.PENDING;
            const StatusIcon = statusInfo.icon;
            const orderItems = order.orderItems || order.orderDetails || [];
            const canCancel = ['PENDING', 'PAID', 'CONFIRMED'].includes(order.status?.toUpperCase());
            const canReview = ['DELIVERED'].includes(order.status?.toUpperCase());

            return (
              <div key={order.id} className="bg-white border rounded-xl p-6 hover:shadow-md transition">
                <div className="flex justify-between items-center mb-4 border-b pb-4">
                  <div>
                    <h3 className="font-semibold">Mã đơn: #{order.id}</h3>
                    <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-50 border ${statusInfo.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    <span className="text-sm font-semibold">{statusInfo.label}</span>
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  {orderItems.map((detail, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                        <img src={detail.product?.imageUrl} className="w-12 h-12 object-cover rounded" />
                        <div>
                          <p className="text-sm font-medium">{detail.product?.name}</p>
                          <p className="text-xs text-gray-500">x{detail.quantity}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-semibold">{(detail.price * detail.quantity).toLocaleString('vi-VN')} ₫</span>
                        {canReview && (
                          <button onClick={() => openReviewModal(order, detail, myReviews[detail.id])} className="text-[10px] text-blue-600 font-bold mt-1">
                            {myReviews[detail.id] ? 'Xem đánh giá' : 'Đánh giá ngay'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center border-t pt-4">
                  <div className="flex gap-2">
                    {canCancel && (
                      <button onClick={() => handleCancelOrder(order.id)} disabled={cancelingId === order.id} className="text-xs text-red-600 font-bold border border-red-200 px-3 py-1.5 rounded hover:bg-red-50">Hủy đơn</button>
                    )}
                    {order.status === 'PENDING' && order.paymentMethod === 'VNPAY' && (
                      <button 
                        onClick={async () => {
                          try {
                            const payData = await orderService.createVnpayPayment(order.id);
                            window.location.href = payData.paymentUrl;
                          } catch (err) {
                            toast.error('Không thể tạo liên kết thanh toán. Thử lại sau!');
                          }
                        }}
                        className="text-xs bg-indigo-600 text-white font-bold px-3 py-1.5 rounded hover:bg-indigo-700 shadow-sm transition"
                      >
                        Thanh toán ngay
                      </button>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500 mr-2">Tổng:</span>
                    <span className="font-bold text-red-500">{(order.total || 0).toLocaleString('vi-VN')} ₫</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
             {/* Header */}
             <div className="flex justify-between items-center bg-slate-50 px-6 py-4 border-b">
                 <h2 className="text-xl font-bold text-gray-800">
                    {reviewData.id ? 'Xem / Sửa Đánh giá' : 'Đánh giá sản phẩm'}
                 </h2>
                 <button onClick={() => setReviewModalOpen(false)} className="text-gray-400 hover:bg-gray-200 p-2 rounded-full transition">
                     <X className="w-5 h-5" />
                 </button>
             </div>

             {/* Body */}
             <div className="p-6 overflow-y-auto flex-1">
                 {/* Product Info */}
                 <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                    <img src={reviewingItem?.item?.product?.imageUrl} className="w-16 h-16 object-cover rounded-lg border border-gray-100" />
                    <div>
                       <p className="font-semibold text-gray-800 leading-tight">{reviewingItem?.item?.product?.name}</p>
                       <p className="text-xs text-gray-500 mt-1">{reviewingItem?.variation}</p>
                    </div>
                 </div>

                 {/* Star Rating */}
                 <div className="flex flex-col items-center mb-6">
                    <p className="text-sm font-medium text-gray-600 mb-3">Chất lượng sản phẩm</p>
                    <div className="flex gap-2 cursor-pointer">
                       {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            onClick={() => setReviewData({...reviewData, rating: star})}
                            className={`w-10 h-10 transition-transform hover:scale-110 ${star <= reviewData.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                       ))}
                    </div>
                    <p className="text-sm mt-3 font-semibold text-yellow-600">
                       {reviewData.rating === 5 ? 'Tuyệt vời' : reviewData.rating === 4 ? 'Rất tốt' : reviewData.rating === 3 ? 'Bình thường' : reviewData.rating === 2 ? 'Kém' : 'Rất tệ'}
                    </p>
                 </div>

                 {/* Review Comment */}
                 <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-4 focus-within:ring-2 focus-within:ring-blue-500 transition">
                     <textarea
                        className="w-full bg-transparent text-sm text-gray-700 outline-none resize-none placeholder:text-gray-400"
                        rows="4"
                        placeholder="Hãy chia sẻ những điều bạn thích về sản phẩm này nhé (tối thiểu 10 ký tự)..."
                        value={reviewData.comment}
                        onChange={e => setReviewData({...reviewData, comment: e.target.value})}
                     />
                 </div>

                 {/* Images Upload */}
                 <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Hình ảnh thực tế (Tùy chọn)</p>
                    <div className="flex gap-3 flex-wrap">
                       {/* Display current images */}
                       {(()=>{
                          let imgs = [];
                          try { if (reviewData.images) imgs = JSON.parse(reviewData.images); } catch { imgs = reviewData.images ? [reviewData.images] : []; }
                          return imgs.map((img, idx) => {
                             const imgSrc = img.startsWith('http') ? img : `${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}${img.startsWith('/') ? img : '/' + img}`;
                             return (
                                 <div key={idx} className="relative w-20 h-20 rounded-lg border flex-shrink-0 group">
                                    <img src={imgSrc} className="w-full h-full object-cover rounded-lg" />
                                    <button className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow"
                                        onClick={() => {
                                            const newImgs = imgs.filter((_, i) => i !== idx);
                                            setReviewData({...reviewData, images: JSON.stringify(newImgs)});
                                        }}>
                                       <X className="w-3 h-3" />
                                    </button>
                                 </div>
                             );
                          });
                       })()}

                       {/* Upload button */}
                       {((() => {
                          let imgs = [];
                          try { if (reviewData.images) imgs = JSON.parse(reviewData.images); } catch { imgs = reviewData.images ? [reviewData.images] : []; }
                          return imgs.length < 5;
                       })()) && (
                          <label className={`w-20 h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition ${uploadingImage ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-500 hover:bg-gray-50'}`}>
                             {uploadingImage ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                             ) : (
                                <>
                                  <Upload className="w-5 h-5 text-gray-400 mb-1" />
                                  <span className="text-[10px] text-gray-500 font-medium">Thêm ảnh</span>
                                </>
                             )}
                             <input type="file" multiple accept="image/*" className="hidden" disabled={uploadingImage} onChange={handleImageUpload} />
                          </label>
                       )}
                    </div>
                 </div>
             </div>

             {/* Footer Actions */}
             <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t">
                <button onClick={() => setReviewModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition">Trở lại</button>
                <button onClick={handleReviewSubmit} disabled={submittingReview || uploadingImage} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-blue-700 transition flex items-center gap-2 disabled:bg-blue-300">
                    {submittingReview ? 'Đang gửi...' : 'Hoàn thành'}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
