import random
import datetime

sql = []
sql.append('USE sport_shop;')
sql.append('SET FOREIGN_KEY_CHECKS = 0;')
tables = ['reviews', 'notifications', 'messages', 'cart_items', 'order_items', 'orders', 'coupons', 'products', 'categories', 'users']
for t in tables:
    sql.append(f'TRUNCATE TABLE {t};')

pw_hash = '$2a$10$DowM6gVq0a9.c2B3p2N3.e6z.b5h4m.b5h4m.b5h4m.b5h4m.b5h4m'

# Users
users = []
users.append(f"(1, 'admin@smart.com', '{pw_hash}', 'ADMIN', 1, 1)")
for i in range(2, 22):
    users.append(f"({i}, 'user{i}@gmail.com', '{pw_hash}', 'USER', 1, 1)")
sql.append("INSERT INTO users (id, email, password, role, is_active, is_verified) VALUES " + ",\n".join(users) + ";")

# Categories
categories = []
for i in range(1, 22):
    categories.append(f"({i}, 'Category {i}', 'Description {i}')")
sql.append("INSERT INTO categories (id, name, description) VALUES " + ",\n".join(categories) + ";")

# Products
products = []
for i in range(1, 22):
    cat = random.randint(1, 20)
    products.append(f"({i}, 'Product {i}', 100.0, 'Desc {i}', 50, 'url', {cat}, 'BrandX', 90.0, 'SKU{i}', 'ACTIVE', 'None')")
sql.append("INSERT INTO products (id, name, price, description, stock, image_url, category_id, brand, sale_price, sku, status, variations) VALUES " + ",\n".join(products) + ";")

# Coupons
coupons = []
for i in range(1, 22):
    coupons.append(f"({i}, 'CODE{i}', {random.randint(5,50)}, '2026-12-31', 1)")
sql.append("INSERT INTO coupons (id, code, discount_percent, expiry_date, is_active) VALUES " + ",\n".join(coupons) + ";")

# Orders
orders = []
for i in range(1, 22):
    u = random.randint(2, 21)
    orders.append(f"({i}, {u}, 200.0, 'PENDING', 'VNPAY', NULL, NOW())")
sql.append("INSERT INTO orders (id, user_id, total, status, payment_method, coupon_id, created_at) VALUES " + ",\n".join(orders) + ";")

# Order Items
order_items = []
for i in range(1, 22):
    o = random.randint(1, 21)
    p = random.randint(1, 21)
    order_items.append(f"({i}, {o}, {p}, {random.randint(1,5)})")
sql.append("INSERT INTO order_items (id, order_id, product_id, quantity) VALUES " + ",\n".join(order_items) + ";")

# Cart Items
cart_items = []
for i in range(1, 22):
    u = random.randint(2, 21)
    p = random.randint(1, 21)
    cart_items.append(f"({i}, {u}, {p}, {random.randint(1,3)})")
sql.append("INSERT INTO cart_items (id, user_id, product_id, quantity) VALUES " + ",\n".join(cart_items) + ";")

# Messages
messages = []
for i in range(1, 22):
    u = random.randint(2, 21)
    messages.append(f"({i}, {u}, 1, 'Hello Admin {i}', 'SENT', NOW())")
sql.append("INSERT INTO messages (id, sender_id, receiver_id, content, status, created_at) VALUES " + ",\n".join(messages) + ";")

# Notifications
notifications = []
for i in range(1, 22):
    u = random.randint(2, 21)
    notifications.append(f"({i}, {u}, 'Info {i}', 0, NOW())")
sql.append("INSERT INTO notifications (id, user_id, content, is_read, created_at) VALUES " + ",\n".join(notifications) + ";")

# Reviews
reviews = []
for i in range(1, 22):
    u = random.randint(2, 21)
    p = random.randint(1, 21)
    reviews.append(f"({i}, {u}, {p}, {random.randint(1,5)}, 'Great {i}', NOW())")
sql.append("INSERT INTO reviews (id, user_id, product_id, rating, comment, created_at) VALUES " + ",\n".join(reviews) + ";")

sql.append('SET FOREIGN_KEY_CHECKS = 1;')

with open('seed.sql', 'w') as f:
    f.write("\n".join(sql))

