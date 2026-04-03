package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OrderRequest {
    private String paymentMethod; // "COD", "VNPAY"
    private String couponCode;
    private List<Integer> cartItemIds;
    private List<DirectOrderItem> directItems; // Used for "Buy Now" direct purchase
    private String address;
    private String phone;
    private String note;
}
