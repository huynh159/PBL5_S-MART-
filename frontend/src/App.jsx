import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import SingleOrder from './pages/SingleOrder';
import PaymentCallback from './pages/PaymentCallback';
import Profile from './pages/Profile';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Lazy load các pages dùng WebSocket để tránh lỗi import khi bundle
const Chat = lazy(() => import('./pages/Chat'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminChat = lazy(() => import('./pages/admin/AdminChat'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));

const Loading = () => (
  <div className="flex items-center justify-center p-20 text-gray-400">Đang tải...</div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Auth Layout */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-otp" element={<VerifyOtp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>

            {/* Main Layout */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id" element={<SingleOrder />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/chat" element={
                <Suspense fallback={<Loading />}><Chat /></Suspense>
              } />
            </Route>

            {/* Standalone */}
            <Route path="/payment-status" element={<PaymentCallback />} />

            {/* Admin Layout */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={
                <Suspense fallback={<Loading />}><AdminDashboard /></Suspense>
              } />
              <Route path="products" element={
                <Suspense fallback={<Loading />}><AdminProducts /></Suspense>
              } />
              <Route path="orders" element={
                <Suspense fallback={<Loading />}><AdminOrders /></Suspense>
              } />
              <Route path="users" element={
                <Suspense fallback={<Loading />}><AdminUsers /></Suspense>
              } />
              <Route path="coupons" element={
                <Suspense fallback={<Loading />}><AdminCoupons /></Suspense>
              } />
              <Route path="chat" element={
                <Suspense fallback={<Loading />}><AdminChat /></Suspense>
              } />
            </Route>
          </Routes>

          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            theme="light"
          />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
