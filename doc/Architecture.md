# System Architecture - Sport Shop

## 1. Architecture Pattern

* RESTful API
* Clean Architecture

---

## 2. Tech Stack

### Backend

* Spring Boot
* Spring Security
* JWT
* OAuth2
* WebSocket

### Frontend

* ReactJS

### Database

* MySQL

---

## 3. Modules

* Auth Service
* Product Service
* Cart Service
* Order Service
* Payment Service
* Chat Service
* Notification Service
* Admin Service
* Review Service (Product Rating)

---

## 4. Flow

Client → REST API → Service → DB
Client → WebSocket → Chat/Notification

---

## 5. Security

* JWT authentication
* BCrypt password
* OTP verification
* Role-based (USER / ADMIN)
