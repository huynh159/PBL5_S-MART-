package com.example.demo.service;

import com.example.demo.dto.OrderRequest;
import com.example.demo.entity.*;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final CouponService couponService;
    private final ProductRepository productRepository;
    private final NotificationService notificationService;

    @Transactional
    public Order createOrder(String email, OrderRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        double total = 0;
        List<CartItem> cartItemsToCheckout = new java.util.ArrayList<>();
        List<OrderItem> preparedOrderItems = new java.util.ArrayList<>();

        // Case 1: Checkout via Cart
        if (request.getCartItemIds() != null && !request.getCartItemIds().isEmpty()) {
            List<CartItem> allCartItems = cartItemRepository.findByUserId(user.getId());
            cartItemsToCheckout = allCartItems.stream()
                    .filter(item -> request.getCartItemIds().contains(item.getId()))
                    .collect(java.util.stream.Collectors.toList());
            if (cartItemsToCheckout.isEmpty()) {
                 throw new RuntimeException("No valid cart items selected");
            }
            for (CartItem item : cartItemsToCheckout) {
                total += item.getPrice() != null ? item.getPrice() * item.getQuantity() : item.getProduct().getPrice() * item.getQuantity();

                Product product = item.getProduct();
                if (product.getStock() < item.getQuantity()) {
                    throw new RuntimeException("Not enough stock for product: " + product.getName());
                }
                product.setStock(product.getStock() - item.getQuantity());
                productRepository.save(product);

                OrderItem orderItem = OrderItem.builder()
                        .product(item.getProduct())
                        .quantity(item.getQuantity())
                        .color(item.getColor())
                        .size(item.getSize())
                        .price(item.getPrice() != null ? item.getPrice() : product.getPrice())
                        .build();
                preparedOrderItems.add(orderItem);
            }
        } 
        // Case 2: Checkout Direct (Buy Now)
        else if (request.getDirectItems() != null && !request.getDirectItems().isEmpty()) {
            for (com.example.demo.dto.DirectOrderItem directReq : request.getDirectItems()) {
                Product product = productRepository.findById(directReq.getProductId())
                      .orElseThrow(() -> new RuntimeException("Product not found"));

                double currentPrice = directReq.getPrice() != null ? directReq.getPrice() : product.getPrice();
                total += currentPrice * directReq.getQuantity();

                if (product.getStock() < directReq.getQuantity()) {
                    throw new RuntimeException("Not enough stock for product: " + product.getName());
                }
                product.setStock(product.getStock() - directReq.getQuantity());
                productRepository.save(product);

                OrderItem orderItem = OrderItem.builder()
                        .product(product)
                        .quantity(directReq.getQuantity())
                        .color(directReq.getColor())
                        .size(directReq.getSize())
                        .price(currentPrice)
                        .build();
                preparedOrderItems.add(orderItem);
            }
        } else {
            throw new RuntimeException("No items to checkout");
        }

        Coupon coupon = null;
        if (request.getCouponCode() != null && !request.getCouponCode().isEmpty()) {
            coupon = couponService.applyCoupon(request.getCouponCode());
            total = total - (total * coupon.getDiscountPercent() / 100.0);
        }

        Order order = Order.builder()
                .user(user)
                .total(total)
                .status("PENDING")
                .paymentMethod(request.getPaymentMethod())
                .address(request.getAddress())
                .phone(request.getPhone())
                .note(request.getNote())
                .coupon(coupon)
                .build();

        Order savedOrder = orderRepository.save(order);

        for (OrderItem oi : preparedOrderItems) {
            oi.setOrder(savedOrder);
            orderItemRepository.save(oi);
        }

        if (!cartItemsToCheckout.isEmpty()) {
            cartItemRepository.deleteAll(cartItemsToCheckout);
        }

        // Gửi thông báo đến Admin
        notificationService.notifyAdmins("Có đơn hàng mới #" + savedOrder.getId() + " vừa được tạo bởi " + user.getEmail() + " với tổng tiền: " + total + " VND.", "/admin/orders");

        return savedOrder;
    }

    public List<Order> getOrderHistory(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return orderRepository.findByUserId(user.getId());
    }

    public Order getOrderDetails(String email, Integer orderId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        if (!order.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        return order;
    }

    // For Admin
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    private String getStatusMessage(String status) {
        if (status == null) return "được cập nhật trạng thái mới";
        switch (status.toUpperCase()) {
            case "PENDING": return "đang chờ xác nhận";
            case "PAID": return "đã thanh toán thành công";
            case "PROCESSING": return "đang được chuẩn bị";
            case "SHIPPED": return "đang được giao";
            case "DELIVERED": return "đã giao hàng thành công";
            case "COMPLETED": return "đã hoàn thành";
            case "CANCELLED": return "đã bị hủy";
            case "FAILED": return "thanh toán thất bại";
            default: return "được cập nhật thành: " + status;
        }
    }

    @Transactional
    public Order updateOrderStatus(Integer orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setStatus(status);
        order = orderRepository.save(order);

        // Thông báo realtime cho user khi admin cập nhật đơn
        String message = "Đơn hàng #" + order.getId() + " của bạn " + getStatusMessage(status);
        notificationService.notifyUser(order.getUser(), message, "/orders/" + order.getId());

        return order;
    }

    @Transactional
    public Order cancelOrder(String email, Integer orderId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        // Chỉ cho phép huỷ khi CHỜ XÁC NHẬN (PENDING/PAID) hoặc ĐANG CHUẨN BỊ (PROCESSING)
        if (!"PENDING".equals(order.getStatus()) && !"PROCESSING".equals(order.getStatus()) && !"PAID".equals(order.getStatus())) {
            throw new RuntimeException("Không thể huỷ đơn hàng ở trạng thái hiện tại");
        }

        order.setStatus("CANCELLED");
        order = orderRepository.save(order);

        // Thông báo ngược lại cho admin biết user vừa huỷ đơn
        notificationService.notifyAdmins("Đơn hàng #" + order.getId() + " vừa bị huỷ bởi người dùng!", "/admin/orders");

        return order;
    }
}
