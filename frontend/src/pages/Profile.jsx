import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Shield, Calendar } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

const Profile = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    try {
      const decoded = jwtDecode(token);
      setUserInfo(decoded);
    } catch (e) {
      console.error('Cannot decode token', e);
    }
  }, [token, navigate]);

  const handleLogout = () => {
    logout();
  };

  if (!userInfo) return null;

  return (
    <div className="max-w-lg mx-auto mt-10 mb-10">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600" />

        {/* Avatar */}
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
              {userInfo.role || 'USER'}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            {userInfo.name || userInfo.sub || 'Người dùng'}
          </h1>

          <div className="space-y-4 mt-6">
            <div className="flex items-center gap-3 text-gray-600 bg-gray-50 px-4 py-3 rounded-xl">
              <Mail className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="font-medium">{userInfo.sub || userInfo.email || '—'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-600 bg-gray-50 px-4 py-3 rounded-xl">
              <Shield className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Vai trò</p>
                <p className="font-medium">{userInfo.role || 'Khách hàng'}</p>
              </div>
            </div>

            {userInfo.exp && (
              <div className="flex items-center gap-3 text-gray-600 bg-gray-50 px-4 py-3 rounded-xl">
                <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Phiên đăng nhập hết hạn</p>
                  <p className="font-medium">
                    {new Date(userInfo.exp * 1000).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="mt-8 w-full py-3 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition border border-red-100"
          >
            Đăng Xuất
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
