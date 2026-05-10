# Project Status (05/2026)

Hệ thống **Node.js (TypeScript) + Prisma + PostgreSQL**.

## Hoàn thành ✅
- [x] Chuyển đổi từ Java Spring Boot → Node.js TypeScript
- [x] Authentication (JWT, BCrypt, OTP, Google OAuth2)
- [x] Phân quyền Role: ADMIN / CUSTOMER
- [x] CRUD Sản phẩm, Danh mục, Đơn hàng, Người dùng
- [x] Chat Real-time (Socket.io) giữa User ↔ Admin
- [x] Dashboard thống kê (doanh thu, trạng thái đơn hàng)
- [x] Thanh toán VNPay + COD
- [x] Mã giảm giá (Coupon)
- [x] Reviews (Rating + Comment)
- [x] Upload hình ảnh
- [x] Notifications Real-time
- [x] Seeding dữ liệu mẫu (`npx prisma db seed`)
- [x] Domain Layer OOD (Value Objects, Entities, Strategy Pattern, State Machine)
- [x] Unit Tests domain (5/5 test cases)

## Ưu tiên tiếp theo
- [ ] Tối ưu SEO & Metadata
- [ ] Cải thiện UI/UX lịch sử mua hàng

## Database
Schema duy nhất: `new-backend/prisma/schema.prisma`

```bash
cd new-backend
npx prisma db push    # Áp schema
npx prisma db seed    # Dữ liệu mẫu
npx prisma studio     # Xem data trên trình duyệt
```

## Tài khoản mẫu
| Role     | Email              | Password |
|----------|--------------------|----------|
| Admin    | admin@smart.com    | 123456   |
| Customer | customer@gmail.com | 123456   |
| Customer | user2@gmail.com    | 123456   |

## Cấu trúc thư mục
- `frontend/` — React + Vite + Tailwind v4
- `new-backend/` — Node.js + Express + Prisma (Clean Architecture + DDD)
- `doc/` — Tài liệu API
