import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  ShoppingBag, Plus, Pencil, Trash2, X, Check, 
  Upload, ImageIcon, Sparkles, Brain, Loader2,
  Search, Filter, ExternalLink, ChevronRight,
  MoreVertical, AlertCircle
} from 'lucide-react';
import productService from '../../services/product.service';
import { motion, AnimatePresence } from 'framer-motion';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const initialForm = {
      name: '', price: '', salePrice: '', sku: '',
      description: '', stock: '', imageUrl: '', imageUrls: [],
      categoryId: '', status: 'ACTIVE', brand: '', variations: '[]'
  };
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [bulkColors, setBulkColors] = useState('');
  const [bulkSizes, setBulkSizes] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [search, setSearch] = useState('');
  const [embedStatus, setEmbedStatus] = useState(null);
  const [embedding, setEmbedding] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodData, catData] = await Promise.all([
          productService.getProducts(0, 500, search, null, true),
          productService.getCategories()
      ]);
      setProducts(prodData.content || prodData);
      setCategories(catData);
    } catch (err) {
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    productService.getEmbedStatus().then(data => setEmbedStatus(data)).catch(() => {});
  }, []);

  // Tự động cập nhật tổng kho khi biến thể thay đổi
  useEffect(() => {
    try {
      const vars = JSON.parse(form.variations || '[]');
      if (vars.length > 0) {
        const total = vars.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
        if (total !== parseInt(form.stock)) {
          setForm(f => ({ ...f, stock: total }));
        }
      }
    } catch (e) {}
  }, [form.variations]);

  const handleGenerateEmbeddings = async () => {
    if (!window.confirm('Tạo vector AI cho tất cả sản phẩm?')) return;
    setEmbedding(true);
    try {
      const result = await productService.generateAllEmbeddings();
      toast.success(result.message);
      const newStatus = await productService.getEmbedStatus();
      setEmbedStatus(newStatus);
    } catch (err) {
      toast.error('Lỗi khi tạo vector AI');
    } finally {
      setEmbedding(false);
    }
  };

  const openAdd = () => {
    setEditProduct(null);
    setForm({ ...initialForm, categoryId: categories.length > 0 ? categories[0].id : '', variations: '[]' });
    setBulkColors('');
    setBulkSizes('');
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditProduct(p);
    setBulkColors('');
    setBulkSizes('');
    setForm({
        name: p.name,
        price: p.price,
        salePrice: p.salePrice || '',
        sku: p.sku || '',
        description: p.description || '',
        stock: p.stock,
        imageUrl: p.imageUrl || '',
        imageUrls: p.imageUrls || [],
        categoryId: p.category?.id || '',
        status: p.status || 'ACTIVE',
        brand: p.brand || '',
        variations: p.variations || '[]',
    });
    setShowModal(true);
  };

  const handleImageUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setUploadingImage(true);
      try {
          const res = await productService.uploadImage(file);
          setForm(f => ({ ...f, imageUrl: res.url }));
          toast.success("Tải ảnh chính thành công");
      } catch (err) {
          toast.error("Lỗi khi tải ảnh lên");
      } finally {
          setUploadingImage(false);
      }
  };

  const handleMultipleImagesUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploadingImages(true);
    try {
        const uploadPromises = files.map(file => productService.uploadImage(file));
        const results = await Promise.all(uploadPromises);
        const newUrls = results.map(r => r.url);
        setForm(f => ({ ...f, imageUrls: [...(f.imageUrls || []), ...newUrls] }));
        toast.success(`Đã tải lên ${newUrls.length} ảnh phụ`);
    } catch (err) {
        toast.error("Lỗi khi tải một hoặc nhiều ảnh");
    } finally {
        setUploadingImages(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.categoryId) {
      toast.warning('Vui lòng điền đủ thông tin!');
      return;
    }
    setSaving(true);
    try {
      let parsedVariations = [];
      try { parsedVariations = JSON.parse(form.variations || '[]'); } catch(e) {}

      let totalStock = parseInt(form.stock) || 0;
      if (parsedVariations.length > 0) {
        totalStock = parsedVariations.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
      }

      const payload = {
          ...form,
          price: parseFloat(form.price),
          salePrice: form.salePrice ? parseFloat(form.salePrice) : null,
          stock: totalStock,
          categoryId: parseInt(form.categoryId)
      };
      if (editProduct) {
        await productService.updateProduct(editProduct.id, payload);
        toast.success('Cập nhật thành công!');
      } else {
        await productService.createProduct(payload);
        toast.success('Thêm thành công!');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error('Có lỗi xảy ra!');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Xóa sản phẩm "${name}"?`)) return;
    try {
      await productService.deleteProduct(id);
      toast.success('Đã xóa!');
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      toast.error('Lỗi khi xóa!');
    }
  };

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) || 
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-800 tracking-tight">Product Inventory</h1>
          <p className="text-slate-500 font-medium mt-1">Quản lý kho hàng và thông tin sản phẩm S-Mart.</p>
        </div>
        <button onClick={openAdd} className="btn-primary shadow-xl shadow-indigo-600/20">
          <Plus className="w-5 h-5" /> Thêm Sản Phẩm Mới
        </button>
      </div>

      {/* AI & Search Bar Group */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Input */}
        <div className="lg:col-span-2 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input
            type="text"
            placeholder="Tìm theo tên, mã SKU hoặc thương hiệu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border-none rounded-2xl py-4 pl-14 pr-4 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
          />
        </div>

        {/* AI Vector Search Panel */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-4 text-white shadow-xl shadow-indigo-600/20 flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:rotate-12 transition-transform">
              <Brain className="w-6 h-6 text-indigo-100" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-400" /> AI Vector
              </h3>
              <p className="text-[10px] text-indigo-200 font-black">
                {embedStatus ? `${embedStatus.percentage}% SYNCED` : 'CHECKING...'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleGenerateEmbeddings} 
            disabled={embedding}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center border border-white/10"
          >
            {embedding ? <Loader2 className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Products Table - Re-designed */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Product Info</th>
                <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Category & Brand</th>
                <th className="px-8 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Inventory</th>
                <th className="px-8 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-5 text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence>
                {loading ? (
                  <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></td></tr>
                ) : filteredProducts.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-bold italic">Chưa có sản phẩm nào được tìm thấy...</td></tr>
                ) : filteredProducts.map((p, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    key={p.id} 
                    className="group hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-slate-300 mx-auto mt-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-800 line-clamp-1">{p.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded tracking-tighter uppercase">{p.sku || 'NO SKU'}</span>
                            <span className="text-xs font-bold text-slate-900">{p.price?.toLocaleString('vi-VN')} ₫</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-slate-700">{p.category?.name || 'Uncategorized'}</span>
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{p.brand || 'No Brand'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`text-sm font-black ${
                          p.stock > 10 ? 'text-emerald-600' : p.stock > 0 ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {p.stock} Units
                        </span>
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${p.stock > 10 ? 'bg-emerald-500' : p.stock > 0 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                            style={{ width: `${Math.min(p.stock, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        p.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${p.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        {p.status === 'ACTIVE' ? 'Published' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(p)} className="p-2.5 bg-white border border-slate-100 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl shadow-sm transition-all">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p.id, p.name)} className="p-2.5 bg-white border border-slate-100 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl shadow-sm transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Modal - Re-designed */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 lg:pl-76">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                    <Plus className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-black text-slate-800 tracking-tight">
                      {editProduct ? 'Edit Sports Gear' : 'Add New Equipment'}
                    </h2>
                    <p className="text-sm text-slate-400 font-medium uppercase tracking-widest">Product Details & Configuration</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="p-3 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-12">
                
                {/* Section: Basic Information */}
                <div className="grid lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-4 space-y-6">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Media & Identity</h3>
                    
                    {/* Main Image */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Ảnh chính</label>
                      <div className="aspect-square rounded-[2rem] bg-slate-100 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group">
                        {form.imageUrl ? (
                          <img src={form.imageUrl} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-12 h-12 text-slate-300" />
                        )}
                        <label className="absolute inset-0 flex items-center justify-center bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <Upload className="w-8 h-8 text-white mb-2" />
                          <input type="file" className="hidden" onChange={handleImageUpload} />
                        </label>
                        {uploadingImage && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>}
                      </div>
                    </div>

                    {/* Secondary Images (imageUrls) */}
                    <div className="space-y-4 pt-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Ảnh phụ (Gallery)</label>
                        <label className="cursor-pointer text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                          <Plus className="w-4 h-4" />
                          <span className="text-xs font-bold">Thêm ảnh</span>
                          <input type="file" multiple className="hidden" onChange={handleMultipleImagesUpload} />
                        </label>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {form.imageUrls?.map((url, idx) => (
                          <div key={idx} className="aspect-square rounded-xl bg-slate-100 relative group overflow-hidden border border-slate-200">
                            <img src={url} className="w-full h-full object-cover" />
                            <button 
                              type="button"
                              onClick={() => setForm(f => ({ ...f, imageUrls: f.imageUrls.filter((_, i) => i !== idx) }))}
                              className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {uploadingImages && (
                          <div className="aspect-square rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-8 space-y-8">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Essential Details</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="col-span-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Product Name</label>
                        <input 
                          type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">SKU Code</label>
                        <input 
                          type="text" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                          className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Category</label>
                        <select 
                          value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                          className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="">Select Category</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Pricing & Stock */}
                <div className="space-y-6">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Pricing & Inventory</h3>
                  <div className="grid md:grid-cols-3 gap-8 p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block text-indigo-600">Base Price (₫)</label>
                      <input 
                        type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                        className="w-full bg-white border-none rounded-2xl p-4 font-black text-2xl text-slate-800 shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block text-rose-500">Sale Price (₫)</label>
                      <input 
                        type="number" value={form.salePrice} onChange={e => setForm(f => ({ ...f, salePrice: e.target.value }))}
                        className="w-full bg-white border-none rounded-2xl p-4 font-black text-2xl text-rose-600 shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Stock Level</label>
                      <input 
                        type="number" value={form.stock} disabled
                        className="w-full bg-slate-200/50 border-none rounded-2xl p-4 font-black text-2xl text-slate-500 shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Description */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Description</h3>
                  <textarea 
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full bg-slate-50 border-none rounded-2xl p-6 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                    rows={4}
                    placeholder="Describe the athlete's experience with this gear..."
                  />
                </div>

                {/* Section: Variations (RESTORED LOGIC) */}
                <div className="p-8 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 space-y-8">
                  <div>
                    <h3 className="text-lg font-bold text-indigo-900 mb-2">Quản lý biến thể</h3>
                    <p className="text-sm text-indigo-600/70 mb-6">Thiết lập các tùy chọn về màu sắc và kích thước cho sản phẩm này.</p>
                    
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Màu sắc (cách nhau bằng dấu phẩy)</label>
                        <input 
                          type="text" value={bulkColors} onChange={e => setBulkColors(e.target.value)}
                          placeholder="VD: Đỏ, Xanh, Đen"
                          className="w-full bg-white border border-indigo-100 rounded-xl p-3 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Kích thước (cách nhau bằng dấu phẩy)</label>
                        <input 
                          type="text" value={bulkSizes} onChange={e => setBulkSizes(e.target.value)}
                          placeholder="VD: S, M, L, XL hoặc 39, 40, 41"
                          className="w-full bg-white border border-indigo-100 rounded-xl p-3 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={() => {
                        const colors = bulkColors.split(',').map(s => s.trim()).filter(Boolean);
                        const sizes = bulkSizes.split(',').map(s => s.trim()).filter(Boolean);
                        if (colors.length === 0 || sizes.length === 0) {
                          toast.warning("Vui lòng nhập cả Màu sắc và Kích thước!");
                          return;
                        }
                        const current = JSON.parse(form.variations || '[]');
                        const newVars = [];
                        colors.forEach(c => {
                          sizes.forEach(s => {
                            if (!current.find(v => v.color === c && v.size === s)) {
                              newVars.push({ color: c, size: s, price: form.price, stock: 0 });
                            }
                          });
                        });
                        setForm(f => ({ ...f, variations: JSON.stringify([...current, ...newVars]) }));
                        toast.success(`Đã tạo thêm ${newVars.length} biến thể`);
                      }}
                      className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Tạo biến thể tự động
                    </button>
                  </div>

                  {/* Variations Table */}
                  <div className="bg-white rounded-2xl border border-indigo-100 overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500 font-bold">
                        <tr>
                          <th className="px-4 py-3 text-left">Màu sắc</th>
                          <th className="px-4 py-3 text-left">Kích thước</th>
                          <th className="px-4 py-3 text-left">Giá (₫)</th>
                          <th className="px-4 py-3 text-left">Kho</th>
                          <th className="px-4 py-3 text-center">Xóa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(() => {
                          const vars = JSON.parse(form.variations || '[]');
                          if (vars.length === 0) return <tr><td colSpan={5} className="p-8 text-center text-slate-400 italic">Chưa có biến thể nào được tạo...</td></tr>;
                          
                          return vars.map((v, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3 font-bold text-slate-700">{v.color}</td>
                              <td className="px-4 py-3 font-bold text-slate-700">{v.size}</td>
                              <td className="px-4 py-3">
                                <input 
                                  type="number" value={v.price} 
                                  onChange={e => {
                                    const newVars = [...vars];
                                    newVars[idx].price = e.target.value;
                                    setForm(f => ({ ...f, variations: JSON.stringify(newVars) }));
                                  }}
                                  className="w-24 bg-slate-50 border-none rounded-lg p-1.5 font-bold text-indigo-600 focus:ring-1 focus:ring-indigo-500/20"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input 
                                  type="number" value={v.stock} 
                                  onChange={e => {
                                    const newVars = [...vars];
                                    newVars[idx].stock = e.target.value;
                                    setForm(f => ({ ...f, variations: JSON.stringify(newVars) }));
                                  }}
                                  className="w-20 bg-slate-50 border-none rounded-lg p-1.5 font-bold text-emerald-600 focus:ring-1 focus:ring-indigo-500/20"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const newVars = vars.filter((_, i) => i !== idx);
                                    setForm(f => ({ ...f, variations: JSON.stringify(newVars) }));
                                  }}
                                  className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

              </form>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                <button onClick={() => setShowModal(false)} className="px-8 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-200 transition-all">
                  Cancel
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="flex-1 btn-primary !py-4 shadow-2xl shadow-indigo-600/20"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  {editProduct ? 'Save Changes' : 'Publish Product'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Internal icon for better viz
const TrendingUp = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

export default AdminProducts;
