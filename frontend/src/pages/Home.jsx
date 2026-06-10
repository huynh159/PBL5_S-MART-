import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, ChevronLeft, ChevronRight, Sparkles, 
  Zap, Clock, ShoppingBag, Trophy, Activity, 
  Flame, Filter, ArrowRight, ShoppingCart
} from 'lucide-react';
import productService from '../services/product.service';
import { motion, AnimatePresence } from 'framer-motion';

const Home = () => {
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const [products, setProducts] = useState([]);
  const [pinnedProducts, setPinnedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);
  const [search, setSearch] = useState(urlSearch);
  const [searchInput, setSearchInput] = useState(urlSearch);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [, setTotalElements] = useState(0);
  const [aiMode, setAiMode] = useState(false);
  const [, setSearchMeta] = useState(null);
  const PAGE_SIZE = 12;

  useEffect(() => {
    productService.getCategories()
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
      
    productService.getPinnedProducts()
      .then(data => setPinnedProducts(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setSearch(urlSearch);
    setSearchInput(urlSearch);
    setCurrentPage(0);
  }, [urlSearch]);

  useEffect(() => {
    if (aiMode) return;
    const timer = setTimeout(() => {
      if (search !== searchInput) {
        setSearch(searchInput);
        setCurrentPage(0);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, search, aiMode]);

  useEffect(() => {
    if (aiMode && search) return;
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setSearchMeta(null);
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
  }, [search, selectedCategory, currentPage, aiMode]);

  const handleAISearch = useCallback(async (queryText) => {
    if (!queryText || queryText.trim().length === 0) return;
    try {
      setLoading(true);
      setError(null);
      setSearchMeta(null);
      const data = await productService.searchByAI(queryText.trim());
      setProducts(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
      setSearchMeta(data.searchMeta || null);
    } catch (err) {
      setError('AI Search thất bại. Vui lòng thử lại.');
      console.error('AI Search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (aiMode && trimmed) {
      setSearch(trimmed);
      setCurrentPage(0);
      handleAISearch(trimmed);
    } else {
      setSearch(trimmed);
      setCurrentPage(0);
    }
  };

  const handleCategoryClick = (catId) => {
    setSelectedCategory(catId === selectedCategory ? null : catId);
    setCurrentPage(0);
    if (aiMode) {
      setAiMode(false);
      setSearchMeta(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const renderProductCard = (product) => (
    <motion.div 
      layout
      key={product.id}
      variants={itemVariants}
      whileHover={{ y: -8 }}
      className="group relative flex flex-col h-full"
    >
      <Link to={`/product/${product.id}`} className="block flex-1">
        <div className="aspect-[4/5] rounded-[2rem] overflow-hidden bg-slate-100 relative mb-6">
          <img 
            src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/500`}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            onError={e => { e.target.src = `https://picsum.photos/seed/${product.id}/400/500`; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Floating Badge */}
          {product.similarity ? (
            <div className="absolute top-4 right-4 z-20">
              <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-xl">
                {Math.round(product.similarity * 100)}% MATCH
              </span>
            </div>
          ) : product.isPinned ? (
            <div className="absolute top-4 left-4 z-20">
              <span className="bg-amber-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-xl flex items-center gap-1">
                <Flame className="w-3 h-3" /> HOT
              </span>
            </div>
          ) : null}

          {!product.similarity && (
            <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-xl hover:bg-indigo-600 hover:text-white transition-all">
                <ShoppingCart className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <div className="absolute bottom-6 left-6 right-6 z-20 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <button className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl text-sm shadow-xl">
              Chi Tiết Sản Phẩm
            </button>
          </div>
        </div>
        
        <div className="space-y-1 px-2">
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Premium Sportwear</p>
          <h4 className="text-lg font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">{product.name}</h4>
          {product.salePrice ? (
            <div className="flex items-end gap-2">
              <p className="text-xl font-display font-black text-red-600">
                {product.salePrice.toLocaleString('vi-VN')} ₫
              </p>
              <p className="text-sm font-medium text-slate-400 line-through mb-[2px]">
                {product.price ? product.price.toLocaleString('vi-VN') : '0'} ₫
              </p>
            </div>
          ) : (
            <p className="text-xl font-display font-black text-slate-900">
              {product.price ? product.price.toLocaleString('vi-VN') : '0'} ₫
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-16 pb-20">
      
      {/* Hero Section - Redesigned */}
      <section className="relative rounded-[2.5rem] overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950 via-indigo-900/90 to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop" 
          alt="Hero Background" 
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
        />
        <div className="relative z-20 p-12 lg:p-20 flex flex-col items-start max-w-3xl space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: -30 }} 
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20"
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-white text-xs font-black uppercase tracking-[0.2em]">New Season Arrival</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl lg:text-7xl font-display font-black text-white leading-tight tracking-tighter"
          >
            NÂNG TẦM <br />
            <span className="text-indigo-400 italic">SỨC MẠNH</span> THỂ THAO
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-slate-300 font-medium max-w-md leading-relaxed"
          >
            Khám phá bộ sưu tập trang bị thể thao cao cấp nhất năm 2026. Hiệu suất vượt trội, phong cách đẳng cấp.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-4"
          >
            <button className="btn-accent !px-10 !py-4 text-lg shadow-2xl shadow-amber-500/30">
              Mua Sắm Ngay <ShoppingBag className="w-5 h-5" />
            </button>
            <button className="px-10 py-4 rounded-full border border-white/30 text-white font-bold hover:bg-white hover:text-indigo-900 transition-all">
              Bộ Sưu Tập
            </button>
          </motion.div>
        </div>
        
        {/* Abstract Floating Stats */}
        <div className="absolute right-20 bottom-20 z-20 hidden lg:flex flex-col gap-4">
          <div className="glass p-6 rounded-3xl flex items-center gap-4 animate-bounce-slow">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">Trusted By</p>
              <p className="text-xl font-black text-slate-900">10k+ Athletes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Brands Bar */}
      <section className="py-8 border-y border-slate-100 flex items-center justify-around overflow-hidden gap-12 opacity-40 hover:opacity-100 transition-opacity">
        {['NIKE', 'ADIDAS', 'PUMA', 'UNDER ARMOUR', 'REEBOK', 'ASICS'].map(brand => (
          <span key={brand} className="text-2xl font-black tracking-tighter text-slate-400">{brand}</span>
        ))}
      </section>

      {/* Search & Categories Bar */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-display font-black text-slate-800 tracking-tight">Khám Phá Sản Phẩm</h2>
            <p className="text-slate-500 font-medium">Tìm thấy bộ trang bị phù hợp nhất với mục tiêu của bạn.</p>
          </div>
          
          <form onSubmit={handleSearch} className="relative w-full max-w-xl group">
            <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${aiMode ? 'text-indigo-600' : 'text-slate-400 group-focus-within:text-indigo-600'}`}>
              {aiMode ? <Sparkles className="w-5 h-5 animate-pulse" /> : <Search className="w-5 h-5" />}
            </div>
            <input 
              type="text" 
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder={aiMode ? "AI đang lắng nghe bạn..." : "Bạn đang tìm giày, bóng, hay tạ?"}
              className={`w-full bg-white border-none rounded-2xl py-4 pl-14 pr-24 shadow-lg shadow-slate-100/50 outline-none focus:ring-2 transition-all font-medium ${
                aiMode ? 'ring-indigo-500/30' : 'focus:ring-indigo-500/20'
              }`}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
              <button 
                type="button"
                onClick={() => setAiMode(!aiMode)}
                className={`p-2 rounded-xl transition-all ${aiMode ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'}`}
                title="AI Search Mode"
              >
                <Sparkles className="w-4 h-4" />
              </button>
              <button type="submit" className="bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors">
                Tìm
              </button>
            </div>
          </form>
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 custom-scrollbar no-scrollbar">
          <button 
            onClick={() => setSelectedCategory(null)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl whitespace-nowrap font-bold text-sm transition-all ${
              !selectedCategory ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-4 h-4" /> Tất Cả
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl whitespace-nowrap font-bold text-sm transition-all ${
                selectedCategory === cat.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* Pinned Products Section */}
      {!search && !selectedCategory && !aiMode && pinnedProducts.length > 0 && (
        <section className="space-y-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center font-bold">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Sản Phẩm Nổi Bật</h3>
            </div>
          </div>
          <motion.div 
            initial="hidden" animate="visible" variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            <AnimatePresence mode='popLayout'>
              {pinnedProducts.map((product) => renderProductCard(product))}
            </AnimatePresence>
          </motion.div>
        </section>
      )}

      {/* Main Product Grid */}
      <section className="space-y-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              {products.length}
            </div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Sản Phẩm Đề Xuất</h3>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-[4/5] bg-slate-100 animate-pulse rounded-3xl" />
                <div className="h-4 bg-slate-100 animate-pulse rounded w-3/4" />
                <div className="h-4 bg-slate-100 animate-pulse rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            <AnimatePresence mode='popLayout'>
              {products.map((product) => renderProductCard(product))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Search className="w-12 h-12 text-slate-200" />
            </div>
            <h3 className="text-2xl font-black text-slate-800">Oops! Không tìm thấy gì cả</h3>
            <p className="text-slate-500 mt-2 max-w-xs">Hãy thử đổi từ khóa hoặc bộ lọc để tìm sản phẩm ưng ý nhé.</p>
          </div>
        )}
      </section>

      {/* Pagination - Redesigned */}
      {!loading && totalPages > 1 && (
        <section className="flex items-center justify-center gap-2 pt-10 border-t border-slate-100">
          <button 
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="px-6 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center font-bold text-slate-800 text-sm">
            Trang {currentPage + 1} / {totalPages}
          </div>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </section>
      )}

      {/* Newsletter Section */}
      <section className="bg-indigo-600 rounded-[3rem] p-12 lg:p-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-700 rounded-full -ml-32 -mb-32 blur-3xl opacity-50" />
        
        <div className="relative z-10 grid lg:grid-cols-2 items-center gap-12">
          <div className="space-y-6">
            <h2 className="text-4xl lg:text-5xl font-display font-black text-white leading-tight">
              ĐỪNG BỎ LỠ <br /> CƠ HỘI NÀO
            </h2>
            <p className="text-indigo-100 text-lg">Đăng ký nhận tin để là người đầu tiên biết về các bộ sưu tập giới hạn và ưu đãi độc quyền.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <input 
              type="email" 
              placeholder="Nhập email của bạn..." 
              className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-white placeholder-indigo-200 outline-none focus:ring-2 focus:ring-white/30 transition-all"
            />
            <button className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-amber-400 hover:text-slate-900 transition-all shadow-2xl">
              Đăng Ký Ngay
            </button>
          </div>
        </div>
      </section>

    </motion.div>
  );
};

export default Home;
