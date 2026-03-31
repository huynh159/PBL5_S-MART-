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

## 2. Luồng Đăng nhập (Login Tự Code)

### 2.1. Đăng nhập bằng Email/Password
- **Endpoint**: `POST /api/auth/login`
- **Mô tả**: Sử dụng Email và Password để lấy JWT Token.
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
    {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6Ik...",
        "message": "Login successful"
    }
    ```
- **Hướng dẫn làm UI Frontend**:
  1. Giao diện Đăng nhập nhận `email` và `password`.
  2. Khi gọi API thành công, lấy chuỗi `token` từ response và lưu vào bộ nhớ cục bộ (Storage) (ví dụ: `localStorage.setItem('user_token', res.data.token)`).
  3. Mọi API từ bước này trở xuống (Cart, Order, Chat...) bắt buộc phải kèm Header bảo vệ: `Authorization: Bearer <token_vừa_lưu>`.
  4. Chuyển hướng người dùng về `Trang chủ`.

---

## 3. Hệ Sinh Thái Sản Phẩm (Products & Categories)

*Lưu ý: Các API GET public không yêu cầu Token.*

### 3.1. Lấy danh sách danh mục (Category)
- **Endpoint**: `GET /api/categories`
- **Response**: Trả về List object Category (id, name, description). FE có thể dùng để vẽ Thanh Menu / Sidebar Lọc.

### 3.2. Lấy danh sách Phân trang Sản phẩm (Products)
- **Endpoint**: `GET /api/products?page=0&size=10&search=keyword`
- **Mô tả**: Hỗ trợ phân trang và tìm kiếm theo tên. Trả về cấu trúc `Page<Product>`.
- **Response**: Chứa trường `content` (mảng Product: id, name, price, description, stock, imageUrl) và các trường về `totalPages`, `totalElements` để FE dùng làm nút Previous/Next.

### 3.3. Lấy sản phẩm theo danh mục
- **Endpoint**: `GET /api/products/category/{categoryId}`
- **Response**: Trả về danh sách tất cả sản phẩm thuộc thể loại đó.

### 3.4. (Admin) Thực hiện CRUD với Sản Phẩm
- **Endpoint**: Các Method `POST`, `PUT`, `DELETE` đến `/api/products/{id}` và `/api/categories/{id}`. *(Yêu cầu Token Admin)*.

---

## 4. Giỏ Hàng (Cart)

*Lưu ý: Tất cả API Giỏ Hàng yêu cầu Header `Authorization: Bearer <token>`.*

### 4.1. Xem giỏ hàng
- **Endpoint**: `GET /api/cart`
- **Response**: Mảng các CartItem (id, product, quantity). Số tiền tổng cộng tự FE tính (`product.price * quantity`)

### 4.2. Thêm vào giỏ hàng
- **Endpoint**: `POST /api/cart`
- **Request Body**:
  ```json
  {
      "productId": 1,
      "quantity": 2
  }
  ```
- **Hướng dẫn UI**: Nút "Thêm vào giỏ" ở trang chi tiết sản phẩm. Đã có trong giỏ thì BE sẽ tự cộng dồn `quantity`.

### 4.3. Cập nhật số lượng / Xóa một sản phẩm / Làm sạch giỏ
- Cập nhật số lượng: `PUT /api/cart/{cartItemId}?quantity=3`
- Xóa 1 sản phẩm: `DELETE /api/cart/{cartItemId}`
- Xóa toàn giỏ (sau khi thanh toán): `DELETE /api/cart/clear`

---

## 5. Mã Giảm Giá & Đơn Hàng (Order & Coupon)

*Yêu cầu Header `Authorization: Bearer <token>`.*

### 5.1 Kiểm tra/Áp dụng mã giảm giá (Apply Coupon)
- **Endpoint**: `GET /api/coupons/apply/{code}`
- **Mô tả**: FE gọi API này khi khách nhập mã giảm giá (ví dụ "SALE20") và bấm nút "Áp dụng".
- **Response**: Trả về Object chứa phần trăm giảm (`discountPercent`). Nếu ném lỗi thì FE báo "Mã hết hạn".

### 5.2. Chốt Đơn Hàng (Checkout)
- **Endpoint**: `POST /api/orders`
- **Mô tả**: Gom toàn bộ giỏ hàng để tạo thành Đơn hàng rỗng giỏ đi, đồng thời trừ Kho (Stock).
- **Request Body**:
  ```json
  {
      "paymentMethod": "VNPAY", 
      "couponCode": "SALE20" 
  }
  ```
  *(couponCode truyền rỗng/null nếu không có)*
- **Response**: Trả về Đơn Hàng Object kèm `{id}` dùng để chuyển hướng nạp tiền phía dưới.

### 5.3. Xem Lịch sử Đơn Hàng
- **Endpoint**: `GET /api/orders`
- **Response**: Trả mảng Đơn hàng (Lịch sử thanh toán của khách).

---

## 6. Cổng Thanh Toán VNPay 

*Yêu cầu Header `Authorization: Bearer <token>`.*

### 6.1. Lấy URL trang thanh toán VNPAY (Create Payment URL)
- **Endpoint**: `GET` hoặc `POST /api/payment/create-payment` (Tùy thuộc vào định nghĩa BE, thường là truyền tham số `orderTotal` và `orderInfo`). Theo Backend thực tế ở Controller (ví dụ Endpoint: `GET /api/payment/create-payment?amount=500000&orderInfo=ThanhToanDonHang123`).
*(Lưu ý: Nếu Backend nhận `orderId`, Endpoint sẽ là `POST /api/payment/vnpay/create-payment?orderId={id_don_hang_vua_tao}`)*
- **Mô tả**: Khi người dùng nhấn "Thanh toán bằng thẻ/VNPay", hệ thống backend sẽ tính toán chữ ký bảo mật (signature) và trả về một URL an toàn dẫn đến trang thanh toán của VNPay.
- **Yêu cầu Header**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer <token_cua_user_dang_nhap>` 
- **Request Parameters / Query**:
  - `orderId` (Long): ID của đơn hàng vừa được tạo trước đó.
