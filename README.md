# S-Mart E-Commerce Platform 🚀

**S-Mart** là một dự án hệ thống website Thương mại điện tử (E-Commerce) bán hàng được xây dựng Fullstack từ A-Z với kiến trúc hiện đại, tập trung vào trải nghiệm người dùng (UX) thời gian thực (Real-time) giống với mô hình của Shopee.

## 🌟 Chức Năng Nổi Bật (Key Features)

### 1. Xác Thực & Phân Quyền (Authentication)
* Đăng ký, Đăng nhập với luồng kích hoạt tài khoản qua mã OTP gửi tới Email.
* Khôi phục mật khẩu (Forgot Password) an toàn với OTP.
* Đăng nhập không mật khẩu bằng tài khoản Google (OAuth 2.0).
* Phân quyền Role-based: Quản trị viên (Admin) và Người dùng (User).

### 2. Mua Sắm & Thanh Toán (Shopping & Checkout)
* Hiển thị chi tiết Sản Phẩm, lọc theo danh mục, tính số lượng tồn kho (Stock) và Số lượt đã mua (Total Sold).
* Giỏ hàng (Cart) linh hoạt, hỗ trợ Tăng/Giảm số lượng.
* Áp dụng Mã Giảm Giá (Coupon).
* Hỗ trợ thanh toán bằng Tiền mặt (COD) hoặc **Cổng thanh toán VNPay** (Sandbox).

### 3. Đánh Giá Sản Phẩm (Rating & Review)
* Tính năng chỉ cho phép những người dùng thực sự *đã mua hàng* (Đơn hàng ở trạng thái `COMPLETED` / `DELIVERED`) được phép để lại Rating (1-5 sao) và Comment.

### 4. Quản Lý Chuyến Hàng Thời Gian Thực (Real-time Workflow)
* Luồng trạng thái Đơn Order: `PENDING` ➔ `PROCESSING` ➔ `SHIPPED` ➔ `DELIVERED` ➔ `COMPLETED`.
* Khách hàng có quyền "Hủy Đơn" khi đơn hảng đang rảnh (Cho phép ở trạng thái PENDING/PROCESSING).
* Tích hợp WebSockets/STOMP: Mọi thao tác thay đổi tiến độ giao hàng của Admin sẽ nảy Notification ngay góc màn hình (Toast) và thanh Header Dropdown (Chuông) của Khách hàng theo thời gian thực như Shopee. Không cần làm mới (Refresh) trang.

### 5. Chat Trực Tiếp (Live Chat)
* Ứng dụng chat nội bộ Real-time giữa Khách Hàng (User) và Tư Vấn Viên (Admin) qua mạng WebSocket.

### 6. Admin Dashboard (Trang Quản Trị)
* Thống kê trực quan số liệu về Doanh Thu, Tổng số tài khoản, Tổng Đơn hàng.
* Giao diện quản lý Sản phẩm (Thêm/Sửa/Xóa).
* Giao diện duyệt đơn hàng với 1 click chuột tiện lợi.
* Quản lý khóa chặn/Mở khóa User chống gian lận.

---

## 🛠 Công Nghệ Sử Dụng (Tech Stack)

**Backend:**
- Java 21 / 25
- Spring Boot (v4.0.4)
- Spring Security + JWT authentication
- Spring Data JPA + Hibernate
- Spring Mail (OTP)
- Spring WebSocket + STOMP
- MySQL Database

**Frontend:**
- React JS + Vite
- Tailwind CSS (Lucide React Icons)
- Axios, React Router, React Toastify
- @stomp/stompjs & sockjs-client (WebSocket)
- jwt-decode & @react-oauth/google

---

## 🚀 Hướng Dẫn Cài Đặt (Getting Started)

### Bước 1: Khởi tạo Database
1. Mở MySQL Server của bạn (XAMPP/WAMP/Custom).
2. Tạo database với tên mong muốn: `CREATE DATABASE sport_shop;`
3. Thêm cấu hình truy cập vào file `backend/src/main/resources/application.properties` (Mật khẩu: `root` - `123456`).
4. (Optional) Run file `database/database.sql` để import trực tiếp cấu trúc hoặc chạy file `backend/generate_seed.py` để tạo sẵn 20 User và 20 Product chơi thử (Dummy Data).

### Bước 2: Chạy Backend (Spring Boot)
Từ thư mục gốc dự án, di chuyển vào Backend và khởi động server. Nó sẽ chạy trên cổng `http://localhost:8080`.
```bash
cd backend
mvnw spring-boot:run
```

### Bước 3: Chạy Frontend (React Vite)
Mở một cửa sổ Terminal khác, di chuyển vào Frontend và cài đặt thư viện NPM rồi Start. App sẽ mở ở cổng `http://localhost:3001` (hoặc `5173`).
```bash
cd frontend
npm install
npm run dev
```

### Bước 4: Test Sản Phẩm
Tài khoản Admin khả dụng mặc định (Nếu bạn chạy lệnh Seed script Python):
- **Email:** `admin@smart.com` 
- **Mật khẩu:** `123456`

---

## 📂 Tài Liệu (Documentation)
Xem thêm ở thư mục `doc/` để lấy dữ liệu Report Đồ án:
- `API_Documentation.md`: Danh sách toàn bộ Endpoint chia theo Module (Word Report).
- `Frontend_API_Integration_Guide.md`: Hướng dẫn luồng call API thực tế giữa React và Sprint Boot.
- `PROJECT_STATUS.md`: Tracking danh sách tính năng To-Do.

