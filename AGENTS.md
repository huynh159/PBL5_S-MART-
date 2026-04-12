# Hướng dẫn cho AI Agent - Dự án Sport Shop

Chào mừng đến với mã nguồn Sport Shop! Tài liệu này phác thảo các mẫu thiết kế chính, kiến trúc và luồng công việc dành cho nhà phát triển nhằm giúp các AI agent có thể làm việc hiệu quả ngay lập tức.

## 🏗 Kiến trúc Hệ thống (Tổng quan)
Đây là một ứng dụng Full-Stack sử dụng **React (Vite) Frontend** và **Spring Boot Backend** với MySQL.
- **Frontend (`/frontend`)**: Ứng dụng React 19 sử dụng Vite và TailwindCSS v4. Quản lý state toàn cục thông qua React Context (ví dụ: `AuthContext`, `CartContext`) thay vì Redux. Định tuyến (routing) được xử lý bởi React Router.
- **Backend (`/backend`)**: Ứng dụng Java Spring Boot tuân theo nguyên tắc Clean Architecture (Controller -> Service -> Repository). Các thực thể (Entity) ánh xạ tới MySQL, và các request/response được xử lý bằng các DTO (`/backend/src/main/java/com/example/demo/dto`).
- **Giao tiếp**: 
  - RESTful API cho các thao tác CRUD và logic nghiệp vụ tiêu chuẩn.
  - WebSocket (`@stomp/stompjs` + `sockjs-client`) cho các tính năng thời gian thực như Chat và Thông báo (Notifications).

## 🛠 Các lệnh & Luồng công việc quan trọng
Luôn chạy các lệnh này từ các thư mục con tương ứng của chúng:

**Backend (`/backend`)**:
- Build & Chạy: `./mvnw spring-boot:run` (hoặc `./mvnw.cmd` trên Windows)
- Test: `./mvnw test`
- Dependencies được quản lý qua Maven (`pom.xml`).

**Frontend (`/frontend`)**:
- Cài đặt: `npm install`
- Chạy Dev Server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`

## 🧩 Quy ước cụ thể của Dự án
- **Tích hợp API Frontend**: Tất cả các lệnh gọi REST API bên ngoài được đóng gói trong thư mục `src/services/` (ví dụ: `api.js` cho cấu hình Axios cơ sở, `auth.service.js`, `cart.service.js`). Luôn sử dụng các service này thay vì gọi Axios trực tiếp trong các component.
- **Layouts**: Cấu trúc trang sử dụng các layout wrapper (ví dụ: `MainLayout.jsx` cho các trang công khai, `AdminLayout.jsx` cho bảng điều khiển admin, `AuthLayout.jsx` cho đăng nhập/đăng ký).
- **Bảo mật Backend**: Quyền truy cập theo vai trò (USER / ADMIN) được kiểm soát qua Spring Security + JWT. Mật khẩu được băm bằng BCrypt.
- **Xử lý Lỗi**: Sử dụng `react-toastify` ở frontend để cung cấp phản hồi cho người dùng về các lỗi API.

## 🔌 Các điểm Tích hợp & Dependencies bên ngoài
- **Thanh toán**: Tích hợp với VNPay (`VNPayTest.java`, Payment Service).
- **Xác thực**: Sử dụng JWT tiêu chuẩn qua email/mật khẩu, cùng với Google OAuth2 (`@react-oauth/google`). Bao gồm cả luồng xác minh OTP.
- **Thời gian thực**: Đảm bảo định tuyến các tin nhắn chat và thông báo qua luồng WebSocket đã được thiết lập thay vì HTTP polling.
