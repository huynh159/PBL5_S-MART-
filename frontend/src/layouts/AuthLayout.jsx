import { Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        {/* Component con sẽ được render (hiển thị) thay thế vị trí Outlet */}
        <Outlet />
      </div>
      {/* Container cho các thông báo (Toast notifications) */}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default AuthLayout;

