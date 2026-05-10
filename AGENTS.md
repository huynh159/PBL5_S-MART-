# Hướng dẫn cho AI Agent — Dự án S-Mart Sport Shop

## 🏗 Kiến trúc Hệ thống
Ứng dụng Full-Stack: **React (Vite) Frontend** + **Node.js (Express/TypeScript) Backend** + **PostgreSQL**.

- **Frontend (`/frontend`)**: React 19, Vite, TailwindCSS v4. State quản lý qua React Context (`AuthContext`, `CartContext`). Routing bằng React Router.
- **Backend (`/new-backend`)**: TypeScript, **Clean Architecture & DDD**. Layers: Domain (Entities, Value Objects), Application (Use Cases), Infrastructure (Prisma ORM, Socket.io), Interface (Routes, Middlewares).
- **Giao tiếp**: RESTful API (CRUD) + WebSocket/Socket.io (Chat, Notifications).

## 🛠 Lệnh thường dùng

**Backend (`/new-backend`)**:
- `npm install` → `npm run dev` (nodemon + ts-node)
- `npx prisma db push` / `npx prisma migrate dev`
- `npm test` (Vitest)

**Frontend (`/frontend`)**:
- `npm install` → `npm run dev`

## 🧩 Quy ước
- **API calls**: Đóng gói trong `frontend/src/services/` (Axios). Không gọi trực tiếp trong component.
- **Layouts**: `MainLayout.jsx` (public), `AdminLayout.jsx` (admin), `AuthLayout.jsx` (auth).
- **Bảo mật**: JWT + BCrypt + Role enum (USER, STAFF, ADMIN) qua Express Middleware.
- **Lỗi**: `react-toastify` ở frontend.

## 🔌 Tích hợp bên ngoài
- **Thanh toán**: VNPay (Payment Service trong `infrastructure/external-services/`).
- **Xác thực**: JWT email/password + Google OAuth2 (`@react-oauth/google`) + OTP.
- **Real-time**: Socket.io (`infrastructure/socket/`) cho Chat & Notifications.
