# 🗺 CODEMAP — Bản Đồ Luồng Code Dự Án S-Mart

> **Mục đích**: File này là **điểm tham chiếu duy nhất** khi phát triển. AI Agent hoặc developer đọc file này để nhanh chóng xác định file nào cần sửa cho từng chức năng, tiết kiệm thời gian tìm kiếm.

---

## ⚡ Quy tắc chung khi đọc

- **Mỗi chức năng** = 1 hàng dọc: `Frontend Page → FE Service → BE Route → DB (Prisma)`.
- **BE Route** chứa toàn bộ logic xử lý (inline handler). Một số chức năng có thêm **Controller** và **Use Case** riêng.
- **Domain Layer** (`domain/`) chỉ chứa OOD entities/value objects — **không phải nơi xử lý API**.
- **Prisma schema** là nguồn sự thật duy nhất cho cấu trúc DB.

---

## 1. AUTH — Xác thực & Phân quyền

```
Frontend                          Backend                              DB
─────────                         ───────                              ──
Login.jsx                    →  auth.routes.ts (POST /login)       →  User table
Register.jsx                 →  auth.routes.ts (POST /register)    →  User table
VerifyOtp.jsx                →  auth.routes.ts (POST /verify-otp)  →  User.otpCode
ForgotPassword.jsx           →  auth.routes.ts (POST /forgot-password) → User.otpCode
ResetPassword.jsx            →  auth.routes.ts (POST /reset-password)  → User.password
Login.jsx (Google btn)       →  auth.routes.ts (POST /google-login)    → User table

FE Service: services/auth.service.js
FE State:   context/AuthContext.jsx (token, role, userId lưu localStorage)
BE Mid:     middlewares/auth.middleware.ts (JWT verify, req.user inject)
BE Infra:   security/JwtService.ts, security/BcryptHasher.ts
```

### File cần sửa khi thay đổi Auth:
| Thay đổi | Files |
|---|---|
| Thêm field user (VD: avatar) | `prisma/schema.prisma` → `auth.routes.ts` → `auth.service.js` → Page tương ứng |
| Sửa logic JWT/token | `auth.middleware.ts` + `JwtService.ts` |
| Sửa Google OAuth | `auth.routes.ts` (POST /google-login) + `Login.jsx` |

---

## 2. PRODUCT — Sản phẩm & Danh mục

```
Frontend                           Backend                                  DB
─────────                          ───────                                  ──
Home.jsx (list)              →  product.routes.ts (GET /)              →  Product + ProductVariant
ProductDetail.jsx            →  product.routes.ts (GET /:id/detail)    →  Product + Review + OrderItem
Home.jsx (category filter)   →  category.routes.ts (GET /)             →  Category
Home.jsx (Search thường)     →  product.routes.ts (GET /)              →  Product (searchText column)
Home.jsx (AI Search)         →  product.routes.ts (GET /search/ai)     →  Product (vectorData column)

FE Service: services/product.service.js
BE Logic:   Tối ưu Text Search (không dấu, đa trường, tách từ) + AI Vector Search
Domain:     entities/Product.ts, entities/ProductVariant.ts
```

### File cần sửa khi thay đổi Product:
| Thay đổi | Files |
|---|---|
| Sửa logic tìm kiếm thường | `product.routes.ts` (GET /) — chỉnh sửa logic `where.AND` |
| Sửa logic tìm kiếm AI | `product.routes.ts` (GET /search/ai) + `GeminiVectorService.ts` |
| Cập nhật dữ liệu nhúng | `GeminiVectorService.ts` (formatProductText) + `sync_vectors.ts` |

---

## 3. CART — Giỏ hàng

```
Frontend                           Backend                              DB
─────────                          ───────                              ──
Cart.jsx                     →  cart.routes.ts (GET /)              →  CartItem + ProductVariant
Cart.jsx (add)               →  cart.routes.ts (POST /)             →  CartItem
Cart.jsx (update qty)        →  cart.routes.ts (PUT /:id)           →  CartItem
Cart.jsx (remove)            →  cart.routes.ts (DELETE /:id)        →  CartItem
Checkout.jsx (clear)         →  cart.routes.ts (DELETE /clear)      →  CartItem

FE Service: services/cart.service.js
FE State:   context/CartContext.jsx (badge count, auto refresh)
Domain:     entities/Cart.ts, entities/Cart.ts (CartItem)
```

### File cần sửa khi thay đổi Cart:
| Thay đổi | Files |
|---|---|
| Thêm logic (VD: max qty) | `cart.routes.ts` → `Cart.jsx` |
| Sửa UI giỏ hàng | `Cart.jsx` + `CartContext.jsx` |
| Badge giỏ hàng (Header) | `components/Header.jsx` + `CartContext.jsx` |

