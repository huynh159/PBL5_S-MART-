-- Reset mật khẩu thành '12345678' cho tài khoản admin và user
-- Hash BCrypt của '12345678': $2a$10$Y5OZrGJS6R2grB14ReF6W.3rjvAL.h89P6sL2S0.p3IuIq96WpTye
UPDATE users SET 
    password='$2a$10$Y5OZrGJS6R2grB14ReF6W.3rjvAL.h89P6sL2S0.p3IuIq96WpTye',
    is_active=1, 
    is_verified=1 
WHERE email='admin@smart.com';

UPDATE users SET 
    password='$2a$10$Y5OZrGJS6R2grB14ReF6W.3rjvAL.h89P6sL2S0.p3IuIq96WpTye',
    is_active=1, 
    is_verified=1 
WHERE email='user3@gmail.com';

-- Xác nhận lại
SELECT id, email, role, is_active, is_verified, LEFT(password,10) as hash_start FROM users WHERE email IN ('admin@smart.com','user3@gmail.com');
