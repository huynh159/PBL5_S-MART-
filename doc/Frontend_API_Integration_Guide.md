# Hướng Dẫn Tích Hợp API cho Frontend (API Integration Guide)

Tài liệu này lưu trữ danh sách các API hiện có và giải thích luồng (flow) hoạt động để đội ngũ Frontend (React, Vue, hoặc UI HTML/JS) có thể dễ dàng thiết kế giao diện và kết nối.

---

## 1. Luồng Xác Thực (Authentication)

### 1.1. Đăng ký tài khoản mới (Register)
- **Endpoint**: `POST /api/auth/register`
- **Mô tả**: Dùng để tạo tài khoản mới. Trạng thái tài khoản lúc này là `Chưa xác thực` (isVerified = false). Một email chứa mã OTP 6 số sẽ được tự động gửi đến hòm thư của người dùng.
- **Yêu cầu Header**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
      "email": "nguyenvana@gmail.com",
      "password": "matkhaucuaban"
  }
  ```
- **Response**:
  - **Thành công (200 OK)**: 
    ```json
    { "message": "User registered successfully. Please check your email for OTP." }
    ```
  - **Thất bại (400 Bad Request)**: 
    ```json
    { "message": "Error: Email is already registered!" }
    ```
- **Hướng dẫn làm UI Frontend**:
  1. Tạo **Form Đăng Ký** với 2 field: `Email` và `Password` (có thể thêm Confirm Password để check ở FE).
  2. Khi user bấm Submit -> Call API `/register`.
  3. Nếu statusCode = 200 -> Hiển thị hộp thoại "Đăng ký thành công, vui lòng kiểm tra email" và **chuyển hướng (redirect)** sang Màn hình Nhập OTP. Lưu nhẹ cái `email` vừa đăng ký vào state/localStorage để truyền sang bước 2.

---

### 1.2. Xác thực tài khoản bằng OTP (Verify OTP)
- **Endpoint**: `POST /api/auth/verify-otp`
- **Mô tả**: Dùng để kích hoạt tài khoản. Mã OTP sẽ hết hạn sau 5 phút. Khi verify thành công, trường `isVerified` trong DB sẽ chuyển thành `true`.
- **Yêu cầu Header**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
      "email": "nguyenvana@gmail.com",
      "otp": "123456"
  }
  ```
- **Response**:
  - **Thành công (200 OK)**: 
    ```json
    { "message": "OTP verified successfully." }
    ```
  - **Thất bại (400 Bad Request)**: 
    ```json
    { "message": "Error: OTP has expired!" } 
    // hoặc
    { "message": "Error: OTP is invalid!" }
    ```
- **Hướng dẫn làm UI Frontend**:
  1. Tạo **Form Nhập OTP** (thường là 6 ô vuông input nhỏ).
  2. Lấy `email` từ bước 1 ghép với `otp` user vừa gõ để gọi API `/verify-otp`.
  3. Xử lý UI thêm bộ đếm lùi (Countdown) 5 phút.
  4. Nếu statusCode = 200 -> Hiển thị "Tài khoản của bạn đã được kích hoạt" và **chuyển hướng** đến trang Đăng Nhập (Login).

---

### 1.3. Lấy mã OTP (API Ẩn - Chỉ dành cho lúc Dev/Test)
*Lưu ý: Không dùng trên UI thực tế của người dùng.*
- **Endpoint**: `GET /api/auth/test-otp?email={email_cua_ban}`
- **Mô tả**: API tạm thời giúp bạn bốc trực tiếp mã OTP dưới Database thay vì phải chờ mở hộp thư email. Rất tiện để test nhanh bằng Postman hoặc Frontend.
- **Response**: Text OTP (VD: `123456`)

---