---

## 4. ORDER — Đơn hàng & Checkout

```
Frontend                           Backend                                  DB
─────────                          ───────                                  ──
Checkout.jsx (tạo đơn)      →  order.routes.ts (POST /)               →  Order + OrderItem + CartItem (clear)
Orders.jsx (lịch sử)        →  order.routes.ts (GET /)                →  Order + OrderItem + Product
SingleOrder.jsx (chi tiết)   →  order.routes.ts (GET /:id)             →  Order + OrderItem
Orders.jsx (hủy)             →  order.routes.ts (PUT /:id/cancel)      →  Order.status → CANCELLED
Admin: AdminOrders.jsx       →  order.routes.ts (GET /admin)           →  Order (all)
Admin: AdminOrders.jsx       →  order.routes.ts (PUT /admin/:id/status)→  Order.status + Notification

FE Service: services/order.service.js
BE Controller: controllers/OrderController.ts
BE Use Case:   use-cases/OrderUseCases.ts
Domain:        entities/Order.ts (State Machine: PENDING→CONFIRMED→SHIPPING→DELIVERED|CANCELLED)
               entities/OrderItem.ts
```

### File cần sửa khi thay đổi Order:
| Thay đổi | Files |
|---|---|
| Thêm trạng thái mới | `entities/Order.ts` (enum) → `order.routes.ts` → `schema.prisma` → `AdminOrders.jsx` + `Orders.jsx` |
| Sửa logic trừ kho | `order.routes.ts` (POST / handler) |
| Sửa UI checkout | `Checkout.jsx` + `order.service.js` |
| Admin cập nhật status | `order.routes.ts` (PUT /admin/:id/status) + `AdminOrders.jsx` |

---

## 5. PAYMENT — Thanh toán VNPay

```
Frontend                           Backend                              DB
─────────                          ───────                              ──
Checkout.jsx (VNPay btn)     →  payment.routes.ts (GET /create-payment) → tạo URL VNPay
PaymentCallback.jsx          →  payment.routes.ts (GET /vnpay-callback) → Order.status → PAID

FE Service: (gọi trực tiếp từ Checkout.jsx qua api.js)
BE Config:  .env (VNP_TMN_CODE, VNP_HASH_SECRET, VNP_URL, VNP_RETURN_URL)
```

### File cần sửa khi thay đổi Payment:
| Thay đổi | Files |
|---|---|
| Sửa VNPay config | `.env` + `payment.routes.ts` |
| Sửa callback URL | `.env` (VNP_RETURN_URL) + `payment.routes.ts` + `PaymentCallback.jsx` |
| Thêm phương thức thanh toán mới | `payment.routes.ts` + `Checkout.jsx` |

---

## 6. COUPON — Mã giảm giá

```
Frontend                           Backend                              DB
─────────                          ───────                              ──
Checkout.jsx (apply coupon)  →  coupon.routes.ts (GET /apply/:code) →  Coupon table
Admin: AdminCoupons.jsx      →  coupon.routes.ts (CRUD)             →  Coupon table

FE Service: services/coupon.service.js
```

---

## 7. CHAT — Nhắn tin Real-time

```
Frontend                           Backend                              DB
─────────                          ───────                              ──
Chat.jsx (user side)         →  chat.routes.ts (POST /send)        →  Message table
AdminChat.jsx (admin side)   →  chat.routes.ts (GET /history/:id)  →  Message table
Cả 2 page                   ←  socketService.ts (emit receiveMessage) ← Socket.io

FE Service: services/chat.service.js
BE Socket:  infrastructure/socket/socketService.ts
Socket Events:
  - Client emit:  "register" (userId), "sendMessage" ({receiverId, content, senderId})
  - Client listen: "receiveMessage", "onlineUsers"
```

### File cần sửa khi thay đổi Chat:
| Thay đổi | Files |
|---|---|
| Sửa UI chat user | `Chat.jsx` |
| Sửa UI chat admin | `AdminChat.jsx` |
| Sửa logic gửi/nhận message | `chat.routes.ts` + `socketService.ts` |
| Thêm field message (VD: image) | `schema.prisma` → `chat.routes.ts` → `Chat.jsx` + `AdminChat.jsx` |

---

## 8. NOTIFICATION — Thông báo Real-time

