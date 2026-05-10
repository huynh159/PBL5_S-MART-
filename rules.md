# Sport Shop — Quy tắc OOD & Domain Logic (Production-Grade)

## 1. Tổng quan
Dự án E-Commerce (Sport Shop) áp dụng **Domain-Driven Design (DDD)** và **Clean Architecture**.

## 2. Tech Stack
- **Backend**: Node.js (v20+), TypeScript (Strict Mode), Express.js.
- **ORM**: Prisma (PostgreSQL).
- **Frontend**: React 19, Vite, TailwindCSS v4.
- **Communication**: REST API + Socket.io (Real-time).
- **Auth**: JWT (Stateless), BCrypt (Hashing), Google OAuth2.

## 3. Quy tắc OOD & Domain Logic

### A. Đóng gói & Invariants
1. **Value Objects**: `Money`, `Email`, `PhoneNumber`, `Address` — validate ngay khi khởi tạo.
2. **Encapsulation**: Không lộ setter. Mọi thay đổi qua Domain Method (`confirm()`, `decreaseStock()`).
3. **Collection**: Luôn trả về `Object.freeze([...])` — immutable copy.
4. **AI Vector**: `vectorData` chỉ cập nhật trong `updateDescription()` / `updateImage()`.

### B. Phân cấp User (Kế thừa & Trừu tượng)
- `User` (abstract) → `Customer`, `Staff`.
- Role & Status dùng `enum` (`UserRole`, `UserStatus`).
- `Customer` sở hữu `Cart` (1-1) và danh sách `Order`.
- `Staff` quản lý kho (`manageInventory`), xử lý đơn (`processOrder`).

### C. Sản phẩm & Biến thể (Composition)
- `Product` 1→n `ProductVariant` — xóa Product → xóa Variant.
- **Strategy Pattern**: `NormalPrice`, `SalePrice`, `MemberPrice`.

### D. Giỏ hàng & Đơn hàng (State Machine)
- **Cart**: Check stock khi add (không trừ kho).
- **Order Flow**: `PENDING` → `CONFIRMED` → `SHIPPING` → `DELIVERED` | `CANCELLED`.
- **Trừ kho**: Khi `confirm()`. **Hoàn kho**: Khi `cancel()` (trước SHIPPING).
- **Lock**: Cấm sửa `OrderItem` từ `SHIPPING` trở lên.
- **Invariant**: `totalAmount = totalItems + shippingFee - discount` (tính runtime, không setter).

## 4. Kiến trúc Backend (`new-backend/src/`)
```
domain/          # Entities, Value Objects, Domain Services, Repository Interfaces
application/     # Use Cases, DTOs
infrastructure/  # Prisma Repositories, External APIs (VNPay), Socket.io, JWT
interface/       # Controllers, Routes, Middlewares
```

## 5. Chức năng chính
1. **Auth**: Login/Register, Google OAuth2, OTP, Forgot Password.
2. **Shop**: Products CRUD, Category Tree, AI Vector Search.
3. **Cart & Checkout**: Giỏ hàng, mã giảm giá (Coupon).
4. **Order**: State Machine, lịch sử mua hàng.
5. **Payment**: VNPay (Sandbox) + COD.
6. **Chat**: Real-time (Socket.io) giữa Customer ↔ Admin.
7. **Notifications**: Real-time cho đơn hàng & hệ thống.
8. **Admin**: Dashboard thống kê, quản lý User/Product/Order/Category/Coupon.
9. **Reviews**: Rating + Comment sản phẩm.
10. **Upload**: Hình ảnh sản phẩm/avatar.
