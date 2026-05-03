# Database – S-MART Sport Shop

Dự án sử dụng **PostgreSQL** với **Prisma ORM**. Mọi schema và seed đều ở `new-backend/prisma/`.

## Schema duy nhất (Single Source of Truth)
```
new-backend/prisma/schema.prisma
```

## Cách reset & seed lại từ đầu
```powershell
cd new-backend
npx prisma db push        # áp schema vào DB (không tạo migration)
npx prisma db seed        # đổ dữ liệu mẫu
```

## Tài khoản mẫu
| Role     | Email                 | Password |
|----------|-----------------------|----------|
| Admin    | admin@smart.com       | 123456   |
| Customer | customer@gmail.com    | 123456   |
| Customer | user2@gmail.com       | 123456   |

## Mã giảm giá mẫu
| Code       | Discount | Hết hạn     |
|------------|----------|-------------|
| WELCOME10  | 10%      | 31/12/2026  |
| SPORT20    | 20%      | 30/06/2026  |

## Lưu ý
- File `.sql` cũ trong thư mục `database/` đã bị xóa (không còn dùng).
- Backend Java Spring Boot cũ (`backend/`) đã bị xóa.
- **Chỉ dùng `new-backend/`** cho toàn bộ API.
