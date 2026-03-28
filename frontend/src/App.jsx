import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css'
import AuthLayout from './layouts/AuthLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function App() {
  return (
    <BrowserRouter>
      {/* Bộ định tuyến (Routing Configuration) */}
      <Routes>

        {/* Layout dùng riêng cho phần Xác thực (Auth) */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* Dummy Layout dùng cho Trang chủ khi đã login */}
        <Route path="/" element={
          <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-6">
            <h1 className="text-4xl font-bold text-blue-600">Chào mừng đến với S-Mart</h1>
            <p className="text-gray-600">Bạn đang ở Trang Chủ (Home Page) nhưng chưa có nội dung!</p>
            <div className="flex gap-4">
              <a href="/login" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Đi đến trang Đăng nhập
              </a>
              <a href="/register" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                Đi đến trang Đăng ký
              </a>
            </div>
          </div>
        } />

      </Routes>
    </BrowserRouter>
  )
}

export default App
