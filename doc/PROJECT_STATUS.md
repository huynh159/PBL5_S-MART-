# Project Status & Handover (04/2026)

Tài liệu bàn giao cho hệ thống **Node.js (TypeScript) + Prisma + PostgreSQL**.

---

## 1) Trạng thái hiện tại

### Hoàn thành
- [x] Chuyển đổi thành công từ Java sang Node.js (TypeScript).
- [x] Authentication & Authorization (JWT, Role ADMIN/CUSTOMER, BCrypt, OTP).
- [x] Quản lý Sản phẩm, Danh mục, Đơn hàng, Người dùng.
- [x] Chat Real-time giữa User và Admin (Sử dụng Socket.io).
- [x] Dashboard Stats (Biểu đồ doanh thu và trạng thái đơn hàng đồng bộ).
- [x] Thanh toán VNPay tích hợp hoàn chỉnh (đã fix port 3001).
- [x] Cơ chế Seeding dữ liệu mẫu thông minh (`npx prisma db seed`).

### Ưu tiên tiếp theo
- [ ] Bổ sung Unit Test cho logic Order và Chat.
- [ ] Tối ưu hóa SEO và Metadata cho trang sản phẩm.
- [ ] Cải thiện UI/UX phần lịch sử mua hàng.

---

## 2) Quy chuẩn Database (Prisma)

Hệ thống đã loại bỏ các file `.sql` cũ. Toàn bộ cấu trúc được định nghĩa tại:
`new-backend/prisma/schema.prisma`

### Các lệnh quan trọng:
- `npx prisma db push`: Đồng bộ schema vào Database.
- `npx prisma db seed`: Khởi tạo dữ liệu mẫu (Admin, Customer, Sản phẩm).
- `npx prisma studio`: Xem dữ liệu trực quan qua trình duyệt.

---

## 3) Thông tin tài khoản mẫu

| Vai trò   | Email                 | Mật khẩu |
|-----------|-----------------------|----------|
| Admin     | admin@smart.com       | 123456   |
| Khách 1   | customer@gmail.com    | 123456   |
| Khách 2   | user2@gmail.com       | 123456   |

---

## 4) Cấu trúc thư mục

- `frontend/`: React + Vite + Tailwind v4.
- `new-backend/`: Node.js + Express + Prisma.
- `doc/`: Tài liệu API và hướng dẫn.
