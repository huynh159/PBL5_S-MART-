import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ShoppingCart, ArrowLeft, MessageCircle, Star, CreditCard, CheckCheck, ThumbsUp } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
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
  const [activeImage, setActiveImage] = useState('');

  const [parsedVariations, setParsedVariations] = useState([]);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  const [averageRating, setAverageRating] = useState(0);
  const [totalSold, setTotalSold] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [reviewFilter, setReviewFilter] = useState('ALL');

  const { token } = useAuth();
  const { fetchCartCount } = useCart();

  const [similarProducts, setSimilarProducts] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0); // Cuộn lên đầu trang khi đổi sản phẩm
    const fetchData = async () => {
      try {
        setLoading(true);
        const [detail, stats, reviewList, similar] = await Promise.all([
          productService.getProductDetail(id),
          productService.getProductReviewStats(id),
          productService.getProductReviews(id),
          productService.getSimilarProducts(id).catch(() => []) 
        ]);
        setProduct(detail);
        setAverageRating(stats?.averageRating || 0);
        setTotalSold(stats?.totalSold || detail?.totalSold || 0);
        setReviews(reviewList || []);
        setSimilarProducts(similar || []);
        setActiveImage(detail.imageUrl || '');

        let vars = [];
        try {
            vars = JSON.parse(detail.variations || '[]');
        } catch(e) {}
        setParsedVariations(vars);

        if (vars.length > 0) {
            setSelectedColor(vars[0].color);
            setSelectedSize(vars[0].size);
        }
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

    if (parsedVariations.length > 0 && (!selectedColor || !selectedSize)) {
        toast.warning('Vui lòng chọn Màu sắc và Kích thước!');
        document.getElementById('variation-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.getElementById('variation-panel')?.classList.add('ring-2', 'ring-red-500', 'ring-offset-4', 'rounded-lg');
        setTimeout(() => document.getElementById('variation-panel')?.classList.remove('ring-2', 'ring-red-500', 'ring-offset-4', 'rounded-lg'), 1500);
        return null;
    }

    try {
      setAddingToCart(true);
      const payload = {
          productId: product.id,
          quantity,
          color: selectedColor,
          size: selectedSize,
          price: currentPrice
      };
      const addedItem = await cartService.addToCart(payload);
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

  const handleLikeReview = async (reviewId) => {
    if (!token) {
      toast.warning('Vui lòng đăng nhập để thích đánh giá!');
      return;
    }
    try {
      const { default: api } = await import('../services/api');
      const res = await api.put(`/reviews/${reviewId}/like`);
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, likes: res.data.likes } : r));
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi thích đánh giá');
    }
  };

  const handleBuyNow = async () => {
    if (!token) {
      toast.warning('Vui lòng đăng nhập!');
      navigate('/login');
      return;
    }

    if (parsedVariations.length > 0 && (!selectedColor || !selectedSize)) {
        toast.warning('Vui lòng chọn Màu sắc và Kích thước!');
        document.getElementById('variation-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.getElementById('variation-panel')?.classList.add('ring-2', 'ring-red-500', 'ring-offset-4', 'rounded-lg');
        setTimeout(() => document.getElementById('variation-panel')?.classList.remove('ring-2', 'ring-red-500', 'ring-offset-4', 'rounded-lg'), 1500);
        return;
    }

    // Direct object to bypass cart
    const directItem = {
      productId: product.id,
      product: product, // for UI inside checkout
      quantity: quantity,
      color: selectedColor,
      size: selectedSize,
      price: currentPrice
    };

    navigate('/checkout', { state: { directItems: [directItem] } });
  };

  const handleChat = () => {
    if (!token) {
      toast.warning('Vui lòng đăng nhập!');
      navigate('/login');
      return;
    }
    navigate('/chat', { state: { productId: product.id, productName: product.name, productLink: window.location.href } });
  };

  // Determine current stock based on selection
  let currentStock = product?.stock || 0;
  let currentPrice = product?.price || 0;
  let currentSalePrice = product?.salePrice || null;

  if (parsedVariations.length > 0) {
      if (selectedColor && selectedSize) {
          const selectedVar = parsedVariations.find(v => v.color === selectedColor && v.size === selectedSize);
          currentStock = selectedVar ? (parseInt(selectedVar.stock) || 0) : 0;
          if (selectedVar && selectedVar.price) {
              currentPrice = parseInt(selectedVar.price);
              currentSalePrice = null; // Variation price overrides sale price
          }
      } else {
          // If variations exist but not fully selected, allow clicking the button to trigger warning
          currentStock = product?.stock || 999;
      }
  }

  const increaseQty = () => setQuantity(prev => (prev < currentStock ? prev + 1 : prev));
  const decreaseQty = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  // Extract unique colors and sizes
  const availableColors = [...new Set(parsedVariations.map(v => v.color))].filter(Boolean);
  const availableSizes = [...new Set(parsedVariations.map(v => v.size))].filter(Boolean);

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
  if (error) return <div className="text-center text-red-500 py-10">{error}</div>;
  if (!product) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Helmet>
        <title>{product.name} | Sport Shop</title>
        <meta name="description" content={product.description || `Mua ${product.name} tại Sport Shop.`} />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={product.description || `Mua ${product.name} tại Sport Shop.`} />
        <meta property="og:image" content={product.imageUrl} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <button onClick={() => navigate(-1)} className="flex items-center text-blue-600 hover:text-blue-800 mb-6 font-medium">
        <ArrowLeft className="w-5 h-5 mr-2" />
        Quay lại
      </button>

      <div className="flex flex-col md:flex-row gap-12">
        {/* Cột Trái: Ảnh Sản phẩm */}
        <div className="w-full md:w-1/2">
          <div className="bg-gray-100 rounded-2xl h-96 w-full overflow-hidden flex items-center justify-center mb-4">
            {activeImage ? (
              <img src={activeImage} alt={product.name} className="w-full h-full object-contain" />
            ) : (
              <span className="text-gray-400 font-medium">Chưa có hình ảnh</span>
            )}
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2">
            {product.imageUrl && (
              <div
                onClick={() => setActiveImage(product.imageUrl)}
                className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 cursor-pointer transition-colors ${activeImage === product.imageUrl ? 'border-blue-600' : 'border-transparent hover:border-gray-300'}`}
              >
                <img src={product.imageUrl} alt="Main" className="w-full h-full object-cover" />
              </div>
            )}

            {product.imageUrls && product.imageUrls.map((imgUrl, idx) => (
              <div
                key={idx}
                onClick={() => setActiveImage(imgUrl)}
                className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 cursor-pointer transition-colors ${activeImage === imgUrl ? 'border-blue-600' : 'border-transparent hover:border-gray-300'}`}
              >
                <img src={imgUrl} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
              </div>
            ))}
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

          <div className="bg-gray-50/80 p-5 rounded-xl mb-6 border border-gray-100">
             {currentSalePrice ? (
                 <div className="flex items-end gap-3">
                     <span className="text-gray-400 line-through text-lg">{currentPrice.toLocaleString('vi-VN')} ₫</span>
                     <span className="text-4xl font-extrabold text-red-600">{currentSalePrice.toLocaleString('vi-VN')} ₫</span>
                     <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-md ml-2 uppercase tracking-wider">Sale</span>
                 </div>
             ) : (
                 <p className="text-4xl font-extrabold text-red-600">
                   {currentPrice ? currentPrice.toLocaleString('vi-VN') : '0'} ₫
                 </p>
             )}
          </div>

          <div className="mb-8">
            <h3 className="font-semibold text-gray-800 mb-2">Mô tả sản phẩm:</h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
              {product.description || 'Chưa có thông tin mô tả chi tiết cho sản phẩm này.'}
            </p>
          </div>

          {/* Chọn Màu Sắc & Kích Thước */}
          {parsedVariations.length > 0 && (
            <div id="variation-panel" className="mb-8 space-y-4 transition-all duration-300">
              {availableColors.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Màu sắc:</h3>
                    <div className="flex flex-wrap gap-3">
                      {availableColors.map(color => (
                        <button
                          key={color}
                          onClick={() => {
                              setSelectedColor(color);
                              setQuantity(1);
                              // Auto select first available size for this color if current size is not available
                              const sizesForColor = parsedVariations.filter(v => v.color === color).map(v => v.size);
                              if (!sizesForColor.includes(selectedSize) && sizesForColor.length > 0) {
                                  setSelectedSize(sizesForColor[0]);
                              }
                          }}
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
              )}

              {availableSizes.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Kích thước (Size):</h3>
                    <div className="flex flex-wrap gap-3">
                      {availableSizes.map(size => {
                        const isAvailableForColor = parsedVariations.some(v => v.color === selectedColor && v.size === size && parseInt(v.stock) > 0);
                        return (
                          <button
                            key={size}
                            onClick={() => {
                                setSelectedSize(size);
                                setQuantity(1);
                            }}
                            disabled={!isAvailableForColor}
                            className={`px-5 py-2 border rounded-lg transition-all ${
                              selectedSize === size
                                ? 'border-red-600 text-red-600 font-bold shadow-sm relative'
                                : isAvailableForColor
                                    ? 'border-gray-200 text-gray-700 hover:border-red-400 hover:text-red-500 bg-white'
                                    : 'border-dashed border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed opacity-50'
                            }`}
                          >
                            {size}
                            {selectedSize === size && (
                               <div className="absolute top-0 right-0 w-0 h-0 border-t-[12px] border-r-[12px] border-t-red-600 border-r-transparent">
                                   <div className="absolute -top-[10px] right-[2px] text-white text-[8px] leading-none select-none font-bold">✓</div>
                               </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
              )}
            </div>
          )}

          <div className="flex items-center space-x-6 mb-8">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <button onClick={decreaseQty} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold">-</button>
              <span className="px-6 py-2 bg-white text-gray-800">{quantity}</span>
              <button onClick={increaseQty} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold">+</button>
            </div>
            <span className="text-sm text-gray-500">Kho còn: {currentStock}</span>
          </div>

          {/* Buttons: Chat, Add Cart, Buy Now */}
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <button
                onClick={handleChat}
                className="flex-1 flex items-center justify-center py-3.5 rounded-xl text-blue-600 font-bold border-2 border-blue-600 hover:bg-blue-50 transition-colors"
              >
                <MessageCircle className="w-6 h-6 mr-2" />
                Nhắn tin
              </button>
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || currentStock === 0}
                className={`flex-1 flex items-center justify-center py-3.5 rounded-xl font-bold text-white transition-colors shadow-md ${
                  currentStock === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                <ShoppingCart className="w-6 h-6 mr-2" />
                {addingToCart ? 'Đang thêm...' : currentStock === 0 ? 'Hết hàng' : 'Thêm Giỏ Hàng'}
              </button>
            </div>
            <button
              onClick={handleBuyNow}
              disabled={addingToCart || currentStock === 0}
              className={`w-full flex items-center justify-center py-4 rounded-xl text-lg font-bold text-white transition-colors shadow-md ${
                currentStock === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'
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
            <span className="text-gray-500 mt-2">{reviews.length} Đánh Giá</span>
          </div>

          <div className="flex-1 flex flex-wrap gap-3 content-start text-sm">
            <button onClick={() => setReviewFilter('ALL')} className={`px-6 py-2 border rounded-full font-medium transition ${reviewFilter === 'ALL' ? 'border-blue-600 text-blue-600 bg-white' : 'border-gray-200 text-gray-600 bg-white hover:border-gray-400'}`}>Tất cả</button>
            <button onClick={() => setReviewFilter(5)} className={`px-6 py-2 border rounded-full font-medium transition ${reviewFilter === 5 ? 'border-blue-600 text-blue-600 bg-white' : 'border-gray-200 text-gray-600 bg-white hover:border-gray-400'}`}>5 Sao</button>
            <button onClick={() => setReviewFilter(4)} className={`px-6 py-2 border rounded-full font-medium transition ${reviewFilter === 4 ? 'border-blue-600 text-blue-600 bg-white' : 'border-gray-200 text-gray-600 bg-white hover:border-gray-400'}`}>4 Sao</button>
            <button onClick={() => setReviewFilter(3)} className={`px-6 py-2 border rounded-full font-medium transition ${reviewFilter === 3 ? 'border-blue-600 text-blue-600 bg-white' : 'border-gray-200 text-gray-600 bg-white hover:border-gray-400'}`}>3 Sao</button>
            <button onClick={() => setReviewFilter(2)} className={`px-6 py-2 border rounded-full font-medium transition ${reviewFilter === 2 ? 'border-blue-600 text-blue-600 bg-white' : 'border-gray-200 text-gray-600 bg-white hover:border-gray-400'}`}>2 Sao</button>
            <button onClick={() => setReviewFilter(1)} className={`px-6 py-2 border rounded-full font-medium transition ${reviewFilter === 1 ? 'border-blue-600 text-blue-600 bg-white' : 'border-gray-200 text-gray-600 bg-white hover:border-gray-400'}`}>1 Sao</button>
          </div>
        </div>

        <div className="space-y-6">
          {reviews.length === 0 && (
            <p className="text-gray-400 text-sm">Chưa có đánh giá nào cho sản phẩm này.</p>
          )}

          {reviews.filter(r => reviewFilter === 'ALL' || r.rating === reviewFilter).map(review => (
            <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 pt-4">
              <div className="flex items-start gap-4">
                <img
                  src={review.user?.avatarUrl || 'https://ui-avatars.com/api/?name=' + (review.user?.email || 'User') + '&background=random'}
                  alt="avatar"
                  className="w-12 h-12 rounded-full object-cover border border-gray-200"
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
                  <div className="text-gray-500 text-xs mb-3 flex flex-wrap items-center gap-2">
                    {review.variation && (
                      <span className="bg-gray-100 px-2 py-1 rounded text-gray-600">{review.variation}</span>
                    )}
                    <span className="text-green-600 border border-green-200 bg-green-50 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCheck className="w-3 h-3" /> Đã mua hàng
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed mb-3">{review.comment}</p>

                  {review.images && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {(() => {
                          let imgs = [];
                          try {
                              imgs = JSON.parse(review.images);
                          } catch(e) {
                              imgs = review.images ? [review.images] : [];
                          }
                          return imgs.map((img, idx) => (
                              <img key={idx} src={img} alt={`Review attachment ${idx}`} className="w-24 h-24 object-cover rounded-lg border border-gray-200 cursor-pointer shadow-sm hover:opacity-90 transition" onError={(e) => e.target.style.display='none'} />
                          ));
                      })()}
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-2">
                    <button
                      onClick={() => handleLikeReview(review.id)}
                      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Hữu ích {review.likes > 0 ? `(${review.likes})` : ''}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sản phẩm tương tự */}
      {similarProducts.length > 0 && (
        <div className="mt-16 pt-10 border-t border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Sản Phẩm Tương Tự</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {similarProducts.map(sp => (
              <div 
                key={sp.id} 
                onClick={() => navigate(`/product/${sp.id}`)}
                className="bg-white rounded-lg shadow-sm overflow-hidden transition-all transform hover:scale-[1.02] hover:shadow-md cursor-pointer border border-transparent hover:border-blue-100"
              >
                <div className="h-40 bg-gray-100 flex items-center justify-center p-4">
                  <img src={sp.imageUrl} alt={sp.name} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 min-h-[40px]">{sp.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    {renderStars(sp.averageRating || 5, 'w-3 h-3')}
                    <span className="text-[10px] text-gray-500">{sp.totalSold || 0} đã bán</span>
                  </div>
                  <p className="text-lg font-black text-red-600 mt-2">
                    {(sp.salePrice || sp.price || 0).toLocaleString('vi-VN')} ₫
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;

