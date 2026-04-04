import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import productService from '../services/product.service';

const Home = () => {
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState(urlSearch);
  const [searchInput, setSearchInput] = useState(urlSearch);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const PAGE_SIZE = 12;
  const navigate = useNavigate();

  // Load categories
  useEffect(() => {
    productService.getCategories()
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  // Sync URL search param -> state
  useEffect(() => {
    setSearch(urlSearch);
    setSearchInput(urlSearch);
    setCurrentPage(0);
  }, [urlSearch]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== searchInput) {
        setSearch(searchInput);
        setCurrentPage(0);
      }
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  // Load products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productService.getProducts(currentPage, PAGE_SIZE, search, selectedCategory);
        setProducts(data.content || data);
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalElements || 0);
      } catch (err) {
        setError('Lỗi khi tải dữ liệu sản phẩm!');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [search, selectedCategory, currentPage]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setCurrentPage(0);
  };

  const handleCategoryClick = (catId) => {
    setSelectedCategory(catId === selectedCategory ? null : catId);
    setCurrentPage(0);
  };

  return (
    <div>
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 rounded-2xl mb-10 flex h-72 items-center overflow-hidden relative shadow-xl">
        <div className="z-10 p-10 text-white max-w-lg">
          <p className="text-blue-200 text-sm font-medium mb-2 uppercase tracking-wide">S-Mart Sport Shop</p>
          <h1 className="text-4xl font-extrabold mb-3 leading-tight">Mừng Xuân Đón Lộc!</h1>
          <p className="text-blue-100 text-lg mb-6">Giảm đến 50% cho tất cả dụng cụ thể thao. Nhanh tay săn deal hôm nay!</p>
          <button
            onClick={() => { setSearch(''); setSearchInput(''); setSelectedCategory(null); navigate('/'); }}
            className="bg-yellow-400 text-slate-800 font-bold px-7 py-3 rounded-full hover:bg-yellow-300 transition shadow-lg"
          >
            Mua Sắm Ngay 🛒
          </button>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-indigo-600/60 to-transparent" />
        <div className="absolute bottom-0 right-8 text-9xl opacity-10 select-none">⚽🏀🎾</div>
      </section>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative max-w-2xl mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={e => {
                setSearchInput(e.target.value);
                // Tự động tìm kiếm sau khi gõ (debounce nhẹ)
              }}
              placeholder="Tìm kiếm sản phẩm thể thao..."
              className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-400 outline-none text-gray-700 bg-white"
            />
            <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
          </div>
          <button
            type="submit"
            className="px-6 py-3.5 bg-blue-600 text-white font-medium rounded-2xl hover:bg-blue-700 transition shadow-sm whitespace-nowrap"
          >
            Tìm kiếm
          </button>
        </div>
      </form>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-8">
          <button
            onClick={() => { setSelectedCategory(null); setCurrentPage(0); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              !selectedCategory ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Tất cả
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedCategory === cat.id ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {search ? `Kết quả cho "${search}"${selectedCategory ? ' trong danh mục này' : ''}` : selectedCategory ? 'Sản phẩm theo danh mục' : 'Sản Phẩm Nổi Bật'}
          {!loading && <span className="ml-2 text-base font-normal text-gray-400">({totalElements || products.length} sản phẩm)</span>}
        </h2>
      </div>

      {/* Loading & Error */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-2xl h-72 animate-pulse" />
          ))}
        </div>
      )}
      {!loading && error && <p className="text-red-500 text-center py-8">{error}</p>}

      {/* Product Grid */}
      {!loading && !error && (
        products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="bg-white rounded-2xl shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                {/* Product Image */}
                <div className="h-48 bg-gray-50 overflow-hidden">
                  <img
                    src={product.imageUrl || `https://picsum.photos/seed/${product.id}/300/200`}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e => { e.target.src = `https://picsum.photos/seed/${product.id}/300/200`; }}
                  />
                </div>
                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 line-clamp-2 text-sm leading-snug">{product.name}</h3>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-blue-600 font-bold text-base">
                      {product.price ? product.price.toLocaleString('vi-VN') : '0'} ₫
                    </p>
                    {product.stock !== undefined && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        product.stock > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {product.stock > 0 ? 'Còn hàng' : 'Hết hàng'}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg">Không tìm thấy sản phẩm phù hợp.</p>
          </div>
        )
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-10">
          <button
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
          >
            <ChevronLeft className="w-4 h-4" /> Trước
          </button>
          <span className="text-gray-600 font-medium">
            Trang {currentPage + 1} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
          >
            Sau <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;
