import { useState, useEffect } from 'react';
import { couponService } from '../../services/coupon.service';
import { toast } from 'react-toastify';
import { Search, Plus, Trash2, Pencil, CheckCircle, XCircle } from 'lucide-react';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    discountPercent: 0,
    expiryDate: '',
    isActive: true
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const { data } = await couponService.getAllCoupons();
      setCoupons(data);
    } catch (err) {
      toast.error('Lỗi khi tải danh sách mã giảm giá!');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (coupon = null) => {
    if (coupon) {
      setEditingId(coupon.id);
      setFormData({
        code: coupon.code,
        discountPercent: coupon.discountPercent,
        expiryDate: coupon.expiryDate ? coupon.expiryDate : '',
        isActive: coupon.isActive
      });
    } else {
      setEditingId(null);
      setFormData({
        code: '',
        discountPercent: 10,
        expiryDate: '',
        isActive: true
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await couponService.updateCoupon(editingId, formData);
        toast.success('Cập nhật mã giảm giá thành công!');
      } else {
        await couponService.createCoupon(formData);
        toast.success('Thêm mã giảm giá mới thành công!');
      }
      setShowModal(false);
      fetchCoupons();
    } catch (err) {
      toast.error('Có lỗi xảy ra, vui lòng thử lại.');
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Xác nhận xóa mã "${code}"?`)) return;
    try {
      await couponService.deleteCoupon(id);
      toast.success('Đã xóa mã giảm giá!');
      setCoupons(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      toast.error('Lỗi khi xóa mã!');
    }
  };

  const filteredCoupons = coupons.filter(c =>
    c.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">Quản Lý Mã Giảm Giá</h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl hover:bg-slate-700 transition"
        >
          <Plus className="w-5 h-5" />
          Thêm mã mới
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4 shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã (code)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Đang tải dữ liệu...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-700 uppercase text-xs tracking-wider">
                  <th className="p-4 font-semibold rounded-tl-xl border-b">ID</th>
                  <th className="p-4 font-semibold border-b">Mã CODE</th>
                  <th className="p-4 font-semibold border-b">Giảm (%)</th>
                  <th className="p-4 font-semibold border-b">Ngày hết hạn</th>
                  <th className="p-4 font-semibold border-b">Trạng thái</th>
                  <th className="p-4 font-semibold border-b text-center rounded-tr-xl">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCoupons.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 text-gray-500 font-medium">#{c.id}</td>
                    <td className="p-4">
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-bold">
                        {c.code}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-red-500">
                      -{c.discountPercent}%
                    </td>
                    <td className="p-4 text-gray-600">
                      {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                    </td>
                    <td className="p-4">
                      {c.isActive ? (
                        <span className="flex items-center gap-1 text-green-600 font-medium text-sm bg-green-50 px-3 py-1 rounded-full w-max">
                          <CheckCircle className="w-4 h-4" /> Hoạt động
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600 font-medium text-sm bg-red-50 px-3 py-1 rounded-full w-max">
                          <XCircle className="w-4 h-4" /> Khóa
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal(c)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Sửa"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.code)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
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

            {filteredCoupons.length === 0 && (
              <div className="text-center py-10 text-gray-500">Không tìm thấy mã nào.</div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex place-items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="bg-slate-800 p-4 border-b">
              <h2 className="text-xl font-bold text-white">
                {editingId ? 'Cập nhật mã giảm giá' : 'Thêm mã mới'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã (CODE) *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: SUMMER2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phần trăm giảm (%) *</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={formData.discountPercent}
                  onChange={(e) => setFormData({...formData, discountPercent: Number(e.target.value)})}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hết hạn *</label>
                <input
                  type="date"
                  required
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Cho phép hoạt động (Kích hoạt)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition font-medium"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition font-medium"
                >
                  {editingId ? 'Lưu thay đổi' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;

