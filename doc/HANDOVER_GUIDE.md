# Handover Guide (Cho thành viên mới)

Tài liệu này giúp đọc nhanh dự án và bắt tay vào code trong 15-30 phút.

## 1. Mục tiêu hệ thống
- Frontend: React + Vite + Tailwind.
- Backend: Spring Boot + MySQL.
- Realtime: WebSocket/STOMP cho chat và thông báo.

## 2. Database workflow chuẩn
Chỉ dùng các file trong `database/`:

- `init_sport_shop.sql`: reset + tạo schema + dữ liệu mẫu đầy đủ.
- `enforce_single_admin.sql`: đảm bảo chỉ có 1 admin (`admin@smart.com`) để chat ổn định.
- `seed.sql`: dữ liệu bổ sung nhẹ.
- `reset_db.bat`: script tiện chạy nhanh trên Windows.

Không dùng các script dump/fix cũ đã bị loại bỏ.

## 3. Quy ước trạng thái đơn hàng
Trạng thái canonical dùng xuyên suốt:

- `PENDING`
- `PROCESSING`
- `SHIPPED`
- `DELIVERED`
- `CANCELLED`

Khi mở rộng trạng thái mới, cần cập nhật đồng thời:
- Backend thống kê (`AdminController`)
- Trang `AdminDashboard`
- Trang `AdminOrders`
- Tài liệu API/dự án

## 4. Quy ước chat admin-user
- Hệ thống chạy chính sách 1 admin.
- Tài khoản admin mặc định: `admin@smart.com`.
- Khi reset DB, luôn chạy thêm `enforce_single_admin.sql`.

## 5. Checklist trước khi push
- Chạy backend compile thành công.
- Chạy frontend lint cho file đã sửa.
- Cập nhật docs nếu thay đổi API/trạng thái.
- Ghi rõ cách test trong PR.

