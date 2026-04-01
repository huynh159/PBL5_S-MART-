import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ShoppingCart, ArrowLeft, MessageCircle, Star, CreditCard, CheckCheck } from 'lucide-react';
import productService from '../services/product.service';
import cartService from '../services/cart.service';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  const [averageRating, setAverageRating] = useState(0);
  const [totalSold, setTotalSold] = useState(0);
  const [reviews, setReviews] = useState([]);

  const { token } = useAuth();
  const { fetchCartCount } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [detail, stats, reviewList] = await Promise.all([
          productService.getProductDetail(id),
          productService.getProductReviewStats(id),
          productService.getProductReviews(id),
        ]);
        setProduct(detail);
        setAverageRating(stats?.averageRating || 0);
        setTotalSold(stats?.totalSold || detail?.totalSold || 0);
        setReviews(reviewList || []);
      } catch (err) {
        setError('Không thể tải thông tin sản phẩm.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleAddToCart = async () => {
    if (!token) {
      toast.warning('Vui lòng đăng nhập!');
      navigate('/login');
      return null;
    }

    try {
      setAddingToCart(true);
      const addedItem = await cartService.addToCart(product.id, quantity);
      toast.success('Đã thêm sản phẩm vào giỏ hàng!');
      fetchCartCount();
      return addedItem;
    } catch (err) {
      toast.error('Có lỗi xảy ra khi thêm vào giỏ hàng.');
      console.error(err);
      return null;
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    const addedItem = await handleAddToCart();
    if (addedItem) {
      navigate('/checkout', { state: { selectedItems: [addedItem.id] } });
    }
  };

  const handleChat = () => {
    if (!token) {
      toast.warning('Vui lòng đăng nhập!');
      navigate('/login');
      return;
    }
    navigate('/chat', { state: { productId: product.id, productName: product.name, productLink: window.location.href } });
  };

  const increaseQty = () => setQuantity(prev => (prev < product.stock ? prev + 1 : prev));
  const decreaseQty = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  const [selectedColor, setSelectedColor] = useState('Đen');
  const [selectedSize, setSelectedSize] = useState('L');

  const colors = ['Đen', 'Trắng', 'Xanh', 'Đỏ'];
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

  const renderStars = (value, size = 'w-5 h-5') => {
    const rounded = Math.round(value);
    return (
      <div className="flex text-yellow-400">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`${size} ${i < rounded ? 'fill-current' : 'text-gray-300'}`} />
        ))}
      </div>
    );
  };

  const maskEmail = (email = '') => {
    const [name] = email.split('@');
    if (name.length <= 2) return email;
    return name.slice(0, 2) + '***@' + '***';
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Đang tải sản phẩm...</div>;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!product) return <div className="text-center py-20 text-gray-500">Không tìm thấy sản phẩm.</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 md:p-12 mb-10">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-500 hover:text-blue-600 mb-8 transition"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Quay lại
      </button>

      <div className="flex flex-col md:flex-row gap-12">
        {/* Cột Trái: Ảnh Sản phẩm */}
        <div className="w-full md:w-1/2">
          <div className="bg-gray-100 rounded-2xl h-96 w-full overflow-hidden flex items-center justify-center">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400 font-medium">Chưa có hình ảnh</span>
            )}
          </div>
        </div>

        {/* Cột Phải: Thông tin & Mua hàng */}
        <div className="w-full md:w-1/2 flex flex-col justify-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

          {/* Rating & Sold từ Backend */}
          <div className="flex items-center flex-wrap gap-4 mb-4 text-sm">
            <div className="flex items-center gap-2">
              {renderStars(averageRating)}
              <span className="text-gray-700 font-medium">{averageRating.toFixed(1)}</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <span className="text-gray-600">{reviews.length} Đánh Giá</span>
            <div className="w-px h-4 bg-gray-300" />
            <span className="text-gray-600">Đã bán {totalSold}</span>
          </div>

          <p className="text-4xl font-extrabold text-blue-600 mb-6 bg-blue-50 py-4 px-6 rounded-xl inline-block w-full">
            {product.price ? product.price.toLocaleString('vi-VN') : '0'} ₫
          </p>

          <div className="mb-8">
            <h3 className="font-semibold text-gray-800 mb-2">Mô tả sản phẩm:</h3>
            <p className="text-gray-600 leading-relaxed">
              {product.description || 'Chưa có thông tin mô tả chi tiết cho sản phẩm này.'}
            </p>
          </div>

          {/* Chọn Màu Sắc & Kích Thước */}
          <div className="mb-8 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Màu sắc:</h3>
              <div className="flex flex-wrap gap-3">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-5 py-2 border rounded-lg transition-all ${
                      selectedColor === color
                        ? 'border-blue-600 text-blue-600 bg-blue-50 font-medium'
                        : 'border-gray-200 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Kích thước (Size):</h3>
              <div className="flex flex-wrap gap-3">
                {sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-5 py-2 border rounded-lg transition-all ${
                      selectedSize === size
                        ? 'border-blue-600 text-blue-600 bg-blue-50 font-medium'
                        : 'border-gray-200 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-6 mb-8">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <button onClick={decreaseQty} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold">-</button>
              <span className="px-6 py-2 bg-white text-gray-800">{quantity}</span>
              <button onClick={increaseQty} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold">+</button>
            </div>
            <span className="text-sm text-gray-500">Kho còn: {product.stock || 0}</span>
          </div>

          {/* Buttons: Chat, Add Cart, Buy Now */}
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <button
                onClick={handleChat}
                className="flex-1 flex items-center justify-center py-4 rounded-xl text-blue-600 font-bold border-2 border-blue-600 hover:bg-blue-50 transition-colors"
              >
                <MessageCircle className="w-6 h-6 mr-2" />
                Nhắn tin
              </button>
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || product.stock === 0}
                className={`flex-1 flex items-center justify-center py-4 rounded-xl font-bold text-white transition-colors shadow-md ${
                  product.stock === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                <ShoppingCart className="w-6 h-6 mr-2" />
                {addingToCart ? 'Đang thêm...' : product.stock === 0 ? 'Hết hàng' : 'Thêm Giỏ Hàng'}
              </button>
            </div>
            <button
              onClick={handleBuyNow}
              disabled={addingToCart || product.stock === 0}
              className={`w-full flex items-center justify-center py-4 rounded-xl text-lg font-bold text-white transition-colors shadow-md ${
                product.stock === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              <CreditCard className="w-6 h-6 mr-2" />
               Mua Ngay
            </button>
          </div>
        </div>
      </div>

      {/* Phần Đánh Giá Sản Phẩm */}
      <div className="mt-16 pt-10 border-t border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Đánh Giá Sản Phẩm</h2>

        <div className="bg-gray-50/50 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-8 mb-8 border border-gray-100">
          <div className="md:w-1/4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-200 pb-6 md:pb-0">
            <span className="text-5xl font-extrabold text-yellow-500 mb-2">{averageRating.toFixed(1)}</span>
            {renderStars(averageRating, 'w-6 h-6')}
            <span className="text-gray-500">{reviews.length} Đánh Giá</span>
          </div>

          <div className="flex-1 flex flex-wrap gap-3 content-start text-sm">
            <button className="px-6 py-2 border border-blue-600 text-blue-600 bg-white rounded-full font-medium">Tất cả</button>
            <button className="px-6 py-2 border border-gray-200 text-gray-600 bg-white rounded-full hover:border-gray-400 transition">5 Sao</button>
            <button className="px-6 py-2 border border-gray-200 text-gray-600 bg-white rounded-full hover;border-gray-400 transition">4 Sao</button>
            <button className="px-6 py-2 border border-gray-200 text-gray-600 bg-white rounded-full hover:border-gray-400 transition">3 Sao</button>
            <button className="px-6 py-2 border border-gray-200 text-gray-600 bg-white rounded-full hover:border-gray-400 transition">2 Sao</button>
            <button className="px-6 py-2 border border-gray-200 text-gray-600 bg-white rounded-full hover;border-gray-400 transition">1 Sao</button>
          </div>
        </div>

        <div className="space-y-6">
          {reviews.length === 0 && (
            <p className="text-gray-400 text-sm">Chưa có đánh giá nào cho sản phẩm này.</p>
          )}

          {reviews.map(review => (
            <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
              <div className="flex items-start gap-4">
                <img
                  src={review.user?.avatarUrl || 'https://via.placeholder.com/40'}
                  alt="avatar"
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1">
                    <span className="font-semibold text-gray-800">{maskEmail(review.user?.email || 'Khách hàng')}</span>
                    <span className="text-xs text-gray-500">
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : ''}
                    </span>
                  </div>
                  <div className="mb-2">
                    {renderStars(review.rating, 'w-4 h-4')}
                  </div>
                  <div className="text-gray-500 text-xs mb-2 flex items-center gap-2">
                    <span>Phân loại hàng: {selectedColor}, {selectedSize}</span>
                    <span className="text-green-600 border border-green-200 bg-green-50 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCheck className="w-3 h-3" /> Đã mua hàng
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-line">{review.comment}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

