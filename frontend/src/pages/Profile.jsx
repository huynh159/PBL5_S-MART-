import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, KeyRound, Lock, Mail, Shield, User } from 'lucide-react';
import { toast } from 'react-toastify';
import authService from '../services/auth.service';

const Profile = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const profile = await authService.getMe();
        setUserInfo(profile);
      } catch (error) {
        toast.error(error.response?.data?.error || 'Không thể tải thông tin tài khoản');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [token, navigate]);

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (passwordForm.newPassword.length < 6) {
      toast.warning('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.warning('Mật khẩu xác nhận không khớp');
      return;
    }

    setSaving(true);
    try {
      const response = await authService.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      toast.success(response.message || 'Đổi mật khẩu thành công');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Đổi mật khẩu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Đang tải thông tin...</div>;
  }

  if (!userInfo) return null;

  return (
    <div className="max-w-5xl mx-auto mt-10 mb-10">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-6">
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600" />

          <div className="px-8 pb-8">
            <div className="flex justify-between items-end -mt-12 mb-6">
              <div className="w-24 h-24 bg-white rounded-2xl border-4 border-white shadow-lg flex items-center justify-center">
                <User className="w-12 h-12 text-blue-500" />
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold mb-2 ${
                userInfo.role === 'ADMIN'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {userInfo.role || 'CUSTOMER'}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              Hồ sơ tài khoản
            </h1>

            <div className="space-y-4 mt-6">
              <div className="flex items-center gap-3 text-gray-600 bg-gray-50 px-4 py-3 rounded-xl">
                <Mail className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="font-medium">{userInfo.email || '-'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-gray-600 bg-gray-50 px-4 py-3 rounded-xl">
                <Shield className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Vai trò</p>
                  <p className="font-medium">{userInfo.role || 'CUSTOMER'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-gray-600 bg-gray-50 px-4 py-3 rounded-xl">
                <Lock className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Trạng thái</p>
                  <p className="font-medium">{userInfo.status || 'ACTIVE'}</p>
                </div>
              </div>

              {userInfo.createdAt && (
                <div className="flex items-center gap-3 text-gray-600 bg-gray-50 px-4 py-3 rounded-xl">
                  <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Ngày tạo tài khoản</p>
                    <p className="font-medium">
                      {new Date(userInfo.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="mt-8 w-full py-3 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition border border-red-100"
            >
              Đăng xuất
            </button>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Đổi mật khẩu</h2>
              <p className="text-sm text-gray-500">Cập nhật mật khẩu đăng nhập của tài khoản hiện tại.</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                minLength={6}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nhập lại mật khẩu mới</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {saving ? 'Đang cập nhật...' : 'Lưu mật khẩu mới'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Profile;
