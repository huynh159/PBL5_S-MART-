package com.example.demo.controller;

import com.example.demo.entity.Order;
import com.example.demo.service.OrderService;
import com.example.demo.service.VNPayService;
import com.example.demo.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.servlet.view.RedirectView;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PaymentController {
    private final VNPayService vnPayService;
    private final OrderService orderService;
    private final NotificationService notificationService;

    @PostMapping("/vnpay/create-payment")
    public ResponseEntity<Map<String, String>> createPayment(Authentication authentication, @RequestParam Integer orderId, HttpServletRequest request) {
        String email = authentication.getName();
        Order order = orderService.getOrderDetails(email, orderId);

        String orderInfo = "Thanh toan don hang " + orderId;
        String returnUrlParams = "?orderId=" + orderId; // appending to callback url

        // Total needs to be int for VNPay amount
        int total = order.getTotal().intValue();
        String paymentUrl = vnPayService.createPaymentUrl(request, total, orderInfo, returnUrlParams);

        Map<String, String> response = new HashMap<>();
        response.put("paymentUrl", paymentUrl);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/vnpay-callback")
    public RedirectView paymentCallback(HttpServletRequest request, @RequestParam Integer orderId) {
        int paymentStatus = vnPayService.orderReturn(request);

        if (paymentStatus == 1) {
            orderService.updateOrderStatus(orderId, "PAID");
            notificationService.notifyAdmins("Thanh toán thành công qua VNPay cho đơn hàng #" + orderId + "!");
            return new RedirectView("http://localhost:3001/payment-status?vnp_ResponseCode=00");
        } else {
            orderService.updateOrderStatus(orderId, "FAILED");
            notificationService.notifyAdmins("Thanh toán thất bại qua VNPay cho đơn hàng #" + orderId + ".");
            return new RedirectView("http://localhost:3001/payment-status?vnp_ResponseCode=99");
        }
    }
}
