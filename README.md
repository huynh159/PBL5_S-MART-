# S-Mart E-Commerce Platform 🚀

**S-Mart** là một dự án hệ thống website Thương mại điện tử (E-Commerce) bán hàng được xây dựng Fullstack với kiến trúc hiện đại, tập trung vào trải nghiệm người dùng (UX) thời gian thực (Real-time).

Dự án đã được nâng cấp hoàn toàn từ Java Spring Boot sang **Node.js (TypeScript) + Prisma** để đạt hiệu suất cao nhất và code sạch theo nguyên tắc DDD (Domain-Driven Design).

## 🌟 Chức Năng Nổi Bật (Key Features)

### 1. Xác Thực & Phân Quyền (Authentication)
* Đăng ký, Đăng nhập với luồng xác minh OTP qua Email.
* Đăng nhập nhanh bằng tài khoản Google (OAuth 2.0).
* Phân quyền linh hoạt: Admin và Customer.

### 2. Mua Sắm & Thanh Toán (Shopping & Checkout)
* Tìm kiếm, lọc sản phẩm theo danh mục, quản lý tồn kho biến thể (Size/Color).
* Giỏ hàng đồng bộ thời gian thực.
* Áp dụng mã giảm giá (Coupon).
* Hỗ trợ thanh toán **VNPay** (Sandbox) và COD.

### 3. Chat & Thông Báo Real-time (Live Interaction)
* Hệ thống Chat trực tiếp giữa Khách hàng và Admin (Sử dụng **Socket.io**).
* Thông báo biến động trạng thái đơn hàng ngay lập tức (Real-time Notifications).

### 4. Admin Dashboard (Trang Quản Trị)
* Thống kê trực quan: Biểu đồ doanh thu theo năm/tháng, biểu đồ tròn trạng thái đơn hàng.
* Quản lý Sản phẩm, Danh mục, Đơn hàng và Người dùng toàn diện.

---

## 🛠 Công Nghệ Sử Dụng (Tech Stack)

**Backend:**
- Node.js (v20+) & TypeScript
- Express.js (Framework)
- Prisma ORM (Quản lý Database)
- PostgreSQL (Cơ sở dữ liệu chính)
- Socket.io (Real-time Messaging)
- JWT (Security & Auth)

**Frontend:**
- React JS + Vite
- Tailwind CSS v4
- Lucide React (Icons)
- Socket.io-client
- React Toastify & Recharts

---

## 🚀 Hướng Dẫn Cài Đặt (Getting Started)

### Bước 1: Khởi tạo Database
1. Đảm bảo đã cài đặt PostgreSQL.
2. Tại thư mục `new-backend`, tạo file `.env` và cấu hình `DATABASE_URL`.
3. Chạy lệnh để đẩy schema và dữ liệu mẫu:
```bash
cd new-backend
npx prisma db push
npx prisma db seed
```

### Bước 2: Chạy Backend
```bash
cd new-backend
npm install
npm run dev
```
Server sẽ chạy tại `http://localhost:8080`.

### Bước 3: Chạy Frontend
```bash
cd frontend
npm install
npm run dev
```
App sẽ chạy tại `http://localhost:3001`.

### Tài khoản Admin mặc định:
- **Email:** `admin@smart.com` 
- **Mật khẩu:** `123456`

---

## 📂 Tài Liệu (Documentation)
Xem thêm tại thư mục `doc/`:
- `PROJECT_STATUS.md`: Trạng thái các tính năng.
- `API_Documentation.md`: Danh sách các API Endpoint.
