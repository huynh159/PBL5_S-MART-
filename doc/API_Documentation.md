# 📜 Tài Liệu Đặc Tả API (API Documentation)

Tài liệu này được biên soạn nhằm mục đích phục vụ cho việc **Viết báo cáo đồ án/dự án**. Danh sách các API được liệt kê chi tiết dưới dạng bảng để dễ dàng copy/paste sang Word/PDF.

---

## 1. Module Xác Thực & Phân Quyền (Authentication & Security)

Các API quản lý tài khoản người dùng, đăng ký, đăng nhập và bảo mật.

| Method | Endpoint | Chi Tiết / Chức Năng | Phân Quyền | Body / Tham Số |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Đăng ký tài khoản mới. | Public | `{ email, password }` |
| `POST` | `/api/auth/verify-otp` | Xác thực OTP để kích hoạt tài khoản. | Public | `{ email, otp }` |
| `POST` | `/api/auth/login` | Đăng nhập hệ thống, trả về JWT Token. | Public | `{ email, password }` |
| `POST` | `/api/auth/forgot-password` | Gửi OTP khôi phục mật khẩu. | Public | `{ email }` |
| `POST` | `/api/auth/reset-password` | Đặt lại mật khẩu mới bằng OTP. | Public | `{ email, otp, newPassword }` |
| `POST` | `/api/auth/google-login` | Đăng nhập bằng tài khoản Google (OAuth2). | Public | `{ idToken }` |

---

## 2. Module Cửa Hàng & Hàng Hóa (Products & Categories)

Các API phục vụ truy vấn danh mục và sản phẩm.

| Method | Endpoint | Chi Tiết / Chức Năng | Phân Quyền | Body / Tham Số |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/categories` | Lấy danh sách danh mục sản phẩm. | Public | N/A |
| `GET` | `/api/products` | Lấy Ds sản phẩm (có phân trang, search).| Public | Query: `page, size, search` |
| `GET` | `/api/products/{id}/detail`| Lấy chi tiết sản phẩm + số lượng đã bán. | Public | Path: `id` |
| `GET` | `/api/products/category/{id}`| Lấy sản phẩm theo mã danh mục. | Public | Path: `categoryId` |

---

## 3. Module Chăm Sóc Khách Hàng (Reviews)

Các API đánh giá sản phẩm từ người dùng.

| Method | Endpoint | Chi Tiết / Chức Năng | Phân Quyền | Body / Tham Số |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/reviews` | Viết đánh giá (chỉ áp dụng nếu đã mua hàng).| USER | `{ productId, rating, comment }` |
| `GET` | `/api/reviews/product/{id}`| Xem toàn bộ đánh giá của 1 sản phẩm. | Public | Path: `productId` |
| `GET` | `/api/reviews/product/{id}/stats`| Xem số sao TB và tổng lượt mua thực tế. | Public | Path: `productId` |

---

## 4. Module Giỏ Hàng (Shopping Cart)

API thao tác với giỏ hàng của tài khoản đang đăng nhập.

| Method | Endpoint | Chi Tiết / Chức Năng | Phân Quyền | Body / Tham Số |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/cart` | Lấy thông tin giỏ hàng của người dùng. | USER | N/A |
| `POST` | `/api/cart` | Thêm sản phẩm vào giỏ hàng. | USER | `{ productId, quantity }` |
| `PUT` | `/api/cart/{itemId}` | Cập nhật số lượng món hàng. | USER | Query: `quantity` |
| `DELETE`| `/api/cart/{itemId}` | Xóa một mặt hàng khỏi giỏ. | USER | Path: `cartItemId` |
| `DELETE`| `/api/cart/clear` | Làm sạch toàn bộ giỏ hàng. | USER | N/A |

---

## 5. Module Thanh Toán & Đơn Hàng (Order & Payment)

API liên quan đến Chốt đơn và cổng thanh toán VNPay.

| Method | Endpoint | Chi Tiết / Chức Năng | Phân Quyền | Body / Tham Số |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/coupons/apply/{code}`| Kiểm tra và tính phần trăm mã giảm giá. | USER | Path: `code` |
| `POST` | `/api/orders` | Checkout, tạo đơn hàng mới, trừ tồn kho. | USER | `{ paymentMethod, couponCode, address, phone, note, cartItemIds }` |
| `GET` | `/api/orders` | Lịch sử mua hàng của khách. | USER | N/A |
| `GET` | `/api/orders/{id}` | Chi tiết luồng của 1 đơn hàng cá nhân. | USER | Path: `id` |
| `PUT` | `/api/orders/{id}/cancel` | Hủy đơn hàng (khi đang PENDING/PROCESSING). | USER | Path: `id` |
| `GET` | `/api/payment/create-payment`| Tạo link thanh toán VNPay. | USER | Query: `amount, orderInfo` |
| `GET` | `/api/payment/vnpay-callback`| Endpoint VNPay gọi về khi thanh toán xong. | Public | Params trả về từ VNPay |

---

## 6. Module Admin (Quản Trị Hệ Thống)

Các API quản lý tài nguyên của hệ thống (Yêu cầu Role: ADMIN).

| Method | Endpoint | Chi Tiết / Chức Năng | Phân Quyền | Body / Tham Số |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | Lấy dữ liệu thống kê cho Admin (Tổng doanh thu các đơn đã giao, tổng đơn). | ADMIN | N/A |
| `GET` | `/api/orders/admin` | Xem tất cả đơn hàng trên hệ thống. | ADMIN | N/A |
| `PUT` | `/api/orders/admin/{id}/status`| Cập nhật trạng thái đơn (kèm theo auto push message realtime xuống client). | ADMIN | Query: `status` |
| `GET` | `/api/admin/users` | Lấy danh sách toàn bộ khách hàng. | ADMIN | N/A |
| `PUT` | `/api/admin/users/{id}/toggle-lock`| Khóa / Mở khóa tài khoản khách hàng. | ADMIN | Path: `id` |

---

## 7. Module Chat & Notifications (Real-time WebSockets)

Sử dụng thư viện `socket.io` cho giao tiếp Server-to-Client thời gian thực.

| Method / Event | Tên Sự Kiện | Chi Tiết / Chức Năng | Phân Quyền | Dữ Liệu |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/chat/send` | Gửi tin nhắn đến một User/Admin thông qua REST API. | USER/ADMIN | `{ receiverId, content }` |
| `GET` | `/api/chat/history/{id}` | Tải toàn bộ nội dung Chat Box. | USER/ADMIN | Path: `receiverId` |
| `GET` | `/api/notifications` | Tải lịch sử thông báo. | USER/ADMIN | N/A |
| `PUT` | `/api/notifications/{id}/read`| Đánh dấu đã đọc thông báo. | USER/ADMIN | Path: `id` |
| `EMIT` | `register` | Khởi tạo connection và gán userId vào session Socket. | USER/ADMIN | `userId` |
| `EMIT` | `sendMessage` | Client gửi tin nhắn trực tiếp qua Socket. | USER/ADMIN | `{ receiverId, content, senderId }` |
| `ON`   | `receiveMessage` | Kênh user lắng nghe để nhận tin nhắn mới. | USER/ADMIN | JSON Body (Message) |
| `ON`   | `notification` | Kênh lắng nghe các sự kiện đơn hàng/cập nhật hệ thống. | USER/ADMIN | JSON Body (`content`, `link`) |

