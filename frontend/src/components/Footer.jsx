const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">S-Mart</h3>
            <p className="text-gray-400">Mua sắm thả ga với kho tàng sản phẩm chất lượng phong phú.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Hỗ trợ (Support)</h4>
            <ul className="text-gray-400 space-y-2">
              <li><a href="#" className="hover:text-white">Trung tâm hỗ trợ</a></li>
              <li><a href="#" className="hover:text-white">Chính sách bảo hành</a></li>
              <li><a href="#" className="hover:text-white">Hướng dẫn mua hàng</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Về chúng tôi (About Us)</h4>
            <ul className="text-gray-400 space-y-2">
              <li><a href="#" className="hover:text-white">Câu chuyện S-Mart</a></li>
              <li><a href="#" className="hover:text-white">Tuyển dụng</a></li>
              <li><a href="#" className="hover:text-white">Hệ thống cửa hàng</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Kết nối (Connect)</h4>
            <p className="text-gray-400 mb-2">Đăng ký nhận tin</p>
            <div className="flex">
              <input type="email" placeholder="Email của bạn" className="px-4 py-2 w-full rounded-l-md text-gray-900" />
              <button className="bg-blue-600 px-4 py-2 rounded-r-md hover:bg-blue-700">Đăng kí</button>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
          <p>&copy; 2024 S-Mart. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

