CREATE DATABASE sport_shop;
USE sport_shop;

CREATE TABLE users (
id INT AUTO_INCREMENT PRIMARY KEY,
email VARCHAR(100),
password VARCHAR(255),
role VARCHAR(20),
is_active BOOLEAN,
is_verified BOOLEAN,
otp_code VARCHAR(10),
otp_expiry TIMESTAMP,
created_at TIMESTAMP
);

CREATE TABLE products (
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(255),
price DOUBLE,
description TEXT,
stock INT
);

CREATE TABLE coupons (
id INT AUTO_INCREMENT PRIMARY KEY,
code VARCHAR(50),
discount_percent INT,
expiry_date DATE,
is_active BOOLEAN
);

CREATE TABLE orders (
id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT,
total DOUBLE,
status VARCHAR(50),
payment_method VARCHAR(50),
coupon_id INT,
created_at TIMESTAMP
);

CREATE TABLE order_items (
id INT AUTO_INCREMENT PRIMARY KEY,
order_id INT,
product_id INT,
quantity INT
);

CREATE TABLE cart_items (
id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT,
product_id INT,
quantity INT
);

CREATE TABLE messages (
id INT AUTO_INCREMENT PRIMARY KEY,
sender_id INT,
receiver_id INT,
content TEXT,
created_at TIMESTAMP
);

CREATE TABLE notifications (
id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT,
content TEXT,
is_read BOOLEAN,
created_at TIMESTAMP
);