```
Frontend                           Backend                                  DB
─────────                          ───────                              ──
Header.jsx (bell icon)       →  notification.routes.ts (GET /)         →  Notification table
NotificationDropdown.jsx     →  notification.routes.ts (PUT /:id/read) →  Notification.isRead
AdminNotifications.jsx       →  notification.routes.ts                 →  Notification table
                             ←  socketService.ts (emit "notification") ← Socket.io

FE Component: components/NotificationDropdown.jsx
```

---

## 9. REVIEW — Đánh giá sản phẩm

```
Frontend                           Backend                              DB
─────────                          ───────                              ──
ProductDetail.jsx (form)     →  review.routes.ts (POST /)           →  Review table
ProductDetail.jsx (list)     →  review.routes.ts (GET /product/:id) →  Review + User
ProductDetail.jsx (stats)    →  review.routes.ts (GET /product/:id/stats) → Review aggregate
Orders.jsx (review btn)      →  review.routes.ts (GET /user/:userId/product/:productId) → Review check
```

---

## 10. ADMIN — Quản trị

```
Frontend                           Backend                              DB
─────────                          ───────                              ──
AdminDashboard.jsx           →  admin.routes.ts (GET /stats)        →  Order + User + Product (aggregate)
AdminProducts.jsx            →  admin.routes.ts (CRUD /products)    →  Product + ProductVariant + Category
AdminOrders.jsx              →  order.routes.ts (GET /admin)        →  Order (all)
AdminUsers.jsx               →  admin.routes.ts (GET/PUT /users)    →  User table
AdminCoupons.jsx             →  coupon.routes.ts (CRUD)             →  Coupon table
AdminNotifications.jsx       →  notification.routes.ts              →  Notification table
AdminChat.jsx                →  chat.routes.ts                      →  Message table

FE Service: services/admin.service.js
```

---

## 11. UPLOAD — Tải ảnh

```
Frontend                           Backend                              Disk
─────────                          ───────                              ────
AdminProducts.jsx (image)    →  upload.routes.ts (POST /)           →  /uploads/ folder
                                 Static serve: express.static('/uploads')
```

---

## 12. AI & VECTOR SEARCH — Tìm kiếm thông minh

```
Luồng xử lý                          Thành phần tham gia                      Mô tả
───────────                          ───────────────────                      ────
1. Nhúng dữ liệu (Index)       →  GeminiVectorService.ts            →  Dùng Gemini API tạo vector 768 chiều
2. Lưu trữ                     →  Product.vectorData & searchText    →  Lưu vector JSON và chuỗi không dấu
3. Tìm kiếm ngữ nghĩa          →  product.routes.ts (GET /search/ai)→  Tính Cosine Similarity (Threshold: 0.65)
4. Tự động hóa                 →  product.routes.ts (POST/PUT)      →  Auto-embed ngầm khi thêm/sửa SP

Hạ tầng: Google Gemini API (gemini-embedding-001)
Logic Tối ưu:
  - Text Search: Tự động khử dấu (unaccent), tách từ (split words), tìm trên name/desc/brand/sku.
  - AI Search: Nhúng cả Tên, Mô tả, Thương hiệu, Danh mục, Size và Màu sắc.
```

---

## 📁 Bản Đồ Thư Mục (Quick Reference)

```
new-backend/src/
├── index.ts                          # Entry point, mount routes, init socket
├── domain/
│   ├── entities/                     # OOD: User, Customer, Staff, Product, ProductVariant,
│   │                                 #       Cart, CartItem, Order, OrderItem, Category
│   ├── value-objects/                # Money, Email, PhoneNumber, Address
│   ├── services/PriceStrategy.ts     # Strategy Pattern: Normal/Sale/MemberPrice
│   ├── repositories/                 # Interfaces: UserRepo, ProductRepo, OrderRepo
│   └── __tests__/Domain.test.ts      # 5 unit tests (invariants)
├── application/
│   ├── use-cases/ProductUseCases.ts  # Logic nghiệp vụ sản phẩm
│   └── dtos/                         # (empty — DTOs inline hiện tại)
├── infrastructure/
│   ├── persistence/PrismaClient.ts   # Kết nối DB
│   ├── external-services/
│   │   └── GeminiVectorService.ts    # ★ Lõi AI: Tạo vector, format text nhúng
│   ├── security/                     # JwtService, BcryptHasher
│   ├── socket/socketService.ts       # Socket.io init + events
├── interface/
│   ├── routes/                       # 12 route files
│   │   ├── product.routes.ts         # ★ Xử lý API Search (AI & Text tối ưu)
│   │   └── ...
│   ├── controllers/                  # AuthController, OrderController, ProductController
│   └── middlewares/auth.middleware.ts # JWT verify + role check
└── prisma/
    ├── schema.prisma                 # ★ Nguồn sự thật DB (thêm cột vectorData, searchText)
    └── seed.ts                       # Dữ liệu mẫu

frontend/src/
├── App.jsx                           # ★ Routing tổng (tất cả routes)
├── main.jsx                          # Entry point React
├── context/                          # AuthContext, CartContext
├── services/                         # 8 service files (API calls)
├── layouts/                          # MainLayout, AdminLayout, AuthLayout
├── components/                       # Header, Footer, NotificationDropdown, FloatingAiChat
└── pages/
    ├── [14 user pages]               # Home, ProductDetail, Cart, Checkout, Orders, ...
    └── admin/[7 admin pages]         # AdminDashboard, AdminProducts, AdminOrders, ...
```

