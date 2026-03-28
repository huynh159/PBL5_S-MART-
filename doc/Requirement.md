# Requirement Document - Sport Shop (Final)

## 1. Functional Requirements

### 1. Authentication

* Register (email/password)
* Login (JWT)
* Login with Google (OAuth2)
* OTP verification (email)
* Forgot password

---

### 2. User Features

#### Product

* View product list
* Search/filter products
* View product detail

#### Cart

* Add to cart
* Update quantity
* Remove item

#### Order

* Place order
* Apply coupon
* View order history

#### Payment

* COD
* VNPay

---

### 3. Chat (Realtime)

* User chat with Admin
* Admin chat with User
* WebSocket realtime messaging

---

### 4. Notification (Realtime)

* New order → Admin notified
* Payment success → Admin notified
* New message → realtime notify

---

### 5. Admin Features

#### Product

* CRUD product
* Manage inventory

#### User

* View users
* Lock/unlock account

#### Order

* Manage order status

#### Coupon

* Create coupon
* Activate/deactivate coupon

#### Analytics

* Revenue by day/month/year
* Top products
* Total orders

---

## 2. Non-functional Requirements

* Security: JWT + OAuth2 + OTP
* Performance: <2s
* Realtime: WebSocket
* Email: SMTP
* Payment: VNPay
* Deployment: Docker
