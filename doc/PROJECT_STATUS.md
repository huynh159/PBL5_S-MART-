# 🚀 Bảng Theo Dõi Tiến Độ Dự Án (Project Status & Handover)

Tài liệu này dùng để bàn giao và theo dõi tiến độ công việc giữa các thành viên trong nhóm. Đọc kỹ tài liệu này giúp bạn nắm bắt ngay lập tức code đã làm đến đâu và mục tiêu tiếp theo là gì.

---

## 🟢 1. Những phần ĐÃ HOÀN THÀNH (Completed)

### Backend (Spring Boot) - Phase 1: Authentication & Security
Toàn bộ luồng xác thực người dùng đã được xây dựng và b��o mật hoàn chỉnh:
- [x] **Cơ sở dữ liệu (MySQL)**: Đã cấu hình `application.properties` và Entity `User`.
- [x] **Gửi Email (Email Service)**: Đã tích hợp `spring-boot-starter-mail` để gửi OTP qua tài khoản Gmail.
- [x] **Spring Security & JWT**:
  - Đã cấu hình `SecurityConfig`, mã hóa mật khẩu bằng `BCryptPasswordEncoder`.
  - Phân quyền endpoint: Các API `/api/auth/**` được public, các API khác yêu cầu chuỗi JWT Bearer Token.
- [x] **Các API Xác thực (AuthController)**:
  - `POST /api/auth/register`: Đăng ký tài khoản (Lưu db mật khẩu mã hóa BCrypt, trạng thái `isVerified = false`, gửi OTP 6 số qua email).
  - `POST /api/auth/verify-otp`: Nhập mã OTP từ email để kích hoạt tài khoản (`isVerified = true`).
  - `POST /api/auth/login`: Xác thực Email/Password, trả về chuỗi **JWT Token**.
  - `POST /api/auth/forgot-password`: Quên mật khẩu, gửi OTP khôi phục qua email.
  - `POST /api/auth/reset-password`: Đổi mật khẩu mới kèm mã OTP khôi phục hợp lệ.
  - `POST /api/auth/google-login`: Tự động nhận `idToken` của Google, giải mã qua `google-api-client`, tạo User và trả về JWT Bearer Token nội bộ.

### Frontend (React JS) - Phase 1: Authentication UI
- [x] **Setup dự án**: Cấu trúc Vite, cài đặt Tailwind CSS, Axios, React Router, React Toastify.
- [x] Giao diện **Đăng ký** & Màn chờ **Nhập OTP** (đếm ngược 5 phút).
- [x] Giao diện **Đăng nhập**, xử lý lưu JWT Token vào `localStorage`.
- [x] Giao diện **Quên mật khẩu** & form **Tạo mật khẩu mới**.
- [x] **Đăng nhập Google**: Tích hợp `@react-oauth/google`, bọc thẻ cha App bằng `<GoogleOAuthProvider>`, thành công login qua cửa sổ Pop-up và lưu Token cục bộ.

### Backend (Spring Boot) - Phase 2: Shop Features (Cart, Order, VNPay, Chat, Review)
- [x] **Product Detail Stats**:
  - Thêm API `GET /api/products/{id}/detail` trả về `ProductDetailResponse` gồm: `price`, `stock`, `status`, `variations`, `totalSold`.
  - `totalSold` được tính bằng cách duyệt toàn bộ `OrderItem` theo `productId` và cộng dồn `quantity`.
- [x] **Review & Rating**:
  - Tạo `Review` entity + `reviews` table trong `database/database.sql`.
  - Repository: `ReviewRepository` với các hàm `findByProductIdOrderByCreatedAtDesc`, `getAverageRatingByProduct`, `existsByUserIdAndProductId`.
  - Service: `ReviewService#createReview` chỉ cho phép user đã từng mua sản phẩm (kiểm tra bằng `OrderItemRepository.existsByOrderUserIdAndProductId`) được gửi đánh giá.
  - API:
    - `POST /api/reviews` (body: `productId`, `rating`, `comment`) – yêu cầu JWT, chỉ user đã mua mới gửi được.
    - `GET /api/reviews/product/{productId}` – trả về danh sách review của 1 sản phẩm.
    - `GET /api/reviews/product/{productId}/stats` – trả về `averageRating` và `totalSold`.

### Tài liệu (Documentation)
- [x] **`doc/Frontend_API_Integration_Guide.md`**: Đã cắm mốc luồng hoạt động UI/UX cho Frontend với đầy đủ request/response để thiết kế giao diện cho phần Đăng nhập/Đăng ký.

---

## 🟡 2. Những phần CẦN LÀM TIẾP CHUẨN BỊ (To-Do & Next Steps)

Đồng nghiệp nhận bàn giao có thể chọn 1 trong 2 hướng để làm tiếp:

### Hướng 1: Xây dựng giao diện Frontend (Shop UI)
*Cần bắt đầu thiết kế các Layout và Page dành cho ứng dụng E-commerce.*
- [ ] **Trang Chủ (Home)**: Tích hợp Header, Footer, Hero Banner. Kêu gọi dữ liệu hiển thị (Danh sách sản phẩm nổi bật).
- [ ] **Trang Chi Tiết Sản Phẩm**: Kêu gọi API `GET /api/products/{id}` để hiện mô tả và kho ảnh.
- [ ] **Trang Giỏ Hàng (Cart)**: Quản lý State giỏ hàng (Redux/Context API), cho phép thay đổi số lượng.
- [ ] **Trang Thanh toán (Checkout)**: Form nhận thông tin giao hàng, hiển thị mã VNPay.

### Hướng 2: Phát triển tiếp Backend (Shop Features & Payment)
- [x] **Quản lý Sản phẩm (Product)**: Viết service và controller lấy danh sách sản phẩm `GET /api/products` và `GET /api/products/{id}`. Cần update Database bổ sung Entity liên quan `Product`, `Category`.
- [x] **Giỏ hàng (Cart & CartItems)**: Viết API thêm/xóa/sửa sản phẩm trong giỏ hàng (Yêu cầu Authentication JWT Token).
- [x] **Thanh toán (Payment)**: Tích hợp VNPay (đã lấy cấu hình sẵn trong `application.properties` nhưng đang bị comment lại) để thanh toán đơn hàng.
- [x] **Order & Coupon**: Xử lý tạo đơn hàng, áp dụng mã giảm giá và xem lại lịch sử.
- [x] **Admin & Chat**: API cho Admin xem thống kê, API cho Chat cơ bản.

---

## 🛠 3. Hướng dẫn chạy dự án cho người mới

**Bước 1:** Bật XAMPP / MySQL. Tạo một database rỗng tên là `sport_shop`.
**Bước 2:** Mở Terminal ở thư mục gốc của project, di chuyển vào folder `backend`:
```bash
cd backend
```
**Bước 3:** Chạy lệnh Maven sau để khởi động dự án:
```bash
# Đối với Windows
.\mvnw.cmd spring-boot:run

# Đối với Mac/Linux
./mvnw spring-boot:run
```
*(Nếu thành công, server sẽ chạy ở port `8080`)*

---

## 📌 4. Cấu trúc thư mục hiện tại đáng chú ý
- `backend/src/main/java/.../controller/AuthController.java`: Controller chứa các API Public.
- `backend/src/main/java/.../security/`: Logic Filter kiểm tra JWT và cấu hình Spring Security.
- `doc/`: Thư mục chứa các tài liệu luồng Auth cho thành viên Frontend thao tác.