---

## 🔗 Bảng Route Files (Backend)

| Route File | Mount Path | Chức năng chính |
|---|---|---|
| `auth.routes.ts` | `/api/auth` | Register, Login, OTP, Google, Forgot/Reset Password, /me |
| `product.routes.ts` | `/api/products` | List, Search, Detail, CRUD (admin sections) |
| `product.routes.ts` | `/api/products/search/ai` | Tìm kiếm ngữ nghĩa bằng AI (Gemini) |
| `product.routes.ts` | `/api/products/embed-all` | (Admin) Đồng bộ lại vector cho toàn bộ hệ thống |
| `product.routes.ts` | `/api/products/embed-status`| (Admin) Kiểm tra tiến độ indexing AI |
| `category.routes.ts` | `/api/categories` | List categories |
| `cart.routes.ts` | `/api/cart` | Get, Add, Update, Remove, Clear |
| `order.routes.ts` | `/api/orders` | Create, History, Detail, Cancel, Admin list/update status |
| `coupon.routes.ts` | `/api/coupons` | Apply, CRUD (admin) |
| `review.routes.ts` | `/api/reviews` | Create, List by product, Stats, Check user review |
| `notification.routes.ts` | `/api/notifications` | List, Mark read |
| `admin.routes.ts` | `/api/admin` | Stats, Users CRUD, Products CRUD |
| `upload.routes.ts` | `/api/upload` | File upload (multer) |
| `chat.routes.ts` | `/api/chat` | Send message, History, List conversations |
| `payment.routes.ts` | `/api/payment` | Create VNPay URL, Callback |

---

## 🔗 Bảng Frontend Routes

| Path | Page | Layout |
|---|---|---|
| `/` | `Home.jsx` | MainLayout |
| `/product/:id` | `ProductDetail.jsx` | MainLayout |
| `/cart` | `Cart.jsx` | MainLayout |
| `/checkout` | `Checkout.jsx` | MainLayout |
| `/orders` | `Orders.jsx` | MainLayout |
| `/orders/:id` | `SingleOrder.jsx` | MainLayout |
| `/profile` | `Profile.jsx` | MainLayout |
| `/chat` | `Chat.jsx` | MainLayout |
| `/login` | `Login.jsx` | AuthLayout |
| `/register` | `Register.jsx` | AuthLayout |
| `/verify-otp` | `VerifyOtp.jsx` | AuthLayout |
| `/forgot-password` | `ForgotPassword.jsx` | AuthLayout |
| `/reset-password` | `ResetPassword.jsx` | AuthLayout |
| `/payment-status` | `PaymentCallback.jsx` | Standalone |
| `/admin` | `AdminDashboard.jsx` | AdminLayout |
| `/admin/products` | `AdminProducts.jsx` | AdminLayout |
| `/admin/orders` | `AdminOrders.jsx` | AdminLayout |
| `/admin/users` | `AdminUsers.jsx` | AdminLayout |
| `/admin/coupons` | `AdminCoupons.jsx` | AdminLayout |
| `/admin/notifications` | `AdminNotifications.jsx` | AdminLayout |
| `/admin/chat` | `AdminChat.jsx` | AdminLayout |

---

## 🔗 Bảng Frontend Services → Backend API

| FE Service | Backend Route | Ghi chú |
|---|---|---|
| `api.js` | — | Axios instance, baseURL, interceptor token |
| `auth.service.js` | `/api/auth/*` | login, register, google, otp |
| `product.service.js` | `/api/products/*` | list, detail, search, category filter |
| `cart.service.js` | `/api/cart/*` | get, add, update, remove, clear |
| `order.service.js` | `/api/orders/*` | create, history, detail, cancel |
| `coupon.service.js` | `/api/coupons/*` | apply coupon |
| `chat.service.js` | `/api/chat/*` | send, history |
| `admin.service.js` | `/api/admin/*` | stats, users, products CRUD |
