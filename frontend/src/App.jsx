import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import './App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyOtp = lazy(() => import('./pages/VerifyOtp'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Home = lazy(() => import('./pages/Home'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Orders = lazy(() => import('./pages/Orders'));
const SingleOrder = lazy(() => import('./pages/SingleOrder'));
const PaymentCallback = lazy(() => import('./pages/PaymentCallback'));
const Profile = lazy(() => import('./pages/Profile'));
const Vouchers = lazy(() => import('./pages/Vouchers'));
const Chat = lazy(() => import('./pages/Chat'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminChat = lazy(() => import('./pages/admin/AdminChat'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'));

const Loading = () => (
  <div className="flex items-center justify-center p-20 text-gray-400">Đang tải...</div>
);

const withSuspense = (element) => (
  <Suspense fallback={<Loading />}>{element}</Suspense>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ScrollToTop />
          <Routes>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={withSuspense(<Login />)} />
              <Route path="/register" element={withSuspense(<Register />)} />
              <Route path="/verify-otp" element={withSuspense(<VerifyOtp />)} />
              <Route path="/forgot-password" element={withSuspense(<ForgotPassword />)} />
              <Route path="/reset-password" element={withSuspense(<ResetPassword />)} />
            </Route>

            <Route element={<MainLayout />}>
              <Route path="/" element={withSuspense(<Home />)} />
              <Route path="/product/:id" element={withSuspense(<ProductDetail />)} />
              <Route path="/cart" element={withSuspense(<Cart />)} />
              <Route path="/checkout" element={withSuspense(<Checkout />)} />
              <Route path="/orders" element={withSuspense(<Orders />)} />
              <Route path="/orders/:id" element={withSuspense(<SingleOrder />)} />
              <Route path="/profile" element={withSuspense(<Profile />)} />
              <Route path="/vouchers" element={withSuspense(<Vouchers />)} />
              <Route path="/chat" element={withSuspense(<Chat />)} />
            </Route>

            <Route path="/payment-status" element={withSuspense(<PaymentCallback />)} />

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={withSuspense(<AdminDashboard />)} />
              <Route path="products" element={withSuspense(<AdminProducts />)} />
              <Route path="orders" element={withSuspense(<AdminOrders />)} />
              <Route path="users" element={withSuspense(<AdminUsers />)} />
              <Route path="coupons" element={withSuspense(<AdminCoupons />)} />
              <Route path="notifications" element={withSuspense(<AdminNotifications />)} />
              <Route path="chat" element={withSuspense(<AdminChat />)} />
              <Route path="profile" element={withSuspense(<Profile />)} />
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
