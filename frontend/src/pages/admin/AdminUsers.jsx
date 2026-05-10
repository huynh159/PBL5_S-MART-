import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Users, Lock, Unlock } from 'lucide-react';
import adminService from '../../services/admin.service';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await adminService.getUsers();
        setUsers(data);
      } catch (err) {
        toast.error('Lỗi tải danh sách người dùng');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleToggleLock = async (user) => {
    const isCurrentlyActive = user.status === 'ACTIVE';
    const action = isCurrentlyActive ? 'khóa' : 'mở khóa';
    if (!window.confirm(`Xác nhận ${action} tài khoản ${user.email}?`)) return;
    try {
      await adminService.toggleLockUser(user.id);
      setUsers(prev =>
        prev.map(u => u.id === user.id ? { ...u, status: isCurrentlyActive ? 'LOCKED' : 'ACTIVE' } : u)
      );
      toast.success(`Đã ${action} tài khoản thành công!`);
    } catch (err) {
      toast.error(`Lỗi khi ${action} tài khoản!`);
    }
  };

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-7 h-7 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-800">Quản Lý Khách Hàng</h1>
        <span className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full font-medium">
          {users.length} tài khoản
        </span>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <input
          type="text"
          placeholder="Tìm kiếm theo email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left font-semibold text-gray-600">ID</th>
              <th className="px-6 py-4 text-left font-semibold text-gray-600">Email</th>
              <th className="px-6 py-4 text-center font-semibold text-gray-600">Vai trò</th>
              <th className="px-6 py-4 text-center font-semibold text-gray-600">Xác thực</th>
              <th className="px-6 py-4 text-center font-semibold text-gray-600">Trạng thái</th>
              <th className="px-6 py-4 text-center font-semibold text-gray-600">Ngày tạo</th>
              <th className="px-6 py-4 text-center font-semibold text-gray-600">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center text-gray-400">Đang tải...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-gray-400">Không tìm thấy kết quả</td></tr>
            ) : filtered.map(user => (
              <tr key={user.id} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-6 py-4 text-gray-500">#{user.id}</td>
                <td className="px-6 py-4 font-medium text-gray-800">{user.email}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {user.role || 'USER'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    user.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {user.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {user.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-gray-500 text-xs">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '—'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    {user.role !== 'ADMIN' && (
                      <button
                        onClick={() => handleToggleLock(user)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          user.status === 'ACTIVE'
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'bg-green-100 text-green-600 hover:bg-green-200'
                        }`}
                      >
                        {user.status === 'ACTIVE' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        {user.status === 'ACTIVE' ? 'Khóa TK' : 'Mở Khóa'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;
