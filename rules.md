# Sport Shop Project Specification & Rules (Production-Grade)

## 1. Tổng quan Dự án
Dự án thương mại điện tử đồ thể thao (Sport Shop) tập trung vào tính bền vững của mã nguồn, sự chặt chẽ của nghiệp vụ và khả năng mở rộng. Áp dụng tư duy **Domain-Driven Design (DDD)** và **Clean Architecture**.

## 2. Tech Stack
- **Backend**: Node.js (v20+), TypeScript (Strict Mode), Express.js.
- **ORM**: Prisma (Kết nối MySQL).
- **Frontend**: React 19, Vite, TailwindCSS v4.
- **Communication**: REST API + Socket.io (Real-time).
- **Auth**: JWT (Stateless), Bcrypt (Hashing).

## 3. Quy tắc OOD & Domain Logic (BẮT BUỘC TUÂN THỦ)

### A. Tính đóng gói & Invariants (Quy tắc bất biến)
1. **Value Objects**: Mọi dữ liệu có tính chất định danh (Email, Phone, Money, Address) phải được bọc trong class/object riêng. Không dùng string/long thuần túy.
   - `Money`: Phải có `amount` và `currency`. Không cho phép cộng khác đơn vị tiền tệ.
   - `Email`: Phải được validate ngay khi khởi tạo.
2. **Encapsulation**: 
   - Không lộ Setter bừa bãi. Mọi thay đổi trạng thái (giá, tồn kho, status) phải thông qua các Domain Method có tính logic (ví dụ: `confirm()`, `decreaseStock()`).
   - Các Collection (List) trong Entity phải được bọc bởi `readonly` hoặc trả về bản copy để tránh bị chỉnh sửa từ bên ngoài.
3. **AI Search Invariant**: `vectorData` của Product chỉ được cập nhật bên trong method `updateDescription()` hoặc `updateImage()`. Đảm bảo vector luôn khớp với nội dung.

### B. Phân cấp Người dùng (Kế thừa & Trừu tượng)
- **Base Class**: `User` (Abstract).
- **Sub-classes**: `Customer`, `Staff`, `Admin`.
- **Role & Status**: Dùng Enum nghiêm ngặt.
- **Hành vi**: 
   - `Customer` sở hữu `Cart` và danh sách `Order`.
   - `Staff` có quyền quản lý kho (`manageInventory`).

### C. Sản phẩm & Biến thể (Composition)
- **Product 1-n ProductVariant**: Xóa Product phải xóa toàn bộ Variant (Life-cycle composition).
- **Pricing**: Áp dụng **Strategy Pattern**. Các loại giá: `NormalPrice`, `SalePrice`, `MemberPrice`.

### D. Giỏ hàng & Đơn hàng (State Machine)
- **Cart**: Kiểm tra tồn kho ngay khi thêm vào giỏ (Check only).
- **Order Status Flow**: `PENDING` -> `CONFIRMED` -> `SHIPPING` -> `DELIVERED`.
- **Logic Trừ kho**: Chỉ trừ tồn kho khi Order chuyển sang `CONFIRMED`.
- **Logic Hoàn kho**: Khi Cancel đơn hàng (nếu chưa Shipping).
- **Lock Invariant**: Cấm chỉnh sửa/xóa `OrderItem` khi đơn hàng ở trạng thái `SHIPPING` trở lên.

## 4. Kiến trúc Thư mục (Backend)
```text
src/
├── domain/           # Chứa Entities, Value Objects, Domain Services, Interfaces
├── application/      # Chứa Use Cases, DTOs, Mappers
├── infrastructure/   # Chứa Repositories implementation, External API (VNPay), DB (Prisma)
└── interface/        # Chứa Controllers, Routes, Middlewares
```

## 5. Danh sách Chức năng Chính (Đầy đủ theo Backend cũ)
1. **Auth**: Login/Register, OAuth2 Google, Verify OTP.
2. **Shop**: List/Search AI (Vector), Detail, Category Tree (No Cycle).
3. **Cart & Checkout**: Quản lý giỏ hàng, áp mã giảm giá (Coupon Strategy).
4. **Order**: Theo dõi trạng thái, Lịch sử mua hàng, Cập nhật trạng thái (State Machine).
5. **Payment**: Tích hợp VNPay (Redirect flow).
6. **Real-time Chat**: Chat hỗ trợ giữa Customer và Staff/Admin qua Socket.io.
7. **Admin**: Thống kê doanh thu, Quản lý sản phẩm/kho, Quản lý User.
8. **Notifications**: Hệ thống thông báo Real-time cho User (Đơn hàng, Khuyến mãi).
9. **Reviews**: Khách hàng đánh giá sản phẩm (Rating, Comment, Hình ảnh).
10. **File Upload**: Upload hình ảnh sản phẩm/avatar.
11. **AI Chat**: Tích hợp AI Chatbot tư vấn (Gemini/OpenAI).
