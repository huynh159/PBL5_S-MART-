import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
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

  const { token } = useAuth();
  const { fetchCartCount } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await productService.getProductById(id);
        setProduct(data);
      } catch (err) {
        setError('Không thể tải thông tin sản phẩm.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!token) {
      toast.warning('Vui lòng đăng nhập để thêm vào giỏ hàng!');
      navigate('/login');
      return;
    }

    try {
      setAddingToCart(true);
      await cartService.addToCart(product.id, quantity);
      toast.success('Đã thêm sản phẩm vào giỏ hàng!');
      fetchCartCount(); // Cập nhật lại số lượng giỏ hàng trên Header ngay lập tức
    } catch (err) {
      toast.error('Có lỗi xảy ra khi thêm vào giỏ hàng.');
      console.error(err);
    } finally {
      setAddingToCart(false);
    }
  };

  const increaseQty = () => setQuantity(prev => (prev < product.stock ? prev + 1 : prev));
  const decreaseQty = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

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
          <p className="text-4xl font-extrabold text-blue-600 mb-6">
            {product.price ? product.price.toLocaleString('vi-VN') : '0'} ₫
          </p>

          <div className="mb-8">
            <h3 className="font-semibold text-gray-800 mb-2">Mô tả sản phẩm:</h3>
            <p className="text-gray-600 leading-relaxed">
              {product.description || 'Chưa có thông tin mô tả chi tiết cho sản phẩm này.'}
            </p>
          </div>

          <div className="flex items-center space-x-6 mb-8">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <button onClick={decreaseQty} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold">-</button>
              <span className="px-6 py-2 bg-white text-gray-800">{quantity}</span>
              <button onClick={increaseQty} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold">+</button>
            </div>
            <span className="text-sm text-gray-500">Kho còn: {product.stock || 0}</span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={addingToCart || product.stock === 0}
            className={`flex items-center justify-center w-full py-4 rounded-xl text-lg font-bold text-white transition-colors shadow-md ${
              product.stock === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <ShoppingCart className="w-6 h-6 mr-3" />
            {addingToCart ? 'Đang thêm...' : product.stock === 0 ? 'Hết hàng' : 'Thêm Vào Giỏ Hàng'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

