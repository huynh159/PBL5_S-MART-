-- Xóa dữ liệu cũ nếu có
DELETE FROM users WHERE email = 'admin@gmail.com';

-- 1. Chèn tài khoản Admin (Email: admin@gmail.com | Pass: 12345678)
-- Dùng mã Bcrypt cho '12345678': $2a$10$Y5OZrGJS6R2grB14ReF6W.3rjvAL.h89P6sL2S0.p3IuIq96WpTye
INSERT INTO users (email, password, role, is_active, is_verified) 
VALUES ('admin@gmail.com', '$2a$10$Y5OZrGJS6R2grB14ReF6W.3rjvAL.h89P6sL2S0.p3IuIq96WpTye', 'ADMIN', 1, 1);

-- 2. Chèn danh mục mẫu (nếu database của bạn có bảng categories)
INSERT INTO categories (name, description) VALUES ('Giày Thể Thao', 'Các loại giày chạy bộ, bóng đá...');
INSERT INTO categories (name, description) VALUES ('Quần Áo', 'Trang phục thi đấu và tập luyện');
INSERT INTO categories (name, description) VALUES ('Dụng Cụ', 'Vợt, bóng, bảo hộ...');
