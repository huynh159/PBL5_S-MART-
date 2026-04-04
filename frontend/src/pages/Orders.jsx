import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import orderService from '../services/order.service';
import { useAuth } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import api from '../services/api';
import { Star, StarHalf, X, Upload } from 'lucide-react';

const STATUS_MAP = {
  PENDING:   { label: 'Chờ xác nhận',    color: 'text-yellow-600', icon: Clock },
  PAID:      { label: 'Đã thanh toán',   color: 'text-yellow-600', icon: Clock },
  PROCESSING:{ label: 'Đang chuẩn bị',   color: 'text-blue-600',   icon: Clock },
  SHIPPED:   { label: 'Đang giao',       color: 'text-purple-600', icon: Package },
  DELIVERED: { label: 'Đã giao',         color: 'text-green-600',  icon: CheckCircle },
  COMPLETED: { label: 'Hoàn thành',      color: 'text-green-600',  icon: CheckCircle },
  CANCELLED: { label: 'Đã hủy',          color: 'text-red-500',    icon: XCircle },
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelingId, setCancelingId] = useState(null);
  const [myReviews, setMyReviews] = useState({});

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewingItem, setReviewingItem] = useState(null);
  const [reviewData, setReviewData] = useState({ id: null, rating: 5, comment: '', images: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const { token } = useAuth();
  const navigate = useNavigate();
  const stompClientRef = useRef(null);

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
        reviewsRes.data.forEach(r => {
           if (r.orderItemId) {
              reviewMap[r.orderItemId] = r;
           }
        });
        setMyReviews(reviewMap);
      }
    } catch (err) {
      console.error(err);
      setError('Không thể tải lịch sử đơn hàng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchOrders();

    const initWebSocket = async () => {
        try {
          // Lấy ID thật của user từ server
          const userRes = await api.get('/auth/me').catch(() => null);
          let uid = null;
          if (userRes && userRes.data && userRes.data.id) {
             uid = userRes.data.id;
          } else {
             const decoded = jwtDecode(token);
             uid = decoded.userId || decoded.id || decoded.sub;
          }

          if (!uid) return;
          const [{ Client }, SockJSModule] = await Promise.all([
            import('@stomp/stompjs'),
            import('sockjs-client')
          ]);
          const SockJS = SockJSModule.default || SockJSModule;
            const client = new Client({
              webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
              debug: () => {},
              onConnect: () => {
                client.subscribe(`/topic/user-${uid}`, (msg) => {
                  if (msg.body) {
                    // Xóa phần hiển thị toast ở đây để không bị trùng lặp hiển thị ở góc phải nữa
                    fetchOrders();
                  }
                });
              }
            });
          client.activate();
          stompClientRef.current = client;
        } catch (e) {
           console.log("WebSocket connect err: ", e);
        }
    };
    initWebSocket();

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [token, navigate]);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy đơn hàng #${orderId} không?`)) {
      return;
    }
    try {
      setCancelingId(orderId);
      await api.put(`/orders/${orderId}/cancel`);
      toast.success('Đã hủy đơn hàng thành công');
      fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Không thể hủy đơn hàng này');
    } finally {
      setCancelingId(null);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploadingImage(true);
    let newImages = [];
    try {
      let currentImages = [];
      try {
          if (reviewData.images) {
              currentImages = JSON.parse(reviewData.images);
          }
      } catch (err) {
          // If it was a single URL string, convert it to array
          currentImages = reviewData.images ? [reviewData.images] : [];
      }

      for (let i = 0; i < files.length; i++) {
          const formData = new FormData();
          formData.append('image', files[i]);

          const res = await api.post('/upload/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          newImages.push(res.data.url);
      }

      const updatedImages = [...currentImages, ...newImages];
      setReviewData({ ...reviewData, images: JSON.stringify(updatedImages) });
      toast.success(files.length > 1 ? `Tải lên ${files.length} ảnh thành công!` : 'Tải ảnh lên thành công!');
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải ảnh lên');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
      try {
          const currentImages = JSON.parse(reviewData.images);
          const updated = currentImages.filter((_, idx) => idx !== indexToRemove);
          setReviewData({ ...reviewData, images: JSON.stringify(updated) });
      } catch (e) {}
  };

  const openReviewModal = (order, item, existingReview = null) => {
    let variationStr = '';
    if (item.color || item.size) {
      variationStr = `Phân loại: ${item.color || ''} ${(item.color && item.size) ? ',' : ''} ${item.size || ''}`;
    }
    setReviewingItem({ order, item, variation: variationStr });

    if (existingReview) {
      setReviewData({
        id: existingReview.id,
        rating: existingReview.rating,
        comment: existingReview.comment,
        images: existingReview.images || ''
      });
    } else {
      setReviewData({ id: null, rating: 5, comment: '', images: '' });
    }

    setReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewingItem) return;
    try {
      setSubmittingReview(true);

      if (reviewData.id) {
         // Update existing review
         await api.put(`/reviews/${reviewData.id}`, {
            rating: reviewData.rating,
            comment: reviewData.comment,
            images: reviewData.images
         });
         toast.success('Đã cập nhật đánh giá thành công!');
      } else {
         // Create new review
         await api.post('/reviews', {
            productId: reviewingItem.item.product.id,
            rating: reviewData.rating,
            comment: reviewData.comment,
            images: reviewData.images, // JSON array string or URL
            variation: reviewingItem.variation,
            orderItemId: reviewingItem.item.id
         });
         toast.success('Cảm ơn bạn đã đánh giá sản phẩm!');
      }

      setReviewModalOpen(false);
      // Giúp fetch lại danh sách orders và reviews để đồng bộ UI
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Đang tải lịch sử mua hàng...</div>;

  return (
    <div className="max-w-5xl mx-auto mt-10 bg-gray-50 p-6 md:p-8 rounded-2xl shadow-sm mb-10 min-h-screen relative">
      <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">Lịch Sử Mua Hàng</h1>
        </div>
      </div>

      {error && <div className="text-red-500 bg-red-50 p-4 rounded-lg mb-6 shadow-sm border border-red-100">{error}</div>}

      {orders.length === 0 && !error ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-lg">Bạn chưa có đơn hàng nào.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition shadow-md"
          >
            Mua sắm ngay
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const statusInfo = STATUS_MAP[order.status?.toUpperCase()] || STATUS_MAP.PENDING;
            const StatusIcon = statusInfo.icon;
            const orderItems = order.orderItems || order.orderDetails || [];

            // Chỉ cho hủy khi PENDING, PAID, hoặc PROCESSING
            const canCancel = ['PENDING', 'PAID', 'PROCESSING'].includes(order.status?.toUpperCase());
            const canReview = ['DELIVERED', 'COMPLETED'].includes(order.status?.toUpperCase());

            return (
              <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Mã đơn: #{order.id}</h3>
                    <p className="text-sm text-gray-500">
                      Ngày đặt: {new Date(order.createdAt || order.orderDate).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 border border-gray-100 ${statusInfo.color}`}>
                    <StatusIcon className="w-5 h-5" />
                    <span className="font-semibold">{statusInfo.label}</span>
                  </div>
                </div>

                <div className="space-y-4 mb-4">
                  {orderItems.map((detail, idx) => {
                    const existingReview = myReviews[detail.id];

                    return (
                    <div key={idx} className="flex justify-between items-center text-gray-700 bg-gray-50/50 p-3 rounded-lg border border-gray-50 flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                         <div className="w-16 h-16 bg-gray-200 rounded justify-center items-center overflow-hidden">
                             <img src={detail.product?.imageUrl || ''} alt={detail.product?.name} className="w-full h-full object-cover"/>
                         </div>
                         <div>
                          <div className="font-medium text-gray-800">{detail.product?.name || 'Sản phẩm'}</div>
                          {(detail.color || detail.size) && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                  Phân loại: {detail.color} {detail.color && detail.size ? ',' : ''} {detail.size}
                              </div>
                          )}
                          <div className="text-sm text-gray-500">{(detail.price || detail.product?.price || 0).toLocaleString('vi-VN')} ₫</div>
                          <div className="text-sm font-medium mt-1">x{detail.quantity}</div>
                         </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="font-semibold text-blue-600">{((detail.price || detail.product?.price || 0) * detail.quantity).toLocaleString('vi-VN')} ₫</span>
                        {canReview && !existingReview && (
                          <button
                            onClick={() => openReviewModal(order, detail, null)}
                            className="text-xs font-medium bg-orange-100 text-orange-600 px-3 py-1.5 rounded hover:bg-orange-200 transition"
                          >
                            Đánh giá ngay
                          </button>
                        )}
                        {canReview && existingReview && (
                          <button
                            onClick={() => openReviewModal(order, detail, existingReview)}
                            className="text-xs font-medium border border-blue-600 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-50 transition"
                          >
                            Xem đánh giá
                          </button>
                        )}
                      </div>
                    </div>
                  )})}
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4 text-sm text-gray-600 mb-6">
                  <div>
                    <span className="text-gray-400">Người nhận:</span>
                    <span className="ml-2 font-medium text-gray-800">{order.address || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Điện thoại:</span>
                    <span className="ml-2 font-medium text-gray-800">{order.phone || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Thanh toán:</span>
                    <span className="ml-2 font-medium text-gray-800">{order.paymentMethod}</span>
                  </div>
                  {order.note && (
                  <div className="col-span-2">
                    <span className="text-gray-400">Ghi chú:</span>
                    <span className="ml-2 font-medium text-gray-800">{order.note}</span>
                  </div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    {canCancel && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={cancelingId === order.id}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 transition border border-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                        {cancelingId === order.id ? 'Đang hủy...' : 'Hủy đơn hàng'}
                      </button>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500 font-medium mr-3">Tổng số tiền:</span>
                    <span className="text-2xl font-bold text-red-500">
                      {(order.totalAmount || order.total || 0).toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewModalOpen && reviewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-2xl relative">
            <button
              onClick={() => setReviewModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{reviewData.id ? 'Cập nhật đánh giá' : 'Đánh giá sản phẩm'}</h2>

            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100">
              <img src={reviewingItem.item.product?.imageUrl} alt="Sản phẩm" className="w-14 h-14 object-cover rounded-lg border border-gray-200" />
              <div>
                <p className="font-semibold text-gray-800">{reviewingItem.item.product?.name}</p>
                <p className="text-sm text-gray-500">{reviewingItem.variation}</p>
              </div>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chất lượng sản phẩm</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewData({...reviewData, rating: star})}
                      className="focus:outline-none"
                    >
                      <Star className={`w-8 h-8 ${star <= reviewData.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    </button>
                  ))}
                  <span className="ml-3 text-sm font-medium text-yellow-600">
                     {reviewData.rating === 5 ? 'Tuyệt vời' : reviewData.rating === 4 ? 'Hài lòng' : reviewData.rating === 3 ? 'Bình thường' : reviewData.rating === 2 ? 'Kém' : 'Rất tệ'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bình luận của bạn</label>
                <textarea
                  required
                  rows="3"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition resize-none"
                  placeholder="Chia sẻ cảm nhận của bạn về sản phẩm này..."
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({...reviewData, comment: e.target.value})}
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh sản phẩm</label>
                <div className="flex items-center gap-4">
                  <label className={`cursor-pointer px-4 py-2 border border-gray-200 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-gray-50 transition ${uploadingImage ? 'opacity-50 cursor-wait' : 'text-gray-700'}`}>
                    <Upload className="w-4 h-4" />
                    {uploadingImage ? 'Đang tải lên...' : 'Chọn ảnh'}
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploadingImage} />
                  </label>
                  <span className="text-xs text-gray-400 italic">Có thể chọn nhiều ảnh cùng lúc</span>
                </div>

                {reviewData.images && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {(() => {
                        let imgs = [];
                        try {
                            imgs = JSON.parse(reviewData.images);
                        } catch(e) {
                            imgs = reviewData.images ? [reviewData.images] : [];
                        }
                        return imgs.map((img, idx) => (
                           <div key={idx} className="relative group">
                              <img src={img} alt={`Preview ${idx}`} className="w-20 h-20 object-cover rounded-lg border shadow-sm" onError={(e) => e.target.style.display='none'} />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition shadow-md"
                              >
                                ✕
                              </button>
                           </div>
                        ));
                    })()}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setReviewModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition">Hủy</button>
                <button type="submit" disabled={submittingReview} className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition shadow-sm">
                  {submittingReview ? 'Đang gửi...' : 'Gửi Đánh Giá'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;

