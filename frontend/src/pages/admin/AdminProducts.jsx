import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ShoppingBag, Plus, Pencil, Trash2, X, Check, Upload, ImageIcon } from 'lucide-react';
import productService from '../../services/product.service';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  
  const initialForm = { 
      name: '', price: '', salePrice: '', sku: '',
      description: '', stock: '', imageUrl: '', 
      categoryId: '', status: 'ACTIVE', brand: '', variations: '' 
  };
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodData, catData] = await Promise.all([
          productService.getProducts(0, 500, search),
          productService.getCategories()
      ]);
      setProducts(prodData.content || prodData);
      setCategories(catData);
    } catch (err) {
      toast.error('Lỗi tải dữ liệu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditProduct(null);
    setForm({ ...initialForm, categoryId: categories.length > 0 ? categories[0].id : '' });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditProduct(p);
    setForm({ 
        name: p.name, 
        price: p.price, 
        salePrice: p.salePrice || '',
        sku: p.sku || '',
        description: p.description || '', 
        stock: p.stock, 
        imageUrl: p.imageUrl || '',
        categoryId: p.category?.id || '',
        status: p.status || 'ACTIVE',
        brand: p.brand || '',
        variations: p.variations || '',
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
          toast.success("Tải ảnh lên thành công");
      } catch (err) {
          toast.error("Lỗi khi tải ảnh lên");
      } finally {
          setUploadingImage(false);
      }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.stock || !form.categoryId) {
      toast.warning('Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }
    setSaving(true);
    try {
      const payload = { 
          ...form, 
          price: parseFloat(form.price), 
          salePrice: form.salePrice ? parseFloat(form.salePrice) : null,
          stock: parseInt(form.stock),
          categoryId: parseInt(form.categoryId)
      };
      
      if (editProduct) {
        await productService.updateProduct(editProduct.id, payload);
        toast.success('Cập nhật sản phẩm thành công!');
      } else {
        await productService.createProduct(payload);
        toast.success('Thêm sản phẩm thành công!');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra!');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Xác nhận xóa sản phẩm "${name}"?`)) return;
    try {
      await productService.deleteProduct(id);
      toast.success('Đã xóa sản phẩm!');
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      toast.error('Lỗi khi xóa sản phẩm!');
    }
  };

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) || 
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-7 h-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Quản Lý Sản Phẩm</h1>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold transition shadow"
        >
          <Plus className="w-5 h-5" /> Thêm Sản Phẩm
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <input
          type="text"
          placeholder="Tìm kiếm theo Tên hoặc Mã sản phẩm (SKU)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left font-semibold text-gray-600 w-16">ID</th>
              <th className="px-6 py-4 text-left font-semibold text-gray-600">Sản phẩm</th>
              <th className="px-6 py-4 text-left font-semibold text-gray-600">Phân loại</th>
              <th className="px-6 py-4 text-right font-semibold text-gray-600">Trạng thái/Kho</th>
              <th className="px-6 py-4 text-center font-semibold text-gray-600 w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={5} className="py-12 text-center text-gray-400">Đang tải...</td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center text-gray-400">Chưa có sản phẩm nào</td></tr>
            ) : filteredProducts.map(p => (
              <tr key={p.id} className={`transition-colors hover:bg-blue-50/30 ${p.status === 'HIDDEN' ? 'opacity-60 bg-gray-50' : ''}`}>
                <td className="px-6 py-4 text-gray-500">#{p.id}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center border border-gray-200">
                      {p.imageUrl
                        ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        : <ImageIcon className="w-6 h-6 text-gray-300" />
                      }
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 line-clamp-1">{p.name}</div>
                      {p.sku && <div className="text-xs font-mono text-gray-500 mt-0.5">SKU: {p.sku}</div>}
                      <div className="text-sm font-semibold text-blue-600 mt-1">
                          {p.salePrice ? (
                             <>
                               {p.salePrice.toLocaleString('vi-VN')} ₫
                               <span className="text-xs text-gray-400 line-through ml-2 font-normal">{p.price?.toLocaleString('vi-VN')} ₫</span>
                             </>
                          ) : (
                             `${p.price?.toLocaleString('vi-VN')} ₫`
                          )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                    <div className="inline-flex flex-col gap-1 items-start">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-md border border-gray-200">{p.category?.name || 'Chưa phân loại'}</span>
                        {p.brand && <span className="text-xs text-blue-600 font-medium">{p.brand}</span>}
                    </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex flex-col items-end gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                          {p.status === 'ACTIVE' ? 'HIỂN THỊ' : 'ĐÃ ẨN'}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                        p.stock > 10 ? 'bg-green-50 text-green-700 border border-green-200' :
                        p.stock > 0 ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                        'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        Kho: {p.stock}
                      </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => openEdit(p)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                      title="Chỉnh sửa"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Thêm/Sửa */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 my-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
                {editProduct ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-5">
              
              {/* Row 1: Tên & Danh mục */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên sản phẩm <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="VD: Giày thể thao Nike Air Max"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Danh mục <span className="text-red-500">*</span></label>
                  <select
                    value={form.categoryId}
                    onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
                    required
                  >
                    <option value="" disabled>-- Chọn danh mục --</option>
                    {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: SKU & Brand & Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mã sản phẩm (SKU)</label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                    placeholder="VD: NKE-AIR-01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Thương hiệu</label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="VD: Nike, Adidas..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Trạng thái</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  >
                    <option value="ACTIVE" className="text-green-600 font-semibold">Hiển thị (Active)</option>
                    <option value="HIDDEN" className="text-gray-500 font-semibold">Đã ẩn (Hidden)</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Giá, Giá Sale, Kho */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Giá gốc (VNĐ) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="500000"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-red-600 mb-1.5">Giá khuyến mãi (VNĐ)</label>
                  <input
                    type="number"
                    value={form.salePrice}
                    onChange={e => setForm(f => ({ ...f, salePrice: e.target.value }))}
                    className="w-full px-4 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-400 outline-none text-red-700"
                    placeholder="Để trống nếu không sale"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Số lượng kho <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="100"
                    min="0"
                    required
                  />
                </div>
              </div>

              {/* Row 4: Biến thể (Kích cỡ, màu sắc) */}
              <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-1.5">Biến thể (Kích cỡ/Màu sắc)</label>
                 <input
                    type="text"
                    value={form.variations}
                    onChange={e => setForm(f => ({ ...f, variations: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="VD: 39, 40, 41 hoặc Đỏ, Đen, Trắng (Phân cách bằng dấu phẩy)"
                  />
              </div>

              {/* Row 5: Ảnh */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hình ảnh sản phẩm</label>
                <div className="flex items-start gap-4">
                    <div className="w-32 h-32 flex-shrink-0 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 flex flex-col items-center justify-center relative group">
                        {form.imageUrl ? (
                            <>
                                <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <label className="cursor-pointer bg-white text-gray-800 p-2 rounded-lg shadow font-medium text-xs">
                                        Đổi Ảnh
                                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                    </label>
                                </div>
                            </>
                        ) : (
                            <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-blue-500 transition-colors">
                                <Upload className="w-8 h-8 mb-2" />
                                <span className="text-xs font-medium text-center px-2">Tải ảnh lên</span>
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            </label>
                        )}
                        {uploadingImage && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                <span className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                        <span className="text-xs text-gray-500 block">Hoặc dán URL liên kết hình ảnh trực tiếp:</span>
                        <input
                          type="url"
                          value={form.imageUrl}
                          onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-sm"
                          placeholder="https://..."
                        />
                    </div>
                </div>
              </div>

              {/* Row 6: Mô tả */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mô tả chi tiết</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows="4"
                  placeholder="Mô tả chất liệu, thiết kế, công dụng của sản phẩm..."
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-32 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-60 shadow-md shadow-blue-500/20"
                >
                  <Check className="w-5 h-5" />
                  {saving ? 'Đang lưu...' : editProduct ? 'Xác Nhận Cập Nhật' : 'Xác Nhận Thêm Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