### 1.4. Quên mật khẩu (Forgot Password)
- **Endpoint**: `POST /api/auth/forgot-password`
- **Mô tả**: Yêu cầu gửi mã OTP để khôi phục mật khẩu.
- **Yêu cầu Header**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
      "email": "nguyenvana@gmail.com"
  }
  ```
- **Response**:
  - **Thành công (200 OK)**: `{ "message": "An OTP has been sent to your email." }`
- **Hướng dẫn làm UI Frontend**:
  1. Ở thiết kế Form Đăng nhập, thêm một nút/link **"Quên mật khẩu?"**.
  2. Khi nhấn nút, đưa người dùng đến màn hình/modal yêu cầu **Nhập Email**. Có thể dùng regex kiểm tra định dạng email hợp lệ ở FE.
  3. Khi Submit -> Gọi API `/forgot-password`, trạng thái loading cho màn hình.
  4. Nhận mã 200 OK -> Thông báo đã gửi email và **chuyển hướng** sang màn hình Đặt lại mật khẩu (nhớ truyền State/URL param biến `email` sang màn tiếp theo).

---

### 1.5. Đặt lại mật khẩu (Reset Password)
- **Endpoint**: `POST /api/auth/reset-password`
- **Mô tả**: Xác thực mã OTP và lưu mật khẩu mới.
- **Yêu cầu Header**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
      "email": "nguyenvana@gmail.com",
      "otp": "123456",
      "newPassword": "matkhaumoicuanban123"
  }
  ```
- **Response**:
  - **Thành công (200 OK)**: `{ "message": "Password has been reset successfully." }`
  - **Thất bại (400 Bad Request)**: `{ "message": "Error: OTP is invalid!" }`
- **Hướng dẫn làm UI Frontend**:
  1. Xây dựng Form gồm: **Nhập mã OTP** (6 số) và 2 ô **Mật khẩu mới**, **Xác nhận mật khẩu mới** (tự so sánh khớp mật khẩu ở phía FE trước khi gọi API).
  2. Gom lại `email` (từ bước trước), `otp` và `newPassword` gọi API `/reset-password`.
  3. Nếu thành công (200) -> Hiển thị "Đổi mật khẩu thành công" và **điều hướng về trang Đăng nhập**. Quét sạch các state giữ email nháp lúc nãy.

---

### 1.6. Đăng nhập bằng Google (Google Login)
- **Endpoint**: `POST /api/auth/google-login`
- **Mô tả**: Gửi Token xác thực của Google (do Frontend lấy) lên cho Backend để backend trả về phiên đăng nhập của hệ thống.
- **Yêu cầu Header**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
      "idToken": "chuoi-jwt-dai-tu-google-tra-ve-cho-frontend"
  }
  ```
- **Response**: 
  - **Thành công (200 OK)**: 
    ```json
    { 
        "token": "chuoi_jwt_token_auth_cua_he_thong",
        "message": "Google login successful"
    }
    ```
- **Hướng dẫn làm UI Frontend (Cực kỳ quan trọng)**:
  1. FE không trực tiếp tự gọi Auth Backend ngay. FE cần cài bộ công cụ Google (VD React: `@react-oauth/google`).
  2. Vẽ nút **"Log in with Google"** bằng library cung cấp.
  3. Mở luồng OAuth, người dùng thao tác popup của Google -> Thành công -> Google gọi Callback trả về đối tượng có `credential` (chính là chuỗi `idToken`).
  4. Lấy chuỗi `idToken` đó bỏ vào body gọi API backend `/api/auth/google-login`.
  5. API Backend của hệ thống sẽ kiểm tra và trả ra Token của web. FE giữ token đó và điều hướng người dùng tới **Trang chủ**.

---

## 2. Các phần dự kiến phát triển tiếp theo (TODO)
Các API này sẽ được thiết kế trong tương lai:
1. **Đăng nhập (Login)**: `POST /api/auth/login` (Trả về JWT Token lưu vào localStorage)
2. **Lấy danh sách sản phẩm**: `GET /api/products` (Cho trang chủ)
3. **Giỏ hàng (Cart)**: `GET /api/cart`, `POST /api/cartItem`
4. **Thanh toán (Payment)**: `POST /api/order/checkout` (Tích hợp VNPay)