- **Response**:
  - **Thành công (200 OK)**:
    ```json
    {
        "status": "OK",
        "message": "Successfully created payment URL",
        "url": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=50000000&vnp_Command=pay&vnp_CreateDate=20231024103000&..."
    }
    ```
    *(Tùy thuộc vào cấu trúc trả về thực tế của BE, có thể key là `"url"` hoặc `"paymentUrl"`, hãy console.log response để check).*
  - **Thất bại (400/404/500)**:
    ```json
    {
        "status": "ERROR",
        "message": "Order not found"
    }
    ```
- **Hướng dẫn UI & Logic Frontend (Rất quan trọng)**:
  1. Khi người dùng click nút **"Xác nhận thanh toán (bằng VNPay)"** ở màn hình Checkout.
  2. FE hiển thị trạng thái Loading (ví dụ vòng xoay xoay) để ngăn user click nhiều lần.
  3. FE gọi API tạo Đơn hàng (Checkout) trước -> lấy được `orderId`.
  4. Ngay lập tức dùng `orderId` đó gọi tiếp API `create-payment` này.
  5. Nếu Backend trả về statusCode 200 và có URL, FE thực hiện điều hướng toàn bộ trang web (Redirect) sang trang của VNPAY bằng lệnh:
     `window.location.href = response.data.url;`
     *(Hoặc thẻ `<a>` ẩn và tự động click, nhưng `window.location.href` là cách phổ biến nhất).*
  6. **Không nên mở Tab mới (target="_blank")** vì các trình duyệt có thể chặn Popup gây lỗi luồng thanh toán, người dùng sẽ bị kẹt.
  7. Người dùng sẽ thao tác nhập thẻ trên giao diện của VNPAY. Sau khi thanh toán xong (hoặc hủy bỏ), VNPAY sẽ tự động Redirect người dùng trở về trang Callback của bạn theo cấu hình URL (giải thích ở mục 6.2).

