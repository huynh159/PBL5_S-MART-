# 🚀 S-Mart Sport Shop: Chiến Lược Tái Thiết Kế Toàn Diện

Tài liệu này đóng vai trò là "Bản thiết kế tổng thể" (Master Design Document) cho sự lột xác của dự án S-Mart, hướng tới một nền tảng thương mại điện tử thể thao hiện đại, cao cấp và mang lại trải nghiệm người dùng vượt trội.

---

## 1. Tầm Nhìn & Nguyên Tắc Thiết Kế (Vision & Principles)

### 🎯 Tầm nhìn
Biến S-Mart thành một cửa hàng thể thao trực tuyến không chỉ để mua sắm, mà còn truyền cảm hứng vận động thông qua giao diện **Mạnh mẽ (Dynamic), Chuyên nghiệp (Professional) và Hiện đại (Modern)**.

### 💡 Nguyên tắc cốt lõi
1.  **UX-First (Ưu tiên trải nghiệm):** Mọi tính năng phải dễ dùng, trực quan và giảm thiểu số lần click.
2.  **Smoothness (Sự mượt mà):** Sử dụng các hiệu ứng chuyển cảnh và tương tác nhỏ (micro-interactions) để tạo cảm giác cao cấp.
3.  **Data-Driven (Dựa trên dữ liệu):** Dashboard Admin phải cung cấp cái nhìn sâu sắc, không chỉ là con số thô.
4.  **Consistency (Sự đồng nhất):** Thống nhất từ màu sắc, font chữ đến khoảng cách (spacing) trên toàn hệ thống.

---

## 2. Hệ Thống Nhận Diện Thị Giác (Visual Identity)

### 🎨 Bảng màu (Color Palette)
*   **Primary (Chủ đạo):** `Indigo-600 (#4f46e5)` - Đại diện cho sự tin cậy và chuyên nghiệp.
*   **Secondary/Accent (Điểm nhấn):** `Amber-500 (#f59e0b)` - Tạo năng lượng, sự bùng nổ và nổi bật cho các nút hành động (CTA).
*   **Background (Nền):** `Slate-50 (#f8fafc)` cho giao diện sáng và `Slate-900` cho các thành phần cần sự tập trung cao (Sidebar).
*   **Success/Error:** Sử dụng màu Pastel (Xanh lá nhạt/Đỏ nhạt) để thân thiện với mắt người dùng.

### 🖋 Typography (Phông chữ)
*   **Headings:** `Outfit` (Google Fonts) - Mang nét hiện đại, hình khối, rất hợp với mảng thể thao.
*   **Body:** `Inter` - Font chữ tiêu chuẩn cho các ứng dụng Web, đảm bảo độ đọc tốt nhất ở mọi kích thước.

### 📐 Hình khối & Hiệu ứng (Styling)
*   **Border Radius:** `rounded-2xl` (16px) cho Cards và Modals; `rounded-full` cho Buttons.
*   **Shadow:** Sử dụng `Soft Shadows` (Shadow-xl với độ nhòe lớn) thay vì đường viền cứng.
*   **Glassmorphism:** Áp dụng hiệu ứng `backdrop-blur-md` cho Navbar và Sidebar để tạo chiều sâu.

---

## 3. Chiến Lược UX & Tương Tác Mượt Mà

### ✨ Hiệu ứng chuyển động (Animations)
*   **Page Transitions:** Sử dụng `framer-motion` để nội dung trượt nhẹ từ dưới lên khi tải trang.
*   **Skeleton Loading:** Hiển thị khung xương nội dung trong lúc chờ API, loại bỏ cảm giác chờ đợi mệt mỏi.
*   **Micro-interactions:**
    *   Nút bấm co giãn nhẹ (Scale 0.95) khi click.
    *   Hành động kéo thả (Drag & Drop) mượt mà trong quản lý ảnh sản phẩm.
    *   Tooltip hiển thị thông tin bổ sung khi hover vào các icon số liệu.

### 📱 Trải nghiệm người dùng (Usability)
*   **Quy tắc 3 lần click:** Admin tiếp cận mọi chức năng chính trong < 3 clicks.
*   **Search toàn năng:** Thanh tìm kiếm tích hợp AI (Vector Search) giúp tìm sản phẩm chính xác kể cả khi gõ không dấu hoặc gõ sai.
*   **Responsive:** Giao diện co giãn hoàn hảo từ màn hình Ultra-wide đến điện thoại di động.
http://localhost:3001/
---

## 4. Thiết Kế Chi Tiết Hệ Thống Admin (The New Dashboard)

### 📊 Dashboard Tổng Quan
*   **Khu vực 1 (Top Stats):** 4 thẻ chỉ số có biểu đồ mini (sparklines) đi kèm để thấy ngay xu hướng tăng/giảm.
*   **Khu vực 2 (Main Charts):** Doanh thu theo thời gian thực (Area Chart) và Tỷ trọng môn thể thao bán chạy (Donut Chart).
*   **Khu vực 3 (Urgent Actions):** Danh sách "Đơn hàng cần đóng gói ngay" và "Cảnh báo kho hàng sắp hết".

### 📦 Quản Lý Sản Phẩm
*   **Smart Table:** Cho phép chỉnh sửa nhanh giá và tồn kho ngay tại bảng (Inline Editing).
*   **Product Builder:** Quy trình thêm sản phẩm chia theo bước (Step-by-step) hoặc chia theo khối thông tin trực quan.
*   **Media Center:** Quản lý ảnh sản phẩm tập trung, hỗ trợ tự động tối ưu hóa kích thước ảnh.

---

## 5. Thiết Kế Chi Tiết Frontend (The User Interface)

Dựa trên cảm hứng từ Figma, trang người dùng sẽ tập trung vào sự **"Nhập vai" (Immersive)**:
*   **Hero Section:** Video hoặc hình ảnh chất lượng cao về vận động viên sử dụng sản phẩm S-Mart.
*   **Product Discovery:** Bộ lọc thông minh theo Môn thể thao (Football, Gym, Yoga, Running) được ưu tiên hàng đầu.
*   **Seamless Checkout:** Quy trình thanh toán tối giản, tích hợp VNPay giúp hoàn tất đơn hàng trong 30 giây.

---

## 6. Lộ Trình Triển Khai (Roadmap)

1.  **Giai đoạn 1: Nền tảng (Layout & Theme)**
    *   Thiết lập Tailwind v4 configurations.
    *   Xây dựng `AdminLayout` và `MainLayout` mới với hiệu ứng Glassmorphism.
2.  **Giai đoạn 2: Lột xác Admin Dashboard**
    *   Cập nhật `AdminDashboard.jsx` với các thành phần biểu đồ và stats mới.
    *   Tích hợp Framer Motion cho các tương tác.
3.  **Giai đoạn 3: Hệ thống Quản lý Sản phẩm & Đơn hàng**
    *   Xây dựng Form thêm sản phẩm đa bước.
    *   Nâng cấp bảng danh sách sản phẩm thông minh.
4.  **Giai đoạn 4: Frontend Revamp**
    *   Thiết kế lại Trang chủ và Trang Danh sách sản phẩm theo phong cách Figma Sports.
5.  **Giai đoạn 5: Tối ưu & Đóng gói**
    *   Kiểm tra hiệu năng, tối ưu hóa SEO và hoàn thiện các Micro-interactions.

---
*Tài liệu này là Single Source of Truth cho quá trình phát triển S-Mart.*
