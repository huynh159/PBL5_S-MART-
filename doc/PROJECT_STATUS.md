# 🚀 Bảng Theo Dõi Tiến Độ Dự Án (Project Status & Handover)

Tài liệu này dùng để bàn giao và theo dõi tiến độ công việc giữa các thành viên trong nhóm. Đọc kỹ tài liệu này giúp bạn nắm bắt ngay lập tức code đã làm đến đâu và mục tiêu tiếp theo là gì.

---

## ✅ 1. Những phần ĐÃ HOÀN THÀNH (Completed)

### 🛡️ Authentication & Security (Đã Xong)
- [x] Quản lý User, roles (ADMIN/USER), JWT Authentication, Bcrypt.
- [x] Gửi OTP qua email (Đăng ký, Quên mật khẩu).
- [x] Đăng nhập Google (Google OAuth2).

### 🛍️ Các chức năng Cửa hàng - E-commerce (Đã Xong)
- [x] **Quản lý Sản phẩm & Danh mục**: Xem chi tiết sản phẩm, số lượng tồn kho (stock), đã bán (totalSold), lọc tìm kiếm.
- [x] **Đánh giá & Bình luận (Review)**: User đã mua (COMPLETED/DELIVERED) mới được đánh giá. Hiển thị số sao trung bình.
- [x] **Giỏ hàng (Cart)**: Thêm, sửa, xóa sản phẩm khỏi giỏ hàng.
- [x] **Mã giảm giá (Coupon)**: Áp dụng mã giảm giá khi thanh toán.
- [x] **Thanh toán (Checkout) & VNPay**: Hỗ trợ đặt hàng COD và thanh toán trực tuyến qua cổng VNPay (Sandbox). Xử lý Callback từ VNPay để cập nhật trạng thái đơn (PAID/FAILED).

### 📦 Quản lý Đơn hàng & Real-time (Mới Hoàn Thành)
- [x] **Workflow Đơn Hàng**: Luồng trạng thái chuẩn Shopee: `PENDING` -> `PROCESSING` -> `SHIPPED` -> `DELIVERED` | `CANCELLED`.
- [x] **Hủy đơn (Cancel Order)**: Cho phép Customer hủy đơn khi đang ở trạng thái chờ/đang chuẩn bị.
- [x] **Lịch sử & Chi tiết đơn hàng**: Giao diện người dùng xem lịch sử và chi tiết một đơn (`/orders/:id`).
- [x] **WebSockets Real-time Notifications**: 
  - Khi Admin đổi trạng thái đơn, màn hình User hiện Toast và cập nhật trạng thái ngay lập tức (không cần F5).
  - Có Chuông thông báo (Notification Dropdown) lưu trữ thông báo lịch sử, click vào link để chuyển đến trang đơn hàng.
  - Khi User hủy đơn hoặc đặt đơn mới, hệ thống bắn STOMP Message thông báo tới thiết bị của Admin.

### 💬 Chat Real-time Admin - User (Đã Xong)
- [x] Tích hợp STOMP/SockJS cho chức năng Chat trực tiếp giữa User và Admin.
- [x] Lưu lịch sử tin nhắn vào database.

### 🛠️ Admin Dashboard (Đã Xong)
- [x] Quản lý Đơn hàng, Quản lý Sản phẩm, Quản lý Danh mục, Quản lý User.
- [x] Quản lý Chat Box với khách hàng.

---

## 🚀 2. Những phần CẦN LÀM TIẾP THEO (To-Do & Next Steps)

Đồng nghiệp nhận bàn giao có thể tiếp tục phát triển các tính năng nâng cao sau:

### Hướng 1: Hoàn thiện UI/UX (Frontend)
- [ ] **Responsive Design**: Kiểm tra kỹ lại giao diện trên các kích thước màn hình Mobile/Tablet.
- [ ] **Trang Profile**: Bổ sung cập nhật ảnh đại diện (Avatar upload).
- [ ] **Phân trang (Pagination)**: Thêm phân trang cho danh sách Sản Phẩm ở trang chủ, và danh sách đơn hàng nếu quá nhiều.

### Hướng 2: Phát triển Backend (Nâng cao)
- [x] **Upload File**: Hệ thống đã xử lý phần upload file cho `Product` tại `UploadController`, ảnh lưu trữ tạm ở thư mục `/uploads`.
- [ ] **Thống kê doanh thu**: Tối ưu API `/api/admin/stats` để biểu đồ báo cáo trên Admin Dashboard tính toán chuẩn xác theo tháng/năm.

---

## ⚙️ 3. Hướng dẫn chạy dự án cho người mới

**Bước 1:** Bật XAMPP / MySQL. Tạo database tên `sport_shop` (chỉ cần tạo, code sẽ tự tạo bảng vì đã set `createDatabaseIfNotExist=true` và `ddl-auto=update`).
**Bước 2:** Chạy dữ liệu mẫu (Dummy data): Có thể chạy script `seed.sql` nếu muốn có sẵn sản phẩm và user test.
**Bước 3:** Chạy Backend (Spring Boot) - Cổng `8080`
```bash
cd backend
.\mvnw spring-boot:run
```
**Bước 4:** Chạy Frontend (React + Vite) - Cổng `3001`
```bash
cd frontend
npm install
npm run dev
```

---

## 📁 4. Cấu trúc thư mục hiện tại đáng chú ý
- **Backend**:
  - `OrderService.java` & `NotificationService.java`: Chứa toàn bộ logic xử lý luồng đơn hàng và bắn WebSockets.
  - `SecurityConfig.java`: Cấu hình phân quyền API.
- **Frontend**:
  - `src/pages/Orders.jsx` & `SingleOrder.jsx`: Nơi chứa config STOMP WS nhận thông báo khách hàng.
  - `src/components/NotificationDropdown.jsx`: Chuông thông báo góc phải trên.