### 6.2. Trang Callback từ VNPay
- Chờ Callback: `GET /api/payment/vnpay-callback`
- Xử lý: Khi KH xong tiền, VNPAY đẩy họ về `http://localhost:8080/api/payment/vnpay-callback`. BE đã cấu hình tự bắt status 00 thành `PAID`. FE chỉ cần có màn hình thông báo thanh toán thành công.

---

## 7. Chat (Nhắn tin) & Thông Báo

*Yêu cầu Header `Authorization: Bearer <token>`.*

### 7.1. Gửi tin nhắn
- **Endpoint**: `POST /api/chat/send`
- **Request Body**:
  ```json
  {
      "receiverId": 2,
      "content": "Sản phẩm này còn hàng không shop?"
  }
  ```

### 7.2. Tải lịch sử trò chuyện
- **Endpoint**: `GET /api/chat/history/{receiverId}`
- **Response**: Toàn bộ tin nhắn sắp xếp theo thời gian giữa Bạn và {receiverId}. Dùng để vẽ cửa sổ Chat UI.

### 7.3. Nhận tin nhắn Realtime (WebSocket)
- **Giao thức**: WebSocket / STOMP.
- **Endpoint Kết Nối**: `ws://localhost:8080/ws`
- **Kênh Lắng Nghe (Topic)**: `.subscribe("/topic/messages/{myUserId}", callback)`
  - Khi có người nhắn tin cho `myUserId`, server sẽ đẩy đối tượng `Message` (chứa nội dung, id người gửi/nhận, thời gian) thẳng vào đây. Code Frontend chỉ cần lấy và append vào mảng chat hiện tại.

---

## 8. Thông Báo Thời Gian Thực (Realtime Notifications) với WebSocket

*Hỗ trợ Admin nhận thông báo ngay lập tức khi có Đơn hàng mới và khi Khách thanh toán xong.*

### 8.1. Kết nối cơ bản
- **Giao thức**: WebSocket / STOMP.
- **Endpoint Kết Nối**: `ws://localhost:8080/ws` (hoặc `http://localhost:8080/ws` nếu dùng thư viện SockJS fallback).
- **Thư viện khuyên dùng cho Frontend**: `sockjs-client` và `@stomp/stompjs`.

### 8.2. Kênh Lắng Nghe (Subscribe Topic)
- Admin sau khi kết nối sẽ thực hiện `.subscribe("/topic/admin-notifications", callback)`.
- Khi có thông báo mới, server sẽ gửi message dạng String (Ví dụ: `"Có đơn hàng mới #3 vừa được tạo bởi guest@gmail.com với tổng tiền: 500000.0 VND."`)

### 8.3. Lấy lại toàn bộ thông báo (Lịch sử)
- **Endpoint**: `GET /api/notifications` (Yêu cầu Header Bearer Token).
- **Response**: Trả về mảng các `Notification` (gồm content, isRead, createdAt).
- **Đánh dấu đã đọc**: `PUT /api/notifications/{id}/read`.

---

## 9. Quản Trị Hệ Thống (Admin Dashboard)

*Yêu cầu Header `Authorization: Bearer <token>` của tài khoản có Role là ADMIN.*

- **Thống kê tổng quát**: `GET /api/admin/stats` -> Trả ra `{ totalUsers, totalProducts, totalOrders, totalRevenue }`. (Để hiện Card báo cáo).
- **Lấy DS Khách hàng**: `GET /api/admin/users`
- **Khóa/Mở Khóa Khách hàng**: `PUT /api/admin/users/{id}/toggle-lock` -> Lật On/Off trên UI để Ban người dùng.
